/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const zhuangFangyiChr_0030_zhuangfy_attack1ActionGraph = {
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
                skillId: 'chr_0030_zhuangfy_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
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
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack1: SkillDefinition = {
  key: 'chr_0030_zhuangfy_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    atk_scale_sword: 0.2,
    sword_dist: 0,
    display_atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 123,
  exclusiveFrame: 23,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 30, skillIds: ['chr_0030_zhuangfy_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 15, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack1ActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_attack2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 14 },
          },
        },
        next: null,
      },
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'add',
            value: { kind: 'constant', value: 3 },
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
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_3',
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 2,
            recycleDelaySeconds: 0.100000001490116,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0030_zhuangfy_attack2_sword_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_sword: 1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
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
                        expression: { kind: 'blackboard', key: 'atk_scale_sword' },
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
      withActionBlackboardScope_7: {
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
      withActionBlackboardScope_8: {
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
        next: 'withActionBlackboardScope_7',
      },
      spawnAbilityEntity_9: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack2',
            childSkillId: 'chr_0030_zhuangfy_attack2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'sword_dist', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 10 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack2: SkillDefinition = {
  key: 'chr_0030_zhuangfy_attack2',
  blackboard: {
    atk_scale: [0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08],
    atk_scale_sword: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    sword_dist: 0,
    display_atk_scale: [0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.5, 0.54],
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 320,
  exclusiveFrame: 27,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 36,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 36, skillIds: ['chr_0030_zhuangfy_attack3'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'modifyActionValue_4' } },
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'spawnAbilityEntity_9' } },
    { startFrame: 15, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack2ActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_attack3ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 14 },
          },
        },
        next: null,
      },
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'add',
            value: { kind: 'constant', value: 3 },
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
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_3',
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 2,
            recycleDelaySeconds: 0.100000001490116,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0030_zhuangfy_attack3_sword_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_sword: 0.3 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
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
                        expression: { kind: 'blackboard', key: 'atk_scale_sword' },
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
      withActionBlackboardScope_7: {
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
      withActionBlackboardScope_8: {
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
        next: 'withActionBlackboardScope_7',
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'sword_dist', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 10 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack3: SkillDefinition = {
  key: 'chr_0030_zhuangfy_attack3',
  blackboard: {
    atb: 0,
    atk_scale_sword: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    sword_dist: 0,
    display_atk_scale: [0.32, 0.35, 0.39, 0.42, 0.45, 0.48, 0.52, 0.55, 0.58, 0.62, 0.67, 0.72],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 105,
  exclusiveFrame: 29,
  offsetRecordFrame: 14,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 26, endFrame: 39, skillIds: ['chr_0030_zhuangfy_attack4'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'modifyActionValue_4' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 26, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack3ActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_attack4ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack2',
            childSkillId: 'chr_0030_zhuangfy_attack2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_2: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack5'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack4: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack4ActionGraph,
  key: 'chr_0030_zhuangfy_attack4',
  blackboard: {
    atk_scale: [0.11, 0.12, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25],
    display_atk_scale: [0.45, 0.5, 0.54, 0.59, 0.63, 0.68, 0.72, 0.77, 0.81, 0.87, 0.93, 1.01],
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 170,
  exclusiveFrame: 23,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 17, endFrame: 33, skillIds: ['chr_0030_zhuangfy_attack5'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 11, endFrame: 14, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 17, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_attack5ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack5',
            childSkillId: 'chr_0030_zhuangfy_attack5_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_2: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack5: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack5ActionGraph,
  key: 'chr_0030_zhuangfy_attack5',
  blackboard: {
    atb: 18,
    atk_scale: [0.48, 0.53, 0.58, 0.62, 0.67, 0.72, 0.77, 0.82, 0.86, 0.92, 1, 1.08],
    poise: 18,
  },
  timelineBlockFrames: 50,
  naturalDurationFrames: 165,
  exclusiveFrame: 55,
  offsetRecordFrame: 20,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 21,
        endFrame: 60,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 50, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 50, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'startTimeDilation_2',
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.9,
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_power_attack: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_power_attackActionGraph,
  key: 'chr_0030_zhuangfy_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 41,
  naturalDurationFrames: 153,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 41,
        endFrame: 45,
        skillIds: [
          'chr_0030_zhuangfy_attack1',
          'chr_0030_zhuangfy_combo_skill',
          'chr_0030_zhuangfy_normal_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 11, endFrame: 14, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 40, endFrame: 43, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const zhuangFangyiChr_0030_zhuangfy_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      finishTimeline_1: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishTimeline_1' },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'conditional_4',
      },
      finishCurrentAbilityEntity_6: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'airSword' },
          body: { $sequence: 'finishCurrentAbilityEntity_6' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_8: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'airSword',
            abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_air_attack'],
          },
        },
        next: 'forEachContextTarget_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findOwnerSpawnedAbilityEntities_8' },
        },
        next: null,
      },
      inheritBuffById_10: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0030_zhuangfy_air_attack_ult_extend_buff',
            inheritToNextSkillIds: [],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_plunging_attack_end: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_plunging_attack_endActionGraph,
  key: 'chr_0030_zhuangfy_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 170,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 125, endFrame: 128, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'inheritBuffById_10' } },
  ],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_normal_skillActionGraph = {
  main: {
    nodes: {
      setAbilityEntityRemainingDuration_1: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: { value: { kind: 'constant', value: 3 } },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'setAbilityEntityRemainingDuration_1' },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'swordsForExtend' },
          body: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'swordsForExtend',
            abilityEntityIds: [
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
            ],
          },
        },
        next: 'forEachContextTarget_3',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      launchProjectile_12: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: { reachAfterTicks: 1, maxDurationSeconds: 2, finishOnReach: false },
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0030_zhuangfy_normal_skill_gene_sword_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { remain_sword_limit: 0, sword_duration: 0, swordsForLimit: 0 },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 1,
                    sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_12' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_5: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
                            childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                            blackboardAssignments: {
                              EntityBB_swordDuration: { kind: 'valueNode', nodeId: 'data_1' },
                              EntityBB_swordLimit: { kind: 'valueNode', nodeId: 'data_2' },
                            },
                          },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'spawnAbilityEntity_5' },
                          whenFalse: { $sequence: 'spawnAbilityEntity_5' },
                        },
                        next: null,
                      },
                      finishCurrentAbilityEntity_1: {
                        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
                        next: null,
                      },
                      forEachContextTarget_7: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'swordToDie' },
                          body: { $sequence: 'finishCurrentAbilityEntity_1' },
                        },
                        next: 'conditional_9',
                      },
                      pickContextTarget_8: {
                        action: {
                          kind: 'pickContextTarget',
                          parameters: {
                            sourceContextKey: 'swords',
                            saveToContextKey: 'swordToDie',
                            index: { kind: 'constant', value: 0 },
                          },
                        },
                        next: 'forEachContextTarget_7',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'pickContextTarget_8' },
                          whenFalse: { $sequence: 'conditional_9' },
                        },
                        next: null,
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                          whenTrue: { $sequence: 'conditional_10' },
                        },
                        next: null,
                      },
                      findOwnerSpawnedAbilityEntities_12: {
                        action: {
                          kind: 'findOwnerSpawnedAbilityEntities',
                          parameters: {
                            saveToContextKey: 'swords',
                            abilityEntityIds: [
                              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
                              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
                            ],
                          },
                        },
                        next: 'conditional_11',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'sword_duration' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'remain_sword_limit' },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'swordsForLimit', fallback: 0 },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_4' },
                          operator: 'greaterOrEqual',
                          right: { kind: 'valueNode', nodeId: 'data_5' },
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'swords',
                          operator: 'greaterOrEqual',
                          value: 0,
                          outputKey: 'swordsForLimit',
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
      withActionBlackboardScope_13: {
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
      repeatByActionValue_24: {
        action: {
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'valueNode', nodeId: 'data_2' } },
          body: { $sequence: 'withActionBlackboardScope_13' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_25: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'repeatByActionValue_24',
      },
      createSpatialPointTargets_26: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'swordPos',
            count: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: 'createSpatialPointTargets_26',
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: 'conditional_27',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: null,
      },
      changeResourceByActionValue_18: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'conditional_27',
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_6' },
        },
        next: 'changeResourceByActionValue_18',
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_19',
      },
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'modifyActionValue_20',
      },
      finishBuffsByTag_22: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            reason: 'early',
          },
        },
        next: 'modifyActionValue_21',
      },
      readBuffBlackboard_23: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            },
            desiredKey: 'count',
            outputKey: 'conductCnt',
          },
        },
        next: 'finishBuffsByTag_22',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_23' },
          whenFalse: { $sequence: 'conditional_28' },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_29',
      },
      conditional_31: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_5' },
        },
        next: 'applyBuff_30',
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              interval: 'swordTriggerInterval',
              sword_range: 'sword_range',
              atk_scale: 'atk_scale',
              poise: 'poise',
              usp_extra: 'usp_extra',
              atk_up_final: 'atk_up_final',
              remain_sword_limit: 'remain_sword_limit',
              final_rate: 'final_rate',
            },
          },
        },
        next: null,
      },
      calculateActionValue_33: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_up_final',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'applyBuff_32',
      },
      calculateActionValue_34: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'swordTriggerInterval',
            operation: 'add',
            left: { kind: 'constant', value: 0.3 },
            right: { kind: 'valueNode', nodeId: 'data_18' },
          },
        },
        next: 'calculateActionValue_33',
      },
      modifyActionValue_35: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'swordTriggerInterval',
            operation: 'multiply',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'calculateActionValue_34',
      },
      calculateActionValue_36: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'swordTriggerInterval',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'constant', value: 90 },
          },
        },
        next: 'modifyActionValue_35',
      },
      conditional_37: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_36' },
        },
        next: null,
      },
      startTimeDilation_opt1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7704785,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.313321,
                  outTangent: 4.313321,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
          whenTrue: { $sequence: 'startTimeDilation_opt1' },
        },
        next: null,
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_talent1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      jumpTimeline_45: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 116,
            condition: { kind: 'conditionNode', nodeId: 'data_26' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'less',
          value: { kind: 'constant', value: 3 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'sword_gene_num' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'sword_gene_num' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'free_sword_limit', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_6' },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'max_conduct_sword' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'sword_gene_num', fallback: 0 },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_conduct_sword', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_11' },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'conductCnt' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up_per_conduct' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'conductCnt' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'swordTriggerInterval' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_SwordNum' } },
      data_20: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_20' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_22: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_23: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'skillEnd' },
      },
      data_24: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_24' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_23' },
            { kind: 'conditionNode', nodeId: 'data_25' },
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_normal_skill: SkillDefinition = {
  key: 'chr_0030_zhuangfy_normal_skill',
  blackboard: {
    atb_return: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
    atk_up_final: 0,
    atk_up_per_conduct: [0.03, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.07, 0.08, 0.09],
    cam_angle: 0,
    conductCnt: 0,
    final_rate: 6,
    free_sword_limit: 3,
    input_angle: 0,
    max_conduct_sword: 3,
    poise: 15,
    remain_sword_limit: 9,
    sword_duration: 36,
    sword_gene_num: 0,
    sword_range: 50,
    swordTriggerInterval: 0,
    usp_extra: 6,
    usp_extra_limit: 54,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 290,
  exclusiveFrame: 135,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 45,
        endFrame: 116,
        skillIds: [
          'chr_0030_zhuangfy_attack1',
          'chr_0030_zhuangfy_attack2',
          'chr_0030_zhuangfy_attack3',
          'chr_0030_zhuangfy_attack4',
          'chr_0030_zhuangfy_attack5',
          'chr_0030_zhuangfy_normal_skill',
          'chr_0030_zhuangfy_power_attack',
        ],
      },
      {
        startFrame: 120,
        endFrame: 147,
        skillIds: [
          'chr_0030_zhuangfy_attack1',
          'chr_0030_zhuangfy_attack2',
          'chr_0030_zhuangfy_attack3',
          'chr_0030_zhuangfy_attack4',
          'chr_0030_zhuangfy_attack5',
          'chr_0030_zhuangfy_normal_skill',
          'chr_0030_zhuangfy_power_attack',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_4' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'conditional_31' } },
    { startFrame: 13, endFrame: 16, sequence: { $sequence: 'conditional_37' } },
    { startFrame: 123, endFrame: 126, sequence: { $sequence: 'conditional_opt2' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'applyBuff_41' } },
    { startFrame: 123, endFrame: 126, sequence: { $sequence: 'conditional_opt2' } },
    { startFrame: 16, endFrame: 116, sequence: { $sequence: 'jumpTimeline_45' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_normal_skillActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_normal_skill_ultActionGraph = {
  main: {
    nodes: {
      setAbilityEntityRemainingDuration_1: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: { value: { kind: 'constant', value: 3 } },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'setAbilityEntityRemainingDuration_1' },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'swordsForExtend' },
          body: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'swordsForExtend',
            abilityEntityIds: [
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
            ],
          },
        },
        next: 'forEachContextTarget_3',
      },
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      launchProjectile_23: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: { reachAfterTicks: 1, maxDurationSeconds: 2, finishOnReach: false },
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0030_zhuangfy_normal_skill_gene_sword_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { remain_sword_limit: 0, sword_duration: 0, swordsForLimit: 0 },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 1,
                    sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_12' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_5: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
                            childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                            blackboardAssignments: {
                              EntityBB_swordDuration: { kind: 'valueNode', nodeId: 'data_1' },
                              EntityBB_swordLimit: { kind: 'valueNode', nodeId: 'data_2' },
                            },
                          },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'spawnAbilityEntity_5' },
                          whenFalse: { $sequence: 'spawnAbilityEntity_5' },
                        },
                        next: null,
                      },
                      finishCurrentAbilityEntity_1: {
                        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
                        next: null,
                      },
                      forEachContextTarget_7: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'swordToDie' },
                          body: { $sequence: 'finishCurrentAbilityEntity_1' },
                        },
                        next: 'conditional_9',
                      },
                      pickContextTarget_8: {
                        action: {
                          kind: 'pickContextTarget',
                          parameters: {
                            sourceContextKey: 'swords',
                            saveToContextKey: 'swordToDie',
                            index: { kind: 'constant', value: 0 },
                          },
                        },
                        next: 'forEachContextTarget_7',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'pickContextTarget_8' },
                          whenFalse: { $sequence: 'conditional_9' },
                        },
                        next: null,
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                          whenTrue: { $sequence: 'conditional_10' },
                        },
                        next: null,
                      },
                      findOwnerSpawnedAbilityEntities_12: {
                        action: {
                          kind: 'findOwnerSpawnedAbilityEntities',
                          parameters: {
                            saveToContextKey: 'swords',
                            abilityEntityIds: [
                              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
                              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
                            ],
                          },
                        },
                        next: 'conditional_11',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'sword_duration' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'remain_sword_limit' },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'swordsForLimit', fallback: 0 },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_4' },
                          operator: 'greaterOrEqual',
                          right: { kind: 'valueNode', nodeId: 'data_5' },
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'swords',
                          operator: 'greaterOrEqual',
                          value: 0,
                          outputKey: 'swordsForLimit',
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
      withActionBlackboardScope_24: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_23' },
        },
        next: null,
      },
      repeatByActionValue_36: {
        action: {
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'valueNode', nodeId: 'data_2' } },
          body: { $sequence: 'withActionBlackboardScope_24' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_37: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'repeatByActionValue_36',
      },
      createSpatialPointTargets_38: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'swordPos',
            count: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_37',
      },
      modifyActionValue_39: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: '__endaxis_target_group_count:swordPos',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'createSpatialPointTargets_38',
      },
      conditional_40: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_21' },
        },
        next: 'modifyActionValue_39',
      },
      conditional_41: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_21' },
        },
        next: 'conditional_40',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: null,
      },
      changeResourceByActionValue_30: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'conditional_40',
      },
      conditional_31: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_17' },
        },
        next: 'changeResourceByActionValue_30',
      },
      modifyActionValue_32: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_31',
      },
      modifyActionValue_33: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sword_gene_num',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'modifyActionValue_32',
      },
      finishBuffsByTag_34: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            reason: 'early',
          },
        },
        next: 'modifyActionValue_33',
      },
      readBuffBlackboard_35: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            },
            desiredKey: 'count',
            outputKey: 'conductCnt',
          },
        },
        next: 'finishBuffsByTag_34',
      },
      conditional_43: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_35' },
          whenFalse: { $sequence: 'conditional_41' },
        },
        next: null,
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
            reason: 'other',
          },
        },
        next: 'repeatByActionValue_36',
      },
      createSpatialPointTargets_15: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'swordPos', count: { kind: 'constant', value: 3 } },
        },
        next: 'finishBuffsById_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: '__endaxis_target_group_count:swordPos',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'createSpatialPointTargets_15',
      },
      createSpatialPointTargets_11: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'swordPos', count: { kind: 'constant', value: 4 } },
        },
        next: 'finishBuffsById_14',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: '__endaxis_target_group_count:swordPos',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: 'createSpatialPointTargets_11',
      },
      conditional_42: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_12' },
          whenFalse: { $sequence: 'modifyActionValue_16' },
        },
        next: null,
      },
      conditional_44: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_42' },
          whenFalse: { $sequence: 'conditional_43' },
        },
        next: null,
      },
      applyBuff_45: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_44',
      },
      applyBuff_46: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_talent1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_47: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult',
            childSkillId: 'chr_0030_zhuangfy_normal_skill_ult_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            blackboardAssignments: { EntityBB_SwordNum: { kind: 'valueNode', nodeId: 'data_18' } },
          },
        },
        next: null,
      },
      calculateActionValue_48: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_up_final',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'spawnAbilityEntity_47',
      },
      finishBuffsById_49: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_50: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
          whenTrue: { $sequence: 'finishBuffsById_49' },
        },
        next: null,
      },
      jumpTimeline_51: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 100,
            condition: { kind: 'conditionNode', nodeId: 'data_25' },
          },
        },
        next: null,
      },
      holdBuffsById_52: {
        action: {
          kind: 'holdBuffsById',
          parameters: { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'less',
          value: { kind: 'constant', value: 3 },
        },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: '__endaxis_target_group_count:swordPos' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'sword_gene_num' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'sword_gene_num' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'free_sword_limit', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'max_conduct_sword' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'sword_gene_num', fallback: 0 },
      },
      data_12: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_conduct_sword', fallback: 0 },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_12' },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'conductCnt' } },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_SwordNum' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'conductCnt' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up_per_conduct' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'skillEnd' },
      },
      data_23: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_23' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_22' },
            { kind: 'conditionNode', nodeId: 'data_24' },
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_normal_skill_ult: SkillDefinition = {
  key: 'chr_0030_zhuangfy_normal_skill_ult',
  blackboard: {
    atb_return: 0,
    atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    atk_up_final: 0,
    atk_up_per_conduct: [0.08, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18],
    cam_angle: 0,
    conductCnt: 0,
    final_rate: 6,
    free_sword_limit: 3,
    input_angle: 0,
    max_conduct_sword: 3,
    poise: 15,
    remain_sword_limit: 9,
    sword_duration: 36,
    sword_gene_num: 0,
    sword_range: 50,
    swordTriggerInterval: 0,
  },
  timelineBlockFrames: 30,
  naturalDurationFrames: 210,
  exclusiveFrame: 143,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 30,
        endFrame: 143,
        skillIds: [
          'chr_0030_zhuangfy_attack1_ult',
          'chr_0030_zhuangfy_attack2_ult',
          'chr_0030_zhuangfy_attack3_ult',
          'chr_0030_zhuangfy_normal_skill_ult',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_4' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'applyBuff_45' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'applyBuff_46' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'calculateActionValue_48' } },
    { startFrame: 100, endFrame: 103, sequence: { $sequence: 'conditional_50' } },
    { startFrame: 16, endFrame: 100, sequence: { $sequence: 'jumpTimeline_51' } },
    { startFrame: 0, endFrame: 18, sequence: { $sequence: 'holdBuffsById_52' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_normal_skill_ultActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_combo_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_pulse_pulse_conduct_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { count: 'conductCnt' },
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_3' },
        },
        next: 'applyBuff_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: 'conditional_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_6',
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'inflictCnt',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'modifyActionValue_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_8' },
        },
        next: null,
      },
      changeResourceByActionValue_10: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'usp_extra',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'changeResourceByActionValue_10',
      },
      changeResourceByActionValue_12: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'calculateActionValue_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResourceByActionValue_12',
      },
      finishBuffsByTag_14: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          },
        },
        next: 'startTimeDilation_13',
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'finishBuffsByTag_14',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'conductCnt', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'inflictCnt' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'usp_extra' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp_extra' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'inflictCnt' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_combo_skill: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_combo_skillActionGraph,
  key: 'chr_0030_zhuangfy_combo_skill',
  blackboard: {
    atk_scale: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    conductCnt: 0,
    inflictCnt: 0,
    poise: 10,
    usp: 10,
    usp_extra: 10,
  },
  timelineBlockFrames: 25,
  naturalDurationFrames: 210,
  exclusiveFrame: 60,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 25,
        endFrame: 60,
        skillIds: [
          'chr_0030_zhuangfy_normal_skill',
          'chr_0030_zhuangfy_power_attack',
          'chr_0030_zhuangfy_attack1',
          'chr_0030_zhuangfy_attack2',
          'chr_0030_zhuangfy_attack3',
          'chr_0030_zhuangfy_attack4',
          'chr_0030_zhuangfy_attack5',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_15' } },
  ],
  smartTarget: 'enemy',
  cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const zhuangFangyiChr_0030_zhuangfy_combo_skill_ultActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_pulse_pulse_conduct_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { count: 'conductCnt' },
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_3' },
        },
        next: 'applyBuff_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: 'conditional_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_6',
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'inflictCnt',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'modifyActionValue_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_8' },
        },
        next: null,
      },
      createTimedMarker_10: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'enemy',
            markerId: 'zhuangfy_combo_ult_tar',
            durationSeconds: { kind: 'constant', value: 0.5 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'createTimedMarker_10',
      },
      finishBuffsByTag_12: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          },
        },
        next: 'startTimeDilation_11',
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'finishBuffsByTag_12',
      },
      launchProjectile_14: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 0.5,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0030_zhuangfy_combo_skill_ring_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 1.43, poise: 0, swordNum: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'forEachContextTarget_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0030_zhuangfy_combo_skill_ring_hit',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
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
                      forEachContextTarget_3: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { target: 'enemy' },
                          body: { $sequence: 'conditional_2' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: 'zhuangfy_combo_ult_tar',
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'not',
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
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
          body: { $sequence: 'launchProjectile_14' },
        },
        next: null,
      },
      holdBuffsById_16: {
        action: {
          kind: 'holdBuffsById',
          parameters: { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'conductCnt', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'inflictCnt' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_combo_skill_ult: SkillDefinition = {
  key: 'chr_0030_zhuangfy_combo_skill_ult',
  blackboard: {
    atk_scale: [2.4, 2.64, 2.88, 3.12, 3.36, 3.6, 3.84, 4.08, 4.32, 4.62, 4.98, 5.4],
    conductCnt: 0,
    inflictCnt: 0,
    poise: 10,
  },
  timelineBlockFrames: 25,
  naturalDurationFrames: 197,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 25,
        endFrame: 54,
        skillIds: [
          'chr_0030_zhuangfy_normal_skill_ult',
          'chr_0030_zhuangfy_attack1_ult',
          'chr_0030_zhuangfy_attack2_ult',
          'chr_0030_zhuangfy_attack3_ult',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_13' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'withActionBlackboardScope_15' } },
    { startFrame: 0, endFrame: 28, sequence: { $sequence: 'holdBuffsById_16' } },
  ],
  smartTarget: 'enemy',
  cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: zhuangFangyiChr_0030_zhuangfy_combo_skill_ultActionGraph,
};

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_potential5_vfx',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ult_postmodel_mirror' },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_2' },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_ult_mirror',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            finishByAction: true,
            overrideDurationSeconds: { kind: 'constant', value: 0.83 },
            saveToContextKey: 'ult_postmodel_mirror',
          },
        },
        next: 'conditional_3',
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_ult',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            finishByAction: true,
            overrideDurationSeconds: { kind: 'constant', value: 2.7 },
            saveToContextKey: 'ult_postmodel',
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_ult_base',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', combo_cd_rate: 'combo_cd_rate' },
          },
        },
        next: null,
      },
      startTimeDilation_7: {
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
      startUltimateTimeDilation_8: {
        action: {
          kind: 'startUltimateTimeDilation',
          parameters: {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [
              { kind: 'context', contextKey: 'ult_postmodel_mirror' },
              { kind: 'context', contextKey: 'ult_postmodel' },
            ],
          },
        },
        next: null,
      },
      hideUi_9: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_10: {
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
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0030_zhuangfy_potential5_vfx'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skill: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_ultimate_skillActionGraph,
  key: 'chr_0030_zhuangfy_ultimate_skill',
  blackboard: { combo_cd_rate: 4, duration: 25, duration_extra: 1 },
  timelineBlockFrames: 91,
  naturalDurationFrames: 208,
  exclusiveFrame: 90,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'spawnAbilityEntity_4' } },
    { startFrame: 0, endFrame: 78, sequence: { $sequence: 'spawnAbilityEntity_5' } },
    { startFrame: 78, endFrame: 81, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_7' } },
    { startFrame: 0, endFrame: 78, sequence: { $sequence: 'startUltimateTimeDilation_8' } },
    { startFrame: 0, endFrame: 78, sequence: { $sequence: 'hideUi_9' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'applyBuff_10' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 240 }],
  enhancementStateBuffId: 'buff_chr_0030_zhuangfy_ult_base',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skill_endActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_ult_hide_model'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skill_end: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_ultimate_skill_endActionGraph,
  key: 'chr_0030_zhuangfy_ultimate_skill_end',
  blackboard: { atk_scale: 0.7 },
  timelineBlockFrames: 21,
  naturalDurationFrames: 189,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_1' } },
  ],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'normalSkill',
};

