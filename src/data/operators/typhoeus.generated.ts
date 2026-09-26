/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const typhoeusChr_0034_typhoea_attack1ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      launchProjectile_2: {
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
                skillId: 'chr_0034_typhoea_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0, hit_index: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            inheritActionBlackboard: true,
                            inheritSourceSkillCastInfo: false,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
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
      withActionBlackboardScope_3: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_index',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'withActionBlackboardScope_3',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_index',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'withActionBlackboardScope_3',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_attack1: SkillDefinition = {
  key: 'chr_0034_typhoea_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46],
    distance_to_target: 0,
    hit_index: 0,
    rootmotion_scale: 1,
  },
  timelineBlockFrames: 9,
  naturalDurationFrames: 150,
  exclusiveFrame: 15,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 3,
        endFrame: 43,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 9, endFrame: 43, skillIds: ['chr_0034_typhoea_attack2'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'calculateActionValue_1' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'modifyActionValue_4' } },
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'modifyActionValue_7' } },
    { startFrame: 9, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_attack1ActionGraph,
};

export const typhoeusChr_0034_typhoea_attack2ActionGraph = {
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
                skillId: 'chr_0034_typhoea_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0, hit_index: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            inheritActionBlackboard: true,
                            inheritSourceSkillCastInfo: false,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_increase_attackrange',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            isExtra: true,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_attack2: SkillDefinition = {
  key: 'chr_0034_typhoea_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
    distance_to_target: 0,
    rootmotion_scale: 1,
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 182,
  exclusiveFrame: 13,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 3,
        endFrame: 29,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 29, skillIds: ['chr_0034_typhoea_attack3'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 12, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_attack2ActionGraph,
};

export const typhoeusChr_0034_typhoea_attack3ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.16666667163372,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_attack3_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 5,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_once: 0,
                  duration: 0,
                  hit_index: 0,
                  hit_times: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_attack_3_1_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'applyBuff_1',
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'dealDamage_2' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_attack_3_1_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_5: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: 'withActionBlackboardScope_5',
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
          body: { $sequence: 'launchProjectile_2' },
        },
        next: 'withActionBlackboardScope_6',
      },
      launchProjectile_8: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.16666667163372,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_attack3_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 5,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_once: 0,
                  duration: 0,
                  hit_index: 0,
                  hit_times: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_attack_3_2_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'applyBuff_1',
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'dealDamage_2' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_attack_3_2_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_11: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_8' },
        },
        next: null,
      },
      withActionBlackboardScope_12: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_8' },
        },
        next: 'withActionBlackboardScope_11',
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
          body: { $sequence: 'launchProjectile_8' },
        },
        next: 'withActionBlackboardScope_12',
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_increase_attackrange',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            isExtra: true,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_15: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_attack3: SkillDefinition = {
  key: 'chr_0034_typhoea_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.38, 0.42, 0.46, 0.49, 0.53, 0.57, 0.61, 0.65, 0.68, 0.73, 0.79, 0.86],
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 185,
  exclusiveFrame: 28,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 8,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 44, skillIds: ['chr_0034_typhoea_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'calculateActionValue_1' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_7' } },
    { startFrame: 14, endFrame: 17, sequence: { $sequence: 'withActionBlackboardScope_13' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 20, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_15' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_attack3ActionGraph,
};

export const typhoeusChr_0034_typhoea_attack4ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: 0.13 },
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0.35 },
          },
        },
        next: 'calculateActionValue_1',
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
                skillId: 'chr_0034_typhoea_attack4_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_1: 0,
                  atk_scale_2: 0,
                  duration: 0,
                  hit_index: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            inheritActionBlackboard: true,
                            inheritSourceSkillCastInfo: false,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
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
      launchProjectile_5: {
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
                skillId: 'chr_0034_typhoea_attack4_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_1: 0,
                  atk_scale_2: 0,
                  duration: 0,
                  hit_index: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            inheritActionBlackboard: true,
                            inheritSourceSkillCastInfo: false,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
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
      withActionBlackboardScope_6: {
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
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_attack_4_addtionalbattleshape_onenemy',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_increase_attackrange',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            isExtra: true,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_17: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_attack5'] },
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

export const typhoeusChr_0034_typhoea_attack4: SkillDefinition = {
  key: 'chr_0034_typhoea_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.42, 0.46, 0.5, 0.55, 0.59, 0.63, 0.67, 0.71, 0.76, 0.81, 0.87, 0.95],
    atk_scale_1: 0,
    atk_scale_2: 0,
    proj_degree: 0,
    proj_degree_high: 0,
    proj_degree_low: 0,
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 170,
  exclusiveFrame: 34,
  offsetRecordFrame: 21,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 51,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 27, endFrame: 51, skillIds: ['chr_0034_typhoea_attack5'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'calculateActionValue_2' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 15, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 14, endFrame: 28, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_16' } },
    { startFrame: 27, endFrame: 51, sequence: { $sequence: 'reachSkillOperableBoundary_17' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_attack4ActionGraph,
};

export const typhoeusChr_0034_typhoea_attack5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_heavyattack_atb_recover',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 5,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_attack5_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 12, atk_scale: 0.5, duration: 0, poise: 15 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_6' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      modifyActionValue_1: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_heavyattack_atb_recover',
                            operation: 'assign',
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
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_attack_5_damagetaken',
                            target: 'enemy',
                            count: { kind: 'constant', value: 0.3 },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      dealDamage_4: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_3' },
                            staggerOnlyWhenCasterControlled: true,
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
                          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
                        },
                        next: 'dealDamage_4',
                      },
                      conditional_6: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
                          whenTrue: { $sequence: 'conditional_5' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_5: {
                        type: 'number',
                        expression: {
                          kind: 'blackboard',
                          key: 'EntityBB_heavyattack_atb_recover',
                          fallback: 0,
                        },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 0 },
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'all',
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_4' },
                            { kind: 'conditionNode', nodeId: 'data_6' },
                          ],
                        },
                      },
                      data_8: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_attack_5_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_3: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_attack5: SkillDefinition = {
  key: 'chr_0034_typhoea_attack5',
  blackboard: {
    atb: 21,
    atk_scale: [0.56, 0.61, 0.67, 0.72, 0.78, 0.83, 0.89, 0.94, 1, 1.07, 1.15, 1.25],
    poise: 17,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 150,
  exclusiveFrame: 44,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 19,
        endFrame: 62,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 46, endFrame: 62, skillIds: ['chr_0034_typhoea_attack1'] }],
  },
  costFrame: 23,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_1' } },
    { startFrame: 22, endFrame: 28, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 46, endFrame: 62, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_attack5ActionGraph,
};

