/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const xaihiChr_0011_seraph_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0011_seraph_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
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
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack1: SkillDefinition = {
  key: 'chr_0011_seraph_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 117,
  exclusiveFrame: 14,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0011_seraph_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 13, endFrame: 25, skillIds: ['chr_0011_seraph_attack2'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 13, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0011_seraph_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: xaihiChr_0011_seraph_attack1ActionGraph,
};

export const xaihiChr_0011_seraph_attack2ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0011_seraph_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
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
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack2: SkillDefinition = {
  key: 'chr_0011_seraph_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
    display_atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 121,
  exclusiveFrame: 20,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0011_seraph_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 17, endFrame: 28, skillIds: ['chr_0011_seraph_attack3'] }],
  },
  costFrame: 7,
  scheduledSequences: [
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 17, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0011_seraph_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: xaihiChr_0011_seraph_attack2ActionGraph,
};

export const xaihiChr_0011_seraph_attack3ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0011_seraph_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
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
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack3: SkillDefinition = {
  key: 'chr_0011_seraph_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.38, 0.4, 0.44, 0.47],
    display_atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.38, 0.4, 0.44, 0.47],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 125,
  exclusiveFrame: 14,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0011_seraph_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 25, skillIds: ['chr_0011_seraph_attack4'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 14, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0011_seraph_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: xaihiChr_0011_seraph_attack3ActionGraph,
};

export const xaihiChr_0011_seraph_attack4ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0011_seraph_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 4, sequence: { $sequence: 'dealDamage_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.5 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
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
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack5'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack4: SkillDefinition = {
  key: 'chr_0011_seraph_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    display_atk_scale: [0.33, 0.36, 0.4, 0.43, 0.46, 0.5, 0.53, 0.56, 0.59, 0.64, 0.68, 0.74],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 128,
  exclusiveFrame: 24,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0011_seraph_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 33, skillIds: ['chr_0011_seraph_attack5'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 21, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0011_seraph_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: xaihiChr_0011_seraph_attack4ActionGraph,
};

export const xaihiChr_0011_seraph_attack5ActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_opt1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack5: SkillDefinition = {
  key: 'chr_0011_seraph_attack5',
  blackboard: {
    atb: 15,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    poise: 15,
    display_atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
  timelineBlockFrames: 33,
  naturalDurationFrames: 137,
  exclusiveFrame: 33,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0011_seraph_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 33, endFrame: 40, skillIds: ['chr_0011_seraph_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 19, endFrame: 19, sequence: { $sequence: 'dealDamage_opt2' } },
    { startFrame: 33, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0011_seraph_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: xaihiChr_0011_seraph_attack5ActionGraph,
};

export const xaihiChr_0011_seraph_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_full_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_power_attack_disable_cast_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_power_attack: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_power_attackActionGraph,
  key: 'chr_0011_seraph_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 34,
  naturalDurationFrames: 160,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 34,
        endFrame: 53,
        skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'],
      },
    ],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 32, endFrame: 32, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 34, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const xaihiChr_0011_seraph_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'conditional_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_plunging_attack_end: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_plunging_attack_endActionGraph,
  key: 'chr_0011_seraph_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 116,
  exclusiveFrame: 12,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
            reason: 'other',
          },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'finishBuffsById_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_3' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_spawnball',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_up: 'atk_up',
              atk_scale: 'atk_scale',
              heal_value: 'heal_value',
              buff_duration: 'buff_duration',
              will_up: 'will_up',
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_normal_skill: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_normal_skillActionGraph,
  key: 'chr_0011_seraph_normal_skill',
  blackboard: {
    atb: 0,
    atk_scale: 0.1,
    atk_up: [0.09, 0.09, 0.09, 0.09, 0.09, 0.11, 0.11, 0.11, 0.13, 0.13, 0.13, 0.15],
    buff_duration: 25,
    duration: 20,
    heal_value: [144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324],
    will_up: [0.336, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 145,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'applyBuff_5' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const xaihiChr_0011_seraph_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchr', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_finishball_02',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0011_seraph_combo_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 0,
                  cryst_up: 0,
                  duration: 0,
                  exist_talent_1: 0,
                  poise: 0,
                  potential_3: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_3' } },
                  {
                    startFrame: 0,
                    endFrame: 3,
                    sequence: { $sequence: 'applyElementalInfliction_18' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0011_seraph_talent_1_crystup',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              cryst_up: 'cryst_up',
                              duration: 'duration',
                            },
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_1' },
                        },
                        next: null,
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_15: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_4' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: null,
                      },
                      startTimeDilation_16: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.2 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_hard_stop' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          },
                        },
                        next: 'changeResourceByActionValue_15',
                      },
                      dealDamage_17: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_6' },
                          },
                        },
                        next: 'startTimeDilation_16',
                      },
                      applyElementalInfliction_18: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'cryo', isExtra: false },
                        },
                        next: 'dealDamage_17',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: [
                            'Skill/Character/Common/SpellInflict/CrystInflict',
                            'Skill/Character/Common/SpellStatus/Frozen',
                          ],
                        },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'exist_talent_1', fallback: 0 },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_2' },
                          operator: 'greaterOrEqual',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      withActionBlackboardScope_9: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_5' },
        },
        next: null,
      },
      finishBuffsById_10: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'party',
            buffIds: ['buff_chr_0011_seraph_atk_buff_normal_skill'],
            reason: 'other',
          },
        },
        next: 'withActionBlackboardScope_9',
      },
      forEachContextTarget_11: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ball' },
          body: { $sequence: 'applyBuff_4' },
        },
        next: 'finishBuffsById_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_11' },
          whenFalse: { $sequence: 'forEachContextTarget_11' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_13: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ball',
            abilityEntityIds: [
              'abilityentity_chr_0011_seraph_normal_skill',
              'abilityentity_chr_0011_seraph_normal_skill_02',
              'abilityentity_chr_0011_seraph_normal_skill_03',
              'abilityentity_chr_0011_seraph_normal_skill_buff',
              'abilityentity_chr_0027_tangtang_normal_skill_02_02',
            ],
          },
        },
        next: 'conditional_12',
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0011_seraph_combo_skill_listener',
              'buff_chr_0011_seraph_normal_skill_heal',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_15: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.900000036 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'ball',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_combo_skill: SkillDefinition = {
  key: 'chr_0011_seraph_combo_skill',
  blackboard: {
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    cryst_up: 0,
    duration: 0,
    exist_talent_1: 0,
    poise: 10,
    potential_3: 0,
    usp: 10,
  },
  timelineBlockFrames: 43,
  naturalDurationFrames: 122,
  exclusiveFrame: 42,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 25, endFrame: 60, skillIds: ['chr_0011_seraph_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_13' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_14' } },
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'startTimeDilation_15' } },
  ],
  cooldownFrames: [240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 210],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: xaihiChr_0011_seraph_combo_skillActionGraph,
};

