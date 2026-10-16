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
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_3: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            onlyMainOperator: true,
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_4: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'changeResource_3' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_4',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
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
      reachSkillOperableBoundary_2: {
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
  element: 'nature',
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
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 11, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  defaultTarget: 'enemy',
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
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_3: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            onlyMainOperator: true,
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_4: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'changeResource_3' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_4',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
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
      reachSkillOperableBoundary_3: {
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
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
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
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 20, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
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
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_7' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                        },
                        next: null,
                      },
                      changeResource_4: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_2' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            onlyMainOperator: true,
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: null,
                      },
                      checkCondition_3: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                        },
                        next: 'checkCondition_2',
                      },
                      ifElse_5: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_5' },
                          whenTrue: { $sequence: 'changeResource_4' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      ifElse_6: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: null },
                          whenFalse: { $sequence: null },
                        },
                        next: 'ifElse_5',
                      },
                      dealDamage_7: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_6',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'probability',
                          probability: { kind: 'constant', value: 0.3 },
                        },
                      },
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_5: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_3' },
                        },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_1' },
                        },
                      },
                      data_7: {
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
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'firePoint', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_1',
      },
      createSpatialPointTargets_3: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'sectorCenter', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_2',
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
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08],
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
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0025_ardelia_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_attack3ActionGraph,
};

export const ardeliaChr_0025_ardelia_attack4ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_6: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'sheepPos' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'sheepPos' },
          },
        },
        next: null,
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'spawnAbilityEntity_6' },
          whenFalse: { $sequence: 'spawnAbilityEntity_6' },
        },
        next: null,
      },
      createSpatialPointTargets_11: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'sheepPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_10',
      },
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'sheepPos' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'spawnAbilityEntity_3' },
          whenFalse: { $sequence: 'spawnAbilityEntity_3' },
        },
        next: null,
      },
      createSpatialPointTargets_9: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'sheepPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_8',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'createSpatialPointTargets_9' },
          whenFalse: { $sequence: 'createSpatialPointTargets_11' },
        },
        next: null,
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'ifElse_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: {
              kind: 'fixedPoint',
              owner: { kind: 'owner' },
              directionTarget: { kind: 'source' },
              center: { kind: 'owner' },
            },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_end',
            childSkillId: 'chr_0025_ardelia_attack4_end_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
          },
        },
        next: null,
      },
      spawnAbilityEntity_21: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'sheepPos' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_low',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'sheepPos' },
          },
        },
        next: null,
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'spawnAbilityEntity_21' },
          whenFalse: { $sequence: 'spawnAbilityEntity_21' },
        },
        next: null,
      },
      createSpatialPointTargets_26: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'sheepPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_25',
      },
      spawnAbilityEntity_18: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'sheepPos' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_low',
            childSkillId: 'chr_0025_ardelia_attack4_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'spawnAbilityEntity_18' },
          whenFalse: { $sequence: 'spawnAbilityEntity_18' },
        },
        next: null,
      },
      createSpatialPointTargets_24: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'sheepPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_23',
      },
      ifElse_28: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'createSpatialPointTargets_24' },
          whenFalse: { $sequence: 'createSpatialPointTargets_26' },
        },
        next: null,
      },
      ifElse_29: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_28' },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0025_ardelia_attack4_kill_sheep' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_31: {
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
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_4' } },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_4' } },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'fixed', target: 'enemy' },
          distance: 10,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_4' } },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_4' } },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'fixed', target: 'enemy' },
          distance: 10,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_9: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_attack4: SkillDefinition = {
  key: 'chr_0025_ardelia_attack4',
  element: 'nature',
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 65, endFrame: 66, sequence: { $sequence: 'spawnAbilityEntity_15' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_29' } },
    { startFrame: 0, endFrame: 198, sequence: { $sequence: 'applyBuff_30' } },
    { startFrame: 50, endFrame: 58, sequence: { $sequence: 'reachSkillOperableBoundary_31' } },
  ],
  defaultTarget: 'enemy',
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
          parameters: { inheritActionBlackboard: true, finish: 'firstTickReach' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
          parameters: { inheritActionBlackboard: true, finish: 'firstTickReach' },
          callbacks: [],
        },
        next: 'launchProjectile_1',
      },
      launchProjectile_9: {
        action: {
          kind: 'launchProjectile',
          parameters: { inheritActionBlackboard: true, finish: 'firstTickReach' },
          callbacks: [],
        },
        next: 'launchProjectile_8',
      },
      repeatEachTick_10: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'inputTarget' },
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
              catchUpMissedTicks: false,
              target: { kind: 'inputTarget' },
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
              catchUpMissedTicks: false,
              target: { kind: 'inputTarget' },
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
            buffs: [{ buffId: 'buff_common_full_immune_medium' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
            buffs: [{ buffId: 'buff_common_power_attack_disable_cast_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_power_attack: SkillDefinition = {
  key: 'chr_0025_ardelia_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 66,
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
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: ardeliaChr_0025_ardelia_power_attackActionGraph,
};

export const ardeliaChr_0025_ardelia_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      changeResource_3: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'ifElse_4',
      },
      findOwnerSpawnedAbilityEntities_6: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_air_attack'],
            owner: { kind: 'owner' },
          },
        },
        next: null,
      },
      finishOwner_7: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'Sheep' } } },
        next: null,
      },
      inheritBuffById_8: {
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
  key: 'chr_0025_ardelia_plunging_attack_end',
  element: 'physical',
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
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_6' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'finishOwner_7' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'inheritBuffById_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: ardeliaChr_0025_ardelia_plunging_attack_endActionGraph,
};