export const typhoeusChr_0034_typhoea_floating_attack1ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      jumpTimeline_2: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 75 } },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'have_move_input',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'jumpTimeline_2',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      castSkillDuringAction_9: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack2',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_7: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'castSkillDuringAction_7' },
          whenFalse: { $sequence: 'castSkillDuringAction_7' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
          whenFalse: { $sequence: 'castSkillDuringAction_9' },
        },
        next: null,
      },
      finishTimeline_11: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      mergeContextTargets_opt4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_opt3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      conditional_opt5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'mergeContextTargets_opt3' },
          whenFalse: { $sequence: 'mergeContextTargets_opt4' },
        },
        next: null,
      },
      conditional_opt6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt5' },
        },
        next: null,
      },
      conditional_opt7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt6' },
        },
        next: null,
      },
      launchProjectile_171: {
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
                skillId: 'chr_0034_typhoea_floating_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_21' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_12: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_14: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_14',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_12' },
                          whenFalse: { $sequence: 'dealDamage_13' },
                        },
                        next: 'applyBuff_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_16',
                      },
                      calculateActionValue_18: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_13' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_17',
                      },
                      calculateActionValue_19: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_14' },
                            right: { kind: 'valueNode', nodeId: 'data_15' },
                          },
                        },
                        next: 'calculateActionValue_18',
                      },
                      readBuffStackCount_20: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_19',
                      },
                      conditional_21: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
                          whenTrue: { $sequence: 'readBuffStackCount_20' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_16: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_173: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_171' },
        },
        next: null,
      },
      conditional_174: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_173' },
          whenFalse: { $sequence: 'withActionBlackboardScope_173' },
        },
        next: null,
      },
      forEachContextTarget_176: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_174' },
        },
        next: null,
      },
      forEachContextTarget_168: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_174' },
        },
        next: null,
      },
      conditional_175: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_168' },
          whenFalse: { $sequence: 'forEachContextTarget_176' },
        },
        next: null,
      },
      conditional_180: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_175' },
          whenFalse: { $sequence: 'forEachContextTarget_176' },
        },
        next: null,
      },
      modifyActionValue_178: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_180',
      },
      finishBuffsById_179: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_178',
      },
      conditional_184: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_179' },
          whenFalse: { $sequence: 'conditional_180' },
        },
        next: null,
      },
      finishBuffsById_183: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_178',
      },
      conditional_185: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_183' },
          whenFalse: { $sequence: 'conditional_184' },
        },
        next: null,
      },
      calculateActionValue_186: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_23' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_185',
      },
      modifyActionValue_455: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      applyBuff_460: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      readBuffStackCount_466: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: null,
      },
      readBuffStackCount_465: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            },
          },
        },
        next: null,
      },
      conditional_467: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_465' },
          whenFalse: { $sequence: 'readBuffStackCount_466' },
        },
        next: null,
      },
      reachSkillOperableBoundary_opt8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack2'] },
        },
        next: null,
      },
      conditional_opt9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_33' }, alwaysNext: true },
          whenTrue: { $sequence: 'reachSkillOperableBoundary_opt8' },
        },
        next: null,
      },
      readBuffStackCount_opt11: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: 'conditional_opt9',
      },
      readBuffStackCount_opt10: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            },
          },
        },
        next: 'conditional_opt9',
      },
      conditional_opt12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_34' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_opt10' },
          whenFalse: { $sequence: 'readBuffStackCount_opt11' },
        },
        next: null,
      },
      finishBuffsById_545: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_546: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_547: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_35' } },
          whenTrue: { $sequence: 'applyBuff_546' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_10' },
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'conditionNode', nodeId: 'data_14' },
          ],
        },
      },
      data_16: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_20: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_23: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_25' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_27: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_28: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_27' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_29: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_30: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_29' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_31: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_32: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_31' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_33: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_26' },
            { kind: 'conditionNode', nodeId: 'data_28' },
            { kind: 'conditionNode', nodeId: 'data_30' },
            { kind: 'conditionNode', nodeId: 'data_32' },
          ],
        },
      },
      data_34: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_35: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_floating_attack1: SkillDefinition = {
  key: 'chr_0034_typhoea_floating_attack1',
  blackboard: {
    arrow_num: 0,
    atb: 0,
    atk_scale_base: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    atk_scale_enhence: 1.6,
    camera_rotate_angle: 60,
    damage_enhence: 0,
    enchence_burst_damage_rate: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
    enemy_forward_num: 0,
    enemy_turn_distance: 0,
    enhence_arrow: 0,
    have_move_input: 0,
    hit_index: 0,
    move_input_angle: 0,
    potential_damage_rate: 1,
    usp_recover: 12,
    poise: 0,
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 160,
  exclusiveFrame: 999,
  offsetRecordFrame: 7,
  inputWindows: {
    hasConditionalActions: true,
    allowedNextSkills: [
      { startFrame: 18, endFrame: 25, skillIds: ['chr_0034_typhoea_floating_attack2'] },
      { startFrame: 63, endFrame: 70, skillIds: ['chr_0034_typhoea_floating_attack2'] },
      { startFrame: 93, endFrame: 100, skillIds: ['chr_0034_typhoea_floating_attack2'] },
      { startFrame: 123, endFrame: 130, skillIds: ['chr_0034_typhoea_floating_attack2'] },
      { startFrame: 153, endFrame: 160, skillIds: ['chr_0034_typhoea_floating_attack2'] },
    ],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 160, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 22, endFrame: 25, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 67, endFrame: 70, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 97, endFrame: 100, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 100, endFrame: 103, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 127, endFrame: 130, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 130, endFrame: 133, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 157, endFrame: 160, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 45, endFrame: 46, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 75, endFrame: 76, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 105, endFrame: 106, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 135, endFrame: 136, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'calculateActionValue_186' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'calculateActionValue_186' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'calculateActionValue_186' } },
    { startFrame: 106, endFrame: 106, sequence: { $sequence: 'calculateActionValue_186' } },
    { startFrame: 136, endFrame: 136, sequence: { $sequence: 'calculateActionValue_186' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 45, endFrame: 51, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 75, endFrame: 81, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 105, endFrame: 111, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 135, endFrame: 141, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 45, endFrame: 70, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 75, endFrame: 100, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 105, endFrame: 130, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 135, endFrame: 160, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 4, endFrame: 25, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 49, endFrame: 70, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 79, endFrame: 100, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 109, endFrame: 130, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 139, endFrame: 160, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 18, endFrame: 25, sequence: { $sequence: 'conditional_opt12' } },
    { startFrame: 63, endFrame: 70, sequence: { $sequence: 'conditional_opt12' } },
    { startFrame: 93, endFrame: 100, sequence: { $sequence: 'conditional_opt12' } },
    { startFrame: 123, endFrame: 130, sequence: { $sequence: 'conditional_opt12' } },
    { startFrame: 153, endFrame: 160, sequence: { $sequence: 'conditional_opt12' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_545' } },
    { startFrame: 14, endFrame: 17, sequence: { $sequence: 'conditional_547' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'finishBuffsById_545' } },
    { startFrame: 59, endFrame: 62, sequence: { $sequence: 'conditional_547' } },
    { startFrame: 75, endFrame: 78, sequence: { $sequence: 'finishBuffsById_545' } },
    { startFrame: 89, endFrame: 92, sequence: { $sequence: 'conditional_547' } },
    { startFrame: 105, endFrame: 108, sequence: { $sequence: 'finishBuffsById_545' } },
    { startFrame: 119, endFrame: 122, sequence: { $sequence: 'conditional_547' } },
    { startFrame: 135, endFrame: 138, sequence: { $sequence: 'finishBuffsById_545' } },
    { startFrame: 149, endFrame: 152, sequence: { $sequence: 'conditional_547' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_floating_attack2',
  skillType: 'basicAttack',
  levelSource: 'battleSkill',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_floating_attack1ActionGraph,
};

export const typhoeusChr_0034_typhoea_floating_attack2ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      jumpTimeline_2: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 75 } },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'have_move_input',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'jumpTimeline_2',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      castSkillDuringAction_9: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack3',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_7: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'castSkillDuringAction_7' },
          whenFalse: { $sequence: 'castSkillDuringAction_7' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
          whenFalse: { $sequence: 'castSkillDuringAction_9' },
        },
        next: null,
      },
      finishTimeline_11: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      mergeContextTargets_opt4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_opt3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      conditional_opt5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'mergeContextTargets_opt3' },
          whenFalse: { $sequence: 'mergeContextTargets_opt4' },
        },
        next: null,
      },
      conditional_opt6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt5' },
        },
        next: null,
      },
      conditional_opt7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt6' },
        },
        next: null,
      },
      launchProjectile_103: {
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
                skillId: 'chr_0034_typhoea_floating_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_21' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_12: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_14: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_14',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_12' },
                          whenFalse: { $sequence: 'dealDamage_13' },
                        },
                        next: 'applyBuff_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_16',
                      },
                      calculateActionValue_18: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_13' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_17',
                      },
                      calculateActionValue_19: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_14' },
                            right: { kind: 'valueNode', nodeId: 'data_15' },
                          },
                        },
                        next: 'calculateActionValue_18',
                      },
                      readBuffStackCount_20: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_19',
                      },
                      conditional_21: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
                          whenTrue: { $sequence: 'readBuffStackCount_20' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_16: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_105: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_103' },
        },
        next: null,
      },
      conditional_106: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_105' },
          whenFalse: { $sequence: 'withActionBlackboardScope_105' },
        },
        next: null,
      },
      forEachContextTarget_108: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_106' },
        },
        next: null,
      },
      forEachContextTarget_100: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_106' },
        },
        next: null,
      },
      conditional_107: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_100' },
          whenFalse: { $sequence: 'forEachContextTarget_108' },
        },
        next: null,
      },
      conditional_112: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_107' },
          whenFalse: { $sequence: 'forEachContextTarget_108' },
        },
        next: null,
      },
      modifyActionValue_110: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_112',
      },
      finishBuffsById_111: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_110',
      },
      conditional_116: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_111' },
          whenFalse: { $sequence: 'conditional_112' },
        },
        next: null,
      },
      finishBuffsById_115: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_110',
      },
      conditional_117: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_115' },
          whenFalse: { $sequence: 'conditional_116' },
        },
        next: null,
      },
      calculateActionValue_118: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_23' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_117',
      },
      modifyActionValue_455: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      applyBuff_460: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      readBuffStackCount_466: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: null,
      },
      readBuffStackCount_465: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            },
          },
        },
        next: null,
      },
      conditional_467: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_465' },
          whenFalse: { $sequence: 'readBuffStackCount_466' },
        },
        next: null,
      },
      reachSkillOperableBoundary_489: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack1'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_488: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack2'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_487: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack3'] },
        },
        next: null,
      },
      switch_492: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_25' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'reachSkillOperableBoundary_487' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'reachSkillOperableBoundary_487' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'reachSkillOperableBoundary_487' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'reachSkillOperableBoundary_488' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'reachSkillOperableBoundary_489' },
            },
          ],
        },
        next: null,
      },
      readBuffStackCount_493: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: 'switch_492',
      },
      readBuffStackCount_491: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            },
          },
        },
        next: 'switch_492',
      },
      conditional_494: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_491' },
          whenFalse: { $sequence: 'readBuffStackCount_493' },
        },
        next: null,
      },
      finishBuffsById_555: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_556: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_557: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' } },
          whenTrue: { $sequence: 'applyBuff_556' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_10' },
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'conditionNode', nodeId: 'data_14' },
          ],
        },
      },
      data_16: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_20: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_23: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_27: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_floating_attack2: SkillDefinition = {
  key: 'chr_0034_typhoea_floating_attack2',
  blackboard: {
    arrow_num: 0,
    atb: 0,
    atk_scale_base: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    atk_scale_enhence: 1.6,
    camera_rotate_angle: 60,
    enchence_burst_damage_rate: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
    enemy_forward_num: 0,
    enemy_turn_distance: 0,
    enhence_arrow: 0,
    have_move_input: 0,
    hit_index: 0,
    move_input_angle: 0,
    potential_damage_rate: 1,
    usp_recover: 12,
    poise: 0,
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 160,
  exclusiveFrame: 999,
  offsetRecordFrame: 7,
  inputWindows: {
    hasConditionalActions: true,
    allowedNextSkills: [
      { startFrame: 18, endFrame: 25, skillIds: ['chr_0034_typhoea_floating_attack3'] },
      { startFrame: 63, endFrame: 70, skillIds: ['chr_0034_typhoea_floating_attack3'] },
      { startFrame: 93, endFrame: 100, skillIds: ['chr_0034_typhoea_floating_attack3'] },
      { startFrame: 123, endFrame: 130, skillIds: ['chr_0034_typhoea_floating_attack3'] },
      { startFrame: 153, endFrame: 160, skillIds: ['chr_0034_typhoea_floating_attack3'] },
    ],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 160, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 22, endFrame: 25, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 67, endFrame: 70, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 97, endFrame: 100, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 100, endFrame: 103, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 127, endFrame: 130, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 130, endFrame: 133, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 157, endFrame: 160, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 45, endFrame: 46, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 75, endFrame: 76, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 105, endFrame: 106, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 106, endFrame: 106, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 135, endFrame: 136, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 136, endFrame: 136, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 45, endFrame: 51, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 75, endFrame: 81, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 105, endFrame: 111, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 135, endFrame: 141, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 45, endFrame: 70, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 75, endFrame: 100, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 105, endFrame: 130, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 135, endFrame: 160, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 4, endFrame: 25, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 49, endFrame: 70, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 79, endFrame: 100, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 109, endFrame: 130, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 139, endFrame: 160, sequence: { $sequence: 'conditional_467' } },
    { startFrame: 18, endFrame: 25, sequence: { $sequence: 'conditional_494' } },
    { startFrame: 63, endFrame: 70, sequence: { $sequence: 'conditional_494' } },
    { startFrame: 93, endFrame: 100, sequence: { $sequence: 'conditional_494' } },
    { startFrame: 123, endFrame: 130, sequence: { $sequence: 'conditional_494' } },
    { startFrame: 153, endFrame: 160, sequence: { $sequence: 'conditional_494' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_555' } },
    { startFrame: 14, endFrame: 17, sequence: { $sequence: 'conditional_557' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'finishBuffsById_555' } },
    { startFrame: 59, endFrame: 62, sequence: { $sequence: 'conditional_557' } },
    { startFrame: 75, endFrame: 78, sequence: { $sequence: 'finishBuffsById_555' } },
    { startFrame: 89, endFrame: 92, sequence: { $sequence: 'conditional_557' } },
    { startFrame: 105, endFrame: 108, sequence: { $sequence: 'finishBuffsById_555' } },
    { startFrame: 119, endFrame: 122, sequence: { $sequence: 'conditional_557' } },
    { startFrame: 135, endFrame: 138, sequence: { $sequence: 'finishBuffsById_555' } },
    { startFrame: 149, endFrame: 152, sequence: { $sequence: 'conditional_557' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_floating_attack3',
  skillType: 'basicAttack',
  levelSource: 'battleSkill',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_floating_attack2ActionGraph,
};

export const typhoeusChr_0034_typhoea_floating_attack3ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      jumpTimeline_2: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 75 } },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'have_move_input',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'jumpTimeline_2',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      castSkillDuringAction_9: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack4',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_7: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'castSkillDuringAction_7' },
          whenFalse: { $sequence: 'castSkillDuringAction_7' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
          whenFalse: { $sequence: 'castSkillDuringAction_9' },
        },
        next: null,
      },
      finishTimeline_11: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      mergeContextTargets_opt4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_opt3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      conditional_opt5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'mergeContextTargets_opt3' },
          whenFalse: { $sequence: 'mergeContextTargets_opt4' },
        },
        next: null,
      },
      conditional_opt6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt5' },
        },
        next: null,
      },
      conditional_opt7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt6' },
        },
        next: null,
      },
      launchProjectile_103: {
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
                skillId: 'chr_0034_typhoea_floating_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_21' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_12: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_14: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_14',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_12' },
                          whenFalse: { $sequence: 'dealDamage_13' },
                        },
                        next: 'applyBuff_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_16',
                      },
                      calculateActionValue_18: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_13' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_17',
                      },
                      calculateActionValue_19: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_14' },
                            right: { kind: 'valueNode', nodeId: 'data_15' },
                          },
                        },
                        next: 'calculateActionValue_18',
                      },
                      readBuffStackCount_20: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_19',
                      },
                      conditional_21: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
                          whenTrue: { $sequence: 'readBuffStackCount_20' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_16: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_105: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_103' },
        },
        next: null,
      },
      conditional_106: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_105' },
          whenFalse: { $sequence: 'withActionBlackboardScope_105' },
        },
        next: null,
      },
      forEachContextTarget_108: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_106' },
        },
        next: null,
      },
      forEachContextTarget_100: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_106' },
        },
        next: null,
      },
      conditional_107: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_100' },
          whenFalse: { $sequence: 'forEachContextTarget_108' },
        },
        next: null,
      },
      conditional_112: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_107' },
          whenFalse: { $sequence: 'forEachContextTarget_108' },
        },
        next: null,
      },
      modifyActionValue_110: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_112',
      },
      finishBuffsById_111: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_110',
      },
      conditional_116: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_111' },
          whenFalse: { $sequence: 'conditional_112' },
        },
        next: null,
      },
      finishBuffsById_115: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_110',
      },
      conditional_117: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_115' },
          whenFalse: { $sequence: 'conditional_116' },
        },
        next: null,
      },
      calculateActionValue_118: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_23' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_117',
      },
      modifyActionValue_455: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: null,
      },
      applyBuff_460: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      readBuffStackCount_465: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_471: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack4'] },
        },
        next: null,
      },
      conditional_472: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' }, alwaysNext: true },
          whenTrue: { $sequence: 'reachSkillOperableBoundary_471' },
          whenFalse: { $sequence: 'reachSkillOperableBoundary_471' },
        },
        next: null,
      },
      finishBuffsById_485: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_486: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_487: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_25' } },
          whenTrue: { $sequence: 'applyBuff_486' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_10' },
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'conditionNode', nodeId: 'data_14' },
          ],
        },
      },
      data_16: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_20: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_23: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_floating_attack3: SkillDefinition = {
  key: 'chr_0034_typhoea_floating_attack3',
  blackboard: {
    arrow_num: 0,
    atb: 0,
    atk_scale_base: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    atk_scale_enhence: 1.6,
    camera_rotate_angle: 60,
    enchence_burst_damage_rate: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
    enemy_forward_num: 0,
    enemy_turn_distance: 0,
    enhence_arrow: 0,
    have_move_input: 0,
    hit_index: 0,
    move_input_angle: 0,
    potential_damage_rate: 1,
    usp_recover: 12,
    poise: 0,
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 160,
  exclusiveFrame: 999,
  offsetRecordFrame: 7,
  inputWindows: {
    hasConditionalActions: true,
    allowedNextSkills: [
      { startFrame: 18, endFrame: 26, skillIds: ['chr_0034_typhoea_floating_attack4'] },
      { startFrame: 63, endFrame: 70, skillIds: ['chr_0034_typhoea_floating_attack4'] },
      { startFrame: 93, endFrame: 100, skillIds: ['chr_0034_typhoea_floating_attack4'] },
      { startFrame: 123, endFrame: 130, skillIds: ['chr_0034_typhoea_floating_attack4'] },
      { startFrame: 153, endFrame: 160, skillIds: ['chr_0034_typhoea_floating_attack4'] },
    ],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 160, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 26, endFrame: 29, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 67, endFrame: 70, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 97, endFrame: 100, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 100, endFrame: 103, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 127, endFrame: 130, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 130, endFrame: 133, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 157, endFrame: 160, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 45, endFrame: 46, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 75, endFrame: 76, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 105, endFrame: 106, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 106, endFrame: 106, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 135, endFrame: 136, sequence: { $sequence: 'conditional_opt7' } },
    { startFrame: 136, endFrame: 136, sequence: { $sequence: 'calculateActionValue_118' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 45, endFrame: 51, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 75, endFrame: 81, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 105, endFrame: 111, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 135, endFrame: 141, sequence: { $sequence: 'modifyActionValue_455' } },
    { startFrame: 0, endFrame: 26, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 45, endFrame: 70, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 75, endFrame: 100, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 105, endFrame: 130, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 135, endFrame: 160, sequence: { $sequence: 'applyBuff_460' } },
    { startFrame: 4, endFrame: 26, sequence: { $sequence: 'readBuffStackCount_465' } },
    { startFrame: 49, endFrame: 70, sequence: { $sequence: 'readBuffStackCount_465' } },
    { startFrame: 79, endFrame: 100, sequence: { $sequence: 'readBuffStackCount_465' } },
    { startFrame: 109, endFrame: 130, sequence: { $sequence: 'readBuffStackCount_465' } },
    { startFrame: 139, endFrame: 160, sequence: { $sequence: 'readBuffStackCount_465' } },
    { startFrame: 18, endFrame: 26, sequence: { $sequence: 'conditional_472' } },
    { startFrame: 63, endFrame: 70, sequence: { $sequence: 'conditional_472' } },
    { startFrame: 93, endFrame: 100, sequence: { $sequence: 'conditional_472' } },
    { startFrame: 123, endFrame: 130, sequence: { $sequence: 'conditional_472' } },
    { startFrame: 153, endFrame: 160, sequence: { $sequence: 'conditional_472' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_485' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'conditional_487' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'finishBuffsById_485' } },
    { startFrame: 60, endFrame: 63, sequence: { $sequence: 'conditional_487' } },
    { startFrame: 75, endFrame: 78, sequence: { $sequence: 'finishBuffsById_485' } },
    { startFrame: 90, endFrame: 93, sequence: { $sequence: 'conditional_487' } },
    { startFrame: 105, endFrame: 108, sequence: { $sequence: 'finishBuffsById_485' } },
    { startFrame: 120, endFrame: 123, sequence: { $sequence: 'conditional_487' } },
    { startFrame: 135, endFrame: 138, sequence: { $sequence: 'finishBuffsById_485' } },
    { startFrame: 150, endFrame: 153, sequence: { $sequence: 'conditional_487' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_floating_attack4',
  skillType: 'basicAttack',
  levelSource: 'battleSkill',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_floating_attack3ActionGraph,
};

export const typhoeusChr_0034_typhoea_floating_attack4ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      jumpTimeline_2: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 300 } },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'have_move_input',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'jumpTimeline_2',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_aimmedenemy_all',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      mergeContextTargets_opt3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_opt2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      conditional_opt4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'mergeContextTargets_opt2' },
          whenFalse: { $sequence: 'mergeContextTargets_opt3' },
        },
        next: null,
      },
      conditional_opt5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt4' },
        },
        next: null,
      },
      conditional_opt6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt5' },
        },
        next: null,
      },
      launchProjectile_84: {
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
                skillId: 'chr_0034_typhoea_floating_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_21' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_12: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_14: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_14',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_12' },
                          whenFalse: { $sequence: 'dealDamage_13' },
                        },
                        next: 'applyBuff_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_16',
                      },
                      calculateActionValue_18: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_13' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_17',
                      },
                      calculateActionValue_19: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_14' },
                            right: { kind: 'valueNode', nodeId: 'data_15' },
                          },
                        },
                        next: 'calculateActionValue_18',
                      },
                      readBuffStackCount_20: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_19',
                      },
                      conditional_21: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
                          whenTrue: { $sequence: 'readBuffStackCount_20' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_16: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_86: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_84' },
        },
        next: null,
      },
      conditional_87: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_86' },
          whenFalse: { $sequence: 'withActionBlackboardScope_86' },
        },
        next: null,
      },
      forEachContextTarget_89: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_87' },
        },
        next: null,
      },
      forEachContextTarget_81: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_87' },
        },
        next: null,
      },
      conditional_88: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_81' },
          whenFalse: { $sequence: 'forEachContextTarget_89' },
        },
        next: null,
      },
      conditional_93: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_88' },
          whenFalse: { $sequence: 'forEachContextTarget_89' },
        },
        next: null,
      },
      modifyActionValue_91: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_93',
      },
      finishBuffsById_92: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_91',
      },
      conditional_97: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_92' },
          whenFalse: { $sequence: 'conditional_93' },
        },
        next: null,
      },
      finishBuffsById_96: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_91',
      },
      conditional_98: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_96' },
          whenFalse: { $sequence: 'conditional_97' },
        },
        next: null,
      },
      calculateActionValue_99: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_21' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_98',
      },
      modifyActionValue_436: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      castSkillDuringAction_441: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack5',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_442: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'castSkillDuringAction_441' },
        },
        next: null,
      },
      modifyActionValue_443: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_444: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_floatingmode'],
            reason: 'other',
          },
        },
        next: 'modifyActionValue_443',
      },
      conditional_445: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_444' },
        },
        next: null,
      },
      conditional_451: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_444' },
          whenFalse: { $sequence: 'castSkillDuringAction_441' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_470: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_471: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      applyBuff_480: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      calculateActionValue_485: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'contain_boss',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_25' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_486: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' } },
          whenTrue: { $sequence: 'calculateActionValue_485' },
        },
        next: null,
      },
      forEachContextTarget_487: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_486' },
        },
        next: null,
      },
      conditional_488: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' } },
          whenTrue: { $sequence: 'forEachContextTarget_487' },
        },
        next: null,
      },
      reachSkillOperableBoundary_506: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0034_typhoea_floating_attack5'] },
        },
        next: null,
      },
      conditional_507: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_28' }, alwaysNext: true },
          whenTrue: { $sequence: 'reachSkillOperableBoundary_506' },
          whenFalse: { $sequence: 'reachSkillOperableBoundary_506' },
        },
        next: null,
      },
      finishBuffsById_520: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_521: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_522: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_29' } },
          whenTrue: { $sequence: 'applyBuff_521' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'have_move_input' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_4' },
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_10' },
            { kind: 'conditionNode', nodeId: 'data_12' },
          ],
        },
      },
      data_14: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_18: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_21: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_22: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_23: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_24: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'contain_boss' } },
      data_26: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['boss'] } },
      data_27: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_28: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_29: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_floating_attack4: SkillDefinition = {
  key: 'chr_0034_typhoea_floating_attack4',
  blackboard: {
    atb: 0,
    atk_scale_base: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    atk_scale_enhence: 1.6,
    camera_rotate_angle: 60,
    contain_boss: 0,
    enchence_burst_damage_rate: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
    enemy_forward_num: 0,
    enemy_turn_distance: 0,
    enhence_arrow: 0,
    have_move_input: 0,
    hit_index: 0,
    is_enemy_rightside: 0,
    move_input_angle: 0,
    potential_damage_rate: 1,
    turn_angle_ratio: 0,
    usp_recover: 12,
    poise: 0,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 740,
  exclusiveFrame: 999,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 8,
        endFrame: 42,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack5',
      },
      {
        startFrame: 150,
        endFrame: 197,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack5',
      },
      {
        startFrame: 300,
        endFrame: 347,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack5',
      },
      {
        startFrame: 450,
        endFrame: 497,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack5',
      },
      {
        startFrame: 603,
        endFrame: 650,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack5',
      },
    ],
    hasConditionalActions: true,
    allowedNextSkills: [
      { startFrame: 28, endFrame: 42, skillIds: ['chr_0034_typhoea_floating_attack5'] },
      { startFrame: 178, endFrame: 193, skillIds: ['chr_0034_typhoea_floating_attack5'] },
      { startFrame: 328, endFrame: 342, skillIds: ['chr_0034_typhoea_floating_attack5'] },
      { startFrame: 478, endFrame: 492, skillIds: ['chr_0034_typhoea_floating_attack5'] },
      { startFrame: 628, endFrame: 642, skillIds: ['chr_0034_typhoea_floating_attack5'] },
    ],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 739, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'forEachContextTarget_7' } },
    { startFrame: 150, endFrame: 153, sequence: { $sequence: 'forEachContextTarget_7' } },
    { startFrame: 300, endFrame: 303, sequence: { $sequence: 'forEachContextTarget_7' } },
    { startFrame: 450, endFrame: 453, sequence: { $sequence: 'forEachContextTarget_7' } },
    { startFrame: 600, endFrame: 603, sequence: { $sequence: 'forEachContextTarget_7' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_opt6' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'calculateActionValue_99' } },
    { startFrame: 150, endFrame: 151, sequence: { $sequence: 'conditional_opt6' } },
    { startFrame: 151, endFrame: 151, sequence: { $sequence: 'calculateActionValue_99' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'conditional_opt6' } },
    { startFrame: 301, endFrame: 301, sequence: { $sequence: 'calculateActionValue_99' } },
    { startFrame: 450, endFrame: 451, sequence: { $sequence: 'conditional_opt6' } },
    { startFrame: 451, endFrame: 451, sequence: { $sequence: 'calculateActionValue_99' } },
    { startFrame: 600, endFrame: 601, sequence: { $sequence: 'conditional_opt6' } },
    { startFrame: 601, endFrame: 601, sequence: { $sequence: 'calculateActionValue_99' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'modifyActionValue_436' } },
    { startFrame: 150, endFrame: 156, sequence: { $sequence: 'modifyActionValue_436' } },
    { startFrame: 300, endFrame: 306, sequence: { $sequence: 'modifyActionValue_436' } },
    { startFrame: 450, endFrame: 456, sequence: { $sequence: 'modifyActionValue_436' } },
    { startFrame: 600, endFrame: 606, sequence: { $sequence: 'modifyActionValue_436' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'conditional_442' } },
    { startFrame: 45, endFrame: 81, sequence: { $sequence: 'conditional_445' } },
    { startFrame: 185, endFrame: 188, sequence: { $sequence: 'conditional_442' } },
    { startFrame: 195, endFrame: 229, sequence: { $sequence: 'conditional_451' } },
    { startFrame: 335, endFrame: 338, sequence: { $sequence: 'conditional_442' } },
    { startFrame: 345, endFrame: 379, sequence: { $sequence: 'conditional_451' } },
    { startFrame: 485, endFrame: 488, sequence: { $sequence: 'conditional_442' } },
    { startFrame: 495, endFrame: 590, sequence: { $sequence: 'conditional_451' } },
    { startFrame: 635, endFrame: 638, sequence: { $sequence: 'conditional_442' } },
    { startFrame: 645, endFrame: 679, sequence: { $sequence: 'conditional_451' } },
    { startFrame: 58, endFrame: 139, sequence: { $sequence: 'markCurrentSkillCanInterrupt_470' } },
    { startFrame: 139, endFrame: 140, sequence: { $sequence: 'finishTimeline_471' } },
    { startFrame: 210, endFrame: 289, sequence: { $sequence: 'markCurrentSkillCanInterrupt_470' } },
    { startFrame: 289, endFrame: 290, sequence: { $sequence: 'finishTimeline_471' } },
    { startFrame: 359, endFrame: 439, sequence: { $sequence: 'markCurrentSkillCanInterrupt_470' } },
    { startFrame: 439, endFrame: 440, sequence: { $sequence: 'finishTimeline_471' } },
    { startFrame: 509, endFrame: 589, sequence: { $sequence: 'markCurrentSkillCanInterrupt_470' } },
    { startFrame: 589, endFrame: 590, sequence: { $sequence: 'finishTimeline_471' } },
    { startFrame: 659, endFrame: 739, sequence: { $sequence: 'markCurrentSkillCanInterrupt_470' } },
    { startFrame: 739, endFrame: 740, sequence: { $sequence: 'finishTimeline_471' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'applyBuff_480' } },
    { startFrame: 150, endFrame: 197, sequence: { $sequence: 'applyBuff_480' } },
    { startFrame: 300, endFrame: 347, sequence: { $sequence: 'applyBuff_480' } },
    { startFrame: 450, endFrame: 497, sequence: { $sequence: 'applyBuff_480' } },
    { startFrame: 600, endFrame: 647, sequence: { $sequence: 'applyBuff_480' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_488' } },
    { startFrame: 150, endFrame: 153, sequence: { $sequence: 'conditional_488' } },
    { startFrame: 300, endFrame: 303, sequence: { $sequence: 'conditional_488' } },
    { startFrame: 450, endFrame: 453, sequence: { $sequence: 'conditional_488' } },
    { startFrame: 600, endFrame: 603, sequence: { $sequence: 'conditional_488' } },
    { startFrame: 28, endFrame: 42, sequence: { $sequence: 'conditional_507' } },
    { startFrame: 178, endFrame: 193, sequence: { $sequence: 'conditional_507' } },
    { startFrame: 328, endFrame: 342, sequence: { $sequence: 'conditional_507' } },
    { startFrame: 478, endFrame: 492, sequence: { $sequence: 'conditional_507' } },
    { startFrame: 628, endFrame: 642, sequence: { $sequence: 'conditional_507' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'conditional_522' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 151, endFrame: 154, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 158, endFrame: 161, sequence: { $sequence: 'conditional_522' } },
    { startFrame: 195, endFrame: 198, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 300, endFrame: 303, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 307, endFrame: 310, sequence: { $sequence: 'conditional_522' } },
    { startFrame: 346, endFrame: 349, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 450, endFrame: 453, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 457, endFrame: 460, sequence: { $sequence: 'conditional_522' } },
    { startFrame: 495, endFrame: 498, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 600, endFrame: 603, sequence: { $sequence: 'finishBuffsById_520' } },
    { startFrame: 607, endFrame: 610, sequence: { $sequence: 'conditional_522' } },
    { startFrame: 645, endFrame: 648, sequence: { $sequence: 'finishBuffsById_520' } },
  ],
  timelineContinuationSkillId: 'chr_0034_typhoea_floating_attack5',
  skillType: 'basicAttack',
  levelSource: 'battleSkill',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_floating_attack4ActionGraph,
};

export const typhoeusChr_0034_typhoea_floating_attack5ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      launchProjectile_57: {
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
                skillId: 'chr_0034_typhoea_floating_attack1_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_21' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_12: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_14: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_14',
                      },
                      conditional_16: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_12' },
                          whenFalse: { $sequence: 'dealDamage_13' },
                        },
                        next: 'applyBuff_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_16',
                      },
                      calculateActionValue_18: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_13' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_17',
                      },
                      calculateActionValue_19: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_14' },
                            right: { kind: 'valueNode', nodeId: 'data_15' },
                          },
                        },
                        next: 'calculateActionValue_18',
                      },
                      readBuffStackCount_20: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_19',
                      },
                      conditional_21: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
                          whenTrue: { $sequence: 'readBuffStackCount_20' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_16: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
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
      withActionBlackboardScope_59: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_57' },
        },
        next: null,
      },
      conditional_60: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_59' },
          whenFalse: { $sequence: 'withActionBlackboardScope_59' },
        },
        next: null,
      },
      forEachContextTarget_64: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_60' },
        },
        next: null,
      },
      modifyActionValue_65: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'forEachContextTarget_64',
      },
      mergeContextTargets_35: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_34: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      launchProjectile_47: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.200000002980232,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_floating_attack5_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 6,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale_base: 0.5,
                  atk_scale_enhence: 1,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  enchence_burst_damage_rate: 1.5,
                  enhence_arrow: 0,
                  hit_index: 0,
                  naturalnflict_damageadd: 0.4,
                  poise: 0,
                  potential_damage_rate: 1,
                  random_float: 0,
                  total_damage_rate: 1,
                  usp_recover: 5,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_23' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_25' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_7: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_8: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_8',
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                        },
                        next: null,
                      },
                      applyBuff_6: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_natural_natural_triggered_typhoea',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { damage_enhence: 'total_damage_rate' },
                          },
                        },
                        next: 'applyBuff_7',
                      },
                      calculateActionValue_3: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'applyBuff_2',
                      },
                      changeResourceByActionValue_4: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_5' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'calculateActionValue_3',
                      },
                      finishBuffsByTag_5: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            reason: 'early',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'changeResourceByActionValue_4',
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_5' },
                          whenFalse: { $sequence: 'applyBuff_6' },
                        },
                        next: null,
                      },
                      applyBuff_12: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_attack5_atb_recovered',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { atb: 'atb' },
                          },
                        },
                        next: null,
                      },
                      dealDamage_14: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_8' },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: null,
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Heavy'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_10' },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_15: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      applyBuff_16: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_floatingattack_damagetaken',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'spawnAbilityEntity_15',
                      },
                      conditional_17: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_13' },
                          whenFalse: { $sequence: 'dealDamage_14' },
                        },
                        next: 'applyBuff_16',
                      },
                      conditional_18: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_13' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_12' },
                        },
                        next: 'conditional_17',
                      },
                      conditional_19: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_15' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_10' },
                          whenFalse: { $sequence: 'conditional_11' },
                        },
                        next: 'conditional_18',
                      },
                      calculateActionValue_20: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'total_damage_rate',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_16' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'conditional_19',
                      },
                      calculateActionValue_21: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_total',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_17' },
                            right: { kind: 'valueNode', nodeId: 'data_18' },
                          },
                        },
                        next: 'calculateActionValue_20',
                      },
                      readBuffStackCount_22: {
                        action: {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'enemy',
                            outputKey: 'buff_stack',
                            query: {
                              kind: 'tag',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                            },
                          },
                        },
                        next: 'calculateActionValue_21',
                      },
                      conditional_23: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
                          whenTrue: { $sequence: 'readBuffStackCount_22' },
                        },
                        next: null,
                      },
                      applyBuff_24: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_skill_hitstop',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      conditional_25: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
                          whenTrue: { $sequence: 'applyBuff_24' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'total_damage_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enchence_burst_damage_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'usp_recover' },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_total' },
                      },
                      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_13: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_14: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
                      },
                      data_15: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_14' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_damage_rate' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_base' },
                      },
                      data_18: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_enhence' },
                      },
                      data_19: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_floatingattack_damagetaken'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 0 },
                        },
                      },
                      data_20: { type: 'boolean', expression: { kind: 'casterControlled' } },
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
      modifyActionValue_48: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'trigger_arrow_recover',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_51: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_48' },
        },
        next: null,
      },
      withActionBlackboardScope_52: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_47' },
        },
        next: 'conditional_51',
      },
      conditional_53: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_52' },
          whenFalse: { $sequence: 'withActionBlackboardScope_52' },
        },
        next: null,
      },
      forEachContextTarget_55: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_53' },
        },
        next: null,
      },
      forEachContextTarget_54: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar1' },
          body: { $sequence: 'conditional_53' },
        },
        next: null,
      },
      conditional_61: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_54' },
          whenFalse: { $sequence: 'forEachContextTarget_55' },
        },
        next: null,
      },
      conditional_62: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
          whenTrue: { $sequence: 'mergeContextTargets_34' },
          whenFalse: { $sequence: 'mergeContextTargets_35' },
        },
        next: 'conditional_61',
      },
      modifyActionValue_63: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'enhence_arrow',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_62',
      },
      conditional_67: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_63' },
          whenFalse: { $sequence: 'modifyActionValue_65' },
        },
        next: null,
      },
      conditional_68: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_67' },
          whenFalse: { $sequence: 'conditional_67' },
        },
        next: null,
      },
      modifyActionValue_69: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_68',
      },
      calculateActionValue_70: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_end',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'modifyActionValue_69',
      },
      calculateActionValue_71: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_end',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_17' },
            right: { kind: 'valueNode', nodeId: 'data_18' },
          },
        },
        next: 'calculateActionValue_70',
      },
      calculateActionValue_72: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_71',
      },
      modifyActionValue_73: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_heavyattack_atb_recover',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'calculateActionValue_72',
      },
      modifyActionValue_74: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 5 },
          },
        },
        next: null,
      },
      modifyActionValue_75: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_76: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_floatingmode'],
            reason: 'other',
          },
        },
        next: 'modifyActionValue_75',
      },
      applyBuff_77: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      modifyActionValue_78: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_can_use_floating_skill',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_79: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_heavyattack_atb_recover',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_80: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_81: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
          whenTrue: { $sequence: 'applyBuff_80' },
        },
        next: null,
      },
      finishBuffsById_82: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'trigger_arrow_recover', fallback: 0 },
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
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 4 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_4' },
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_7' },
          ],
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhence_arrow', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_13: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_16: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_18: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_19: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_times' },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_floating_attack5: SkillDefinition = {
  key: 'chr_0034_typhoea_floating_attack5',
  blackboard: {
    atb: 23,
    atb_end: 0,
    atk_scale_base: [0.44, 0.49, 0.53, 0.58, 0.62, 0.66, 0.71, 0.75, 0.8, 0.85, 0.92, 1],
    atk_scale_enhence: 1.6,
    camera_rotate_angle: 30,
    degree_1: 0,
    degree_2: 0,
    enchence_burst_damage_rate: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
    enhence_arrow: 0,
    have_move_input: 0,
    hit_index: 0,
    move_input_angle: 0,
    poise: 20,
    poise_end: 0,
    potential_damage_rate: 1,
    trigger_arrow_recover: 0,
    usp_recover: 12,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 250,
  exclusiveFrame: 35,
  offsetRecordFrame: 7,
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 0, endFrame: 250, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'modifyActionValue_73' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'modifyActionValue_74' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'finishBuffsById_76' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'applyBuff_77' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_78' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_79' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_81' } },
    { startFrame: 1, endFrame: 2, sequence: { $sequence: 'finishBuffsById_82' } },
  ],
  skillType: 'basicAttack',
  levelSource: 'battleSkill',
  nativeSkillType: 'attack',
  actionGraph: typhoeusChr_0034_typhoea_floating_attack5ActionGraph,
};

