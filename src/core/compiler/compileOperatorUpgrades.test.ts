import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import { arclight as arclightGeneratedOperator } from '../../data/operators/arclight.generated';
import { camille as camilleGeneratedOperator } from '../../data/operators/camille.generated';
import { chenQianyu as chenQianyuGeneratedOperator } from '../../data/operators/chen-qianyu.generated';
import { daPan as daPanGeneratedOperator } from '../../data/operators/da-pan.generated';
import { endministrator as endministratorGeneratedOperator } from '../../data/operators/endministrator.generated';
import { lifeng as lifengGeneratedOperator } from '../../data/operators/lifeng.generated';
import fluoriteGeneratedOperator from '../../data/operators/fluorite.generated';
import { gilberta as gilbertaGeneratedOperator } from '../../data/operators/gilberta.generated';
import { lastRite as lastRiteGeneratedOperator } from '../../data/operators/last-rite.generated';
import { estella as estellaGeneratedOperator } from '../../data/operators/estella.generated';
import { tangtang as tangtangGeneratedOperator } from '../../data/operators/tangtang.generated';
import type { CompiledSkillProgram } from './combatProgram';
import type { OperatorInstanceDocument } from '../project/schema';
import type {
  OperatorDefinition,
  OperatorUpgradeDefinition,
} from '../game-data/operatorDefinition';
import { compileOperatorDefinitionSkills } from './compileScenarioTimeline';
import {
  applyOperatorUpgradeSkillPatches,
  compileOperatorReactionModifiers,
  compileOperatorInitializationPrograms,
  compileOperatorUpgradeEventPrograms,
  compileOperatorPassivePrograms,
  resolveActiveOperatorUpgrades,
} from './compileOperatorUpgrades';

function build(overrides: Partial<OperatorInstanceDocument> = {}): OperatorInstanceDocument {
  return {
    operatorSlug: perlica.slug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates: {},
    ...overrides,
  };
}

it('被动能力事件按所属技能等级编译，不在编译期执行或改写初始板', () => {
  const programs = compileOperatorPassivePrograms(
    [],
    [
      {
        key: 'native-passive',
        levelSource: 'battleSkill',
        blackboard: { count: [1, 2] },
        enableSequence: { steps: [] },
        abilityEventResponses: [
          {
            event: 'abilityEntityFinished',
            priority: 0,
            sequence: {
              steps: [
                {
                  kind: 'changeResource',
                  parameters: { resource: 'sp', amount: [3, 7], recipient: 'team' },
                },
              ],
            },
          },
        ],
      },
    ],
    { basicAttack: 1, battleSkill: 2, comboSkill: 1, ultimate: 1 },
  );
  expect(programs[0]).toMatchObject({
    initialBlackboard: { count: 2 },
    abilityEventResponses: [
      {
        event: 'abilityEntityFinished',
        sequence: { steps: [{ kind: 'changeResource', parameters: { amount: 7 } }] },
      },
    ],
  });
});

function program(
  skillId: string,
  skillGroupKey: string,
  resource: 'sp' | 'ultimateEnergy',
  value: number,
): CompiledSkillProgram {
  return {
    operatorId: 'operator:1',
    skillGroupKey,
    skillId,
    skillType: resource === 'sp' ? 'battleSkill' : 'ultimate',
    skillLevel: 12,
    initialBlackboard: {},
    timelineBlockFrames: 1,
    costFrame: 0,
    costs: [{ resource, value }],
    timelineActions: [],
  };
}

