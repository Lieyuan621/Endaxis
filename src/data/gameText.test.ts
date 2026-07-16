import { describe, expect, test } from 'vitest';
import { getWeaponGameName, getWeaponSkillName } from './gameText';

describe('game text localization', () => {
  test('zh localizes Blessing of Lustrous Carmine', () => {
    expect(getWeaponGameName('blessing-of-lustrous-carmine', 'zh-CN')).toBe('镀红祝福');
  });

  test('zh localizes Blessing of Lustrous Carmine skill entries', () => {
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill1', 'zh-CN')).toBe('敏捷');
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill2', 'zh-CN')).toBe('灼热伤害');
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill3', 'zh-CN')).toBe('镀红祝福');
  });
});