export const typhoeusChr_0034_typhoea_power_attackActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.16666667163372 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0034_typhoea_power_attack_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 5,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'forEachContextTarget_4' } },
                  { startFrame: 1, endFrame: 4, sequence: { $sequence: 'forEachContextTarget_8' } },
                  { startFrame: 1, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            calculation: 'breakingAttack',
                            calculationMultiplier: 1,
                            tags: ['normalAttack', 'powerAttack'],
                          },
                        },
                        next: null,
                      },
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'maintar',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: 'dealDamage_1',
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'mergeContextTargets_2' },
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
                      finishBuffsById_5: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'enemy',
                            buffIds: ['buff_chr_0034_typhoea_power_attack_maintarget'],
                            reason: 'other',
                          },
                        },
                        next: null,
                      },
                      startTimeDilation_6: {
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
                                  time: -0.004907977,
                                  value: 0.4,
                                  inTangent: -1.27497,
                                  outTangent: -1.27497,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.25,
                                  value: 0.075,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.6871345,
                                  value: 0.075,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 1,
                                  value: 0.4,
                                  inTangent: 0.5041389,
                                  outTangent: 0.5041389,
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
                        next: 'finishBuffsById_5',
                      },
                      conditional_7: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'startTimeDilation_6' },
                        },
                        next: null,
                      },
                      forEachContextTarget_8: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { target: 'enemy' },
                          body: { $sequence: 'conditional_7' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_power_attack_maintarget'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0034_typhoea_power_attack_maintarget'],
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
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'withActionBlackboardScope_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_power_attack_maintarget',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_power_attack: SkillDefinition = {
  key: 'chr_0034_typhoea_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 40,
  naturalDurationFrames: 180,
  exclusiveFrame: 72,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 40,
        endFrame: 99,
        skillIds: ['chr_0034_typhoea_normal_skill_floating_start', 'chr_0034_typhoea_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 38, endFrame: 41, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 0, endFrame: 72, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: typhoeusChr_0034_typhoea_power_attackActionGraph,
};

export const typhoeusChr_0034_typhoea_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_attack_plunging_onground'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishCurrentAbilityEntity_2: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
      forEachContextTarget_4: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'rune' },
          body: { $sequence: 'finishCurrentAbilityEntity_2' },
        },
        next: 'dealDamage_3',
      },
      findOwnerSpawnedAbilityEntities_5: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'rune',
            abilityEntityIds: [
              'abilityentity_chr_0034_typhoea_arrow_onground',
              'abilityentity_chr_0034_typhoea_combo_arrowfloating_1',
              'abilityentity_chr_0034_typhoea_rune_1_onground',
            ],
          },
        },
        next: 'forEachContextTarget_4',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_plunging_attack_end: SkillDefinition = {
  actionGraph: typhoeusChr_0034_typhoea_plunging_attack_endActionGraph,
  key: 'chr_0034_typhoea_plunging_attack_end',
  blackboard: { atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  timelineBlockFrames: 18,
  naturalDurationFrames: 120,
  exclusiveFrame: 17,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 4, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_5' } },
  ],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const typhoeusChr_0034_typhoea_normal_skill_floating_startActionGraph = {
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
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            copiedBlackboardAssignments: { potential_atkup: 'potential_atkup', atk_up: 'atk_up' },
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_normal_start_hittimes'],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'finishBuffsById_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_5',
      },
      mergeContextTargets_7: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar2', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'mergeContextTargets_7' },
        },
        next: null,
      },
      launchProjectile_13: {
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
                skillId: 'chr_0034_typhoea_normal_skill_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0.2,
                  atk_scale_total: 0,
                  buff_stack: 0,
                  duration: 0,
                  hit_index: 0,
                  spellinflict_damage_add: 0.3,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'calculateActionValue_4' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_start_hittimes',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'dealDamage_2',
                      },
                      calculateActionValue_4: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.5 },
                          },
                        },
                        next: 'applyBuff_3',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
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
      withActionBlackboardScope_16: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_13' },
        },
        next: null,
      },
      withActionBlackboardScope_17: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_13' },
        },
        next: 'withActionBlackboardScope_16',
      },
      forEachContextTarget_15: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'withActionBlackboardScope_16' },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_15' },
          whenFalse: { $sequence: 'withActionBlackboardScope_17' },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_15' },
          whenFalse: { $sequence: 'conditional_19' },
        },
        next: null,
      },
      launchProjectile_25: {
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
                skillId: 'chr_0034_typhoea_normal_skill_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0, hit_index: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'calculateActionValue_4' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_arrow',
                            childSkillId: 'chr_0034_typhoea_attack_deadarrow',
                            source: 'currentAbilityEntity',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            overrideDurationSeconds: { kind: 'constant', value: 3 },
                          },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                          },
                        },
                        next: 'spawnAbilityEntity_1',
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_normal_start_hittimes',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'dealDamage_2',
                      },
                      calculateActionValue_4: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.5 },
                          },
                        },
                        next: 'applyBuff_3',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
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
      withActionBlackboardScope_28: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_25' },
        },
        next: null,
      },
      withActionBlackboardScope_29: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_25' },
        },
        next: 'withActionBlackboardScope_28',
      },
      forEachContextTarget_27: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'withActionBlackboardScope_28' },
        },
        next: null,
      },
      conditional_31: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_27' },
          whenFalse: { $sequence: 'withActionBlackboardScope_29' },
        },
        next: null,
      },
      conditional_32: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_27' },
          whenFalse: { $sequence: 'conditional_31' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_34: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'finishBuffsById_4',
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_34' },
          whenFalse: { $sequence: 'finishBuffsById_4' },
        },
        next: null,
      },
      castSkillDuringAction_37: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack1',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_38: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'castSkillDuringAction_37' },
        },
        next: null,
      },
      castSkillDuringAction_39: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      modifyActionValue_40: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_can_use_floating_skill',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'atb_return', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar2',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar2',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_start_hittimes'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_10: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_normal_skill_floating_start: SkillDefinition = {
  key: 'chr_0034_typhoea_normal_skill_floating_start',
  blackboard: {
    addition_vertical: 0,
    atb: 10,
    atb_ratio: 0,
    atb_return: 0,
    atk_scale: [0.22, 0.25, 0.27, 0.29, 0.31, 0.33, 0.36, 0.38, 0.4, 0.43, 0.46, 0.5],
    atk_scale_heavy: 0.6,
    atk_scale_sub: 0.2,
    atk_up: 0.08,
    cam_angle: 0,
    cam_duration: 0,
    count: 0,
    input_angle: 0,
    look_at_x: 0,
    num: 0,
    poise: 0,
    potential_atkup: 0,
    random_float: 0,
    spend_atb: 10,
    stack: 0,
    vertical: 0,
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 40,
  exclusiveFrame: 99,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 21,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 26,
        endFrame: 40,
        skillIds: [
          'chr_0034_typhoea_floating_attack1',
          'chr_0034_typhoea_normal_skill_floating_end',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_6' } },
    { startFrame: 1, endFrame: 10, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 2, endFrame: 5, sequence: { $sequence: 'conditional_20' } },
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'conditional_32' } },
    { startFrame: 12, endFrame: 18, sequence: { $sequence: 'conditional_36' } },
    { startFrame: 32, endFrame: 35, sequence: { $sequence: 'conditional_38' } },
    { startFrame: 37, endFrame: 40, sequence: { $sequence: 'castSkillDuringAction_39' } },
    { startFrame: 21, endFrame: 24, sequence: { $sequence: 'modifyActionValue_40' } },
    { startFrame: 13, endFrame: 16, sequence: { $sequence: 'applyBuff_41' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: typhoeusChr_0034_typhoea_normal_skill_floating_startActionGraph,
};

export const typhoeusChr_0034_typhoea_normal_skill_floating_loopActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_2: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_end',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      switch_4: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: null } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: null } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: null } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: null } },
            {
              value: { kind: 'constant', value: 5 },
              sequence: { $sequence: 'castSkillDuringAction_2' },
            },
          ],
        },
        next: null,
      },
      readBuffStackCount_5: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: 'switch_4',
      },
      readBuffStackCount_6: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_combo_skill_canusefloatingskill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_index' },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_normal_skill_floating_loop: SkillDefinition = {
  key: 'chr_0034_typhoea_normal_skill_floating_loop',
  blackboard: { arrow_num: 0 },
  timelineBlockFrames: 31,
  naturalDurationFrames: 30,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: { hasConditionalActions: true },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 27, endFrame: 30, sequence: { $sequence: 'castSkillDuringAction_2' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'readBuffStackCount_5' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'readBuffStackCount_6' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_9' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: typhoeusChr_0034_typhoea_normal_skill_floating_loopActionGraph,
};

