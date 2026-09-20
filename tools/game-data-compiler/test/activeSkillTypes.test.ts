import { describe, expect, it } from 'vitest';
import { parseActiveSkillTypesSource } from '../src/source/activeSkillTypes.ts';

const bundle = () => ({
  allActiveSkillId: ['normal', 'ultimate', 'combo', 'dodge', 'extra', 'callback'],
  normalSkillId: 'normal',
  ultimateSkillId: 'ultimate',
  comboSkillId: 'combo',
  dodgeSkillId: 'dodge',
  activeSkillTypeOverrides: {
    keys: ['normal', 'ultimate', 'combo', 'dodge', 'extra'],
    values: [8, 8, 8, 8, 8],
  },
});

describe('shared AbilitySystem active skill initialization', () => {
  it('keeps fixed identities ahead of overrides and does not infer type from a name', () => {
    expect(parseActiveSkillTypesSource(bundle(), 'bundle').initialNativeSkillTypeById).toEqual({
      normal: 'normalSkill',
      ultimate: 'ultimateSkill',
      combo: 'comboSkill',
      dodge: 'dodge',
      extra: 'extraActiveSkill',
      callback: 'normalSkill',
    });
  });
  it('accepts empty fixed slots for non-player owners', () => {
    const source = bundle();
    source.normalSkillId = source.ultimateSkillId = source.comboSkillId = source.dodgeSkillId = '';
    source.allActiveSkillId = ['chr_0027_tangtang_combo_skill_water_gene'];
    source.activeSkillTypeOverrides = { keys: [], values: [] };
    expect(parseActiveSkillTypesSource(source, 'bundle').initialNativeSkillTypeById).toEqual({
      chr_0027_tangtang_combo_skill_water_gene: 'normalSkill',
    });
  });
  it('rejects malformed or unknown override data', () => {
    const source = bundle();
    source.activeSkillTypeOverrides = { keys: ['extra'], values: [999] };
    expect(() => parseActiveSkillTypesSource(source, 'bundle')).toThrow(
      'unsupported native SkillType',
    );
    source.activeSkillTypeOverrides = { keys: ['extra', 'extra'], values: [8, 8] };
    expect(() => parseActiveSkillTypesSource(source, 'bundle')).toThrow('duplicate');
    source.activeSkillTypeOverrides = { keys: ['extra'], values: [] };
    expect(() => parseActiveSkillTypesSource(source, 'bundle')).toThrow('length');
  });
});
