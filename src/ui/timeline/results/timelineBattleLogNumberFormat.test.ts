import { describe, expect, it } from 'vitest';
import { createTimelineBattleLogNumberFormat } from './timelineBattleLogNumberFormat';

describe('createTimelineBattleLogNumberFormat', () => {
  it('keeps receipt precision while displaying damage as integers and resources to two decimals', () => {
    const format = createTimelineBattleLogNumberFormat('en-US');
    expect(format.damage(5853.211249999999)).toBe('5,853');
    expect(format.value(247.1297090018131)).toBe('247.13');
    expect(format.value(200)).toBe('200');
    expect(format.value('SkillInterrupted')).toBe('SkillInterrupted');
  });
});
