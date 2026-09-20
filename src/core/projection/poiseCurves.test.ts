import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import type { PoiseChangePoint } from './poiseChangePoints';
import {
  projectPoiseBrokenSegments,
  projectPoiseCurve,
  projectPoiseCurveFromReceipt,
  projectPoiseKnotSegments,
} from './poiseCurves';

const INITIAL = { poise: 300, maxPoise: 300 };

function change(overrides: Partial<PoiseChangePoint> = {}): PoiseChangePoint {
  return {
    frame: 10,
    time: 1 / 3,
    sequence: 3,
    sourceId: 'perlica',
    targetId: 'enemy',
    calculationValue: 100,
    calculatedDamage: 100,
    requestedDelta: -100,
    actualDelta: -100,
    previousPoise: 300,
    currentPoise: 200,
    cancelled: false,
    cancelledByImmunity: false,
    poiseImmune: false,
    ignorePoiseImmune: false,
    brokePoise: false,
    inPoiseRecovery: false,
    hasPoiseBrokenTag: false,
    ...overrides,
  };
}

describe('projectPoiseCurve', () => {
  it('从初始失衡生成稀疏曲线并保留被拦截的结算事实', () => {
    const changes = [
      change(),
      change({
        frame: 20,
        time: 2 / 3,
        sequence: 4,
        requestedDelta: -300,
        actualDelta: -200,
        previousPoise: 200,
        currentPoise: 0,
        brokePoise: true,
      }),
      change({
        frame: 30,
        time: 1,
        sequence: 5,
        requestedDelta: -50,
        actualDelta: 0,
        previousPoise: 0,
        currentPoise: 0,
        cancelledByImmunity: true,
      }),
    ];
    const curve = projectPoiseCurve(INITIAL, changes);
    expect(curve.resource).toBe('poise');
    expect(curve.maxValue).toBe(300);
    expect(curve.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 300 },
      { frame: 10, time: 1 / 3, sequence: 3, value: 200 },
      { frame: 20, time: 2 / 3, sequence: 4, value: 0 },
      { frame: 30, time: 1, sequence: 5, value: 0 },
    ]);
  });

  it('拒绝与事实不连续的失衡变化', () => {
    expect(() =>
      projectPoiseCurve(INITIAL, [change({ actualDelta: -120, currentPoise: 200 })]),
    ).toThrow('discontinuous');
  });

  it('把失衡恢复事实与结算交错投影为同一条曲线', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 3,
        frame: 10,
        time: 1 / 3,
        event: 'PoiseApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          calculationValue: 300,
          calculatedDamage: 300,
          requestedDelta: -300,
          actualDelta: -300,
          previousPoise: 300,
          currentPoise: 0,
          cancelled: false,
          cancelledByImmunity: false,
          poiseImmune: false,
          ignorePoiseImmune: false,
          brokePoise: true,
          inPoiseRecovery: true,
          hasPoiseBrokenTag: true,
        },
      },
      {
        sequence: 4,
        frame: 310,
        time: 31 / 3,
        event: 'PoiseRecovered',
        targetId: 'enemy',
        data: { poise: 300, hasPoiseBrokenTag: false },
      },
      {
        sequence: 5,
        frame: 320,
        time: 32 / 3,
        event: 'PoiseApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          calculationValue: 50,
          calculatedDamage: 50,
          requestedDelta: -50,
          actualDelta: -50,
          previousPoise: 300,
          currentPoise: 250,
          cancelled: false,
          cancelledByImmunity: false,
          poiseImmune: false,
          ignorePoiseImmune: false,
          brokePoise: false,
          inPoiseRecovery: false,
          hasPoiseBrokenTag: false,
        },
      },
    ];

    const curve = projectPoiseCurveFromReceipt(INITIAL, entries);
    expect(curve.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 300 },
      { frame: 10, time: 1 / 3, sequence: 3, value: 0 },
      { frame: 310, time: 31 / 3, sequence: 4, value: 300 },
      { frame: 320, time: 32 / 3, sequence: 5, value: 250 },
    ]);
  });

  it('拒绝与最大值不一致的失衡恢复事实', () => {
    expect(() =>
      projectPoiseCurveFromReceipt(INITIAL, [
        {
          sequence: 1,
          frame: 30,
          time: 1,
          event: 'PoiseRecovered',
          targetId: 'enemy',
          data: { poise: 250, hasPoiseBrokenTag: false },
        },
      ]),
    ).toThrow('restored to 250, expected 300');
  });
});

