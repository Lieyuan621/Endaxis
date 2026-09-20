import type { KeywordBuffActionSource } from '../../source/keywordActions.ts';
import type { CompiledBuffStepSource } from '../actions/combatActionProjectionTypes.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import type { ScalarSource } from '../../source/scalar.ts';
import type { ProjectedTargetGroup } from '../combatProjectionCommon.ts';

/** 关键词载体复用普通 Buff；增强规则只安装到本次动作创建的载体实例。 */
export function projectKeywordBuffAction(
  action: KeywordBuffActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
): CompiledBuffStepSource {
  // 关键词增强在普通 Buff 成功加入边沿按列表顺序持久改写 rate。
  if (
    action.overrideChildBuffId &&
    (action.childBuffId.blackboardKey !== null || action.childBuffId.value.trim().length === 0)
  )
    throw new Error(`${path}: dynamic or empty keyword child override is not supported`);
  const sourceIsCaster =
    (action.source.targetSource === 'Source' &&
      (context.actionSourceTarget === 'caster' ||
        (context.actionSourceTarget === 'buffSource' &&
          context.fixedBuffSourceTarget === 'caster'))) ||
    (action.source.targetSource === 'Owner' &&
      (context.actionOwnerTarget === 'caster' ||
        (context.actionOwnerTarget === 'buffOwner' && context.fixedBuffOwnerTarget === 'caster')));
  const resolveTarget = (identity: string): 'caster' | 'enemy' | 'buffOwner' | null =>
    identity === 'caster' || identity === 'enemy'
      ? identity
      : identity === 'buffOwner'
        ? context.fixedBuffOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'enemy'
          ? context.fixedBuffOwnerTarget
          : 'buffOwner'
        : null;
  const target =
    action.target.targetSource === 'Owner'
      ? resolveTarget(context.actionOwnerTarget)
      : action.target.targetSource === 'Source'
        ? resolveTarget(
            context.actionSourceTarget === 'buffSource'
              ? (context.fixedBuffSourceTarget ?? 'buffSource')
              : context.actionSourceTarget,
          )
        : action.target.targetSource === 'Target'
          ? resolveTarget(context.actionTargetTarget)
          : action.target.targetSource === 'Context' && action.target.targetGroupKey !== ''
            ? resolveTarget(
                partyTargetGroups.get(action.target.targetGroupKey) ??
                  (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true
                    ? 'enemy'
                    : ''),
              )
            : null;
  if (!sourceIsCaster || target === null)
    throw new Error(`${path}: unsupported keyword Buff source/target environment`);
  const operand = (scalar: ScalarSource) =>
    scalar.blackboardKey !== null
      ? { kind: 'blackboard' as const, key: scalar.blackboardKey }
      : { kind: 'constant' as const, value: scalar.value };
  return {
    kind: 'applyBuff',
    parameters: {
      buffId: action.carrierBuffId,
      target,
      inheritSourceSkillCastInfo: true,
      ...(action.asChildBuff ? { asChildBuff: true } : {}),
      ...(action.autoFinishByAction ? { finishByAction: true } : {}),
      blackboardAssignments: { duration: operand(action.duration), rate: operand(action.rate) },
      ...(action.enhancements.length === 0
        ? {}
        : {
            keywordEnhancements: action.enhancements.map(enhancement => ({
              triggerBuffIds: enhancement.buffIds,
              operation: enhancement.operation.toLowerCase() as 'assign' | 'add' | 'multiply',
              value: operand(enhancement.value),
            })),
          }),
      ...(action.overrideChildBuffId
        ? { stringBlackboardAssignments: { child_buff_id: action.childBuffId.value } }
        : {}),
    },
  };
}
