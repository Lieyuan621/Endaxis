import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectResourceChangePoints } from './resourceChangePoints';

describe('projectResourceChangePoints', () => {
  it('拒绝能力实体作为终结技能量回执接收者', () => {
    expect(() =>
      projectResourceChangePoints([
        {
          sequence: 1,
          frame: 0,
          time: 0,
          event: 'UltimateEnergyChanged',
          targetId: 'ability-entity:17',
          data: {
            recipient: 'abilityEntity',
            baseValue: -3,
            requestedValue: -3,
            actualValue: -3,
            previousValue: 7,
            currentValue: 4,
            applied: true,
          },
        },
      ]),
    ).toThrow('invalid recipient');
  });

  it('保留共享技力变化回执已经给出的字段', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 3,
        frame: 12,
        time: 0.4,
        event: 'SpChanged',
        sourceId: 'perlica',
        data: {
          skillId: 'battleSkill',
          recipient: 'team',
          baseValue: 20,
          requestedValue: 30,
          actualValue: 10,
          previousValue: 290,
          currentValue: 300,
          gainKind: 'refund',
        },
      },
    ];

    expect(projectResourceChangePoints(entries)).toEqual([
      {
        sequence: 3,
        frame: 12,
        time: 0.4,
        resource: 'sp',
        recipient: 'team',
        sourceId: 'perlica',
        skillId: 'battleSkill',
        baseValue: 20,
        requestedValue: 30,
        actualValue: 10,
        previousValue: 290,
        currentValue: 300,
        gainKind: 'refund',
      },
    ]);
  });

  it('保留终结技能量的目标和被规则阻止的零变化', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 4,
        frame: 18,
        time: 0.6,
        event: 'UltimateEnergyChanged',
        sourceId: 'perlica',
        targetId: 'arcane',
        data: {
          skillId: 'battleSkill',
          recipient: 'operator',
          baseValue: 10,
          requestedValue: 15,
          actualValue: 0,
          previousValue: 100,
          currentValue: 100,
          applied: false,
        },
      },
    ];

    expect(projectResourceChangePoints(entries)).toEqual([
      {
        sequence: 4,
        frame: 18,
        time: 0.6,
        resource: 'ultimateEnergy',
        recipient: 'operator',
        sourceId: 'perlica',
        skillId: 'battleSkill',
        targetId: 'arcane',
        baseValue: 10,
        requestedValue: 15,
        actualValue: 0,
        previousValue: 100,
        currentValue: 100,
        applied: false,
      },
    ]);
  });

  it('保留同帧多次变化的回执顺序，不归并中间状态', () => {
    const common = {
      frame: 20,
      time: 2 / 3,
      event: 'SpChanged',
      data: {
        recipient: 'team',
        baseValue: 10,
        requestedValue: 10,
        actualValue: 10,
        previousValue: 0,
        currentValue: 10,
      },
    } satisfies Omit<CombatReceiptEntry, 'sequence'>;

    const points = projectResourceChangePoints([
      { ...common, sequence: 8 },
      {
        ...common,
        sequence: 9,
        data: { ...common.data, previousValue: 10, currentValue: 20 },
      },
    ]);

    expect(points.map(point => point.sequence)).toEqual([8, 9]);
    expect(points.map(point => point.currentValue)).toEqual([10, 20]);
  });

  it('忽略非资源变化回执', () => {
    expect(
      projectResourceChangePoints([
        {
          sequence: 10,
          frame: 20,
          time: 2 / 3,
          event: 'SkillCostApplied',
          data: { remainingSp: 20 },
        },
      ]),
    ).toEqual([]);
  });

  it('标记每帧自动回复的来源，拒绝未知来源', () => {
    const points = projectResourceChangePoints([
      {
        sequence: 12,
        frame: 3,
        time: 0.1,
        event: 'SpChanged',
        data: {
          recipient: 'team',
          baseValue: 1,
          requestedValue: 1,
          actualValue: 1,
          previousValue: 99,
          currentValue: 100,
          source: 'autoRecovery',
        },
      },
    ]);
    expect(points[0]).toMatchObject({ resource: 'sp', source: 'autoRecovery' });

    expect(() =>
      projectResourceChangePoints([
        {
          sequence: 13,
          frame: 4,
          time: 0.13,
          event: 'SpChanged',
          data: {
            recipient: 'team',
            baseValue: 1,
            requestedValue: 1,
            actualValue: 1,
            previousValue: 100,
            currentValue: 101,
            source: 'unknown',
          },
        },
      ]),
    ).toThrow("receipt 13 'SpChanged' has invalid source");
  });

  it('拒绝缺少已约定事实字段的资源回执', () => {
    expect(() =>
      projectResourceChangePoints([
        {
          sequence: 11,
          frame: 20,
          time: 2 / 3,
          event: 'SpChanged',
          data: { recipient: 'team' },
        },
      ]),
    ).toThrow("receipt 11 'SpChanged' has no finite baseValue");

    expect(() =>
      projectResourceChangePoints([
        {
          sequence: 12,
          frame: 20,
          time: 2 / 3,
          event: 'UltimateEnergyChanged',
          data: {
            recipient: 'operator',
            baseValue: 1,
            requestedValue: 1,
            actualValue: 1,
            previousValue: 0,
            currentValue: 1,
            applied: true,
          },
        },
      ]),
    ).toThrow("receipt 12 'UltimateEnergyChanged' has no targetId");
  });
});
