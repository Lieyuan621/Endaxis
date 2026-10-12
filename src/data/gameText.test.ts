import { beforeAll, describe, expect, test } from 'vitest';
import { ensureLocaleResources } from '../i18n';
import {
  getOperatorCombatSkillDescription,
  getOperatorCombatSkillDetails,
  getOperatorCombatSkillName,
  getOperatorCombatSkillFormKeys,
  getOperatorFormName,
  getOperatorGameName,
  getWeaponSkillDescription,
} from './gameText';

describe('game text localization', () => {
  beforeAll(async () => {
    await ensureLocaleResources('zh-CN', ['operators', 'weapons']);
  });

  test('missing derived skill title can use its explicit level-source title without overriding native titles', () => {
    const fallback = getOperatorCombatSkillName('arcane', 'ultimate', 'zh-CN');
    expect(fallback).toBe('破晦');
    expect(getOperatorCombatSkillName('arcane', 'arcana', 'zh-CN', fallback)).toBe('破晦');
    expect(getOperatorCombatSkillName('arcane', 'ultimate', 'zh-CN', 'unused')).toBe('破晦');
  });

  test('zh keeps funnel weapons with swapped icon IDs mapped to the correct skills', () => {
    expect(getWeaponSkillDescription('detonation-unit', 'skill3', 'zh-CN', 1)).toContain(
      '法术爆发',
    );
    expect(getWeaponSkillDescription('detonation-unit', 'skill3', 'zh-CN', 1)).not.toContain(
      '治疗',
    );
    expect(getWeaponSkillDescription('chivalric-virtues', 'skill3', 'zh-CN', 1)).toContain('治疗');
    expect(getWeaponSkillDescription('chivalric-virtues', 'skill3', 'zh-CN', 1)).not.toContain(
      '法术爆发',
    );
  });

  test('zh reads operator form labels separately from form-specific skill descriptions', () => {
    expect(getOperatorCombatSkillDetails('xaihi', 'basicAttack', 'zh-CN', 1)[3]).toEqual({
      label: '普攻第四段倍率',
      value: '33%',
    });
    expect(getOperatorCombatSkillDetails('xaihi', 'basicAttack', 'zh-CN', 2)[3]?.value).toBe('36%');
    const int = getOperatorCombatSkillDetails('arcane', 'battleSkill', 'zh-CN', 1, 'int');
    const will = getOperatorCombatSkillDetails('arcane', 'battleSkill', 'zh-CN', 1, 'will');
    expect(int.map(row => row.value)).toEqual(['222%', '10']);
    expect(will.map(row => row.value)).toEqual(['133%', '10']);
    expect(getOperatorGameName('arcane', 'zh-CN')).toBe('诀');
    expect(getOperatorFormName('arcane', 'int', 'zh-CN')).toBe('阵诀·智');
    expect(getOperatorFormName('arcane', 'will', 'zh-CN')).toBe('阵诀·意');
    expect(getOperatorCombatSkillFormKeys('arcane', 'comboSkill', 'zh-CN')).toEqual([
      'int',
      'will',
    ]);
    expect(getOperatorCombatSkillDescription('arcane', 'comboSkill', 'zh-CN', 'int')).toContain(
      '阵诀·智',
    );
    expect(getOperatorCombatSkillDescription('arcane', 'comboSkill', 'zh-CN', 'will')).toContain(
      '阵诀·意',
    );
  });
});
