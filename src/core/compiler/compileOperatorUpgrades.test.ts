import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from './compileActionGraph';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { actionSteps } from '../../test/actionProgramMatchers';
import { rootActionSteps } from './actionProgramInspection';
import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import type { CompiledSkillProgram } from './combatProgram';
import type { OperatorInstanceDocument } from '../project/schema';
import type { OperatorUpgradeDefinition } from '../game-data/operatorDefinition';
import {
  applyOperatorUpgradeSkillPatches,
  compileOperatorReactionModifiers,
  compileOperatorInitializationPrograms,
  compileOperatorUpgradeEventPrograms,
  compileOperatorPassivePrograms,
  resolveActiveOperatorUpgrades,
  type CompileUpgradeEntry,
} from './compileOperatorUpgrades';

function upgradeEntryCompiler(
  programs = new ActionGraphDefinitionRepository(),
): CompileUpgradeEntry {
  return (entry, level, path, owner) => {
    if (owner.actionGraph === undefined)
      throw new Error(`${path}: upgrade program requires its owning action graph`);
    return programs.compile(owner.actionGraph, level).compileEntry(entry, path);
  };
}

function emptyGraph(): ActionGraphResourceDefinition {
  return { main: { nodes: {} }, macros: {} };
}

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
        enableSequence: { $sequence: null },
        abilityEventResponses: [
          {
            event: 'abilityEntityFinished',
            priority: 0,
            sequence: { $sequence: 'response' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              response: {
                action: {
                  kind: 'changeResource',
                  parameters: { resource: 'sp', amount: [3, 7], recipient: 'team' },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    ],
    { basicAttack: 1, battleSkill: 2, comboSkill: 1, ultimate: 1 },
    upgradeEntryCompiler(),
  );
  expect(programs[0]).toMatchObject({
    initialBlackboard: { count: 2 },
    abilityEventResponses: [
      {
        event: 'abilityEntityFinished',
        sequence: actionSteps([{ kind: 'changeResource', parameters: { amount: 7 } }]),
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
    const programs = compileOperatorInitializationPrograms(
      [
        {
          source: 'potential',
          index: 0,
          level: 2,
          definition: {
            levels: 2,
            initializationSequence: { $sequence: 'init' },
            actionGraph: {
              main: {
                nodes: {
                  init: {
                    action: {
                      kind: 'applyBuff',
                      parameters: {
                        buffId: 'buff.potential',
                        target: 'caster',
                        blackboardAssignments: { add: [0.2, 0.3] },
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
      upgradeEntryCompiler(),
    );

    expect(programs).toMatchObject([
      {
        key: 'potential:0',
        sequence: actionSteps([
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff.potential',
              blackboardAssignments: { add: { kind: 'constant', value: 0.3 } },
            },
          },
        ]),
      },
    ]);
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

  it('applies cost multipliers in declaration order to explicitly selected skills', () => {
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
              skillKey: 'ultimate-a',
              resource: 'ultimateEnergy',
              multiplier: 0.8,
            },
            {
              kind: 'multiplySkillCost',
              skillKey: 'ultimate-b',
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
              skillKey: 'ultimate-a',
              resource: 'ultimateEnergy',
              multiplier: 0.5,
            },
            {
              kind: 'multiplySkillCost',
              skillKey: 'ultimate-b',
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
              skillKey: 'battleSkill',
              blackboardKey: 'talent_1',
              operation: 'assign',
              value: [1, 1],
            },
            {
              kind: 'patchSkillBlackboard',
              skillKey: 'battleSkill',
              blackboardKey: 'pulse_up',
              operation: 'multiply',
              value: [1, 1.3],
            },
            {
              kind: 'patchSkillBlackboard',
              skillKey: 'battleSkill',
              blackboardKey: 'level_two_flag',
              operation: 'assign',
              value: 1,
              minimumUpgradeLevel: 2,
              maximumUpgradeLevel: 2,
            },
            {
              kind: 'patchSkillBlackboard',
              skillKey: 'battleSkill',
              blackboardKey: 'level_one_flag',
              operation: 'assign',
              value: 1,
              maximumUpgradeLevel: 1,
            },
          ].flatMap(modifier =>
            ['battle-a', 'battle-b'].map(skillKey => ({
              ...modifier,
              kind: 'patchSkillBlackboard' as const,
              operation: modifier.operation as 'assign' | 'multiply',
              skillKey,
            })),
          ),
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
              skillKey: 'combo',
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
              skillKey: 'combo',
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
    const sequence = {
      graph: createActionGraphCompilation(
        {
          nodes: {
            reaction: {
              action: {
                key: 'combo.electrification',
                kind: 'applyElementalReaction' as const,
                parameters: {
                  reaction: 'electrification' as const,
                  target: 'enemy' as const,
                  durationSeconds: 5,
                  effectiveness: 1,
                },
              },
              next: null,
            },
          },
        },
        1,
        'combo-reaction',
      ).compileAll(),
      entry: 'reaction',
      callSite: 'combo-reaction',
    };
    const source = [
      {
        ...program('combo', 'comboSkill', 'sp', 0),
        skillType: 'comboSkill' as const,
        timelineActions: [
          {
            startFrame: 24,
            sequence,
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
              skillKey: 'combo',
              stepKey: 'combo.electrification',
              multiplier: 1.75,
            },
            {
              kind: 'setEffectiveness',
              skillKey: 'combo',
              stepKey: 'combo.electrification',
              value: 1.33,
            },
          ],
        },
      },
    ]);

    expect(rootActionSteps(patched[0]!.timelineActions[0]!.sequence)[0]).toMatchObject({
      kind: 'applyElementalReaction',
      parameters: { durationSeconds: 5, durationMultiplier: 1.75, effectiveness: 1.33 },
    });
    expect(rootActionSteps(source[0]!.timelineActions[0]!.sequence)[0]).toMatchObject({
      parameters: { durationSeconds: 5, effectiveness: 1 },
    });
  });

  it('resolves an upgrade event listener blackboard at the selected talent level', () => {
    const definition: OperatorUpgradeDefinition = {
      levels: 2,
      eventHandlers: [
        {
          event: { kind: 'elementalAttachmentConsumed' },
          blackboard: { crystal_up: [0.02, 0.04], duration: 15 },
          sequence: { $sequence: null },
        },
      ],
      actionGraph: emptyGraph(),
    };

    expect(
      compileOperatorUpgradeEventPrograms(
        [{ source: 'talent', index: 0, level: 2, definition }],
        upgradeEntryCompiler(),
      ),
    ).toMatchObject([
      {
        initialBlackboard: { crystal_up: 0.04, duration: 15 },
      },
    ]);
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
                skillKey: 'combo',
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
    const programs = compileOperatorPassivePrograms(
      [
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
                enableSequence: { $sequence: 'enable' },
                actionGraph: {
                  main: {
                    nodes: {
                      enable: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'persistent-buff',
                            target: 'caster',
                            blackboardAssignments: {
                              attackIncrease: { kind: 'valueNode', nodeId: 'test_data_1' },
                            },
                          },
                        },
                        next: null,
                      },
                    },

                    dataNodes: {
                      test_data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'attackIncrease' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            ],
          },
        },
      ],
      [],
      undefined,
      upgradeEntryCompiler(),
    );

    expect(programs).toEqual([
      {
        key: 'persistent-buff',
        initialBlackboard: { attackIncrease: 0.2 },
        enableSequence: actionSteps([
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'persistent-buff',
              target: 'caster',
              blackboardAssignments: {
                attackIncrease: expect.objectContaining({
                  kind: 'valueNode',
                  node: {
                    type: 'number',
                    expression: { kind: 'blackboard', key: 'attackIncrease' },
                  },
                }),
              },
            },
          },
        ]),
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
          enableSequence: { $sequence: null },
          actionGraph: emptyGraph(),
        },
      ],
      undefined,
      upgradeEntryCompiler(),
    );

    expect(programs).toEqual([
      {
        key: 'base-passive',
        initialBlackboard: { range: 50 },
        enableSequence: actionSteps([]),
      },
    ]);
  });

  it('rejects duplicate passive identities across active upgrades', () => {
    expect(() =>
      compileOperatorPassivePrograms(
        (['talent', 'potential'] as const).map(source => ({
          source,
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            passiveSkills: [
              {
                key: 'same-passive',
                enableSequence: { $sequence: null },
                actionGraph: emptyGraph(),
              },
            ],
          },
        })),
        [],
        undefined,
        upgradeEntryCompiler(),
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
                skillKey: 'missing',
                resource: 'ultimateEnergy',
                multiplier: 0.85,
              },
            ],
          },
        },
      ]),
    ).toThrow("references missing skill 'missing'");
    expect(() =>
      applyOperatorUpgradeSkillPatches(source, [
        {
          source: 'potential',
          index: 0,
          level: 1,
          definition: {
            levels: 1,
            modifiers: [{ kind: 'multiplySkillDamage', skillKey: 'ultimate', multiplier: 1.1 }],
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
                skillKey: 'missing',
                blackboardKey: 'atb',
                operation: 'add',
                value: 10,
              },
            ],
          },
        },
      ]),
    ).toThrow("references missing skill 'missing'");
  });
});