export const xaihiChr_0011_seraph_ultimate_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      findCharacterTeamTargets_2: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      startUltimateTimeDilation_3: {
        action: {
          kind: 'startUltimateTimeDilation',
          parameters: {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          },
        },
        next: null,
      },
      hideUi_4: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_atk_buff',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_up: 'atk_up',
              duration: 'duration',
              wisd_up: 'wisd_up',
              wisd_max: 'wisd_max',
            },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_ultimate_skill: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_ultimate_skillActionGraph,
  key: 'chr_0011_seraph_ultimate_skill',
  blackboard: {
    atk_up: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
    duration: 12,
    exist_talent_2: 0,
    wisd_max: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.36],
    wisd_up: [
      0.00014, 0.00015, 0.00016, 0.00018, 0.00019, 0.0002, 0.00022, 0.00023, 0.00024, 0.00026,
      0.00028, 0.0003,
    ],
  },
  timelineBlockFrames: 81,
  naturalDurationFrames: 183,
  exclusiveFrame: 80,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 67,
        endFrame: 100,
        skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'hideUi_4' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 58, endFrame: 61, sequence: { $sequence: 'applyBuff_6' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const xaihiCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: xaihiCommon_character_perfect_dodgeActionGraph,
  key: 'common_character_perfect_dodge',
  blackboard: {},
  timelineBlockFrames: 16,
  naturalDurationFrames: 15,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const xaihiBuff1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_final_atkup',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_final_atkup',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_natural',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_3' },
              rate: { kind: 'valueNode', nodeId: 'data_4' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0011_seraph_ultimate_effect_2',
            },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_crystal',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_5' },
              rate: { kind: 'valueNode', nodeId: 'data_6' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0011_seraph_ultimate_effect' },
          },
        },
        next: 'applyBuff_3',
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_final_atkup',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'applyBuff_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_1' },
          whenFalse: { $sequence: 'modifyActionValue_2' },
        },
        next: 'calculateActionValue_5',
      },
      storeSourceAttributeValue_7: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_12' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'final_atkup',
          },
        },
        next: 'conditional_6',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_max' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'final_atkup' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'final_final_atkup' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'final_final_atkup' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'final_final_atkup' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'final_atkup', fallback: 0 },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_max', fallback: 0 } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_10' },
        },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_up: 0,
    duration: 0,
    final_atkup: 0,
    final_final_atkup: 0,
    wisd_max: 0,
    wisd_up: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'storeSourceAttributeValue_7' } },
  actionGraph: xaihiBuff1ActionGraph,
};