export const typhoeusChr_0034_typhoea_normal_skill_floating_endActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_floatingmode'],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_can_use_floating_skill',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_normal_skill_floating_end: SkillDefinition = {
  actionGraph: typhoeusChr_0034_typhoea_normal_skill_floating_endActionGraph,
  key: 'chr_0034_typhoea_normal_skill_floating_end',
  blackboard: {},
  timelineBlockFrames: 26,
  naturalDurationFrames: 100,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 8, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_2' } },
    { startFrame: 8, endFrame: 14, sequence: { $sequence: 'finishBuffsById_3' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'modifyActionValue_4' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_5' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
};

export const typhoeusChr_0034_typhoea_combo_skillActionGraph = {
  main: {
    nodes: {
      adjustSkillCooldown_1: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0034_typhoea_combo_skillfloating' },
            operation: 'set',
            basis: 'baseDurationRatio',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.833 },
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
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_combo_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_persistent: 0,
                  hit_index: 0,
                  naturalinflect_stack: 0,
                  persistent_naturalburst_increase: 0,
                  persistent_slow: 0,
                  persistent_time: 0,
                  recover_bufftime: 12,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'calculateActionValue_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['comboSkill'],
                          },
                        },
                        next: null,
                      },
                      calculateActionValue_2: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'divide',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 7 },
                          },
                        },
                        next: 'dealDamage_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
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
      withActionBlackboardScope_6: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_4' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_6' },
          whenFalse: { $sequence: 'withActionBlackboardScope_6' },
        },
        next: null,
      },
      launchProjectile_33: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.433333337306976,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_combo_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 13,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_persistent: 0,
                  hit_index: 0,
                  naturalinflect_stack: 0,
                  persistent_naturalburst_increase: 0,
                  persistent_slow: 0,
                  persistent_time: 0,
                  poise: 10,
                  recover_bufftime: 12,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_3' } },
                  { startFrame: 0, endFrame: 2, sequence: { $sequence: 'spawnAbilityEntity_5' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      calculateActionValue_2: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'divide',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'constant', value: 7 },
                          },
                        },
                        next: 'dealDamage_1',
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_combo_skill_arrow_hittimes',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'calculateActionValue_2',
                      },
                      spawnAbilityEntity_5: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_combo_presistdamage',
                            childSkillId: 'chr_0034_typhoea_combo_persistentdamage',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
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
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      withActionBlackboardScope_34: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_33' },
        },
        next: null,
      },
      modifyActionValue_35: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'is_have_target',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'withActionBlackboardScope_34',
      },
      calculateActionValue_36: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'arrow_rotate_2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 179 },
          },
        },
        next: 'modifyActionValue_35',
      },
      calculateActionValue_37: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'arrow_rotate_1',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: 70 },
          },
        },
        next: 'calculateActionValue_36',
      },
      calculateActionValue_38: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'arrow_speed_basic',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 5 },
          },
        },
        next: 'calculateActionValue_37',
      },
      changeResourceByActionValue_39: {
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
      applyBuff_40: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_func_arrowreload',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_41: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'is_have_target', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_rotate_1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_rotate_1' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_speed_basic' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_combo_skill: SkillDefinition = {
  key: 'chr_0034_typhoea_combo_skill',
  blackboard: {
    arrow_rotate_1: 0,
    arrow_rotate_2: 0,
    arrow_speed_basic: 15,
    atb: 0,
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.42, 1.51, 1.6, 1.71, 1.85, 2],
    atk_scale_persistent: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    bullet_energy: 0,
    cam_angle: 0,
    cam_duration: 0,
    count: 3,
    duration: 5,
    energy_to_bullet_ratio: 2,
    input_angle: 0,
    is_have_target: 0,
    level: 1,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    persistent_naturalburst_increase: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
    persistent_slow: 0.6,
    persistent_time: 6,
    poise: 10,
    select_radius: 4,
    talent2: 0,
    usp: 10,
    persistent_slow_show: 0.4,
  },
  timelineBlockFrames: 60,
  naturalDurationFrames: 241,
  exclusiveFrame: 60,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 48, endFrame: 99, skillIds: ['chr_0034_typhoea_normal_skill_floating_start'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'adjustSkillCooldown_1' } },
    { startFrame: 0, endFrame: 22, sequence: { $sequence: 'startTimeDilation_2' } },
    { startFrame: 40, endFrame: 43, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 43, endFrame: 46, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 44, endFrame: 47, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 47, endFrame: 50, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 49, endFrame: 52, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 35, endFrame: 54, sequence: { $sequence: 'calculateActionValue_38' } },
    { startFrame: 35, endFrame: 50, sequence: { $sequence: 'changeResourceByActionValue_39' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'applyBuff_40' } },
    { startFrame: 60, endFrame: 241, sequence: { $sequence: 'markCurrentSkillCanInterrupt_41' } },
  ],
  cooldownFrames: [630, 630, 630, 630, 630, 630, 630, 630, 630, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: typhoeusChr_0034_typhoea_combo_skillActionGraph,
};

