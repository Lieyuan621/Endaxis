/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const gilbertaChr_0013_aglina_attack1ActionGraph = {
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
                skillId: 'chr_0013_aglina_attack1_projhit',
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
                            damageType: 'nature',
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
          parameters: { skillIds: ['chr_0013_aglina_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_attack1: SkillDefinition = {
  key: 'chr_0013_aglina_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 91,
  exclusiveFrame: 30,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0013_aglina_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 30, skillIds: ['chr_0013_aglina_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 18, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0013_aglina_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: gilbertaChr_0013_aglina_attack1ActionGraph,
};

export const gilbertaChr_0013_aglina_attack2ActionGraph = {
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
                skillId: 'chr_0013_aglina_attack2_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_3' } },
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
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
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
          parameters: { skillIds: ['chr_0013_aglina_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_attack2: SkillDefinition = {
  key: 'chr_0013_aglina_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.29, 0.31, 0.32, 0.35, 0.37, 0.41],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 118,
  exclusiveFrame: 30,
  offsetRecordFrame: 4,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 29,
        input: 'basicAttack',
        targetSkillId: 'chr_0013_aglina_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 29, skillIds: ['chr_0013_aglina_attack3'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 4, endFrame: 4, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 22, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0013_aglina_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: gilbertaChr_0013_aglina_attack2ActionGraph,
};

export const gilbertaChr_0013_aglina_attack3ActionGraph = {
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
                skillId: 'chr_0013_aglina_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
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
                            coefficient: { kind: 'constant', value: 0.3333333 },
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
                            damageType: 'nature',
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
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0013_aglina_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_attack3: SkillDefinition = {
  key: 'chr_0013_aglina_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.22, 0.23, 0.24, 0.26, 0.28, 0.3],
    display_atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
  },
  timelineBlockFrames: 23,
  naturalDurationFrames: 138,
  exclusiveFrame: 38,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 38,
        input: 'basicAttack',
        targetSkillId: 'chr_0013_aglina_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 23, endFrame: 38, skillIds: ['chr_0013_aglina_attack4'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 23, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0013_aglina_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: gilbertaChr_0013_aglina_attack3ActionGraph,
};

export const gilbertaChr_0013_aglina_attack4ActionGraph = {
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
                skillId: 'chr_0013_aglina_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
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
                            coefficient: { kind: 'constant', value: 0.3334 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_4' },
                            staggerMultiplier: { kind: 'constant', value: 0.34 },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      launchProjectile_3: {
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
                skillId: 'chr_0013_aglina_attack4_projhit_2',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
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
                            coefficient: { kind: 'constant', value: 0.3334 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                            stagger: { kind: 'valueNode', nodeId: 'data_4' },
                            staggerMultiplier: { kind: 'constant', value: 0.33 },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      withActionBlackboardScope_4: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_3' },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0013_aglina_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_attack4: SkillDefinition = {
  key: 'chr_0013_aglina_attack4',
  blackboard: {
    atb: 16,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.37],
    display_atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.12],
    poise: 16,
  },
  timelineBlockFrames: 40,
  naturalDurationFrames: 147,
  exclusiveFrame: 50,
  offsetRecordFrame: 23,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 50,
        input: 'basicAttack',
        targetSkillId: 'chr_0013_aglina_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 40, endFrame: 50, skillIds: ['chr_0013_aglina_attack1'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 40, endFrame: 50, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0013_aglina_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: gilbertaChr_0013_aglina_attack4ActionGraph,
};

export const gilbertaChr_0013_aglina_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.05,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_7: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.7,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_7',
      },
      applyBuff_9: {
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
      applyBuff_10: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_power_attack: SkillDefinition = {
  key: 'chr_0013_aglina_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 43,
  naturalDurationFrames: 125,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 43,
        endFrame: 50,
        skillIds: ['chr_0013_aglina_normal_skill', 'chr_0013_aglina_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 15, endFrame: 15, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 29, endFrame: 29, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 43, endFrame: 52, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 43, sequence: { $sequence: 'applyBuff_10' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: gilbertaChr_0013_aglina_power_attackActionGraph,
};

export const gilbertaChr_0013_aglina_plunging_attack_endActionGraph = {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'conditional_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_plunging_attack_end: SkillDefinition = {
  actionGraph: gilbertaChr_0013_aglina_plunging_attack_endActionGraph,
  key: 'chr_0013_aglina_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 94,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 0, endFrame: 5, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const gilbertaChr_0013_aglina_normal_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'radius',
            operation: 'assign',
            value: { kind: 'constant', value: 5.2 },
          },
        },
        next: null,
      },
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'radius',
            operation: 'assign',
            value: { kind: 'constant', value: 6.3 },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_1' },
          whenFalse: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0013_aglina_normal_skill',
            childSkillId: 'chr_0013_aglina_normal_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_5: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalSkill'],
          },
        },
        next: null,
      },
      heal_11: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_5' },
            addition: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      heal_10: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'contextTarget',
            contextKey: 'CureTarget',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_7' },
            addition: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_10' },
          whenFalse: { $sequence: 'heal_11' },
        },
        next: null,
      },
      findCharacterTeamTargets_14: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'CureTarget',
            selection: { kind: 'lowestHealthRatioOperator' },
          },
        },
        next: 'conditional_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_11' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_14' },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_15' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_14' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'conditional_opt1',
      },
      applyElementalInfliction_opt3: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: 'dealDamage_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'potential', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_pull' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_pull' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'heal_const' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'heal_const' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'CureTarget',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'controlledOperator',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'heal_const', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'constant', value: false },
          ],
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_explosion' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_normal_skill: SkillDefinition = {
  key: 'chr_0013_aglina_normal_skill',
  blackboard: {
    atk_scale_explosion: [0.58, 0.63, 0.69, 0.75, 0.81, 0.86, 0.92, 0.98, 1.04, 1.11, 1.2, 1.3],
    atk_scale_pull: [0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55],
    cam_angle: 0,
    cam_duration: 0,
    heal_const: 0,
    heal_scale: 0,
    input_angle: 0,
    maxChargeTime: 0,
    poise: 10,
    potential: 0,
    radius: 5.2,
    radiusadd_display: 0,
    recovercost: 0,
    display_atk_scale_pull: [
      0.97, 1.07, 1.17, 1.26, 1.36, 1.46, 1.56, 1.65, 1.75, 1.87, 2.02, 2.19,
    ],
  },
  timelineBlockFrames: 136,
  naturalDurationFrames: 203,
  exclusiveFrame: 135,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 123, endFrame: 148, skillIds: ['chr_0013_aglina_combo_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'spawnAbilityEntity_4' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 62, endFrame: 62, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 78, endFrame: 78, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 108, endFrame: 109, sequence: { $sequence: 'applyElementalInfliction_opt3' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: gilbertaChr_0013_aglina_normal_skillActionGraph,
};

