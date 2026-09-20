import { beforeAll, describe, expect, test } from 'vitest';
import { ensureLocaleResources } from '../i18n';
import {
  getOperatorCombatSkillDescription,
  getOperatorCombatSkillName,
  getOperatorCombatSkillFormKeys,
  getOperatorFormName,
  getOperatorGameName,
  getOperatorSubSkillName,
  getOperatorUiLabel,
  getWeaponGameName,
  getWeaponSkillDescription,
  getWeaponSkillName,
} from './gameText';

describe('game text localization', () => {
  beforeAll(async () => {
    await ensureLocaleResources('zh-CN', ['operators', 'weapons']);
  });

  test('zh localizes Blessing of Lustrous Carmine', () => {
    expect(getWeaponGameName('blessing-of-lustrous-carmine', 'zh-CN')).toBe('镀红祝福');
  });

  test('missing derived skill title can use its explicit level-source title without overriding native titles', () => {
    const fallback = getOperatorCombatSkillName('arcane', 'ultimate', 'zh-CN');
    expect(fallback).toBe('破晦');
    expect(getOperatorCombatSkillName('arcane', 'arcana', 'zh-CN', fallback)).toBe('破晦');
    expect(getOperatorCombatSkillName('arcane', 'ultimate', 'zh-CN', 'unused')).toBe('破晦');
  });

  test('zh localizes Blessing of Lustrous Carmine skill entries', () => {
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill1', 'zh-CN')).toBe(
      '敏捷提升·大',
    );
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill2', 'zh-CN')).toBe(
      '灼热伤害提升·大',
    );
    expect(getWeaponSkillName('blessing-of-lustrous-carmine', 'skill3', 'zh-CN')).toBe('流转·汲罪');
  });

  test('zh keeps arts-unit weapons with swapped icon IDs mapped to the correct skills', () => {
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

  test('current presentation slugs resolve native weapon locale identities', () => {
    expect(getWeaponGameName('bedazzling-night-debut', 'zh-CN')).toBe('曜夜的首演');
    expect(getWeaponSkillName('bedazzling-night-debut', 'skill3', 'zh-CN')).toBe('医疗·闪耀帷幕');
    expect(getWeaponSkillDescription('bedazzling-night-debut', 'skill3', 'zh-CN', 4)).toContain(
      '+25.6%',
    );
  });

  test('generic enhanced skill names come from common skill type messages', () => {
    expect(getOperatorSubSkillName('zhuang-fangyi', 'enhancedBattleSkill', 'zh-CN')).toBe(
      '强化战技',
    );
    expect(getOperatorSubSkillName('zhuang-fangyi', 'enhancedComboSkill', 'en')).toBe(
      'Enhanced Combo',
    );
    expect(
      getOperatorSubSkillName(
        'laevatain',
        'laevatain-basic-attack-during-ultimate',
        'en',
        'enhancedBasicAttack',
      ),
    ).toBe('Enhanced Basic Attack');
  });

  test('zh resolves camelCase operator UI enum keys without an English fallback', () => {
    expect(getOperatorUiLabel('fullyPromoted', 'zh-CN')).toBe('满精英化');
    expect(getOperatorUiLabel('promotionUnavailable', 'zh-CN')).toBe('无法精英化');
  });
});