export const ardeliaChr_0025_ardelia_normal_skillActionGraph = {
  main: {
    nodes: {
      markCurrentSkillCanInterrupt_1: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_2: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      jumpTimeline_4: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 32 },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
        },
        next: null,
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      jumpTimeline_7: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 221 },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
        },
        next: null,
      },
      launchProjectile_9: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickBlock',
            recycleDelaySeconds: 0.0333333350718021,
            targets: { kind: 'context', contextKey: 'SheepPoint' },
          },
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
                blackboard: { heal_scale: 0, heal_value: 0, potential2: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'fixed', target: 'enemy' },
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
      createSpatialPointTargets_10: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'SheepPoint',
            count: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'launchProjectile_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'createSpatialPointTargets_10',
      },
      createTimedMarker_15: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'talent1_mark',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      finishBuffsByTag_16: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
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
            buffs: [
              {
                buffId: 'buff_chr_0025_ardelia_normal_skill_vulnerable',
                copiedBlackboardAssignments: { duration: 'duration_vul', rate: 'rate_vul_base' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsByTag_16',
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'applyBuff_17',
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'applyBuff_20',
      },
      jumpTimeline_42: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 189 },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
        },
        next: null,
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'jumpTimeline_42',
      },
      findTargets_44: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/Common/SpellStatus/Corrupt'],
            },
            saveToContextKey: 'other_cor_tar',
          },
        },
        next: 'checkCondition_43',
      },
      checkCondition_45: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'findTargets_44',
      },
      checkCondition_46: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'checkCondition_45',
      },
      spawnAbilityEntity_47: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_normal_skill',
            childSkillId: 'chr_0025_ardelia_normal_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      applyBuff_49: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0025_ardelia_normal_skill_kill_sheep' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_21',
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_18' },
        },
        next: 'ifElse_opt1',
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'forEachContextTarget_opt2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      finishBuffsById_opt4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0025_ardelia_normal_skill_kill_sheep'],
            reason: 'other',
          },
        },
        next: 'ifElse_opt3',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'fixed', target: 'enemy' },
          distance: 1,
          lessThan: true,
          includeTargetRadius: true,
          containsHittableObject: false,
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'other_cor_tar' },
          distance: 1.5,
          lessThan: true,
          includeTargetRadius: true,
          containsHittableObject: false,
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'sheep_num' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_5: {
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
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'other_cor_tar' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'talent1', fallback: 0 } },
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
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          target: 'caster',
          markerId: 'talent1_mark',
        },
      },
      data_13: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_14: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_normal_skill: SkillDefinition = {
  key: 'chr_0025_ardelia_normal_skill',
  element: 'nature',
  blackboard: {
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    duration_vul: 30,
    heal_scale: 0,
    heal_value: 0,
    poise: 10,
    potential2: 0,
    rate_vul_base: [0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.14, 0.14, 0.16, 0.17, 0.18, 0.2],
    sheep_num: 0,
    talent1: 0,
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
    { startFrame: 188, endFrame: 189, sequence: { $sequence: 'interruptCurrentSkill_2' } },
    { startFrame: 25, endFrame: 31, sequence: { $sequence: 'jumpTimeline_4' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 214, endFrame: 220, sequence: { $sequence: 'jumpTimeline_7' } },
    { startFrame: 221, endFrame: 222, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 32, endFrame: 35, sequence: { $sequence: 'checkCondition_11' } },
    { startFrame: 221, endFrame: 224, sequence: { $sequence: 'checkCondition_11' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'finishBuffsById_opt4' } },
    { startFrame: 221, endFrame: 222, sequence: { $sequence: 'finishBuffsById_opt4' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'checkCondition_46' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_47' } },
    { startFrame: 189, endFrame: 192, sequence: { $sequence: 'spawnAbilityEntity_47' } },
    { startFrame: 0, endFrame: 189, sequence: { $sequence: 'applyBuff_49' } },
    { startFrame: 189, endFrame: 378, sequence: { $sequence: 'applyBuff_49' } },
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
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0025_ardelia_combo_skill',
            childSkillId: 'chr_0025_ardelia_combo_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      launchProjectile_8: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  potential5_dmg_rate: 0,
                  potential5_duration: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_12' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_13' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_4: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            onlyMainOperator: true,
                          },
                        },
                        next: null,
                      },
                      ifElse_10: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_2' },
                          whenTrue: { $sequence: 'changeResource_4' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_11: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                          },
                        },
                        next: 'ifElse_10',
                      },
                      modifyActionValue_8: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale_boom',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'dealDamage_11',
                      },
                      modifyActionValue_9: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'modifyActionValue_8',
                      },
                      ifElse_12: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'modifyActionValue_9' },
                          whenFalse: { $sequence: 'dealDamage_11' },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_13: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: {
                              kind: 'fixedPoint',
                              owner: { kind: 'source' },
                              directionTarget: { kind: 'source' },
                              center: { kind: 'inputTarget' },
                            },
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
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
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
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'smart_target',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'launchProjectile_8',
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'launchProjectile_8' },
          whenFalse: { $sequence: 'mergeContextTargets_9' },
        },
        next: null,
      },
      findTargets_11: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'ifElse_10',
      },
      startTimeDilation_12: {
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
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0025_ardelia_combo_skill_kill_sheep' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const ardeliaChr_0025_ardelia_combo_skill: SkillDefinition = {
  key: 'chr_0025_ardelia_combo_skill',
  element: 'nature',
  blackboard: {
    atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    atk_scale_boom: [1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2, 2.14, 2.3, 2.5],
    count: 0,
    duration_corrupt: 7,
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
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'findTargets_11' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'startTimeDilation_12' } },
    { startFrame: 0, endFrame: 160, sequence: { $sequence: 'applyBuff_13' } },
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
      jumpTimeline_3: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 201 },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickBlock',
            recycleDelaySeconds: 0.0333333350718021,
            targets: { kind: 'context', contextKey: 'ranPos' },
          },
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
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'checkCondition_3' } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'forEachContextTarget_7' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_2: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'fixed', target: 'enemy' },
                            abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
                            childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                          },
                        },
                        next: null,
                      },
                      checkCondition_3: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: 'spawnAbilityEntity_2',
                      },
                      createTimedMarker_4: {
                        action: {
                          kind: 'createTimedMarker',
                          parameters: {
                            targets: { kind: 'fixed', target: 'enemy' },
                            markerId: 'ArdeliaUltMark',
                            durationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
                            autoFinishByAction: false,
                            timeDomain: 'globalScaled',
                          },
                        },
                        next: null,
                      },
                      dealDamage_5: {
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
                        next: 'createTimedMarker_4',
                      },
                      checkCondition_6: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        },
                        next: 'dealDamage_5',
                      },
                      forEachContextTarget_7: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                          body: { $sequence: 'checkCondition_6' },
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
                          returnTrueIfNotExists: true,
                          target: 'enemy',
                          markerId: 'ArdeliaUltMark',
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
      createSpatialPointTargets_5: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'ranPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_4',
      },
      repeatEachTick_6: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'owner' },
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.03,
            },
          },
          body: { $sequence: 'createSpatialPointTargets_5' },
        },
        next: null,
      },
      startUltimateTimeDilation_10: {
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
      hideUi_11: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
  element: 'nature',
  blackboard: {
    atk_scale: [0.73, 0.81, 0.88, 0.95, 1.03, 1.1, 1.17, 1.25, 1.32, 1.41, 1.52, 1.65],
    effect_prob: 0.1,
    heal_scale: 0,
    heal_value: 0,
    interval: 0.3,
    poise: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
    potential2: 0,
    potential3_duration: 0,
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
    { startFrame: 171, endFrame: 174, sequence: { $sequence: 'jumpTimeline_3' } },
    { startFrame: 81, endFrame: 201, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 81, endFrame: 201, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'startUltimateTimeDilation_10' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'hideUi_11' } },
    { startFrame: 0, endFrame: 81, sequence: { $sequence: 'applyBuff_12' } },
  ],
  defaultTarget: 'enemy',
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const ardeliaComboCondition1ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_2',
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
          selection: 'first',
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
  sequence: { $sequence: 'checkCondition_3' },
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
    icon: 'endaxis:icons/icon_battle_affix_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
      finishOwner_1: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'attack4_sheep' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_2: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'attack4_sheep',
            abilityEntityIds: [
              'abilityentity_chr_0025_ardelia_attack4',
              'abilityentity_chr_0025_ardelia_attack4_end',
              'abilityentity_chr_0025_ardelia_attack4_low',
            ],
            owner: { kind: 'owner' },
          },
        },
        next: 'finishOwner_1',
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
  lifecycleSequences: { finish: [{ $sequence: 'findOwnerSpawnedAbilityEntities_2' }] },
  actionGraph: ardeliaBuff3ActionGraph,
};