const xaihiBuff2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0011_seraph_combo_count'],
            reason: 'other',
          },
        },
        next: null,
      },
      openComboWindow_2: {
        action: {
          kind: 'openComboWindow',
          parameters: { nextSkillKeyFromSlot: 'comboSkill', ownerContextKey: 'seraph' },
        },
        next: 'finishBuffsById_1',
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          },
        },
        next: 'openComboWindow_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_finishball_04',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'mergeContextTargets_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0011_seraph_combo_count'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff2: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enhanceChanged: { $sequence: 'conditional_5' } },
  actionGraph: xaihiBuff2ActionGraph,
};

const xaihiBuff3ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'finishCurrentAbilityEntity_1' } },
  actionGraph: xaihiBuff3ActionGraph,
};

const xaihiBuff4ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'currentTarget',
            buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishCurrentAbilityEntity_2: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'seraph' },
          body: { $sequence: 'finishBuffsById_1' },
        },
        next: 'finishCurrentAbilityEntity_2',
      },
      mergeContextTargets_4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          },
        },
        next: 'forEachContextTarget_3',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 6,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'mergeContextTargets_4' } },
  actionGraph: xaihiBuff4ActionGraph,
};

const xaihiBuff5ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_2: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_2' },
            base: { kind: 'valueNode', nodeId: 'data_3' },
            targetKey: 'final_heal_value',
          },
        },
        next: 'heal_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_potential_1_atkup',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { buff_duration: 'buff_duration', atk_up: 'atk_up' },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      withActionBlackboardScope_5: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey: 'native-buff-callback:1',
            lifetime: 'execution',
            alwaysNext: true,
            shareParentBlackboard: true,
            initialValues: {},
            inheritParent: true,
          },
          body: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey: 'native-buff-callback:0',
            lifetime: 'execution',
            alwaysNext: true,
            shareParentBlackboard: true,
            initialValues: {},
            inheritParent: true,
          },
          body: { $sequence: 'storeSourceAttributeValue_2' },
        },
        next: 'withActionBlackboardScope_5',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'will_up' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0.25,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0,
    atk_up: 0,
    buff_duration: 0,
    final_heal_value: 0,
    heal_value: 0,
    potential_1: 0,
    will_up: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_6' } },
  actionGraph: xaihiBuff5ActionGraph,
};

const xaihiBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_combo_count',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0011_seraph_normal_skill_heal',
            durationSeconds: { kind: 'constant', value: 0.3 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0011_seraph_mainchr_heal',
            target: 'buffOwner',
            sourceContextKey: 'seraph',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              heal_value: 'heal_value',
              potential_1: 'potential_1',
              buff_duration: 'buff_duration',
              atk_up: 'atk_up',
              will_up: 'will_up',
            },
          },
        },
        next: 'createTimedMarker_2',
      },
      forEachContextTarget_4: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ball' },
          body: { $sequence: 'applyBuff_1' },
        },
        next: 'applyBuff_3',
      },
      findOwnerSpawnedAbilityEntities_5: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ball',
            abilityEntityIds: ['abilityentity_chr_0011_seraph_normal_skill'],
            ownerContextKey: 'seraph',
          },
        },
        next: 'forEachContextTarget_4',
      },
      mergeContextTargets_6: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionSource' }],
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'mergeContextTargets_6' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_9' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0011_seraph_finishball_04'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0011_seraph_normal_skill_heal',
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_4' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.1,
    atk_up: 0,
    buff_duration: 0,
    duration: 20,
    heal_value: 20,
    potential_1: 0,
    will_up: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_10' } },
  ],
  actionGraph: xaihiBuff6ActionGraph,
};

const xaihiBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_spell',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'buff_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'buff_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, buff_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: xaihiBuff7ActionGraph,
};

const xaihiBuff8ActionGraph = {
  main: {
    nodes: {
      gainSquadUltimateEnergyFromSkillCost_1: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      spawnAbilityEntity_2: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
            childSkillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.1,
    atk_up: 0,
    buff_duration: 0,
    heal_value: 30,
    potential_1: 0,
    will_up: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'spawnAbilityEntity_2' } },
  actionGraph: xaihiBuff8ActionGraph,
};

const xaihiBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_cryst_taken_up',
    iconPath: '/icons/icon_battle_cryst_taken_up.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { cryst_up: 0, duration: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['cryo'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'cryst_up' },
        },
      ],
    },
  ],
  actionGraph: xaihiBuff9ActionGraph,
};

const xaihiBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_cryst_enhance',
    iconPath: '/icons/icon_battle_affix_cryst_enhance.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: xaihiBuff10ActionGraph,
};

const xaihiBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_natural_enhance',
    iconPath: '/icons/icon_battle_affix_natural_enhance.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: xaihiBuff11ActionGraph,
};