export const gilbertaChr_0013_aglina_ultimate_skillActionGraph = {
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
      hideUi_2: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
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
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      applyElementalInfliction_5: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: 'dealDamage_4',
      },
      spawnAbilityEntity_6: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0013_aglina_ultimate_skill',
            childSkillId: 'chr_0013_aglina_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_7: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_4' },
            base: { kind: 'valueNode', nodeId: 'data_5' },
            targetKey: 'final_resistance_scalar_inair',
          },
        },
        next: 'spawnAbilityEntity_6',
      },
      storeSourceAttributeValue_8: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_6' },
            base: { kind: 'valueNode', nodeId: 'data_7' },
            targetKey: 'final_resistance_scalar',
          },
        },
        next: 'storeSourceAttributeValue_7',
      },
      applyBuff_9: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_increase_inair' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'resistance_scalar_inair' },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_increase' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'resistance_scalar' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_ultimate_skill: SkillDefinition = {
  actionGraph: gilbertaChr_0013_aglina_ultimate_skillActionGraph,
  key: 'chr_0013_aglina_ultimate_skill',
  blackboard: {
    atk_scale: [3.33, 3.67, 4, 4.33, 4.67, 5, 5.34, 5.67, 6, 6.42, 6.92, 7.5],
    damage_scale: 0.5,
    duration: 5,
    final_resistance_scalar: 0,
    final_resistance_scalar_inair: 0,
    move_speed_scalar: 0.8,
    poise: 20,
    potential_lv: 0,
    potential2: 0,
    potential2_onceadd: 0,
    radius: 5,
    resistance_scalar: 0,
    resistance_scalar_inair: 0,
    select_radius: 10,
    spell_vulnerable_perstack: 0.1,
    spell_vulnerable_rate: [0.18, 0.18, 0.18, 0.22, 0.22, 0.22, 0.26, 0.26, 0.26, 0.3, 0.3, 0.3],
    wisd_increase: 0,
    wisd_increase_inair: 0,
    spell_vulnerable_4stack: [
      0.252, 0.252, 0.252, 0.308, 0.308, 0.308, 0.364, 0.364, 0.364, 0.42, 0.42, 0.42,
    ],
  },
  timelineBlockFrames: 86,
  naturalDurationFrames: 116,
  exclusiveFrame: 85,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 64,
        endFrame: 91,
        skillIds: ['chr_0013_aglina_normal_skill', 'chr_0013_aglina_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 53, sequence: { $sequence: 'hideUi_2' } },
    { startFrame: 0, endFrame: 52, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 60, endFrame: 60, sequence: { $sequence: 'applyElementalInfliction_5' } },
    { startFrame: 60, endFrame: 65, sequence: { $sequence: 'storeSourceAttributeValue_8' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_9' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const gilbertaChr_0013_aglina_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      heal_3: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      heal_2: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'contextTarget',
            contextKey: 'CureTarget',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_3' },
            addition: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_2' },
          whenFalse: { $sequence: 'heal_3' },
        },
        next: null,
      },
      findCharacterTeamTargets_6: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'CureTarget',
            selection: { kind: 'lowestHealthRatioOperator' },
          },
        },
        next: 'conditional_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_3' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_6' },
        },
        next: null,
      },
      changeResourceByActionValue_8: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_7' },
        },
        next: 'changeResourceByActionValue_8',
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'conditional_opt1',
      },
      applyPhysicalInfliction_opt3: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    conditional_2: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
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
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
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
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
                showInHeadBarCommon: false,
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
                        },
                      },
                      next: null,
                    },
                    dealDamage_2: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_5: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
                        },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_6: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:3',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:2',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
                    },
                    withActionBlackboardScope_8: {
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
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
                    },
                    withActionBlackboardScope_9: {
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
                        body: { $sequence: 'applyBuff_1' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'constant', value: 2.5 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_opt2',
      },
      startTimeDilation_12: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_const' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'heal_const' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'CureTarget',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'controlledOperator',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'heal_const', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_9' },
            { kind: 'constant', value: false },
          ],
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_combo_skill: SkillDefinition = {
  key: 'chr_0013_aglina_combo_skill',
  blackboard: {
    atk_scale: [1.4, 1.54, 1.68, 1.82, 1.96, 2.1, 2.24, 2.38, 2.52, 2.7, 2.91, 3.15],
    heal_const: 0,
    heal_scale: 0,
    poise: 5,
    radius: 3,
    usp: 10,
  },
  timelineBlockFrames: 73,
  naturalDurationFrames: 130,
  exclusiveFrame: 72,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 53, endFrame: 72, skillIds: ['chr_0013_aglina_normal_skill'] },
      { startFrame: 53, endFrame: 72, skillIds: ['chr_0013_aglina_ultimate_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 48, endFrame: 50, sequence: { $sequence: 'applyPhysicalInfliction_opt3' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_12' } },
  ],
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: gilbertaChr_0013_aglina_combo_skillActionGraph,
};

