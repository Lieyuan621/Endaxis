import { validateSkillDefinition } from '../game-data/validateSkillDefinition';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  CombatStepParameters,
  HealTargetBinding,
} from '../../../packages/game-data-contract/src/actions';
import type {
  ResolvedCombatStep,
  ResolvedCombatStepForKind,
  ResolvedCombatStepParameters,
} from './combatProgram';
import type { SkillDefinition } from '../game-data/operatorDefinition';
import type { SkillActionProgramDefinition } from '../../../packages/game-data-contract/src/skills';
import { perlica } from '../../data/operators/perlica.generated';
const childSkillRuntime = {
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 30,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
  },
} as const;
import {
  compileOperatorBuffDefinitions,
  compileOperatorBuffResources,
  compileSkill,
  compileActionSequence,
} from './compileSkill';

it('keeps step kind, parameters and sequence fields correlated through the public member type', () => {
  type Selected = ResolvedCombatStepForKind<
    'conditional' | 'once' | 'dealDamage' | 'dealFixedDamage'
  >;
  expectTypeOf<Selected>().toEqualTypeOf<
    Extract<ResolvedCombatStep, { kind: 'conditional' | 'once' | 'dealDamage' | 'dealFixedDamage' }>
  >();
  expectTypeOf<ResolvedCombatStepForKind<'once'>>().not.toBeNever();
  const once: ResolvedCombatStepForKind<'once'> = {
    kind: 'once',
    parameters: { scopeKey: 'test' },
    body: { steps: [] },
  };
  expect(once.body.steps).toEqual([]);
  // @ts-expect-error once requires its child sequence.
  const missingBody: ResolvedCombatStepForKind<'once'> = {
    kind: 'once',
    parameters: { scopeKey: 'test' },
  };
  void missingBody;
  // @ts-expect-error unknown kinds cannot silently resolve to never.
  type UnknownStep = ResolvedCombatStepForKind<'unknownStep'>;
  expectTypeOf<UnknownStep>();
});

