import { describe, expect, it } from 'vitest';
import type { CompoundStatusFactoryEntry } from './compoundStatusFactories';
import { executeCompoundStatusFactory } from './compoundStatusFactory';

const FACTORY: CompoundStatusFactoryEntry = {
  id: 'factory.heat-electric',
  consumedElement: 'heat',
  incomingElement: 'electric',
  durationSeconds: 0.1,
  blackboard: { count: 0, atk_scale: 0, consumed_type: -1 },
  skillSettingLookups: [
    {
      dataKey: 'initialDamage',
      column: { blackboardKey: 'count' },
      enhanceAttributeSource: 'source',
      storeKey: 'atk_scale',
    },
  ],
  createdBuff: {
    buffId: 'status.electric-heat',
    blackboardAssignments: [
      { targetKey: 'atk_scale', inputKey: 'atk_scale' },
      { targetKey: 'consumed_type', inputKey: 'consumed_type' },
    ],
  },
};

describe('executeCompoundStatusFactory', () => {
  it('reads the one-based layer column and applies the recovered linear enhancement', () => {
    const result = executeCompoundStatusFactory(FACTORY, { count: 2, consumed_type: 0 }, 50, {
      getSetting: key =>
        key === 'initialDamage' ? { values: [1, 1.5, 2], enhanceFormulaKey: 'linear' } : undefined,
      getEnhanceFormula: key => (key === 'linear' ? { kind: 'linear', paramA: 0.01 } : undefined),
    });

    expect(result).toEqual({
      buffId: 'status.electric-heat',
      blackboardValues: {
        atk_scale: Math.fround(Math.fround(1.5) * Math.fround(1.5)),
        consumed_type: 0,
      },
    });
  });

  it('keeps the existing Blackboard value when a setting or column is unavailable', () => {
    const result = executeCompoundStatusFactory(FACTORY, { count: 9 }, 0, {
      getSetting: () => ({ values: [1], enhanceFormulaKey: '' }),
      getEnhanceFormula: () => undefined,
    });

    expect(result.blackboardValues.atk_scale).toBe(0);
  });

  it('uses midpoint-to-even when resolving the native float column', () => {
    const settings = {
      getSetting: () => ({ values: [10, 20, 30], enhanceFormulaKey: '' }),
      getEnhanceFormula: () => undefined,
    };

    expect(
      executeCompoundStatusFactory(FACTORY, { count: 1.5 }, 0, settings).blackboardValues.atk_scale,
    ).toBe(20);
    expect(
      executeCompoundStatusFactory(FACTORY, { count: 2.5 }, 0, settings).blackboardValues.atk_scale,
    ).toBe(20);
  });
});