describe('projectPoiseKnotSegments', () => {
  const applied = (
    frame: number,
    previousPoise: number,
    currentPoise: number,
    brokePoise = false,
  ): CombatReceiptEntry => ({
    sequence: frame,
    frame,
    time: frame / 30,
    event: 'PoiseApplied',
    sourceId: 'perlica',
    targetId: 'enemy',
    data: {
      calculationValue: previousPoise - currentPoise,
      calculatedDamage: previousPoise - currentPoise,
      requestedDelta: currentPoise - previousPoise,
      actualDelta: currentPoise - previousPoise,
      previousPoise,
      currentPoise,
      cancelled: false,
      cancelledByImmunity: false,
      poiseImmune: false,
      ignorePoiseImmune: false,
      brokePoise,
      inPoiseRecovery: brokePoise,
      hasPoiseBrokenTag: brokePoise,
    },
  });

  it('只在实际失衡向上跨过节点时显示旧版条纹，同一命中跨多个节点只显示一次', () => {
    const entries = [
      applied(10, 300, 250),
      applied(20, 250, 140),
      applied(25, 140, 100),
      applied(30, 100, 0, true),
      applied(90, 300, 130),
    ];
    expect(projectPoiseKnotSegments(entries, 300, [0.25, 0.5], 60, 100)).toEqual([
      { startFrame: 20, endFrame: 80 },
      { startFrame: 90, endFrame: 100 },
    ]);
    expect(projectPoiseKnotSegments(entries, 300, [0.25, 0.5], 60, 19)).toEqual([]);
  });

  it('没有节点或节点时长时不显示条纹', () => {
    const entries = [applied(20, 300, 140)];
    expect(projectPoiseKnotSegments(entries, 300, [], 60, 100)).toEqual([]);
    expect(projectPoiseKnotSegments(entries, 300, [0.5], 0, 100)).toEqual([]);
  });
});

describe('projectPoiseBrokenSegments', () => {
  it('ignores non-break hits and repeated hits, preserves separate cycles and clips future facts', () => {
    const fact = (
      frame: number,
      event: string,
      data: CombatReceiptEntry['data'],
    ): CombatReceiptEntry => ({
      sequence: frame,
      frame,
      time: frame / 30,
      event,
      data,
    });
    const entries = [
      fact(1, 'PoiseApplied', { brokePoise: false, hasPoiseBrokenTag: false }),
      fact(10, 'PoiseApplied', { brokePoise: true, hasPoiseBrokenTag: true }),
      fact(11, 'PoiseApplied', { brokePoise: false, hasPoiseBrokenTag: true }),
      fact(20, 'PoiseRecovered', { hasPoiseBrokenTag: false }),
      fact(30, 'PoiseApplied', { brokePoise: true, hasPoiseBrokenTag: true }),
      fact(50, 'PoiseBrokenTagEnded', { hasPoiseBrokenTag: false }),
    ];
    expect(projectPoiseBrokenSegments(entries, 40)).toEqual([
      { startFrame: 10, endFrame: 20 },
      { startFrame: 30, endFrame: 40 },
    ]);
    expect(projectPoiseBrokenSegments(entries, 9)).toEqual([]);
  });

  it('preserves a same-frame tag end without inventing a visible duration', () => {
    expect(
      projectPoiseBrokenSegments(
        [
          {
            sequence: 1,
            frame: 10,
            time: 1 / 3,
            event: 'PoiseApplied',
            data: { brokePoise: true, hasPoiseBrokenTag: true },
          },
          {
            sequence: 2,
            frame: 10,
            time: 1 / 3,
            event: 'PoiseBrokenTagEnded',
            data: { hasPoiseBrokenTag: false },
          },
        ],
        20,
      ),
    ).toEqual([{ startFrame: 10, endFrame: 10 }]);
  });

  it('keeps the stripe active until the broken tag actually ends', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 0,
        frame: 20,
        time: 20 / 30,
        event: 'PoiseApplied',
        data: { brokePoise: true, hasPoiseBrokenTag: true },
      },
      {
        sequence: 1,
        frame: 50,
        time: 50 / 30,
        event: 'PoiseRecovered',
        data: { hasPoiseBrokenTag: true },
      },
      {
        sequence: 2,
        frame: 65,
        time: 65 / 30,
        event: 'PoiseBrokenTagEnded',
        data: { hasPoiseBrokenTag: false },
      },
    ];
    expect(projectPoiseBrokenSegments(entries, 90)).toEqual([{ startFrame: 20, endFrame: 65 }]);
  });

  it('closes an open interval at the projection boundary', () => {
    expect(
      projectPoiseBrokenSegments(
        [
          {
            sequence: 0,
            frame: 20,
            time: 20 / 30,
            event: 'PoiseApplied',
            data: { brokePoise: true, hasPoiseBrokenTag: true },
          },
        ],
        70,
      ),
    ).toEqual([{ startFrame: 20, endFrame: 70 }]);
  });
});
