import { describe, expect, it } from 'vitest';
import { nextReactionDamageKey, reactionDamageKind } from './reactionDamageCritical';

describe('反应伤害命中身份', () => {
  it('分开同一动作的重复命中，恢复切面后继续同一编号', () => {
    const counts = new Map<string, number>();
    const identity = {
      sourceId: 'a',
      targetId: 'enemy',
      castId: 'cast-a',
      actionId: 'burst',
      stepKey: 'hit',
      kind: 'spellBurst',
    } as const;
    const first = nextReactionDamageKey(counts, identity);
    const saved = structuredClone(counts);
    nextReactionDamageKey(counts, { ...identity, castId: 'cast-b' });
    const second = nextReactionDamageKey(counts, identity);
    expect(second).not.toBe(first);
    expect(nextReactionDamageKey(saved, identity)).toBe(second);
    expect(nextReactionDamageKey(new Map(), identity)).toBe(first);
  });

  it('不把普通物理伤害或碎冰视为物理异常', () => {
    expect(reactionDamageKind(['normalAttack'])).toBeUndefined();
    expect(reactionDamageKind([], ['shatter'])).toBeUndefined();
    expect(reactionDamageKind([], ['physicalInfliction'])).toBe('physicalInfliction');
    expect(reactionDamageKind(['electricBurst'])).toBe('spellBurst');
  });
});