export const gilbertaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: gilbertaCommon_character_perfect_dodgeActionGraph,
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

const gilbertaPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0013_aglina_talent_0',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: { add: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'add' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0013_aglina_talent_0',
  blackboard: { add: [0.04, 0.07] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: gilbertaPassive1ActionGraph,
};

const gilbertaComboCondition1ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0013_aglina_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: gilbertaComboCondition1ActionGraph,
};

const gilbertaBuff1ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'finishCurrentAbilityEntity_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.15,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'conditional_2' } },
  actionGraph: gilbertaBuff1ActionGraph,
};

const gilbertaBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0013_aglina_talent_0_effectbuff',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { add: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'add' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { add: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: gilbertaBuff2ActionGraph,
};

const gilbertaBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0013_aglina_talent_0_effectbuff_Add',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { add: 'add' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'operatorRoleIn',
          target: 'buffOwner',
          roles: ['guard', 'supporter', 'caster'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Skill/Character/chr_0013_aglina/AglinaTalent0'],
  extendTags: [],
  blackboard: { add: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'conditional_2' } },
  actionGraph: gilbertaBuff3ActionGraph,
};

const gilbertaBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Skill/Character/chr_0013_aglina/AglinaTalent0'],
  extendTags: [],
  blackboard: { add: 0 },
  attributeModifiers: [
    { attribute: 'UltimateSpGainScalar', slot: 'baseAddition', value: { blackboardKey: 'add' } },
  ],
  actionGraph: gilbertaBuff4ActionGraph,
};

