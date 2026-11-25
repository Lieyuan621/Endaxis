import { describe, expect, it } from 'vitest';
import { isIgniteDamage, isPhysicalInflictionDamage } from './damageDecorationGroups';

describe('原生组合掩码分类', () => {
  it('碎冰和寒冷异常都属于 IgniteDamageSet，不属于 PhysicalInfliction', () => {
    expect(isIgniteDamage(['shatter'])).toBe(true);
    expect(isIgniteDamage(['cryoAbnormal'])).toBe(true);
    expect(isPhysicalInflictionDamage(['shatter'])).toBe(false);
  });
  it('初次灼热异常和燃烧都属于 IgniteDamageSet', () => {
    expect(isIgniteDamage(['fireAbnormalInitial'])).toBe(true);
    expect(isIgniteDamage(['fireAbnormal'])).toBe(true);
  });
  it('物理异常按四个原生位匹配，不把普通物理技能当成物理异常', () => {
    expect(isPhysicalInflictionDamage(['crush'])).toBe(true);
    expect(isPhysicalInflictionDamage(['airborne', 'knockDown', 'fracture'])).toBe(true);
    expect(isPhysicalInflictionDamage(['normalSkill', 'poiseBreak'])).toBe(false);
    expect(isIgniteDamage(['igniteByMud', 'bomb'])).toBe(false);
  });
});
