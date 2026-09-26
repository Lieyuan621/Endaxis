import { expect } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { readActionGraphChain } from '../../src/compiler/actions/actionGraphBuilder.ts';

/** 只读取指定入口的同层节点；分支仍是图引用，不展开成树。缺失入口不是空入口。 */
export function readGraphActions(
  graph: ActionGraphDefinition,
  reference: ActionGraphReference | null | undefined,
) {
  if (reference == null) throw new Error('missing action graph reference');
  return readActionGraphChain(graph, reference);
}

export function readResourceActions(
  resource: { readonly actionGraph?: ActionGraphResourceDefinition } | undefined,
  reference: ActionGraphReference | null | undefined,
) {
  if (!resource?.actionGraph) throw new Error('missing resource action graph');
  return readGraphActions(resource.actionGraph.main, reference);
}

/** 在所属图中校验一个分支引用。预期是同层动作数组，嵌套分支应显式另写此匹配器。 */
export function graphBranch(
  graph: ActionGraphDefinition,
  actions: readonly unknown[],
  partial = false,
) {
  return {
    asymmetricMatch(value: unknown): boolean {
      if (!value || typeof value !== 'object' || !('$sequence' in value)) return false;
      if (value.$sequence !== null && typeof value.$sequence !== 'string') return false;
      const actual = readGraphActions(graph, { $sequence: value.$sequence });
      try {
        if (partial) expect(actual).toMatchObject(actions);
        else expect(actual).toEqual(actions);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AssertionError') return false;
        throw error;
      }
    },
    toString: () => 'GraphBranch',
  };
}
