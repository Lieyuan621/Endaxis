import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  projectHitDamageReceipts,
  projectHitInflictionReceipts,
  projectHitReactionReceipts,
} from './hitEffectProjection';

const baseDamage: Record<string, number | boolean | string | null> = {
  damageType: 'physical',
  value: 100,
  actualDamage: 95,
  remainingHealth: 9905,
  isCritical: false,
  criticalMultiplier: 1,
  defenseMultiplier: 1,
  resistanceMultiplier: 1,
  weaknessShelterMultiplier: 1,
  runtimeExtensionMultiplier: 1,
  igniteMultiplier: 1,
  physicalInflictionMultiplier: 1,
};

describe('projectHitDamageReceipts', () => {
  it('搬运伤害事实并保留可选步骤键', () => {
    const points = projectHitDamageReceipts([
      {
        sequence: 1,
        frame: 10,
        time: 1 / 3,
        event: 'DamageApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          ...baseDamage,
          stepKey: 'step:damage',
          castId: 'cast:1',
          hitId: 'hit:1',
        },
      },
      {
        sequence: 2,
        frame: 20,
        time: 2 / 3,
        event: 'DamageApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: { ...baseDamage, value: 200 },
      },
    ]);
    expect(points).toEqual([
      {
        frame: 10,
        time: 1 / 3,
        sequence: 1,
        sourceId: 'perlica',
        targetId: 'enemy',
        damageType: 'physical',
        value: 100,
        actualDamage: 95,
        isCritical: false,
        stepKey: 'step:damage',
        castId: 'cast:1',
        hitId: 'hit:1',
      },
      {
        frame: 20,
        time: 2 / 3,
        sequence: 2,
        sourceId: 'perlica',
        targetId: 'enemy',
        damageType: 'physical',
        value: 200,
        actualDamage: 95,
        isCritical: false,
      },
    ]);
  });

  it('缺失关键字段时严格失败', () => {
    expect(() =>
      projectHitDamageReceipts([
        {
          sequence: 1,
          frame: 1,
          time: 0,
          event: 'DamageApplied',
          sourceId: 'a',
          targetId: 'e',
          data: { ...baseDamage, value: undefined as unknown as number },
        },
      ]),
    ).toThrow('has no finite value');
  });
});

describe('projectHitInflictionReceipts', () => {
  it('搬运附着事实', () => {
    const points = projectHitInflictionReceipts([
      {
        sequence: 3,
        frame: 12,
        time: 0.4,
        event: 'ElementalInflictionApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          skillId: 'battleSkill',
          castId: 'cast:1',
          requestedElement: 'electric',
          isExtra: false,
          previousElement: null,
          previousLayers: 0,
          currentElement: 'electric',
          currentLayers: 1,
          outcomeKind: 'attachmentOnly',
          operationKinds: 'addAttachment',
        },
      },
    ]);
    expect(points[0]).toMatchObject({
      frame: 12,
      sourceId: 'perlica',
      skillId: 'battleSkill',
      element: 'electric',
      outcomeKind: 'attachmentOnly',
      currentLayers: 1,
      castId: 'cast:1',
    });
  });
});

describe('projectHitDamageReceipts receipt shape', () => {
  it('忽略非伤害事件', () => {
    const entry: CombatReceiptEntry = {
      sequence: 9,
      frame: 3,
      time: 0.1,
      event: 'SpChanged',
      data: { recipient: 'team' },
    };
    expect(projectHitDamageReceipts([entry])).toEqual([]);
  });
});

describe('projectHitReactionReceipts', () => {
  it('搬运反应施加与消费事实', () => {
    const points = projectHitReactionReceipts([
      {
        sequence: 4,
        frame: 24,
        time: 0.8,
        event: 'ElementalReactionApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          reaction: 'electrification',
          castId: 'cast:1',
          previousLevel: 0,
          level: 1,
          durationSeconds: 5,
          effectiveness: 1,
        },
      },
      {
        sequence: 7,
        frame: 120,
        time: 4,
        event: 'ElementalReactionConsumed',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: { reaction: 'electrification', level: 2, consumed: true },
      },
    ]);
    expect(points).toEqual([
      {
        frame: 24,
        time: 0.8,
        sequence: 4,
        sourceId: 'perlica',
        targetId: 'enemy',
        reaction: 'electrification',
        castId: 'cast:1',
        applied: true,
        consumed: true,
        level: 1,
        previousLevel: 0,
      },
      {
        frame: 120,
        time: 4,
        sequence: 7,
        sourceId: 'perlica',
        targetId: 'enemy',
        reaction: 'electrification',
        applied: false,
        consumed: true,
        level: 2,
        previousLevel: 0,
      },
    ]);
  });

  it('未消费成功的消费回执不输出', () => {
    expect(
      projectHitReactionReceipts([
        {
          sequence: 8,
          frame: 130,
          time: 13 / 3,
          event: 'ElementalReactionConsumed',
          sourceId: 'perlica',
          targetId: 'enemy',
          data: { reaction: 'electrification', level: 0, consumed: false },
        },
      ]),
    ).toEqual([]);
  });
});