export const zhuangFangyiChr_0030_zhuangfy_attack1_ultActionGraph = {
  main: {
    nodes: {
      holdBuffsById_1: {
        action: {
          kind: 'holdBuffsById',
          parameters: { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'target_in_range',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: 'modifyActionValue_2',
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      spawnAbilityEntity_6: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack2_ult'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack1_ult: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack1_ultActionGraph,
  key: 'chr_0030_zhuangfy_attack1_ult',
  blackboard: {
    atb: 0,
    atk_scale: [0.67, 0.73, 0.8, 0.86, 0.93, 1, 1.06, 1.13, 1.2, 1.28, 1.38, 1.5],
    sword_dist: 0,
    target_in_range: 0,
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 160,
  exclusiveFrame: 135,
  offsetRecordFrame: 14,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 60,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack2_ult',
      },
    ],
    allowedNextSkills: [
      { startFrame: 22, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack2_ult'] },
      { startFrame: 60, endFrame: 135, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 22, sequence: { $sequence: 'holdBuffsById_1' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'spawnAbilityEntity_3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'spawnAbilityEntity_4' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'spawnAbilityEntity_5' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'spawnAbilityEntity_6' } },
    { startFrame: 22, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
    { startFrame: 60, endFrame: 135, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack2_ult',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_attack2_ultActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'target_in_range',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      spawnAbilityEntity_2: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: 'modifyActionValue_1',
      },
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          },
        },
        next: null,
      },
      holdBuffsById_6: {
        action: {
          kind: 'holdBuffsById',
          parameters: { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack3_ult'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack2_ult: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack2_ultActionGraph,
  key: 'chr_0030_zhuangfy_attack2_ult',
  blackboard: {
    atk_scale: [0.94, 1.03, 1.12, 1.22, 1.31, 1.4, 1.5, 1.59, 1.68, 1.8, 1.94, 2.1],
    sword_dist: 0,
    target_in_range: 0,
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 155,
  exclusiveFrame: 120,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 60,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack3_ult',
      },
    ],
    allowedNextSkills: [
      { startFrame: 27, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack3_ult'] },
      { startFrame: 60, endFrame: 120, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'spawnAbilityEntity_2' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'spawnAbilityEntity_3' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'spawnAbilityEntity_4' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'spawnAbilityEntity_5' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'holdBuffsById_6' } },
    { startFrame: 27, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
    { startFrame: 60, endFrame: 120, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack3_ult',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_attack3_ultActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack3_ult',
            childSkillId: 'chr_0030_zhuangfy_attack3_ult_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'thunder',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_attack3_ult_cancel',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0030_zhuangfy_attack1_ult'],
          },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'thunder' },
          body: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      holdBuffsById_4: {
        action: {
          kind: 'holdBuffsById',
          parameters: { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_attack3_ult: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_attack3_ultActionGraph,
  key: 'chr_0030_zhuangfy_attack3_ult',
  blackboard: {
    atb: 20,
    atk_scale: [1.34, 1.47, 1.6, 1.74, 1.87, 2, 2.14, 2.27, 2.4, 2.57, 2.77, 3],
    poise: 18,
    thunderIndex: 0,
  },
  timelineBlockFrames: 60,
  naturalDurationFrames: 179,
  exclusiveFrame: 140,
  offsetRecordFrame: 33,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 140,
        input: 'basicAttack',
        targetSkillId: 'chr_0030_zhuangfy_attack1_ult',
      },
    ],
    allowedNextSkills: [
      { startFrame: 60, endFrame: 140, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 3, endFrame: 179, sequence: { $sequence: 'forEachContextTarget_3' } },
    { startFrame: 0, endFrame: 35, sequence: { $sequence: 'holdBuffsById_4' } },
    { startFrame: 60, endFrame: 140, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0030_zhuangfy_attack1_ult',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
};

export const zhuangFangyiChr_0030_zhuangfy_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const zhuangFangyiChr_0030_zhuangfy_perfect_dodge: SkillDefinition = {
  actionGraph: zhuangFangyiChr_0030_zhuangfy_perfect_dodgeActionGraph,
  key: 'chr_0030_zhuangfy_perfect_dodge',
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

const zhuangFangyiPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_passive_check_sword',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: { swordRange: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'swordRange' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0030_zhuangfy_check_sword_passive',
  blackboard: { swordRange: 50 },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: zhuangFangyiPassive1ActionGraph,
};

const zhuangFangyiPassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_talent1_base',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              base_rate: 'base_rate',
              enhance_rate: 'enhance_rate',
            },
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0030_zhuangfy_talent1'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiPassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0030_zhuangfy_talent1',
  blackboard: { base_rate: [0.09, 0.18], duration: [5, 5], enhance_rate: [0.01, 0.02] },
  enableSequence: { $sequence: null },
  actionGraph: zhuangFangyiPassive2ActionGraph,
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
};

const zhuangFangyiPassive3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiPassive3: OperatorPassiveSkillDefinition = {
  key: 'chr_0030_zhuangfy_talent2',
  blackboard: {
    base_rate: [0.09, 0.09],
    duration: [99, 99],
    heal: [0.09, 0.18],
    sword_rate: [0.01, 0.01],
  },
  enableSequence: { $sequence: null },
  actionGraph: zhuangFangyiPassive3ActionGraph,
};

const zhuangFangyiComboCondition1ActionGraph = {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttackLastCombo'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0030_zhuangfy_combo_skill',
  event: 'beforeOutputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_4' },
  actionGraph: zhuangFangyiComboCondition1ActionGraph,
};

const zhuangFangyiComboCondition2ActionGraph = {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['powerAttack'] },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0030_zhuangfy_combo_skill',
  event: 'beforeOutputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_5' },
  actionGraph: zhuangFangyiComboCondition2ActionGraph,
};

const zhuangFangyiBuff1ActionGraph = {
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

const zhuangFangyiBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { cancel_mark: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'finishCurrentAbilityEntity_1' } },
  actionGraph: zhuangFangyiBuff1ActionGraph,
};

const zhuangFangyiBuff2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_pulse_pulse_conduct_triggered',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { count: 'conductCnt' },
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
        next: 'applyBuff_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_1' },
        },
        next: 'conditional_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'conductCnt',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_5',
      },
      readBuffStackCount_7: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'inflictCnt',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'modifyActionValue_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_7' },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      finishBuffsByTag_10: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'buffOwner',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'other',
          },
        },
        next: 'startTimeDilation_9',
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'finishBuffsByTag_10',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'conductCnt', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'inflictCnt' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, conductCnt: 0, inflictCnt: 0, poise: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'dealDamage_11' } },
  ],
  actionGraph: zhuangFangyiBuff2ActionGraph,
};