function findPerlicaSkill(key: string): SkillDefinition {
  for (const group of perlica.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing Perlica skill '${key}'`);
}

describe('compileSkill', () => {
  it('keeps the same heal target binding before and after compilation', () => {
    type TargetBinding<T> = T extends HealTargetBinding ? Pick<T, 'target' | 'contextKey'> : never;
    expectTypeOf<TargetBinding<CombatStepParameters['heal']>>().toEqualTypeOf<HealTargetBinding>();
    expectTypeOf<
      TargetBinding<ResolvedCombatStepParameters['heal']>
    >().toEqualTypeOf<HealTargetBinding>();
    expectTypeOf<{ target: 'contextTarget' }>().not.toExtend<HealTargetBinding>();
    expectTypeOf<{ target: 'caster'; contextKey: string }>().not.toExtend<HealTargetBinding>();
    expectTypeOf<{ target: 'contextTarget'; contextKey: string }>().toExtend<HealTargetBinding>();
  });

  it('compiles the same action program identically for operator and child skill hosts', () => {
    const actions: SkillActionProgramDefinition = {
      blackboard: { coefficient: [1, 2] },
      scheduledSequences: [0, 3, 10].map(endFrame => ({
        startFrame: 0,
        endFrame,
        sequence: {
          steps: [
            {
              kind: 'dealDamage',
              parameters: {
                damageType: 'physical',
                attackScale: [1, 2],
                tags: [],
              },
            },
          ],
        },
      })),
    };
    const operator = compileSkill({
      operatorId: 'owner',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill: { ...actions, key: 'skill', timelineBlockFrames: 10 },
    });
    const childStep = compileActionSequence(
      {
        steps: [
          {
            kind: 'startCurrentAbilityEntityChildSkill',
            parameters: { childSkill: { ...actions, ...childSkillRuntime, skillId: 'child' } },
          },
        ],
      },
      2,
    ).steps[0]!;
    if (childStep.kind !== 'startCurrentAbilityEntityChildSkill') throw new Error('wrong step');
    expect(childStep.parameters.childSkill.initialBlackboard).toEqual(operator.initialBlackboard);
    expect(operator.initialBlackboard).toEqual({ coefficient: 2 });
    expect(childStep.parameters.childSkill.timelineActions).toEqual(operator.timelineActions);
    expect(operator.timelineActions.map(action => action.endFrame)).toEqual([0, 3, 10]);
  });

  it('标签原数组直接穿过运行编译，不包装或再次解析路径', () => {
    const tags = Object.freeze(['Custom/Buff/Child']);
    const compiled = compileActionSequence(
      {
        steps: [
          {
            kind: 'readBuffBlackboard',
            parameters: {
              target: 'enemy',
              query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: tags },
              desiredKey: 'count',
              outputKey: 'result',
            },
          },
        ],
      },
      1,
    );
    const operation = compiled.steps[0]!;
    expect(operation.kind).toBe('readBuffBlackboard');
    if (operation.kind !== 'readBuffBlackboard' || operation.parameters.query.kind !== 'tag')
      throw new Error('unexpected operation');
    expect(operation.parameters.query.buffTags).toBe(tags);
  });
  it('保留两类伤害的特征及倍率伤害的即时属性修正，不丢失运行时黑板引用', () => {
    const instantAttributeModifiers = [
      {
        targetSide: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: { kind: 'blackboard', key: 'crit_delta' },
        attributeTiming: 'runtime',
      },
    ] as const;
    const compiled = compileActionSequence(
      {
        steps: [
          {
            kind: 'dealDamage',
            parameters: {
              damageType: 'physical',
              attackScale: [1, 2],
              tags: [],
              features: ['shatter', 'dot'],
              instantAttributeModifiers,
            },
          },
          {
            kind: 'dealFixedDamage',
            parameters: {
              damageType: 'physical',
              value: [50, 100],
              tags: [],
              features: ['knockDown', 'physicalInfliction'],
            },
          },
        ],
      },
      2,
    );
    expect(compiled.steps.map(step => step.parameters)).toEqual([
      {
        damageType: 'physical',
        attackScale: 2,
        tags: [],
        features: ['shatter', 'dot'],
        instantAttributeModifiers,
      },
      {
        damageType: 'physical',
        value: 100,
        tags: [],
        features: ['knockDown', 'physicalInfliction'],
      },
    ]);
  });
  it('compiles both inline physical-infliction Buff trees at the skill level', () => {
    const skill = {
      key: 'fracture',
      timelineBlockFrames: 1,
      scheduledSequences: [
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
                  noGuardDefinition: {
                    stackingType: 'unlimited',
                    lifecycleSequences: {
                      start: {
                        steps: [{ kind: 'dealStagger', parameters: { value: [2, 4] } }],
                      },
                    },
                  },
                  fractureBuffId: 'buff_physical_fracture',
                  fractureDefinition: {
                    stackingType: 'refresh',
                    scheduledSequences: [
                      {
                        startFrame: 0,
                        sequence: {
                          steps: [{ kind: 'dealStagger', parameters: { value: [1, 3] } }],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const compiled = compileSkill({
      operatorId: 'antal',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
    });
    const step = compiled.timelineActions[0]!.sequence.steps[0]!;
    expect(step.kind).toBe('applyPhysicalInfliction');
    if (step.kind !== 'applyPhysicalInfliction') return;
    expect(
      step.parameters.noGuardDefinition.lifecycleSequences?.start?.steps[0]?.parameters,
    ).toEqual({ value: 4 });
    expect(step.parameters.type).toBe('fracture');
    if (step.parameters.type !== 'fracture') return;
    expect(
      step.parameters.fractureDefinition.scheduledSequences?.[0]?.sequence.steps[0]?.parameters,
    ).toEqual({ value: 3 });
  });

  it('compiles operator Buff blueprints without a skill-level context', () => {
    expect(
      compileOperatorBuffDefinitions({
        mark: {
          stackingType: 'refresh',
          priority: 0,
          maxStackCount: 1,
          lifecycleSequences: {
            start: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'scale' },
                    tags: [],
                  },
                },
              ],
            },
          },
        },
      }),
    ).toMatchObject({
      mark: {
        stackingType: 'refresh',
        lifecycleSequences: {
          start: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: { attackScale: { kind: 'blackboard', key: 'scale' } },
              },
            ],
          },
        },
      },
    });
  });

  it('rejects skill-level arrays inside an operator Buff blueprint', () => {
    expect(() =>
      compileOperatorBuffDefinitions({
        invalid: {
          stackingType: 'refresh',
          lifecycleSequences: {
            start: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: [1, 2],
                    tags: [],
                  },
                },
              ],
            },
          },
        },
      }),
    ).toThrow('must not depend on a skill level inside an operator Buff');
  });

  it('compiles AbilityEntity definitions referenced only by an operator Buff', () => {
    const resources = compileOperatorBuffResources(
      {
        spawner: {
          stackingType: 'unique',
          lifecycleSequences: {
            start: {
              steps: [
                {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: 'entity', dieWhenSourceDies: true },
                },
              ],
            },
          },
        },
      },
      {
        entity: {
          lifetime: { kind: 'limited', durationSeconds: 1 },
          childSkill: {
            ...childSkillRuntime,
            skillId: 'entity-child',
            scheduledSequences: [
              {
                startFrame: 1,
                sequence: {
                  steps: [
                    {
                      kind: 'dealDamage',
                      parameters: { damageType: 'physical', attackScale: 2, tags: [] },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    );

    expect(resources.buffDefinitions.spawner?.lifecycleSequences?.start?.steps[0]).toEqual({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'entity', dieWhenSourceDies: true },
    });
    expect(resources.abilityEntityDefinitions.entity).toMatchObject({
      childSkill: {
        skillId: 'entity-child',
        timelineActions: [
          { startFrame: 1, sequence: { steps: [{ parameters: { attackScale: 2 } }] } },
        ],
      },
    });
  });

  it('resolves heal multiplier and addition at the selected skill level', () => {
    const skill = {
      key: 'heal',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'heal',
                parameters: {
                  target: 'controlledOperator',
                  alwaysNext: false,
                  attribute: 'will',
                  multiplier: [1, 2],
                  addition: [10, 20],
                  tags: ['Test/TagNegative1'],
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    expect(
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        skillLevel: 2,
        skill,
      }).timelineActions[0]?.sequence.steps[0],
    ).toMatchObject({
      kind: 'heal',
      parameters: { alwaysNext: false, multiplier: 2, addition: 20 },
    });
  });

  it('resolves a definite heal amount at the selected skill level', () => {
    const skill = {
      key: 'definite-heal',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'heal',
                parameters: {
                  target: 'controlledOperator',
                  amount: [100, 240],
                  tags: [],
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    expect(
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        skillLevel: 2,
        skill,
      }).timelineActions[0]?.sequence.steps[0],
    ).toMatchObject({
      kind: 'heal',
      parameters: { amount: 240 },
    });
  });

  it('compiles an embedded AbilityEntity child timeline at the parent skill level', () => {
    const skill = {
      key: 'entity-parent',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'entity',
                  dieWhenSourceDies: false,
                  definition: {
                    lifetime: { kind: 'infinite' },
                    childSkill: {
                      ...childSkillRuntime,
                      skillId: 'entity-child',
                      blackboard: { coefficient: [1, 2] },
                      scheduledSequences: [
                        {
                          startFrame: 3,
                          sequence: {
                            steps: [
                              {
                                kind: 'dealDamage',
                                parameters: {
                                  damageType: 'physical',
                                  attackScale: [4, 5],
                                  tags: ['comboSkill'],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'combo',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toMatchObject({
      parameters: {
        definition: {
          childSkill: {
            ...childSkillRuntime,
            skillId: 'entity-child',
            initialBlackboard: { coefficient: 2 },
            timelineActions: [
              { startFrame: 3, sequence: { steps: [{ parameters: { attackScale: 5 } }] } },
            ],
          },
        },
      },
    });
  });

  it('compiles an ID-only AbilityEntity closure at the parent skill level without recursive inlining', () => {
    const skill = {
      key: 'entity-reference-parent',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'combo',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
      abilityEntityDefinitions: {
        entity: {
          lifetime: { kind: 'infinite' },
          childSkill: {
            skillId: 'entity-child',
            blackboard: { coefficient: [1, 2] },
            ...childSkillRuntime,
            scheduledSequences: [
              {
                startFrame: 3,
                sequence: {
                  steps: [
                    {
                      kind: 'dealDamage',
                      parameters: {
                        damageType: 'physical',
                        attackScale: [4, 5],
                        tags: ['comboSkill'],
                      },
                    },
                    {
                      kind: 'spawnAbilityEntity',
                      parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
    });
    expect(program.abilityEntityDefinitions?.entity).toMatchObject({
      childSkill: {
        initialBlackboard: { coefficient: 2 },
        timelineActions: [
          {
            sequence: {
              steps: [
                { kind: 'dealDamage', parameters: { attackScale: 5 } },
                {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
                },
              ],
            },
          },
        ],
      },
    });
  });

  it('rejects legacy top-level handlers because they do not preserve listener lifetime', () => {
    const skill = {
      key: 'legacy-listener',
      timelineBlockFrames: 1,
      scheduledSequences: [],
      eventHandlers: [
        {
          key: 'legacy',
          event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
          scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
        },
      ],
    } satisfies SkillDefinition;

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill,
      }),
    ).toThrow('uses legacy eventHandlers without a listener interval');
  });

  it('编译内联 Buff 生命周期中的等级数值', () => {
    const skill = {
      key: 'buff-lifecycle',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'scaling-buff',
                  target: 'caster',
                  definition: {
                    stackingType: 'unique',
                    scheduledSequences: [
                      {
                        startFrame: 2,
                        sequence: {
                          steps: [
                            {
                              kind: 'dealDamage',
                              parameters: {
                                damageType: 'nature',
                                attackScale: [5, 6],
                                tags: ['comboSkill'],
                              },
                            },
                          ],
                        },
                      },
                    ],
                    lifecycleSequences: {
                      start: {
                        steps: [
                          {
                            kind: 'dealDamage',
                            parameters: {
                              damageType: 'electric',
                              attackScale: [1, 2],
                              tags: ['normalSkill'],
                            },
                          },
                        ],
                      },
                    },
                    abilityEventResponses: [
                      {
                        event: 'beforeTakeDamage',
                        priority: 5,
                        sequence: {
                          steps: [
                            {
                              kind: 'dealDamage',
                              parameters: {
                                damageType: 'nature',
                                attackScale: [3, 4],
                                tags: ['normalSkill'],
                              },
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
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toMatchObject({
      parameters: {
        definition: {
          scheduledSequences: [
            {
              startFrame: 2,
              sequence: { steps: [{ parameters: { attackScale: 6 } }] },
            },
          ],
          lifecycleSequences: {
            start: { steps: [{ parameters: { attackScale: 2 } }] },
          },
          abilityEventResponses: [
            {
              event: 'beforeTakeDamage',
              priority: 5,
              sequence: { steps: [{ parameters: { attackScale: 4 } }] },
            },
          ],
        },
      },
    });
  });

  it('按技能等级解析初始动作黑板', () => {
    const skill = {
      key: 'blackboard',
      blackboard: { fixed: 3, scaling: [10, 20] },
      timelineBlockFrames: 1,
      scheduledSequences: [],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.initialBlackboard).toEqual({ fixed: 3, scaling: 20 });
  });

  it('resolves the per-hit multiplier of a breaking attack', () => {
    const skill = {
      key: 'finisher-split',
      timelineBlockFrames: 10,
      scheduledSequences: [
        {
          startFrame: 3,
          sequence: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'electric',
                  calculation: 'breakingAttack',
                  attackScale: [4, 9],
                  calculationMultiplier: [0.1, 0.2],
                  tags: ['powerAttack'],
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'finisher',
      skillType: 'finisher',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toMatchObject({
      parameters: { attackScale: 9, calculationMultiplier: 0.2 },
    });
  });

  it('resolves a standalone stagger step without creating health damage', () => {
    const skill = {
      key: 'stagger-only',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [{ kind: 'dealStagger', parameters: { value: [10, 20] } }],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'dealStagger',
      parameters: { value: 20 },
    });
  });

  it('resolves the level value of fixed base damage', () => {
    const skill = {
      key: 'fixed-damage',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'dealFixedDamage',
                parameters: {
                  damageType: 'physical',
                  value: [10, 20],
                  tags: ['ultimateSkill'],
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'ultimate',
      skillType: 'ultimate',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'dealFixedDamage',
      parameters: { damageType: 'physical', value: 20, tags: ['ultimateSkill'] },
    });
  });

  it('keeps dynamic stagger operands for runtime blackboard evaluation', () => {
    const skill = {
      key: 'dynamic-stagger',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: 1,
                  tags: ['comboSkill'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerMultiplier: { kind: 'blackboard', key: 'poise_scale' },
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 1,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toMatchObject({
      parameters: {
        stagger: { kind: 'blackboard', key: 'poise' },
        staggerMultiplier: { kind: 'blackboard', key: 'poise_scale' },
      },
    });
  });

  it('preserves a dynamic damage multiplier for runtime resolution', () => {
    const skill = {
      key: 'dynamic-damage',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'attackScale' },
                  tags: ['normalSkill'],
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toMatchObject({
      parameters: { attackScale: { kind: 'blackboard', key: 'attackScale' } },
    });
  });

  it('keeps the derived timeline block width in the compiled index', () => {
    const skill = {
      key: 'timeline-block',
      timelineBlockFrames: 18,
      scheduledSequences: [],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
    });

    expect(program.timelineBlockFrames).toBe(18);
  });

  it('rejects cooldown values that cannot be represented as frame periods', () => {
    const skill = {
      key: 'invalid-cooldown',
      timelineBlockFrames: 1,
      cooldownFrames: 1.5,
      scheduledSequences: [],
    } satisfies SkillDefinition;

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        skillLevel: 1,
        skill,
      }),
    ).toThrow("skill 'invalid-cooldown' must use positive integer cooldownFrames");
  });

  it('compiles Perlica battle skill into a single-level runtime program', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_normal_skill');

    const program = compileSkill({
      operatorId: perlica.slug,
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 12,
      skill,
    });

    expect(program).toMatchObject({
      operatorId: 'perlica',
      skillId: 'chr_0004_pelica_normal_skill',
      timelineBlockFrames: 31,
      costFrame: 0,
      costs: [{ resource: 'sp', value: 100 }],
    });
    const impact = program.timelineActions.find(action => action.startFrame === 13);
    expect(impact?.sequence.steps).toEqual([
      {
        kind: 'applyElementalInfliction',
        parameters: { element: 'electric', isExtra: false },
      },
      {
        key: expect.any(String),
        kind: 'dealDamage',
        parameters: {
          damageType: 'electric',
          attackScale: { kind: 'blackboard', key: 'atk_scale' },
          tags: ['normalSkill'],
          features: ['canBreakWeakness'],
          stagger: { kind: 'blackboard', key: 'poise' },
        },
      },
      {
        kind: 'gainSquadUltimateEnergyFromSkillCost',
        parameters: { coefficient: 1 },
      },
    ]);
    expect(impact?.sequence.steps[1]?.key).not.toBe('');
  });

  it('resolves nested level values without retaining level arrays', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_combo_skill');

    const program = compileSkill({
      operatorId: perlica.slug,
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 12,
      skill,
    });

    expect(program.cooldownFrames).toBe(570);
    expect(JSON.stringify(program)).not.toContain('[0.8,');
  });

  it('preserves the SP refund category while resolving its level value', () => {
    const skill = {
      key: 'refund',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: {
                  resource: 'sp',
                  amount: [10, 20],
                  coefficient: [0.5, 0.25],
                  recipient: 'team',
                  spGainKind: 'refund',
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'changeResource',
      parameters: {
        resource: 'sp',
        amount: 20,
        coefficient: 0.25,
        recipient: 'team',
        spGainKind: 'refund',
      },
    });
  });

  it('preserves a dynamic resource coefficient for runtime evaluation', () => {
    const skill = {
      key: 'dynamic-refund',
      timelineBlockFrames: 1,
      scheduledSequences: [
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
                  spGainKind: 'refund',
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 1,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'changeResourceByActionValue',
      parameters: {
        resource: 'sp',
        amount: { kind: 'blackboard', key: 'refundAmount' },
        coefficient: { kind: 'blackboard', key: 'targetCount' },
        recipient: 'team',
        spGainKind: 'refund',
      },
    });
  });

  it('compiles ultimate-energy recovery options into the runtime protocol', () => {
    const skill = {
      key: 'taggedRecovery',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: {
                  resource: 'ultimateEnergy',
                  amount: [0.1, 0.2],
                  coefficient: 0.5,
                  recipient: 'caster',
                  isPercentValue: true,
                  ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
                  ignoreUltimateEnergyGainMultiplier: true,
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
    });

    expect(program.timelineActions[0]?.sequence.steps[0]).toEqual({
      kind: 'changeResource',
      parameters: {
        resource: 'ultimateEnergy',
        amount: 0.2,
        coefficient: 0.5,
        recipient: 'caster',
        isPercentValue: true,
        ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
        ignoreUltimateEnergyGainMultiplier: true,
      },
    });
  });

  it('rejects paid skills whose native cost frame has not been recovered', () => {
    const incomplete = {
      key: 'incomplete',
      timelineBlockFrames: 30,
      costs: [{ resource: 'sp', value: 100 }],
      scheduledSequences: [],
    } satisfies SkillDefinition;

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill: incomplete,
      }),
    ).toThrow("skill 'incomplete' has costs but no recovered costFrame");
  });

  it('rejects a level outside the recovered value table', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_normal_skill');

    expect(() =>
      compileSkill({
        operatorId: perlica.slug,
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 13,
        skill,
      }),
    ).toThrow('has no value for skill level 13');
  });

  it('rejects multiple costs because native CastData has one cost slot', () => {
    const incomplete = {
      key: 'multiple-costs',
      timelineBlockFrames: 30,
      costFrame: 0,
      costs: [
        { resource: 'sp', value: 100 },
        { resource: 'ultimateEnergy', value: 10 },
      ],
      scheduledSequences: [],
    } satisfies SkillDefinition;

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill: incomplete,
      }),
    ).toThrow("skill 'multiple-costs' has multiple costs, but native CastData has one cost");
  });

  it('在数据边界拒绝数字标签，不依赖运行时类型转换', () => {
    const skill = {
      key: 'invalid-tag',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'readBuffBlackboard',
                parameters: {
                  target: 'enemy',
                  query: {
                    kind: 'tag',
                    tagQueryType: 'hasAny',
                    buffTags: ['2147483648'],
                  },
                  desiredKey: 'count',
                  outputKey: 'result',
                },
              },
            ],
          },
        },
      ],
    } satisfies SkillDefinition;

    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'expected readable GameplayTag path' }),
      ]),
    );
  });
});
