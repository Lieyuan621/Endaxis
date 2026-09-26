/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const ardeliaChr_0025_ardelia_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 5,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0025_ardelia_attack1_projhit',
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
          parameters: { skillIds: ['chr_0025_ardelia_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_attack1: SkillDefinition = {
  key: 'chr_0025_ardelia_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
  timelineBlockFrames: 11,
  naturalDurationFrames: 110,
  exclusiveFrame: 15,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0025_ardelia_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 11, endFrame: 30, skillIds: ['chr_0025_ardelia_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 11, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0025_ardelia_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_attack1ActionGraph,
};

export const ardeliaChr_0025_ardelia_attack2ActionGraph = {
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
                skillId: 'chr_0025_ardelia_attack1_projhit',
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
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0025_ardelia_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_attack2: SkillDefinition = {
  key: 'chr_0025_ardelia_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
    atk_scale_display: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 118,
  exclusiveFrame: 26,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 36,
        input: 'basicAttack',
        targetSkillId: 'chr_0025_ardelia_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 36, skillIds: ['chr_0025_ardelia_attack3'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 20, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0025_ardelia_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_attack2ActionGraph,
};

export const ardeliaChr_0025_ardelia_attack3ActionGraph = {
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
                skillId: 'chr_0025_ardelia_attack3_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt3' } },
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
                      conditional_opt2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: null },
                        },
                        next: 'conditional_opt1',
                      },
                      dealDamage_opt3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'probability',
                          probability: { kind: 'constant', value: 0.3 },
                        },
                      },
                      data_5: {
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
      createSpatialPointTargets_3: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'firePoint', count: { kind: 'constant', value: 1 } },
        },
        next: 'withActionBlackboardScope_2',
      },
      reachSkillOperableBoundary_46: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0025_ardelia_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_attack3: SkillDefinition = {
  key: 'chr_0025_ardelia_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08],
    atk_scale_display: [0.53, 0.58, 0.63, 0.68, 0.74, 0.79, 0.84, 0.89, 0.95, 1.01, 1.09, 1.18],
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 164,
  exclusiveFrame: 47,
  offsetRecordFrame: 27,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 58,
        input: 'basicAttack',
        targetSkillId: 'chr_0025_ardelia_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 45, endFrame: 58, skillIds: ['chr_0025_ardelia_attack4'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 25, endFrame: 26, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 33, endFrame: 34, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 35, endFrame: 36, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 37, endFrame: 38, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 39, endFrame: 40, sequence: { $sequence: 'createSpatialPointTargets_3' } },
    { startFrame: 45, endFrame: 58, sequence: { $sequence: 'reachSkillOperableBoundary_46' } },
  ],
  timelineContinuationSkillId: 'chr_0025_ardelia_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_attack3ActionGraph,
};

export const ardeliaChr_0025_ardelia_attack4ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_2: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'spawnAbilityEntity_2' },
          whenFalse: { $sequence: 'spawnAbilityEntity_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_end',
            childSkillId: 'chr_0025_ardelia_attack4_end_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
          },
        },
        next: null,
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_low',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'spawnAbilityEntity_7' },
          whenFalse: { $sequence: 'spawnAbilityEntity_7' },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0025_ardelia_attack4_kill_sheep',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0025_ardelia_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_attack4: SkillDefinition = {
  key: 'chr_0025_ardelia_attack4',
  blackboard: {
    atb: 18,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    poise: 18,
  },
  timelineBlockFrames: 50,
  naturalDurationFrames: 198,
  exclusiveFrame: 50,
  offsetRecordFrame: 24,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 58,
        input: 'basicAttack',
        targetSkillId: 'chr_0025_ardelia_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 50, endFrame: 58, skillIds: ['chr_0025_ardelia_attack1'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 65, endFrame: 66, sequence: { $sequence: 'spawnAbilityEntity_5' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 0, endFrame: 198, sequence: { $sequence: 'applyBuff_10' } },
    { startFrame: 50, endFrame: 58, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  timelineContinuationSkillId: 'chr_0025_ardelia_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_attack4ActionGraph,
};

