import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from './combatActionProjectionTypes.ts';
import type { ActionGraphReference } from '../../../../../packages/game-data-contract/src/actionGraph.ts';

/** Independent native sequences share their host board, but not failure propagation. */
export function mergeIndependentActionSequencesSource(
  sequences: readonly CompiledBuffSequenceSource[],
  scopePrefix: string,
  build: (actions: readonly CompiledBuffStepSource[]) => ActionGraphReference,
): CompiledBuffSequenceSource {
  if (sequences.length <= 1) return sequences[0] ?? { $sequence: null };
  return build(
    sequences.map((body, index) => ({
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: `${scopePrefix}:${index}`,
        lifetime: 'execution',
        alwaysNext: true,
        shareParentBlackboard: true,
        initialValues: {},
        inheritParent: true,
      },
      body,
    })),
  );
}
