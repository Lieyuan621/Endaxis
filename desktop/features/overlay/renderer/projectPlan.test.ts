import { describe, expect, it } from 'vitest';
import { applySimulationResult, type OverlaySimulationRun } from './projectPlan';
import type { OverlayPlan } from './plan';
import { CombatReceiptHistory } from '@/core/combat/receipt/combatReceiptHistory';
import { activeWindow } from './layout';

function basePlan(): OverlayPlan {
  return {
    casts: [],
    tracks: [],
    duration: 20,
    startTime: 0,
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    gaugeMaxValues: {},
    comboWindows: {},
    hasCasts: true,
  };
}

function fakeRun(): OverlaySimulationRun {
  return {
    frame: 600,
    operatorPanels: [],
    resourceCurves: {
      sp: {
        resource: 'sp',
        maxValue: 300,
        points: [
          { frame: 0, time: 0, sequence: null, value: 80 },
          { frame: 90, time: 3, sequence: 1, value: 180 },
          { frame: 120, time: 4, sequence: 2, value: 60 },
        ],
      },
      ultimateEnergy: [
        {
          resource: 'ultimateEnergy',
          operatorId: 'operator-instance-1',
          maxValue: 100,
          points: [
            { frame: 0, time: 0, sequence: null, value: 10 },
            { frame: 120, time: 4, sequence: 2, value: 60 },
          ],
        },
        {
          resource: 'ultimateEnergy',
          operatorId: 'operator-instance-2',
          maxValue: 100,
          points: [],
        },
      ],
    },
    receiptHistory: new CombatReceiptHistory().snapshot(),
  };
}

describe('applySimulationResult', () => {
  it('把技力曲线按项目帧率换算成秒，并保留上限与初始值', () => {
    const result = applySimulationResult(basePlan(), fakeRun(), 30);

    expect(result.spPoints).toEqual([
      { time: 0, value: 80 },
      { time: 3, value: 180 },
      { time: 4, value: 60 },
    ]);
    expect(result.maxSp).toBe(300);
    expect(result.initialSp).toBe(80);
  });

  it('按 operatorId 归组终结技能量，空曲线不生成条目', () => {
    const result = applySimulationResult(basePlan(), fakeRun(), 30);

    expect(result.gaugePoints['operator-instance-1']).toEqual([
      { time: 0, value: 10 },
      { time: 4, value: 60 },
    ]);
    expect(result.gaugePoints['operator-instance-2']).toBeUndefined();
  });

  it('空施放计划也能安全套用曲线，不产生连携窗口', () => {
    const result = applySimulationResult(basePlan(), fakeRun(), 30);

    expect(result.comboWindows).toEqual({});
    expect(result.casts).toEqual([]);
  });

  it('帧率不同则换算结果不同', () => {
    const result = applySimulationResult(basePlan(), fakeRun(), 60);
    expect(result.spPoints[1]).toEqual({ time: 1.5, value: 180 });
  });

  it('精准区间切段不截短完整连携倒计时，同一干员后续窗口保持独立', () => {
    const history = new CombatReceiptHistory();
    const sourceId = 'operator-instance-1';
    const opened = (frame: number, windowSequence: number) =>
      history.append({
        frame,
        time: frame / 30,
        event: 'ComboWindowOpened',
        sourceId,
        data: { windowSequence, nextSkillKey: 'combo' },
      });
    const precision = (frame: number, active: boolean) =>
      history.append({
        frame,
        time: frame / 30,
        event: 'ComboRingQteActiveChanged',
        sourceId,
        data: { active },
      });
    opened(30, 0);
    precision(60, true);
    precision(90, false);
    history.append({
      frame: 180,
      time: 6,
      event: 'ComboWindowConsumed',
      sourceId,
      data: { windowSequence: 0 },
    });
    opened(210, 1);
    const result = applySimulationResult(
      basePlan(),
      { ...fakeRun(), receiptHistory: history.snapshot() },
      30,
    );
    expect(result.comboWindows[sourceId]).toEqual([
      { start: 1, end: 6 },
      { start: 7, end: 20 },
    ]);
    // 精准区间开始前、内部及结束后的倒计时都朝同一消费时刻递减。
    expect(
      [1.5, 2.5, 3.5].map(now => activeWindow(result.comboWindows[sourceId], now)!.end - now),
    ).toEqual([4.5, 3.5, 2.5]);
  });
});