function hydrateOperatorBuffReferences<T>(value: T, operator: OperatorDefinition): T {
  if (Array.isArray(value)) {
    return value.map(item => hydrateOperatorBuffReferences(item, operator)) as T;
  }
  if (value === null || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const hydrated = Object.fromEntries(
    Object.entries(source).map(([key, child]) => [
      key,
      hydrateOperatorBuffReferences(child, operator),
    ]),
  );
  if (source.kind === 'applyBuff') {
    const parameters = source.parameters as Record<string, unknown> | undefined;
    const buffId = parameters?.buffId;
    const definition = typeof buffId === 'string' ? operator.buffDefinitions?.[buffId] : undefined;
    if (definition !== undefined) {
      hydrated.parameters = {
        ...(hydrated.parameters as Record<string, unknown>),
        definition: hydrateOperatorBuffReferences(definition, operator),
      };
    }
  }
  return hydrated as T;
}

describe('operator upgrade compilation', () => {
  it('在技能补丁之外按养成等级聚合元素反应时长和效果修正', () => {
    const [modifier] = compileOperatorReactionModifiers([
      {
        source: 'talent',
        index: 0,
        level: 2,
        definition: {
          levels: 2,
          modifiers: [
            { kind: 'addReactionDuration', reaction: 'corrosion', seconds: [5, 10] },
            { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: [0.05, 0.1] },
          ],
        },
      },
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            { kind: 'addReactionDuration', reaction: 'corrosion', seconds: 5 },
            { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: 0.2 },
          ],
        },
      },
    ]);
    expect(modifier).toMatchObject({
      reaction: 'corrosion',
      durationSecondsAddition: 15,
    });
    expect(modifier?.effectivenessAddition).toBeCloseTo(0.3);
  });

  it('compiles direct upgrade initialization separately from passive skills', () => {
    const programs = compileOperatorInitializationPrograms([
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          initializationSequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'buff.potential',
                  definition: { stackingType: 'unique', maxStackCount: 1 },
                  target: 'caster',
                },
              },
            ],
          },
        },
      },
    ]);

    expect(programs).toMatchObject([
      {
        key: 'potential:0',
        sequence: { steps: [{ kind: 'applyBuff', parameters: { buffId: 'buff.potential' } }] },
      },
    ]);
  });

  it('resolves attached Buff blackboard inputs at the selected upgrade level', () => {
    const definition = {
      levels: 2,
      initializationSequence: {
        steps: [
          {
            kind: 'applyBuff' as const,
            parameters: {
              buffId: 'buff.talent',
              target: 'caster' as const,
              blackboardAssignments: { add: [0.2, 0.3] },
            },
          },
        ],
      },
    };
    const programs = compileOperatorInitializationPrograms([
      { source: 'talent', index: 0, level: 2, definition },
    ]);

    expect(programs[0]?.sequence.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: { blackboardAssignments: { add: { kind: 'constant', value: 0.3 } } },
    });
  });

  it('compiles Endministrator potentials 1 through 3 as ordered attached-Buff initialization', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: endministratorGeneratedOperator.slug, potential: 3 }),
      endministratorGeneratedOperator,
    );
    const programs = compileOperatorInitializationPrograms(active);

    expect(programs.map(program => program.key)).toEqual([
      'potential:0',
      'potential:1',
      'potential:2',
    ]);
    expect(programs[0]?.sequence.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: { buffId: 'buff_chr_0003_endminf_potential1' },
    });
    expect(programs[1]?.sequence.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: { buffId: 'buff_chr_0003_endminf_potential2' },
    });
    expect(programs[2]?.sequence.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff_chr_0003_endminf_potential3',
        blackboardAssignments: { usp: { kind: 'constant', value: 15 } },
      },
    });
  });

  it('compiles Endministrator potential 5 into its trigger listener and absolute cooldown reduction', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: endministratorGeneratedOperator.slug, potential: 5 }),
      endministratorGeneratedOperator,
    );
    const program = compileOperatorInitializationPrograms(active).find(
      item => item.key === 'potential:4',
    );

    expect(
      hydrateOperatorBuffReferences(program?.sequence.steps[0], endministratorGeneratedOperator),
    ).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff_chr_0003_endminf_potential5',
        blackboardAssignments: { cd_minus: { kind: 'constant', value: 2 } },
        definition: {
          abilityEventResponses: [
            {
              event: 'addedBuff',
              sequence: {
                steps: [
                  {
                    kind: 'conditional',
                    whenTrue: {
                      steps: [
                        {
                          kind: 'adjustSkillCooldown',
                          parameters: {
                            skill: { kind: 'id', skillId: 'chr_0003_endminf_combo_skill' },
                            operation: 'reduce',
                            basis: 'absoluteSeconds',
                          },
                        },
                        {
                          kind: 'adjustSkillCooldown',
                          parameters: {
                            skill: { kind: 'id', skillId: 'chr_0002_endminm_combo_skill' },
                            operation: 'reduce',
                            basis: 'absoluteSeconds',
                          },
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
    });
  });

  it('compiles Estella potential 5 into a persistent enemy Buff-tag listener', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: estellaGeneratedOperator.slug, potential: 5 }),
      estellaGeneratedOperator,
    );
    const program = compileOperatorInitializationPrograms(active).find(
      item => item.key === 'potential:4',
    );

    expect(
      hydrateOperatorBuffReferences(program?.sequence.steps[0], estellaGeneratedOperator),
    ).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff_chr_0021_whiten_potential_5',
        definition: {
          lifecycleSequences: {
            enable: {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0021_whiten_potential_5_inaura',
                    target: 'enemy',
                    finishByAction: true,
                    definition: {
                      abilityEventResponses: [
                        {
                          event: 'addedBuff',
                          sequence: {
                            steps: [
                              {
                                kind: 'conditional',
                                parameters: {
                                  condition: {
                                    kind: 'eventBuffTagsMatch',
                                    match: 'hasAny',
                                    buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                                  },
                                },
                                whenTrue: {
                                  steps: [
                                    {
                                      kind: 'conditional',
                                      parameters: {
                                        condition: {
                                          kind: 'not',
                                          condition: {
                                            kind: 'timedMarkerPresent',
                                            target: 'caster',
                                            markerId: 'buff_chr_0021_whiten_potential_5_cd',
                                          },
                                        },
                                      },
                                      whenTrue: {
                                        steps: [
                                          {
                                            kind: 'createTimedMarker',
                                            parameters: {
                                              markerId: 'buff_chr_0021_whiten_potential_5_cd',
                                            },
                                          },
                                          {
                                            kind: 'changeResourceByActionValue',
                                            parameters: {
                                              resource: 'ultimateEnergy',
                                              recipient: 'caster',
                                            },
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
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });
  });

  it('compiles generated talent and potential effects into operator skills', () => {
    const arclightBuild = build({
      operatorSlug: arclightGeneratedOperator.slug,
      potential: 5,
      talentStates: { 0: 2 },
    });
    const skills = compileOperatorDefinitionSkills(
      'track:0',
      arclightBuild,
      arclightGeneratedOperator,
    );
    const battleSkill = skills.find(skill => skill.skillGroupKey === 'battleSkill');
    const ultimate = skills.find(skill => skill.skillGroupKey === 'ultimate');

    expect(battleSkill?.initialBlackboard).toMatchObject({
      talent_1: 1,
      duration: 15,
      pulse_up: Math.fround(0.0008 * 1.3),
      count: 2,
      atb: 50,
    });
    expect(ultimate?.costs).toEqual([{ resource: 'ultimateEnergy', value: 76.5 }]);

    const initialization = compileOperatorInitializationPrograms(
      resolveActiveOperatorUpgrades(arclightBuild, arclightGeneratedOperator),
    );
    expect(initialization).toHaveLength(1);
    expect(
      hydrateOperatorBuffReferences(initialization[0], arclightGeneratedOperator),
    ).toMatchObject({
      key: 'potential:4',
      sequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_chr_0007_ikut_finish_count_p5',
              definition: {
                lifecycleSequences: {
                  start: {
                    steps: [
                      {
                        kind: 'finishBuffsById',
                        parameters: {
                          target: 'buffOwner',
                          buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
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
    });
  });

  it('selects talents and potentials in stable declaration order', () => {
    const operator = {
      ...perlica,
      talents: [{ levels: 2 }, { levels: 1 }],
      potentials: [{ levels: 1 }, { levels: 2 }],
    };

    expect(
      resolveActiveOperatorUpgrades(
        build({ talentStates: { 0: 2, 1: 0 }, potential: 2 }),
        operator,
      ).map(upgrade => [upgrade.source, upgrade.index, upgrade.level]),
    ).toEqual([
      ['talent', 0, 2],
      ['potential', 0, 1],
      ['potential', 1, 1],
    ]);
  });

  it('applies cost multipliers in upgrade and modifier order to every skill variant', () => {
    const source = [
      program('ultimate-a', 'ultimate', 'ultimateEnergy', 100),
      program('ultimate-b', 'ultimate', 'ultimateEnergy', 120),
      program('battle-skill', 'battleSkill', 'sp', 100),
    ];
    const upgrades = [
      {
        source: 'talent',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplySkillCost',
              skillGroupKey: 'ultimate',
              resource: 'ultimateEnergy',
              multiplier: 0.8,
            },
          ],
        },
      },
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplySkillCost',
              skillGroupKey: 'ultimate',
              resource: 'ultimateEnergy',
              multiplier: 0.5,
            },
          ],
        },
      },
    ] as const;

    const patched = applyOperatorUpgradeSkillPatches(source, upgrades);

    expect(patched.map(skill => skill.costs[0]!.value)).toEqual([40, 48, 100]);
    expect(source.map(skill => skill.costs[0]!.value)).toEqual([100, 120, 100]);
  });

  it('can target one player-facing skill without modifying a runtime-only replacement in the same group', () => {
    const source = [
      program('ultimate', 'ultimate', 'ultimateEnergy', 100),
      { ...program('ultimateEnd', 'ultimate', 'ultimateEnergy', 0), costs: [] },
    ];
    const patched = applyOperatorUpgradeSkillPatches(source, [
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplySkillCost',
              skillGroupKey: 'ultimate',
              skillKey: 'ultimate',
              resource: 'ultimateEnergy',
              multiplier: 0.8,
            },
          ],
        },
      },
    ]);

    expect(patched[0]!.costs[0]!.value).toBe(80);
    expect(patched[1]!.costs).toEqual([]);
  });

  it('patches initial skill blackboards with add, multiply and assign operations', () => {
    const source = [
      {
        ...program('battle-a', 'battleSkill', 'sp', 100),
        initialBlackboard: { atb: 40, pulse_up: 0.0005, count: 3 },
      },
      {
        ...program('battle-b', 'battleSkill', 'sp', 100),
        initialBlackboard: { atb: 35, pulse_up: 0.0008, count: 3 },
      },
      program('ultimate', 'ultimate', 'ultimateEnergy', 100),
    ];
    const patched = applyOperatorUpgradeSkillPatches(source, [
      {
        source: 'talent',
        index: 0,
        level: 2,
        definition: {
          levels: 2,
          modifiers: [
            {
              kind: 'patchSkillBlackboard',
              skillGroupKey: 'battleSkill',
              blackboardKey: 'talent_1',
              operation: 'assign',
              value: [1, 1],
            },
            {
              kind: 'patchSkillBlackboard',
              skillGroupKey: 'battleSkill',
              blackboardKey: 'pulse_up',
              operation: 'multiply',
              value: [1, 1.3],
            },
            {
              kind: 'patchSkillBlackboard',
              skillGroupKey: 'battleSkill',
              blackboardKey: 'level_two_flag',
              operation: 'assign',
              value: 1,
              minimumUpgradeLevel: 2,
              maximumUpgradeLevel: 2,
            },
            {
              kind: 'patchSkillBlackboard',
              skillGroupKey: 'battleSkill',
              blackboardKey: 'level_one_flag',
              operation: 'assign',
              value: 1,
              maximumUpgradeLevel: 1,
            },
          ],
        },
      },
    ]);

    expect(patched[0]!.initialBlackboard).toMatchObject({
      talent_1: 1,
      atb: 40,
      pulse_up: Math.fround(0.0005 * 1.3),
      level_two_flag: 1,
      count: 3,
    });
    expect(patched[1]!.initialBlackboard).toMatchObject({
      talent_1: 1,
      atb: 35,
      pulse_up: Math.fround(0.0008 * 1.3),
      level_two_flag: 1,
      count: 3,
    });
    expect(patched[2]!.initialBlackboard).toEqual({});
    expect(patched[0]!.initialBlackboard).not.toHaveProperty('level_one_flag');
    expect(source[0]!.initialBlackboard).not.toHaveProperty('talent_1');
  });

  it('adds an unconditional cooldown delta only to the selected skill variant', () => {
    const source = [
      { ...program('combo-a', 'comboSkill', 'sp', 0), cooldownFrames: 600 },
      { ...program('combo-b', 'comboSkill', 'sp', 0), cooldownFrames: 480 },
    ];
    const patched = applyOperatorUpgradeSkillPatches(source, [
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'addSkillCooldownFrames',
              skillGroupKey: 'comboSkill',
              skillKey: 'combo-a',
              frames: -60,
            },
          ],
        },
      },
    ]);

    expect(patched.map(skill => skill.cooldownFrames)).toEqual([540, 480]);
    expect(source.map(skill => skill.cooldownFrames)).toEqual([600, 480]);
  });

  it('applies conditional Blackboard and cooldown patches from final build attributes', () => {
    const source = [
      {
        ...program('combo', 'comboSkill', 'sp', 0),
        cooldownFrames: 600,
        initialBlackboard: { rate: 0.1 },
      },
    ];
    const upgrades = [
      {
        source: 'talent' as const,
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'patchSkillBlackboard' as const,
              skillGroupKey: 'comboSkill',
              blackboardKey: 'rate',
              operation: 'add' as const,
              value: 0.06,
              condition: {
                kind: 'deckAttributeCompare' as const,
                left: 'will' as const,
                operator: 'greater' as const,
                right: 'intellect' as const,
              },
            },
            {
              kind: 'addSkillCooldownFrames' as const,
              skillGroupKey: 'comboSkill',
              frames: -180,
              condition: {
                kind: 'deckAttributeCompare' as const,
                left: 'intellect' as const,
                operator: 'greaterOrEqual' as const,
                right: 'will' as const,
              },
            },
          ],
        },
      },
    ];

    const intellect = applyOperatorUpgradeSkillPatches(source, upgrades, {
      buildAttributes: { strength: 0, agility: 0, intellect: 20, will: 20 },
    });
    const will = applyOperatorUpgradeSkillPatches(source, upgrades, {
      buildAttributes: { strength: 0, agility: 0, intellect: 19, will: 20 },
    });

    expect(intellect[0]).toMatchObject({ cooldownFrames: 420, initialBlackboard: { rate: 0.1 } });
    expect(will[0]).toMatchObject({
      cooldownFrames: 600,
      initialBlackboard: { rate: Math.fround(0.16) },
    });
    expect(() => applyOperatorUpgradeSkillPatches(source, upgrades)).toThrow(
      'requires resolved final build attributes',
    );
  });

  it('patches one keyed elemental reaction without mutating the source program', () => {
    const source = [
      {
        ...program('combo', 'comboSkill', 'sp', 0),
        skillType: 'comboSkill' as const,
        timelineActions: [
          {
            startFrame: 24,
            sequence: {
              steps: [
                {
                  key: 'combo.electrification',
                  kind: 'applyElementalReaction' as const,
                  parameters: {
                    reaction: 'electrification' as const,
                    target: 'enemy' as const,
                    durationSeconds: 5,
                    effectiveness: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    ];
    const patched = applyOperatorUpgradeSkillPatches(source, [
      {
        source: 'potential',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplyEffectDuration',
              skillGroupKey: 'comboSkill',
              stepKey: 'combo.electrification',
              multiplier: 1.75,
            },
            {
              kind: 'setEffectiveness',
              skillGroupKey: 'comboSkill',
              stepKey: 'combo.electrification',
              value: 1.33,
            },
          ],
        },
      },
    ]);

    expect(patched[0]!.timelineActions[0]!.sequence.steps[0]).toMatchObject({
      kind: 'applyElementalReaction',
      parameters: { durationSeconds: 5, durationMultiplier: 1.75, effectiveness: 1.33 },
    });
    expect(source[0]!.timelineActions[0]!.sequence.steps[0]).toMatchObject({
      parameters: { durationSeconds: 5, effectiveness: 1 },
    });
  });

  it('connects Perlica conduct duration and effectiveness potentials to native skill blackboard', () => {
    const durationPatched = compileOperatorDefinitionSkills(
      'track:perlica',
      build({ potential: 1 }),
      perlica,
    );
    const base = compileOperatorDefinitionSkills('track:perlica', build(), perlica);
    const effectivenessDefinition = perlica.potentials[3]!;
    const effectivenessPatched = applyOperatorUpgradeSkillPatches(base, [
      { source: 'potential', index: 0, level: 1, definition: effectivenessDefinition },
    ]);
    expect(
      durationPatched.find(program => program.skillGroupKey === 'comboSkill')?.initialBlackboard,
    ).toMatchObject({ duration: 8.75, extra_scaling: 1 });
    const effectiveness = effectivenessPatched.find(
      program => program.skillGroupKey === 'comboSkill',
    )?.initialBlackboard;
    expect(effectiveness?.duration).toBe(5);
    expect(effectiveness?.extra_scaling).toBeCloseTo(1.33);
  });

  it('compiles Perlica reaction attack potential into its native listening Buff initialization', () => {
    const programs = compileOperatorInitializationPrograms([
      { source: 'potential', index: 2, level: 1, definition: perlica.potentials[2]! },
    ]);

    expect(hydrateOperatorBuffReferences(programs, perlica)).toMatchObject([
      {
        key: 'potential:2',
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff_chr_0004_pelica_potential_3',
                target: 'caster',
                definition: {
                  abilityEventResponses: [{ event: 'outputBuff' }],
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it('resolves an upgrade event listener blackboard at the selected talent level', () => {
    const definition: OperatorUpgradeDefinition = {
      levels: 2,
      eventHandlers: [
        {
          event: { kind: 'elementalAttachmentConsumed' },
          blackboard: { crystal_up: [0.02, 0.04], duration: 15 },
          sequence: { steps: [] },
        },
      ],
    };

    expect(
      compileOperatorUpgradeEventPrograms([{ source: 'talent', index: 0, level: 2, definition }]),
    ).toMatchObject([
      {
        initialBlackboard: { crystal_up: 0.04, duration: 15 },
      },
    ]);
  });

  it('compiles Last Rite talent 1 into its native Buff event listener', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: lastRiteGeneratedOperator.slug, talentStates: { 0: 2 } }),
      lastRiteGeneratedOperator,
    );

    expect(compileOperatorUpgradeEventPrograms(active)).toEqual([]);
    expect(
      hydrateOperatorBuffReferences(
        compileOperatorInitializationPrograms(active),
        lastRiteGeneratedOperator,
      ),
    ).toMatchObject([
      {
        key: 'talent:0',
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff_chr_0026_lastrite_talent_1',
                target: 'caster',
                blackboardAssignments: {
                  crystal_up: { kind: 'constant', value: 0.04 },
                  duration: { kind: 'constant', value: 15 },
                },
                definition: {
                  abilityEventResponses: [
                    {
                      event: 'buffConsumed',
                      sequence: {
                        steps: [
                          {
                            kind: 'conditional',
                            whenTrue: {
                              steps: [
                                {
                                  kind: 'conditional',
                                  whenTrue: {
                                    steps: [
                                      {
                                        kind: 'calculateActionValue',
                                        parameters: { key: 'crystal_vul' },
                                      },
                                      {
                                        kind: 'applyBuff',
                                        parameters: {
                                          buffId: 'buff_chr_0026_lastrite_talent_1_vul',
                                          target: 'eventTarget',
                                          source: 'buffSource',
                                        },
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
                  ],
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it('adds Perlica ultimate critical rate to the native ultimate blackboard input', () => {
    const base = compileOperatorDefinitionSkills('track:perlica', build(), perlica);
    const patched = applyOperatorUpgradeSkillPatches(base, [
      { source: 'potential', index: 0, level: 1, definition: perlica.potentials[4]! },
    ]);

    expect(
      patched.find(program => program.skillGroupKey === 'ultimate')?.initialBlackboard.crit,
    ).toBeCloseTo(0.3);
    expect(
      patched.find(program => program.skillGroupKey === 'comboSkill')?.initialBlackboard.crit,
    ).toBeUndefined();
    expect(base.find(program => program.skillGroupKey === 'ultimate')?.initialBlackboard.crit).toBe(
      0,
    );
  });

  it('resolves Perlica staggered-target talent level into its native Buff initialization', () => {
    const active = resolveActiveOperatorUpgrades(build({ talentStates: { 0: 2 } }), perlica);
    const initialization = compileOperatorInitializationPrograms(active);

    expect(hydrateOperatorBuffReferences(initialization, perlica)).toMatchObject([
      {
        key: 'talent:0',
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff_chr_0004_pelica_talent_0',
                target: 'caster',
                blackboardAssignments: { dmg: { kind: 'constant', value: 0.3 } },
                definition: { damageModifiers: [{ enabledSide: 'attacker' }] },
              },
            },
          ],
        },
      },
    ]);
  });

  it('connects all pure Da Pan potential blackboard patches to their generated skills', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:da-pan',
      build({ operatorSlug: daPanGeneratedOperator.slug, potential: 5 }),
      daPanGeneratedOperator,
    );
    const ultimate = programs.find(program => program.skillGroupKey === 'ultimate')!;
    const battleSkill = programs.find(program => program.skillGroupKey === 'battleSkill')!;

    expect(ultimate.initialBlackboard).toMatchObject({
      potential_1_duration: 15,
      talent_1_stack: 1,
      talent_1_duration: 10,
    });
    expect(ultimate.initialBlackboard.potential_1_dmg_up).toBeCloseTo(0.3);
    expect(battleSkill.initialBlackboard.potential_5_interval).toBe(45);
  });

  it('resolves both levels of Da Pan talent 2 into its ultimate Buff chain inputs', () => {
    const compileUltimate = (level: 1 | 2) =>
      compileOperatorDefinitionSkills(
        'track:da-pan',
        build({ operatorSlug: daPanGeneratedOperator.slug, talentStates: { 1: level } }),
        daPanGeneratedOperator,
      ).find(program => program.skillGroupKey === 'ultimate')!;

    const firstLevel = compileUltimate(1).initialBlackboard;
    const secondLevel = compileUltimate(2).initialBlackboard;
    expect(firstLevel).toMatchObject({
      talent_1: 1,
      talent_1_stack: 1,
      talent_1_duration: 20,
    });
    expect(secondLevel).toMatchObject({
      talent_1: 1,
      talent_1_stack: 2,
      talent_1_duration: 20,
    });
    expect(firstLevel.talent_1_cd_reduce).toBeCloseTo(0.4);
    expect(secondLevel.talent_1_cd_reduce).toBeCloseTo(0.4);
  });

  it('connects Camille potential 1 to the battle-skill ability-entity inputs', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:camille',
      build({ operatorSlug: camilleGeneratedOperator.slug, potential: 1 }),
      camilleGeneratedOperator,
    );
    const battleSkill = programs.find(program => program.skillGroupKey === 'battleSkill')!;

    expect(battleSkill.initialBlackboard.weak_scale).toBeCloseTo(0.12);
    expect(battleSkill.initialBlackboard.vulnerable_scale).toBeCloseTo(0.12);
    expect(battleSkill.initialBlackboard.bat_duration).toBe(60);
  });

  it('connects Camille potential 3 cooldown and blackboard patches to each native combo variant', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:camille',
      build({ operatorSlug: camilleGeneratedOperator.slug, potential: 3 }),
      camilleGeneratedOperator,
    );
    const combo1 = programs.find(program => program.skillId === 'chr_0033_camille_combo_skill')!;
    const combo2 = programs.find(program => program.skillId === 'chr_0033_camille_combo_skill_2')!;

    expect(combo1.cooldownFrames).toBe(480);
    expect(combo2.cooldownFrames).toBeUndefined();
    expect(combo1.initialBlackboard.atk_scale_1_1).toBeCloseTo(0.6 * 1.3);
    expect(combo2.initialBlackboard.atk_scale_2_1).toBeCloseTo(0.6 * 1.3);
    expect(combo1.initialBlackboard.atb).toBeCloseTo(20 * 1.15);
    expect(combo2.initialBlackboard.atb_ex).toBeCloseTo(20 * 1.15);
  });

  it('connects Chen Qianyu potential 5 to combo cooldown and the ultimate branch flag', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:chen-qianyu',
      build({ operatorSlug: chenQianyuGeneratedOperator.slug, potential: 5 }),
      chenQianyuGeneratedOperator,
    );

    expect(
      programs.find(program => program.skillId === 'chr_0005_chen_combo_skill')!.cooldownFrames,
    ).toBe(360);
    expect(
      programs.find(program => program.skillId === 'chr_0005_chen_ultimate_skill')!
        .initialBlackboard.potential5,
    ).toBe(1);
  });

  it('connects Gilberta potential 5 to combo cooldown and damage scale', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:gilberta',
      build({ operatorSlug: gilbertaGeneratedOperator.slug, potential: 5 }),
      gilbertaGeneratedOperator,
    );
    const combo = programs.find(program => program.skillId === 'chr_0013_aglina_combo_skill')!;

    expect(combo.cooldownFrames).toBe(510);
    expect(combo.initialBlackboard.atk_scale).toBeCloseTo(3.15 * 1.3);
  });

  it('patches Gilberta team ultimate-energy passive after resolving talent level', () => {
    const operatorBuild = build({
      operatorSlug: gilbertaGeneratedOperator.slug,
      talentStates: { 0: 2 },
      potential: 3,
    });
    const active = resolveActiveOperatorUpgrades(operatorBuild, gilbertaGeneratedOperator);
    const passives = compileOperatorPassivePrograms(active);

    expect(passives).toHaveLength(1);
    expect(passives[0]).toMatchObject({ key: 'chr_0013_aglina_talent_0' });
    expect(passives[0]?.initialBlackboard.add).toBeCloseTo(0.12);
  });

  it('targets Camille talent patches to concrete variants inside the combo-skill group', () => {
    const programs = compileOperatorDefinitionSkills(
      'track:camille',
      build({ operatorSlug: camilleGeneratedOperator.slug, talentStates: { 0: 2 } }),
      camilleGeneratedOperator,
    );
    const comboPrograms = programs.filter(program => program.skillGroupKey === 'comboSkill');

    expect(comboPrograms.map(program => program.skillId)).toEqual([
      'chr_0033_camille_combo_skill',
      'chr_0033_camille_combo_skill_2',
    ]);
    expect(comboPrograms.every(program => program.initialBlackboard.talent_0 === 1)).toBe(true);
    expect(comboPrograms.every(program => program.initialBlackboard.heal_base === 60)).toBe(true);
  });

  it('does not leak a variant-specific blackboard patch to sibling skill programs', () => {
    const source = [
      { ...program('variant-a', 'comboSkill', 'sp', 0), initialBlackboard: { value: 1 } },
      { ...program('variant-b', 'comboSkill', 'sp', 0), initialBlackboard: { value: 2 } },
    ];
    const patched = applyOperatorUpgradeSkillPatches(source, [
      {
        source: 'talent',
        index: 0,
        level: 1,
        definition: {
          levels: 1,
          modifiers: [
            {
              kind: 'patchSkillBlackboard',
              skillGroupKey: 'comboSkill',
              skillKey: 'variant-a',
              blackboardKey: 'value',
              operation: 'add',
              value: 3,
            },
          ],
        },
      },
    ]);

    expect(patched.map(item => item.initialBlackboard.value)).toEqual([4, 2]);
  });

  it('fails closed when a keyed reaction patch has no unique root reaction target', () => {
    const source = [program('combo', 'comboSkill', 'sp', 0)];
    expect(() =>
      applyOperatorUpgradeSkillPatches(source, [
        {
          source: 'potential',
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            modifiers: [
              {
                kind: 'multiplyEffectDuration',
                skillGroupKey: 'comboSkill',
                stepKey: 'missing',
                multiplier: 1.5,
              },
            ],
          },
        },
      ]),
    ).toThrow("expected exactly one root reaction step 'missing', found 0");
  });

  it('compiles active passive skills with upgrade-level blackboard values', () => {
    const programs = compileOperatorPassivePrograms([
      {
        source: 'talent',
        index: 0,
        level: 2,
        definition: {
          levels: 2,
          passiveSkills: [
            {
              key: 'persistent-buff',
              blackboard: { attackIncrease: [0.1, 0.2] },
              enableSequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'persistent-buff',
                      target: 'caster',
                      blackboardAssignments: {
                        attackIncrease: { kind: 'blackboard', key: 'attackIncrease' },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    expect(programs).toEqual([
      {
        key: 'persistent-buff',
        initialBlackboard: { attackIncrease: 0.2 },
        enableSequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'persistent-buff',
                target: 'caster',
                blackboardAssignments: {
                  attackIncrease: { kind: 'blackboard', key: 'attackIncrease' },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it('installs operator base passives independently from active upgrades', () => {
    const programs = compileOperatorPassivePrograms(
      [],
      [
        {
          key: 'base-passive',
          blackboard: { range: 50 },
          enableSequence: { steps: [] },
        },
      ],
    );

    expect(programs).toEqual([
      {
        key: 'base-passive',
        initialBlackboard: { range: 50 },
        enableSequence: { steps: [] },
      },
    ]);
  });

  it('resolves Tangtang base passive from battle-skill level before potential patches', () => {
    const operatorBuild = build({
      operatorSlug: tangtangGeneratedOperator.slug,
      potential: 3,
    });
    const active = resolveActiveOperatorUpgrades(operatorBuild, tangtangGeneratedOperator);
    const skills = compileOperatorDefinitionSkills(
      'track:tangtang',
      operatorBuild,
      tangtangGeneratedOperator,
    );
    const passives = compileOperatorPassivePrograms(
      active,
      tangtangGeneratedOperator.passiveSkills,
      operatorBuild.skillLevels,
    );

    const battleSkill = skills.find(skill => skill.skillGroupKey === 'battleSkill');
    const ultimate = skills.find(skill => skill.skillGroupKey === 'ultimate');
    expect(battleSkill?.initialBlackboard.potential3).toBe(1);
    expect(battleSkill?.initialBlackboard.rate_spellvulnerable).toBeCloseTo(0.1);
    expect(battleSkill?.initialBlackboard.rate_spellvulnerable_02).toBeCloseTo(0.15);
    expect(ultimate?.initialBlackboard.rate_spellvulnerable).toBeCloseTo(0.05);
    expect(ultimate?.initialBlackboard.rate_spellvulnerable_02).toBeCloseTo(0.05);
    expect(passives).toHaveLength(1);
    expect(passives[0]?.initialBlackboard.normalskill_atk_scale01).toBeCloseTo(0.275);
  });

  it('patches Lifeng potential 3 into the enabled talent passive blackboard', () => {
    const active = resolveActiveOperatorUpgrades(
      build({
        operatorSlug: lifengGeneratedOperator.slug,
        talentStates: { 0: 2 },
        potential: 3,
      }),
      lifengGeneratedOperator,
    );

    const programs = compileOperatorPassivePrograms(active);
    expect(programs).toHaveLength(1);
    expect(programs[0]).toMatchObject({ key: 'chr_0015_lifeng_talent_1' });
    expect(programs[0]!.initialBlackboard.atk_up).toBeCloseTo(0.002);
  });

  it('does not invent a passive instance when its talent is disabled', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: lifengGeneratedOperator.slug, potential: 3 }),
      lifengGeneratedOperator,
    );

    expect(compileOperatorPassivePrograms(active)).toEqual([]);
  });

  it('compiles Fluorite talent 1 as a complete attached passive program', () => {
    const active = resolveActiveOperatorUpgrades(
      build({ operatorSlug: fluoriteGeneratedOperator.slug, talentStates: { 0: 2 } }),
      fluoriteGeneratedOperator,
    );

    const programs = compileOperatorPassivePrograms(active);
    expect(programs).toHaveLength(1);
    expect(programs[0]).toMatchObject({
      key: 'chr_0022_bounda_talent_1',
      initialBlackboard: { dmg_up: 0.2 },
      enableSequence: { steps: [{ kind: 'applyBuff' }] },
    });
  });

  it('rejects duplicate passive identities across active upgrades', () => {
    expect(() =>
      compileOperatorPassivePrograms(
        ['talent', 'potential'].map(source => ({
          source,
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            passiveSkills: [{ key: 'same-passive', enableSequence: { steps: [] } }],
          },
        })) as Parameters<typeof compileOperatorPassivePrograms>[0],
      ),
    ).toThrow("duplicates passive 'same-passive'");
  });

  it('fails closed for missing targets and unsupported active modifiers', () => {
    const source = [program('ultimate', 'ultimate', 'ultimateEnergy', 100)];
    expect(() =>
      applyOperatorUpgradeSkillPatches(source, [
        {
          source: 'potential',
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            modifiers: [
              {
                kind: 'multiplySkillCost',
                skillGroupKey: 'missing',
                resource: 'ultimateEnergy',
                multiplier: 0.85,
              },
            ],
          },
        },
      ]),
    ).toThrow("references missing skill group 'missing'");
    expect(() =>
      applyOperatorUpgradeSkillPatches(source, [
        {
          source: 'potential',
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            modifiers: [
              { kind: 'multiplySkillDamage', skillGroupKey: 'ultimate', multiplier: 1.1 },
            ],
          },
        },
      ]),
    ).toThrow("kind 'multiplySkillDamage' is not connected to skill compilation");
    expect(() =>
      applyOperatorUpgradeSkillPatches(source, [
        {
          source: 'potential',
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            modifiers: [
              {
                kind: 'patchSkillBlackboard',
                skillGroupKey: 'missing',
                blackboardKey: 'atb',
                operation: 'add',
                value: 10,
              },
            ],
          },
        },
      ]),
    ).toThrow("references missing skill group 'missing'");
  });
});