export const typhoeusChr_0034_typhoea_combo_skillfloatingActionGraph = {
  main: {
    nodes: {
      finishTimeline_1: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      createSpatialPointTargets_6: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'tar', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      pickContextTarget_4: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'tar1',
            saveToContextKey: 'tar',
            index: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'pickContextTarget_4',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'mergeContextTargets_5' },
          whenFalse: { $sequence: 'createSpatialPointTargets_6' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'mergeContextTargets_2' },
          whenFalse: { $sequence: 'mergeContextTargets_3' },
        },
        next: 'conditional_7',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
          whenFalse: { $sequence: 'mergeContextTargets_9' },
        },
        next: null,
      },
      inheritBuffById_11: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      adjustSkillCooldown_12: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0034_typhoea_combo_skill' },
            operation: 'set',
            basis: 'baseDurationRatio',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      castSkillDuringAction_18: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_end',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_17: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      switch_19: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_4' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'castSkillDuringAction_17' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'castSkillDuringAction_17' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'castSkillDuringAction_17' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'castSkillDuringAction_17' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'castSkillDuringAction_17' },
            },
            {
              value: { kind: 'constant', value: 5 },
              sequence: { $sequence: 'castSkillDuringAction_18' },
            },
          ],
        },
        next: null,
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.833 },
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
      launchProjectile_22: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_combo_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_persistent: 0,
                  hit_index: 0,
                  naturalinflect_stack: 0,
                  persistent_naturalburst_increase: 0,
                  persistent_slow: 0,
                  persistent_time: 0,
                  recover_bufftime: 12,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'calculateActionValue_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['comboSkill'],
                          },
                        },
                        next: null,
                      },
                      calculateActionValue_2: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'divide',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 7 },
                          },
                        },
                        next: 'dealDamage_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
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
      withActionBlackboardScope_24: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_22' },
        },
        next: null,
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_24' },
          whenFalse: { $sequence: 'withActionBlackboardScope_24' },
        },
        next: null,
      },
      launchProjectile_51: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.433333337306976,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0034_typhoea_combo_01_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 13,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_scale_persistent: 0,
                  hit_index: 0,
                  naturalinflect_stack: 0,
                  persistent_naturalburst_increase: 0,
                  persistent_slow: 0,
                  persistent_time: 0,
                  poise: 10,
                  recover_bufftime: 12,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_3' } },
                  { startFrame: 0, endFrame: 2, sequence: { $sequence: 'spawnAbilityEntity_5' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      calculateActionValue_2: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'divide',
                            left: { kind: 'valueNode', nodeId: 'data_3' },
                            right: { kind: 'constant', value: 7 },
                          },
                        },
                        next: 'dealDamage_1',
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0034_typhoea_combo_skill_arrow_hittimes',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'calculateActionValue_2',
                      },
                      spawnAbilityEntity_5: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0034_typhoea_combo_presistdamage',
                            childSkillId: 'chr_0034_typhoea_combo_persistentdamage',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
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
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      modifyActionValue_52: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'is_have_target',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      withActionBlackboardScope_53: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_51' },
        },
        next: 'modifyActionValue_52',
      },
      changeResourceByActionValue_54: {
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
      applyBuff_55: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_func_arrowreload',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_56: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      readBuffStackCount_57: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: null,
      },
      castSkillDuringAction_58: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack1',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      conditional_59: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'castSkillDuringAction_58' },
        },
        next: null,
      },
      readBuffStackCount_60: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'arrow_num',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_num'] },
          },
        },
        next: 'conditional_59',
      },
      finishBuffsById_61: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_62: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_63: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'applyBuff_62' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea/Locked'],
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_index' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'is_have_target', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_combo_skillfloating: SkillDefinition = {
  key: 'chr_0034_typhoea_combo_skillfloating',
  blackboard: {
    arrow_num: 0,
    arrow_rotate_1: 0,
    arrow_rotate_2: 0,
    arrow_speed_basic: 15,
    atb: 0,
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.42, 1.51, 1.6, 1.71, 1.85, 2],
    atk_scale_persistent: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    bullet_energy: 0,
    cam_angle: 0,
    cam_duration: 0,
    count: 3,
    duration: 5,
    energy_to_bullet_ratio: 2,
    input_angle: 0,
    is_have_target: 0,
    level: 1,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    persistent_naturalburst_increase: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
    persistent_slow: 0.6,
    persistent_time: 6,
    poise: 10,
    select_radius: 4,
    talent2: 0,
    usp: 10,
    persistent_slow_show: 0.4,
  },
  timelineBlockFrames: 57,
  naturalDurationFrames: 70,
  exclusiveFrame: 999,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 40,
        endFrame: 70,
        input: 'basicAttack',
        targetSkillId: 'chr_0034_typhoea_floating_attack1',
      },
    ],
    hasConditionalActions: true,
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 180, endFrame: 181, sequence: { $sequence: 'finishTimeline_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 70, sequence: { $sequence: 'inheritBuffById_11' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'adjustSkillCooldown_12' } },
    { startFrame: 67, endFrame: 70, sequence: { $sequence: 'switch_19' } },
    { startFrame: 0, endFrame: 22, sequence: { $sequence: 'startTimeDilation_20' } },
    { startFrame: 39, endFrame: 42, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 43, endFrame: 46, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 44, endFrame: 47, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 47, endFrame: 50, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 49, endFrame: 52, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 35, endFrame: 54, sequence: { $sequence: 'withActionBlackboardScope_53' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'changeResourceByActionValue_54' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'applyBuff_55' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_56' } },
    { startFrame: 40, endFrame: 70, sequence: { $sequence: 'readBuffStackCount_57' } },
    { startFrame: 57, endFrame: 74, sequence: { $sequence: 'readBuffStackCount_60' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_61' } },
    { startFrame: 57, endFrame: 60, sequence: { $sequence: 'conditional_63' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [630, 630, 630, 630, 630, 630, 630, 630, 630, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: typhoeusChr_0034_typhoea_combo_skillfloatingActionGraph,
};

export const typhoeusChr_0034_typhoea_ultimate_skillfloatingActionGraph = {
  main: {
    nodes: {
      inheritBuffById_2: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_floatingmode',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0034_typhoea_normal_skill_floating_loop',
              'chr_0034_typhoea_normal_skill_floating_end',
              'chr_0034_typhoea_floating_attack1',
              'chr_0034_typhoea_floating_attack2',
              'chr_0034_typhoea_floating_attack3',
              'chr_0034_typhoea_floating_attack4',
              'chr_0034_typhoea_floating_attack5',
              'chr_0034_typhoea_combo_skillfloating',
              'chr_0034_typhoea_ultimate_skillfloating',
            ],
            copiedBlackboardAssignments: { potential_atkup: 'potential_atkup', atk_up: 'atk_up' },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
          whenFalse: { $sequence: 'inheritBuffById_2' },
        },
        next: null,
      },
      startTimeDilation_4: {
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
      startUltimateTimeDilation_5: {
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
      hideUi_6: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_floating_attack_index',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_arrowrecover_exitfight',
            target: 'caster',
            count: { kind: 'valueNode', nodeId: 'data_2' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_10',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
            target: 'caster',
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_9' },
          whenFalse: { $sequence: 'applyBuff_11' },
        },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_can_trigger_combo',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_can_trigger_combo',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain',
            childSkillId: 'chr_0034_typhoea_ultimate_skill_arrowrain',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      castSkillDuringAction_28: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_end',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_27: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack5',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_26: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack4',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_25: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack3',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_24: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack2',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_23: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_floating_attack1',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      switch_30: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'castSkillDuringAction_23' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'castSkillDuringAction_24' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'castSkillDuringAction_25' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'castSkillDuringAction_26' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'castSkillDuringAction_27' },
            },
            {
              value: { kind: 'constant', value: 5 },
              sequence: { $sequence: 'castSkillDuringAction_28' },
            },
          ],
        },
        next: null,
      },
      castSkillDuringAction_20: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0034_typhoea_normal_skill_floating_loop',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      switch_22: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_6' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'castSkillDuringAction_20' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'castSkillDuringAction_20' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'castSkillDuringAction_20' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'castSkillDuringAction_20' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'castSkillDuringAction_20' },
            },
            {
              value: { kind: 'constant', value: 5 },
              sequence: { $sequence: 'castSkillDuringAction_28' },
            },
          ],
        },
        next: null,
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'switch_22' },
        },
        next: null,
      },
      conditional_31: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_29' },
          whenFalse: { $sequence: 'switch_30' },
        },
        next: null,
      },
      applyBuff_32: {
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
      finishBuffsById_33: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_34: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_common_arrowshow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_35: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'applyBuff_34' },
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
          buffIds: ['buff_chr_0034_typhoea_floatingmode'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num_given' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num_given' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffBlackboardValueCompare',
          target: 'caster',
          query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover'] },
          desiredKey: 'truly_exit_fight',
          outputKey: 'truly_exit_fight',
          operator: 'less',
          value: { kind: 'constant', value: 0.5 },
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_index' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_floating_attack_index' },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_floatingmode'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusChr_0034_typhoea_ultimate_skillfloating: SkillDefinition = {
  key: 'chr_0034_typhoea_ultimate_skillfloating',
  blackboard: {
    arrow_energy_given: 0,
    arrow_num_given: 2,
    atk_scale_2: 0,
    atk_scale_center: [
      0.889, 0.978, 1.067, 1.155, 1.244, 1.333, 1.422, 1.511, 1.6, 1.711, 1.844, 2,
    ],
    atk_scale_main: [1.333, 1.467, 1.6, 1.733, 1.867, 2, 2.133, 2.267, 2.4, 2.567, 2.767, 3],
    atk_scale_outer: [0.333, 0.367, 0.4, 0.433, 0.467, 0.5, 0.534, 0.567, 0.6, 0.642, 0.692, 0.75],
    atk_up: 0.08,
    crit: 0,
    poise: 20,
    potential_atkup: 0,
    potential_damge_up: 1,
    radius: 4,
    select_radius: 10,
    truly_exit_fight: 0,
  },
  timelineBlockFrames: 83,
  naturalDurationFrames: 92,
  exclusiveFrame: 105,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 100,
        endFrame: 158,
        skillIds: ['chr_0004_pelica_normal_skill', 'chr_0004_pelica_combo_skill'],
      },
    ],
    hasConditionalActions: true,
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 92, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_4' } },
    { startFrame: 0, endFrame: 62, sequence: { $sequence: 'startUltimateTimeDilation_5' } },
    { startFrame: 0, endFrame: 62, sequence: { $sequence: 'hideUi_6' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_7' } },
    { startFrame: 61, endFrame: 62, sequence: { $sequence: 'modifyActionValue_13' } },
    { startFrame: 62, endFrame: 63, sequence: { $sequence: 'modifyActionValue_14' } },
    { startFrame: 61, endFrame: 62, sequence: { $sequence: 'spawnAbilityEntity_15' } },
    { startFrame: 89, endFrame: 92, sequence: { $sequence: 'conditional_31' } },
    { startFrame: 0, endFrame: 105, sequence: { $sequence: 'applyBuff_32' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_33' } },
    { startFrame: 87, endFrame: 90, sequence: { $sequence: 'conditional_35' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 200 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: typhoeusChr_0034_typhoea_ultimate_skillfloatingActionGraph,
};

export const typhoeusCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const typhoeusCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: typhoeusCommon_character_perfect_dodgeActionGraph,
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

const typhoeusPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0034_typhoea_passive',
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: typhoeusPassive1ActionGraph,
};

const typhoeusPassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_increase_attackrange',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusPassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0034_typhoea_passive_increase_attackrange',
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: typhoeusPassive2ActionGraph,
};

const typhoeusComboCondition1ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_1' },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_can_trigger_combo', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 8 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_energy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0034_typhoea_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: typhoeusComboCondition1ActionGraph,
};

const typhoeusComboCondition2ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_1' },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_can_trigger_combo', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 8 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'casterComboPending' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_5' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0034_typhoea_combo_skill',
  event: 'beforeOutputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_4' },
  actionGraph: typhoeusComboCondition2ActionGraph,
};

const typhoeusBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 10,
  durationSeconds: 0.2,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff1ActionGraph,
};

const typhoeusBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 10,
  durationSeconds: 0.2,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff2ActionGraph,
};

const typhoeusBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff3: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff3ActionGraph,
};

const typhoeusBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff4: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff4ActionGraph,
};

const typhoeusBuff5ActionGraph = {
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
              duration: { kind: 'constant', value: 20 },
              rate: { kind: 'valueNode', nodeId: 'data_1' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'slow_down' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { damage_up: 0.1, slow_down: 0.5 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['natureBurst'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'damage_up' },
        },
      ],
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: typhoeusBuff5ActionGraph,
};

const typhoeusBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff6: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: 2,
  applyTags: ['Skill/Character/chr_0034_typhoea/CanUseFloatingSkill'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff6ActionGraph,
};

const typhoeusBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff7: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 20,
  applyTags: ['Skill/Character/chr_0034_typhoea/CanUseFloatingSkill'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff7ActionGraph,
};

const typhoeusBuff8ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
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
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_floatingmode'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { damageup: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'conditional_2' } },
  actionGraph: typhoeusBuff8ActionGraph,
};

const typhoeusBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_energy'],
            reason: 'other',
          },
        },
        next: 'applyBuff_1',
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'bullet_energy',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'finishBuffsById_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'bullet_energy',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'calculateActionValue_3',
      },
      readBuffStackCount_5: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'bullet_energy',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_normal_skill_arrow_energy'] },
          },
        },
        next: 'calculateActionValue_4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'bullet_energy' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'bullet_energy' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'energy_to_bullet_ratio' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'bullet_energy' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { bullet_energy: 0, count: 0, energy_to_bullet_ratio: 2 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'readBuffStackCount_5' } },
  ],
  actionGraph: typhoeusBuff9ActionGraph,
};

const typhoeusBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff10: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 0.2,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff10ActionGraph,
};

const typhoeusBuff11ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_passive_increase_attackrange'],
            reason: 'other',
          },
        },
        next: null,
      },
      changePlayerActionMode_2: {
        action: {
          kind: 'changePlayerActionMode',
          parameters: { modeId: 'floating', lifetime: 'finishByAction' },
        },
        next: null,
      },
      inheritSkillCastInfoForBasicAttack_3: {
        action: { kind: 'inheritSkillCastInfoForBasicAttack', parameters: {} },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_targetfind',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_potential_atkup',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up' },
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      withActionBlackboardScope_22: {
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
          body: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      withActionBlackboardScope_23: {
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
          body: { $sequence: 'conditional_5' },
        },
        next: 'withActionBlackboardScope_22',
      },
      withActionBlackboardScope_24: {
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
          body: { $sequence: 'inheritSkillCastInfoForBasicAttack_3' },
        },
        next: 'withActionBlackboardScope_23',
      },
      withActionBlackboardScope_25: {
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
          body: { $sequence: 'changePlayerActionMode_2' },
        },
        next: 'withActionBlackboardScope_24',
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_targetfind'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passive_increase_attackrange',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_8',
      },
      finishCurrentAbilityEntity_10: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_11: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar' },
          body: { $sequence: 'finishCurrentAbilityEntity_10' },
        },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'forEachContextTarget_11' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_13: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'tar',
            abilityEntityIds: ['abilityentity_chr_0034_typhoea_ultimateskill_arrowrain'],
          },
        },
        next: 'conditional_12',
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_common_arrowshow'],
            reason: 'other',
          },
        },
        next: null,
      },
      withActionBlackboardScope_26: {
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
          body: { $sequence: 'finishBuffsById_14' },
        },
        next: null,
      },
      withActionBlackboardScope_27: {
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
          body: { $sequence: 'findOwnerSpawnedAbilityEntities_13' },
        },
        next: 'withActionBlackboardScope_26',
      },
      withActionBlackboardScope_28: {
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
          body: { $sequence: 'applyBuff_9' },
        },
        next: 'withActionBlackboardScope_27',
      },
      finishBuffsById_15: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_floatingmode'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'finishBuffsById_15' },
        },
        next: null,
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_talent_linken_sphere_enable'],
            reason: 'other',
          },
        },
        next: null,
      },
      triggerCustomAbilityEvent_18: {
        action: {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'sheild_broken',
            eventParam: 0,
            target: 'caster',
            source: 'caster',
          },
        },
        next: 'finishBuffsById_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_talent_linken_sphere_superarmour',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'triggerCustomAbilityEvent_18',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'applyBuff_19' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_atkup', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Status/Immobilized'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_talent_linken_sphere_enable'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff11: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [
    'Status/Unjumpable',
    'Status/DisableDash',
    'Status/DisableBreakingAttack',
    'Status/CantSwitchOutCenter',
    'Status/Ability/Skill/CantSwitchTocCenter',
    'Status/DisableNormalSkill',
    'Status/IgnoreEnemyCollision',
    'Skill/Character/chr_0034_typhoea/FloatingMode',
    'AI/Status/CanAIForceDontTeleport',
  ],
  extendTags: [],
  blackboard: { atk_up: 0, potential_atkup: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['remainArea'] },
      processors: [{ kind: 'damageScale', side: 'defender', zone: 'product', addition: -1 }],
    },
  ],
  lifecycleSequences: {
    start: { $sequence: 'finishBuffsById_1' },
    enable: { $sequence: 'withActionBlackboardScope_25' },
    finish: { $sequence: 'withActionBlackboardScope_28' },
  },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_16' } },
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'conditional_20' } },
  ],
  skillSlotReplacements: [
    {
      skillGroupKey: 'comboSkill',
      targetSkillKey: 'chr_0034_typhoea_combo_skillfloating',
      revertedSkillKey: 'chr_0034_typhoea_combo_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: typhoeusBuff11ActionGraph,
};

const typhoeusBuff12ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff12: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [
    'Status/Unjumpable',
    'Status/DisableDash',
    'Status/DisableBreakingAttack',
    'Status/CantSwitchOutCenter',
    'Status/Ability/Skill/CantSwitchTocCenter',
    'Status/DisableNormalSkill',
  ],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff12ActionGraph,
};

const typhoeusBuff13ActionGraph = {
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff13: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 0.2,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 0, count: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'changeResourceByActionValue_1' } },
  actionGraph: typhoeusBuff13ActionGraph,
};

const typhoeusBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff14: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Skill/Character/chr_0034_typhoea/EnemyInArea'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff14ActionGraph,
};

const typhoeusBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff15: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 8,
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: true,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'NoLifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff15ActionGraph,
};

const typhoeusBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            target: 'buffOwner',
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

const typhoeusBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 10,
  addingCooldownSeconds: 0.2,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: typhoeusBuff16ActionGraph,
};

const typhoeusBuff17ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            target: 'buffOwner',
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

const typhoeusBuff17: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 10,
  addingCooldownSeconds: 0.2,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: typhoeusBuff17ActionGraph,
};

const typhoeusBuff18ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            target: 'buffOwner',
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

const typhoeusBuff18: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 10,
  addingCooldownSeconds: 0.2,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: typhoeusBuff18ActionGraph,
};

const typhoeusBuff19ActionGraph = {
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
        expression: {
          kind: 'eventCustomAbilityNameMatch',
          eventName: 'arrowrecover_speedup',
          outputKey: 'auto_enhance_rate',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff19: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 4,
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: true,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'NoLifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'customAbilityEvent', priority: 0, sequence: { $sequence: 'conditional_1' } },
  ],
  actionGraph: typhoeusBuff19ActionGraph,
};

const typhoeusBuff20ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.135,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.25494957,
                  value: 0.135,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.75,
                  value: 0.135,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: [],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'startTimeDilation_1' } },
  actionGraph: typhoeusBuff20ActionGraph,
};

const typhoeusBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff21: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff21ActionGraph,
};

const typhoeusBuff22ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff22: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: 0.5,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff22ActionGraph,
};

const typhoeusBuff23ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_1',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_3',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
          whenFalse: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0034_typhoea'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellBurst/NaturalBurst'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff23: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 10,
  applyTags: [],
  extendTags: [],
  blackboard: { auto_enhance_rate: 1, count: 0, recover_time: 24 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_4' } },
  ],
  actionGraph: typhoeusBuff23ActionGraph,
};

const typhoeusBuff24ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff24: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: typhoeusBuff24ActionGraph,
};