const zhuangFangyiBuff3ActionGraph = {
  main: {
    nodes: {
      findOwnerSpawnedAbilityEntities_1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'sword',
            abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_normal_skill_sword'],
            maxTargets: 128,
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_sword_triggerd',
            target: 'currentAbilityEntity',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              swordIndex: 'swordIndex',
              swordCnt: 'EntityBB_SwordNum',
              atk_scale: 'atk_scale',
              poise: 'poise',
              usp_extra: 'usp_extra',
              remain_sword_limit: 'remain_sword_limit',
              final_rate: 'final_rate',
            },
          },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'swordIndex',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      forEachContextTarget_5: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'swordInst' },
          body: { $sequence: 'applyBuff_3' },
        },
        next: 'modifyActionValue_4',
      },
      pickContextTarget_6: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'sword',
            saveToContextKey: 'swordInst',
            index: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'forEachContextTarget_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'pickContextTarget_6' },
        },
        next: null,
      },
      finishBuffsByTag_8: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/chr_0030_zhuangfy/SwordTar'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up_final' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'swordIndex' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_5' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff3: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  triggerIntervalSeconds: { blackboardKey: 'interval' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 50,
  applyTags: ['Status/DisableNormalSkill'],
  extendTags: [],
  blackboard: {
    atb_return: 0,
    atk_scale: 0,
    atk_up_final: 0,
    final_rate: 0,
    interval: 0.3,
    isUlt: 0,
    poise: 0,
    remain_sword_limit: 0,
    sword_range: 20,
    swordCnt: 0,
    swordIndex: 0,
    usp_extra: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'calculateActionValue_2' },
    trigger: { $sequence: 'conditional_7' },
    finish: { $sequence: 'finishBuffsByTag_8' },
  },
  actionGraph: zhuangFangyiBuff3ActionGraph,
};

