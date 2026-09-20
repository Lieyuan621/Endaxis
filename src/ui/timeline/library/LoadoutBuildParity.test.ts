import { expect, it } from 'vitest';
import {
  getOperatorCombatSkillDescription,
  getOperatorCombatSkillFormKeys,
  getOperatorGameName,
  getOperatorPotentialDescription,
  getOperatorTalentDescription,
  getWeaponGameName,
  getWeaponSkillDescription,
} from '../../gameText';

it('AKEDB 新武器也通过 i18n 提供展示名，不向定义写入中文名', () => {
  expect(getWeaponGameName('bedazzling-night-debut', 'zh-CN')).toBe('曜夜的首演');
  expect(getWeaponGameName('bedazzling-night-debut', 'en')).toBe('Bedazzling Night Debut');
  expect(getWeaponSkillDescription('bedazzling-night-debut', 'skill3', 'zh-CN', 9)).toContain(
    '<@ba.vup>+44.8%</>',
  );
});

it('梨诺技能、天赋和潜能 tooltip 使用已有主线富文本证据', () => {
  expect(getOperatorGameName('liino', 'zh-CN')).toBe('梨诺');
  expect(getOperatorCombatSkillDescription('liino', 'ultimate', 'zh-CN')).toContain(
    '<@ba.key>高歌姿态</>',
  );
  expect(getOperatorTalentDescription('liino', 0, 0, 'zh-CN')).toContain('<@ba.vup>+10%</>');
  expect(getOperatorPotentialDescription('liino', 0, 'zh-CN')).toContain('<#ba.return>返还</>');
});

it('诀的技能 tooltip 可以切换两种形态并显示当前构筑形态', () => {
  expect(getOperatorCombatSkillFormKeys('arcane', 'comboSkill', 'zh-CN')).toEqual(['int', 'will']);
  expect(getOperatorCombatSkillDescription('arcane', 'comboSkill', 'zh-CN', 'int')).toContain(
    '阵诀·智',
  );
  expect(getOperatorCombatSkillDescription('arcane', 'comboSkill', 'zh-CN', 'will')).toContain(
    '阵诀·意',
  );
});
