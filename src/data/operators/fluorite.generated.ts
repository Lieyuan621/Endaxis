/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const fluoriteChr_0022_bounda_attack1ActionGraph = {
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
                skillId: 'chr_0022_bounda_attack1_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
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
          parameters: { skillIds: ['chr_0022_bounda_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_attack1: SkillDefinition = {
  key: 'chr_0022_bounda_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 132,
  exclusiveFrame: 25,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 10,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 40, skillIds: ['chr_0022_bounda_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 22, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0022_bounda_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: fluoriteChr_0022_bounda_attack1ActionGraph,
};

export const fluoriteChr_0022_bounda_attack2ActionGraph = {
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
                skillId: 'chr_0022_bounda_attack2_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
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
          parameters: { skillIds: ['chr_0022_bounda_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_attack2: SkillDefinition = {
  key: 'chr_0022_bounda_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73],
    display_atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73],
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 106,
  exclusiveFrame: 20,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 10,
        endFrame: 36,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 36, skillIds: ['chr_0022_bounda_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 15, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0022_bounda_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: fluoriteChr_0022_bounda_attack2ActionGraph,
};

export const fluoriteChr_0022_bounda_attack3ActionGraph = {
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
                skillId: 'chr_0022_bounda_attack3_projhit',
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
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0022_bounda_attack4'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0022_bounda_attack4_1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_attack3: SkillDefinition = {
  key: 'chr_0022_bounda_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.26, 0.28, 0.31, 0.33, 0.36, 0.38, 0.41, 0.43, 0.46, 0.49, 0.53, 0.57],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 137,
  exclusiveFrame: 25,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 10,
        endFrame: 24,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack4',
      },
      {
        startFrame: 24,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack4_1',
      },
    ],
    allowedNextSkills: [
      { startFrame: 18, endFrame: 24, skillIds: ['chr_0022_bounda_attack4'] },
      { startFrame: 24, endFrame: 30, skillIds: ['chr_0022_bounda_attack4_1'] },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 18, endFrame: 24, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
    { startFrame: 24, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0022_bounda_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: fluoriteChr_0022_bounda_attack3ActionGraph,
};

export const fluoriteChr_0022_bounda_attack4ActionGraph = {
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
                skillId: 'chr_0022_bounda_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, attack_poise: 20 },
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
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                            staggerOnlyWhenCasterControlled: true,
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
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'attack_poise' },
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0022_bounda_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_attack4: SkillDefinition = {
  key: 'chr_0022_bounda_attack4',
  blackboard: {
    atb: 15,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    attack_poise: 15,
    display_atk_scale: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
  },
  timelineBlockFrames: 56,
  naturalDurationFrames: 153,
  exclusiveFrame: 55,
  offsetRecordFrame: 29,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 29,
        endFrame: 71,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 52, endFrame: 71, skillIds: ['chr_0022_bounda_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 26, endFrame: 29, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 52, endFrame: 71, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: fluoriteChr_0022_bounda_attack4ActionGraph,
};

export const fluoriteChr_0022_bounda_attack4_1ActionGraph = {
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
                skillId: 'chr_0022_bounda_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, attack_poise: 20 },
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
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                            staggerOnlyWhenCasterControlled: true,
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
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'attack_poise' },
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0022_bounda_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_attack4_1: SkillDefinition = {
  key: 'chr_0022_bounda_attack4_1',
  blackboard: {
    atb: 15,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    attack_poise: 15,
    display_atk_scale: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
  },
  timelineBlockFrames: 49,
  naturalDurationFrames: 150,
  exclusiveFrame: 52,
  offsetRecordFrame: 26,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 10,
        endFrame: 70,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 49, endFrame: 70, skillIds: ['chr_0022_bounda_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 26, endFrame: 27, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 49, endFrame: 70, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0022_bounda_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: fluoriteChr_0022_bounda_attack4_1ActionGraph,
};

export const fluoriteChr_0022_bounda_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_1: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_2: {
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
        next: 'gainFinisherSp_1',
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      applyBuff_7: {
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
      applyBuff_8: {
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
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_power_attack: SkillDefinition = {
  actionGraph: fluoriteChr_0022_bounda_power_attackActionGraph,
  key: 'chr_0022_bounda_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 22,
  naturalDurationFrames: 127,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 22,
        endFrame: 45,
        skillIds: ['chr_0022_bounda_normal_skill', 'chr_0022_bounda_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 18, endFrame: 24, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 21, endFrame: 25, sequence: { $sequence: 'conditional_6' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 22, sequence: { $sequence: 'applyBuff_8' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const fluoriteChr_0022_bounda_plunging_attack_endActionGraph = {
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
            spGainSource: 'default',
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

export const fluoriteChr_0022_bounda_plunging_attack_end: SkillDefinition = {
  actionGraph: fluoriteChr_0022_bounda_plunging_attack_endActionGraph,
  key: 'chr_0022_bounda_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 90,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const fluoriteChr_0022_bounda_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 3,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0022_bounda_normal_skill_projhit',
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
                  boom_up: 0,
                  duration: 0,
                  duration_potential: 0,
                  move_speed_scalar: 0,
                  poise: 30,
                  potential_lv: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_2' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_common_affixes_slow',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            blackboardAssignments: {
                              duration: { kind: 'constant', value: 3.1 },
                              rate: { kind: 'valueNode', nodeId: 'data_1' },
                            },
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_2: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0022_bounda_normal_skill',
                            childSkillId: 'chr_0022_bounda_normal_skill_abilityrange',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                          },
                        },
                        next: 'applyBuff_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'move_speed_scalar' },
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
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0022_bounda_normal_skill_onlymark',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'withActionBlackboardScope_3',
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_normal_skill: SkillDefinition = {
  key: 'chr_0022_bounda_normal_skill',
  blackboard: {
    atk_scale: [1.87, 2.06, 2.24, 2.43, 2.62, 2.8, 2.99, 3.18, 3.36, 3.6, 3.88, 4.2],
    boom_up: 0.3,
    cam_angle: 0,
    cam_duration: 0,
    consume_cnt: 0,
    duration: 3,
    duration_potential: 0,
    gained_atb: 0,
    input_angle: 0,
    move_speed_scalar: 0.3,
    poise: 10,
    potential_lv: 0,
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 101,
  exclusiveFrame: 34,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'startTimeDilation_5' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: fluoriteChr_0022_bounda_normal_skillActionGraph,
};

export const fluoriteChr_0022_bounda_ultimate_skillActionGraph = {
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
      applyBuff_2: {
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
      hideUi_3: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_4: {
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
      launchProjectile_5: {
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
                skillId: 'chr_0022_bounda_ultimate_skill_1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale1: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
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
                            tags: ['ultimateSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'applyBuff_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale1' },
                      },
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      launchProjectile_7: {
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
                skillId: 'chr_0022_bounda_ultimate_skill_2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale2: 0, atk_scale3: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
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
                            tags: ['ultimateSkill'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'applyBuff_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale2' },
                      },
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      withActionBlackboardScope_8: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_7' },
        },
        next: null,
      },
      launchProjectile_9: {
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
                skillId: 'chr_0022_bounda_ultimate_skill_3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale3: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
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
                            tags: ['ultimateSkill'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'applyBuff_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale3' },
                      },
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      withActionBlackboardScope_10: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_9' },
        },
        next: null,
      },
      launchProjectile_11: {
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
                skillId: 'chr_0022_bounda_ultimate_skill_4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale4: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_6' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyElementalInfliction_1: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'cryo', isExtra: false },
                        },
                        next: null,
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyElementalInfliction_1' },
                        },
                        next: null,
                      },
                      applyElementalInfliction_2: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'nature', isExtra: false },
                        },
                        next: null,
                      },
                      applyBuff_4: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['ultimateSkill'],
                            stagger: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'applyBuff_4',
                      },
                      conditional_6: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyElementalInfliction_2' },
                          whenFalse: { $sequence: 'conditional_3' },
                        },
                        next: 'dealDamage_5',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 2 },
                        },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale4' },
                      },
                      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 2 },
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
      withActionBlackboardScope_12: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_11' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_ultimate_skill: SkillDefinition = {
  key: 'chr_0022_bounda_ultimate_skill',
  blackboard: {
    atk_scale1: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale2: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale3: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale4: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    poise: 5,
  },
  timelineBlockFrames: 77,
  naturalDurationFrames: 120,
  exclusiveFrame: 90,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 68,
        endFrame: 94,
        input: 'basicAttack',
        targetSkillId: 'chr_0022_bounda_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 77,
        endFrame: 94,
        skillIds: [
          'chr_0022_bounda_attack1',
          'chr_0022_bounda_normal_skill',
          'chr_0022_bounda_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'startUltimateTimeDilation_4' } },
    { startFrame: 59, endFrame: 60, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 63, endFrame: 64, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 67, endFrame: 68, sequence: { $sequence: 'withActionBlackboardScope_10' } },
    { startFrame: 72, endFrame: 73, sequence: { $sequence: 'withActionBlackboardScope_12' } },
  ],
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: fluoriteChr_0022_bounda_ultimate_skillActionGraph,
};

