import { describe, expect, it } from 'vitest';
import { resolveElementalInfliction } from './elementalInfliction';

describe('resolveElementalInfliction', () => {
  it('adds the first attachment', () => {
    expect(resolveElementalInfliction('electric', null)).toEqual([
      { kind: 'addAttachment', element: 'electric' },
    ]);
  });

  it('triggers a burst before enhancing the same attachment', () => {
    expect(resolveElementalInfliction('heat', { element: 'heat', layers: 2 })).toEqual([
      { kind: 'triggerBurst', element: 'heat' },
      { kind: 'addAttachment', element: 'heat' },
    ]);
  });

  it('consumes a different attachment before creating the compound status', () => {
    expect(resolveElementalInfliction('nature', { element: 'cryo', layers: 3 })).toEqual([
      {
        kind: 'consumeAttachment',
        attachment: { element: 'cryo', layers: 3 },
      },
      {
        kind: 'createCompoundStatus',
        consumedElement: 'cryo',
        incomingElement: 'nature',
        consumedLayers: 3,
      },
    ]);
  });
});
