/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const tangtangChr_0027_tangtang_attack1ActionGraph = {
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
                skillId: 'chr_0027_tangtang_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0.1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
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
          parameters: { skillIds: ['chr_0027_tangtang_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack1: SkillDefinition = {
  key: 'chr_0027_tangtang_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51],
  },
  timelineBlockFrames: 7,
  naturalDurationFrames: 90,
  exclusiveFrame: 15,
  offsetRecordFrame: 3,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 7, endFrame: 30, skillIds: ['chr_0027_tangtang_attack2'] }],
  },
  costFrame: 3,
  scheduledSequences: [
    { startFrame: 3, endFrame: 3, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 7, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0027_tangtang_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: tangtangChr_0027_tangtang_attack1ActionGraph,
};

export const tangtangChr_0027_tangtang_attack2ActionGraph = {
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
                skillId: 'chr_0027_tangtang_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale_1: 0.09 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_1' },
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
                skillId: 'chr_0027_tangtang_attack2_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale_2: 0.09 },
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
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
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
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack2: SkillDefinition = {
  key: 'chr_0027_tangtang_attack2',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale_2: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 117,
  exclusiveFrame: 18,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 39, skillIds: ['chr_0027_tangtang_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 18, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0027_tangtang_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: tangtangChr_0027_tangtang_attack2ActionGraph,
};

export const tangtangChr_0027_tangtang_attack3ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_2: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.06,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'dealDamage_1' },
        },
        next: null,
      },
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0027_tangtang_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale_2: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
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
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack3: SkillDefinition = {
  key: 'chr_0027_tangtang_attack3',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale_2: [0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06],
    display_atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 115,
  exclusiveFrame: 30,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 43,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 26, endFrame: 43, skillIds: ['chr_0027_tangtang_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 5, endFrame: 13, sequence: { $sequence: 'repeatEachTick_2' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 26, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  timelineContinuationSkillId: 'chr_0027_tangtang_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: tangtangChr_0027_tangtang_attack3ActionGraph,
};

export const tangtangChr_0027_tangtang_attack4ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack4: SkillDefinition = {
  key: 'chr_0027_tangtang_attack4',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    atk_scale_2: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46],
    display_atk_scale: [0.37, 0.4, 0.44, 0.47, 0.51, 0.55, 0.58, 0.62, 0.66, 0.7, 0.76, 0.82],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 143,
  exclusiveFrame: 28,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 50,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 24, endFrame: 50, skillIds: ['chr_0027_tangtang_attack5'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 23, endFrame: 28, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 24, endFrame: 50, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0027_tangtang_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: tangtangChr_0027_tangtang_attack4ActionGraph,
};

export const tangtangChr_0027_tangtang_attack5ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0027_tangtang_attack5_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, cnt: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      modifyActionValue_1: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_atk05_cnt',
                            operation: 'add',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_2: {
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
                        next: 'modifyActionValue_1',
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
                        },
                        next: null,
                      },
                      dealStagger_4: {
                        action: {
                          kind: 'dealStagger',
                          parameters: { value: { kind: 'valueNode', nodeId: 'data_4' } },
                        },
                        next: 'conditional_3',
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_5' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealStagger_4' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                          },
                        },
                        next: 'conditional_opt1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_atk05_cnt', fallback: 0 },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_2' },
                          operator: 'less',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_6: {
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
            entityInitialValues: { EntityBB_atk05_cnt: 0 },
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack5: SkillDefinition = {
  key: 'chr_0027_tangtang_attack5',
  blackboard: {
    atb: 18,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    cnt: 0,
    poise: 18,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 190,
  exclusiveFrame: 36,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 77,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 36, endFrame: 77, skillIds: ['chr_0027_tangtang_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 22, endFrame: 22, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 36, endFrame: 77, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0027_tangtang_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: tangtangChr_0027_tangtang_attack5ActionGraph,
};

export const tangtangChr_0027_tangtang_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.017,
                  inTangent: -0.0608355,
                  outTangent: -0.0608355,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8860931,
                  value: 0.3503852,
                  inTangent: 1.160006,
                  outTangent: 1.160006,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.5,
                  inTangent: 1.079618,
                  outTangent: 1.079618,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.3,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_1',
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.7,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_3',
      },
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'dealDamage_4',
      },
      applyBuff_6: {
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
      applyBuff_7: {
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

export const tangtangChr_0027_tangtang_power_attack: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_power_attackActionGraph,
  key: 'chr_0027_tangtang_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 48,
  naturalDurationFrames: 121,
  exclusiveFrame: 47,
  offsetRecordFrame: 0,
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'gainFinisherSp_5' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'applyBuff_7' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const tangtangChr_0027_tangtang_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_3: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 } },
          body: { $sequence: 'dealDamage_2' },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_plunging_attack_end: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_plunging_attack_endActionGraph,
  key: 'chr_0027_tangtang_plunging_attack_end',
  blackboard: { atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45] },
  timelineBlockFrames: 16,
  naturalDurationFrames: 118,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 3, endFrame: 11, sequence: { $sequence: 'repeatEachTick_3' } },
  ],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_2: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.02 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      once_4: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_2' },
        },
        next: 'startTimeDilation_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'once_4',
      },
      repeatEachTick_6: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 5,
              targetTriggerIntervalSeconds: 0.075,
            },
          },
          body: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_19: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'normalskill_watermove_1' },
          body: { $sequence: 'applyBuff_14' },
        },
        next: null,
      },
      spawnAbilityEntity_20: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'normalskill_watermove_1',
          },
        },
        next: 'forEachContextTarget_19',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_water_wake',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_8: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'water' },
          body: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_cnt', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'forEachContextTarget_8',
      },
      changeResourceByActionValue_10: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 2 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_10' },
        },
        next: null,
      },
      changeResourceByActionValue_11: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      forEachContextTarget_15: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'normalskill_watermove' },
          body: { $sequence: 'applyBuff_14' },
        },
        next: null,
      },
      spawnAbilityEntity_16: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'normalskill_watermove',
          },
        },
        next: 'forEachContextTarget_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_11' },
          whenFalse: { $sequence: 'conditional_12' },
        },
        next: 'spawnAbilityEntity_16',
      },
      forEachContextTarget_18: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'water' },
          body: { $sequence: 'modifyActionValue_9' },
        },
        next: 'conditional_17',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_18' },
          whenFalse: { $sequence: 'spawnAbilityEntity_20' },
        },
        next: null,
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'conditional_21',
      },
      modifyActionValue_23: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'modifyActionValue_22',
      },
      modifyActionValue_24: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'modifyActionValue_23',
      },
      findOwnerSpawnedAbilityEntities_25: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
          },
        },
        next: 'modifyActionValue_24',
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_opt1: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'normalwater_move' },
          body: { $sequence: 'applyBuff_26' },
        },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
          whenTrue: { $sequence: 'forEachContextTarget_opt1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_opt3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'normalwater_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            sameSourceSkillCast: true,
          },
        },
        next: 'conditional_opt2',
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_skillappear',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'water',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_12: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'normalwater_move',
          operator: 'greaterOrEqual',
          value: 1,
          outputKey: 'normalskillwatermove_cnt',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_normal_skill: SkillDefinition = {
  key: 'chr_0027_tangtang_normal_skill',
  blackboard: {
    atb_return: 20,
    atb_return_02: 40,
    atk_scale_02: 0,
    atk_scale_1: [0.16, 0.176, 0.192, 0.208, 0.224, 0.24, 0.256, 0.272, 0.288, 0.308, 0.332, 0.36],
    cam_angle: 0,
    cam_duration: 0,
    duration: 5,
    duration_spellvulnerable: 15,
    duration_tornado: 3,
    hit_cnt: 4,
    hit_cntmax: 10,
    hit_duration: 5,
    input_angle: 0,
    max_stack: 0,
    normalskillwatermove_cnt: 0,
    poise_tornado: 0,
    poise1: 2,
    potential_5_CrystDamageIncrease: 0,
    potential3: 0,
    potential5: 0,
    potential5_duration: 0,
    rate_spellvulnerable: [
      0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05,
    ],
    rate_spellvulnerable_02: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
    talent2: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    tornado_usp_01: 0,
    tornado_usp_02: 0,
    water_cnt: 0,
    display_atk_scale1: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    display_atk_scale2: [1.33, 1.47, 1.6, 1.74, 1.87, 2, 2.14, 2.27, 2.4, 2.57, 2.77, 3],
    display_poise: 10,
  },
  timelineBlockFrames: 51,
  naturalDurationFrames: 136,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 50, endFrame: 76, skillIds: ['chr_0027_tangtang_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 27, endFrame: 39, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 11, endFrame: 11, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_25' } },
    {
      startFrame: 44,
      endFrame: 45,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt3' },
    },
    { startFrame: 1, endFrame: 24, sequence: { $sequence: 'applyBuff_31' } },
  ],
  smartTarget: 'input',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: tangtangChr_0027_tangtang_normal_skillActionGraph,
};

