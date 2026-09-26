import { describe, expect, it } from 'vitest';

import {
  compileOperatorProgressionEffectBundles,
  parseOperatorProgressionEffectBundles,
} from '../src/index.ts';
import { compileOperatorPotentialDefinition } from '../src/domains/operator/progressionDefinition.ts';

describe('干员天赋与潜能效果来源', () => {
  it.each([0, 1, 2, 3])('两种活动修正共用有效操作检查：%s', modifyType => {
    const raw = [
      entry(2, {
        skillParamModifier: { modifyType, paramType: 2, paramValue: 0.8, skillId: 'skill' },
      }),
      entry(3, {
        skillBbModifier: {
          modifyType,
          bbKey: 'rate',
          floatValue: 1,
          skillId: 'skill',
          stringValue: '',
        },
      }),
    ];
    if (modifyType === 0) {
      for (const item of raw) expect(() => parse([item])).toThrow('incomplete active payload');
    } else {
      const compiled = compileOperatorProgressionEffectBundles(parse(raw));
      const operation = ['none', 'add', 'multiply', 'overwrite'][modifyType];
      expect(compiled[0]!.entries).toMatchObject([{ operation }, { operation }]);
    }
  });

  it('由同一来源解析器保留六类联合载荷', () => {
    const entries = [
      entry(0),
      entry(1, {
        attachSkill: { blackboard: [blackboard('rate', 0.2)], skillId: 'passive', skillPath: '' },
      }),
      entry(2, {
        skillParamModifier: { modifyType: 2, paramType: 2, paramValue: 0.8, skillId: 'skill' },
      }),
      entry(3, {
        skillBbModifier: {
          bbKey: 'rate',
          floatValue: 1,
          modifyType: 1,
          skillId: 'skill',
          stringValue: '',
        },
      }),
      entry(4, {
        attrModifier: { attrType: 39, attrValue: 20, modifierType: 5, modifyAttributeType: 0 },
      }),
      entry(5, { attachBuff: { blackboard: [blackboard('duration', 10)], buffId: 'buff' } }),
    ];
    const [bundle] = parseOperatorProgressionEffectBundles(
      { effect: { id: 'effect', desc: { id: 0, text: '' }, dataList: entries } },
      ['effect'],
    );

    expect(bundle!.entries.map(value => value.modifyType)).toEqual([
      'none',
      'addPassiveSkill',
      'changeSkillParameter',
      'changeSkillBlackboard',
      'modifyAttribute',
      'addBuff',
    ]);
    expect(bundle!.entries[1]!.attachedSkill).toMatchObject({
      skillId: 'passive',
      blackboard: { rate: 0.2 },
    });
    expect(bundle!.entries[2]!.skillParameterModifier).toMatchObject({
      skillId: 'skill',
      parameter: 'cooldown',
      modifyType: 'multiply',
      value: 0.8,
    });
    expect(bundle!.entries[3]!.skillBlackboardModifier).toMatchObject({
      skillId: 'skill',
      key: 'rate',
      modifyType: 'add',
    });
    expect(bundle!.entries[4]!.attributeModifier).toEqual({
      modifyAttributeType: 'Specific',
      attributeType: 'Str',
      formulaItem: 'BaseAddition',
      value: 20,
    });
    expect(bundle!.entries[5]!.attachedBuff).toMatchObject({
      buffId: 'buff',
      blackboard: { duration: 10 },
    });

    const [compiled] = compileOperatorProgressionEffectBundles([bundle!]);
    expect(compiled!.entries.map(value => value.kind)).toEqual([
      'none',
      'passiveSkill',
      'skillParameterModifier',
      'skillBlackboardModifier',
      'attributeModifier',
      'buff',
    ]);
    expect(compiled!.entries[4]).toMatchObject({
      kind: 'attributeModifier',
      modifier: {
        target: 'specific',
        declaredAttributeType: 'Str',
        slot: 'baseAddition',
        value: 20,
      },
    });
  });

  it('拒绝未知联合标签、不完整活动载荷和非活动槽位残留', () => {
    expect(() => parse([entry(6)])).toThrow('unsupported PotentialModifyType 6');
    expect(() => parse([entry(1)])).toThrow('expected non-empty string');
    expect(() =>
      parse([entry(5, { attachSkill: { blackboard: [], skillId: 'residual', skillPath: '' } })]),
    ).toThrow('inactive payload is not empty');
  });
});

it('原生直接附着 Buff 转成养成数据，不生成干员动作序列', () => {
  const bundles = compileOperatorProgressionEffectBundles(
    parse([entry(5, { attachBuff: { buffId: 'buff', blackboard: [blackboard('duration', 10)] } })]),
  );
  const source = {
    talentNodes: [],
    potential: { unlocks: [{ level: 1, effectId: 'effect' }] },
    compiledEffectBundles: bundles,
  } as unknown as Parameters<typeof compileOperatorPotentialDefinition>[0];
  const definition = compileOperatorPotentialDefinition(
    source,
    { level: 1 },
    {
      skills: [],
      skillGroups: [],
      costResources: new Map(),
    },
  );
  expect(definition.attachedBuffs).toEqual([
    { buffId: 'buff', blackboardAssignments: { duration: 10 } },
  ]);
  expect(definition.initializationSequence).toBeUndefined();
});

function parse(dataList: unknown[]) {
  return parseOperatorProgressionEffectBundles(
    { effect: { id: 'effect', desc: { id: 0, text: '' }, dataList } },
    ['effect'],
  );
}

function entry(modifyType: number, overrides: Record<string, unknown> = {}) {
  return {
    activeCondition: [],
    attachBuff: { blackboard: [], buffId: '' },
    attachSkill: { blackboard: [], skillId: '', skillPath: '' },
    attrModifier: { attrType: 0, attrValue: 0, modifierType: 0, modifyAttributeType: 0 },
    modifyType,
    skillBbModifier: { bbKey: '', floatValue: 0, modifyType: 0, skillId: '', stringValue: '' },
    skillParamModifier: { modifyType: 0, paramType: 0, paramValue: 0, skillId: '' },
    ...overrides,
  };
}

function blackboard(key: string, value: number) {
  return { key, value, valueStr: '' };
}
