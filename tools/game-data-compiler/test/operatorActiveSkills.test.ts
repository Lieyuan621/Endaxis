import { describe, expect, it } from 'vitest';

import { compileOperatorActiveSkills, parseOperatorActiveSkillEntries } from '../src/index.ts';
import { activeSkillFixture } from './sourceFixtures.ts';
import { OPERATOR_ACTIVE_SKILL_TYPES } from '../src/domains/operator/activeSkills.ts';
import { SKILL_TYPES } from '../../../packages/game-data-contract/src/primitives.ts';

describe('Operator 主动技能入口', () => {
  it('块宽参照适用于普攻，且必须引用同干员的另一个技能', () => {
    const start = { ...entry('basicAttack', 'start.json'), timelineBlockFollowUpSkillId: 'stop' };
    const stop = entry('battleSkill', 'stop.json');
    expect(
      parseOperatorActiveSkillEntries([start, stop], 'skills')[0]?.timelineBlockFollowUpSkillId,
    ).toBe('stop');
    expect(() => parseOperatorActiveSkillEntries([start], 'skills')).toThrow(
      'timelineBlockFollowUpSkillId',
    );
    expect(() =>
      parseOperatorActiveSkillEntries(
        [{ ...start, timelineBlockFollowUpSkillId: 'start' }, stop],
        'skills',
      ),
    ).toThrow('timelineBlockFollowUpSkillId');
  });
  it('省略旧编译器选择仍按同一原始动作图生成技能', () => {
    const identity = entry('basicAttack', 'native_attack.json');
    const files = { 'native_attack.json': activeSkillFixture('native_attack') };
    const automatic = compileOperatorActiveSkills([identity], files, {}, 'fixture.skills');
    for (const kind of ['basicAttack', 'resolvedSequence', 'resolvedDamageSequence']) {
      const legacy = compileOperatorActiveSkills(
        [{ ...identity, compile: { kind } }],
        files,
        {},
        'fixture.skills',
      );
      expect(automatic.definitions).toEqual(legacy.definitions);
    }
    expect(automatic.entries[0]!.projectionConfig).toBeNull();
  });

  it('主动技能列表保留顺序；闪避由运行时模板注入', () => {
    expect(OPERATOR_ACTIVE_SKILL_TYPES).toEqual([
      'basicAttack',
      'finisher',
      'plungingAttack',
      'battleSkill',
      'comboSkill',
      'ultimate',
    ]);
    expect([...OPERATOR_ACTIVE_SKILL_TYPES].sort()).toEqual(
      SKILL_TYPES.filter(type => type !== 'dodge').sort(),
    );
  });

  it('从 SkillData 文件名取得技能身份并绑定公共定义', () => {
    const result = compileOperatorActiveSkills(
      [
        {
          skillType: 'basicAttack',
          levelSource: 'basicAttack',
          source: 'native_attack_1.json',
          compile: { kind: 'resolvedSequence' },
        },
        {
          skillType: 'battleSkill',
          levelSource: 'battleSkill',
          source: 'native_battle.json',
          enhancementStateBuffId: 'buff_native_battle_enhancement',
          compile: { kind: 'resolvedSequence' },
        },
      ],
      {
        'native_attack_1.json': activeSkillFixture('native_attack_1'),
        'native_battle.json': activeSkillFixture('native_battle'),
      },
      {},
      'perlica.skills',
    );

    expect(result.entries.map(entry => [entry.key, entry.skillType])).toEqual([
      ['native_attack_1', 'basicAttack'],
      ['native_battle', 'battleSkill'],
    ]);
    expect(result.entries[0]!.projectionConfig).toEqual({ kind: 'resolvedSequence' });
    expect(result.entries[1]!.enhancementStateBuffId).toBe('buff_native_battle_enhancement');
    expect(result.definitions.map(definition => definition.skillId)).toEqual([
      'native_attack_1',
      'native_battle',
    ]);
  });

  it('拒绝重复身份、不安全路径、未知技能类型与缺失文件', () => {
    expect(() =>
      parseOperatorActiveSkillEntries(
        [entry('basicAttack', 'one.json'), entry('basicAttack', 'one.json')],
        'fixture.skills',
      ),
    ).toThrow('duplicate value "one"');
    expect(() =>
      parseOperatorActiveSkillEntries([entry('basicAttack', '../one.json')], 'fixture.skills'),
    ).toThrow('expected a safe JSON file name');
    expect(() =>
      parseOperatorActiveSkillEntries([entry('passive', 'one.json')], 'fixture.skills'),
    ).toThrow('unsupported operator skill type "passive"');
    expect(() =>
      compileOperatorActiveSkills([entry('basicAttack', 'missing.json')], {}, {}, 'fixture.skills'),
    ).toThrow('missing SkillData file missing.json');
  });
});

function entry(skillType: string, source: string) {
  return { skillType, levelSource: skillType, source };
}