export const ardeliaChr_0025_ardelia_power_attackActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.05,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_4: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.11 } },
          body: { $sequence: 'dealDamage_3' },
        },
        next: null,
      },
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.4,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_5',
      },
      launchProjectile_8: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: 'launchProjectile_1',
      },
      launchProjectile_9: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: 'launchProjectile_8',
      },
      repeatEachTick_10: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'launchProjectile_9' },
        },
        next: null,
      },
      repeatEachTick_13: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'launchProjectile_8' },
        },
        next: null,
      },
      repeatEachTick_15: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.4,
                  inTangent: -14.1076889,
                  outTangent: -14.1076889,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.283485949,
                },
                {
                  time: 0.05,
                  value: 0.01,
                  inTangent: 0.00631965976,
                  outTangent: 0.00631965976,
                  weightedMode: 2,
                  inWeight: 0.333333343,
                  outWeight: 0.7771024,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 8.266109,
                  outTangent: 5.233175,
                  weightedMode: 1,
                  inWeight: 0.08745263,
                  outWeight: 0.333333343,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      applyBuff_17: {
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
      applyBuff_18: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_power_attack: SkillDefinition = {
  key: 'chr_0025_ardelia_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 57,
  naturalDurationFrames: 215,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 57,
        endFrame: 65,
        skillIds: ['chr_0025_ardelia_normal_skill', 'chr_0025_ardelia_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 21, endFrame: 53, sequence: { $sequence: 'repeatEachTick_4' } },
    { startFrame: 57, endFrame: 60, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 15, endFrame: 28, sequence: { $sequence: 'repeatEachTick_10' } },
    { startFrame: 28, endFrame: 41, sequence: { $sequence: 'repeatEachTick_13' } },
    { startFrame: 41, endFrame: 51, sequence: { $sequence: 'repeatEachTick_15' } },
    { startFrame: 59, endFrame: 62, sequence: { $sequence: 'startTimeDilation_16' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_17' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'applyBuff_18' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: ardeliaChr_0025_ardelia_power_attackActionGraph,
};

export const ardeliaChr_0025_ardelia_plunging_attack_endActionGraph = {
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
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
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'conditional_2',
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_air_attack'],
          },
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
          parameters: { contextKey: 'Sheep' },
          body: { $sequence: 'finishCurrentAbilityEntity_5' },
        },
        next: null,
      },
      inheritBuffById_7: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0025_ardelia_air_attack_interrupt_listener',
            inheritToNextSkillIds: [],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
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

export const ardeliaChr_0025_ardelia_plunging_attack_end: SkillDefinition = {
  actionGraph: ardeliaChr_0025_ardelia_plunging_attack_endActionGraph,
  key: 'chr_0025_ardelia_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 23,
  naturalDurationFrames: 156,
  exclusiveFrame: 22,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_4' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'forEachContextTarget_6' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'inheritBuffById_7' } },
  ],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const ardeliaChr_0025_ardelia_normal_skillActionGraph = {
  main: {
    nodes: {
      markCurrentSkillCanInterrupt_1: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_2: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      jumpTimeline_opt1: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 32, condition: { kind: 'constant', value: true } },
        },
        next: null,
      },
      jumpTimeline_opt2: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 221,
            condition: { kind: 'conditionNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0025_ardelia_normal_skill_gene_sheep',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, heal_scale: 0, heal_value: 0, potential2: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 2, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
                            childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
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
      repeatByActionValue_7: {
        action: {
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'valueNode', nodeId: 'data_2' } },
          body: { $sequence: 'withActionBlackboardScope_6' },
        },
        next: null,
      },
      createSpatialPointTargets_8: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'SheepPoint',
            count: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'repeatByActionValue_7',
      },
      createTimedMarker_15: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'talent1_mark',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      finishBuffsByTag_16: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
            reason: 'early',
          },
        },
        next: 'createTimedMarker_15',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0025_ardelia_normal_skill_vulnerable',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration_vul', rate: 'rate_vul_base' },
          },
        },
        next: 'finishBuffsByTag_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_17' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_19: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_19',
      },
      forEachContextTarget_21: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_18' },
        },
        next: 'dealDamage_20',
      },
      finishBuffsById_22: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0025_ardelia_normal_skill_kill_sheep'],
            reason: 'other',
          },
        },
        next: 'forEachContextTarget_21',
      },
      mergeContextTargets_32: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'other_cor_tar', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_31: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'other_cor_tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: null,
      },
      jumpTimeline_33: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 189 } },
        next: null,
      },
      conditional_34: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'jumpTimeline_33' },
        },
        next: null,
      },
      conditional_35: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'mergeContextTargets_31' },
          whenFalse: { $sequence: 'mergeContextTargets_32' },
        },
        next: 'conditional_34',
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'conditional_35' },
        },
        next: null,
      },
      conditional_37: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'conditional_36' },
        },
        next: null,
      },
      spawnAbilityEntity_38: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_normal_skill',
            childSkillId: 'chr_0025_ardelia_normal_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      applyBuff_40: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0025_ardelia_normal_skill_kill_sheep',
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
          kind: 'contextTargetCountCompare',
          contextKey: 'other_cor_tar',
          operator: 'greater',
          value: 0,
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'sheep_num' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'sheep_num' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffTagIdCountCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'other_cor_tar',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Corrupt'],
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'talent1', fallback: 0 } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent1_mark' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_normal_skill: SkillDefinition = {
  key: 'chr_0025_ardelia_normal_skill',
  blackboard: {
    additional_def_decrease: 0,
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    cam_angle: 0,
    def_decrease: 0,
    duration_vul: 30,
    heal_scale: 0,
    heal_value: 0,
    input_angle: 0,
    poise: 10,
    potential2: 0,
    rate_vul: 0,
    rate_vul_base: [0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.14, 0.14, 0.16, 0.17, 0.18, 0.2],
    sheep_num: 0,
    talent1: 0,
    rate_vul_max: [0.36, 0.36, 0.36, 0.37, 0.37, 0.37, 0.38, 0.38, 0.4, 0.41, 0.42, 0.4],
  },
  timelineBlockFrames: 47,
  naturalDurationFrames: 378,
  exclusiveFrame: 239,
  offsetRecordFrame: 7,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 47, endFrame: 52, skillIds: ['chr_0025_ardelia_attack1'] },
      { startFrame: 236, endFrame: 241, skillIds: ['chr_0025_ardelia_attack1'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 52, endFrame: 55, sequence: { $sequence: 'markCurrentSkillCanInterrupt_1' } },
    { startFrame: 188, endFrame: 189, sequence: { $sequence: 'finishTimeline_2' } },
    { startFrame: 25, endFrame: 31, sequence: { $sequence: 'jumpTimeline_opt1' } },
    { startFrame: 214, endFrame: 220, sequence: { $sequence: 'jumpTimeline_opt2' } },
    { startFrame: 32, endFrame: 35, sequence: { $sequence: 'createSpatialPointTargets_8' } },
    { startFrame: 221, endFrame: 224, sequence: { $sequence: 'createSpatialPointTargets_8' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'finishBuffsById_22' } },
    { startFrame: 221, endFrame: 222, sequence: { $sequence: 'finishBuffsById_22' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'conditional_37' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_38' } },
    { startFrame: 189, endFrame: 192, sequence: { $sequence: 'spawnAbilityEntity_38' } },
    { startFrame: 0, endFrame: 189, sequence: { $sequence: 'applyBuff_40' } },
    { startFrame: 189, endFrame: 378, sequence: { $sequence: 'applyBuff_40' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: ardeliaChr_0025_ardelia_normal_skillActionGraph,
};

export const ardeliaChr_0025_ardelia_combo_skillActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_combo_skill',
            childSkillId: 'chr_0025_ardelia_combo_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
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
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0025_ardelia_combo_skill_projhit',
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
                  atk_scale_boom: 0,
                  duration_corrupt: 0,
                  potential3: 0,
                  potential5_dmg_rate: 0,
                  potential5_duration: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_7' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_8' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_5: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: null,
                      },
                      dealDamage_6: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                          },
                        },
                        next: 'changeResourceByActionValue_5',
                      },
                      modifyActionValue_3: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale_boom',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'dealDamage_6',
                      },
                      modifyActionValue_4: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'modifyActionValue_3',
                      },
                      conditional_7: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'modifyActionValue_4' },
                          whenFalse: { $sequence: 'dealDamage_6' },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_8: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0025_ardelia_combo_skill_bomb',
                            childSkillId: 'chr_0025_ardelia_combo_skill_bomb',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential5_dmg_rate' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential5_dmg_rate' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential5_dmg_rate', fallback: 0 },
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
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.8 },
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0025_ardelia_combo_skill_kill_sheep',
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

