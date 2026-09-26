import { validateBuffDefinition } from './validation/buffApplication';
import {
  validateActionGraphActions,
  validateActionGraphContexts,
  validateActionGraphReference,
  validateScheduledSequence,
} from './validation/actionPrograms';
import type { SkillDefinitionValidationIssue } from './validation/definitionValues';
import { describe, expect, it } from 'vitest';
import { validateSkillDefinition } from './validateSkillDefinition';
import { validateAbilityEntityDefinition } from './validation/actionPrograms';

/** 节点动作问题在当前图校验下的路径前缀。 */
const nodeActionPath = (id: string) => `$.actionGraph.main.nodes.${JSON.stringify(id)}.action`;

function baseSkill(): Record<string, unknown> {
  return {
    key: 'testSkill',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: null } }],
    actionGraph: { main: { nodes: {} }, macros: {} },
  };
}

function damageStep(key?: string): Record<string, unknown> {
  return {
    kind: 'dealDamage',
    ...(key === undefined ? {} : { key }),
    parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
  };
}

/**
 * 平铺动作串成链式图；控制动作的分支由调用方以显式 {$sequence} 引用给出，
 * 额外节点经 extraNodes 放入同一资源。
 */
function skillWithSteps(
  actions: readonly Record<string, unknown>[],
  extraNodes: Record<string, { action: unknown; next: string | null }> = {},
): Record<string, unknown> {
  const nodes: Record<string, { action: unknown; next: string | null }> = { ...extraNodes };
  actions.forEach((action, index) => {
    nodes[`step-${index}`] = {
      action,
      next: index + 1 < actions.length ? `step-${index + 1}` : null,
    };
  });
  return {
    ...baseSkill(),
    scheduledSequences: [
      { startFrame: 0, sequence: { $sequence: actions.length === 0 ? null : 'step-0' } },
    ],
    actionGraph: { main: { nodes }, macros: {} },
  };
}