const gilbertaBuff5ActionGraph = {
  main: {
    nodes: {
      readBuffStackCount_1: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'BuffStack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'BuffStack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'BuffStack',
            operation: 'multiply',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: 'modifyActionValue_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0013_aglina_ultimate_spell_vulnerable',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { rate: 'FinalRate' },
          },
        },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FinalRate',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'applyBuff_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'BuffStack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'modifyActionValue_6',
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'BuffStack',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: 'modifyActionValue_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_1' },
        },
        next: 'conditional_9',
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'BuffStack',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_10',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FinalRate',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_11',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_slow',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: -1 },
              rate: { kind: 'valueNode', nodeId: 'data_9' },
            },
          },
        },
        next: null,
      },
      withActionBlackboardScope_14: {
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
          body: { $sequence: 'applyBuff_13' },
        },
        next: null,
      },
      withActionBlackboardScope_15: {
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
          body: { $sequence: 'modifyActionValue_12' },
        },
        next: 'withActionBlackboardScope_14',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'BuffStack', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'BuffStack' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vulnerable_perstack' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential2', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vulnerable_rate' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'move_speed_scalar' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff5: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_down',
    iconPath: '/icons/icon_battle_buff_def_down.webp',
    showInHeadBarCommon: false,
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
  applyTags: ['Status/PauseAirborne'],
  extendTags: [],
  blackboard: {
    BuffStack: 0,
    final_resistance_scalar: 0,
    final_resistance_scalar_inair: 0,
    FinalRate: 0,
    move_speed_scalar: 0,
    potential2: 0,
    spell_vulnerable_perstack: 0,
    spell_vulnerable_rate: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'withActionBlackboardScope_15' } },
  actionGraph: gilbertaBuff5ActionGraph,
};

const gilbertaBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: -1 },
              rate: { kind: 'valueNode', nodeId: 'data_1' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const gilbertaBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: gilbertaBuff6ActionGraph,
};

