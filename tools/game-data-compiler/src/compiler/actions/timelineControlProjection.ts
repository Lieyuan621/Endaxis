import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import type { ActionGraphReference } from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import type { NativeSequenceSource } from '../../source/controlFlow.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { FinishOwnerActionSource } from '../../source/lifecycleActions.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';

/** 原生 JumpTo 在 Execute/Tick 重试条件；不能投影成只执行一次的普通条件分支。 */
export function projectTimelineJump(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
  compileCondition: (
    sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  ) => ActionGraphReference,
): CompiledBuffStepSource | null {
  if (node.body.kind !== 'timelineJump') return null;
  const { destinationFrame, condition } = node.body;
  // 方向由执行时的 Skill.JumpTo 判断：过去的目标帧会被忽略，并非非法数据。
  // 事件回调可能在登记区间内任何时刻发生，不能用区间端点替代当前技能进度。
  if (!context.timelineRange || !Number.isInteger(destinationFrame))
    throw new Error(`${node.sourcePath}: timeline jump requires a timeline host and integer frame`);
  return {
    kind: 'jumpTimeline',
    parameters: { destinationFrame },
    condition: compileCondition(condition),
  };
}

/** FinishOwner 保留目标查询；对象类型分流由现有实体生命周期负责。 */
export function projectFinishOwner(
  action: FinishOwnerActionSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): CompiledBuffStepSource {
  return {
    kind: 'finishOwner',
    parameters: {
      targets: projectActionTargetQuery(action.owner, context, `${sourcePath}.owner`),
    },
  };
}