export const tangtangChr_0027_tangtang_ultimate_skillActionGraph = {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_2' },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0027_tangtang_ultskill_vfx'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_6: {
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
      hideUi_7: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_8: {
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
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0027_tangtang_ultskill',
            childSkillId: 'chr_0027_tangtang_ultimate_skill_1',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'talent2_ultskill',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'spawnAbilityEntity_11',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_10' },
          whenFalse: { $sequence: 'spawnAbilityEntity_11' },
        },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration_spellvulnerable',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'rate_spellvulnerable_02',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'rate_spellvulnerable',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_16',
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'modifyActionValue_17',
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'talent2', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_duration_spellvulnerable' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable_02' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable' },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_ultimate_skill: SkillDefinition = {
  key: 'chr_0027_tangtang_ultimate_skill',
  blackboard: {
    atk_scale_1: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale_2: [1.778, 1.956, 2.134, 2.311, 2.489, 2.667, 2.845, 3.023, 3.2, 3.423, 3.689, 4],
    atk_scale_3: [3.111, 3.422, 3.734, 4.045, 4.356, 4.667, 4.978, 5.289, 5.6, 5.989, 6.456, 7],
    dmg_up_water_ult: 0,
    duration: 12,
    duration_spellvulnerable: 0,
    duration_talent1buff: 3,
    poise1: 0,
    poise2: 15,
    poise3: 20,
    potential1: 0,
    potential3_rate_spellvulnerable: 0,
    potential4: 0,
    potential5: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
    rate_vul_base: 0,
    ratio_speed: 0.2,
    ratio_speedreduction: 0.8,
    talent1_speed: 0,
    talent2: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    display_atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    display_duration: 4,
  },
  timelineBlockFrames: 85,
  naturalDurationFrames: 202,
  exclusiveFrame: 84,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 82,
        endFrame: 174,
        input: 'basicAttack',
        targetSkillId: 'chr_0027_tangtang_attack1',
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'finishBuffsById_5' } },
    { startFrame: 0, endFrame: 84, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 82, sequence: { $sequence: 'hideUi_7' } },
    { startFrame: 0, endFrame: 82, sequence: { $sequence: 'startUltimateTimeDilation_8' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'modifyActionValue_18' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: tangtangChr_0027_tangtang_ultimate_skillActionGraph,
};

export const tangtangChr_0027_tangtang_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      launchProjectile_12: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 3, recycleDelaySeconds: 30 },
          callbacks: [
            {
              event: 'finish',
              skill: {
                skillId: 'chr_0027_tangtang_combo_skill_water_gene',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 900,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { duration_water: 30, potential1: 0, radius: 4 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_16' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      createAbilityEntityTimedMarker_8: {
                        action: {
                          kind: 'createAbilityEntityTimedMarker',
                          parameters: {
                            markerId: 'tangtang_waterabilityentity01',
                            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
                            autoFinishByAction: false,
                            timeDomain: 'global',
                          },
                        },
                        next: null,
                      },
                      forEachContextTarget_13: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'water_abilityentity01' },
                          body: { $sequence: 'createAbilityEntityTimedMarker_8' },
                        },
                        next: null,
                      },
                      applyBuff_14: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0027_tangtang_water',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { duration_water: 'duration_water' },
                          },
                        },
                        next: 'forEachContextTarget_13',
                      },
                      spawnAbilityEntity_15: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
                            childSkillId: 'chr_0027_tangtang_combo_skill_water',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            saveToContextKey: 'water_abilityentity01',
                          },
                        },
                        next: 'applyBuff_14',
                      },
                      forEachContextTarget_7: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'water_abilityentity02' },
                          body: { $sequence: 'createAbilityEntityTimedMarker_8' },
                        },
                        next: null,
                      },
                      createAbilityEntityTimedMarker_2: {
                        action: {
                          kind: 'createAbilityEntityTimedMarker',
                          parameters: {
                            markerId: 'tangtang_waterabilityentity02',
                            durationSeconds: { kind: 'valueNode', nodeId: 'data_2' },
                            autoFinishByAction: false,
                            timeDomain: 'global',
                          },
                        },
                        next: null,
                      },
                      forEachContextTarget_4: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'water_abilityentity02' },
                          body: { $sequence: 'createAbilityEntityTimedMarker_2' },
                        },
                        next: null,
                      },
                      createAbilityEntityTimedMarker_1: {
                        action: {
                          kind: 'createAbilityEntityTimedMarker',
                          parameters: {
                            markerId: 'tangtang_waterabilityentity03',
                            durationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
                            autoFinishByAction: false,
                            timeDomain: 'global',
                          },
                        },
                        next: null,
                      },
                      forEachContextTarget_3: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'water_abilityentity02' },
                          body: { $sequence: 'createAbilityEntityTimedMarker_1' },
                        },
                        next: null,
                      },
                      conditional_6: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_3' },
                          whenFalse: { $sequence: 'forEachContextTarget_4' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_5' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_6' },
                          whenFalse: { $sequence: 'forEachContextTarget_7' },
                        },
                        next: null,
                      },
                      findOwnerSpawnedAbilityEntities_10: {
                        action: {
                          kind: 'findOwnerSpawnedAbilityEntities',
                          parameters: {
                            saveToContextKey: 'water_group',
                            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
                          },
                        },
                        next: 'conditional_9',
                      },
                      applyBuff_11: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0027_tangtang_water',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { duration_water: 'duration_water' },
                          },
                        },
                        next: 'findOwnerSpawnedAbilityEntities_10',
                      },
                      spawnAbilityEntity_12: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
                            childSkillId: 'chr_0027_tangtang_combo_skill_water',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            saveToContextKey: 'water_abilityentity02',
                          },
                        },
                        next: 'applyBuff_11',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'spawnAbilityEntity_12' },
                          whenFalse: { $sequence: 'spawnAbilityEntity_15' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'duration_water' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'duration_water' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'duration_water' },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'abilityEntityTimedMarkerPresent',
                          contextKey: 'water_group',
                          markerId: 'tangtang_waterabilityentity02',
                        },
                      },
                      data_5: {
                        type: 'boolean',
                        expression: {
                          kind: 'abilityEntityTimedMarkerPresent',
                          contextKey: 'water_group',
                          markerId: 'tangtang_waterabilityentity01',
                        },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0027_tangtang_water'],
                          operator: 'greater',
                          value: { kind: 'constant', value: 0 },
                        },
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
      withActionBlackboardScope_15: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_12' },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_15' },
          whenFalse: { $sequence: 'withActionBlackboardScope_15' },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_11' },
          whenFalse: { $sequence: 'conditional_11' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_14: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water_group',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
          },
        },
        next: 'conditional_13',
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_14' },
          whenFalse: { $sequence: 'withActionBlackboardScope_15' },
        },
        next: null,
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'combowater_cnt',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_16',
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tar_cnt',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResourceByActionValue_19: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'modifyActionValue_18',
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_19' },
        },
        next: 'startTimeDilation_20',
      },
      dealStagger_22: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_7' } },
        },
        next: 'conditional_21',
      },
      dealDamage_23: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'dealStagger_22',
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_17' },
        },
        next: 'dealDamage_23',
      },
      startTimeDilation_26: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.867000043 },
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
      startTimeDilation_27: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            targets: [],
            abilityEntityTargets: [{ kind: 'ownerSpawned' }],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'abilityEntityTimedMarkerPresent',
          contextKey: 'water_group',
          markerId: 'tangtang_waterabilityentity02',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'abilityEntityTimedMarkerPresent',
          contextKey: 'water_group',
          markerId: 'tangtang_waterabilityentity01',
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0027_tangtang_water'],
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'tar_cnt', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'combowater_cnt', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_combo_skill: SkillDefinition = {
  key: 'chr_0027_tangtang_combo_skill',
  blackboard: {
    atk_scale: [1.067, 1.173, 1.28, 1.387, 1.494, 1.6, 1.707, 1.814, 1.92, 2.054, 2.214, 2.4],
    cam_angle2: 0,
    cam_duration2: 0,
    combowater_cnt: 0,
    dmg_up_water_ult: 0,
    duration: 3,
    duration_talent1buff: 0,
    duration_water: 30,
    input_angle2: 0,
    max_stack: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    potential1: 0,
    potential3_duration: 0,
    potential5: 0,
    potential5_dmg_up_water_ult: 0,
    range_talent1buff: 5,
    ratio_speed: 0,
    ratio_speedreduction: 0,
    talent1_speed: 0,
    talent2: 0,
    tar_cnt: 0,
    usp: 10,
  },
  timelineBlockFrames: 42,
  naturalDurationFrames: 200,
  exclusiveFrame: 41,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 31, endFrame: 93, skillIds: ['chr_0027_tangtang_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 26, endFrame: 29, sequence: { $sequence: 'conditional_24' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'startTimeDilation_26' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'startTimeDilation_27' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [420, 420, 420, 420, 420, 420, 420, 420, 390, 390, 390, 360],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: tangtangChr_0027_tangtang_combo_skillActionGraph,
};

export const tangtangCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: tangtangCommon_character_perfect_dodgeActionGraph,
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

const tangtangPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_water_passiveui',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_passive_0',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: {
              duration_spellvulnerable: { kind: 'valueNode', nodeId: 'data_1' },
              normalskill_atk_scale01: { kind: 'valueNode', nodeId: 'data_2' },
              normalskill_atk_scale02: { kind: 'valueNode', nodeId: 'data_3' },
              normalskill_atk_scale03: { kind: 'valueNode', nodeId: 'data_4' },
              rate_spellvulnerable: { kind: 'valueNode', nodeId: 'data_5' },
              rate_spellvulnerable_02: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'duration_spellvulnerable' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0027_tangtang_passive_0',
  levelSource: 'battleSkill',
  blackboard: {
    duration_spellvulnerable: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    normalskill_atk_scale01: [
      0.111, 0.122, 0.133, 0.145, 0.156, 0.167, 0.178, 0.189, 0.2, 0.214, 0.231, 0.25,
    ],
    normalskill_atk_scale02: 0,
    normalskill_atk_scale03: 0,
    rate_spellvulnerable: [
      0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05,
    ],
    rate_spellvulnerable_02: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
  },
  enableSequence: { $sequence: 'applyBuff_2' },
  actionGraph: tangtangPassive1ActionGraph,
};

const tangtangComboCondition1ActionGraph = {
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
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['fireBurst', 'cryoBurst', 'electricBurst', 'natureBurst'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0027_tangtang_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: tangtangComboCondition1ActionGraph,
};

const tangtangComboCondition2ActionGraph = {
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0027_tangtang_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: tangtangComboCondition2ActionGraph,
};

const tangtangBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: { blackboardKey: 'hit_spelllnflictionmax' },
  durationSeconds: { blackboardKey: 'hit_spellduration' },
  applyTags: [],
  extendTags: [],
  blackboard: { hit_spellduration: 6, hit_spelllnflictionmax: 2 },
  attributeModifiers: [],
  actionGraph: tangtangBuff1ActionGraph,
};

const tangtangBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_speedup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_waterbuff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff2: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_waterbuff' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_tangtang_speedup',
    iconPath: '/icons/icon_battle_tangtang_speedup.webp',
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
  applyTags: [],
  extendTags: [],
  blackboard: { duration_waterbuff: 30, ratio_speed: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'finishBuffsById_2' },
    enable: { $sequence: 'applyBuff_1' },
  },
  actionGraph: tangtangBuff2ActionGraph,
};

const tangtangBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_speedup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_talent1buff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff3: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_talent1buff' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_tangtang_speedup',
    iconPath: '/icons/icon_battle_tangtang_speedup.webp',
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
  applyTags: [],
  extendTags: [],
  blackboard: { duration_talent1buff: 3, ratio_speed: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'conditional_2' } },
  actionGraph: tangtangBuff3ActionGraph,
};

const tangtangBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_slow',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_waterdebuff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speedreduction' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff4: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_waterdebuff' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_waterdebuff: 30, ratio_speedreduction: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: tangtangBuff4ActionGraph,
};

const tangtangBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_slow',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_talent1buff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speedreduction' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff5: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_talent1buff' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_talent1buff: 3, ratio_speedreduction: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: tangtangBuff5ActionGraph,
};

const tangtangBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10, duration_move: 1 },
  attributeModifiers: [],
  actionGraph: tangtangBuff6ActionGraph,
};

const tangtangBuff7ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, duration_move: 3, speed: 5, trigger: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'finishBuffsById_1' } },
  actionGraph: tangtangBuff7ActionGraph,
};

const tangtangBuff8ActionGraph = {
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
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
      readCurrentBuffRemainingDuration_2: {
        action: {
          kind: 'readCurrentBuffRemainingDuration',
          parameters: { outputKey: 'real_duration' },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'real_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff8: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate_spellvulnerable' },
  maxStackCount: { blackboardKey: 'cntmax' },
  durationSeconds: { blackboardKey: 'duration_spellvulnerable' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    cntmax: 1,
    duration_spellvulnerable: 10,
    rate_spellvulnerable: 0.05,
    rate_vul_base: 0,
    real_duration: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'readCurrentBuffRemainingDuration_2' } },
  actionGraph: tangtangBuff8ActionGraph,
};