const zhuangFangyiBuff4ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_fake_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  applyTags: ['Skill/Character/chr_0030_zhuangfy/SwordTar'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'spawnAbilityEntity_1' } },
  actionGraph: zhuangFangyiBuff4ActionGraph,
};

const zhuangFangyiBuff5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_SwordNum',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_2: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_2' } },
        },
        next: 'modifyActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'setCharacterPassiveUiValue_2' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'swordsInRange',
            abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_normal_skill_sword'],
          },
        },
        next: 'conditional_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'swordsNum' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'swordsNum' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'swordsInRange',
          operator: 'greaterOrEqual',
          value: 0,
          outputKey: 'swordsNum',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.03,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { swordRange: 50, swordsNum: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'findOwnerSpawnedAbilityEntities_4' } },
  actionGraph: zhuangFangyiBuff5ActionGraph,
};

const zhuangFangyiBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_potential1_more_sword',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'enterFight', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: zhuangFangyiBuff6ActionGraph,
};

const zhuangFangyiBuff7ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'finishBuffsById_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 9,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'skillEnd', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: zhuangFangyiBuff7ActionGraph,
};

const zhuangFangyiBuff8ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_pulse_resist: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: {
        kind: 'buffIdCountCompare',
        target: 'caster',
        buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
        operator: 'greaterOrEqual',
        value: 1,
      },
      processors: [
        {
          kind: 'instantAttribute',
          targetSide: 'defender',
          attribute: 'PulseResistance',
          values: { slot: 'baseAddition', value: { blackboardKey: 'ignore_pulse_resist' } },
          attributeTiming: 'runtime',
        },
      ],
    },
  ],
  actionGraph: zhuangFangyiBuff8ActionGraph,
};

const zhuangFangyiBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff9: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: zhuangFangyiBuff9ActionGraph,
};

const zhuangFangyiBuff10ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'swordCnt', operation: 'add', value: { kind: 'constant', value: -1 } },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'skillEnd',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'createTimedMarker_2' },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'finishBuffsById_4' },
        },
        next: null,
      },
      changeResourceByActionValue_7: {
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
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_7' },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['normalSkill'],
          },
        },
        next: 'conditional_10',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_12' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'dealDamage_9' },
          whenFalse: { $sequence: 'dealDamage_11' },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_talent1_mark',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_12',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
          whenTrue: { $sequence: 'applyBuff_13' },
        },
        next: null,
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_16' },
        },
        next: null,
      },
      changeResourceByActionValue_18: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_19' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'conditional_17',
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_18' },
        },
        next: null,
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_23' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_24' },
          },
        },
        next: 'conditional_19',
      },
      calculateActionValue_21: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_final',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_25' },
            right: { kind: 'valueNode', nodeId: 'data_26' },
          },
        },
        next: 'dealDamage_20',
      },
      applyBuff_22: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_talent1_mark',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'calculateActionValue_21',
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_29' } },
          whenTrue: { $sequence: 'applyBuff_22' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'swordCnt', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'swordCnt', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_5' },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp_extra' } },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_9' },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'swordCnt', fallback: 0 } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_16' },
        },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'currentSkillTypeIn', target: 'caster', skillTypes: ['battleSkill'] },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'usp_extra' } },
      data_20: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_21: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_20' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_21' },
        },
      },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_final' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'final_rate' } },
      data_27: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
      },
      data_28: { type: 'number', expression: { kind: 'blackboard', key: 'swordCnt', fallback: 0 } },
      data_29: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_27' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_28' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 1,
    atk_scale_final: 0,
    final_rate: 0,
    poise: 0,
    randomVFX: 0,
    remain_sword_limit: 0,
    swordCnt: 0,
    swordIndex: 0,
    usp_extra: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_1' } },
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'conditional_opt2' } },
  ],
  actionGraph: zhuangFangyiBuff10ActionGraph,
};

const zhuangFangyiBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: zhuangFangyiBuff11ActionGraph,
};

const zhuangFangyiBuff12ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_pulse',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0030_zhuangfy_talent1_mark'],
                operation: 'add',
                value: { kind: 'valueNode', nodeId: 'data_3' },
              },
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'base_rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { base_rate: 0, duration: 0, enhance_rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: zhuangFangyiBuff12ActionGraph,
};

const zhuangFangyiBuff13ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff13: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: zhuangFangyiBuff13ActionGraph,
};

const zhuangFangyiBuff14ActionGraph = {
  main: {
    nodes: {
      restrictUltimateEnergyRecovery_1: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: false,
          },
        },
        next: null,
      },
      overrideMultiDashLimit_2: {
        action: {
          kind: 'overrideMultiDashLimit',
          parameters: { dashCount: { kind: 'constant', value: -1 } },
        },
        next: 'restrictUltimateEnergyRecovery_1',
      },
      changePlayerActionMode_3: {
        action: {
          kind: 'changePlayerActionMode',
          parameters: { modeId: 'UltMode', lifetime: 'finishByAction' },
        },
        next: 'overrideMultiDashLimit_2',
      },
      adjustSkillCooldown_4: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'ultimate' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 15 },
          },
        },
        next: null,
      },
      castSkillDuringAction_5: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0030_zhuangfy_ultimate_skill_end',
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'adjustSkillCooldown_4',
      },
      changeNativeSkillType_6: {
        action: {
          kind: 'changeNativeSkillType',
          parameters: {
            targetSkillKey: 'chr_0030_zhuangfy_ultimate_skill_end',
            nativeSkillType: 'attachSkill',
          },
        },
        next: 'castSkillDuringAction_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0030_zhuangfy_ult_skill_free',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: true,
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
  applyTags: ['Status/DisableBreakingAttack', '3C/PostmodelChanged'],
  extendTags: ['Status/DisableNormalSkill', 'Status/DisableCastComboSkill'],
  blackboard: { combo_cd_rate: 3, duration: 10 },
  attributeModifiers: [
    {
      attribute: 'ComboSkillCooldownRecoveryScalar',
      slot: 'baseMultiplier',
      value: { blackboardKey: 'combo_cd_rate' },
    },
  ],
  lifecycleSequences: {
    start: { $sequence: 'applyBuff_7' },
    enable: { $sequence: 'changePlayerActionMode_3' },
    finish: { $sequence: 'changeNativeSkillType_6' },
  },
  actionGraph: zhuangFangyiBuff14ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0030_zhuangfy_normal_skill_ult',
      revertedSkillKey: 'chr_0030_zhuangfy_normal_skill',
      inheritOriginSkillCooldownProgress: false,
    },
    {
      skillGroupKey: 'comboSkill',
      targetSkillKey: 'chr_0030_zhuangfy_combo_skill_ult',
      revertedSkillKey: 'chr_0030_zhuangfy_combo_skill',
      inheritOriginSkillCooldownProgress: true,
    },
  ],
};

const zhuangFangyiBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const zhuangFangyiBuff15: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 0,
  presentation: {
    visible: true,
    iconId: 'icon_battle_zhuangfy_debuff_01',
    iconPath: '/icons/icon_battle_zhuangfy_debuff_01.webp',
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
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [{ attribute: 'AtbCostAddition', slot: 'baseAddition', value: -100 }],
  actionGraph: zhuangFangyiBuff15ActionGraph,
};

