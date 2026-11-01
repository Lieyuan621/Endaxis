import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { projectTimelineBattleLogGroups } from './timelineBattleLogProjection';

const entry = (
  sequence: number,
  event: string,
  options: { castId?: string; sourceId?: string; value?: number } = {},
): CombatReceiptEntry => ({
  sequence,
  frame: sequence * 10,
  time: sequence / 3,
  event,
  ...(options.sourceId === undefined ? {} : { sourceId: options.sourceId }),
  ...(options.value === undefined && options.castId === undefined
    ? {}
    : {
        targetId: 'enemy',
        data: {
          ...(options.castId === undefined ? {} : { castId: options.castId }),
          ...(options.value === undefined ? {} : { value: options.value }),
        },
      }),
});

describe('projectTimelineBattleLogGroups', () => {
  it('汇总多个敌人受到的伤害，排除干员和能力实体受击', () => {
    const groups = projectTimelineBattleLogGroups(
      ['enemy', 'enemy:second', 'track:1', 'ability-entity:1'].map((targetId, index) => ({
        ...entry(index + 1, 'DamageApplied', { castId: 'cast:1', value: (index + 1) * 100 }),
        targetId,
      })),
      [{ castId: 'cast:1', label: '战技', operatorLabel: '佩里卡', sourceId: 'track:1' }],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.damage).toBe(300);
    expect(groups[0]!.entries).toHaveLength(4);
  });
  it('groups explicit cast receipts and totals resolved damage', () => {
    const groups = projectTimelineBattleLogGroups(
      [
        entry(1, 'SkillInputProcessed', { castId: 'cast:1', sourceId: 'track:1' }),
        entry(2, 'DamageApplied', { castId: 'cast:1', sourceId: 'entity:child', value: 120 }),
      ],
      [
        {
          castId: 'cast:1',
          label: '战技',
          operatorLabel: '佩里卡',
          sourceId: 'track:1',
          color: '#ff4d4f',
        },
      ],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: 'cast:cast:1',
      kind: 'cast',
      label: '战技',
      secondaryLabel: '佩里卡',
      damage: 120,
      castId: 'cast:1',
      accentColor: '#ff4d4f',
    });
    expect(groups[0]?.entries).toHaveLength(2);
  });

  it('keeps operator-level and unidentified delayed events out of skill groups', () => {
    const groups = projectTimelineBattleLogGroups(
      [
        entry(1, 'PassiveSkillEnabled', { sourceId: 'track:1' }),
        entry(2, 'BuffFinished', { sourceId: 'buff:unknown' }),
      ],
      [{ castId: 'cast:1', label: '战技', operatorLabel: '佩里卡', sourceId: 'track:1' }],
    );
    expect(groups.map(group => [group.kind, group.label])).toEqual([
      ['operator', '佩里卡'],
      ['runtime', 'BuffFinished'],
    ]);
    expect(groups.every(group => group.castId === null)).toBe(true);
    expect(groups.every(group => group.accentColor === undefined)).toBe(true);
  });
});
