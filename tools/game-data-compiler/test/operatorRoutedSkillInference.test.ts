import { describe, expect, it } from 'vitest';
import { planRoutedSkills } from '../scripts/planOperatorDefinition.ts';
import { parseOperatorActiveSkillEntries } from '../src/domains/operator/activeSkills.ts';
import type { CompiledOperatorActiveSkillRuntimeDefinitionSource } from '../src/domains/operator/activeSkillRuntimeDefinition.ts';

function fixture(overrides: Record<string, unknown> = {}) {
  const config = { kind: 'routedSkill', targetSkillKey: 'combo', ...overrides };
  const entries = parseOperatorActiveSkillEntries(
    [
      {
        source: 'wrapper.json',
        skillType: 'battleSkill',
        levelSource: 'battleSkill',
        compile: config,
      },
      { source: 'combo.json', skillType: 'comboSkill', levelSource: 'comboSkill' },
    ],
    'fixture.skills',
  );
  const wrapper: CompiledOperatorActiveSkillRuntimeDefinitionSource = {
    key: 'wrapper',
    blackboard: {},
    costFrame: 3,
    exclusiveFrame: 1,
    offsetRecordFrame: 0,
    naturalDurationFrames: 1,
    timelineBlockFrames: 1,
    allowNextSkillTransitions: [],
    scheduledSequences: [],
    actionGraph: {
      main: {
        nodes: {
          route: {
            action: {
              key: 'route',
              kind: 'applyBuff',
              parameters: { buffId: 'routing', target: 'caster', inheritSourceSkillCastInfo: true },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
    switchToBuffCast: {
      asSkillCast: false,
      condition: {
        kind: 'buffIdStackCompare',
        target: 'caster',
        buffIds: ['activation'],
        operator: 'greaterOrEqual',
        value: 1,
      },
      sequence: { $sequence: 'route' },
    },
  };
  const skills = [
    { definition: wrapper },
    {
      definition: {
        ...wrapper,
        key: 'combo',
        switchToBuffCast: undefined,
      },
    },
  ];
  const groups = [{ key: 'comboGroup', skillKeys: ['combo'] }];
  return {
    wrapper,
    groups,
    run: (definition = wrapper) =>
      planRoutedSkills(
        { routedSkillKeys: ['wrapper'] },
        entries,
        [{ definition }, skills[1]!],
        'fixture',
      ),
  };
}

describe('路由技能配置推导', () => {
  it('入口费用和冷却使用等级编译结果，允许补丁清零并保留逐级数值', () => {
    expect(fixture().run()).toEqual([
      {
        key: 'wrapper',
        targetSkillKey: 'combo',
        skillType: 'comboSkill',
        levelSource: 'comboSkill',

        costs: [],
        costFrame: 3,
        cooldownFrames: undefined,
      },
    ]);
    const paid = fixture();
    expect(
      paid.run({
        ...paid.wrapper,
        costs: [{ resource: 'sp', value: [40, 0] }],
        cooldownFrames: [90, 30],
      })[0],
    ).toMatchObject({ costs: [{ resource: 'sp', value: [40, 0] }], cooldownFrames: [90, 30] });
  });

  it('保留旧显式配置的结果，并拒绝与原始动作不一致的提示', () => {
    expect(
      fixture({
        executionSkillType: 'comboSkill',
        executionLevelSource: 'comboSkill',
        activationBuffId: 'activation',
        routingBuffId: 'routing',
        costResource: 'sp',
      }).run(),
    ).toEqual(fixture().run());
    for (const overrides of [
      { executionSkillType: 'ultimate' },
      { executionLevelSource: 'ultimate' },
      { activationBuffId: 'wrong' },
      { routingBuffId: 'wrong' },
      { activationBuffId: null },
      { routingBuffId: null },
      { executionSkillType: null },
      { costResource: 'ultimateEnergy' },
      { unknown: true },
      { targetSkillKey: 'missing' },
    ]) {
      expect(() => fixture(overrides).run()).toThrow();
    }
  });

  it('推导不放宽包装形状', () => {
    const invalid = fixture();
    expect(() =>
      invalid.run({
        ...invalid.wrapper,
        switchToBuffCast: { ...invalid.wrapper.switchToBuffCast!, asSkillCast: true },
      }),
    ).toThrow('does not match routed-skill evidence');
  });
});