export const zhuangFangyi: OperatorDefinition = {
  slug: 'zhuang-fangyi',
  gameId: 'ZHUANGFANGYI',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'electric',
  role: 'striker',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [10, 29, 49, 69, 89, 99],
    agility: [10, 29, 49, 69, 89, 99],
    intellect: [17, 39, 63, 87, 111, 123],
    will: [24, 58, 94, 130, 166, 184],
    baseAttack: [30, 93, 160, 227, 293, 326],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'zhuangFangyiThunder', maximum: 9, activeAt: 9 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        zhuangFangyiChr_0030_zhuangfy_attack1,
        zhuangFangyiChr_0030_zhuangfy_attack2,
        zhuangFangyiChr_0030_zhuangfy_attack3,
        zhuangFangyiChr_0030_zhuangfy_attack4,
        zhuangFangyiChr_0030_zhuangfy_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: zhuangFangyiChr_0030_zhuangfy_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: zhuangFangyiChr_0030_zhuangfy_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: zhuangFangyiChr_0030_zhuangfy_normal_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_normal_skill_ult],
      replacementSkillPlacements: { chr_0030_zhuangfy_normal_skill_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0030_zhuangfy_normal_skill_ult: 'enhanced' },
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: zhuangFangyiChr_0030_zhuangfy_combo_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_combo_skill_ult],
      replacementSkillPlacements: { chr_0030_zhuangfy_combo_skill_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0030_zhuangfy_combo_skill_ult: 'enhanced' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: zhuangFangyiChr_0030_zhuangfy_ultimate_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_ultimate_skill_end],
      replacementSkillPlacements: { chr_0030_zhuangfy_ultimate_skill_end: 'internal' },
    },
    {
      key: 'enhancedBasicAttack',
      skillType: 'basicAttack',
      levelSource: 'ultimate',
      libraryNameQualifier: 'enhanced',
      skills: [
        zhuangFangyiChr_0030_zhuangfy_attack1_ult,
        zhuangFangyiChr_0030_zhuangfy_attack2_ult,
        zhuangFangyiChr_0030_zhuangfy_attack3_ult,
      ],
    },
  ],
  dodgeSkill: zhuangFangyiChr_0030_zhuangfy_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'chr_0030_zhuangfy_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0030_zhuangfy_normal_skill',
      replacementSkillKeys: ['chr_0030_zhuangfy_normal_skill_ult'],
    },
    {
      key: 'comboSkill',
      baseSkillKey: 'chr_0030_zhuangfy_combo_skill',
      replacementSkillKeys: ['chr_0030_zhuangfy_combo_skill_ult'],
    },
    { key: 'ultimate', baseSkillKey: 'chr_0030_zhuangfy_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0030_zhuangfy_attack1',
        'chr_0030_zhuangfy_attack2',
        'chr_0030_zhuangfy_attack3',
        'chr_0030_zhuangfy_attack4',
        'chr_0030_zhuangfy_attack5',
        'chr_0030_zhuangfy_plunging_attack_end',
        'chr_0030_zhuangfy_power_attack',
        'chr_0030_zhuangfy_attack1_ult',
        'chr_0030_zhuangfy_attack2_ult',
        'chr_0030_zhuangfy_attack3_ult',
      ],
      normalAttackSkillKeys: [
        'chr_0030_zhuangfy_attack1',
        'chr_0030_zhuangfy_attack2',
        'chr_0030_zhuangfy_attack3',
        'chr_0030_zhuangfy_attack4',
        'chr_0030_zhuangfy_attack5',
      ],
      defaultSkillKey: 'chr_0030_zhuangfy_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'UltMode',
      modeLayer: 'UltMode',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0030_zhuangfy_attack1_ult',
        'chr_0030_zhuangfy_attack2_ult',
        'chr_0030_zhuangfy_attack3_ult',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0030_zhuangfy_attack1_ult' } },
    },
  ],
  comboSkillConditions: [zhuangFangyiComboCondition1, zhuangFangyiComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    { levels: 2, passiveSkills: [zhuangFangyiPassive2] },
    { levels: 2, passiveSkills: [zhuangFangyiPassive3] },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atk_up_per_conduct',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atk_up_per_conduct',
          operation: 'multiply',
          value: 1.15,
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0030_zhuangfy_potential1' }],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'battleSkill', value: 0.15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'sword_duration',
          operation: 'add',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'sword_duration',
          operation: 'add',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0030_zhuangfy_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0030_zhuangfy_potential5',
          blackboardAssignments: { ignore_pulse_resist: -15 },
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_SwordNum: 0 },
  passiveSkills: [zhuangFangyiPassive1],
  buffDefinitions: {
    buff_chr_0030_zhuangfy_attack3_ult_cancel: zhuangFangyiBuff1,
    buff_chr_0030_zhuangfy_combo_skill_ring_hit: zhuangFangyiBuff2,
    buff_chr_0030_zhuangfy_normal_skill_trigger_sword: zhuangFangyiBuff3,
    buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar: zhuangFangyiBuff4,
    buff_chr_0030_zhuangfy_passive_check_sword: zhuangFangyiBuff5,
    buff_chr_0030_zhuangfy_potential1: zhuangFangyiBuff6,
    buff_chr_0030_zhuangfy_potential1_more_sword: zhuangFangyiBuff7,
    buff_chr_0030_zhuangfy_potential5: zhuangFangyiBuff8,
    buff_chr_0030_zhuangfy_potential5_vfx: zhuangFangyiBuff9,
    buff_chr_0030_zhuangfy_sword_triggerd: zhuangFangyiBuff10,
    buff_chr_0030_zhuangfy_talent1: zhuangFangyiBuff11,
    buff_chr_0030_zhuangfy_talent1_base: zhuangFangyiBuff12,
    buff_chr_0030_zhuangfy_talent1_mark: zhuangFangyiBuff13,
    buff_chr_0030_zhuangfy_ult_base: zhuangFangyiBuff14,
    buff_chr_0030_zhuangfy_ult_skill_free: zhuangFangyiBuff15,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0030_zhuangfy_attack2: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 1 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack2_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 9,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 0.2, thunderPosIndex: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
          { startFrame: 9, endFrame: 12, sequence: { $sequence: 'createSpatialPointTargets_2' } },
          { startFrame: 9, endFrame: 16, sequence: { $sequence: 'repeatEachTick_9' } },
          {
            startFrame: 897,
            endFrame: 900,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_10' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_1: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['normalAttack'],
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              createSpatialPointTargets_2: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: 'thunderPos',
                    count: { kind: 'constant', value: 5 },
                  },
                },
                next: null,
              },
              modifyActionValue_5: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'thunderPosIndex',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    tags: ['normalAttack'],
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: 'modifyActionValue_5',
              },
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['normalAttack'],
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: 'modifyActionValue_5',
              },
              conditional_7: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'dealDamage_4' },
                  whenFalse: { $sequence: 'dealDamage_6' },
                },
                next: null,
              },
              pickContextTarget_8: {
                action: {
                  kind: 'pickContextTarget',
                  parameters: {
                    sourceContextKey: 'thunderPos',
                    saveToContextKey: 'thunderPosInst',
                    index: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                },
                next: 'conditional_7',
              },
              repeatEachTick_9: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.1 },
                  },
                  body: { $sequence: 'pickContextTarget_8' },
                },
                next: null,
              },
              finishActionOwnerAbilityEntity_10: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_4: {
                type: 'boolean',
                expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
              },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'thunderPosIndex' },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_attack5: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 1 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack5_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 9,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 20, atk_scale: 0.2, effectZ: 2, hasGainAtb: 0, poise: 15 },
        scheduledSequences: [
          {
            startFrame: 897,
            endFrame: 900,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
          {
            startFrame: 897,
            endFrame: 900,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
          { startFrame: 0, endFrame: 12, sequence: { $sequence: 'repeatEachTick_6' } },
          { startFrame: 0, endFrame: 2, sequence: { $sequence: 'conditional_10' } },
          { startFrame: 4, endFrame: 6, sequence: { $sequence: 'conditional_10' } },
          { startFrame: 8, endFrame: 10, sequence: { $sequence: 'conditional_10' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              finishActionOwnerAbilityEntity_1: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
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
                    curve: { kind: 'named', key: 'char_hard_stop' },
                    finishByAction: false,
                    targets: ['enemy'],
                    abilityEntityTargets: [{ kind: 'current' }],
                  },
                },
                next: null,
              },
              conditional_4: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  whenTrue: { $sequence: 'startTimeDilation_3' },
                },
                next: null,
              },
              dealDamage_5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_attack5:chr_0030_zhuangfy_attack5_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: 'conditional_4',
              },
              repeatEachTick_6: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.033,
                      maxCountPerTarget: 1,
                      targetTriggerIntervalSeconds: 0.27,
                    },
                  },
                  body: { $sequence: 'dealDamage_5' },
                },
                next: null,
              },
              changeResourceByActionValue_7: {
                action: {
                  kind: 'changeResourceByActionValue',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_4' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  },
                },
                next: null,
              },
              modifyActionValue_8: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hasGainAtb',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              conditional_9: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                  whenTrue: { $sequence: 'changeResourceByActionValue_7' },
                },
                next: 'modifyActionValue_8',
              },
              conditional_10: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                  whenTrue: { $sequence: 'conditional_9' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'hasGainAtb', fallback: 0 },
              },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_6' },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_attack_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: { EntityBB_hitedMark: '#' },
      lifetime: { kind: 'limited', durationSeconds: 1.5 },
      childSkills: {
        chr_0030_zhuangfy_attack1_ult_1_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                createTimedMarker_1: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      target: 'enemy',
                      markerId: { blackboardKey: 'EntityBB_hitedMark' },
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      autoFinishByAction: false,
                    },
                  },
                  next: null,
                },
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'electric',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalAttack'],
                    },
                    key: 'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_1_abilityrange/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: 'createTimedMarker_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                    whenTrue: { $sequence: 'dealDamage_2' },
                  },
                  next: null,
                },
                forEachContextTarget_4: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { target: 'enemy' },
                    body: { $sequence: 'conditional_3' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_5: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    target: 'enemy',
                    markerId: { blackboardKey: 'EntityBB_hitedMark' },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'not',
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            { startFrame: 3, endFrame: 4, sequence: { $sequence: 'forEachContextTarget_4' } },
            {
              startFrame: 897,
              endFrame: 900,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
            },
          ],
        },
        chr_0030_zhuangfy_attack1_ult_2_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                createTimedMarker_1: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      target: 'enemy',
                      markerId: { blackboardKey: 'EntityBB_hitedMark' },
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      autoFinishByAction: false,
                    },
                  },
                  next: null,
                },
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'electric',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalAttack'],
                    },
                    key: 'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_2_abilityrange/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: 'createTimedMarker_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                    whenTrue: { $sequence: 'dealDamage_2' },
                  },
                  next: null,
                },
                forEachContextTarget_4: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { target: 'enemy' },
                    body: { $sequence: 'conditional_3' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_5: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    target: 'enemy',
                    markerId: { blackboardKey: 'EntityBB_hitedMark' },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'not',
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            { startFrame: 3, endFrame: 4, sequence: { $sequence: 'forEachContextTarget_4' } },
            {
              startFrame: 897,
              endFrame: 900,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
            },
          ],
        },
        chr_0030_zhuangfy_attack1_ult_3_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                createTimedMarker_1: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      target: 'enemy',
                      markerId: { blackboardKey: 'EntityBB_hitedMark' },
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      autoFinishByAction: false,
                    },
                  },
                  next: null,
                },
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'electric',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalAttack'],
                    },
                    key: 'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_3_abilityrange/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: 'createTimedMarker_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                    whenTrue: { $sequence: 'dealDamage_2' },
                  },
                  next: null,
                },
                forEachContextTarget_4: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { target: 'enemy' },
                    body: { $sequence: 'conditional_3' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_5: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    target: 'enemy',
                    markerId: { blackboardKey: 'EntityBB_hitedMark' },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'not',
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            { startFrame: 3, endFrame: 4, sequence: { $sequence: 'forEachContextTarget_4' } },
            {
              startFrame: 897,
              endFrame: 900,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
            },
          ],
        },
        chr_0030_zhuangfy_attack1_ult_4_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                createTimedMarker_1: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      target: 'enemy',
                      markerId: { blackboardKey: 'EntityBB_hitedMark' },
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      autoFinishByAction: false,
                    },
                  },
                  next: null,
                },
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'electric',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalAttack'],
                    },
                    key: 'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_4_abilityrange/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: 'createTimedMarker_1',
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                    whenTrue: { $sequence: 'dealDamage_2' },
                  },
                  next: null,
                },
                forEachContextTarget_4: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { target: 'enemy' },
                    body: { $sequence: 'conditional_3' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_5: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    target: 'enemy',
                    markerId: { blackboardKey: 'EntityBB_hitedMark' },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'not',
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            { startFrame: 3, endFrame: 4, sequence: { $sequence: 'forEachContextTarget_4' } },
            {
              startFrame: 897,
              endFrame: 900,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
            },
          ],
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_attack3_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack3_ult_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 75,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0.2, poise: 0, randomRotate: 0, thunderPosIndex: 0 },
        scheduledSequences: [
          { startFrame: 30, endFrame: 33, sequence: { $sequence: 'repeatEachTick_opt1' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_1: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_attack3_ult:chr_0030_zhuangfy_attack3_ult_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              changeResourceByActionValue_2: {
                action: {
                  kind: 'changeResourceByActionValue',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  },
                },
                next: null,
              },
              conditional_3: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                  whenTrue: { $sequence: 'changeResourceByActionValue_2' },
                },
                next: null,
              },
              repeatEachTick_opt1: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.033,
                      maxCountPerTarget: 1,
                      targetTriggerIntervalSeconds: 0.033,
                    },
                  },
                  body: { $sequence: 'dealDamage_1' },
                },
                next: 'conditional_3',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_fake_target: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0030_zhuangfy/ThunderAura',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 10,
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_sword: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0030_zhuangfy/ActivedSword',
      ],
      blackboard: { EntityBB_swordDuration: 0, EntityBB_swordLimit: 0 },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_swordDuration', fallback: 0 },
      },
      maxStackingCount: { blackboardKey: 'EntityBB_swordLimit', fallback: 5 },
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0030_zhuangfy_normal_skill_sword',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 0.2, potential_n: 0, randomRotate: 0, randomVFX: 0 },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: { EntityBB_SwordNum: 0 },
      lifetime: { kind: 'limited', durationSeconds: 3 },
      childSkill: {
        skillId: 'chr_0030_zhuangfy_normal_skill_ult_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 104,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 0,
          atk_scale_final: 0,
          atk_up_final: 0,
          final_rate: 0,
          poise: 0,
          randomVFX: 0,
          sword_index: 0,
          sword_range: 0,
          tick_index: 1,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 12, sequence: { $sequence: 'calculateActionValue_1' } },
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_3' } },
          { startFrame: 12, endFrame: 64, sequence: { $sequence: 'repeatEachTick_10' } },
          { startFrame: 69, endFrame: 70, sequence: { $sequence: 'calculateActionValue_14' } },
          { startFrame: 12, endFrame: 64, sequence: { $sequence: 'repeatEachTick_16' } },
          { startFrame: 12, endFrame: 64, sequence: { $sequence: 'repeatEachTick_19' } },
          { startFrame: 15, endFrame: 64, sequence: { $sequence: 'repeatEachTick_22' } },
          { startFrame: 67, endFrame: 71, sequence: { $sequence: 'repeatEachTick_25' } },
          { startFrame: 67, endFrame: 70, sequence: { $sequence: 'createTimedMarker_26' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              calculateActionValue_1: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_final',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: null,
              },
              finishActionOwnerAbilityEntity_2: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
              conditional_3: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'finishActionOwnerAbilityEntity_2' },
                },
                next: null,
              },
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: null,
              },
              dealDamage_5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_6' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: null,
              },
              modifyActionValue_6: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'tick_index',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              conditional_7: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_8' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'dealDamage_4' },
                  whenFalse: { $sequence: 'dealDamage_5' },
                },
                next: 'modifyActionValue_6',
              },
              jumpTimeline_8: {
                action: { kind: 'jumpTimeline', parameters: { destinationFrame: 64 } },
                next: null,
              },
              conditional_9: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'conditional_7' },
                  whenFalse: { $sequence: 'jumpTimeline_8' },
                },
                next: null,
              },
              repeatEachTick_10: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
                  },
                  body: { $sequence: 'conditional_9' },
                },
                next: null,
              },
              startTimeDilation_11: {
                action: {
                  kind: 'startTimeDilation',
                  parameters: {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.4 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_hard_stop' },
                    finishByAction: false,
                    targets: ['enemy'],
                    abilityEntityTargets: [{ kind: 'current' }],
                  },
                },
                next: null,
              },
              dealDamage_12: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_12' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_13' },
                  },
                  key: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_12/action',
                },
                next: 'startTimeDilation_11',
              },
              applyElementalInfliction_13: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'electric', isExtra: false },
                },
                next: 'dealDamage_12',
              },
              calculateActionValue_14: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_final',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_14' },
                    right: { kind: 'valueNode', nodeId: 'data_15' },
                  },
                },
                next: 'applyElementalInfliction_13',
              },
              repeatEachTick_16: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
                  },
                  body: { $sequence: null },
                },
                next: null,
              },
              modifyActionValue_17: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'sword_index',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              conditional_18: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_18' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'modifyActionValue_17' },
                },
                next: null,
              },
              repeatEachTick_19: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
                  },
                  body: { $sequence: 'conditional_18' },
                },
                next: null,
              },
              createSpatialPointTargets_20: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: 'ranThunder',
                    count: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              modifyActionValue_21: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: '__endaxis_target_group_count:ranThunder',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: 'createSpatialPointTargets_20',
              },
              repeatEachTick_22: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
                  },
                  body: { $sequence: 'modifyActionValue_21' },
                },
                next: null,
              },
              createSpatialPointTargets_23: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: 'ranThunder',
                    count: { kind: 'constant', value: 3 },
                  },
                },
                next: null,
              },
              modifyActionValue_24: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: '__endaxis_target_group_count:ranThunder',
                    operation: 'assign',
                    value: { kind: 'constant', value: 3 },
                  },
                },
                next: 'createSpatialPointTargets_23',
              },
              repeatEachTick_25: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
                  },
                  body: { $sequence: 'modifyActionValue_24' },
                },
                next: null,
              },
              createTimedMarker_26: {
                action: {
                  kind: 'createTimedMarker',
                  parameters: {
                    target: 'caster',
                    markerId: 'skillEnd',
                    durationSeconds: { kind: 'constant', value: 0.1 },
                    autoFinishByAction: false,
                  },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up_final' } },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_3' },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_final' },
              },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_final' },
              },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'tick_index', fallback: 0 },
              },
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
                type: 'number',
                expression: { kind: 'blackboard', key: 'tick_index', fallback: 0 },
              },
              data_10: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
              },
              data_11: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_9' },
                  operator: 'less',
                  right: { kind: 'valueNode', nodeId: 'data_10' },
                },
              },
              data_12: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_final' },
              },
              data_13: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_14: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_final' },
              },
              data_15: { type: 'number', expression: { kind: 'blackboard', key: 'final_rate' } },
              data_16: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'sword_index', fallback: 0 },
              },
              data_17: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
              },
              data_18: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_16' },
                  operator: 'less',
                  right: { kind: 'valueNode', nodeId: 'data_17' },
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_ult_mirror: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
    },
    abilityentity_chr_0030_zhuangfy_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default zhuangFangyi;
