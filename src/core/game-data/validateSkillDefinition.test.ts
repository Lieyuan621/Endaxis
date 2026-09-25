import { describe, expect, it } from 'vitest';
import { validateSkillDefinition } from './validateSkillDefinition';
import { validateAbilityEntityDefinition } from './validation/actionPrograms';

function baseSkill(): Record<string, unknown> {
  return {
    key: 'testSkill',
    timelineBlockFrames: 30,
    scheduledSequences: [
      {
        startFrame: 0,
        sequence: { steps: [] },
      },
    ],
  };
}

function damageStep(key?: string): Record<string, unknown> {
  return {
    kind: 'dealDamage',
    ...(key === undefined ? {} : { key }),
    parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
  };
}

describe('validateSkillDefinition', () => {
  it('allows an AbilityEntity passive to address its host entity directly', () => {
    const applyToHost = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'entity-monitor',
        target: 'currentAbilityEntity' as const,
        source: 'currentAbilityEntity' as const,
        definition: { stackingType: 'unique' as const },
      },
    };

    expect(
      validateAbilityEntityDefinition({
        lifetime: { kind: 'infinite' },
        passiveSkills: [
          {
            key: 'entity-passive',
            enableSequence: { steps: [applyToHost] },
            abilityEventResponses: [
              {
                event: 'addedBuff',
                priority: 0,
                sequence: { steps: [applyToHost] },
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
      const issues = validateSkillDefinition({
        ...baseSkill(),
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'finishBuffsByTag',
                  parameters: {
                    target,
                    tagQueryType: 'hasAny',
                    buffTags: ['Test/Tag'],
                    reason: 'early',
                  },
                },
              ],
            },
          },
        ],
      });
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: '$.scheduledSequences[0].sequence.steps[0].parameters.target',
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
          scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
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
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'operatorRoleIn',
                  target: 'buffOwner',
                  roles: ['guard', 'supporter'],
                },
              },
              whenTrue: { steps: [] },
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toEqual([]);
    (skill.scheduledSequences as any)[0].sequence.steps[0].parameters.condition.roles = ['medic'];
    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.scheduledSequences[0].sequence.steps[0].parameters.condition.roles[0]',
        }),
      ]),
    );
  });

  it('校验原生 TickInterval 参数并禁止与 Channeling 混用', () => {
    const skill = baseSkill();
    const parameters: Record<string, unknown> = {
      nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 },
    };
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [{ kind: 'repeatEachTick', parameters, body: { steps: [damageStep('tick')] } }],
        },
      },
    ];
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
          path: '$.scheduledSequences[0].sequence.steps[0].parameters',
        }),
      ]),
    );
  });

  it.each([undefined, 'parent', 'execution'])('接受黑板作用域生命周期 %s', lifetime => {
    const skill = {
      ...baseSkill(),
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'withActionBlackboardScope',
                parameters: {
                  scopeKey: 'callback',
                  initialValues: {},
                  inheritParent: true,
                  lifetime,
                  alwaysNext: true,
                },
                body: { steps: [] },
              },
            ],
          },
        },
      ],
    };
    expect(validateSkillDefinition(skill)).toEqual([]);
  });
  it.each([{ lifetime: 'unknown' }, { lifetime: null }, { alwaysNext: 1 }])(
    '拒绝非法黑板生命周期参数 %j',
    invalid => {
      const skill = {
        ...baseSkill(),
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    scopeKey: 'callback',
                    initialValues: {},
                    inheritParent: true,
                    ...invalid,
                  },
                  body: { steps: [] },
                },
              ],
            },
          },
        ],
      };
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
    const skill = {
      ...baseSkill(),
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'withActionBlackboardScope',
                parameters: {
                  scopeKey: 'native-callback',
                  initialValues: {},
                  inheritParent: true,
                  ...invalid,
                },
                body: { steps: [] },
              },
            ],
          },
        },
      ],
    };
    expect(validateSkillDefinition(skill)).not.toEqual([]);
  });
  it('接受只隔离控制流的共享父 Buff 黑板回调边界', () => {
    const skill = {
      ...baseSkill(),
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
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
                body: { steps: [] },
              },
            ],
          },
        },
      ],
    };
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
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
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
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(definition)).toEqual([]);

    const parameters = (
      definition.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters;
    parameters.target = 'caster';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.parameters.target') }),
    );
  });

  it('validates the evidence-backed heal target and attribute formula', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'heal',
              parameters: {
                target: 'controlledOperator',
                attribute: 'will',
                multiplier: [1, 2],
                addition: { kind: 'blackboard', key: 'base' },
                tags: ['Test/TagNegative1'],
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);
    const parameters = (
      definition.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters;
    parameters.target = 'currentAbilityEntity';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.parameters.target') }),
    );
  });

  it('validates definite healing and rejects mixing it with an attribute formula', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'heal',
              parameters: {
                target: 'controlledOperator',
                amount: { kind: 'blackboard', key: 'final_heal_value' },
                tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);
    const parameters = (
      definition.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters;
    parameters.attribute = 'will';
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({
        path: expect.stringContaining('.parameters.attribute'),
        message: 'cannot be combined with definite amount',
      }),
    );
  });

  it('只接受已知的敌人原生 rank，并允许原生空集合表达永不匹配', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'enemyRankIn', ranks: ['elite', 'boss'] } },
              whenTrue: { steps: [] },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);

    const condition = (
      definition.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: { condition: { ranks: string[] } } }> };
      }>
    )[0]!.sequence.steps[0]!.parameters.condition;
    condition.ranks = ['advanced'];
    expect(validateSkillDefinition(definition)).toContainEqual(
      expect.objectContaining({ message: 'unknown enemy rank' }),
    );
    condition.ranks = [];
    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('允许终结技仅自动忽略施法者而不配置额外对象', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'startUltimateTimeDilation',
              parameters: {
                priority: 100,
                targetScale: { kind: 'constant', value: 0 },
                ignoredTargets: [],
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('允许全局时间膨胀在执行帧排除当前主控干员', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
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
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);
  });

  it('严格校验时间膨胀中的能力实体 ID 与 Context 查询', () => {
    const definition = baseSkill();
    definition.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
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
                abilityEntityTargets: [
                  {
                    kind: 'ownerSpawned',
                    abilityEntityIds: ['abilityentity_test'],
                  },
                  { kind: 'context', contextKey: 'mirrors' },
                ],
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(definition)).toEqual([]);

    const queries = (
      definition.scheduledSequences as Array<{
        sequence: {
          steps: Array<{
            parameters: { abilityEntityTargets: Array<Record<string, unknown>> };
          }>;
        };
      }>
    )[0]!.sequence.steps[0]!.parameters.abilityEntityTargets;
    queries[0]!.abilityEntityIds = [];
    queries[1]!.contextKey = '';

    expect(validateSkillDefinition(definition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.scheduledSequences[0].sequence.steps[0].parameters.abilityEntityTargets[0].abilityEntityIds',
          message: 'expected a non-empty array',
        }),
        expect.objectContaining({
          path: '$.scheduledSequences[0].sequence.steps[0].parameters.abilityEntityTargets[1].contextKey',
          message: 'expected a non-empty string',
        }),
      ]),
    );
  });

  it('accepts a structurally valid skill', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            damageStep('hit:1'),
            {
              kind: 'modifyActionValue',
              parameters: { key: 'x', operation: 'add', value: { kind: 'constant', value: 1 } },
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toEqual([]);
  });

  it('validates named and inline time-dilation curves', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
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
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toEqual([]);

    const parameters = (
      skill.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters;
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
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.example',
                target: 'caster',
                definition: {
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
                },
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);
    const definition = (
      skill.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: { definition: Record<string, unknown> } }> };
      }>
    )[0]!.sequence.steps[0]!.parameters.definition;
    definition.presentation = { iconPath: '', color: '#fff' };
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path.endsWith('.presentation.iconPath'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.presentation.color'))).toBe(true);
  });

  it('accepts ordered inline Buff lifecycle sequences', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.lifecycle',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                definition: {
                  stackingType: 'unique',
                  lifecycleSequences: {
                    start: {
                      steps: [
                        {
                          kind: 'setContextFlag',
                          parameters: { flag: 'started', value: true, target: 'caster' },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);
  });

  it('accepts an inline Buff max stack count resolved from its application blackboard', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.dynamic-stack',
                target: 'caster',
                blackboardAssignments: { max_stack: { kind: 'constant', value: 2 } },
                definition: {
                  stackingType: 'stack',
                  maxStackCount: { blackboardKey: 'max_stack' },
                },
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);
  });

  it('requires source skill-cast identity for inline Buff lifecycle sequences', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.lifecycle-without-origin',
                target: 'caster',
                definition: {
                  stackingType: 'unique',
                  lifecycleSequences: { start: { steps: [] } },
                },
              },
            },
          ],
        },
      },
    ];

    const issues = validateSkillDefinition(skill);
    expect(
      issues.some(
        issue =>
          issue.path.endsWith('.parameters.inheritSourceSkillCastInfo') &&
          issue.message.includes('require inherited skill-cast info'),
      ),
    ).toBe(true);
  });

  it('validates inline Buff ability event responses and their sequences', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.damage-listener',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                definition: {
                  stackingType: 'unique',
                  abilityEventResponses: [
                    {
                      event: 'beforeTakeDamage',
                      priority: 3,
                      sequence: {
                        steps: [
                          {
                            kind: 'conditional',
                            parameters: {
                              condition: {
                                kind: 'eventDamageTagsMatch',
                                match: 'hasAll',
                                tags: ['normalSkill'],
                              },
                            },
                            whenTrue: { steps: [] },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);

    const response = (
      (
        skill.scheduledSequences as Array<{
          sequence: { steps: Array<{ parameters: { definition: unknown } }> };
        }>
      )[0]!.sequence.steps[0]!.parameters.definition as {
        abilityEventResponses: Array<Record<string, unknown>>;
      }
    ).abilityEventResponses[0]!;
    response.samePriorityKey = 'obsolete-ordering-hint';
    expect(
      validateSkillDefinition(skill).some(issue => issue.path.endsWith('.samePriorityKey')),
    ).toBe(true);
    delete response.samePriorityKey;
    response.event = 'unknownEvent';
    response.priority = 0.5;
    response.unknown = true;
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path.endsWith('.event'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.priority'))).toBe(true);
    expect(issues.some(issue => issue.path.endsWith('.unknown'))).toBe(true);
  });

  it('rejects old low-level actions and unknown inline Buff lifecycle names', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff.invalid-lifecycle',
                target: 'caster',
                definition: {
                  stackingType: 'unique',
                  actions: { start: [] },
                  lifecycleSequences: { update: { steps: [] } },
                },
              },
            },
          ],
        },
      },
    ];

    const issues = validateSkillDefinition(skill);
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

  it('rejects a missing damage step key', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [{ startFrame: 0, sequence: { steps: [damageStep()] } }];
    const issues = validateSkillDefinition(skill);
    expect(
      issues.some(
        issue =>
          issue.path === '$.scheduledSequences[0].sequence.steps[0]' &&
          issue.message.includes('non-empty key'),
      ),
    ).toBe(true);
  });

  it('rejects a missing key nested inside conditional branches', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'combatActive' } },
              whenTrue: { steps: [damageStep()] },
            },
          ],
        },
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(
      issues.some(
        issue =>
          issue.path === '$.scheduledSequences[0].sequence.steps[0].whenTrue.steps[0]' &&
          issue.message.includes('non-empty key'),
      ),
    ).toBe(true);
  });

  it('rejects a missing key nested inside once body', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [{ kind: 'once', parameters: { scopeKey: 's' }, body: { steps: [damageStep()] } }],
        },
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(
      issues.some(
        issue =>
          issue.path === '$.scheduledSequences[0].sequence.steps[0].once.steps[0]' &&
          issue.message.includes('non-empty key'),
      ),
    ).toBe(true);
  });

  it('rejects duplicate damage step keys anywhere in the definition', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            damageStep('dup'),
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'combatActive' } },
              whenTrue: { steps: [damageStep('dup')] },
            },
          ],
        },
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.message.includes("duplicate damage step key 'dup'"))).toBe(
      true,
    );
  });

  it.each(['unknownTrigger', 'statusExpired', 'statusConsumed'])(
    'rejects an unsupported event trigger kind: %s',
    kind => {
      const skill = baseSkill();
      skill.eventHandlers = [
        {
          key: 'handler:1',
          event: { kind, statusKey: 'status', target: 'enemy' },
          scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
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

  it('requires an explicit end frame for nested combat event listeners', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'combatActive' } },
              whenTrue: {
                steps: [
                  {
                    kind: 'listenForCombatEvents',
                    parameters: {
                      responses: [
                        {
                          key: 'response',
                          event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                          sequence: { steps: [] },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].endFrame',
      message: 'combat event listeners require an end frame',
    });
  });

  it('rejects an event trigger with an invalid scope', () => {
    const skill = baseSkill();
    skill.eventHandlers = [
      {
        key: 'handler:1',
        event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'all' },
        scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(issues.some(issue => issue.path === '$.eventHandlers[0].event.scope')).toBe(true);
  });

  it('rejects invalid LevelValues: NaN and empty array', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [damageStep('hit:1')],
        },
      },
    ];
    // 攻击倍率传 NaN
    const skillA = structuredClone(skill) as Record<string, unknown>;
    const stepsA = skillA.scheduledSequences as Array<{
      sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
    }>;
    stepsA[0]!.sequence.steps[0]!.parameters.attackScale = Number.NaN;
    expect(
      validateSkillDefinition(skillA).some(
        issue => issue.path === '$.scheduledSequences[0].sequence.steps[0].parameters.attackScale',
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
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: { steps: [damageStep('hit:1')] },
      },
    ];
    const tagsStep = skill.scheduledSequences as Array<{
      sequence: { steps: Array<{ parameters: { tags: string[] } }> };
    }>;
    tagsStep[0]!.sequence.steps[0]!.parameters.tags = ['unknownTag'];
    expect(
      validateSkillDefinition(skill).some(
        issue => issue.path === '$.scheduledSequences[0].sequence.steps[0].parameters.tags[0]',
      ),
    ).toBe(true);
  });

  it('rejects unknown combat step kind', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: { steps: [{ kind: 'unknownStep', parameters: {} }] },
      },
    ];
    expect(
      validateSkillDefinition(skill).some(
        issue =>
          issue.path === '$.scheduledSequences[0].sequence.steps[0].kind' &&
          issue.message.includes('unknown combat step'),
      ),
    ).toBe(true);
  });

  it('requires an entity iteration target for AbilityEntity finish operations', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: { steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }] },
      },
    ];

    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].sequence.steps[0]',
      message: 'requires a forEachContextTarget body',
    });

    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: 'entities' },
              body: {
                steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }],
              },
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toEqual([]);

    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [{ kind: 'finishCurrentAbilityEntityWhenSourceDies', parameters: {} }],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].sequence.steps[0]',
      message: 'requires a forEachContextTarget body',
    });
  });

  it('allows current AbilityEntity Buff application only inside an entity target scope', () => {
    const apply = {
      kind: 'applyBuff' as const,
      parameters: {
        buffId: 'entity-monitor',
        target: 'currentAbilityEntity' as const,
        source: 'currentAbilityEntity' as const,
        definition: { stackingType: 'unique' as const },
      },
    };
    const skill = baseSkill();
    skill.scheduledSequences = [{ startFrame: 0, sequence: { steps: [apply] } }];
    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].sequence.steps[0]',
      message: 'currentAbilityEntity target requires a forEachContextTarget body',
    });
    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].sequence.steps[0]',
      message: 'currentAbilityEntity source requires a forEachContextTarget body',
    });

    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: 'entities' },
              body: { steps: [apply] },
            },
          ],
        },
      },
    ];
    expect(validateSkillDefinition(skill)).toEqual([]);
  });

  it('rejects mixing a lightweight damage modifier condition with a condition program', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'mixed-condition',
                target: 'caster',
                definition: {
                  stackingType: 'unique',
                  damageModifiers: [
                    {
                      enabledSide: 'attacker',
                      condition: { kind: 'combatActive' },
                      conditionProgram: { steps: [] },
                      processors: [],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toContainEqual({
      path: '$.scheduledSequences[0].sequence.steps[0].parameters.definition.damageModifiers[0]',
      message: 'cannot define both condition and conditionProgram',
    });
  });

  it('rejects conditional without whenTrue', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [{ kind: 'conditional', parameters: { condition: { kind: 'combatActive' } } }],
        },
      },
    ];
    const issues = validateSkillDefinition(skill);
    expect(
      issues.some(issue => issue.path === '$.scheduledSequences[0].sequence.steps[0].whenTrue'),
    ).toBe(true);
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
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'changeResource',
              parameters: {
                resource: 'ultimateEnergy',
                amount: 10,
                recipient: 'caster',
                spGainSource: 'normalAttack',
              },
            },
          ],
        },
      },
    ];
    expect(
      validateSkillDefinition(skill).some(
        issue => issue.path === '$.scheduledSequences[0].sequence.steps[0].parameters.spGainSource',
      ),
    ).toBe(true);
  });

  it('validates a dynamic resource coefficient as an action value operand', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'changeResourceByActionValue',
              parameters: {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'refundAmount' },
                coefficient: { kind: 'blackboard', key: 'targetCount' },
                recipient: 'team',
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);

    const coefficient = (
      skill.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters.coefficient as Record<string, unknown>;
    coefficient.key = '';

    expect(
      validateSkillDefinition(skill).some(
        issue =>
          issue.path === '$.scheduledSequences[0].sequence.steps[0].parameters.coefficient.key',
      ),
    ).toBe(true);
  });

  it('validates the inline AbilityEntity definition at its spawn site', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'spawnAbilityEntity',
              parameters: {
                abilityEntityId: 'fixture',
                definition: {
                  lifetime: { kind: 'limited', durationSeconds: 5 },
                  childSkill: {
                    skillId: 'child',
                    scheduledSequences: [],
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
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);

    const parameters = (
      skill.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps[0]!.parameters;
    parameters.definition = {
      lifetime: { kind: 'limited', durationSeconds: -1 },
    };

    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.scheduledSequences[0].sequence.steps[0].parameters.definition.lifetime.durationSeconds',
        }),
      ]),
    );
  });

  it.each(['projectiles', undefined, 12])('投射物查询必须提供目标组名称：%s', saveToContextKey => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [{ kind: 'findUnfinishedProjectileTargets', parameters: { saveToContextKey } }],
        },
      },
    ];
    const errors = validateSkillDefinition(skill);
    if (saveToContextKey === 'projectiles') expect(errors).toEqual([]);
    else
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: '$.scheduledSequences[0].sequence.steps[0].parameters.saveToContextKey',
          }),
        ]),
      );
  });

  it.each(['actionSource', 'actionOwner', 'recursiveSource'])(
    '校验单层来源查询的宿主 %s',
    owner => {
      const skill = baseSkill();
      skill.scheduledSequences = [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'mergeContextTargets',
                parameters: {
                  saveToContextKey: 'source',
                  sources: [{ kind: 'abilitySystemSource', owner }],
                },
              },
            ],
          },
        },
      ];
      const errors = validateSkillDefinition(skill);
      if (owner === 'recursiveSource')
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: '$.scheduledSequences[0].sequence.steps[0].parameters.sources[0].owner',
            }),
          ]),
        );
      else expect(errors).toEqual([]);
    },
  );

  it.each([false, true])('Context Buff 来源与直接来源互斥：%s', conflicting => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'test',
                target: 'caster',
                sourceContextKey: 'queried',
                ...(conflicting ? { source: 'caster' } : {}),
              },
            },
          ],
        },
      },
    ];
    const errors = validateSkillDefinition(skill);
    if (conflicting)
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: '$.scheduledSequences[0].sequence.steps[0].parameters.source',
          }),
        ]),
      );
    else expect(errors).toEqual([]);
  });

  it('validates Buff-source context targets and contextual ability-entity owners', () => {
    const skill = baseSkill();
    skill.scheduledSequences = [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'mergeContextTargets',
              parameters: {
                saveToContextKey: 'source',
                sources: [{ kind: 'target', target: 'buffSource' }],
              },
            },
            {
              kind: 'findOwnerSpawnedAbilityEntities',
              parameters: {
                saveToContextKey: 'entities',
                ownerContextKey: 'source',
              },
            },
          ],
        },
      },
    ];

    expect(validateSkillDefinition(skill)).toEqual([]);

    const steps = (
      skill.scheduledSequences as Array<{
        sequence: { steps: Array<{ parameters: Record<string, unknown> }> };
      }>
    )[0]!.sequence.steps;
    steps[1]!.parameters.ownerContextKey = '';
    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.scheduledSequences[0].sequence.steps[1].parameters.ownerContextKey',
        }),
      ]),
    );
  });
});
