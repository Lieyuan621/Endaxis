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
    switchToBuffCast: {
      asSkillCast: false,
      condition: {
        kind: 'buffIdStackCompare',
        target: 'caster',
        buffIds: ['activation'],
        operator: 'greaterOrEqual',
        value: 1,
      },
      sequence: {
        steps: [
          {
            key: 'route',
            kind: 'applyBuff',
            parameters: { buffId: 'routing', target: 'caster', inheritSourceSkillCastInfo: true },
          },
        ],
      },
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
  const source = {
    'wrapper.json': {
      castData: { startCdFrame: 3, cooldownTime: 2, costData: { costType: 'Atb', costValue: 100 } },
    },
  };
  return {
    wrapper,
    groups,
    source,
    run: (definition = wrapper) =>
      planRoutedSkills(
        { routedSkillKeys: ['wrapper'] },
        entries,
        [{ definition }, skills[1]!],
        groups,
        source,
        'fixture',
      ),
  };
}

describe('路由技能配置推导', () => {
  it('只配置目标关联，从目标定义和包装动作推导其余信息', () => {
    expect(fixture().run()).toEqual([
      {
        key: 'wrapper',
        targetSkillKey: 'combo',
        skillType: 'comboSkill',
        levelSource: 'comboSkill',
        executionSkillGroupKey: 'comboGroup',
        costs: [{ resource: 'sp', value: 100 }],
        costFrame: 3,
        cooldownFrames: 60,
      },
    ]);
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

  it('推导不放宽包装形状、技能组唯一性或原生资源限制', () => {
    const unsupported = fixture();
    unsupported.source['wrapper.json'].castData.costData.costType = 'Unknown';
    expect(unsupported.run).toThrow('cost/cooldown is unsupported');
    const ambiguous = fixture();
    ambiguous.groups.push({ key: 'duplicate', skillKeys: ['combo'] });
    expect(ambiguous.run).toThrow('target placement group');
    const invalid = fixture();
    expect(() =>
      invalid.run({
        ...invalid.wrapper,
        switchToBuffCast: { ...invalid.wrapper.switchToBuffCast!, asSkillCast: true },
      }),
    ).toThrow('does not match routed-skill evidence');
  });
});
