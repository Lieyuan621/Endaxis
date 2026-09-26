/** 携带内联宿主的动作编译；入口绑定由调用方提供，不依赖树编译器。 */
import type { CombatStepKind, LevelValues } from '../game-data/operatorDefinition';
import type { CombatStepForKind } from '../../../packages/game-data-contract/src/actions';
import type { ResolvedCombatStepForKind } from './combatProgram';
import type { CompiledGraphEntry } from './combatProgram';
import type { ActionGraphReference } from '../../../packages/game-data-contract/src/actionGraph';
import { resolveLevelValue } from './compileActionValues';
import {
  createProgramDefinitionCompiler,
  type BindProgramResource,
} from './compileProgramDefinitions';

export type NestedActionKind =
  | 'startCurrentAbilityEntityChildSkill'
  | 'launchProjectile'
  | 'spawnAbilityEntity'
  | 'applyBuff'
  | 'applyPhysicalInfliction';
export function isNestedAction<Step extends { kind: CombatStepKind }>(
  step: Step,
): step is Extract<Step, { kind: NestedActionKind }> {
  return (
    step.kind === 'startCurrentAbilityEntityChildSkill' ||
    step.kind === 'launchProjectile' ||
    step.kind === 'spawnAbilityEntity' ||
    step.kind === 'applyBuff' ||
    step.kind === 'applyPhysicalInfliction'
  );
}
export function compileNestedAction(
  step: CombatStepForKind<NestedActionKind>,
  skillLevel: number,
  path: string,
  compileEntry: (source: ActionGraphReference, path: string) => CompiledGraphEntry,
  resolveEntity: (id: string, path: string) => void,
  bindResource: BindProgramResource,
): ResolvedCombatStepForKind<NestedActionKind> {
  const definitions = createProgramDefinitionCompiler(skillLevel, compileEntry, bindResource);
  const keyed = step.key === undefined ? {} : { key: step.key };
  switch (step.kind) {
    case 'startCurrentAbilityEntityChildSkill':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          childSkill: definitions.childSkill(
            step.parameters.childSkill,
            `${path}.parameters.childSkill`,
          ),
        },
      };

    case 'launchProjectile': {
      const timing = step.parameters.finish;
      if (typeof timing === 'number') {
        if (!Number.isFinite(timing) || timing <= 0)
          throw new RangeError(`${path}: invalid projectile duration`);
      } else if (
        timing !== 'firstTickReach' &&
        timing !== 'firstTickBlock' &&
        (!Number.isSafeInteger(timing.reachAfterTicks) ||
          timing.reachAfterTicks < 1 ||
          !Number.isFinite(timing.maxDurationSeconds) ||
          timing.maxDurationSeconds <= 0)
      ) {
        throw new RangeError(`${path}: invalid projectile reach timing`);
      }
      const recycle = step.parameters.recycleDelaySeconds ?? 0;
      if (!Number.isFinite(recycle) || recycle < 0)
        throw new RangeError(`${path}: invalid projectile recycle delay`);
      return {
        ...keyed,
        ...step,
        callbacks: step.callbacks.map(({ event, skill }, index) => ({
          event,
          skill: definitions.childSkill(skill, `${path}.callbacks[${index}].skill`),
        })),
      };
    }
    case 'spawnAbilityEntity': {
      const { definition: inlineDefinition, ...parameters } = step.parameters;
      if (inlineDefinition === undefined) {
        resolveEntity(parameters.abilityEntityId, `${path}.parameters.abilityEntityId`);
        return { ...keyed, kind: step.kind, parameters };
      }
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          definition: definitions.entity(inlineDefinition, `${path}.parameters.definition`),
        },
      };
    }

    case 'applyBuff': {
      if ('definition' in step.parameters)
        throw new Error(`${path}: applyBuff must reference an owner Buff definition`);
      const { blackboardAssignments, ...parameters } = step.parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          ...(blackboardAssignments === undefined
            ? {}
            : {
                blackboardAssignments: Object.fromEntries(
                  Object.entries(blackboardAssignments).map(([key, value]) => [
                    key,
                    typeof value === 'object' && 'kind' in value
                      ? value
                      : {
                          kind: 'constant' as const,
                          value: resolveLevelValue(
                            value as LevelValues,
                            skillLevel,
                            `${path}.parameters.blackboardAssignments.${key}`,
                          ),
                        },
                  ]),
                ),
              }),
        },
      };
    }

    case 'applyPhysicalInfliction': {
      const { noGuardDefinition, ...parameters } = step.parameters;
      const resolvedNoGuard = definitions.buff(
        noGuardDefinition,
        `${path}.parameters.noGuardDefinition`,
      );
      if (parameters.type === 'crush') {
        const { crushedDefinition, ...crushParameters } = parameters;
        return {
          ...keyed,
          kind: step.kind,
          parameters: {
            ...crushParameters,
            noGuardDefinition: resolvedNoGuard,
            crushedDefinition: definitions.buff(
              crushedDefinition,
              `${path}.parameters.crushedDefinition`,
            ),
          },
        };
      }
      if (parameters.type === 'airborne') {
        const { airborneDefinition, ...airborneParameters } = parameters;
        return {
          ...keyed,
          kind: step.kind,
          parameters: {
            ...airborneParameters,
            noGuardDefinition: resolvedNoGuard,
            airborneDefinition: definitions.buff(
              airborneDefinition,
              `${path}.parameters.airborneDefinition`,
            ),
          },
        };
      }
      const { fractureDefinition, ...fractureParameters } = parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...fractureParameters,
          noGuardDefinition: resolvedNoGuard,
          fractureDefinition: definitions.buff(
            fractureDefinition,
            `${path}.parameters.fractureDefinition`,
          ),
        },
      };
    }
  }
}