export const ardeliaChr_0025_ardelia_combo_skill: SkillDefinition = {
  key: 'chr_0025_ardelia_combo_skill',
  blackboard: {
    atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    atk_scale_boom: [1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2, 2.14, 2.3, 2.5],
    cam_angle: 0,
    cam_duration: 0,
    count: 0,
    duration_corrupt: 7,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    posie: 0,
    potential3: 0,
    potential5_dmg_rate: 0,
    potential5_duration: 0,
    usp: 10,
    poise: 10,
  },
  timelineBlockFrames: 41,
  naturalDurationFrames: 160,
  exclusiveFrame: 40,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 23, endFrame: 40, skillIds: ['chr_0025_ardelia_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'startTimeDilation_4' } },
    { startFrame: 0, endFrame: 160, sequence: { $sequence: 'applyBuff_5' } },
  ],
  smartTarget: 'input',
  cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: ardeliaChr_0025_ardelia_combo_skillActionGraph,
};

export const ardeliaChr_0025_ardelia_ultimate_skillActionGraph = {
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
      jumpTimeline_3: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 201,
            condition: { kind: 'conditionNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0025_ardelia_ultimate_skill_sheep_projhit',
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
                  effect_prob: 0,
                  heal_scale: 0,
                  heal_value: 0,
                  interval: 0,
                  poise: 0,
                  potential3_rate: 0,
                  random_phy: 0,
                  random_spe: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_2' } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'forEachContextTarget_6' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
                            childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'spawnAbilityEntity_1' },
                        },
                        next: null,
                      },
                      createTimedMarker_3: {
                        action: {
                          kind: 'createTimedMarker',
                          parameters: {
                            target: 'enemy',
                            markerId: 'ArdeliaUltMark',
                            durationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
                            autoFinishByAction: false,
                          },
                        },
                        next: null,
                      },
                      dealDamage_4: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['ultimateSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                          },
                        },
                        next: 'createTimedMarker_3',
                      },
                      conditional_5: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                          whenTrue: { $sequence: 'dealDamage_4' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { target: 'enemy' },
                          body: { $sequence: 'conditional_5' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'effect_prob' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'probability',
                          probability: { kind: 'valueNode', nodeId: 'data_1' },
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'interval' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: 'ArdeliaUltMark',
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'not',
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
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
          body: { $sequence: 'launchProjectile_4' },
        },
        next: null,
      },
      repeatByActionValue_6: {
        action: {
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'constant', value: 1 } },
          body: { $sequence: 'withActionBlackboardScope_5' },
        },
        next: null,
      },
      createSpatialPointTargets_7: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'ranPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'repeatByActionValue_6',
      },
      repeatEachTick_8: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.03,
            },
          },
          body: { $sequence: 'createSpatialPointTargets_7' },
        },
        next: null,
      },
      startUltimateTimeDilation_14: {
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
      hideUi_15: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_16: {
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential3_duration', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_ultimate_skill: SkillDefinition = {
  key: 'chr_0025_ardelia_ultimate_skill',
  blackboard: {
    atk_scale: [0.73, 0.81, 0.88, 0.95, 1.03, 1.1, 1.17, 1.25, 1.32, 1.41, 1.52, 1.65],
    atk_scale_2: 0,
    effect_prob: 0.1,
    heal_scale: 0,
    heal_value: 0,
    interval: 0.3,
    poise: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
    potential2: 0,
    potential3_duration: 0,
    potential3_rate: 0,
    radius: 4,
    ranCount: 0,
    select_radius: 10,
    tarDisMax: 0,
    duration: 3,
  },
  timelineBlockFrames: 224,
  naturalDurationFrames: 261,
  exclusiveFrame: 223,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 209,
        endFrame: 226,
        skillIds: ['chr_0025_ardelia_normal_skill', 'chr_0025_ardelia_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 171, endFrame: 174, sequence: { $sequence: 'jumpTimeline_3' } },
    { startFrame: 81, endFrame: 201, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 81, endFrame: 201, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'startUltimateTimeDilation_14' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'hideUi_15' } },
    { startFrame: 0, endFrame: 81, sequence: { $sequence: 'applyBuff_16' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: ardeliaChr_0025_ardelia_ultimate_skillActionGraph,
};

export const ardeliaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: ardeliaCommon_character_perfect_dodgeActionGraph,
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

const ardeliaComboCondition1ActionGraph = {
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard', 'Skill/Character/Common/SpellInflict'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttackLastCombo'],
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0025_ardelia_combo_skill',
  event: 'beforeOutputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: ardeliaComboCondition1ActionGraph,
};

const ardeliaBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: ardeliaBuff1ActionGraph,
};

const ardeliaBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_vulnerable',
    iconPath: '/icons/icon_battle_affix_vulnerable.webp',
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
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: ardeliaBuff2ActionGraph,
};

