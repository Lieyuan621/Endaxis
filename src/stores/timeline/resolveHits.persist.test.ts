import { describe, expect, it } from 'vitest';
import { resolveHitsFromSheet } from './resolveHits';

describe('resolveHitsFromSheet persistence', () => {
  const rawAtLevel = (multiplier: number, stagger = 10) => [
    {
      hit: {
        offset: 0.5,
        stagger,
        effects: [{ kind: 'ultEnergyGain', value: 5 }],
      },
      element: 'heat',
      multiplier,
      multiplierMode: 'each' as const,
    },
  ];

  it('keeps user-edited fields while refreshing unmatched sheet values', () => {
    const first = resolveHitsFromSheet([], rawAtLevel(100) as any, 0, {
      preserveCondition: true,
    });
    const edited = [
      {
        ...first[0],
        stagger: 25,
        effects: [
          {
            kind: 'status',
            id: 'edited-buff',
            name: 'edited-buff',
            value: 12,
            duration: 4,
            _id: 'keep-me',
          },
        ],
      },
    ];

    const resolved = resolveHitsFromSheet(edited as any, rawAtLevel(140, 10) as any, 0, {
      preserveCondition: true,
    });

    expect(resolved[0]).toMatchObject({
      offset: 0.5,
      stagger: 25,
      element: 'heat',
      multiplier: 140,
    });
    expect(resolved[0]?.effects).toEqual([
      expect.objectContaining({
        kind: 'status',
        id: 'edited-buff',
        value: 12,
        _id: 'keep-me',
      }),
    ]);
  });

  it('updates leveled sheet fields when the user has not overridden them', () => {
    const first = resolveHitsFromSheet([], rawAtLevel(100) as any, 0, {
      preserveCondition: true,
    });
    const resolved = resolveHitsFromSheet(first as any, rawAtLevel(160, 12) as any, 0, {
      preserveCondition: true,
    });

    expect(resolved[0]).toMatchObject({
      stagger: 12,
      multiplier: 160,
    });
    expect(resolved[0]?.effects?.[0]).toMatchObject({ kind: 'ultEnergyGain', value: 5 });
  });

  it('keeps a user-edited multiplier instead of the leveled sheet value', () => {
    const first = resolveHitsFromSheet([], rawAtLevel(100) as any, 0, {
      preserveCondition: true,
    });
    const edited = [{ ...first[0], multiplier: 222 }];
    const resolved = resolveHitsFromSheet(edited as any, rawAtLevel(160) as any, 0, {
      preserveCondition: true,
    });

    expect(resolved[0]?.multiplier).toBe(222);
  });

  it('still hydrates from the sheet when there is no stored hit', () => {
    const resolved = resolveHitsFromSheet([], rawAtLevel(100) as any, 0, {
      preserveCondition: true,
    });
    expect(resolved[0]).toMatchObject({
      offset: 0.5,
      stagger: 10,
      element: 'heat',
      multiplier: 100,
    });
    expect(resolved[0]?.effects?.[0]).toMatchObject({ kind: 'ultEnergyGain', value: 5 });
    expect(resolved[0]).toHaveProperty('_sheetBaseline');
  });

  it('rematches Tangtang-like hits after offset sort (sheet group order ≠ time order)', () => {
    // Sheet extract order: damage hits first, then an earlier effect-only hit.
    const sheetEntries = [
      {
        hit: { offset: 0.917, stagger: 2 },
        element: 'cryo',
        multiplier: 180,
        multiplierMode: 'split' as const,
        hitFraction: 0.2,
      },
      {
        hit: { offset: 1.033, stagger: 2 },
        element: 'cryo',
        multiplier: 180,
        multiplierMode: 'split' as const,
        hitFraction: 0.2,
      },
      {
        hit: {
          offset: 0.817,
          effects: [{ id: 'waterspouts', kind: 'damageOverTime', element: 'cryo', value: 1 }],
        },
        element: 'cryo',
      },
    ];

    const fromSheet = resolveHitsFromSheet([], sheetEntries as any, 0, {
      preserveCondition: true,
    });
    expect(fromSheet).toHaveLength(3);
    expect(fromSheet[0]?.multiplier).toBeCloseTo(36, 5);
    expect(fromSheet[2]?.effects?.[0]).toMatchObject({ id: 'waterspouts' });
    expect(fromSheet[2]?.multiplier).toBeUndefined();

    // PropertiesPanel historically sorted by offset before refresh.
    const sortedForDisplay = [...fromSheet].sort(
      (a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0),
    );
    expect(sortedForDisplay[0]?.offset).toBeCloseTo(0.817, 5);
    expect(sortedForDisplay[0]?.effects?.[0]).toMatchObject({ id: 'waterspouts' });

    const refreshed = resolveHitsFromSheet(sortedForDisplay as any, sheetEntries as any, 0, {
      preserveCondition: true,
    });

    expect(refreshed).toHaveLength(3);
    expect(refreshed[0]).toMatchObject({
      offset: 0.917,
      stagger: 2,
    });
    expect(refreshed[0]?.multiplier).toBeCloseTo(36, 5);
    expect(refreshed[0]?.effects).toBeUndefined();
    expect(refreshed[2]).toMatchObject({ offset: 0.817 });
    expect(refreshed[2]?.effects?.[0]).toMatchObject({ id: 'waterspouts' });
    expect(refreshed[2]?.multiplier).toBeUndefined();
  });
});