const typhoeusBuff25ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'truly_exit_fight',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'constant', value: 4 },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_passitive_enemy_listennaturalspellbrust',
            target: 'enemy',
            finishByAction: true,
          },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            reason: 'other',
          },
        },
        next: 'modifyActionValue_1',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_2' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_6',
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'arrow_num',
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0034_typhoea_passive_arrowrecover_exitfight'],
            },
          },
        },
        next: 'applyBuff_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'readBuffStackCount_8',
      },
      finishBuffsById_10: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: [
              'buff_chr_0034_typhoea_normal_skill_arrow_num',
              'buff_chr_0034_typhoea_normal_skill_arrow_energy',
            ],
            reason: 'other',
          },
        },
        next: 'applyBuff_9',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'finishBuffsById_10' },
        },
        next: null,
      },
      finishBuffsById_12: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_normal_skill_show_arrowui'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'energy_enterfight' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'arrow_num' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'energy_enterfight' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'truly_exit_fight', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff25: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: {
    arrow_num: 0,
    arrow_recover_time: 25,
    energy_enterfight: 6,
    max_arrow: 5,
    truly_exit_fight: 1,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_3' }, enable: { $sequence: 'applyBuff_4' } },
  abilityEventResponses: [
    { event: 'enterFight', priority: 0, sequence: { $sequence: 'conditional_11' } },
    { event: 'ownerSwitchToGuard', priority: 0, sequence: { $sequence: 'finishBuffsById_12' } },
  ],
  actionGraph: typhoeusBuff25ActionGraph,
};

const typhoeusBuff26ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff26: SkillBuffDefinition = {
  stackingType: 'timedGrowingEnhance',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'arrow_recover_time' },
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: true,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { arrow_recover_time: 3, max_arrow: 5 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff26ActionGraph,
};

const typhoeusBuff27ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff27: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff27ActionGraph,
};

const typhoeusBuff28ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff28: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0.08 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: typhoeusBuff28ActionGraph,
};

const typhoeusBuff29ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff29: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { decrease_cd: -3 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff29ActionGraph,
};

const typhoeusBuff30ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff30: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 10,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff30ActionGraph,
};

const typhoeusBuff31ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'damage_resist',
            operation: 'add',
            left: { kind: 'constant', value: 1 },
            right: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'param1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'calculateActionValue_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_talent_linken_sphere_enable',
            target: 'buffOwner',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              protect_times: 'protect_times',
              damage_resist: 'param1',
            },
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0034_typhoea_talent_linken_sphere_enable'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'finishBuffsById_6' },
        },
        next: null,
      },
      calculateActionValue_8: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'param2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: null,
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0034_typhoea_potential_decrease_sheildcd'] },
            desiredKey: 'decrease_cd',
            outputKey: 'param3',
          },
        },
        next: 'calculateActionValue_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'param2',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: null,
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_talent_linken_sphere_cd',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { sheild_cd: 'param2' },
          },
        },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_9' },
          whenFalse: { $sequence: 'modifyActionValue_10' },
        },
        next: 'applyBuff_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'conditional_12' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'param1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'damage_resist' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'protect_times' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_talent_linken_sphere_cd'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: [
            'chr_0034_typhoea_normal_skill_floating_start',
            'chr_0034_typhoea_ultimate_skillfloating',
          ],
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0034_typhoea_floatingmode'] },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'sheild_cd' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'param3' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'sheild_cd' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_potential_decrease_sheildcd'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'eventCustomAbilityNameMatch', eventName: 'sheild_broken' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff31: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    damage_resist: 0.3,
    param1: 0,
    param2: 0,
    param3: 0,
    protect_times: 1,
    sheild_cd: 18,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'calculateActionValue_2' } },
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_5' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_7' } },
    { event: 'customAbilityEvent', priority: 0, sequence: { $sequence: 'conditional_13' } },
  ],
  actionGraph: typhoeusBuff31ActionGraph,
};

const typhoeusBuff32ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff32: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'sheild_cd' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_typhoea_sheild_broken',
    iconPath: '/icons/icon_battle_buff_typhoea_sheild_broken.webp',
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
  blackboard: { damage_resist: 0.3, param1: 0, protect_times: 1, sheild_cd: 18 },
  attributeModifiers: [],
  actionGraph: typhoeusBuff32ActionGraph,
};

const typhoeusBuff33ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff33: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 5,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_typhoea_sheild',
    iconPath: '/icons/icon_battle_buff_typhoea_sheild.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { damage_resist: -0.3, protect_times: 1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'damage_resist' },
        },
      ],
    },
  ],
  actionGraph: typhoeusBuff33ActionGraph,
};

const typhoeusBuff34ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'unassigned',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: -0.00245398539,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.8000001,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.9975461,
                  value: 0.326683253,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: [],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff34: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { protect_times: 1, sheild_cd: 18 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'startTimeDilation_1' } },
  actionGraph: typhoeusBuff34ActionGraph,
};

const typhoeusBuff35ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_12: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub',
            childSkillId: 'chr_0034_typhoea_ultimate_skill_arrowrain_sub2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub',
            childSkillId: 'chr_0034_typhoea_ultimate_skill_arrowrain_sub1',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'spawnAbilityEntity_11' },
          whenFalse: { $sequence: 'spawnAbilityEntity_12' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain_timer',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_16',
      },
      calculateActionValue_15: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'trigger_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_14',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_15' },
          whenFalse: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
          whenFalse: { $sequence: 'conditional_19' },
        },
        next: null,
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_20' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'trigger_times', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'less',
          right: { kind: 'constant', value: 5 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'trigger_times' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain_timer'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'trigger_times', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 5 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain_timer'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_7' },
          ],
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'trigger_times', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'less',
          right: { kind: 'constant', value: 5 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageGameplayTagsMatch',
          match: 'hasAny',
          tags: ['Damage/TyphoeaSkill/FloatingHit_Weak', 'Damage/TyphoeaSkill/FloatingHit_Heavy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff35: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    arrow_energy_given: 1,
    arrow_num_given: 2,
    atb: 10,
    atk_scale_center: 0.5,
    atk_scale_main: 1,
    atk_scale_outer: 0.1,
    is_floating_mode: 0,
    poise: 0,
    prama1: 0,
    trigger_times: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_21' } },
  ],
  actionGraph: typhoeusBuff35ActionGraph,
};

const typhoeusBuff36ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const typhoeusBuff36: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 0.2,
  applyTags: [],
  extendTags: [],
  blackboard: {
    arrow_energy_given: 1,
    arrow_num_given: 2,
    atb: 10,
    atk_scale_center: 0.5,
    atk_scale_main: 1,
    atk_scale_outer: 0.1,
    is_floating_mode: 0,
    poise: 0,
    prama1: 0,
    trigger_times: 0,
  },
  attributeModifiers: [],
  actionGraph: typhoeusBuff36ActionGraph,
};

