import { describe, expect, it } from 'vitest';
import type { CompiledSkillProgram, ResolvedActionSequence } from '../../compiler/combatProgram';
import type { CombatOperatorProgram } from './combatRuntimeAssembly';
import { compileOperatorBuffDefinitions } from '../../compiler/compileSkill';
import {
  assertStandardPlayerDamageCompatibility,
  inspectStandardPlayerDamageCompatibility,
  StandardPlayerDamageCompatibilityError,
} from './standardPlayerDamageCompatibility';

function program(sequence: ResolvedActionSequence): CompiledSkillProgram {
  return {
    operatorId: 'operator:1',
    skillGroupKey: 'battleSkill',
    skillId: 'battle-skill',
    skillType: 'battleSkill',
    skillLevel: 1,
    initialBlackboard: {},
    timelineBlockFrames: 1,
    costs: [],
    timelineActions: [{ startFrame: 0, sequence }],
  };
}

function operator(
  sequence: ResolvedActionSequence,
  equipmentEventHandlerCount = 0,
  withPanel = false,
): CombatOperatorProgram {
  return {
    operatorId: 'operator:1',
    skills: [program(sequence)],
    ...(withPanel
      ? {
          panel: {
            operatorId: 'operator:1',
            level: 1,
            attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
            attack: 700,
            attackBeforeAttributeScalar: 700,
            mainAttribute: 'intellect' as const,
            secondaryAttribute: 'will' as const,
            health: 5000,
            defense: 0,
            criticalRate: 0.15,
            criticalDamage: 0.6,
            artsIntensity: 0,
            ultimateEnergyGainEfficiency: 1,
            skillCooldownReduction: 0,
            staggerDamagePercent: 0,
            combatModifiers: [],
            receipt: [],
          },
        }
      : {}),
    equipmentContributions:
      equipmentEventHandlerCount === 0
        ? []
        : [
            {
              source: { kind: 'gearSet', slug: 'gear-set' },
              selectedLevel: 1,
              modifiers: [],
              eventHandlers: Array.from({ length: equipmentEventHandlerCount }, (_, index) => ({
                key: `handler:${index}`,
                event: {
                  kind: 'damageTagHit' as const,
                  tag: 'normalSkill' as const,
                  scope: 'operator' as const,
                },
                sequence: { steps: [] },
              })),
            },
          ],
  };
}

function compatibilityInput(
  entry: CombatOperatorProgram,
  endFrame = 100,
  supportsElementalInfliction = false,
): Parameters<typeof inspectStandardPlayerDamageCompatibility>[0] {
  return {
    operators: [entry],
    inputs: [{ frame: 0, operatorId: 'operator:1', skillId: 'battle-skill' }],
    endFrame,
    ...(supportsElementalInfliction ? { supportsElementalInfliction: true } : {}),
  };
}

