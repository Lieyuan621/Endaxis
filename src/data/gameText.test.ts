import { beforeAll, describe, expect, test } from 'vitest';
import { ensureLocaleResources } from '../i18n';
import {
  getOperatorCombatSkillDescription,
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
