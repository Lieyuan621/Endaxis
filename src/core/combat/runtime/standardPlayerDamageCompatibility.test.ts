import { describe, expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { CompiledSkillProgram, ResolvedActionSequence } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import type { CombatOperatorProgram } from './combatRuntimeAssembly';
import { inspectStandardPlayerDamageCompatibility } from './standardPlayerDamageCompatibility';

const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: Record<string, ActionGraphNode>,
  dataNodes: ActionGraphDefinition['dataNodes'] = {},
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes, dataNodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

const chainEntry = (
  revision: string,
  actions: readonly ActionGraphStep[],
  dataNodes: ActionGraphDefinition['dataNodes'] = {},
): ResolvedActionSequence => {
  const nodes: Record<string, ActionGraphNode> = {};
  actions.forEach((action, index) => {
    nodes[`step-${index}`] = {
      action,
      next: index + 1 < actions.length ? `step-${index + 1}` : null,
    };
  });
  return compileGraphEntry(revision, actions.length === 0 ? null : 'step-0', nodes, dataNodes);
};

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
                sequence: chainEntry('equipment-handler-empty', []),
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
          operator(
            chainEntry('compat-dash-marker', [{ kind: 'markCurrentSkillCanDash', parameters: {} }]),
          ),
        ),
      ),
    ).toEqual([]);
  });

  it('admits ultimate recovery restrictions handled by the assembled resource executor', () => {
    expect(
      inspectStandardPlayerDamageCompatibility(
        compatibilityInput(
          operator(
            chainEntry('compat-restrict-ultimate', [
              {
                kind: 'restrictUltimateEnergyRecovery',
                parameters: {
                  target: 'caster',
                  allowedRecoveryTags: [],
                  clearUltimateEnergyOnEnd: true,
                },
              },
            ]),
          ),
        ),
      ),
    ).toEqual([]);
  });

  it('已内嵌配置列可执行；强化列仍要求来源面板', () => {
    const sequence = (enhanced: boolean): ResolvedActionSequence =>
      chainEntry(`compat-read-setting-${enhanced}`, [
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
      ]);
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
    const sequence: ResolvedActionSequence = chainEntry('compat-knockdown-root', [
      {
        kind: 'applyPhysicalInfliction',
        parameters: {
          type: 'knockDown' as const,
          target: 'enemy',
          duration: { kind: 'constant', value: 1 },
          force: false,
          isExtra: false,
          targetFilter: 'aliveOnly',
          returnWhen: 'always',
        },
      },
    ]);
    const entry = {
      ...operator(sequence, 0, true),
      buffDefinitions: {
        buff_physical_knockdown: { stackingType: 'refresh' as const, durationSeconds: 2 },
        buff_physical_no_guard: { stackingType: 'refresh' as const, durationSeconds: 2 },
      },
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
    const unrelated = {
      bad: {
        stackingType: 'unique' as const,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: chainEntry('compat-knockdown-unrelated', [
              {
                kind: 'dealDamage',
                parameters: { damageType: 'lifeDrain', attackScale: 1, tags: [] },
              },
            ]),
          },
        ],
      },
    };
    expect(
      inspectStandardPlayerDamageCompatibility({
        ...input,
        operators: [{ ...entry, buffDefinitions: { ...entry.buffDefinitions, ...unrelated } }],
      }),
    ).toEqual([]);
    const unsupportedRoot = {
      buff_physical_knockdown: {
        stackingType: 'unique' as const,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: chainEntry('compat-knockdown-buff-root', [
              {
                kind: 'dealDamage',
                parameters: { damageType: 'lifeDrain', attackScale: 1, tags: [] },
              },
            ]),
          },
        ],
      },
    };
    expect(
      inspectStandardPlayerDamageCompatibility({
        ...input,
        operators: [
          { ...entry, buffDefinitions: { ...entry.buffDefinitions, ...unsupportedRoot } },
        ],
      }),
    ).toEqual([expect.objectContaining({ code: 'unsupported-damage-calculation' })]);
  });
  it.each(['once', 'enter', 'exit'] as const)('检查 %s 回调中的不支持行为', port => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator(
          compileGraphEntry('compat-once-body', 'once', {
            once: {
              action:
                port === 'once'
                  ? {
                      kind: 'once',
                      parameters: {},
                      body: { $sequence: 'once-body' },
                    }
                  : {
                      kind: 'aura',
                      parameters: {
                        targets: { kind: 'characterTeam', excludeOwner: false },
                        buffs: [],
                      },
                      onEnter: { $sequence: port === 'enter' ? 'once-body' : null },
                      onExit: { $sequence: port === 'exit' ? 'once-body' : null },
                    },
              next: null,
            },
            'once-body': {
              action: {
                kind: 'dealDamage',
                parameters: { damageType: 'lifeDrain', attackScale: 1, tags: [] },
              },
              next: null,
            },
          }),
        ),
      ),
    );

    expect(issues).toEqual([expect.objectContaining({ code: 'unsupported-damage-calculation' })]);
  });

  it('允许技能动作上下文读取既有 Buff 黑板并参与条件判断', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator(
          compileGraphEntry(
            'compat-buff-blackboard-compare',
            'branch',
            {
              branch: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'input_1' },
                  },
                  whenTrue: { $sequence: null },
                },
                next: null,
              },
            },
            {
              input_1: {
                type: 'boolean',
                expression: {
                  kind: 'buffBlackboardValueCompare',
                  target: 'caster',
                  query: { kind: 'id', buffIds: ['buff:test'] },
                  desiredKey: 'enabled',
                  outputKey: 'enabled',
                  operator: 'greater',
                  value: { kind: 'constant', value: 0 },
                },
              },
            },
          ),
        ),
      ),
    );
    expect(issues).toEqual([]);
  });

  it('accepts current-cast Buff lifetime with context binding checked at execution', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator(
          chainEntry('compat-current-cast-buff', [
            {
              kind: 'applyBuff',
              parameters: {
                buffs: [{ buffId: 'buff:attached' }],
                targets: { kind: 'fixed', target: 'caster' },
                lifetimeOwner: 'currentCastSkill',
              },
            },
          ]),
        ),
      ),
    );
    expect(issues).toEqual([]);
  });
  it('accepts operator healing and health checks only when runtime vitals are assembled', () => {
    const healStep: ActionGraphStep = {
      kind: 'heal',
      parameters: {
        target: 'buffSource',
        attribute: 'will',
        multiplier: { kind: 'constant', value: 1 },
        addition: 0,
        tags: [],
      },
    };
    const sequence: ResolvedActionSequence = compileGraphEntry(
      'compat-heal-check',
      'step-0',
      {
        'step-0': { action: healStep, next: 'step-1' },
        'step-1': {
          action: {
            kind: 'conditional',
            parameters: {
              condition: { kind: 'conditionNode', nodeId: 'input_1' },
            },
            whenTrue: { $sequence: null },
          },
          next: null,
        },
      },
      {
        input_1: {
          type: 'boolean',
          expression: {
            kind: 'healthCompare',
            target: { kind: 'source' },
            valueType: 'ratio',
            operator: 'less',
            value: { kind: 'constant', value: 1 },
          },
        },
      },
    );

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
    const sequence: ResolvedActionSequence = chainEntry('compat-source-attribute', [
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
    ]);

    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence, 0, true))),
    ).toEqual([]);
    expect(
      inspectStandardPlayerDamageCompatibility(compatibilityInput(operator(sequence))).map(
        issue => issue.code,
      ),
    ).toEqual(['unsupported-step']);
  });

  it('does not reject unsupported skills that cannot run before the requested end frame', () => {
    const entry = operator(
      chainEntry('compat-missing-buff', [
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff:missing' }],
            targets: { kind: 'fixed', target: 'enemy' },
          },
        },
      ]),
    );

    expect(
      inspectStandardPlayerDamageCompatibility({
        operators: [entry],
        inputs: [{ frame: 11, operatorId: 'operator:1', skillId: 'battle-skill' }],
        endFrame: 10,
      }),
    ).toEqual([]);
  });

  it('checks each submitted cast program independently from the fixed definition and other casts', () => {
    const unsupported = program(
      chainEntry('compat-cast-unsupported', [
        { kind: 'applyElementalInfliction', parameters: { element: 'heat', isExtra: false } },
      ]),
    );
    const supported = program(chainEntry('compat-cast-supported', []));
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
    const base = operator(chainEntry('compat-late-base', []));
    const entry: CombatOperatorProgram = {
      ...base,
      skills: [
        {
          ...base.skills[0]!,
          timelineActions: [
            {
              startFrame: 20,
              sequence: chainEntry('compat-late-action', [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff:missing' }],
                    targets: { kind: 'fixed', target: 'enemy' },
                  },
                },
              ]),
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
          chainEntry('compat-damage-fields', [
            {
              kind: 'dealDamage',
              parameters: {
                damageType: 'lifeDrain',
                calculation: 'breakingAttack',
                attackScale: 1,
                calculationMultiplier: 2,
                tags: [],
              },
            },
            {
              kind: 'changeResource',
              parameters: {
                resource: 'sp',
                source: { kind: 'fixed', target: 'caster' },
                targets: { kind: 'fixed', target: 'caster' },
                amount: 1,
              },
            },
          ]),
          1,
        ),
      ),
    );

    expect(issues.map(issue => issue.code)).toEqual(['unsupported-damage-calculation']);
  });

  it('checks equipment handler conditions and steps instead of rejecting all listeners', () => {
    expect(
      inspectStandardPlayerDamageCompatibility(
        compatibilityInput(operator(chainEntry('compat-equipment-empty', []), 1)),
      ),
    ).toEqual([]);

    const entry = operator(chainEntry('compat-equipment-base', []), 1);
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
                sequence: chainEntry('compat-equipment-deal-damage', [
                  {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'electric',
                      attackScale: 1,
                      tags: ['normalSkill'],
                    },
                  },
                ]),
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
        operator(
          chainEntry('compat-infestation-missing', [
            { kind: 'applyElementalInfliction', parameters: { element: 'heat', isExtra: false } },
          ]),
        ),
      ),
    );

    expect(issues.map(issue => issue.code)).toEqual(['unsupported-step']);
    expect(issues[0]?.detail).toContain('infliction document');
  });

  it('accepts detached projectile finish callbacks when their body is compatible', () => {
    const issues = inspectStandardPlayerDamageCompatibility(
      compatibilityInput(
        operator(
          compileGraphEntry('compat-projectile-callback', 'step-0', {
            'step-0': {
              action: {
                kind: 'launchProjectile',
                parameters: { inheritActionBlackboard: true, finish: 0.1, recycleDelaySeconds: 0 },
                callbacks: [
                  {
                    event: 'finish',
                    skill: {
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
                      blackboard: {},
                      scheduledSequences: [
                        {
                          startFrame: 0,
                          endFrame: 0,
                          sequence: { $sequence: 'callback-resource' },
                        },
                      ],
                      actionGraph: {
                        main: {
                          nodes: {
                            'callback-resource': {
                              action: {
                                kind: 'changeResource',
                                parameters: {
                                  resource: 'sp',
                                  amount: 1,
                                  source: { kind: 'fixed', target: 'caster' },
                                  targets: { kind: 'fixed', target: 'caster' },
                                  spGainKind: 'gain',
                                },
                              },
                              next: null,
                            },
                          },
                        },
                        macros: {},
                      },
                    },
                  },
                ],
              },
              next: null,
            },
          }),
        ),
      ),
    );

    expect(issues).toEqual([]);
  });
});