describe('standardPlayerDamageCompatibility', () => {
  it('accepts the native skill-local Dash window marker in a scheduled skill', () => {
    expect(
      inspectStandardPlayerDamageCompatibility(
        compatibilityInput(
          operator({ steps: [{ kind: 'markCurrentSkillCanDash', parameters: {} }] }),
        ),
      ),
    ).toEqual([]);
  });

  it('admits ultimate recovery restrictions handled by the assembled resource executor', () => {
    expect(
      inspectStandardPlayerDamageCompatibility(
        compatibilityInput(
          operator({
            steps: [
              {
                kind: 'restrictUltimateEnergyRecovery',
                parameters: {
                  target: 'caster',
                  allowedRecoveryTags: [],
                  clearUltimateEnergyOnEnd: true,
                },
              },
            ],
          }),
        ),
      ),
    ).toEqual([]);
  });

  it('已内嵌配置列可执行；强化列仍要求来源面板', () => {
    const sequence = (enhanced: boolean): ResolvedActionSequence => ({
      steps: [
        {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                storeKey: 'scale',
                column: { kind: 'constant', value: 1 },
                values: [2],
                ...(enhanced
                  ? {
                      enhance: {
                        target: 'caster' as const,
                        formula: { kind: 'linear' as const, paramA: 1 },
                      },
                    }
                  : {}),
              },
            ],
          },
        },
      ],
    });
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence(false)))),
    ).toEqual([]);
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence(true)))),
    ).toContainEqual(
      expect.objectContaining({ detail: expect.stringContaining('resolved operator panel') }),
    );
    expect(
      inspectStandardPlayerDamageCompatibility(
        compatibilityInput(operator(sequence(true), 0, true)),
      ),
    ).toEqual([]);
  });
  it('普通倒地必须有显式装配、来源面板和隐式 Buff，不能漏过 Buff 内行为', () => {
    const sequence: ResolvedActionSequence = {
      steps: [
        {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'constant', value: 1 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
      ],
    };
    const entry = {
      ...operator(sequence, 0, true),
      buffDefinitions: compileOperatorBuffDefinitions({
        buff_physical_knockdown: { stackingType: 'refresh', durationSeconds: 2 },
        buff_physical_no_guard: { stackingType: 'refresh', durationSeconds: 2 },
      }),
    };
    expect(inspectStandardPlayerDamageCompatibility(compatibilityInput(entry))).toEqual([
      expect.objectContaining({ detail: expect.stringContaining('root knock-down') }),
    ]);
    const input = { ...compatibilityInput(entry), supportsKnockDown: true };
    expect(inspectStandardPlayerDamageCompatibility(input)).toEqual([]);
    const missing = inspectStandardPlayerDamageCompatibility({
      ...input,
      operators: [{ ...entry, panel: undefined, buffDefinitions: {} }],
    });
    expect(missing).toHaveLength(3);
    expect(missing.map(issue => issue.detail).join('\n')).toContain('attribute panel');
    const unrelated = compileOperatorBuffDefinitions({
      bad: {
        stackingType: 'unique',
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: { damageType: 'lifeDrain', attackScale: 1, tags: [] },
                },
              ],
            },
          },
        ],
      },
    });
    expect(
      inspectStandardPlayerDamageCompatibility({
        ...input,
        operators: [{ ...entry, buffDefinitions: { ...entry.buffDefinitions, ...unrelated } }],
      }),
    ).toEqual([]);
    const unsupportedRoot = compileOperatorBuffDefinitions({
      buff_physical_knockdown: {
        stackingType: 'unique',
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: { damageType: 'lifeDrain', attackScale: 1, tags: [] },
                },
              ],
            },
          },
        ],
      },
    });
    expect(
      inspectStandardPlayerDamageCompatibility({
        ...input,
        operators: [
          { ...entry, buffDefinitions: { ...entry.buffDefinitions, ...unsupportedRoot } },
        ],
      }),
    ).toEqual([expect.objectContaining({ code: 'unsupported-damage-calculation' })]);
  });
  it('Switch 不会隐藏未选分支的不兼容行为，报告包含候选路径', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'switch',
              parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
              options: [
                { value: { kind: 'constant', value: 0 }, sequence: { steps: [] } },
                {
                  value: { kind: 'constant', value: 1 },
                  sequence: {
                    steps: [
                      {
                        kind: 'changeResource',
                        parameters: { resource: 'sp', recipient: 'caster', amount: 1 },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      ),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]!.path).toContain('.options[1].sequence.steps[0]');
  });

  it('递归检查 repeatByActionValue 的动作体，不把运行时已支持的容器误报为未支持', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'repeatByActionValue',
              parameters: { count: { kind: 'constant', value: 2 } },
              body: {
                steps: [
                  {
                    kind: 'dealDamage',
                    parameters: { damageType: 'electric', attackScale: 1, tags: [] },
                  },
                ],
              },
            },
          ],
        }),
      ),
    );

    expect(issues).toEqual([]);
  });

  it('允许技能动作上下文读取既有 Buff 黑板并参与条件判断', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'buffBlackboardValueCompare',
                  target: 'caster',
                  query: { kind: 'id', buffIds: ['buff:test'] },
                  desiredKey: 'enabled',
                  outputKey: 'enabled',
                  operator: 'greater',
                  value: { kind: 'constant', value: 0 },
                },
              },
              whenTrue: { steps: [] },
            },
          ],
        }),
      ),
    );
    expect(issues).toEqual([]);
  });

  it('accepts current-cast Buff lifetime with context binding checked at execution', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff:attached',
                target: 'caster',
                lifetimeOwner: 'currentCastSkill',
              },
            },
          ],
        }),
      ),
    );
    expect(issues).toEqual([]);
  });
  it('accepts the closed standard damage, Buff, poise, infliction, action value and resource subset', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'modifyActionValue',
              parameters: {
                key: 'scale',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              },
            },
            {
              kind: 'dealDamage',
              parameters: {
                damageType: 'electric',
                attackScale: { kind: 'blackboard', key: 'scale' },
                tags: ['normalSkill'],
                stagger: 10,
              },
            },
            { kind: 'dealStagger', parameters: { value: 10 } },
            {
              kind: 'applyElementalInfliction',
              parameters: { element: 'electric', isExtra: false },
            },
            {
              kind: 'applyPhysicalInfliction',
              parameters: {
                type: 'fracture',
                target: 'enemy',
                isExtra: false,
                noGuardBuffId: 'buff:no-guard',
                noGuardDefinition: {
                  stackingType: 'stack',
                  priority: 0,
                  maxStackCount: 1,
                },
                fractureBuffId: 'buff:fracture',
                fractureDefinition: {
                  stackingType: 'stack',
                  priority: 0,
                  maxStackCount: 1,
                },
              },
            },
            {
              kind: 'applyElementalReaction',
              parameters: {
                reaction: 'electrification',
                target: 'enemy',
                durationSeconds: 5,
                effectiveness: 1,
              },
            },
            {
              kind: 'consumeElementalReaction',
              parameters: { reaction: 'electrification', target: 'enemy' },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'entityTagMatch',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  tags: ['Skill/Character/Common/SpellStatus/Conduct'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff:inline',
                      target: 'caster',
                      definition: {
                        stackingType: 'stack',
                        priority: 0,
                        maxStackCount: 1,
                        lifecycleSequences: {
                          enhanceChanged: {
                            steps: [
                              {
                                kind: 'finishBuffsById',
                                parameters: {
                                  target: 'caster',
                                  buffIds: ['buff:old'],
                                  reason: 'other',
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsByTag',
                    parameters: {
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                      reason: 'early',
                    },
                  },
                ],
              },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'elementalReactionActive',
                  reaction: 'electrification',
                  minimumLevel: 1,
                },
              },
              whenTrue: { steps: [] },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'all',
                  conditions: [
                    {
                      kind: 'eventDamageTagsMatch',
                      match: 'hasAny',
                      tags: ['normalAttackLastCombo'],
                    },
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot'],
                    },
                  ],
                },
              },
              whenTrue: { steps: [] },
            },
            {
              kind: 'createTimedMarker',
              parameters: {
                markerId: 'marker',
                target: 'enemy',
                durationSeconds: { kind: 'constant', value: 1 },
                autoFinishByAction: false,
              },
            },
            {
              kind: 'changeResource',
              parameters: { resource: 'sp', recipient: 'team', amount: 10 },
            },
            {
              kind: 'changeResource',
              parameters: { resource: 'ultimateEnergy', recipient: 'caster', amount: 10 },
            },
            {
              kind: 'dealDamage',
              parameters: {
                damageType: 'electric',
                calculation: 'breakingAttack',
                calculationMultiplier: 1,
                attackScale: 9,
                tags: ['powerAttack'],
              },
            },
            { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
            {
              kind: 'startTimeDilation',
              parameters: {
                scope: 'global',
                durationSeconds: { kind: 'constant', value: 1 },
                slot: 'Test/TimeSlot1',
                priority: 1,
                curve: { kind: 'named', key: 'ComboSkill' },
                finishByAction: false,
                ignoredTargets: ['caster'],
              },
            },
            {
              kind: 'startUltimateTimeDilation',
              parameters: {
                priority: 1,
                targetScale: { kind: 'constant', value: 0 },
                ignoredTargets: [],
              },
            },
          ],
        }),
        100,
        true,
      ),
    );

    expect(issues).toEqual([]);
  });

  it('accepts operator healing and health checks only when runtime vitals are assembled', () => {
    const sequence: ResolvedActionSequence = {
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'buffSource',
            attribute: 'will',
            multiplier: { kind: 'constant', value: 1 },
            addition: 0,
            tags: [],
          },
        },
        {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'healthCompare',
              target: 'buffSource',
              valueType: 'ratio',
              operator: 'less',
              value: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { steps: [] },
        },
      ],
    };

    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence, 0, true))),
    ).toEqual([]);
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence))).map(
        issue => issue.code,
      ),
    ).toEqual(['unsupported-step', 'unsupported-condition']);
  });

  it('accepts source attribute snapshots only with a resolved operator panel', () => {
    const sequence: ResolvedActionSequence = {
      steps: [
        {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'will',
          },
        },
      ],
    };

    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence, 0, true))),
    ).toEqual([]);
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence))).map(
        issue => issue.code,
      ),
    ).toEqual(['unsupported-step']);
  });

  it('recursively reports unsupported branches and nested conditions in stable order', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'all',
                  conditions: [
                    { kind: 'combatActive' },
                    {
                      kind: 'not',
                      condition: { kind: 'skillBranchEnabled', branchKey: 'unsupported' },
                    },
                  ],
                },
              },
              whenTrue: { steps: [] },
              whenFalse: {
                steps: [
                  {
                    kind: 'once',
                    parameters: { scopeKey: 'nested' },
                    body: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff:inline',
                            target: 'enemy',
                            definition: {
                              stackingType: 'stack',
                              priority: 0,
                              maxStackCount: 1,
                              lifecycleSequences: {
                                enable: {
                                  steps: [
                                    {
                                      kind: 'setContextFlag',
                                      parameters: {
                                        flag: 'unsupported-nested-operation',
                                        value: true,
                                        target: 'caster',
                                      },
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
                ],
              },
            },
          ],
        }),
      ),
    );

    expect(issues.map(issue => issue.code)).toEqual(['unsupported-condition', 'unsupported-step']);
    expect(issues[0]?.path).toContain('.parameters.condition.conditions[1].condition');
    expect(issues[1]?.path).toContain(
      '.whenFalse.steps[0].body.steps[0].parameters.definition.lifecycleSequences.enable.steps[0]',
    );
  });

  it('does not reject unsupported skills that cannot run before the requested end frame', () => {
    const entry = operator({
      steps: [{ kind: 'applyBuff', parameters: { buffId: 'buff:missing', target: 'enemy' } }],
    });

    expect(
      inspectStandardPlayerDamageCompatibility({
        operators: [entry],
        inputs: [{ frame: 11, operatorId: 'operator:1', skillId: 'battle-skill' }],
        endFrame: 10,
      }),
    ).toEqual([]);
  });

  it('checks each submitted cast program independently from the fixed definition and other casts', () => {
    const unsupported = program({
      steps: [
        { kind: 'applyElementalInfliction', parameters: { element: 'heat', isExtra: false } },
      ],
    });
    const supported = program({ steps: [] });
    const entry: CombatOperatorProgram = {
      operatorId: 'operator:1',
      skills: [],
      definitionSkillPrograms: [unsupported],
      skillCasts: [
        { castId: 'safe', program: supported },
        {
          castId: 'delayed',
          program: {
            ...unsupported,
            timelineActions: unsupported.timelineActions.map(action => ({
              ...action,
              startFrame: 20,
            })),
          },
        },
      ],
    };
    const inputs = [
      { frame: 0, operatorId: 'operator:1', skillId: 'battle-skill', castId: 'safe' },
      { frame: 30, operatorId: 'operator:1', skillId: 'battle-skill', castId: 'delayed' },
    ];
    expect(
      inspectStandardPlayerDamageCompatibility({ operators: [entry], inputs, endFrame: 40 }),
    ).toEqual([]);
    expect(
      inspectStandardPlayerDamageCompatibility({ operators: [entry], inputs, endFrame: 50 }).map(
        issue => issue.code,
      ),
    ).toEqual(['unsupported-step']);
    expect(
      inspectStandardPlayerDamageCompatibility({
        operators: [entry],
        inputs: [
          { frame: 0, operatorId: 'operator:1', skillId: 'battle-skill', castId: 'default' },
        ],
        endFrame: 0,
      }).map(issue => issue.code),
    ).toEqual(['unsupported-step']);
  });

  it('does not inspect a scheduled skill action that starts after the requested end frame', () => {
    const base = operator({ steps: [] });
    const entry: CombatOperatorProgram = {
      ...base,
      skills: [
        {
          ...base.skills[0]!,
          timelineActions: [
            {
              startFrame: 20,
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: { buffId: 'buff:missing', target: 'enemy' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(
      inspectStandardPlayerDamageCompatibility({
        operators: [entry],
        inputs: [{ frame: 1, operatorId: 'operator:1', skillId: 'battle-skill' }],
        endFrame: 10,
      }),
    ).toEqual([]);
  });

  it('reports every unsupported damage field and resource combination', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator(
          {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'lifeDrain',
                  calculation: 'breakingAttack',
                  attackScale: 1,
                  calculationMultiplier: 2,
                  tags: [],
                  attackScalePerStatusStack: {
                    statusKey: 'marked',
                    target: 'enemy',
                    coefficient: 0.1,
                  },
                },
              },
              {
                kind: 'changeResource',
                parameters: { resource: 'sp', recipient: 'caster', amount: 1 },
              },
            ],
          },
          1,
        ),
      ),
    );

    expect(issues.map(issue => issue.code)).toEqual([
      'unsupported-damage-calculation',
      'unsupported-damage-field',
      'unsupported-resource-change',
    ]);
  });

  it('checks equipment handler conditions and steps instead of rejecting all listeners', () => {
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator({ steps: [] }, 1))),
    ).toEqual([]);

    const entry = operator({ steps: [] }, 1);
    const contribution = entry.equipmentContributions![0]!;
    const handler = contribution.eventHandlers[0]!;
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput({
        ...entry,
        equipmentContributions: [
          {
            ...contribution,
            eventHandlers: [
              {
                ...handler,
                sequence: {
                  steps: [
                    {
                      kind: 'dealDamage',
                      parameters: {
                        damageType: 'electric',
                        attackScale: 1,
                        tags: ['normalSkill'],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    );
    expect(issues).toEqual([]);
  });

  it('rejects elemental infliction without an installed infliction document', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            { kind: 'applyElementalInfliction', parameters: { element: 'heat', isExtra: false } },
          ],
        }),
      ),
    );

    expect(issues.map(issue => issue.code)).toEqual(['unsupported-step']);
    expect(issues[0]?.detail).toContain('infliction document');
  });

  it('accepts detached projectile finish callbacks when their body is compatible', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator({
          steps: [
            {
              kind: 'scheduleProjectileFinishCallback',
              parameters: { delaySeconds: 0.1, recycleDelaySeconds: 0 },
              callback: {
                skillId: 'callback',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: {
                    resource: 'ultimateEnergy',
                    value: 0,
                    availabilityThreshold: 0,
                  },
                },
                initialBlackboard: {},
                timelineActions: [
                  {
                    startFrame: 0,
                    endFrame: 0,
                    sequence: {
                      steps: [
                        {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: 1,
                            recipient: 'team',
                            spGainKind: 'gain',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }),
      ),
    );

    expect(issues).toEqual([]);
  });

  it('throws one aggregate error containing all issues', () => {
    const operators = [
      operator({
        steps: [
          { kind: 'dealStagger', parameters: { value: 10 } },
          {
            kind: 'applyBuff',
            parameters: { buffId: 'buff:missing', target: 'enemy' },
          },
          { kind: 'setContextFlag', parameters: { flag: 'ready', value: true, target: 'caster' } },
        ],
      }),
    ];

    try {
      assertStandardPlayerDamageCompatibility({
        operators,
        inputs: [{ frame: 0, operatorId: 'operator:1', skillId: 'battle-skill' }],
        endFrame: 1,
      });
      throw new Error('expected compatibility assertion to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(StandardPlayerDamageCompatibilityError);
      expect((error as StandardPlayerDamageCompatibilityError).issues).toHaveLength(1);
    }
  });
});