const tangtangBuff9ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_duration_spellvulnerable',
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
            key: 'EntityBB_abilityentity_rate_spellvulnerable_02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_1',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_rate_spellvulnerable',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_5',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'duration_spellvulnerable' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    duration_spellvulnerable: 0,
    normalskill_atk_scale01: 0,
    normalskill_atk_scale02: 0,
    normalskill_atk_scale03: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'modifyActionValue_6' } },
  ],
  actionGraph: tangtangBuff9ActionGraph,
};

const tangtangBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_opt1: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'water_move' },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_opt2: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            sameSourceSkillCast: true,
          },
        },
        next: 'forEachContextTarget_opt1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'findOwnerSpawnedAbilityEntities_opt2' } },
  actionGraph: tangtangBuff10ActionGraph,
};

const tangtangBuff11ActionGraph = {
  main: {
    nodes: {
      findOwnerSpawnedAbilityEntities_1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: { saveToContextKey: 'ultwater_abilityentity', abilityEntityIds: [] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10, duration_move: 1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'findOwnerSpawnedAbilityEntities_1' } },
  actionGraph: tangtangBuff11ActionGraph,
};

const tangtangBuff12ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, duration_move: 3, speed: 8, trigger: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'finishBuffsById_1' } },
  actionGraph: tangtangBuff12ActionGraph,
};

const tangtangBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_ultskill_buff_damage',
            target: 'controlledOperator',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['plungingAttack'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'originSkillTypeIn', skillTypes: ['plungingAttack'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff13: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_tangtang_ultskilldebuff',
    iconPath: '/icons/icon_battle_tangtang_ultskilldebuff.webp',
    showInHeadBarCommon: false,
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeDamageAction', priority: 0, sequence: { $sequence: 'conditional_3' } },
  ],
  actionGraph: tangtangBuff13ActionGraph,
};

const tangtangBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: tangtangBuff14ActionGraph,
};

const tangtangBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff15: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'ultskill_debuff_duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_tangtang_ultskilldebuff',
    iconPath: '/icons/icon_battle_tangtang_ultskilldebuff.webp',
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
  blackboard: { timedilation_duration: -1, ultskill_debuff_duration: 4 },
  attributeModifiers: [],
  actionGraph: tangtangBuff15ActionGraph,
};