export const gilberta: OperatorDefinition = {
  slug: 'gilberta',
  gameId: 'GILBERTA',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [9, 26, 44, 62, 80, 89],
    agility: [9, 27, 45, 64, 83, 92],
    intellect: [16, 39, 64, 89, 114, 127],
    will: [20, 52, 86, 120, 154, 171],
    baseAttack: [30, 94, 161, 228, 296, 329],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        gilbertaChr_0013_aglina_attack1,
        gilbertaChr_0013_aglina_attack2,
        gilbertaChr_0013_aglina_attack3,
        gilbertaChr_0013_aglina_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: gilbertaChr_0013_aglina_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: gilbertaChr_0013_aglina_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: gilbertaChr_0013_aglina_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: gilbertaChr_0013_aglina_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: gilbertaChr_0013_aglina_combo_skill,
    },
  ],
  dodgeSkill: gilbertaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0013_aglina_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0013_aglina_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0013_aglina_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0013_aglina_attack1',
        'chr_0013_aglina_attack2',
        'chr_0013_aglina_attack3',
        'chr_0013_aglina_attack4',
        'chr_0013_aglina_plunging_attack_end',
        'chr_0013_aglina_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0013_aglina_attack1',
        'chr_0013_aglina_attack2',
        'chr_0013_aglina_attack3',
        'chr_0013_aglina_attack4',
      ],
      defaultSkillKey: 'chr_0013_aglina_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [gilbertaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    { levels: 2, passiveSkills: [gilbertaPassive1] },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_const',
          operation: 'assign',
          value: [72, 108],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_const',
          operation: 'assign',
          value: [72, 108],
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
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'radiusadd_display',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'radius',
          operation: 'assign',
          value: 6.3,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2_onceadd',
          operation: 'assign',
          value: 0.1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0013_aglina_talent_0',
          blackboardKey: 'add',
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
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.3,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0013_aglina_normal_skill_monitor: gilbertaBuff1,
    buff_chr_0013_aglina_talent_0: gilbertaBuff2,
    buff_chr_0013_aglina_talent_0_effectbuff: gilbertaBuff3,
    buff_chr_0013_aglina_talent_0_effectbuff_Add: gilbertaBuff4,
    buff_chr_0013_aglina_ultimate_skill: gilbertaBuff5,
    buff_chr_0013_aglina_ultimate_spell_vulnerable: gilbertaBuff6,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0013_aglina_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              repeatEachTick_1: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.033,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: 0,
                    },
                  },
                  body: { $sequence: null },
                },
                next: null,
              },
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0013_aglina_normal_skill_monitor',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                    finishByAction: true,
                  },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0013_aglina_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 93,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          duration: 0,
          hasrecovered: 0,
          move_speed_scalar: 1,
          potential_lv: 0,
          radius: 0,
          recovercost: 5,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 93, sequence: { $sequence: 'repeatEachTick_1' } },
          { startFrame: 0, endFrame: 93, sequence: { $sequence: 'applyBuff_2' } },
        ],
      },
    },
    abilityentity_chr_0013_aglina_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              applyBuff_1: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0013_aglina_ultimate_skill',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      FinalRate: { kind: 'valueNode', nodeId: 'data_1' },
                      spell_vulnerable_rate: { kind: 'valueNode', nodeId: 'data_2' },
                      potential2: { kind: 'valueNode', nodeId: 'data_3' },
                      BuffStack: { kind: 'valueNode', nodeId: 'data_4' },
                      spell_vulnerable_perstack: { kind: 'valueNode', nodeId: 'data_5' },
                      move_speed_scalar: { kind: 'valueNode', nodeId: 'data_6' },
                    },
                  },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'FinalRate' } },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'spell_vulnerable_rate' },
              },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential2' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'BuffStack' } },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'spell_vulnerable_perstack' },
              },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'move_speed_scalar' },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0013_aglina_ultimate_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 180,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          BuffStack: 0,
          duration: 0,
          final_resistance_scalar: 0,
          final_resistance_scalar_inair: 0,
          FinalRate: 0,
          move_speed_scalar: 1,
          potential2: 0,
          potential2_onceadd: 0,
          radius: 5,
          resistance_scalar: 0.3,
          resistance_scalar_inair: 0.6,
          spell_vulnerable_perstack: 0,
          spell_vulnerable_rate: 0,
          wisd_increase: 0,
          wisd_increase_inair: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 180, sequence: { $sequence: 'applyBuff_1' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default gilberta;