export const typhoeus: OperatorDefinition = {
  slug: 'typhoeus',
  gameId: 'TYPHOEUS',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'striker',
  mainAttribute: 'agility',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 28, 48, 68, 88, 97],
    agility: [21, 54, 88, 123, 157, 174],
    intellect: [10, 29, 49, 69, 89, 99],
    will: [14, 37, 60, 84, 107, 119],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: {
    kind: 'buffCounters',
    appearance: 'typhoeaArrows',
    reserveArrowBuffId: 'buff_chr_0034_typhoea_passive_arrowrecover_exitfight',
    battleArrowBuffId: 'buff_chr_0034_typhoea_normal_skill_arrow_num',
    pointBuffId: 'buff_chr_0034_typhoea_normal_skill_arrow_energy',
    maximumArrows: 4,
    maximumPoints: 8,
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        typhoeusChr_0034_typhoea_attack1,
        typhoeusChr_0034_typhoea_attack2,
        typhoeusChr_0034_typhoea_attack3,
        typhoeusChr_0034_typhoea_attack4,
        typhoeusChr_0034_typhoea_attack5,
      ],
      variants: [
        {
          key: 'enhancedBasicAttack',
          levelSource: 'battleSkill',
          libraryNameQualifier: 'floating',
          skills: [
            typhoeusChr_0034_typhoea_floating_attack1,
            typhoeusChr_0034_typhoea_floating_attack2,
            typhoeusChr_0034_typhoea_floating_attack3,
            typhoeusChr_0034_typhoea_floating_attack4,
            typhoeusChr_0034_typhoea_floating_attack5,
          ],
        },
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: typhoeusChr_0034_typhoea_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: typhoeusChr_0034_typhoea_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: typhoeusChr_0034_typhoea_normal_skill_floating_start,
      replacementSkills: [
        typhoeusChr_0034_typhoea_normal_skill_floating_loop,
        typhoeusChr_0034_typhoea_normal_skill_floating_end,
      ],
      replacementSkillPlacements: {
        chr_0034_typhoea_normal_skill_floating_loop: 'internal',
        chr_0034_typhoea_normal_skill_floating_end: 'internal',
      },
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: typhoeusChr_0034_typhoea_combo_skill,
      replacementSkills: [typhoeusChr_0034_typhoea_combo_skillfloating],
      replacementSkillPlacements: { chr_0034_typhoea_combo_skillfloating: 'standard' },
      replacementSkillNameQualifiers: { chr_0034_typhoea_combo_skillfloating: 'floating' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: typhoeusChr_0034_typhoea_ultimate_skillfloating,
    },
  ],
  dodgeSkill: typhoeusCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0034_typhoea_normal_skill_floating_start',
      replacementSkillKeys: [],
    },
    {
      key: 'comboSkill',
      baseSkillKey: 'chr_0034_typhoea_combo_skill',
      replacementSkillKeys: ['chr_0034_typhoea_combo_skillfloating'],
    },
    {
      key: 'ultimate',
      baseSkillKey: 'chr_0034_typhoea_ultimate_skillfloating',
      replacementSkillKeys: [],
    },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0034_typhoea_attack1',
        'chr_0034_typhoea_attack2',
        'chr_0034_typhoea_attack3',
        'chr_0034_typhoea_attack4',
        'chr_0034_typhoea_attack5',
        'chr_0034_typhoea_power_attack',
        'chr_0034_typhoea_plunging_attack_end',
        'chr_0034_typhoea_floating_attack1',
        'chr_0034_typhoea_floating_attack2',
        'chr_0034_typhoea_floating_attack3',
        'chr_0034_typhoea_floating_attack4',
        'chr_0034_typhoea_floating_attack5',
      ],
      normalAttackSkillKeys: [
        'chr_0034_typhoea_attack1',
        'chr_0034_typhoea_attack2',
        'chr_0034_typhoea_attack3',
        'chr_0034_typhoea_attack4',
        'chr_0034_typhoea_attack5',
      ],
      defaultSkillKey: 'chr_0034_typhoea_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'floating',
      modeLayer: 'floating',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0034_typhoea_floating_attack1',
        'chr_0034_typhoea_floating_attack2',
        'chr_0034_typhoea_floating_attack3',
        'chr_0034_typhoea_floating_attack4',
        'chr_0034_typhoea_floating_attack5',
      ],
      commandMappings: {
        basicAttack: { skillId: 'chr_0034_typhoea_floating_attack1' },
        comboSkill: { skillId: 'chr_0034_typhoea_combo_skillfloating' },
      },
    },
  ],
  comboSkillConditions: [typhoeusComboCondition1, typhoeusComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack1',
          blackboardKey: 'atk_scale_enhence',
          operation: 'assign',
          value: [1.2, 1.4, 1.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack2',
          blackboardKey: 'atk_scale_enhence',
          operation: 'assign',
          value: [1.2, 1.4, 1.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack3',
          blackboardKey: 'atk_scale_enhence',
          operation: 'assign',
          value: [1.2, 1.4, 1.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack4',
          blackboardKey: 'atk_scale_enhence',
          operation: 'assign',
          value: [1.2, 1.4, 1.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack5',
          blackboardKey: 'atk_scale_enhence',
          operation: 'assign',
          value: [1.2, 1.4, 1.6],
        },
      ],
      attachedBuffs: [
        {
          buffId: 'buff_chr_0034_typhoea_passive_arrowrecover',
          blackboardAssignments: { arrow_recover_time: 3, energy_enterfight: [1, 2, 4] },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0034_typhoea_talent_linken_sphere',
          blackboardAssignments: { damage_resist: [0.15, 0.3], sheild_cd: [30, 18] },
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
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack1',
          blackboardKey: 'atk_scale_base',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack2',
          blackboardKey: 'atk_scale_base',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack3',
          blackboardKey: 'atk_scale_base',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack4',
          blackboardKey: 'atk_scale_base',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack5',
          blackboardKey: 'atk_scale_base',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0034_typhoea_normal_skill_floating_start',
          blackboardKey: 'potential_atkup',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0034_typhoea_normal_skill_floating_start',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.18,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_atkup',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.18,
        },
      ],
      attachedBuffs: [
        {
          buffId: 'buff_chr_0034_typhoea_potential_decrease_sheildcd',
          blackboardAssignments: { decrease_cd: -3 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0034_typhoea_combo_skill',
          frames: -60,
        },
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0034_typhoea_combo_skillfloating',
          frames: -60,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0034_typhoea_combo_skill',
          blackboardKey: 'persistent_naturalburst_increase',
          operation: 'add',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0034_typhoea_combo_skillfloating',
          blackboardKey: 'persistent_naturalburst_increase',
          operation: 'add',
          value: 0.06,
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
          blackboardKey: 'arrow_num_given',
          operation: 'add',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack1',
          blackboardKey: 'potential_damage_rate',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack2',
          blackboardKey: 'potential_damage_rate',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack3',
          blackboardKey: 'potential_damage_rate',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack4',
          blackboardKey: 'potential_damage_rate',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0034_typhoea_floating_attack5',
          blackboardKey: 'potential_damage_rate',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_damge_up',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_can_trigger_combo: 1,
    EntityBB_can_use_floating_skill: 0,
    EntityBB_consumed_type: 0,
    EntityBB_floating_attack_index: 0,
    EntityBB_floating_attack_times: 0,
    EntityBB_heavyattack_atb_recover: 0,
    EntityBB_normalskill_hittimes: 0,
  },
  passiveSkills: [typhoeusPassive1, typhoeusPassive2],
  buffDefinitions: {
    buff_chr_0034_typhoea_attack_3_1_damagetaken: typhoeusBuff1,
    buff_chr_0034_typhoea_attack_3_2_damagetaken: typhoeusBuff2,
    buff_chr_0034_typhoea_attack_4_addtionalbattleshape_onenemy: typhoeusBuff3,
    buff_chr_0034_typhoea_attack_5_damagetaken: typhoeusBuff4,
    buff_chr_0034_typhoea_combo_enemy_debuff: typhoeusBuff5,
    buff_chr_0034_typhoea_combo_skill_arrow_hittimes: typhoeusBuff6,
    buff_chr_0034_typhoea_combo_skill_canusefloatingskill: typhoeusBuff7,
    buff_chr_0034_typhoea_common_arrowshow: typhoeusBuff8,
    buff_chr_0034_typhoea_common_func_arrowreload: typhoeusBuff9,
    buff_chr_0034_typhoea_floatingattack_damagetaken: typhoeusBuff10,
    buff_chr_0034_typhoea_floatingmode: typhoeusBuff11,
    buff_chr_0034_typhoea_floatingmode_blowoff_ccs: typhoeusBuff12,
    buff_chr_0034_typhoea_normal_attack5_atb_recovered: typhoeusBuff13,
    buff_chr_0034_typhoea_normal_skill_aimmedenemy_all: typhoeusBuff14,
    buff_chr_0034_typhoea_normal_skill_arrow_energy: typhoeusBuff15,
    buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_1: typhoeusBuff16,
    buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_2: typhoeusBuff17,
    buff_chr_0034_typhoea_normal_skill_arrow_energy_buffer_3: typhoeusBuff18,
    buff_chr_0034_typhoea_normal_skill_arrow_num: typhoeusBuff19,
    buff_chr_0034_typhoea_normal_skill_hitstop: typhoeusBuff20,
    buff_chr_0034_typhoea_normal_skill_targetfind: typhoeusBuff21,
    buff_chr_0034_typhoea_normal_start_hittimes: typhoeusBuff22,
    buff_chr_0034_typhoea_passitive_enemy_listennaturalspellbrust: typhoeusBuff23,
    buff_chr_0034_typhoea_passive: typhoeusBuff24,
    buff_chr_0034_typhoea_passive_arrowrecover: typhoeusBuff25,
    buff_chr_0034_typhoea_passive_arrowrecover_exitfight: typhoeusBuff26,
    buff_chr_0034_typhoea_passive_increase_attackrange: typhoeusBuff27,
    buff_chr_0034_typhoea_potential_atkup: typhoeusBuff28,
    buff_chr_0034_typhoea_potential_decrease_sheildcd: typhoeusBuff29,
    buff_chr_0034_typhoea_power_attack_maintarget: typhoeusBuff30,
    buff_chr_0034_typhoea_talent_linken_sphere: typhoeusBuff31,
    buff_chr_0034_typhoea_talent_linken_sphere_cd: typhoeusBuff32,
    buff_chr_0034_typhoea_talent_linken_sphere_enable: typhoeusBuff33,
    buff_chr_0034_typhoea_talent_linken_sphere_superarmour: typhoeusBuff34,
    buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain: typhoeusBuff35,
    buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain_timer: typhoeusBuff36,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0034_typhoea_arrow: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0034_typhoea_attack_deadarrow',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 4,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0, duration: 0, hit_index: 0 },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0034_typhoea_combo_presistdamage: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              calculateActionValue_1: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_persistent',
                    operation: 'divide',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'constant', value: 18 },
                  },
                },
                next: null,
              },
              dealDamage_2: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    tags: ['comboSkill'],
                  },
                  key: 'abilityentity_chr_0034_typhoea_combo_presistdamage:chr_0034_typhoea_combo_persistentdamage:/childSkill/actionGraph/main/nodes/dealDamage_2/action',
                },
                next: null,
              },
              repeatEachTick_3: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.3333333,
                      maxCountPerTarget: 18,
                      targetTriggerIntervalSeconds: 0.33,
                    },
                  },
                  body: { $sequence: 'dealDamage_2' },
                },
                next: null,
              },
              applyBuff_4: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0034_typhoea_combo_enemy_debuff',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      damage_up: { kind: 'valueNode', nodeId: 'data_3' },
                      slow_down: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                  },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_persistent' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_persistent' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'persistent_naturalburst_increase' },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'persistent_slow' },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0034_typhoea_combo_persistentdamage',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 180,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atb: 0,
          atk_scale: 0,
          atk_scale_persistent: 0,
          hit_index: 0,
          naturalinflect_stack: 0,
          persistent_naturalburst_increase: 0,
          persistent_slow: 0,
          persistent_time: 0,
          recover_bufftime: 12,
          usp: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'calculateActionValue_1' } },
          { startFrame: 0, endFrame: 180, sequence: { $sequence: 'repeatEachTick_3' } },
          { startFrame: 0, endFrame: 180, sequence: { $sequence: 'applyBuff_4' } },
        ],
      },
    },
    abilityentity_chr_0034_typhoea_ultimateskill_arrowrain: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0034_typhoea/ArrowRain_Main',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              modifyActionValue_1: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'is_floating_mode',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              conditional_2: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  whenTrue: { $sequence: 'modifyActionValue_1' },
                },
                next: null,
              },
              calculateActionValue_3: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_outer',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_2' },
                    right: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                },
                next: null,
              },
              calculateActionValue_4: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_center',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    right: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                },
                next: 'calculateActionValue_3',
              },
              calculateActionValue_5: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_main',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_6' },
                    right: { kind: 'valueNode', nodeId: 'data_7' },
                  },
                },
                next: 'calculateActionValue_4',
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_9' },
                  },
                  key: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain:chr_0034_typhoea_ultimate_skill_arrowrain:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: null,
              },
              forEachContextTarget_7: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { target: 'enemy' },
                  body: { $sequence: 'dealDamage_6' },
                },
                next: null,
              },
              applyBuff_8: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0034_typhoea_ultimate_skill_cause_subarrowrain',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    finishByAction: true,
                    copiedBlackboardAssignments: {
                      atk_scale_center: 'atk_scale_center',
                      atk_scale_main: 'atk_scale_main',
                      atk_scale_outer: 'atk_scale_outer',
                    },
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
                  buffIds: ['buff_chr_0034_typhoea_floatingmode'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_outer' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_damge_up' },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_center' },
              },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_damge_up' },
              },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_main' } },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_damge_up' },
              },
              data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_main' } },
              data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
        skillId: 'chr_0034_typhoea_ultimate_skill_arrowrain',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 600,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          arrow_energy_given: 1,
          arrow_num_given: 2,
          atb: 10,
          atk_scale_center: 0.5,
          atk_scale_main: 1,
          atk_scale_outer: 0.1,
          is_floating_mode: 0,
          poise: 0,
          potential_damge_up: 1,
          prama1: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_2' } },
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'calculateActionValue_5' } },
          { startFrame: 1, endFrame: 3, sequence: { $sequence: 'forEachContextTarget_7' } },
          { startFrame: 0, endFrame: 600, sequence: { $sequence: 'applyBuff_8' } },
        ],
      },
    },
    abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
      childSkills: {
        chr_0034_typhoea_ultimate_skill_arrowrain_sub1: {
          actionGraph: {
            main: {
              nodes: {
                calculateActionValue_1: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_outer',
                      operation: 'divide',
                      left: { kind: 'valueNode', nodeId: 'data_1' },
                      right: { kind: 'constant', value: 3 },
                    },
                  },
                  next: null,
                },
                calculateActionValue_2: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_center',
                      operation: 'divide',
                      left: { kind: 'valueNode', nodeId: 'data_2' },
                      right: { kind: 'constant', value: 3 },
                    },
                  },
                  next: 'calculateActionValue_1',
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub:chr_0034_typhoea_ultimate_skill_arrowrain_sub1|chr_0034_typhoea_ultimate_skill_arrowrain_sub2:/childSkills/chr_0034_typhoea_ultimate_skill_arrowrain_sub1/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                repeatEachTick_4: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: true,
                        triggerIntervalSeconds: 0.033,
                        maxCountPerTarget: 3,
                        targetTriggerIntervalSeconds: 0.1,
                      },
                    },
                    body: { $sequence: 'dealDamage_3' },
                  },
                  next: null,
                },
                finishCurrentAbilityEntity_5: {
                  action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
                  next: null,
                },
                forEachContextTarget_6: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { contextKey: 'tar' },
                    body: { $sequence: 'finishCurrentAbilityEntity_5' },
                  },
                  next: null,
                },
                findOwnerSpawnedAbilityEntities_7: {
                  action: {
                    kind: 'findOwnerSpawnedAbilityEntities',
                    parameters: {
                      saveToContextKey: 'tar',
                      abilityEntityIds: ['abilityentity_chr_0034_typhoea_ultimateskill_arrowrain'],
                    },
                  },
                  next: 'forEachContextTarget_6',
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                    whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_7' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_outer' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_center' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_outer' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'trigger_times', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 5 },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0034_typhoea_ultimate_skill_arrowrain_sub1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 15,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            arrow_energy_given: 1,
            arrow_num_given: 2,
            atb: 10,
            atk_scale_center: 0.5,
            atk_scale_main: 1,
            atk_scale_outer: 0.1,
            is_floating_mode: 0,
            poise: 0,
            prama1: 0,
            trigger_times: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 2, sequence: { $sequence: 'calculateActionValue_2' } },
            { startFrame: 6, endFrame: 15, sequence: { $sequence: 'repeatEachTick_4' } },
            { startFrame: 14, endFrame: 15, sequence: { $sequence: 'conditional_8' } },
          ],
        },
        chr_0034_typhoea_ultimate_skill_arrowrain_sub2: {
          actionGraph: {
            main: {
              nodes: {
                calculateActionValue_1: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_outer',
                      operation: 'divide',
                      left: { kind: 'valueNode', nodeId: 'data_1' },
                      right: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                calculateActionValue_2: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_center',
                      operation: 'divide',
                      left: { kind: 'valueNode', nodeId: 'data_2' },
                      right: { kind: 'constant', value: 3 },
                    },
                  },
                  next: 'calculateActionValue_1',
                },
                calculateActionValue_3: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_2',
                      operation: 'multiply',
                      left: { kind: 'valueNode', nodeId: 'data_3' },
                      right: { kind: 'constant', value: 0.08 },
                    },
                  },
                  next: 'calculateActionValue_2',
                },
                calculateActionValue_4: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'atk_scale_1',
                      operation: 'multiply',
                      left: { kind: 'valueNode', nodeId: 'data_4' },
                      right: { kind: 'constant', value: 0.6 },
                    },
                  },
                  next: 'calculateActionValue_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                    },
                    key: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub:chr_0034_typhoea_ultimate_skill_arrowrain_sub1|chr_0034_typhoea_ultimate_skill_arrowrain_sub2:/childSkills/chr_0034_typhoea_ultimate_skill_arrowrain_sub2/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                repeatEachTick_6: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: true,
                        triggerIntervalSeconds: 0.033,
                        maxCountPerTarget: 5,
                        targetTriggerIntervalSeconds: 0.06,
                      },
                    },
                    body: { $sequence: 'dealDamage_5' },
                  },
                  next: null,
                },
                dealDamage_7: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                    },
                    key: 'abilityentity_chr_0034_typhoea_ultimateskill_arrowrain_sub:chr_0034_typhoea_ultimate_skill_arrowrain_sub1|chr_0034_typhoea_ultimate_skill_arrowrain_sub2:/childSkills/chr_0034_typhoea_ultimate_skill_arrowrain_sub2/actionGraph/main/nodes/dealDamage_7/action',
                  },
                  next: null,
                },
                repeatEachTick_8: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        executeEachFrame: true,
                        triggerIntervalSeconds: 0.033,
                        maxCountPerTarget: 1,
                        targetTriggerIntervalSeconds: 0.03333,
                      },
                    },
                    body: { $sequence: 'dealDamage_7' },
                  },
                  next: null,
                },
                finishCurrentAbilityEntity_9: {
                  action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
                  next: null,
                },
                forEachContextTarget_10: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { contextKey: 'tar' },
                    body: { $sequence: 'finishCurrentAbilityEntity_9' },
                  },
                  next: null,
                },
                findOwnerSpawnedAbilityEntities_11: {
                  action: {
                    kind: 'findOwnerSpawnedAbilityEntities',
                    parameters: {
                      saveToContextKey: 'tar',
                      abilityEntityIds: ['abilityentity_chr_0034_typhoea_ultimateskill_arrowrain'],
                    },
                  },
                  next: 'forEachContextTarget_10',
                },
                conditional_12: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
                    whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_11' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_outer' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_center' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_center' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_center' },
                },
                data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
                data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
                data_7: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'trigger_times', fallback: 0 },
                },
                data_8: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_7' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 5 },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0034_typhoea_ultimate_skill_arrowrain_sub2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 50,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            arrow_energy_given: 1,
            arrow_num_given: 2,
            atb: 10,
            atk_scale_1: 0,
            atk_scale_2: 0,
            atk_scale_center: 0.5,
            atk_scale_main: 1,
            atk_scale_outer: 0.1,
            is_floating_mode: 0,
            poise: 0,
            prama1: 0,
            trigger_times: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 2, sequence: { $sequence: 'calculateActionValue_4' } },
            { startFrame: 6, endFrame: 21, sequence: { $sequence: 'repeatEachTick_6' } },
            { startFrame: 30, endFrame: 33, sequence: { $sequence: 'repeatEachTick_8' } },
            { startFrame: 49, endFrame: 50, sequence: { $sequence: 'conditional_12' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default typhoeus;