const tangtangBuff16ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'ultskill_watermove',
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_1',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_10: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ultskill_watermove' },
          body: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_5' },
        },
        next: 'forEachContextTarget_10',
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_water_ultskillwake',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_cnt', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'applyBuff_1',
      },
      forEachContextTarget_9: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'water' },
          body: { $sequence: 'modifyActionValue_2' },
        },
        next: 'conditional_11',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_9' },
          whenFalse: { $sequence: 'conditional_11' },
        },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'conditional_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_14',
      },
      findOwnerSpawnedAbilityEntities_16: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ultwater_abilityentity',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
          },
        },
        next: 'modifyActionValue_15',
      },
      findOwnerSpawnedAbilityEntities_17: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_16',
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_2',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_19: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ultwater_move' },
          body: { $sequence: 'applyBuff_18' },
        },
        next: null,
      },
      forEachContextTarget_opt1: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ultwater_move' },
          body: { $sequence: 'forEachContextTarget_19' },
        },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'forEachContextTarget_opt1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_opt3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ultwater_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            sameSourceSkillCast: true,
          },
        },
        next: 'conditional_opt2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'ultwater_abilityentity',
          operator: 'greater',
          value: 0,
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'water',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'ultwater_move',
          operator: 'greaterOrEqual',
          value: 1,
          outputKey: 'water_cnt',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    dmg_up_water_ult: 0,
    duration: 5,
    duration_spellvulnerable: 0,
    hit_cnt: 4,
    hit_cntmax: 10,
    hit_duration: 5,
    poise_tomado: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    water_cnt: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_17' } },
    {
      startFrame: 12,
      endFrame: 13,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt3' },
    },
  ],
  actionGraph: tangtangBuff16ActionGraph,
};

const tangtangBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff17: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: { blackboardKey: 'water_stack' },
  durationSeconds: { blackboardKey: 'duration_water' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_water: 30, water_stack: 2 },
  attributeModifiers: [],
  actionGraph: tangtangBuff17ActionGraph,
};

const tangtangBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff18: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_speedup',
    iconPath: '/icons/icon_battle_affix_speedup.webp',
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
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  actionGraph: tangtangBuff18ActionGraph,
};

const tangtangBuff19ActionGraph = {
  main: {
    nodes: {
      setCharacterPassiveUiValue_7: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_num', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'setCharacterPassiveUiValue_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'modifyActionValue_8' },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'water_num',
            operation: 'add',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'setCharacterPassiveUiValue_7',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'modifyActionValue_11' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'water_num' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff19: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { water_num: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'abilityEntitySpawned', priority: 0, sequence: { $sequence: 'conditional_9' } },
    { event: 'abilityEntityFinished', priority: 0, sequence: { $sequence: 'conditional_12' } },
  ],
  actionGraph: tangtangBuff19ActionGraph,
};

const tangtangBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: tangtangBuff20ActionGraph,
};

const tangtangBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff21: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: tangtangBuff21ActionGraph,
};

