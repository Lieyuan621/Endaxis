import { describe, expect, it } from 'vitest';
import {
  formatEnemyBattleLogSummary,
  mergeCorrosionTicksInBattleLog,
  normalizeEnemyLogEntry,
  shouldIncludeEnemyLogEvent,
} from './normalizeEnemyLogForBattleLog';
import zh from '@/i18n/locales/zh-CN.json';

function makeT(messages: Record<string, unknown>) {
  const t = (key: string) => {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[part];
    }
    return typeof cur === 'string' ? cur : key;
  };
  const te = (key: string) => t(key) !== key;
  return { t, te };
}

describe('normalizeEnemyLogForBattleLog', () => {
  const { t, te } = makeT(zh as Record<string, unknown>);

  it('skips DOT_TICK duplicates', () => {
    expect(shouldIncludeEnemyLogEvent({ type: 'DOT_TICK' })).toBe(false);
    expect(shouldIncludeEnemyLogEvent({ type: 'INFLICTION_APPLY' })).toBe(true);
  });

  it('normalizes flat enemy events into panel shape', () => {
    const entry = normalizeEnemyLogEntry({
      type: 'INFLICTION_APPLY',
      time: 1.5,
      element: 'heat',
      stacks: 2,
      sourceId: 'laevatain',
      effectiveDuration: 20,
    });
    expect(entry).toEqual({
      type: 'INFLICTION_APPLY',
      time: 1.5,
      channel: 'enemy',
      payload: {
        element: 'heat',
        stacks: 2,
        sourceId: 'laevatain',
        effectiveDuration: 20,
      },
    });
  });

  it('formats infliction and reaction summaries with reused i18n', () => {
    expect(
      formatEnemyBattleLogSummary(
        {
          type: 'INFLICTION_APPLY',
          payload: { element: 'heat', stacks: 2 },
        },
        t,
        te,
      ),
    ).toBe('灼热 ×2');

    expect(
      formatEnemyBattleLogSummary(
        {
          type: 'REACTION_TRIGGER',
          payload: { reactionType: 'combustion', level: 3 },
        },
        t,
        te,
      ),
    ).toBe('燃烧 Lv3');

    expect(
      formatEnemyBattleLogSummary(
        {
          type: 'DEBUFF_APPLY',
          payload: { debuffType: 'electrification', level: 1 },
        },
        t,
        te,
      ),
    ).toBe('导电 Lv1');
  });

  it('merges corrosion ticks into one span per chain', () => {
    const merged = mergeCorrosionTicksInBattleLog([
      normalizeEnemyLogEntry({
        type: 'CORROSION_TICK',
        time: 1,
        sourceId: 'a',
        resShred: 3.6,
        level: 2,
        tickIndex: 0,
      }),
      normalizeEnemyLogEntry({
        type: 'CORROSION_TICK',
        time: 2,
        sourceId: 'a',
        resShred: 4.44,
        level: 2,
        tickIndex: 1,
      }),
      normalizeEnemyLogEntry({
        type: 'CORROSION_TICK',
        time: 3,
        sourceId: 'a',
        resShred: 5.28,
        level: 2,
        tickIndex: 2,
      }),
      normalizeEnemyLogEntry({
        type: 'DEBUFF_APPLY',
        time: 3.5,
        debuffType: 'corrosion',
        sourceId: 'a',
        level: 2,
      }),
      normalizeEnemyLogEntry({
        type: 'CORROSION_TICK',
        time: 4,
        sourceId: 'a',
        resShred: 3.6,
        level: 3,
        tickIndex: 0,
      }),
      normalizeEnemyLogEntry({
        type: 'CORROSION_TICK',
        time: 5,
        sourceId: 'a',
        resShred: 8,
        level: 3,
        tickIndex: 1,
      }),
    ]);

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({
      type: 'CORROSION_SPAN',
      time: 1,
      payload: {
        sourceId: 'a',
        startResShred: 3.6,
        endResShred: 5.28,
        tickCount: 3,
        endTime: 3,
        level: 2,
      },
    });
    expect(merged[1].type).toBe('DEBUFF_APPLY');
    expect(merged[2]).toMatchObject({
      type: 'CORROSION_SPAN',
      payload: {
        startResShred: 3.6,
        endResShred: 8,
        tickCount: 2,
        level: 3,
      },
    });

    expect(formatEnemyBattleLogSummary(merged[0], t, te)).toContain('3.60 → 5.28');
  });
});
