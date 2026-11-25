import { describe, expect, it } from 'vitest';
import { projectDamageDecorateMask } from '../src/compiler/damageDecorateMask';

describe('原生统一伤害装饰掩码', () => {
  it.each([
    [1, 'poiseBreak'],
    [2, 'ignoreGuardDodge'],
    [8, 'fireAbnormalInitial'],
    [16, 'electricAbnormal'],
    [32, 'cryoAbnormal'],
    [64, 'igniteByMud'],
    [2048, 'bomb'],
    [262144, 'ignoreDodgeImmune'],
    [524288, 'ignoreSkillImmune'],
    [134217728, 'shatter'],
    [2147483648, 'talentDamage'],
  ] as const)('保留原生位 %i 为 %s', (mask, tag) => {
    expect(projectDamageDecorateMask(mask, 'fixture')).toEqual({ tags: [tag] });
  });
  it('不把组合掩码作为额外标记存储', () => {
    expect(projectDamageDecorateMask(1073856512, 'fixture')).toEqual({
      tags: ['crush', 'airborne', 'knockDown', 'fracture'],
    });
    expect(projectDamageDecorateMask(786432, 'fixture')).toEqual({
      tags: ['ignoreDodgeImmune', 'ignoreSkillImmune'],
    });
  });
  it('空掩码和 All 都有确定的集合表达', () => {
    expect(projectDamageDecorateMask(0, 'fixture')).toEqual({ tags: [] });
    const all = projectDamageDecorateMask(-1, 'fixture');
    expect(all.tags).toHaveLength(32);
    expect(new Set(all.tags).size).toBe(32);
    expect(projectDamageDecorateMask(0xffffffff, 'fixture')).toEqual(all);
  });
  it.each([0x100000000, -2, 0.5, Number.NaN])('拒绝未定义掩码 %s', mask => {
    expect(() => projectDamageDecorateMask(mask, 'fixture')).toThrow(
      'unsupported damage decorate mask',
    );
  });
});
