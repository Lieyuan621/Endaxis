import { describe, expect, it } from 'vitest';
import type { CombatResourceSnapshot } from '../combat/resources/combatResources';
import type { ResourceChangePoint } from './resourceChangePoints';
import { projectResourceCurves, projectResourceCurvesFromReceipt } from './resourceCurves';

function snapshot(): CombatResourceSnapshot {
  return {
    sp: 100,
    maxSp: 300,
    returnedSp: 0,
    sharedSpGain: { baseGainEfficiency: 1 },
    spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
    ultimateEnergySystemUnlocked: true,
    squad: [
      {
        operatorId: 'perlica',
        ultimateEnergy: 20,
        maxUltimateEnergy: 100,
        ultimateEnergyGainMultiplier: 1,
        allowedUltimateEnergyRecoveryTags: null,
      },
    ],
    normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  };
}

describe('projectResourceCurves', () => {
  it('生成稀疏曲线并保留同帧顺序及未生效的终结技能量记录', () => {
    const changes: ResourceChangePoint[] = [
      {
        resource: 'sp',
        recipient: 'team',
        frame: 10,
        time: 1 / 3,
        sequence: 4,
        baseValue: -30,
        requestedValue: -30,
        actualValue: -30,
        previousValue: 100,
        currentValue: 70,
      },
      {
        resource: 'sp',
        recipient: 'team',
        frame: 10,
        time: 1 / 3,
        sequence: 5,
        baseValue: 10,
        requestedValue: 10,
        actualValue: 10,
        previousValue: 70,
        currentValue: 80,
      },
      {
        resource: 'ultimateEnergy',
        recipient: 'operator',
        targetId: 'perlica',
        applied: false,
        frame: 12,
        time: 0.4,
        sequence: 6,
        baseValue: 10,
        requestedValue: 10,
        actualValue: 0,
        previousValue: 20,
        currentValue: 20,
      },
    ];

    const curves = projectResourceCurves(snapshot(), changes);

    expect(curves.sp.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 100 },
      { frame: 10, time: 1 / 3, sequence: 4, value: 70 },
      { frame: 10, time: 1 / 3, sequence: 5, value: 80 },
    ]);
    expect(curves.ultimateEnergy[0]!.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 20 },
      { frame: 12, time: 0.4, sequence: 6, value: 20 },
    ]);
  });

  it('拒绝与初始快照不连续的变化点和未知干员', () => {
    const base: ResourceChangePoint = {
      resource: 'ultimateEnergy',
      recipient: 'operator',
      targetId: 'perlica',
      applied: true,
      frame: 1,
      time: 1 / 30,
      sequence: 0,
      baseValue: 10,
      requestedValue: 10,
      actualValue: 10,
      previousValue: 0,
      currentValue: 10,
    };

    expect(() => projectResourceCurves(snapshot(), [base])).toThrow('is discontinuous');
    expect(() =>
      projectResourceCurves(snapshot(), [
        { ...base, targetId: 'unknown', previousValue: 0, currentValue: 10 },
      ]),
    ).toThrow("targets unknown operator 'unknown'");
  });

  it('复用回执解析生成曲线，并拒绝倒置的变化点顺序', () => {
    const curves = projectResourceCurvesFromReceipt(snapshot(), [
      {
        sequence: 2,
        frame: 3,
        time: 0.1,
        event: 'SpChanged',
        data: {
          recipient: 'team',
          baseValue: -20,
          requestedValue: -20,
          actualValue: -20,
          previousValue: 100,
          currentValue: 80,
        },
      },
    ]);
    expect(curves.sp.points.at(-1)).toMatchObject({ frame: 3, sequence: 2, value: 80 });

    const first: ResourceChangePoint = {
      resource: 'sp',
      recipient: 'team',
      frame: 5,
      time: 1 / 6,
      sequence: 2,
      baseValue: -10,
      requestedValue: -10,
      actualValue: -10,
      previousValue: 100,
      currentValue: 90,
    };
    expect(() =>
      projectResourceCurves(snapshot(), [
        first,
        { ...first, frame: 4, sequence: 3, previousValue: 90, currentValue: 80 },
      ]),
    ).toThrow('precedes frame');
  });

  it('把每帧自动回复的来源透传到曲线点，供展示跳过标点', () => {
    const curves = projectResourceCurvesFromReceipt(snapshot(), [
      {
        sequence: 2,
        frame: 3,
        time: 0.1,
        event: 'SpChanged',
        data: {
          recipient: 'team',
          baseValue: 1,
          requestedValue: 1,
          actualValue: 1,
          previousValue: 100,
          currentValue: 101,
          source: 'autoRecovery',
        },
      },
    ]);
    expect(curves.sp.points.at(-1)).toMatchObject({ value: 101, source: 'autoRecovery' });
  });
});