const ardeliaBuff3ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'attack4_sheep' },
          body: { $sequence: 'finishCurrentAbilityEntity_1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'attack4_sheep',
            abilityEntityIds: [
              'abilityentity_chr_0025_ardelia_attack4',
              'abilityentity_chr_0025_ardelia_attack4_end',
              'abilityentity_chr_0025_ardelia_attack4_low',
            ],
          },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'findOwnerSpawnedAbilityEntities_3' } },
  actionGraph: ardeliaBuff3ActionGraph,
};

const ardeliaBuff4ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'combo_skill_sheep' },
          body: { $sequence: 'finishCurrentAbilityEntity_1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'combo_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_combo_skill'],
          },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'findOwnerSpawnedAbilityEntities_3' } },
  actionGraph: ardeliaBuff4ActionGraph,
};

const ardeliaBuff5ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'normal_skill_sheep' },
          body: { $sequence: 'finishCurrentAbilityEntity_1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'normal_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_normal_skill'],
          },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'findOwnerSpawnedAbilityEntities_3' } },
  actionGraph: ardeliaBuff5ActionGraph,
};

const ardeliaBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_physical',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_physic_child',
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_3' },
              rate: { kind: 'valueNode', nodeId: 'data_4' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_spell_child',
            },
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const ardeliaBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 7, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' } },
  actionGraph: ardeliaBuff6ActionGraph,
};

