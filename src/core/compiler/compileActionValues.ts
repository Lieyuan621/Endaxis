/** 动作、Buff 与技能宿主共用的等级数值解析。 */
import type {
  LevelValues,
  ActionValueOperand,
  StatusModifierDefinition,
} from '../game-data/operatorDefinition';
import type { ResolvedStatusModifier } from './combatProgram';
export function resolveLevelValue(value: LevelValues, skillLevel: number, path: string): number {
  if (skillLevel === 0 && typeof value !== 'number') {
    throw new TypeError(`${path} must not depend on a skill level inside an operator Buff`);
  }
  const resolved = typeof value === 'number' ? value : value[skillLevel - 1];
  if (resolved === undefined) {
    throw new RangeError(`${path} has no value for skill level ${skillLevel}`);
  }
  if (!Number.isFinite(resolved)) throw new TypeError(`${path} must resolve to a finite number`);
  return resolved;
}

export function resolveLevelValueOrActionOperand(
  value: LevelValues | ActionValueOperand,
  skillLevel: number,
  path: string,
): number | ActionValueOperand {
  if (typeof value === 'object' && 'kind' in value) return value;
  return resolveLevelValue(value as LevelValues, skillLevel, path);
}

export function resolveStatusModifier(
  modifier: StatusModifierDefinition,
  skillLevel: number,
  path: string,
): ResolvedStatusModifier {
  switch (modifier.kind) {
    case 'attackPercent':
      return {
        kind: modifier.kind,
        value: resolveLevelValue(modifier.value, skillLevel, `${path}.value`),
      };
    case 'susceptibility':
      return {
        kind: modifier.kind,
        damageTypes: modifier.damageTypes,
        value: resolveLevelValue(modifier.value, skillLevel, `${path}.value`),
        ...(modifier.attributeScaling === undefined
          ? {}
          : {
              attributeScaling: {
                attribute: modifier.attributeScaling.attribute,
                coefficient: resolveLevelValue(
                  modifier.attributeScaling.coefficient,
                  skillLevel,
                  `${path}.attributeScaling.coefficient`,
                ),
              },
            }),
        ...(modifier.cap === undefined
          ? {}
          : { cap: resolveLevelValue(modifier.cap, skillLevel, `${path}.cap`) }),
      };
    case 'slowed':
    case 'blockResourceGain':
    case 'resourceCostMultiplier':
    case 'skillCooldownMultiplier':
      return modifier;
  }
}

/** 黑板作用域的等级参数解析；图与旧来源共用，不创建子程序。 */
export function compileActionScopeParameters<Key extends string | undefined>(
  parameters: Omit<
    import('../game-data/operatorDefinition').CombatStepParameters['withActionBlackboardScope'],
    'scopeKey'
  > & { readonly scopeKey: Key },
  skillLevel: number,
  path: string,
): Omit<
  import('./combatProgram').ResolvedCombatStepForKind<'withActionBlackboardScope'>['parameters'],
  'scopeKey'
> & { readonly scopeKey: Key } {
  if (parameters.shareParentBlackboard === true) {
    if (
      Object.keys(parameters.initialValues).length !== 0 ||
      parameters.inheritParent !== true ||
      parameters.entityInitialValues !== undefined ||
      parameters.entityAssignments !== undefined
    ) {
      throw new Error(
        `${path}: shareParentBlackboard requires empty initialValues, inheritParent=true, and no entity blackboard configuration`,
      );
    }
  }
  return {
    scopeKey: parameters.scopeKey,
    ...(parameters.lifetime === undefined ? {} : { lifetime: parameters.lifetime }),
    ...(parameters.alwaysNext === undefined ? {} : { alwaysNext: parameters.alwaysNext }),
    ...(parameters.shareParentBlackboard === undefined
      ? {}
      : { shareParentBlackboard: parameters.shareParentBlackboard }),
    inheritParent: parameters.inheritParent,
    initialValues: Object.fromEntries(
      Object.entries(parameters.initialValues).map(([key, value]) => [
        key,
        resolveLevelValue(value, skillLevel, `${path}.parameters.initialValues.${key}`),
      ]),
    ),
    ...(parameters.entityInitialValues === undefined
      ? {}
      : {
          entityInitialValues: Object.fromEntries(
            Object.entries(parameters.entityInitialValues).map(([key, value]) => [
              key,
              resolveLevelValue(value, skillLevel, `${path}.parameters.entityInitialValues.${key}`),
            ]),
          ),
        }),
    ...(parameters.entityAssignments === undefined
      ? {}
      : { entityAssignments: parameters.entityAssignments }),
  };
}