export const fluoriteChr_0022_bounda_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyElementalInfliction_2: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_3: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: null,
      },
      changeResourceByActionValue_4: {
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
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'changeResourceByActionValue_4',
      },
      switch_6: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_4' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'applyElementalInfliction_2' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'applyElementalInfliction_3' },
            },
          ],
        },
        next: 'dealDamage_5',
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.33 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'bounda_power_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.533 },
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
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'startTimeDilation_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_index' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteChr_0022_bounda_combo_skill: SkillDefinition = {
  key: 'chr_0022_bounda_combo_skill',
  blackboard: {
    atk_scale: [1.69, 1.86, 2.03, 2.2, 2.37, 2.54, 2.7, 2.87, 3.04, 3.25, 3.51, 3.8],
    poise: 10,
    potential_lv: 0,
    usp: 10,
  },
  timelineBlockFrames: 25,
  naturalDurationFrames: 93,
  exclusiveFrame: 24,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 17, endFrame: 56, skillIds: ['chr_0022_bounda_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'switch_6' } },
    { startFrame: 11, endFrame: 20, sequence: { $sequence: 'startTimeDilation_7' } },
    { startFrame: 16, endFrame: 19, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 0, endFrame: 13, sequence: { $sequence: 'startTimeDilation_11' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1140],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: fluoriteChr_0022_bounda_combo_skillActionGraph,
};

export const fluoriteCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const fluoriteCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: fluoriteCommon_character_perfect_dodgeActionGraph,
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

const fluoritePassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0022_bounda_talent_1',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: { dmg_up: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_up' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoritePassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0022_bounda_talent_1',
  blackboard: { dmg_up: [0.1, 0.2] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: fluoritePassive1ActionGraph,
};

const fluoritePassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0022_bounda_talent_2',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: {
              atk_up: { kind: 'valueNode', nodeId: 'data_1' },
              duration: { kind: 'valueNode', nodeId: 'data_2' },
              probability: { kind: 'valueNode', nodeId: 'data_3' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'probability' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoritePassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0022_bounda_talent_2',
  blackboard: { atk_up: [0.1, 0.2], duration: [10, 10], probability: [0.2, 0.2] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: fluoritePassive2ActionGraph,
};

const fluoriteComboCondition1ActionGraph = {
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
          kind: 'eventInflictionElementIn',
          elements: ['cryo'],
          outputKey: 'EntityBB_combo_index',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0022_bounda_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: fluoriteComboCondition1ActionGraph,
};

const fluoriteComboCondition2ActionGraph = {
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
          kind: 'eventInflictionElementIn',
          elements: ['nature'],
          outputKey: 'EntityBB_combo_index',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0022_bounda_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: fluoriteComboCondition2ActionGraph,
};

const fluoriteBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Status/DisableNormalSkill'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: fluoriteBuff1ActionGraph,
};

const fluoriteBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0022_bounda_potential_5_cd',
            target: 'enemy',
            source: 'buffOwner',
            finishByAction: true,
            blackboardAssignments: {
              CD: { kind: 'valueNode', nodeId: 'data_1' },
              reduce: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'reduce' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 1, dmg_up: 0, reduce: 1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: fluoriteBuff2ActionGraph,
};

const fluoriteBuff3ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'potential',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      adjustSkillCooldown_2: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0022_bounda_combo_skill' },
            operation: 'reduce',
            basis: 'absoluteSeconds',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'createTimedMarker_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'adjustSkillCooldown_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'reduce' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo', 'nature'] },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'potential' },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_4' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 0, dmg_up: 0, reduce: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeInfliction', priority: 0, sequence: { $sequence: 'conditional_4' } },
  ],
  actionGraph: fluoriteBuff3ActionGraph,
};

const fluoriteBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_up: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: {
        kind: 'entityTagMatch',
        target: 'enemy',
        tagQueryType: 'hasAny',
        tags: ['Skill/Character/Common/Affixes/Slow'],
      },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'normal',
          addition: { blackboardKey: 'dmg_up' },
        },
      ],
    },
  ],
  actionGraph: fluoriteBuff4ActionGraph,
};

const fluoriteBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0022_bounda_talent_2_atkup',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_damage_immune_talent',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.01 } },
          },
        },
        next: 'applyBuff_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'conditional_9' },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_14' },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'conditional_19' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'probability' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_1' } },
      },
      data_3: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
          tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['electric'] },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
          tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
        },
      },
      data_7: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
          tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
        },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['nature'] },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
          tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0.1, duration: 10, probability: 0.2 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_5' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_10' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_15' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_20' } },
  ],
  actionGraph: fluoriteBuff5ActionGraph,
};

const fluoriteBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff6: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
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
  blackboard: { atk_up: 0.1, duration: 10 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: fluoriteBuff6ActionGraph,
};

const fluoriteBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const fluoriteBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.2,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: fluoriteBuff7ActionGraph,
};

export const fluorite: OperatorDefinition = {
  slug: 'fluorite',
  gameId: 'FLUORITE',
  rarity: 4,
  weaponType: 'handcannon',
  element: 'nature',
  role: 'caster',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [14, 30, 47, 64, 81, 90],
    agility: [14, 47, 81, 116, 150, 168],
    intellect: [12, 34, 57, 80, 103, 114],
    will: [10, 27, 45, 64, 82, 91],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        fluoriteChr_0022_bounda_attack1,
        fluoriteChr_0022_bounda_attack2,
        fluoriteChr_0022_bounda_attack3,
        fluoriteChr_0022_bounda_attack4,
        fluoriteChr_0022_bounda_attack4_1,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: fluoriteChr_0022_bounda_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: fluoriteChr_0022_bounda_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: fluoriteChr_0022_bounda_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: fluoriteChr_0022_bounda_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: fluoriteChr_0022_bounda_combo_skill,
    },
  ],
  dodgeSkill: fluoriteCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0022_bounda_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0022_bounda_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0022_bounda_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0022_bounda_attack1',
        'chr_0022_bounda_attack2',
        'chr_0022_bounda_attack3',
        'chr_0022_bounda_attack4',
        'chr_0022_bounda_attack4_1',
        'chr_0022_bounda_plunging_attack_end',
        'chr_0022_bounda_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0022_bounda_attack1',
        'chr_0022_bounda_attack2',
        'chr_0022_bounda_attack3',
        'chr_0022_bounda_attack4',
      ],
      defaultSkillKey: 'chr_0022_bounda_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [fluoriteComboCondition1, fluoriteComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    { levels: 2, passiveSkills: [fluoritePassive1] },
    { levels: 2, passiveSkills: [fluoritePassive2] },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 10 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0022_bounda_talent_2',
          blackboardKey: 'probability',
          operation: 'add',
          value: 0.1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'duration_potential',
          operation: 'assign',
          value: 6,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_lv',
          operation: 'assign',
          value: 3,
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
      attachedBuffs: [
        {
          buffId: 'buff_chr_0022_bounda_potential_5_auro',
          blackboardAssignments: { CD: 1, reduce: 1 },
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_combo_index: 0 },
  buffDefinitions: {
    buff_chr_0022_bounda_normal_skill_onlymark: fluoriteBuff1,
    buff_chr_0022_bounda_potential_5_auro: fluoriteBuff2,
    buff_chr_0022_bounda_potential_5_cd: fluoriteBuff3,
    buff_chr_0022_bounda_talent_1: fluoriteBuff4,
    buff_chr_0022_bounda_talent_2: fluoriteBuff5,
    buff_chr_0022_bounda_talent_2_atkup: fluoriteBuff6,
    buff_chr_0022_bounda_ultimate_skill: fluoriteBuff7,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0022_bounda_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0022_bounda_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 210,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 1,
          boom_up: 0,
          duration: 0,
          duration_potential: 0,
          move_speed_scalar: 0,
          poise: 20,
          potential_lv: 0,
          usp: 5,
        },
        scheduledSequences: [
          { startFrame: 89, endFrame: 90, sequence: { $sequence: 'finishBuffsById_6' } },
          {
            startFrame: 90,
            endFrame: 90,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_7' },
          },
          { startFrame: 149, endFrame: 150, sequence: { $sequence: 'finishBuffsById_13' } },
          {
            startFrame: 150,
            endFrame: 150,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_7' },
          },
          { startFrame: 0, endFrame: 89, sequence: { $sequence: 'jumpTimeline_15' } },
          { startFrame: 0, endFrame: 89, sequence: { $sequence: 'jumpTimeline_16' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              applyBuff_1: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_common_affixes_slow',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      duration: { kind: 'valueNode', nodeId: 'data_1' },
                      rate: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                  },
                },
                next: null,
              },
              gainSquadUltimateEnergyFromSkillCost_2: {
                action: {
                  kind: 'gainSquadUltimateEnergyFromSkillCost',
                  parameters: { coefficient: 1 },
                },
                next: null,
              },
              conditional_3: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'applyBuff_1' },
                },
                next: 'gainSquadUltimateEnergyFromSkillCost_2',
              },
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_6' },
                  },
                  key: 'abilityentity_chr_0022_bounda_normal_skill:chr_0022_bounda_normal_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: 'conditional_3',
              },
              applyElementalInfliction_5: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'nature', isExtra: false },
                },
                next: 'dealDamage_4',
              },
              finishBuffsById_6: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'caster',
                    buffIds: [
                      'buff_chr_0022_bounda_normal_skill_onlymark',
                      'buff_chr_0022_bounda_ultimate_skill',
                    ],
                    reason: 'other',
                  },
                },
                next: 'applyElementalInfliction_5',
              },
              finishActionOwnerAbilityEntity_7: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
              dealDamage_11: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'nature',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    instantDamageScaleModifiers: [
                      {
                        side: 'attacker',
                        zone: 'product',
                        addition: { kind: 'constant', value: 0.3 },
                      },
                    ],
                    stagger: { kind: 'valueNode', nodeId: 'data_8' },
                  },
                  key: 'abilityentity_chr_0022_bounda_normal_skill:chr_0022_bounda_normal_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_11/action',
                },
                next: 'conditional_3',
              },
              applyElementalInfliction_12: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'nature', isExtra: false },
                },
                next: 'dealDamage_11',
              },
              finishBuffsById_13: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'caster',
                    buffIds: [
                      'buff_chr_0022_bounda_normal_skill_onlymark',
                      'buff_chr_0022_bounda_ultimate_skill',
                    ],
                    reason: 'other',
                  },
                },
                next: 'applyElementalInfliction_12',
              },
              jumpTimeline_15: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: {
                    destinationFrame: 89,
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  },
                },
                next: null,
              },
              jumpTimeline_16: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: {
                    destinationFrame: 149,
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                  },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'duration_potential' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'move_speed_scalar' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_lv', fallback: 0 },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_3' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 3 },
                },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'healthCompare',
                  target: 'enemy',
                  valueType: 'ratio',
                  operator: 'lessOrEqual',
                  value: { kind: 'constant', value: 0 },
                },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'enemy',
                  buffIds: ['buff_chr_0022_bounda_ultimate_skill'],
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
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default fluorite;