export const ardelia: OperatorDefinition = {
  slug: 'ardelia',
  gameId: 'ARDELIA',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 31, 54, 77, 100, 112],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [20, 46, 75, 103, 131, 145],
    will: [15, 37, 60, 83, 106, 118],
    baseAttack: [30, 93, 159, 225, 291, 323],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        ardeliaChr_0025_ardelia_attack1,
        ardeliaChr_0025_ardelia_attack2,
        ardeliaChr_0025_ardelia_attack3,
        ardeliaChr_0025_ardelia_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: ardeliaChr_0025_ardelia_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: ardeliaChr_0025_ardelia_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: ardeliaChr_0025_ardelia_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: ardeliaChr_0025_ardelia_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: ardeliaChr_0025_ardelia_ultimate_skill,
    },
  ],
  dodgeSkill: ardeliaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0025_ardelia_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0025_ardelia_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0025_ardelia_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0025_ardelia_attack1',
        'chr_0025_ardelia_attack2',
        'chr_0025_ardelia_attack3',
        'chr_0025_ardelia_attack4',
        'chr_0025_ardelia_plunging_attack_end',
        'chr_0025_ardelia_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0025_ardelia_attack1',
        'chr_0025_ardelia_attack2',
        'chr_0025_ardelia_attack3',
        'chr_0025_ardelia_attack4',
      ],
      defaultSkillKey: 'chr_0025_ardelia_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [ardeliaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'sheep_num',
          operation: 'assign',
          value: [3, 3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'effect_prob',
          operation: 'assign',
          value: [0.1, 0.1, 0.1],
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent1',
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
          blackboardKey: 'rate_vul_base',
          operation: 'add',
          value: 0.08,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential3_duration',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'effect_prob',
          operation: 'multiply',
          value: 1.2,
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5_duration',
          operation: 'assign',
          value: 4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5_dmg_rate',
          operation: 'add',
          value: 1.2,
        },
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
      ],
    },
  ],
  entityBlackboard: { EntityBB_skill_bg_type: 99 },
  buffDefinitions: {
    buff_chr_0025_ardelia_affixes_vulnerable_physic_child: ardeliaBuff1,
    buff_chr_0025_ardelia_affixes_vulnerable_spell_child: ardeliaBuff2,
    buff_chr_0025_ardelia_attack4_kill_sheep: ardeliaBuff3,
    buff_chr_0025_ardelia_combo_skill_kill_sheep: ardeliaBuff4,
    buff_chr_0025_ardelia_normal_skill_kill_sheep: ardeliaBuff5,
    buff_chr_0025_ardelia_normal_skill_vulnerable: ardeliaBuff6,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0025_ardelia_attack4: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_attack4_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0, poise: 0 },
        scheduledSequences: [
          { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_opt2' } },
          {
            startFrame: 27,
            endFrame: 30,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
          },
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
              finishActionOwnerAbilityEntity_5: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
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
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0025_ardelia_attack4:chr_0025_ardelia_attack4_sheep:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: 'conditional_opt1',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_attack4_end: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishActionOwnerAbilityEntity_1: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0025_ardelia_attack4_end_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 120,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          {
            startFrame: 109,
            endFrame: 112,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_attack4_low: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_attack4_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0, poise: 0 },
        scheduledSequences: [
          { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_opt2' } },
          {
            startFrame: 27,
            endFrame: 30,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_5' },
          },
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
              finishActionOwnerAbilityEntity_5: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
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
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0025_ardelia_attack4_low:chr_0025_ardelia_attack4_sheep:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: 'conditional_opt1',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/NormalSkillSheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishActionOwnerAbilityEntity_1: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0025_ardelia_normal_skill_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          {
            startFrame: 31,
            endFrame: 34,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_remain_loop: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      maxStackingCount: 10,
      childSkill: {
        skillId: 'chr_0025_ardelia_remain_loop_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 300,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atb: 0,
          heal_scale: 1,
          heal_scale_half: 0,
          heal_value: 0,
          heal_value_half: 0,
          potential2: 0,
          RandomSheep: 0,
        },
        scheduledSequences: [
          { startFrame: 9, endFrame: 300, sequence: { $sequence: 'findCharacterTeamTargets_37' } },
          {
            startFrame: 299,
            endFrame: 300,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_31' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              heal_25: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: 'contextTarget',
                    contextKey: 'otherMate',
                    alwaysNext: true,
                    tags: [],
                    attribute: 'will',
                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                    addition: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: null,
              },
              calculateActionValue_26: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'heal_value_half',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'constant', value: 0.5 },
                  },
                },
                next: 'heal_25',
              },
              calculateActionValue_27: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'heal_scale_half',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    right: { kind: 'constant', value: 0.5 },
                  },
                },
                next: 'calculateActionValue_26',
              },
              findCharacterTeamTargets_28: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'otherMate',
                    selection: { kind: 'lowestHealthRatioOperator', excludedContextKey: 'healTar' },
                  },
                },
                next: 'calculateActionValue_27',
              },
              finishActionOwnerAbilityEntity_31: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
              heal_32: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: 'contextTarget',
                    contextKey: 'healTar',
                    alwaysNext: true,
                    tags: [],
                    attribute: 'will',
                    multiplier: { kind: 'valueNode', nodeId: 'data_5' },
                    addition: { kind: 'valueNode', nodeId: 'data_6' },
                  },
                },
                next: 'finishActionOwnerAbilityEntity_31',
              },
              conditional_33: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_8' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'findCharacterTeamTargets_28' },
                },
                next: 'heal_32',
              },
              mergeContextTargets_34: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'healTar',
                    sources: [{ kind: 'target', target: 'currentTarget' }],
                  },
                },
                next: 'conditional_33',
              },
              conditional_20: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'mergeContextTargets_34' },
                  whenFalse: { $sequence: 'conditional_33' },
                },
                next: null,
              },
              conditional_29: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'conditional_20' },
                  whenFalse: { $sequence: 'mergeContextTargets_34' },
                },
                next: null,
              },
              findCharacterTeamTargets_30: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'healTar',
                    selection: { kind: 'lowestHealthRatioOperator', excludeCurrentTarget: true },
                  },
                },
                next: 'conditional_29',
              },
              conditional_35: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'findCharacterTeamTargets_30' },
                  whenFalse: { $sequence: 'mergeContextTargets_34' },
                },
                next: null,
              },
              forEachContextTarget_36: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: {
                    contextKey:
                      '__auraParty:SkillData.chr_0025_ardelia_remain_loop_sheep.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]',
                  },
                  body: { $sequence: 'conditional_35' },
                },
                next: null,
              },
              findCharacterTeamTargets_37: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey:
                      '__auraParty:SkillData.chr_0025_ardelia_remain_loop_sheep.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]',
                    selection: { kind: 'controlledOperator' },
                  },
                },
                next: 'forEachContextTarget_36',
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_scale_half' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_value_half' },
              },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential2', fallback: 0 },
              },
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_7' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'healthCompare',
                  target: 'contextTarget',
                  contextKey: 'healTar',
                  valueType: 'ratio',
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 0.99 },
                },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'contextTargetCountCompare',
                  contextKey: 'healTar',
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_11: {
                type: 'boolean',
                expression: {
                  kind: 'healthCompare',
                  target: 'currentTarget',
                  valueType: 'ratio',
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 0.99 },
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/ComboSkillSheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishActionOwnerAbilityEntity_1: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0025_ardelia_combo_skill_sheep',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          {
            startFrame: 66,
            endFrame: 69,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill_bomb: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      childSkills: {
        chr_0025_ardelia_combo_skill_bomb: {
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_1: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'atk_scale_boom',
                      operation: 'multiply',
                      value: { kind: 'constant', value: 0.5 },
                    },
                  },
                  next: null,
                },
                mergeContextTargets_2: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: { saveToContextKey: 'tar', sources: [] },
                  },
                  next: 'modifyActionValue_1',
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb|chr_0025_ardelia_combo_skill_bomb_potential3:/childSkills/chr_0025_ardelia_combo_skill_bomb/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: 'mergeContextTargets_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_natural_natural_corrupt_triggered',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: { duration: 'duration_corrupt_final' },
                    },
                  },
                  next: 'dealDamage_3',
                },
                calculateActionValue_5: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_corrupt_final',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_3' },
                      right: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                  },
                  next: 'applyBuff_4',
                },
                finishActionOwnerAbilityEntity_6: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_boom' },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'duration_corrupt' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'potential5_duration' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0025_ardelia_combo_skill_bomb',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 120,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_boom: 0,
            duration_corrupt: 0,
            duration_corrupt_final: 0,
            poise: 0,
            potential5_dmg_rate: 0,
            potential5_duration: 0,
          },
          scheduledSequences: [
            { startFrame: 52, endFrame: 55, sequence: { $sequence: 'calculateActionValue_5' } },
            {
              startFrame: 119,
              endFrame: 120,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_6' },
            },
          ],
        },
        chr_0025_ardelia_combo_skill_bomb_potential3: {
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
                    key: 'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb|chr_0025_ardelia_combo_skill_bomb_potential3:/childSkills/chr_0025_ardelia_combo_skill_bomb_potential3/actionGraph/main/nodes/dealDamage_1/action',
                  },
                  next: null,
                },
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_common_natural_natural_corrupt_triggered',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: { duration: 'duration_corrupt_final' },
                    },
                  },
                  next: 'dealDamage_1',
                },
                calculateActionValue_3: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_corrupt_final',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_3' },
                      right: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                  },
                  next: 'applyBuff_2',
                },
                finishActionOwnerAbilityEntity_4: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_boom' },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'duration_corrupt' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'potential5_duration' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0025_ardelia_combo_skill_bomb_potential3',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 120,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 0,
            atk_scale_boom: 0,
            duration_corrupt: 0,
            duration_corrupt_final: 0,
            poise: 0,
            potential5_duration: 0,
          },
          scheduledSequences: [
            { startFrame: 52, endFrame: 55, sequence: { $sequence: 'calculateActionValue_3' } },
            {
              startFrame: 119,
              endFrame: 120,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_4' },
            },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default ardelia;