export const tangtang: OperatorDefinition = {
  slug: 'tangtang',
  gameId: 'TANGTANG',
  rarity: 6,
  weaponType: 'handcannon',
  element: 'cryo',
  role: 'caster',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 37, 61, 86, 111, 123],
    agility: [23, 56, 91, 126, 162, 179],
    intellect: [8, 25, 42, 59, 77, 85],
    will: [10, 29, 50, 71, 91, 102],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        tangtangChr_0027_tangtang_attack1,
        tangtangChr_0027_tangtang_attack2,
        tangtangChr_0027_tangtang_attack3,
        tangtangChr_0027_tangtang_attack4,
        tangtangChr_0027_tangtang_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: tangtangChr_0027_tangtang_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: tangtangChr_0027_tangtang_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: tangtangChr_0027_tangtang_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: tangtangChr_0027_tangtang_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: tangtangChr_0027_tangtang_combo_skill,
    },
  ],
  dodgeSkill: tangtangCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0027_tangtang_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0027_tangtang_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0027_tangtang_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
        'chr_0027_tangtang_plunging_attack_end',
        'chr_0027_tangtang_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
      ],
      defaultSkillKey: 'chr_0027_tangtang_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'ult',
      modeLayer: 'default',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0027_tangtang_ult_attack3' } },
    },
    {
      modeId: 'ult_end',
      modeLayer: 'default',
      defaultEnabled: false,
      commandMappings: { basicAttack: { skillId: 'chr_0027_tangtang_ult_attack5' } },
    },
  ],
  comboSkillConditions: [tangtangComboCondition1, tangtangComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent1_speed',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'ratio_speedreduction',
          operation: 'assign',
          value: [0.2, 0.4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'ratio_speed',
          operation: 'assign',
          value: [0.1, 0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'duration_talent1buff',
          operation: 'assign',
          value: [3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'range_talent1buff',
          operation: 'assign',
          value: [5, 5],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'assign',
          value: [0.4, 0.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'assign',
          value: [0.4, 0.6],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb_return',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'cryo', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0027_tangtang_passive_0',
          blackboardKey: 'normalskill_atk_scale01',
          operation: 'multiply',
          value: 1.1,
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
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'add',
          value: 0.8,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'add',
          value: 0.8,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_abilityentity_duration_spellvulnerable: 0,
    EntityBB_abilityentity_rate_spellvulnerable: 0,
    EntityBB_abilityentity_rate_spellvulnerable_02: 0,
    EntityBB_abilityentity_water01: 0,
    EntityBB_abilityentity_water02: 0,
    EntityBB_abilityentity_water03: 0,
  },
  passiveSkills: [tangtangPassive1],
  buffDefinitions: {
    buff_chr_0027_tangtang_comboskill_spelllnfliction: tangtangBuff1,
    buff_chr_0027_tangtang_comboskill_waterbuff: tangtangBuff2,
    buff_chr_0027_tangtang_comboskill_waterbuff_outaura: tangtangBuff3,
    buff_chr_0027_tangtang_comboskill_waterdebuff: tangtangBuff4,
    buff_chr_0027_tangtang_comboskill_waterdebuff_outaura: tangtangBuff5,
    buff_chr_0027_tangtang_normalskill_abilityentity_1: tangtangBuff6,
    buff_chr_0027_tangtang_normalskill_abilityentity_2: tangtangBuff7,
    buff_chr_0027_tangtang_normalskill_spellvulnerable: tangtangBuff8,
    buff_chr_0027_tangtang_passive_0: tangtangBuff9,
    buff_chr_0027_tangtang_skillappear: tangtangBuff10,
    buff_chr_0027_tangtang_ultskill_abilityentity_1: tangtangBuff11,
    buff_chr_0027_tangtang_ultskill_abilityentity_2: tangtangBuff12,
    buff_chr_0027_tangtang_ultskill_buff: tangtangBuff13,
    buff_chr_0027_tangtang_ultskill_buff_damage: tangtangBuff14,
    buff_chr_0027_tangtang_ultskill_debuff: tangtangBuff15,
    buff_chr_0027_tangtang_ultskill_waterwake: tangtangBuff16,
    buff_chr_0027_tangtang_water: tangtangBuff17,
    buff_chr_0027_tangtang_water_icon: tangtangBuff18,
    buff_chr_0027_tangtang_water_passiveui: tangtangBuff19,
    buff_chr_0027_tangtang_water_ultskillwake: tangtangBuff20,
    buff_chr_0027_tangtang_water_wake: tangtangBuff21,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0027_tangtang_normal_skill_move: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWaterMove',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_abilityentitymove: {
          skillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale: 0.1,
            atk_scale_03: 0,
            duration: 5,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            poise: 5,
            poise_tornado: 0,
            water_cnt: 0,
          },
          scheduledSequences: [
            { startFrame: 12, endFrame: 12, sequence: { $sequence: 'conditional_11' } },
            {
              startFrame: 298,
              endFrame: 298,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_12' },
            },
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_13' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_9: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'water_cnt',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_10: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_6: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_7: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_6',
                },
                spawnAbilityEntity_2: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_2',
                },
                spawnAbilityEntity_4: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'spawnAbilityEntity_4' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_7' },
                  },
                  next: null,
                },
                conditional_11: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_4' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'conditional_8' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_10' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_12: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                applyBuff_13: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1',
                      target: 'currentAbilityEntity',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                },
              },
            },
            macros: {},
          },
        },
        chr_0027_tangtang_ult_skill_abilityentitymove: {
          skillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 151,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale: 0.1,
            dmg_up_water_ult: 0,
            duration: 5,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            poise: 5,
            poise_tornado: 0,
            talent2: 0,
            talent2_ultskill: 0,
            water_cnt: 0,
          },
          scheduledSequences: [
            { startFrame: 18, endFrame: 18, sequence: { $sequence: 'conditional_11' } },
            {
              startFrame: 150,
              endFrame: 150,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_12' },
            },
          ],
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_9: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'water_cnt',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_10: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_6: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_7: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_6',
                },
                spawnAbilityEntity_2: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'modifyActionValue_9',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_2',
                },
                spawnAbilityEntity_4: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'spawnAbilityEntity_4' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_7' },
                  },
                  next: null,
                },
                conditional_11: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_4' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'conditional_8' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_10' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_12: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                },
              },
            },
            macros: {},
          },
        },
      },
    },
    abilityentity_chr_0027_tangtang_comboskill_water: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Immune/Stunned',
        'Immune/Frozen',
        'Immune/Airborne',
        'Immune/KnockDown',
        'Immune/KnockBack',
        'Immune/Pull',
        'Immune/PowerSmash',
        'Immune/Poise',
        'Skill/Character/chr_0027_tangtang/ComboSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 2,
      childSkill: {
        skillId: 'chr_0027_tangtang_combo_skill_water',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1550,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_water: 1,
          duration_talent1buff: 3,
          max_stack: 0,
          potential1: 0,
          potential3_duration: 0,
          potential5: 0,
          potential5_dmg_up_water_ult: 0,
          range_talent1buff: 5,
          ratio_speed: 0.2,
          ratio_speedreduction: 0.8,
          talent1_speed: 0,
          talent2_ultskill: 0,
          tornado_atk_scale01: 0,
          tornado_atk_scale02: 0,
          tornado_atk_scale03: 0,
        },
        scheduledSequences: [
          {
            startFrame: 1500,
            endFrame: 1501,
            sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_10' },
          },
          {
            startFrame: 1515,
            endFrame: 1516,
            sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt5' },
          },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_22' } },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_23' } },
          {
            startFrame: 1500,
            endFrame: 1501,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_24' },
          },
          {
            startFrame: 1515,
            endFrame: 1516,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_24' },
          },
          {
            startFrame: 900,
            endFrame: 901,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_27' },
          },
          {
            startFrame: 1500,
            endFrame: 1501,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_24' },
          },
          {
            startFrame: 1515,
            endFrame: 1516,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_24' },
          },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'conditional_34' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              launchProjectile_3: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                  callbacks: [],
                },
                next: null,
              },
              forEachContextTarget_5: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { contextKey: 'tangtang' },
                  body: { $sequence: 'launchProjectile_3' },
                },
                next: null,
              },
              conditional_7: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'forEachContextTarget_5' },
                  whenFalse: { $sequence: 'forEachContextTarget_5' },
                },
                next: null,
              },
              finishBuffsById_8: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'caster',
                    buffIds: ['buff_chr_0027_tangtang_water'],
                    reason: 'other',
                    count: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              conditional_9: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'forEachContextTarget_5' },
                  whenFalse: { $sequence: 'conditional_7' },
                },
                next: 'finishBuffsById_8',
              },
              findOwnerSpawnedAbilityEntities_10: {
                action: {
                  kind: 'findOwnerSpawnedAbilityEntities',
                  parameters: {
                    saveToContextKey: 'tangtang',
                    abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
                  },
                },
                next: 'conditional_9',
              },
              forEachContextTarget_15: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { contextKey: 'ultskill_center_abilityentity' },
                  body: { $sequence: 'launchProjectile_3' },
                },
                next: null,
              },
              conditional_17: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_3' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'forEachContextTarget_15' },
                  whenFalse: { $sequence: 'forEachContextTarget_15' },
                },
                next: null,
              },
              conditional_19: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'forEachContextTarget_15' },
                  whenFalse: { $sequence: 'conditional_17' },
                },
                next: 'finishBuffsById_8',
              },
              conditional_opt4: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'conditional_19' },
                },
                next: null,
              },
              findOwnerSpawnedAbilityEntities_opt5: {
                action: {
                  kind: 'findOwnerSpawnedAbilityEntities',
                  parameters: {
                    saveToContextKey: 'ultskill_center_abilityentity',
                    abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
                  },
                },
                next: 'conditional_opt4',
              },
              jumpTimeline_22: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: {
                    destinationFrame: 1500,
                    condition: { kind: 'conditionNode', nodeId: 'data_8' },
                  },
                },
                next: null,
              },
              jumpTimeline_23: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: {
                    destinationFrame: 1515,
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  },
                },
                next: null,
              },
              finishActionOwnerAbilityEntity_24: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
              finishActionOwnerAbilityEntity_27: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: 'finishBuffsById_8',
              },
              applyBuff_30: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff',
                    target: 'partyExceptCaster',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff_outaura',
                        target: 'partyExceptCaster',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          duration_talent1buff: { kind: 'valueNode', nodeId: 'data_10' },
                          ratio_speed: { kind: 'valueNode', nodeId: 'data_11' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      ratio_speed: { kind: 'valueNode', nodeId: 'data_12' },
                    },
                  },
                },
                next: null,
              },
              finishBuffsById_31: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'partyExceptCaster',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
                    reason: 'other',
                  },
                },
                next: 'applyBuff_30',
              },
              applyBuff_32: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff',
                    target: 'enemy',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff_outaura',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          duration_talent1buff: { kind: 'valueNode', nodeId: 'data_13' },
                          ratio_speedreduction: { kind: 'valueNode', nodeId: 'data_14' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      ratio_speedreduction: { kind: 'valueNode', nodeId: 'data_15' },
                    },
                  },
                },
                next: 'finishBuffsById_31',
              },
              finishBuffsById_33: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterdebuff_outaura'],
                    reason: 'other',
                  },
                },
                next: 'applyBuff_32',
              },
              conditional_34: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
                  whenTrue: { $sequence: 'finishBuffsById_33' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'abilityEntityTimedMarkerPresent',
                  markerId: 'tangtang_waterabilityentity02',
                },
              },
              data_2: {
                type: 'boolean',
                expression: {
                  kind: 'abilityEntityTimedMarkerPresent',
                  markerId: 'tangtang_waterabilityentity01',
                },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'abilityEntityTimedMarkerPresent',
                  markerId: 'tangtang_waterabilityentity02',
                },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'abilityEntityTimedMarkerPresent',
                  markerId: 'tangtang_waterabilityentity01',
                },
              },
              data_5: {
                type: 'boolean',
                expression: {
                  kind: 'contextTargetCountCompare',
                  contextKey: 'ultskill_center_abilityentity',
                  operator: 'greater',
                  value: 0,
                },
              },
              data_6: {
                type: 'boolean',
                expression: {
                  kind: 'contextTargetCountCompare',
                  contextKey: 'ultskill_center_abilityentity',
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'all',
                  conditions: [
                    { kind: 'conditionNode', nodeId: 'data_5' },
                    { kind: 'conditionNode', nodeId: 'data_6' },
                  ],
                },
              },
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0027_tangtang_water_wake'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0027_tangtang_water_ultskillwake'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
              data_10: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'duration_talent1buff' },
              },
              data_11: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
              data_12: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
              data_13: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'duration_talent1buff' },
              },
              data_14: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'ratio_speedreduction' },
              },
              data_15: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'ratio_speedreduction' },
              },
              data_16: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent1_speed', fallback: 0 },
              },
              data_17: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_16' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0027_tangtang_ultskill: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
        'Skill/Character/chr_0027_tangtang/UltSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      childSkill: {
        skillId: 'chr_0027_tangtang_ultimate_skill_1',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 210,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_1: 0,
          atk_scale_2: 0,
          atk_scale_3: 0,
          dmg_up_water_ult: 0,
          duration: 12,
          duration_spellvulnerable: 0,
          duration_talent1buff: 3,
          max_stack: 0,
          poise1: 0,
          poise2: 0,
          poise3: 0,
          potential_5_CrystDamageIncrease: 0,
          potential1: 0,
          potential3_rate_spellvulnerable: 0,
          potential4: 0,
          potential5: 0,
          potential5_duration: 0,
          rate_spellvulnerable: 0,
          rate_spellvulnerable_02: 0,
          rate_vul_base: 0,
          ratio_speed: 0,
          ratio_speedreduction: 0.8,
          talent1_speed: 0,
          talent2: 0,
          talent2_ultskill: 0,
          tomado_atk_scale01: 0,
          tomado_atk_scale02: 0,
          tomado_atk_scale03: 0,
          water_cnt: 0,
          potential3: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 120, sequence: { $sequence: 'repeatEachTick_2' } },
          { startFrame: 120, endFrame: 123, sequence: { $sequence: 'dealDamage_3' } },
          { startFrame: 133, endFrame: 136, sequence: { $sequence: 'dealDamage_5' } },
          {
            startFrame: 0,
            endFrame: 121,
            sequence: { $sequence: 'createAbilityEntityTimedMarker_8' },
          },
          { startFrame: 128, endFrame: 136, sequence: { $sequence: 'conditional_12' } },
          { startFrame: 128, endFrame: 128, sequence: { $sequence: 'conditional_14' } },
          { startFrame: 127, endFrame: 128, sequence: { $sequence: 'finishTimeline_15' } },
          { startFrame: 0, endFrame: 119, sequence: { $sequence: 'listenForCombatEvents_18' } },
          {
            startFrame: 127,
            endFrame: 128,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_19' },
          },
          {
            startFrame: 156,
            endFrame: 157,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_19' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_1: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              repeatEachTick_2: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.033,
                      maxCountPerTarget: 8,
                      targetTriggerIntervalSeconds: 0.5,
                    },
                  },
                  body: { $sequence: 'dealDamage_1' },
                },
                next: null,
              },
              dealDamage_3: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    takeAttackSnapshot: true,
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_3/action',
                },
                next: null,
              },
              startTimeDilation_4: {
                action: {
                  kind: 'startTimeDilation',
                  parameters: {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.15 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_hard_stop' },
                    finishByAction: false,
                    targets: ['controlled'],
                  },
                },
                next: null,
              },
              dealDamage_5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                    takeAttackSnapshot: true,
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: 'startTimeDilation_4',
              },
              applyBuff_6: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_ultskill_buff',
                    target: 'partyExceptCaster',
                    source: 'currentAbilityEntity',
                    finishByAction: true,
                    iconDurationSource: {
                      kind: 'actionOwnerTimedMarker',
                      markerId: 'tangtang_ult',
                    },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              applyBuff_7: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_ultskill_debuff',
                    target: 'enemy',
                    finishByAction: true,
                    iconDurationSource: {
                      kind: 'actionOwnerTimedMarker',
                      markerId: 'tangtang_ult',
                    },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_6',
              },
              createAbilityEntityTimedMarker_8: {
                action: {
                  kind: 'createAbilityEntityTimedMarker',
                  parameters: {
                    markerId: 'tangtang_ult',
                    durationSeconds: { kind: 'constant', value: 4 },
                    autoFinishByAction: true,
                    timeDomain: 'self',
                  },
                },
                next: 'applyBuff_7',
              },
              applyBuff_11: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_ultskill_debuff',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              calculateActionValue_10: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'potential3_rate_spellvulnerable',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    right: { kind: 'valueNode', nodeId: 'data_7' },
                  },
                },
                next: 'applyBuff_11',
              },
              conditional_12: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'calculateActionValue_10' },
                  whenFalse: { $sequence: 'applyBuff_11' },
                },
                next: null,
              },
              applyBuff_13: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0027_tangtang_ultskill_waterwake',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      talent2_ultskill: 'talent2_ultskill',
                      dmg_up_water_ult: 'dmg_up_water_ult',
                      rate_spellvulnerable: 'rate_spellvulnerable',
                      rate_spellvulnerable_02: 'rate_spellvulnerable_02',
                      duration_spellvulnerable: 'duration_spellvulnerable',
                    },
                  },
                },
                next: null,
              },
              conditional_14: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
                  whenTrue: { $sequence: 'applyBuff_13' },
                },
                next: null,
              },
              finishTimeline_15: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
              jumpTimeline_16: {
                action: { kind: 'jumpTimeline', parameters: { destinationFrame: 128 } },
                next: null,
              },
              conditional_17: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                  whenTrue: { $sequence: 'jumpTimeline_16' },
                },
                next: null,
              },
              listenForCombatEvents_18: {
                action: {
                  kind: 'listenForCombatEvents',
                  parameters: {
                    responses: [
                      {
                        key: 'SkillData.chr_0027_tangtang_ultimate_skill_1.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                        event: { kind: 'abilityEvent', event: 'outputBuff' },
                        phase: 'dataAction',
                        priority: 0,
                        sequence: { $sequence: 'conditional_17' },
                      },
                    ],
                  },
                },
                next: null,
              },
              finishActionOwnerAbilityEntity_19: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential3_rate_spellvulnerable' },
              },
              data_7: { type: 'number', expression: { kind: 'blackboard', key: 'rate_vul_base' } },
              data_8: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential3', fallback: 0 },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_8' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_10: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent2', fallback: 0 },
              },
              data_11: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_10' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_12: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'controlledOperator',
                  buffIds: ['buff_chr_0027_tangtang_ultskill_buff_damage'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_03: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration_spellvulnerable: 'duration_spellvulnerable',
                        rate_spellvulnerable: 'rate_spellvulnerable_02',
                      },
                    },
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_4' },
                    whenFalse: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyBuff_3' },
                  },
                  next: 'conditional_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_11' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_7',
                },
                repeatEachTick_9: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_8' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_10: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_11: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_10' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_9' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_02: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration_spellvulnerable: 'duration_spellvulnerable',
                        rate_spellvulnerable: 'rate_spellvulnerable_02',
                      },
                    },
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_4' },
                    whenFalse: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyBuff_3' },
                  },
                  next: 'conditional_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_11' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_7',
                },
                repeatEachTick_9: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_8' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_10: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_11: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_10' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_9' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration_spellvulnerable: 'duration_spellvulnerable',
                        rate_spellvulnerable: 'rate_spellvulnerable_02',
                      },
                    },
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_4' },
                    whenFalse: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyBuff_3' },
                  },
                  next: 'conditional_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_11' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_7',
                },
                repeatEachTick_9: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_8' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_10: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_11: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_10' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_9' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02_02: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0011_seraph/UltimateAbilityEntity',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_1: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration_spellvulnerable: 'duration_spellvulnerable',
                        rate_spellvulnerable: 'rate_spellvulnerable',
                      },
                    },
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_4' },
                    whenFalse: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyBuff_3' },
                  },
                  next: 'conditional_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_11' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_7',
                },
                repeatEachTick_9: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_8' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_10: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_11: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_10' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0.2,
            dmg_up_water_ult: 0,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_9' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_1: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration_spellvulnerable: 'duration_spellvulnerable',
                        rate_spellvulnerable: 'rate_spellvulnerable',
                      },
                    },
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_4' },
                    whenFalse: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyBuff_3' },
                  },
                  next: 'conditional_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_11' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_7',
                },
                repeatEachTick_9: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_8' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_10: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_11: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_10' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0.2,
            dmg_up_water_ult: 0,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_9' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_1',
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: null,
                },
                conditional_5: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_7' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'dealDamage_3' },
                    whenFalse: { $sequence: 'dealDamage_4' },
                  },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_9' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: 'conditional_5',
                },
                repeatEachTick_7: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'conditional_6' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_8: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax_01' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            atk_water: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            hit_spelllnflictionmax_01: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            talent2: 0,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'repeatEachTick_7' } },
            {
              startFrame: 90,
              endFrame: 90,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_8' },
            },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'applyElementalInfliction_2' },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_obtain_ultimate_sp',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'conditional_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default tangtang;
