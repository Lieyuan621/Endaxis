import type { CompiledBuffSequenceSource } from './combatActionProjectionTypes.ts';

/** Independent native sequences share their host board, but not failure propagation. */
export function mergeIndependentActionSequencesSource(
  sequences: readonly CompiledBuffSequenceSource[],
  scopePrefix: string,
): CompiledBuffSequenceSource {
  if (sequences.length <= 1) return sequences[0] ?? { steps: [] };
  return {
    steps: sequences.map((body, index) => ({
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
  };
}
