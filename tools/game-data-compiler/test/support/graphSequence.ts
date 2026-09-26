/** 测试侧共享：把图构建器的产物编译成可执行入口；不展开、不还原树。 */
import { createActionGraphCompilation } from '../../../../src/core/compiler/compileActionGraph.ts';
import type { CompiledGraphEntry } from '../../../../src/core/compiler/combatProgram.ts';
import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';

export function compileGraphSequence(
  entry: ActionGraphReference,
  graph: ActionGraphDefinition | ActionGraphResourceDefinition,
  skillLevel = 1,
  revision = 'test-support',
): CompiledGraphEntry {
  const compilation = createActionGraphCompilation(graph, skillLevel, revision);
  const compiled = compilation.compileEntry(entry, revision);
  compilation.compileAll();
  return compiled;
}

/** 把同层动作数组串成新链并编译；只处理平铺动作，控制分支必须已是图引用。 */
export function compileFlatSteps<Action extends ActionGraphStep>(
  steps: readonly Action[],
  base?: ActionGraphDefinition,
  revision = 'test-support-flat',
): CompiledGraphEntry {
  const nodes: Record<string, ActionGraphDefinition['nodes'][string]> = { ...base?.nodes };
  let prefix = 'test-step-';
  while (steps.some((_, index) => `${prefix}${index}` in nodes)) prefix = `_${prefix}`;
  steps.forEach((action, index) => {
    nodes[`${prefix}${index}`] = {
      action,
      next: index + 1 < steps.length ? `${prefix}${index + 1}` : null,
    };
  });
  return compileGraphSequence(
    { $sequence: steps.length === 0 ? null : `${prefix}0` },
    { nodes },
    1,
    revision,
  );
}
