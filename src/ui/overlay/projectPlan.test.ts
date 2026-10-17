import { describe, expect, it } from 'vitest';
import type { ScenarioSimulationRun } from '../../application/simulation/scenarioSimulationService';
import { applySimulationResources } from './projectPlan';
import type { OverlayPlan } from './plan';

function basePlan(): OverlayPlan {
  return {
    casts: [],
    tracks: [],
    duration: 20,
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    comboWindows: {},
    hasCasts: true,
  };
}

function fakeRun(): ScenarioSimulationRun {
  return {
    frame: 600,
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
    receiptHistory: { toArray: () => [] },
  } as unknown as ScenarioSimulationRun;
}

describe('applySimulationResources', () => {
  it('把技力曲线按项目帧率换算成秒，并保留上限与初始值', () => {
    const result = applySimulationResources(basePlan(), fakeRun(), 30);

    expect(result.spPoints).toEqual([
      { time: 0, value: 80 },
      { time: 3, value: 180 },
      { time: 4, value: 60 },
    ]);
    expect(result.maxSp).toBe(300);
    expect(result.initialSp).toBe(80);
  });

  it('按 operatorId 归组终结技能量，空曲线不生成条目', () => {
    const result = applySimulationResources(basePlan(), fakeRun(), 30);

    expect(result.gaugePoints['operator-instance-1']).toEqual([
      { time: 0, value: 10 },
      { time: 4, value: 60 },
    ]);
    expect(result.gaugePoints['operator-instance-2']).toBeUndefined();
  });

  it('空施放计划也能安全套用曲线，不产生连携窗口', () => {
    const result = applySimulationResources(basePlan(), fakeRun(), 30);

    expect(result.comboWindows).toEqual({});
    expect(result.casts).toEqual([]);
  });

  it('帧率不同则换算结果不同', () => {
    const result = applySimulationResources(basePlan(), fakeRun(), 60);
    expect(result.spPoints[1]).toEqual({ time: 1.5, value: 180 });
  });
});
