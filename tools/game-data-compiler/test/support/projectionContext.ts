/** 投影上下文测试辅助：公共默认上下文不含可执行图，仅在调用编译入口时提供独立构建器。 */
import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../src/compiler/actions/combatActionProjectionTypes.ts';
import type { CombatActionProjectionContextSource } from '../../src/compiler/combatProjectionCommon.ts';

/** 每次调用返回新的图构建器，避免跨用例共享节点表污染断言。 */
export function withProjectionGraph(
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
): CombatActionProjectionContextSource {
  return { ...context, graph: createActionGraphBuilder<CompiledBuffStepSource>() };
}
