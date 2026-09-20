import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectElementalInflictionChangePoints } from './elementalInflictionChangePoints';

function inflictionReceipt(
  sequence: number,
  overrides: Partial<CombatReceiptEntry> = {},
): CombatReceiptEntry {
  return {
    sequence,
    frame: 12,
    time: 0.4,
    event: 'ElementalInflictionApplied',
    sourceId: 'perlica',
    targetId: 'enemy',
    data: {
      skillId: 'battleSkill',
      requestedElement: 'electric',
      isExtra: false,
      previousElement: null,
      previousLayers: 0,
      currentElement: 'electric',
      currentLayers: 1,
      outcomeKind: 'attachmentOnly',
      operationKinds: 'addAttachment',
    },
    ...overrides,
  };
}

describe('projectElementalInflictionChangePoints', () => {
  it('保留首次附着申请及其前后状态', () => {
    expect(projectElementalInflictionChangePoints([inflictionReceipt(3)])).toEqual([
      {
        sequence: 3,
        frame: 12,
        time: 0.4,
        sourceId: 'perlica',
        targetId: 'enemy',
        skillId: 'battleSkill',
        requestedElement: 'electric',
        isExtra: false,
        previousElement: null,
        previousLayers: 0,
        currentElement: 'electric',
        currentLayers: 1,
        outcomeKind: 'attachmentOnly',
        operationKinds: 'addAttachment',
      },
    ]);
  });

  it('保留爆发和复合状态分支，不在投影层推导反应', () => {
    const burst = inflictionReceipt(4, {
      data: {
        ...inflictionReceipt(4).data,
        requestedElement: 'heat',
        previousElement: 'heat',
        previousLayers: 2,
        currentElement: 'heat',
        currentLayers: 3,
        outcomeKind: 'burst',
        operationKinds: 'triggerBurst,addAttachment',
      },
    });
    const compound = inflictionReceipt(5, {
      data: {
        ...inflictionReceipt(5).data,
        requestedElement: 'nature',
        previousElement: 'cryo',
        previousLayers: 3,
        currentElement: null,
        currentLayers: 0,
        outcomeKind: 'compoundStatus',
        consumedElement: 'cryo',
        consumedLayers: 3,
        operationKinds: 'consumeAttachment,createCompoundStatus',
      },
    });

    expect(projectElementalInflictionChangePoints([burst, compound])).toMatchObject([
      { sequence: 4, outcomeKind: 'burst', currentElement: 'heat', currentLayers: 3 },
      {
        sequence: 5,
        outcomeKind: 'compoundStatus',
        consumedElement: 'cryo',
        consumedLayers: 3,
        currentElement: null,
      },
    ]);
  });

  it('保留同帧多次附着结算的回执顺序', () => {
    const points = projectElementalInflictionChangePoints([
      inflictionReceipt(8),
      inflictionReceipt(9),
    ]);

    expect(points.map(point => point.sequence)).toEqual([8, 9]);
  });

  it('忽略非附着结算回执', () => {
    expect(
      projectElementalInflictionChangePoints([
        { sequence: 10, frame: 12, time: 0.4, event: 'DamageApplied' },
      ]),
    ).toEqual([]);
  });

  it('拒绝缺少或自相矛盾的状态字段', () => {
    expect(() =>
      projectElementalInflictionChangePoints([
        inflictionReceipt(11, { data: { ...inflictionReceipt(11).data, currentLayers: 0 } }),
      ]),
    ).toThrow("receipt 11 'ElementalInflictionApplied' has invalid currentLayers");

    expect(() =>
      projectElementalInflictionChangePoints([
        inflictionReceipt(12, {
          data: {
            ...inflictionReceipt(12).data,
            outcomeKind: 'compoundStatus',
            previousElement: 'cryo',
            previousLayers: 2,
            currentElement: null,
            currentLayers: 0,
          },
        }),
      ]),
    ).toThrow("receipt 12 'ElementalInflictionApplied' has invalid consumedElement");
  });
});
