import { describe, expect, it } from 'vitest';

import { discoverOperatorPassiveSkillRequests } from '../src/index.ts';

describe('干员养成被动发现', () => {
  it('只把 AddPassiveSkill 转成公共请求，并保留效果包顺序和输入黑板', () => {
    const requests = discoverOperatorPassiveSkillRequests(
      {
        talent_effect: effect('talent_effect', [
          skillBlackboardEntry(),
          entry(1, {
            skillId: 'chr_fixture_talent',
            blackboard: [blackboard('rate', 0.2), blackboard('duration', 5)],
          }),
        ]),
      },
      ['talent_effect'],
    );
    expect(requests).toEqual([
      {
        originKind: 'operatorProgression',
        originId: 'talent_effect',
        sourcePath: 'PotentialTalentEffectTable.talent_effect.dataList[1]',
        skillId: 'chr_fixture_talent',
        levelSource: { kind: 'nativeDefault' },
        inputBlackboard: { rate: 0.2, duration: 5 },
      },
    ]);
  });

  it('拒绝非活动槽位残留技能，并保留非空活动条件 ID', () => {
    expect(() =>
      discoverOperatorPassiveSkillRequests(
        { effect: effect('effect', [entry(3, { skillId: 'residual' })]) },
        ['effect'],
      ),
    ).toThrow('inactive payload is not empty');
    const conditional = entry(1, { skillId: 'conditional' });
    conditional.activeCondition = ['condition_test'];
    expect(
      discoverOperatorPassiveSkillRequests({ effect: effect('effect', [conditional]) }, ['effect']),
    ).toMatchObject([{ activeConditionIds: ['condition_test'] }]);

    const skippedEmptyCondition = entry(1, { skillId: 'unconditional' });
    skippedEmptyCondition.activeCondition = [''];
    expect(
      discoverOperatorPassiveSkillRequests({ effect: effect('effect', [skippedEmptyCondition]) }, [
        'effect',
      ]),
    ).toHaveLength(1);
  });
});

function effect(id: string, dataList: unknown[]): Record<string, unknown> {
  return { id, dataList, desc: { id: 0, text: '' } };
}

function entry(
  modifyType: number,
  attachOverrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    activeCondition: [],
    attachBuff: { blackboard: [], buffId: '' },
    attachSkill: { blackboard: [], skillId: '', skillPath: '', ...attachOverrides },
    attrModifier: { attrType: 0, attrValue: 0, modifierType: 0, modifyAttributeType: 0 },
    modifyType,
    skillBbModifier: {
      bbKey: '',
      floatValue: 0,
      modifyType: 0,
      skillId: '',
      stringValue: '',
    },
    skillParamModifier: { modifyType: 0, paramType: 0, paramValue: 0, skillId: '' },
  };
}

function blackboard(key: string, value: number): Record<string, unknown> {
  return { key, value, valueStr: '' };
}

function skillBlackboardEntry(): Record<string, unknown> {
  return {
    ...entry(3),
    skillBbModifier: {
      bbKey: 'rate',
      floatValue: 0.1,
      modifyType: 1,
      skillId: 'active_skill',
      stringValue: '',
    },
  };
}
