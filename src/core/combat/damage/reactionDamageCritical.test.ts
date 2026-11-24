import { describe, expect, it } from 'vitest';
import { reactionDamageKind } from './reactionDamageCritical';

describe('反应伤害命中身份', () => {
  it('不把普通物理伤害或碎冰视为物理异常', () => {
    expect(reactionDamageKind(['normalAttack'])).toBeUndefined();
    expect(reactionDamageKind(['shatter'])).toBeUndefined();
    expect(reactionDamageKind(['crush'])).toBe('physicalInfliction');
    expect(reactionDamageKind(['electricBurst'])).toBe('spellBurst');
  });
});