export const xaihi: OperatorDefinition = {
  slug: 'xaihi',
  gameId: 'XAIHI',
  rarity: 5,
  weaponType: 'arts-unit',
  element: 'cryo',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [9, 26, 44, 62, 80, 89],
    agility: [9, 26, 45, 64, 82, 91],
    intellect: [15, 39, 64, 89, 114, 127],
    will: [15, 43, 74, 104, 134, 150],
    baseAttack: [30, 86, 144, 203, 262, 291],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: {
    kind: 'abilityEntityCount',
    abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
    icon: '/operators/xaihi/battle.webp',
    nameKey: 'effects.name.auxiliaryCrystal',
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        xaihiChr_0011_seraph_attack1,
        xaihiChr_0011_seraph_attack2,
        xaihiChr_0011_seraph_attack3,
        xaihiChr_0011_seraph_attack4,
        xaihiChr_0011_seraph_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: xaihiChr_0011_seraph_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: xaihiChr_0011_seraph_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: xaihiChr_0011_seraph_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: xaihiChr_0011_seraph_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: xaihiChr_0011_seraph_ultimate_skill,
    },
  ],
  dodgeSkill: xaihiCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0011_seraph_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0011_seraph_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0011_seraph_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0011_seraph_attack1',
        'chr_0011_seraph_attack2',
        'chr_0011_seraph_attack3',
        'chr_0011_seraph_attack4',
        'chr_0011_seraph_attack5',
        'chr_0011_seraph_plunging_attack_end',
        'chr_0011_seraph_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0011_seraph_attack1',
        'chr_0011_seraph_attack2',
        'chr_0011_seraph_attack3',
        'chr_0011_seraph_attack4',
        'chr_0011_seraph_attack5',
      ],
      defaultSkillKey: 'chr_0011_seraph_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'exist_talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'cryst_up',
          operation: 'assign',
          value: [0.07, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: [5, 5],
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'exist_talent_2',
          operation: 'assign',
          value: 1,
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.05,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          resource: 'ultimateEnergy',
          multiplier: 0.9,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addStaticHealingIncrease', target: 'output', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'wisd_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'wisd_max',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0011_seraph_atk_buff: xaihiBuff1,
    buff_chr_0011_seraph_combo_count: xaihiBuff2,
    buff_chr_0011_seraph_finishball_02: xaihiBuff3,
    buff_chr_0011_seraph_finishball_04: xaihiBuff4,
    buff_chr_0011_seraph_mainchr_heal: xaihiBuff5,
    buff_chr_0011_seraph_normal_skill_heal: xaihiBuff6,
    buff_chr_0011_seraph_potential_1_atkup: xaihiBuff7,
    buff_chr_0011_seraph_spawnball: xaihiBuff8,
    buff_chr_0011_seraph_talent_1_crystup: xaihiBuff9,
    buff_chr_0011_seraph_ultimate_effect: xaihiBuff10,
    buff_chr_0011_seraph_ultimate_effect_2: xaihiBuff11,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0011_seraph_normal_skill: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0011_seraph/UltimateAbilityEntity',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              applyBuff_1: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0011_seraph_normal_skill_heal',
                    target: 'party',
                    source: 'currentAbilityEntity',
                    finishByAction: true,
                    blackboardAssignments: {
                      atk_scale: { kind: 'valueNode', nodeId: 'data_1' },
                      heal_value: { kind: 'valueNode', nodeId: 'data_2' },
                      potential_1: { kind: 'valueNode', nodeId: 'data_3' },
                      buff_duration: { kind: 'valueNode', nodeId: 'data_4' },
                      atk_up: { kind: 'valueNode', nodeId: 'data_5' },
                      will_up: { kind: 'valueNode', nodeId: 'data_6' },
                    },
                  },
                },
                next: null,
              },
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_common_full_immune',
                    target: 'currentAbilityEntity',
                    source: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              applyBuff_3: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0011_seraph_finishball_02',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishBuffsById_4: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'caster',
                    buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
                    reason: 'other',
                  },
                },
                next: 'applyBuff_3',
              },
              conditional_5: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: null },
                  whenFalse: { $sequence: 'finishBuffsById_4' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'buff_duration' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'will_up' } },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0011_seraph_finishball_04'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 900,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 0.1,
          atk_up: 0,
          buff_duration: 0,
          heal_value: 20,
          poise: 0,
          potential_1: 0,
          usp: 0,
          will_up: 0,
        },
        scheduledSequences: [
          { startFrame: 1, endFrame: 901, sequence: { $sequence: 'applyBuff_1' } },
          { startFrame: 0, endFrame: 1, sequence: { $sequence: 'applyBuff_2' } },
          { startFrame: 600, endFrame: 603, sequence: { $sequence: 'conditional_5' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default xaihi;
