import type { ActionGraphReference, CombatCondition } from '../intermediateDefinitions.ts';
import type { ActionGraphBuilder } from './actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';
import { analyzeConditionUsage } from '../optimization/definitionUsageAnalysis.ts';

/** 单个纯判断直接成为输入；多步、写入和随机求值保留原生调用与短路边界。 */
export function projectConditionInput(
  reference: ActionGraphReference,
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
): CombatCondition {
  const steps = graph.actions(reference);
  const single = steps.length === 1 ? steps[0] : undefined;
  if (single?.kind === 'checkCondition') {
    const condition = single.parameters.condition;
    const usage = analyzeConditionUsage(condition);
    if (!usage.observable && !usage.unknownAccess && usage.writes.size === 0) return condition;
  }
  return { kind: 'checkActionResult', action: reference };
}