describe('validateSkillDefinition', () => {
  it('rejects a Buff definition directory owned by a skill', () => {
    expect(validateSkillDefinition({ ...baseSkill(), buffDefinitions: {} })).toContainEqual({
      path: '$.buffDefinitions',
      message: 'skills may reference Buffs but cannot own their definitions',
    });
  });
  it('allows an AbilityEntity passive to address its host entity directly', () => {
    const applyToHost = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'entity-monitor',
        target: 'currentAbilityEntity' as const,
        source: 'currentAbilityEntity' as const,
      },
    };

    expect(
      validateAbilityEntityDefinition({
        lifetime: { kind: 'infinite' },
        passiveSkills: [
          {
            key: 'entity-passive',
            actionGraph: {
              main: { nodes: { entry: { action: applyToHost, next: null } } },
              macros: {},
            },
            enableSequence: { $sequence: 'entry' },
            abilityEventResponses: [
              {
                event: 'addedBuff',
                priority: 0,
                sequence: { $sequence: 'entry' },
              },
            ],
          },
        ],
      }),
    ).toEqual([]);
  });

  it.each(['party', 'partyExceptCaster', 'controlledOperator', 'unknown'])(
    '标签结束仍拒绝不属于单对象绑定的目标 %s',
    target => {
      const issues = validateSkillDefinition(
        skillWithSteps([
          {
            kind: 'finishBuffsByTag',
            parameters: {
              target,
              tagQueryType: 'hasAny',
              buffTags: ['Test/Tag'],
              reason: 'early',
            },
          },
        ]),
      );
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `${nodeActionPath('step-0')}.parameters.target`,
          }),
        ]),
      );
    },
  );

  it('原生事件触发器使用公共迁移准入，拒绝缺失及未支持身份', () => {
    const skill = (event: unknown) => ({
      ...baseSkill(),
      eventHandlers: [
        {
          key: 'native',
          event: { kind: 'abilityEvent', event },
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: null } }],
        },
      ],
    });
    expect(validateSkillDefinition(skill('addedBuff'))).toEqual([]);
    expect(validateSkillDefinition(skill('outputBuff'))).toEqual([]);
    expect(validateSkillDefinition(skill('unknown'))).not.toEqual([]);
    expect(validateSkillDefinition(skill(undefined))).not.toEqual([]);
  });
  it('requires a positive native natural duration when present', () => {
    expect(validateSkillDefinition({ ...baseSkill(), naturalDurationFrames: 1 })).toEqual([]);
    expect(validateSkillDefinition({ ...baseSkill(), naturalDurationFrames: 0 })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '$.naturalDurationFrames' })]),
    );
  });

  it('validates per-skill combat type and level source identities', () => {
    expect(
      validateSkillDefinition({
        ...baseSkill(),
        skillType: 'battleSkill',
        levelSource: 'ultimate',
      }),
    ).toEqual([]);
    expect(
      validateSkillDefinition({ ...baseSkill(), skillType: 'input', levelSource: 'finisher' }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.skillType' }),
        expect.objectContaining({ path: '$.levelSource' }),
      ]),
    );
  });

  it('validates operator profession conditions as a closed role list', () => {
    const condition: Record<string, unknown> = {
      kind: 'operatorRoleIn',
      target: 'buffOwner',
      roles: ['guard', 'supporter'],
    };
    const skill = skillWithSteps([
      { kind: 'conditional', parameters: { condition }, whenTrue: { $sequence: null } },
    ]);
    expect(validateSkillDefinition(skill)).toEqual([]);
    condition.roles = ['medic'];
    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${nodeActionPath('step-0')}.parameters.condition.roles[0]`,
        }),
      ]),
    );
  });

  it('校验原生 TickInterval 参数并禁止与 Channeling 混用', () => {
    const parameters: Record<string, unknown> = {
      nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 },
    };
    const skill = skillWithSteps(
      [{ kind: 'repeatEachTick', parameters, body: { $sequence: 'tick-0' } }],
      { 'tick-0': { action: damageStep('tick'), next: null } },
    );
    expect(validateSkillDefinition(skill)).toEqual([]);

    parameters.nativeChanneling = {
      executeEachFrame: false,
      triggerIntervalSeconds: 0.1,
      maxCountPerTarget: 1,
      targetTriggerIntervalSeconds: -1,
    };
    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${nodeActionPath('step-0')}.parameters`,
        }),
      ]),
    );
  });

  it.each([undefined, 'parent', 'execution'])('接受黑板作用域生命周期 %s', lifetime => {
    const skill = skillWithSteps([
      {
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'callback',
          initialValues: {},
          inheritParent: true,
          lifetime,
          alwaysNext: true,
        },
        body: { $sequence: null },
      },
    ]);
    expect(validateSkillDefinition(skill)).toEqual([]);
  });
  it.each([{ lifetime: 'unknown' }, { lifetime: null }, { alwaysNext: 1 }])(
    '拒绝非法黑板生命周期参数 %j',
    invalid => {
      const skill = skillWithSteps([
        {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey: 'callback',
            initialValues: {},
            inheritParent: true,
            ...invalid,
          },
          body: { $sequence: null },
        },
      ]);
      expect(validateSkillDefinition(skill)).not.toEqual([]);
    },
  );
  it.each([
    { shareParentBlackboard: 'yes' },
    { shareParentBlackboard: true, initialValues: { local: [1] } },
    { shareParentBlackboard: true, inheritParent: false },
    { shareParentBlackboard: true, entityInitialValues: {} },
    { shareParentBlackboard: true, entityAssignments: {} },
  ])('拒绝非法共享父黑板参数 %j', invalid => {
    const skill = skillWithSteps([
      {
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'native-callback',
          initialValues: {},
          inheritParent: true,
          ...invalid,
        },
        body: { $sequence: null },
      },
    ]);
    expect(validateSkillDefinition(skill)).not.toEqual([]);
  });
  it('接受只隔离控制流的共享父 Buff 黑板回调边界', () => {
    const skill = skillWithSteps([
      {
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'native-callback',
          lifetime: 'execution',
          alwaysNext: true,
          shareParentBlackboard: true,
          initialValues: {},
          inheritParent: true,
        },
        body: { $sequence: null },
      },
    ]);
    expect(validateSkillDefinition(skill)).toEqual([]);
  });
  it.each(['enemy', 'input', 'trigger', undefined])('接受有界智能目标 %s', smartTarget => {
    expect(validateSkillDefinition({ ...baseSkill(), smartTarget })).toEqual([]);
  });
  it.each([null, 1, 'nearest', {}])('拒绝未知智能目标 %j', smartTarget => {
    expect(validateSkillDefinition({ ...baseSkill(), smartTarget })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.stringContaining('smartTarget') }),
      ]),
    );
  });
  it('validates the fixed fracture entry and both inline Buff definitions', () => {
    const step: Record<string, unknown> = {
      kind: 'applyPhysicalInfliction',
      parameters: {
        type: 'fracture',
        target: 'enemy',
        isExtra: false,
        noGuardBuffId: 'buff_physical_no_guard',
        noGuardDefinition: { stackingType: 'unlimited' },
        fractureBuffId: 'buff_physical_fracture',
        fractureDefinition: { stackingType: 'refresh' },
      },
    };
    const definition = skillWithSteps([step]);
    expect(validateSkillDefinition(definition)).toEqual([]);

    (step.parameters as Record<string, unknown>).target = 'caster';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.parameters.target') }),
    );
  });

  it('validates the evidence-backed heal target and attribute formula', () => {
    const step: Record<string, unknown> = {
      kind: 'heal',
      parameters: {
        target: 'controlledOperator',
        attribute: 'will',
        multiplier: [1, 2],
        addition: { kind: 'blackboard', key: 'base' },
        tags: ['Test/TagNegative1'],
      },
    };
    const definition = skillWithSteps([step]);

    expect(validateSkillDefinition(definition)).toEqual([]);
    (step.parameters as Record<string, unknown>).target = 'currentAbilityEntity';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.parameters.target') }),
    );
  });

  it('validates definite healing and rejects mixing it with an attribute formula', () => {
    const step: Record<string, unknown> = {
      kind: 'heal',
      parameters: {
        target: 'controlledOperator',
        amount: { kind: 'blackboard', key: 'final_heal_value' },
        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
      },
    };
    const definition = skillWithSteps([step]);

    expect(validateSkillDefinition(definition)).toEqual([]);
    (step.parameters as Record<string, unknown>).attribute = 'will';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({
        path: expect.stringContaining('.parameters.attribute'),
        message: 'cannot be combined with definite amount',
      }),
    );
  });

  it('只接受已知的敌人原生 rank，并允许原生空集合表达永不匹配', () => {
    const condition: { kind: string; ranks: string[] } = {
      kind: 'enemyRankIn',
      ranks: ['elite', 'boss'],
    };
    const definition = skillWithSteps([
      { kind: 'conditional', parameters: { condition }, whenTrue: { $sequence: null } },
    ]);

    expect(validateSkillDefinition(definition)).toEqual([]);

    condition.ranks = ['advanced'];
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ message: 'unknown enemy rank' }),
    );
    condition.ranks = [];
    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('允许终结技仅自动忽略施法者而不配置额外对象', () => {
    const definition = skillWithSteps([
      {
        kind: 'startUltimateTimeDilation',
        parameters: {
          priority: 100,
          targetScale: { kind: 'constant', value: 0 },
          ignoredTargets: [],
        },
      },
    ]);

    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('允许全局时间膨胀在执行帧排除当前主控干员', () => {
    const definition = skillWithSteps([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot1',
          priority: 2,
          curve: { kind: 'named', key: 'ComboSkill' },
          finishByAction: false,
          ignoredTargets: ['controlled'],
        },
      },
    ]);

    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('严格校验时间膨胀中的能力实体 ID 与 Context 查询', () => {
    const queries: Array<Record<string, unknown>> = [
      {
        kind: 'ownerSpawned',
        abilityEntityIds: ['abilityentity_test'],
      },
      { kind: 'context', contextKey: 'mirrors' },
    ];
    const definition = skillWithSteps([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot1',
          priority: 2,
          curve: { kind: 'named', key: 'ComboSkill' },
          finishByAction: false,
          targets: [],
          abilityEntityTargets: queries,
        },
      },
    ]);

    expect(validateSkillDefinition(definition)).toEqual([]);

    queries[0]!.abilityEntityIds = [];
    queries[1]!.contextKey = '';

    expect(validateSkillDefinition(definition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${nodeActionPath('step-0')}.parameters.abilityEntityTargets[0].abilityEntityIds`,
          message: 'expected a non-empty array',
        }),
        expect.objectContaining({
          path: `${nodeActionPath('step-0')}.parameters.abilityEntityTargets[1].contextKey`,
          message: 'expected a non-empty string',
        }),
      ]),
    );
  });

  it('accepts a structurally valid skill', () => {
    const skill = skillWithSteps([
      damageStep('hit:1'),
      {
        kind: 'modifyActionValue',
        parameters: { key: 'x', operation: 'add', value: { kind: 'constant', value: 1 } },
      },
    ]);
    expect(validateSkillDefinition(skill)).toEqual([]);
  });

  it('validates named and inline time-dilation curves', () => {
    const step: Record<string, unknown> = {
      kind: 'startTimeDilation',
      parameters: {
        scope: 'global',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'Test/TimeSlot1',
        priority: 2,
        curve: { kind: 'named', key: 'ComboSkill' },
        finishByAction: false,
        ignoredTargets: ['caster'],
      },
    };
    const skill = skillWithSteps([step]);
    expect(validateSkillDefinition(skill)).toEqual([]);

    const parameters = step.parameters as Record<string, unknown>;
    parameters.curve = {
      kind: 'inline',
      keys: [
        {
          time: 0,
          value: 1,
          inTangent: Number.POSITIVE_INFINITY,
          outTangent: Number.NEGATIVE_INFINITY,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    };
    expect(validateSkillDefinition(skill)).toEqual([]);

    parameters.curve = {
      kind: 'inline',
      keys: [
        {
          time: 1,
          value: 0,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 4,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 0,
          value: 1,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    };
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path.endsWith('.weightedMode'))).toBe(true);
    expect(issues.some(issue => issue.message.includes('strictly increasing'))).toBe(true);
  });

  it('keeps Buff presentation metadata strict and separate from runtime fields', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'refresh',
      presentation: {
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/buffs/example.webp',
        visible: true,
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: true,
        onlyShowForMainCharacter: false,
        iconStyleInSquad: 'Default',
        abnormalColorType: 'Physical',
        orderPriority: {
          useDirectoryValue: false,
          value: 0,
          category: 'CommonCharBuff',
        },
      },
    };
    expect(validateBuff(definition)).toEqual([]);

    definition.presentation = { iconPath: '', color: '#fff' };
    const issues = validateBuff(definition);
    expect(issues.some(issue => issue.path.endsWith('.presentation.iconPath'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.presentation.color'))).toBe(true);
  });

  it('accepts ordered owner Buff lifecycle sequences', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'unique',
      lifecycleSequences: {
        start: { $sequence: 'entry' },
      },
    };
    expect(validateBuff(definition)).toEqual([]);
  });

  it('accepts an owner Buff max stack count resolved from its application blackboard', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'stack',
      maxStackCount: { blackboardKey: 'max_stack' },
    };
    expect(validateBuff(definition)).toEqual([]);
  });

  it('validates Buff independently of a creating skill', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'unique',
      lifecycleSequences: { start: { $sequence: null } },
    };
    expect(validateBuff(definition)).toEqual([]);
  });

  it('validates owner Buff ability event responses and their sequences', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'unique',
      abilityEventResponses: [
        {
          event: 'beforeTakeDamage',
          priority: 3,
          sequence: { $sequence: 'entry' },
        },
      ],
    };
    expect(validateBuff(definition)).toEqual([]);
    const response = (definition.abilityEventResponses as Array<Record<string, unknown>>)[0]!;
    response.samePriorityKey = 'obsolete-ordering-hint';
    expect(validateBuff(definition).some(issue => issue.path.endsWith('.samePriorityKey'))).toBe(
      true,
    );
    delete response.samePriorityKey;
    response.event = 'unknownEvent';
    response.priority = 0.5;
    response.unknown = true;
    const issues = validateBuff(definition);
    expect(issues.some(issue => issue.path.endsWith('.event'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.priority'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.unknown'))).toBe(true);
  });

  it('rejects old low-level actions and unknown owner Buff lifecycle names', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'unique',
      actions: { start: [] },
      lifecycleSequences: { update: { $sequence: null } },
    };
    const issues = validateBuff(definition);
    expect(issues.some(issue => issue.path.endsWith('.definition.actions'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.lifecycleSequences.update'))).toBe(true);
  });

  it('rejects missing top-level key and timelineBlockFrames', () => {
    const skill = { scheduledSequences: [] };
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path === '$.key')).toBe(true);
    expect(issues.some(issue => issue.path === '$.timelineBlockFrames')).toBe(true);
    expect(issues.some(issue => issue.path === '$.scheduledSequences')).toBe(false);
  });

  it('rejects empty scheduledSequences requirement when omitted', () => {
    const issues = validateSkillDefinition({ key: 'k', timelineBlockFrames: 30 });
    expect(issues.some(issue => issue.path === '$.scheduledSequences')).toBe(true);
  });

  it.each(['unknownTrigger', 'statusExpired', 'statusConsumed'])(
    'rejects an unsupported event trigger kind: %s',
    kind => {
      const skill = baseSkill();
      skill.eventHandlers = [
        {
          key: 'handler:1',
          event: { kind, statusKey: 'status', target: 'enemy' },
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: null } }],
        },
      ];
      const issues = validateSkillDefinition(skill);
      expect(
        issues.some(
          issue =>
            issue.path === '$.eventHandlers[0].event.kind' &&
            issue.message.includes('unknown event trigger'),
        ),
      ).toBe(true);
    },
  );

  it('rejects an event trigger with an invalid scope', () => {
    const skill = baseSkill();
    skill.eventHandlers = [
      {
        key: 'handler:1',
        event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'all' },
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: null } }],
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path === '$.eventHandlers[0].event.scope')).toBe(true);
  });

  it('rejects invalid LevelValues: NaN and empty array', () => {
    const step = damageStep('hit:1');
    const skillA = skillWithSteps([step]);
    // 攻击倍率传 NaN
    (step.parameters as Record<string, unknown>).attackScale = Number.NaN;
    expect(
      validateSkillDefinition(skillA).some(
        issue => issue.path === `${nodeActionPath('step-0')}.parameters.attackScale`,
      ),
    ).toBe(true);

    // 黑板值传空数组
    const skillB = baseSkill();
    skillB.blackboard = { scale: [] };
    expect(validateSkillDefinition(skillB).some(issue => issue.path === '$.blackboard.scale')).toBe(
      true,
    );
  });

  it('rejects invalid damage tag', () => {
    const step: Record<string, unknown> = damageStep('hit:1');
    const skill = skillWithSteps([step]);
    (step.parameters as { tags: string[] }).tags = ['unknownTag'];
    expect(
      validateSkillDefinition(skill).some(
        issue => issue.path === `${nodeActionPath('step-0')}.parameters.tags[0]`,
      ),
    ).toBe(true);
  });

  it('rejects unknown combat step kind', () => {
    const skill = skillWithSteps([{ kind: 'unknownStep', parameters: {} }]);
    expect(
      validateSkillDefinition(skill).some(
        issue =>
          issue.path === `${nodeActionPath('step-0')}.kind` &&
          issue.message.includes('unknown combat step'),
      ),
    ).toBe(true);
  });

  it('rejects entity finish operations outside an entity iteration', () => {
    const skill = skillWithSteps([{ kind: 'finishCurrentAbilityEntity', parameters: {} }]);
    expect(validateSkillDefinition(skill)).not.toEqual([]);
  });

  it('requires an end frame for nested combat event listeners', () => {
    const skill = skillWithSteps(
      [
        {
          kind: 'conditional',
          parameters: { condition: { kind: 'combatActive' } },
          whenTrue: { $sequence: 'listener' },
        },
      ],
      {
        listener: {
          action: {
            kind: 'listenForCombatEvents',
            parameters: {
              responses: [
                {
                  key: 'response',
                  event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                  sequence: { $sequence: null },
                },
              ],
            },
          },
          next: null,
        },
      },
    );
    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].endFrame',
      message: 'combat event listeners require an end frame',
    });
  });

  it('rejects current entity Buff targets outside an entity scope', () => {
    for (const parameters of [
      { target: 'currentAbilityEntity', source: 'caster' },
      { target: 'caster', source: 'currentAbilityEntity' },
    ]) {
      const skill = skillWithSteps([
        { kind: 'applyBuff', parameters: { buffId: 'entity-monitor', ...parameters } },
      ]);
      expect(validateSkillDefinition(skill)).not.toEqual([]);
    }
  });

  it('allows AbilityEntity finish operations inside an entity iteration body', () => {
    const wrapped = skillWithSteps(
      [
        {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'entities' },
          body: { $sequence: 'child-0' },
        },
      ],
      {
        'child-0': {
          action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
          next: null,
        },
      },
    );
    expect(validateSkillDefinition(wrapped)).toEqual([]);
  });

  it('allows current AbilityEntity Buff application inside an entity target scope', () => {
    const apply = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'entity-monitor',
        target: 'currentAbilityEntity' as const,
        source: 'currentAbilityEntity' as const,
      },
    };
    const wrapped = skillWithSteps(
      [
        {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'entities' },
          body: { $sequence: 'child-0' },
        },
      ],
      { 'child-0': { action: apply, next: null } },
    );
    expect(validateSkillDefinition(wrapped)).toEqual([]);
  });

  it('rejects mixing a lightweight damage modifier condition with a condition program', () => {
    const definition: Record<string, unknown> = {
      stackingType: 'unique',
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: { kind: 'combatActive' },
          conditionProgram: { $sequence: null },
          processors: [],
        },
      ],
    };
    expect(validateBuff(definition)).toContainEqual({
      path: '$.definition.damageModifiers[0]',
      message: 'cannot define both condition and conditionProgram',
    });
  });

  it('rejects conditional without whenTrue', () => {
    const skill = skillWithSteps([
      { kind: 'conditional', parameters: { condition: { kind: 'combatActive' } } },
    ]);
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path === `${nodeActionPath('step-0')}.whenTrue`)).toBe(true);
  });

  it('rejects invalid cost resource and negative level value', () => {
    const skill = baseSkill();
    skill.costs = [{ resource: 'mana', value: 10 }];
    expect(validateSkillDefinition(skill).some(issue => issue.path === '$.costs[0].resource')).toBe(
      true,
    );

    const skillB = baseSkill();
    skillB.costs = [{ resource: 'sp', value: -1 }];
    // LevelValues 只要求有限数，负数费用在编译期才做非负约束；这里不应报错。
    expect(validateSkillDefinition(skillB).some(issue => issue.path === '$.costs[0].value')).toBe(
      false,
    );
  });

  it('rejects changeResource with sp-only fields on ultimateEnergy', () => {
    const skill = skillWithSteps([
      {
        kind: 'changeResource',
        parameters: {
          resource: 'ultimateEnergy',
          amount: 10,
          recipient: 'caster',
          spGainSource: 'normalAttack',
        },
      },
    ]);
    expect(
      validateSkillDefinition(skill).some(
        issue => issue.path === `${nodeActionPath('step-0')}.parameters.spGainSource`,
      ),
    ).toBe(true);
  });

  it('validates a dynamic resource coefficient as an action value operand', () => {
    const coefficient: Record<string, unknown> = { kind: 'blackboard', key: 'targetCount' };
    const skill = skillWithSteps([
      {
        kind: 'changeResourceByActionValue',
        parameters: {
          resource: 'sp',
          amount: { kind: 'blackboard', key: 'refundAmount' },
          coefficient,
          recipient: 'team',
        },
      },
    ]);

    expect(validateSkillDefinition(skill)).toEqual([]);

    coefficient.key = '';

    expect(
      validateSkillDefinition(skill).some(
        issue => issue.path === `${nodeActionPath('step-0')}.parameters.coefficient.key`,
      ),
    ).toBe(true);
  });

  it('validates the inline AbilityEntity definition at its spawn site', () => {
    const step: Record<string, unknown> = {
      kind: 'spawnAbilityEntity',
      parameters: {
        abilityEntityId: 'fixture',
        definition: {
          lifetime: { kind: 'limited', durationSeconds: 5 },
          childSkill: {
            skillId: 'child',
            scheduledSequences: [],
            actionGraph: { main: { nodes: {} }, macros: {} },
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
            },
          },
        },
        dieWhenSourceDies: false,
      },
    };
    const skill = skillWithSteps([step]);

    expect(validateSkillDefinition(skill)).toEqual([]);

    (step.parameters as Record<string, unknown>).definition = {
      lifetime: { kind: 'limited', durationSeconds: -1 },
    };

    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${nodeActionPath('step-0')}.parameters.definition.lifetime.durationSeconds`,
        }),
      ]),
    );
  });

  it.each(['projectiles', undefined, 12])('投射物查询必须提供目标组名称：%s', saveToContextKey => {
    const skill = skillWithSteps([
      { kind: 'findUnfinishedProjectileTargets', parameters: { saveToContextKey } },
    ]);
    const errors = validateSkillDefinition(skill);
    if (saveToContextKey === 'projectiles') expect(errors).toEqual([]);
    else
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `${nodeActionPath('step-0')}.parameters.saveToContextKey`,
          }),
        ]),
      );
  });

  it.each(['actionSource', 'actionOwner', 'recursiveSource'])(
    '校验单层来源查询的宿主 %s',
    owner => {
      const skill = skillWithSteps([
        {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'source',
            sources: [{ kind: 'abilitySystemSource', owner }],
          },
        },
      ]);
      const errors = validateSkillDefinition(skill);
      if (owner === 'recursiveSource')
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: `${nodeActionPath('step-0')}.parameters.sources[0].owner`,
            }),
          ]),
        );
      else expect(errors).toEqual([]);
    },
  );

  it.each([false, true])('Context Buff 来源与直接来源互斥：%s', conflicting => {
    const skill = skillWithSteps([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'test',
          target: 'caster',
          sourceContextKey: 'queried',
          ...(conflicting ? { source: 'caster' } : {}),
        },
      },
    ]);
    const errors = validateSkillDefinition(skill);
    if (conflicting)
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `${nodeActionPath('step-0')}.parameters.source`,
          }),
        ]),
      );
    else expect(errors).toEqual([]);
  });

  it('validates Buff-source context targets and contextual ability-entity owners', () => {
    const second: Record<string, unknown> = {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        saveToContextKey: 'entities',
        ownerContextKey: 'source',
      },
    };
    const skill = skillWithSteps([
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'source',
          sources: [{ kind: 'target', target: 'buffSource' }],
        },
      },
      second,
    ]);

    expect(validateSkillDefinition(skill)).toEqual([]);

    (second.parameters as Record<string, unknown>).ownerContextKey = '';
    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `${nodeActionPath('step-1')}.parameters.ownerContextKey`,
        }),
      ]),
    );
  });
});

function validateBuff(definition: unknown) {
  const issues: SkillDefinitionValidationIssue[] = [];
  validateBuffDefinition(definition, 'fixture', '$.definition', issues, {
    action: validateActionGraphReference,
    scheduled: validateScheduledSequence,
    graph: (value, path, out) => out.push(...validateActionGraphActions(value, path)),
    contexts: (value, path, entries, out) => validateActionGraphContexts(value, path, entries, out),
  });
  return issues;
}
