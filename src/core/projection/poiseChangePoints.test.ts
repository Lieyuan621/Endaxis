import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectPoiseChangePoints } from './poiseChangePoints';

function poiseReceipt(
  sequence: number,
  overrides: Partial<CombatReceiptEntry> = {},
): CombatReceiptEntry {
  return {
    sequence,
    frame: 15,
    time: 0.5,
    event: 'PoiseApplied',
    sourceId: 'perlica',
    targetId: 'enemy',
    data: {
      calculationValue: 20,
      calculatedDamage: 30,
      requestedDelta: -30,
      actualDelta: -20,
      previousPoise: 20,
      currentPoise: 0,
      cancelled: false,
      cancelledByImmunity: false,
      poiseImmune: false,
      ignorePoiseImmune: false,
      brokePoise: true,
      inPoiseRecovery: true,
      hasPoiseBrokenTag: true,
    },
    ...overrides,
  };
}

describe('projectPoiseChangePoints', () => {
  it('原样保留失衡变化、免疫和破韧状态', () => {
    expect(projectPoiseChangePoints([poiseReceipt(3)])).toEqual([
      {
        sequence: 3,
        frame: 15,
        time: 0.5,
        sourceId: 'perlica',
        targetId: 'enemy',
        calculationValue: 20,
        calculatedDamage: 30,
        requestedDelta: -30,
        actualDelta: -20,
        previousPoise: 20,
        currentPoise: 0,
        cancelled: false,
        cancelledByImmunity: false,
        poiseImmune: false,
        ignorePoiseImmune: false,
        brokePoise: true,
        inPoiseRecovery: true,
        hasPoiseBrokenTag: true,
      },
    ]);
  });

  it('保留同帧多次结算及其中间状态，不进行归并', () => {
    const points = projectPoiseChangePoints([
      poiseReceipt(4, {
        data: {
          ...poiseReceipt(4).data,
          actualDelta: -10,
          previousPoise: 40,
          currentPoise: 30,
          brokePoise: false,
          inPoiseRecovery: false,
          hasPoiseBrokenTag: false,
        },
      }),
      poiseReceipt(5, {
        data: {
          ...poiseReceipt(5).data,
          actualDelta: -30,
          previousPoise: 30,
          currentPoise: 0,
        },
      }),
    ]);

    expect(points.map(point => point.sequence)).toEqual([4, 5]);
    expect(points.map(point => [point.previousPoise, point.currentPoise])).toEqual([
      [40, 30],
      [30, 0],
    ]);
  });

  it('保留免疫取消造成的零变化', () => {
    const points = projectPoiseChangePoints([
      poiseReceipt(6, {
        data: {
          ...poiseReceipt(6).data,
          actualDelta: 0,
          previousPoise: 100,
          currentPoise: 100,
          cancelled: true,
          cancelledByImmunity: true,
          poiseImmune: true,
          brokePoise: false,
          inPoiseRecovery: false,
          hasPoiseBrokenTag: false,
        },
      }),
    ]);

    expect(points[0]).toMatchObject({
      actualDelta: 0,
      cancelled: true,
      cancelledByImmunity: true,
      poiseImmune: true,
    });
  });

  it('忽略非失衡结算回执', () => {
    expect(
      projectPoiseChangePoints([
        {
          sequence: 7,
          frame: 15,
          time: 0.5,
          event: 'DamageApplied',
        },
      ]),
    ).toEqual([]);
  });

  it('拒绝缺少约定身份、数值或状态字段的回执', () => {
    expect(() => projectPoiseChangePoints([poiseReceipt(8, { targetId: undefined })])).toThrow(
      "receipt 8 'PoiseApplied' has no targetId",
    );

    expect(() =>
      projectPoiseChangePoints([
        poiseReceipt(9, { data: { ...poiseReceipt(9).data, previousPoise: null } }),
      ]),
    ).toThrow("receipt 9 'PoiseApplied' has no finite previousPoise");

    expect(() =>
      projectPoiseChangePoints([
        poiseReceipt(10, { data: { ...poiseReceipt(10).data, brokePoise: null } }),
      ]),
    ).toThrow("receipt 10 'PoiseApplied' has no boolean brokePoise");
  });
});