it('compiles graph upgrade hosts with shared nodes, distinct entries and level-specific values', () => {
  const sequence: ActionGraphReference = { $sequence: 'entry' };
  const actionGraph: ActionGraphResourceDefinition = {
    main: {
      nodes: {
        entry: {
          action: {
            kind: 'changeResource',
            parameters: { resource: 'sp', amount: [3, 7], recipient: 'team' },
          },
          next: null,
        },
      },
    },
    macros: {},
  };
  const definition = {
    levels: 2,
    actionGraph,
    initializationSequence: sequence,
    passiveSkills: [
      {
        key: 'shared-passive',
        blackboard: { count: [1, 2] },
        actionGraph,
        enableSequence: sequence,
        abilityEventResponses: [{ event: 'abilityEntityFinished', priority: 0, sequence }],
      },
    ],
    eventHandlers: [{ event: { kind: 'elementalAttachmentConsumed' }, sequence }],
  } satisfies OperatorUpgradeDefinition;
  const repository = new ActionGraphDefinitionRepository();
  const bind = (entry: ActionGraphReference, level: number, path: string) =>
    repository.compile(actionGraph, level).compileEntry(entry, path);
  const compile = (level: number) => {
    const upgrades = [{ source: 'talent' as const, index: 0, level, definition }];
    const initialization = compileOperatorInitializationPrograms(upgrades, bind)[0]!;
    const passive = compileOperatorPassivePrograms(upgrades, [], undefined, bind)[0]!;
    const event = compileOperatorUpgradeEventPrograms(upgrades, bind)[0]!;
    return {
      passive,
      entries: [
        initialization.sequence,
        passive.enableSequence,
        passive.abilityEventResponses![0]!.sequence,
        event.sequence,
      ],
    };
  };
  const first = compile(1);
  const second = compile(2);
  expect(first.passive.initialBlackboard).toEqual({ count: 1 });
  expect(second.passive.initialBlackboard).toEqual({ count: 2 });
  const graphEntries = second.entries;
  expect(new Set(graphEntries.map(entry => entry.graph)).size).toBe(1);
  expect(new Set(graphEntries.map(entry => entry.entry)).size).toBe(1);
  expect(new Set(graphEntries.map(entry => entry.callSite)).size).toBe(4);
  for (const entry of first.entries)
    expect(rootActionSteps(entry)).toMatchObject([{ parameters: { amount: 3 } }]);
  for (const entry of second.entries)
    expect(rootActionSteps(entry)).toMatchObject([{ parameters: { amount: 7 } }]);
});

it('direct talent Buff installations resolve level values without an operator graph entry', () => {
  const programs = compileOperatorInitializationPrograms(
    [
      {
        source: 'talent',
        index: 0,
        level: 2,
        definition: {
          levels: 2,
          attachedBuffs: [{ buffId: 'native-buff', blackboardAssignments: { power: [3, 7] } }],
        },
      },
    ],
    // 只含 attachedBuffs 的安装不需要图入口；传入即抛的占位编译器证明它未被调用。
    (entry: ActionGraphReference, level: number, path: string) => {
      throw new Error(`${path}: unexpected upgrade entry compile ${level} ${entry.$sequence}`);
    },
  );
  expect(programs).toHaveLength(1);
  expect(rootActionSteps(programs[0]!.sequence)).toMatchObject([
    {
      kind: 'applyBuff',
      parameters: {
        buffId: 'native-buff',
        target: 'caster',
        blackboardAssignments: { power: { kind: 'constant', value: 7 } },
      },
    },
  ]);
});