const ardeliaBuff4ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'combo_skill_sheep' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_2: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'combo_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_combo_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'finishOwner_1',
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
  lifecycleSequences: { finish: [{ $sequence: 'findOwnerSpawnedAbilityEntities_2' }] },
  actionGraph: ardeliaBuff4ActionGraph,
};

const ardeliaBuff5ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'normal_skill_sheep' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_2: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'normal_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_normal_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'finishOwner_1',
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
  lifecycleSequences: { finish: [{ $sequence: 'findOwnerSpawnedAbilityEntities_2' }] },
  actionGraph: ardeliaBuff5ActionGraph,
};

const ardeliaBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_physical',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_physic_child',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_spell',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_spell_child',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: ardeliaBuff6ActionGraph,
};

export const ardelia: OperatorDefinition = {
  slug: 'ardelia',
  gameId: 'ARDELIA',
  rarity: 6,
  weaponType: 'funnel',
  element: 'nature',
  characterTypeId: 'Natural',
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
      operationType: 'basicAttack',
      skills: [
        ardeliaChr_0025_ardelia_attack1,
        ardeliaChr_0025_ardelia_attack2,
        ardeliaChr_0025_ardelia_attack3,
        ardeliaChr_0025_ardelia_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: ardeliaChr_0025_ardelia_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: ardeliaChr_0025_ardelia_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: ardeliaChr_0025_ardelia_normal_skill,
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: ardeliaChr_0025_ardelia_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: ardeliaChr_0025_ardelia_ultimate_skill },
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
          skillKey: 'chr_0025_ardelia_normal_skill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_normal_skill',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_ultimate_skill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_ultimate_skill',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_normal_skill',
          blackboardKey: 'sheep_num',
          operation: 'assign',
          value: [3, 3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_ultimate_skill',
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
          skillKey: 'chr_0025_ardelia_normal_skill',
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
          skillKey: 'chr_0025_ardelia_normal_skill',
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
          skillKey: 'chr_0025_ardelia_normal_skill',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_ultimate_skill',
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
          skillKey: 'chr_0025_ardelia_ultimate_skill',
          blackboardKey: 'potential3_duration',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_ultimate_skill',
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
          skillKey: 'chr_0025_ardelia_ultimate_skill',
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
          skillKey: 'chr_0025_ardelia_combo_skill',
          blackboardKey: 'potential5_duration',
          operation: 'assign',
          value: 4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0025_ardelia_combo_skill',
          blackboardKey: 'potential5_dmg_rate',
          operation: 'add',
          value: 1.2,
        },
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0025_ardelia_combo_skill', frames: -60 },
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
      faction: 'good',
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
          { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_6' } },
          { startFrame: 27, endFrame: 30, sequence: { $sequence: 'finishOwner_7' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              checkCondition_2: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                },
                next: null,
              },
              checkCondition_3: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                },
                next: 'checkCondition_2',
              },
              changeResource_4: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                    onlyMainOperator: true,
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  },
                },
                next: null,
              },
              ifElse_5: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  whenTrue: { $sequence: 'changeResource_4' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_6' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0025_ardelia_attack4:chr_0025_ardelia_attack4_sheep:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: 'ifElse_5',
              },
              finishOwner_7: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'inputTarget' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'checkActionResult',
                  action: { $sequence: 'checkCondition_3' },
                },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_attack4_end: {
      faction: 'good',
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
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
        blackboard: {},
        scheduledSequences: [
          { startFrame: 109, endFrame: 112, sequence: { $sequence: 'finishOwner_1' } },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_attack4_low: {
      faction: 'good',
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
          { startFrame: 24, endFrame: 27, sequence: { $sequence: 'dealDamage_6' } },
          { startFrame: 27, endFrame: 30, sequence: { $sequence: 'finishOwner_7' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              checkCondition_2: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                },
                next: null,
              },
              checkCondition_3: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                },
                next: 'checkCondition_2',
              },
              changeResource_4: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                    onlyMainOperator: true,
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  },
                },
                next: null,
              },
              ifElse_5: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  whenTrue: { $sequence: 'changeResource_4' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['normalAttack', 'normalAttackLastCombo'],
                    stagger: { kind: 'valueNode', nodeId: 'data_6' },
                    staggerOnlyWhenCasterControlled: true,
                  },
                  key: 'abilityentity_chr_0025_ardelia_attack4_low:chr_0025_ardelia_attack4_sheep:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: 'ifElse_5',
              },
              finishOwner_7: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'inputTarget' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'checkActionResult',
                  action: { $sequence: 'checkCondition_3' },
                },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_normal_skill: {
      faction: 'good',
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
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
        blackboard: {},
        scheduledSequences: [
          { startFrame: 31, endFrame: 34, sequence: { $sequence: 'finishOwner_1' } },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_remain_loop: {
      faction: 'good',
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
          heal_scale: 1,
          heal_scale_half: 0,
          heal_value: 0,
          heal_value_half: 0,
          potential2: 0,
        },
        scheduledSequences: [
          { startFrame: 9, endFrame: 300, sequence: { $sequence: 'aura_44' } },
          { startFrame: 299, endFrame: 300, sequence: { $sequence: 'finishOwner_38' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              heal_31: {
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
              calculateActionValue_32: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'heal_value_half',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'constant', value: 0.5 },
                  },
                },
                next: 'heal_31',
              },
              calculateActionValue_33: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'heal_scale_half',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    right: { kind: 'constant', value: 0.5 },
                  },
                },
                next: 'calculateActionValue_32',
              },
              findCharacterTeamTargets_34: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'otherMate',
                    selection: { kind: 'lowestHealthRatioOperator', excludedContextKey: 'healTar' },
                  },
                },
                next: 'calculateActionValue_33',
              },
              finishOwner_38: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              heal_39: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: 'contextTarget',
                    contextKey: 'healTar',
                    alwaysNext: true,
                    tags: [],
                    attribute: 'will',
                    multiplier: { kind: 'valueNode', nodeId: 'data_4' },
                    addition: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                },
                next: 'finishOwner_38',
              },
              ifElse_40: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_6' },
                  whenTrue: { $sequence: 'findCharacterTeamTargets_34' },
                  whenFalse: { $sequence: null },
                },
                next: 'heal_39',
              },
              mergeContextTargets_41: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'healTar',
                    sources: [{ kind: 'target', target: 'currentTarget' }],
                  },
                },
                next: 'ifElse_40',
              },
              ifElse_25: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_7' },
                  whenTrue: { $sequence: 'mergeContextTargets_41' },
                  whenFalse: { $sequence: 'ifElse_40' },
                },
                next: null,
              },
              ifElse_36: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_8' },
                  whenTrue: { $sequence: 'ifElse_25' },
                  whenFalse: { $sequence: 'mergeContextTargets_41' },
                },
                next: null,
              },
              findCharacterTeamTargets_37: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'healTar',
                    selection: { kind: 'lowestHealthRatioOperator', excludeCurrentTarget: true },
                  },
                },
                next: 'ifElse_36',
              },
              ifElse_42: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  whenTrue: { $sequence: 'findCharacterTeamTargets_37' },
                  whenFalse: { $sequence: 'mergeContextTargets_41' },
                },
                next: null,
              },
              checkCondition_43: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
                },
                next: 'ifElse_42',
              },
              aura_44: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'characterTeam', excludeOwner: false },
                    buffs: [],
                  },
                  onEnter: { $sequence: 'checkCondition_43' },
                  onExit: { $sequence: null },
                },
                next: null,
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
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential2', fallback: 0 },
              },
              data_6: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_5' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_7: {
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
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'healTar' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'healthCompare',
                  target: 'currentTarget',
                  valueType: 'ratio',
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 0.99 },
                },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'actionInputTargetIdentityMatch',
                  other: 'controlledOperator',
                  operator: 'equal',
                },
              },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill: {
      faction: 'good',
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
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
        blackboard: {},
        scheduledSequences: [
          { startFrame: 66, endFrame: 69, sequence: { $sequence: 'finishOwner_1' } },
        ],
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill_bomb: {
      faction: 'good',
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
                mergeContextTargets_1: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'target', target: 'enemy' }],
                    },
                  },
                  next: null,
                },
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb|chr_0025_ardelia_combo_skill_bomb_potential3:/childSkills/chr_0025_ardelia_combo_skill_bomb/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: null,
                },
                modifyActionValue_3: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'atk_scale_boom',
                      operation: 'multiply',
                      value: { kind: 'constant', value: 0.5 },
                    },
                  },
                  next: 'dealDamage_2',
                },
                copyContextTargets_4: {
                  action: {
                    kind: 'copyContextTargets',
                    parameters: {
                      source: { kind: 'context', key: 'tar' },
                      excludeTargets: { kind: 'inputTarget' },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'modifyActionValue_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: 'actionInputTarget',
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb|chr_0025_ardelia_combo_skill_bomb_potential3:/childSkills/chr_0025_ardelia_combo_skill_bomb/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'copyContextTargets_4',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_common_natural_natural_corrupt_triggered',
                          copiedBlackboardAssignments: { duration: 'duration_corrupt_final' },
                        },
                      ],
                      targets: { kind: 'fixed', target: 'enemy' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'dealDamage_5',
                },
                calculateActionValue_7: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_corrupt_final',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_3' },
                      right: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                  },
                  next: 'applyBuff_6',
                },
                finishOwner_8: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
            atk_scale_boom: 0,
            duration_corrupt: 0,
            duration_corrupt_final: 0,
            poise: 0,
            potential5_duration: 0,
          },
          scheduledSequences: [
            { startFrame: 52, endFrame: 55, sequence: { $sequence: 'mergeContextTargets_1' } },
            { startFrame: 52, endFrame: 55, sequence: { $sequence: 'calculateActionValue_7' } },
            { startFrame: 119, endFrame: 120, sequence: { $sequence: 'finishOwner_8' } },
          ],
        },
        chr_0025_ardelia_combo_skill_bomb_potential3: {
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
            atk_scale_boom: 0,
            duration_corrupt: 0,
            duration_corrupt_final: 0,
            poise: 0,
            potential5_duration: 0,
          },
          scheduledSequences: [
            { startFrame: 52, endFrame: 55, sequence: { $sequence: 'calculateActionValue_4' } },
            { startFrame: 119, endFrame: 120, sequence: { $sequence: 'finishOwner_5' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                dealDamage_2: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb|chr_0025_ardelia_combo_skill_bomb_potential3:/childSkills/chr_0025_ardelia_combo_skill_bomb_potential3/actionGraph/main/nodes/dealDamage_2/action',
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_common_natural_natural_corrupt_triggered',
                          copiedBlackboardAssignments: { duration: 'duration_corrupt_final' },
                        },
                      ],
                      targets: { kind: 'fixed', target: 'enemy' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'dealDamage_2',
                },
                calculateActionValue_4: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_corrupt_final',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_3' },
                      right: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                  },
                  next: 'applyBuff_3',
                },
                finishOwner_5: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default ardelia;
