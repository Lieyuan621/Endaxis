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
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'tar', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_1',
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
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
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
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'createSpatialPointTargets_2' } },
    { startFrame: 18, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_1: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.5 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            onlyMainOperator: true,
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
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
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'changeResource_1',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
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
      reachSkillOperableBoundary_3: {
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
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.29, 0.31, 0.32, 0.35, 0.37, 0.41],
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
    { startFrame: 4, endFrame: 4, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 22, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
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
                            coefficient: { kind: 'constant', value: 0.3333333 },
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
      reachSkillOperableBoundary_4: {
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
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.22, 0.23, 0.24, 0.26, 0.28, 0.3],
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
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 23, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
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
                            coefficient: { kind: 'constant', value: 0.3334 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
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
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_6' },
                            staggerMultiplier: { kind: 'constant', value: 0.34 },
                            staggerOnlyWhenCasterControlled: true,
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
      launchProjectile_2: {
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
                            coefficient: { kind: 'constant', value: 0.3334 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
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
                            stagger: { kind: 'valueNode', nodeId: 'data_6' },
                            staggerMultiplier: { kind: 'constant', value: 0.33 },
                            staggerOnlyWhenCasterControlled: true,
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
  element: 'nature',
  blackboard: {
    atb: 16,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.37],
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
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'launchProjectile_2' } },
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'launchProjectile_2' } },
    { startFrame: 40, endFrame: 50, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
            buffs: [{ buffId: 'buff_common_full_immune_medium' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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

export const gilbertaChr_0013_aglina_power_attack: SkillDefinition = {
  key: 'chr_0013_aglina_power_attack',
  element: 'nature',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
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
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: gilbertaChr_0013_aglina_power_attackActionGraph,
};

export const gilbertaChr_0013_aglina_plunging_attack_endActionGraph = {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_plunging_attack_end: SkillDefinition = {
  key: 'chr_0013_aglina_plunging_attack_end',
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 94,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 0, endFrame: 5, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: gilbertaChr_0013_aglina_plunging_attack_endActionGraph,
};

export const gilbertaChr_0013_aglina_normal_skillActionGraph = {
  main: {
    nodes: {
      createSpatialPointTargets_5: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'targetPos', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      copyContextTargets_6: {
        action: {
          kind: 'copyContextTargets',
          parameters: {
            source: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'targetPos',
          },
        },
        next: 'createSpatialPointTargets_5',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'copyContextTargets_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      spawnAbilityEntity_8: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'targetPos' },
            abilityEntityId: 'abilityentity_chr_0013_aglina_normal_skill',
            childSkillId: 'chr_0013_aglina_normal_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      applyBuff_9: {
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
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
          },
        },
        next: 'applyBuff_9',
      },
      mergeContextTargets_11: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_10',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
          },
        },
        next: null,
      },
      mergeContextTargets_13: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_12',
      },
      heal_20: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_3' },
            addition: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      heal_19: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'contextTarget',
            contextKey: 'CureTarget',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_3' },
            addition: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'heal_19' },
          whenFalse: { $sequence: 'heal_20' },
        },
        next: null,
      },
      findCharacterTeamTargets_24: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'CureTarget',
            selection: { kind: 'lowestHealthRatioOperator' },
          },
        },
        next: 'ifElse_23',
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'heal_20' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_24' },
        },
        next: null,
      },
      checkCondition_25: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: null,
      },
      checkCondition_26: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'checkCondition_25',
      },
      ifElse_28: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'ifElse_27' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_29: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'ifElse_28',
      },
      applyElementalInfliction_30: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: 'dealDamage_29',
      },
      mergeContextTargets_31: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'explo', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'applyElementalInfliction_30',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_pull' } },
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
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 2,
        },
      },
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
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_26' } },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_explosion' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_normal_skill: SkillDefinition = {
  key: 'chr_0013_aglina_normal_skill',
  element: 'nature',
  blackboard: {
    atk_scale_explosion: [0.58, 0.63, 0.69, 0.75, 0.81, 0.86, 0.92, 0.98, 1.04, 1.11, 1.2, 1.3],
    atk_scale_pull: [0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55],
    heal_const: 0,
    heal_scale: 0,
    poise: 10,
    potential: 0,
    radius: 5.2,
    radiusadd_display: 0,
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
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'ifElse_7' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'spawnAbilityEntity_8' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'mergeContextTargets_11' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'mergeContextTargets_13' } },
    { startFrame: 62, endFrame: 62, sequence: { $sequence: 'mergeContextTargets_13' } },
    { startFrame: 78, endFrame: 78, sequence: { $sequence: 'mergeContextTargets_13' } },
    { startFrame: 108, endFrame: 109, sequence: { $sequence: 'mergeContextTargets_31' } },
  ],
  defaultTarget: 'enemy',
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
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'triggerpos', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      copyContextTargets_3: {
        action: {
          kind: 'copyContextTargets',
          parameters: {
            source: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'triggerpos',
          },
        },
        next: 'createSpatialPointTargets_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'copyContextTargets_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      hideUi_5: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_6: {
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
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      applyElementalInfliction_8: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: 'dealDamage_7',
      },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'targets',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'applyElementalInfliction_8',
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'triggerpos' },
            abilityEntityId: 'abilityentity_chr_0013_aglina_ultimate_skill',
            childSkillId: 'chr_0013_aglina_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_11: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_5' },
            base: { kind: 'valueNode', nodeId: 'data_6' },
            targetKey: 'final_resistance_scalar_inair',
          },
        },
        next: 'spawnAbilityEntity_10',
      },
      storeSourceAttributeValue_12: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_7' },
            base: { kind: 'valueNode', nodeId: 'data_8' },
            targetKey: 'final_resistance_scalar',
          },
        },
        next: 'storeSourceAttributeValue_11',
      },
      applyBuff_13: {
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
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_increase_inair' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'resistance_scalar_inair' },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_increase' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'resistance_scalar' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_ultimate_skill: SkillDefinition = {
  key: 'chr_0013_aglina_ultimate_skill',
  element: 'nature',
  blackboard: {
    atk_scale: [3.33, 3.67, 4, 4.33, 4.67, 5, 5.34, 5.67, 6, 6.42, 6.92, 7.5],
    duration: 5,
    final_resistance_scalar: 0,
    final_resistance_scalar_inair: 0,
    move_speed_scalar: 0.8,
    poise: 20,
    potential2: 0,
    potential2_onceadd: 0,
    resistance_scalar: 0,
    resistance_scalar_inair: 0,
    spell_vulnerable_perstack: 0.1,
    spell_vulnerable_rate: [0.18, 0.18, 0.18, 0.22, 0.22, 0.22, 0.26, 0.26, 0.26, 0.3, 0.3, 0.3],
    wisd_increase: 0,
    wisd_increase_inair: 0,
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
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_4' } },
    { startFrame: 0, endFrame: 53, sequence: { $sequence: 'hideUi_5' } },
    { startFrame: 0, endFrame: 52, sequence: { $sequence: 'startUltimateTimeDilation_6' } },
    { startFrame: 60, endFrame: 60, sequence: { $sequence: 'mergeContextTargets_9' } },
    { startFrame: 60, endFrame: 65, sequence: { $sequence: 'storeSourceAttributeValue_12' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_13' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: gilbertaChr_0013_aglina_ultimate_skillActionGraph,
};

export const gilbertaChr_0013_aglina_combo_skillActionGraph = {
  main: {
    nodes: {
      heal_6: {
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
      heal_5: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'contextTarget',
            contextKey: 'CureTarget',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'heal_5' },
          whenFalse: { $sequence: 'heal_6' },
        },
        next: null,
      },
      findCharacterTeamTargets_10: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'CureTarget',
            selection: { kind: 'lowestHealthRatioOperator' },
          },
        },
        next: 'ifElse_9',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'heal_6' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_10' },
        },
        next: null,
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_11',
      },
      changeResource_14: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'ifElse_13' },
          whenFalse: { $sequence: null },
        },
        next: 'changeResource_14',
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'ifElse_15',
      },
      applyPhysicalInfliction_17: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 2.5 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_16',
      },
      mergeContextTargets_18: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'applyPhysicalInfliction_17',
      },
      startTimeDilation_19: {
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
      copyContextTargets_opt1: {
        action: {
          kind: 'copyContextTargets',
          parameters: {
            source: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'triggerpos',
          },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'copyContextTargets_opt1' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_const' } },
      data_3: {
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
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'controlledOperator',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 2,
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'heal_const', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_12' } },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_12: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const gilbertaChr_0013_aglina_combo_skill: SkillDefinition = {
  key: 'chr_0013_aglina_combo_skill',
  element: 'nature',
  blackboard: {
    atk_scale: [1.4, 1.54, 1.68, 1.82, 1.96, 2.1, 2.24, 2.38, 2.52, 2.7, 2.91, 3.15],
    heal_const: 0,
    heal_scale: 0,
    poise: 5,
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
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 48, endFrame: 50, sequence: { $sequence: 'mergeContextTargets_18' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_19' } },
  ],
  defaultTarget: 'owner',
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
  defaultTarget: 'enemy',
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
            buffs: [
              {
                buffId: 'buff_chr_0013_aglina_talent_0',
                blackboardAssignments: { add: { kind: 'valueNode', nodeId: 'data_1' } },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
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
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: gilbertaComboCondition1ActionGraph,
};

const gilbertaBuff1ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishOwner_1',
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
  lifecycleSequences: { trigger: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: gilbertaBuff1ActionGraph,
};

const gilbertaBuff2ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: false,
            buffs: [
              {
                buffId: 'buff_chr_0013_aglina_talent_0_effectbuff',
                blackboardAssignments: { add: { kind: 'valueNode', nodeId: 'data_1' } },
                stringBlackboardAssignments: {},
              },
            ],
          },
          onEnter: { $sequence: null },
          onExit: { $sequence: null },
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
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
  actionGraph: gilbertaBuff2ActionGraph,
};

const gilbertaBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0013_aglina_talent_0_effectbuff_Add',
                copiedBlackboardAssignments: { add: 'add' },
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_1',
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
  lifecycleSequences: { start: [{ $sequence: 'checkCondition_2' }] },
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
      readBuffStackCount_2: {
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
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'BuffStack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      modifyActionValue_6: {
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
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_4' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_6',
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0013_aglina_ultimate_spell_vulnerable',
                copiedBlackboardAssignments: { rate: 'FinalRate' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FinalRate',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'applyBuff_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'BuffStack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'modifyActionValue_9',
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'BuffStack',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_10',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'ifElse_7' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_11',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'readBuffStackCount_2' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'BuffStack',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'ifElse_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FinalRate',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_14',
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_slow',
                blackboardAssignments: {
                  duration: { kind: 'constant', value: -1 },
                  rate: { kind: 'valueNode', nodeId: 'data_9' },
                },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
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
    icon: 'endaxis:icons/icon_battle_buff_def_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: ['Status/PauseAirborne'],
  extendTags: [],
  blackboard: {
    BuffStack: 0,
    FinalRate: 0,
    move_speed_scalar: 0,
    potential2: 0,
    spell_vulnerable_perstack: 0,
    spell_vulnerable_rate: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'modifyActionValue_15' }, { $sequence: 'applyBuff_16' }],
  },
  actionGraph: gilbertaBuff5ActionGraph,
};

const gilbertaBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_spell',
                blackboardAssignments: {
                  duration: { kind: 'constant', value: -1 },
                  rate: { kind: 'valueNode', nodeId: 'data_1' },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: gilbertaBuff6ActionGraph,
};

export const gilberta: OperatorDefinition = {
  slug: 'gilberta',
  gameId: 'GILBERTA',
  rarity: 6,
  weaponType: 'funnel',
  element: 'nature',
  characterTypeId: 'Natural',
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
      operationType: 'basicAttack',
      skills: [
        gilbertaChr_0013_aglina_attack1,
        gilbertaChr_0013_aglina_attack2,
        gilbertaChr_0013_aglina_attack3,
        gilbertaChr_0013_aglina_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: gilbertaChr_0013_aglina_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: gilbertaChr_0013_aglina_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: gilbertaChr_0013_aglina_normal_skill,
    },
    { key: 'ultimate', operationType: 'ultimate', skills: gilbertaChr_0013_aglina_ultimate_skill },
    { key: 'comboSkill', operationType: 'comboSkill', skills: gilbertaChr_0013_aglina_combo_skill },
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
          skillKey: 'chr_0013_aglina_normal_skill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_normal_skill',
          blackboardKey: 'heal_const',
          operation: 'assign',
          value: [72, 108],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_combo_skill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_combo_skill',
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
          skillKey: 'chr_0013_aglina_normal_skill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_normal_skill',
          blackboardKey: 'radiusadd_display',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_normal_skill',
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
          skillKey: 'chr_0013_aglina_ultimate_skill',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_ultimate_skill',
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
          skillKey: 'chr_0013_aglina_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0013_aglina_combo_skill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0013_aglina_combo_skill',
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
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        skillId: 'chr_0013_aglina_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 93,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [
          { startFrame: 0, endFrame: 93, sequence: { $sequence: 'repeatEachTick_2' } },
          { startFrame: 0, endFrame: 93, sequence: { $sequence: 'applyBuff_3' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              repeatEachTick_2: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      catchUpMissedTicks: false,
                      target: { kind: 'fixed', target: 'enemy' },
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
              applyBuff_3: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0013_aglina_normal_skill_monitor' }],
                    targets: { kind: 'owner' },
                    source: { kind: 'source' },
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
      },
    },
    abilityentity_chr_0013_aglina_ultimate_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
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
          FinalRate: 0,
          move_speed_scalar: 1,
          potential2: 0,
          spell_vulnerable_perstack: 0,
          spell_vulnerable_rate: 0,
        },
        scheduledSequences: [{ startFrame: 0, endFrame: 180, sequence: { $sequence: 'aura_1' } }],
        actionGraph: {
          main: {
            nodes: {
              aura_1: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [
                      {
                        buffId: 'buff_chr_0013_aglina_ultimate_skill',
                        blackboardAssignments: {
                          FinalRate: { kind: 'valueNode', nodeId: 'data_1' },
                          spell_vulnerable_rate: { kind: 'valueNode', nodeId: 'data_2' },
                          potential2: { kind: 'valueNode', nodeId: 'data_3' },
                          BuffStack: { kind: 'valueNode', nodeId: 'data_4' },
                          spell_vulnerable_perstack: { kind: 'valueNode', nodeId: 'data_5' },
                          move_speed_scalar: { kind: 'valueNode', nodeId: 'data_6' },
                        },
                        stringBlackboardAssignments: {},
                      },
                    ],
                  },
                  onEnter: { $sequence: null },
                  onExit: { $sequence: null },
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
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default gilberta;
