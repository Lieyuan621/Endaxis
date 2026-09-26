/** 宿主元数据与程序入口分开编译；所有图宿主共用等级、Buff、实体及调度规则。 */
import type {
  SkillBuffDefinition,
  AbilityEntityDefinition,
  AbilityEntityChildSkillDefinition,
  SkillActionProgramDefinition,
} from '../game-data/operatorDefinition';
import type {
  ResolvedSkillBuffDefinition,
  ResolvedAbilityEntityDefinition,
  CompiledAbilityEntityChildSkillProgram,
  CompiledTimelineAction,
} from './combatProgram';
import { resolveLevelValue } from './compileActionValues';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { CompiledGraphEntry } from './combatProgram';

/** 为独立资源取得入口编译器，调用方负责缓存；不能用父图解释子资源节点。 */
export type BindProgramResource = (
  graph: ActionGraphResourceDefinition,
  path: string,
) => (source: ActionGraphReference, path: string) => CompiledGraphEntry;

export function createProgramDefinitionCompiler(
  skillLevel: number,
  compileEntry: (source: ActionGraphReference, path: string) => CompiledGraphEntry,
  bindResource: BindProgramResource = (_graph, path) => {
    throw new Error(`${path}: independent resource compiler is required`);
  },
) {
  function resolveSkillBuffDefinition(
    definition: SkillBuffDefinition,
    path: string,
  ): ResolvedSkillBuffDefinition {
    const compileBuffEntry =
      definition.actionGraph === undefined
        ? compileEntry
        : bindResource(definition.actionGraph, path);
    const {
      actionGraph: _actionGraph,
      scheduledSequences,
      lifecycleSequences,
      abilityEventResponses,
      igniteEventResponses,
      damageModifiers,
      ...fields
    } = definition;
    return {
      ...fields,
      ...(damageModifiers === undefined
        ? {}
        : {
            damageModifiers: damageModifiers.map((modifier, index) => {
              const { conditionProgram, ...fields } = modifier;
              if (conditionProgram !== undefined && modifier.condition !== undefined) {
                throw new Error(
                  `${path}.damageModifiers[${index}] cannot define both condition and conditionProgram`,
                );
              }
              return {
                ...fields,
                ...(conditionProgram === undefined
                  ? {}
                  : {
                      conditionProgram: compileBuffEntry(
                        conditionProgram,
                        `${path}.damageModifiers[${index}].conditionProgram`,
                      ),
                    }),
              };
            }),
          }),
      ...(scheduledSequences === undefined
        ? {}
        : {
            scheduledSequences: scheduledSequences.map((scheduled, index) => ({
              startFrame: scheduled.startFrame,
              ...(scheduled.endFrame === undefined ? {} : { endFrame: scheduled.endFrame }),
              sequence: compileBuffEntry(
                scheduled.sequence,
                `${path}.scheduledSequences[${index}].sequence`,
              ),
            })),
          }),
      ...(lifecycleSequences === undefined
        ? {}
        : {
            lifecycleSequences: Object.fromEntries(
              Object.entries(lifecycleSequences).map(([key, sequence]) => [
                key,
                compileBuffEntry(sequence, `${path}.lifecycleSequences.${key}`),
              ]),
            ),
          }),
      ...(abilityEventResponses === undefined
        ? {}
        : {
            abilityEventResponses: abilityEventResponses.map((response, index) => ({
              event: response.event,
              priority: response.priority,
              sequence: compileBuffEntry(
                response.sequence,
                `${path}.abilityEventResponses[${index}].sequence`,
              ),
            })),
          }),
      ...(igniteEventResponses === undefined
        ? {}
        : {
            igniteEventResponses: igniteEventResponses.map((response, index) => ({
              igniteType: response.igniteType,
              finishAfterIgnited: response.finishAfterIgnited,
              sequence: compileBuffEntry(
                response.sequence,
                `${path}.igniteEventResponses[${index}].sequence`,
              ),
            })),
          }),
    };
  }

  function compileAbilityEntityDefinition(
    definition: AbilityEntityDefinition,
    path: string,
  ): ResolvedAbilityEntityDefinition {
    return {
      ...(definition.bornTags === undefined ? {} : { bornTags: definition.bornTags }),
      ...(definition.blackboard === undefined ? {} : { blackboard: definition.blackboard }),
      lifetime: definition.lifetime,
      ...(definition.deathReleaseDelaySeconds === undefined
        ? {}
        : { deathReleaseDelaySeconds: definition.deathReleaseDelaySeconds }),
      ...(definition.maxStackingCount === undefined
        ? {}
        : { maxStackingCount: definition.maxStackingCount }),
      ...(definition.childSkill === undefined
        ? {}
        : {
            childSkill: compileAbilityEntityChildSkill(definition.childSkill, `${path}.childSkill`),
          }),
      ...(definition.childSkills === undefined
        ? {}
        : {
            childSkills: Object.fromEntries(
              Object.entries(definition.childSkills).map(([skillId, childSkill]) => [
                skillId,
                compileAbilityEntityChildSkill(
                  childSkill,
                  `${path}.childSkills.${JSON.stringify(skillId)}`,
                ),
              ]),
            ),
          }),
      ...(definition.passiveSkills === undefined
        ? {}
        : {
            passiveSkills: definition.passiveSkills.map((passive, index) => {
              const compilePassiveEntry = bindResource(
                passive.actionGraph,
                `${path}.passiveSkills[${index}]`,
              );
              return {
                key: passive.key,
                initialBlackboard: compileSkillBlackboard(
                  passive.blackboard,
                  `${path}.passiveSkills[${index}].blackboard`,
                ),
                enableSequence: compilePassiveEntry(
                  passive.enableSequence,
                  `${path}.passiveSkills[${index}].enableSequence`,
                ),
                ...(passive.abilityEventResponses === undefined
                  ? {}
                  : {
                      abilityEventResponses: passive.abilityEventResponses.map(
                        (response, responseIndex) => ({
                          ...response,
                          sequence: compilePassiveEntry(
                            response.sequence,
                            `${path}.passiveSkills[${index}].abilityEventResponses[${responseIndex}].sequence`,
                          ),
                        }),
                      ),
                    }),
              };
            }),
          }),
    };
  }

  function compileSkillBlackboard(
    blackboard: SkillActionProgramDefinition['blackboard'],
    path: string,
  ): Readonly<Record<string, number>> {
    return Object.fromEntries(
      Object.entries(blackboard ?? {}).map(([key, value]) => [
        key,
        resolveLevelValue(value, skillLevel, `${path}.${key}`),
      ]),
    );
  }

  function compileSkillTimelineActions(
    sequences: SkillActionProgramDefinition['scheduledSequences'],
    path: string,
  ): readonly CompiledTimelineAction[] {
    return sequences.map((scheduled, index) => ({
      startFrame: scheduled.startFrame,
      ...(scheduled.endFrame === undefined ? {} : { endFrame: scheduled.endFrame }),
      sequence: compileEntry(scheduled.sequence, `${path}[${index}].sequence`),
    }));
  }

  function compileAbilityEntityChildSkill(
    childSkill: AbilityEntityChildSkillDefinition,
    path: string,
  ): CompiledAbilityEntityChildSkillProgram {
    if (!Number.isInteger(childSkill.naturalDurationFrames) || childSkill.naturalDurationFrames < 1)
      throw new RangeError(`${path}.naturalDurationFrames must be a positive integer`);
    const compiler = createProgramDefinitionCompiler(
      skillLevel,
      bindResource(childSkill.actionGraph, path),
      bindResource,
    );
    return {
      skillId: childSkill.skillId,
      nativeSkillType: childSkill.nativeSkillType,
      naturalDurationFrames: childSkill.naturalDurationFrames,
      castResource: {
        ...childSkill.castResource,
        cost: {
          resource: childSkill.castResource.cost.resource,
          value: resolveLevelValue(
            childSkill.castResource.cost.value,
            skillLevel,
            `${path}.castResource.cost.value`,
          ),
          availabilityThreshold: resolveLevelValue(
            childSkill.castResource.cost.availabilityThreshold,
            skillLevel,
            `${path}.castResource.cost.availabilityThreshold`,
          ),
        },
      },
      initialBlackboard: compileSkillBlackboard(childSkill.blackboard, `${path}.blackboard`),
      timelineActions: compiler.timeline(
        childSkill.scheduledSequences,
        `${path}.scheduledSequences`,
      ),
    };
  }
  return {
    buff: resolveSkillBuffDefinition,
    entity: compileAbilityEntityDefinition,
    childSkill: compileAbilityEntityChildSkill,
    blackboard: compileSkillBlackboard,
    timeline: compileSkillTimelineActions,
  };
}
