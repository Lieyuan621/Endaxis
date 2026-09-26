/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const camilleChr_0033_camille_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.04 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            coefficient: { kind: 'constant', value: 0.5 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0033_camille_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_attack1: SkillDefinition = {
  key: 'chr_0033_camille_attack1',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
    atk_scale_2: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
    display_atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 118,
  exclusiveFrame: 13,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 29,
        input: 'basicAttack',
        targetSkillId: 'chr_0033_camille_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 29, skillIds: ['chr_0033_camille_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 4, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 12, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0033_camille_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack1ActionGraph,
};

export const camilleChr_0033_camille_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.033 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            coefficient: { kind: 'constant', value: 0.5 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0033_camille_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_attack2: SkillDefinition = {
  key: 'chr_0033_camille_attack2',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
    atk_scale_2: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
    display_atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.385, 0.415, 0.45],
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 124,
  exclusiveFrame: 19,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 34,
        input: 'basicAttack',
        targetSkillId: 'chr_0033_camille_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 34, skillIds: ['chr_0033_camille_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 14, endFrame: 16, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 15, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0033_camille_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack2ActionGraph,
};

export const camilleChr_0033_camille_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.04 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            coefficient: { kind: 'constant', value: 0.5 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      repeatEachTick_5: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 4,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0033_camille_attack4'] },
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

export const camilleChr_0033_camille_attack3: SkillDefinition = {
  actionGraph: camilleChr_0033_camille_attack3ActionGraph,
  key: 'chr_0033_camille_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.075, 0.083, 0.09, 0.098, 0.105, 0.113, 0.12, 0.128, 0.135, 0.144, 0.156, 0.169],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 130,
  exclusiveFrame: 19,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0033_camille_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 13, endFrame: 30, skillIds: ['chr_0033_camille_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 22, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 13, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0033_camille_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const camilleChr_0033_camille_attack4ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: { reachAfterTicks: 1, maxDurationSeconds: 0.5, finishOnReach: false },
            recycleDelaySeconds: 1,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0033_camille_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_2: 0.1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 2, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 4, endFrame: 5, sequence: { $sequence: null } },
                  { startFrame: 6, endFrame: 7, sequence: { $sequence: null } },
                  { startFrame: 8, endFrame: 9, sequence: { $sequence: null } },
                  { startFrame: 10, endFrame: 11, sequence: { $sequence: null } },
                  { startFrame: 12, endFrame: 13, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 2, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
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
      changeResourceByActionValue_3: {
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0033_camille_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_attack4: SkillDefinition = {
  key: 'chr_0033_camille_attack4',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.385, 0.415, 0.45],
    atk_scale_2: [0.02, 0.022, 0.024, 0.026, 0.028, 0.03, 0.032, 0.034, 0.036, 0.039, 0.042, 0.045],
    display_atk_scale: [
      0.34, 0.374, 0.408, 0.442, 0.476, 0.51, 0.544, 0.578, 0.612, 0.655, 0.706, 0.765,
    ],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 187,
  exclusiveFrame: 29,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 34,
        input: 'basicAttack',
        targetSkillId: 'chr_0033_camille_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 34, skillIds: ['chr_0033_camille_attack5'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 11, endFrame: 15, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 22, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0033_camille_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack4ActionGraph,
};

export const camilleChr_0033_camille_attack5ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_3',
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/Frozen',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.2,
                  inTangent: 0.6,
                  outTangent: 0.6,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0.8,
                  inTangent: 0.6,
                  outTangent: 0.6,
                  weightedMode: 0,
                  inWeight: 0.333333343,
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

export const camilleChr_0033_camille_attack5: SkillDefinition = {
  actionGraph: camilleChr_0033_camille_attack5ActionGraph,
  key: 'chr_0033_camille_attack5',
  blackboard: {
    atb: 20,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 18,
  },
  timelineBlockFrames: 42,
  naturalDurationFrames: 171,
  exclusiveFrame: 41,
  offsetRecordFrame: 21,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 21, endFrame: 23, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'startTimeDilation_5' } },
  ],
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const camilleChr_0033_camille_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_1: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/VisualAdjust',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1.5,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1.5,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy'],
          },
        },
        next: 'gainFinisherSp_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.65,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_3',
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: { reachAfterTicks: 2, maxDurationSeconds: 5, finishOnReach: false },
            recycleDelaySeconds: 0.100000001490116,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0033_camille_power_attack_projhit_witheff',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0.1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 0, endFrame: 89, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            calculation: 'breakingAttack',
                            calculationMultiplier: 0.05,
                            tags: ['normalAttack', 'powerAttack'],
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
            finish: { reachAfterTicks: 2, maxDurationSeconds: 5, finishOnReach: false },
            recycleDelaySeconds: 0.100000001490116,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0033_camille_power_attack_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
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
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            calculation: 'breakingAttack',
                            calculationMultiplier: 0.05,
                            tags: ['normalAttack', 'powerAttack'],
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
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/VisualAdjust',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2,
                  outTangent: 2,
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
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_19' },
        },
        next: null,
      },
      startTimeDilation_21: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/VisualAdjust',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2,
                  outTangent: 2,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: [],
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_21' },
        },
        next: null,
      },
      applyBuff_23: {
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
      applyBuff_24: {
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_power_attack: SkillDefinition = {
  key: 'chr_0033_camille_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 39,
  naturalDurationFrames: 230,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 39,
        endFrame: 46,
        skillIds: [
          'chr_0033_camille_normal_skill',
          'chr_0033_camille_normal_skill_2',
          'chr_0033_camille_combo_skill',
        ],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 43, endFrame: 44, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 40, endFrame: 43, sequence: { $sequence: 'conditional_20' } },
    { startFrame: 46, endFrame: 50, sequence: { $sequence: 'conditional_22' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_23' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'applyBuff_24' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: camilleChr_0033_camille_power_attackActionGraph,
};

export const camilleChr_0033_camille_plunging_attack_endActionGraph = {
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
            damageType: 'heat',
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

export const camilleChr_0033_camille_plunging_attack_end: SkillDefinition = {
  actionGraph: camilleChr_0033_camille_plunging_attack_endActionGraph,
  key: 'chr_0033_camille_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 149,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 3, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const camilleChr_0033_camille_normal_skillActionGraph = {
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
            finish: { reachAfterTicks: 1, maxDurationSeconds: 5, finishOnReach: false },
            recycleDelaySeconds: 2.96666669845581,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0033_camille_normal_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 89,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 0.1,
                  bat_atk_scale: 0.1,
                  bat_duration: 30,
                  poise: 10,
                  vulnerable_scale: 0,
                  weak_scale: 0.1,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_6' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
                            target: 'currentAbilityEntity',
                            inheritSourceSkillCastInfo: true,
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
                      startTimeDilation_3: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.15 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'common' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          },
                        },
                        next: 'gainSquadUltimateEnergyFromSkillCost_2',
                      },
                      forEachContextTarget_4: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'Camille_Bat' },
                          body: { $sequence: 'applyBuff_1' },
                        },
                        next: 'startTimeDilation_3',
                      },
                      modifyActionValue_5: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_bat_spawned',
                            operation: 'assign',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'forEachContextTarget_4',
                      },
                      spawnAbilityEntity_6: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0033_camille_normal_skill',
                            childSkillId: 'chr_0033_camille_normal_skill_abilityrange_first',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                            saveToContextKey: 'Camille_Bat',
                            blackboardAssignments: {
                              EntityBB_bat_duration: { kind: 'valueNode', nodeId: 'data_1' },
                              EntityBB_bat_atk_scale: { kind: 'valueNode', nodeId: 'data_2' },
                              EntityBB_atk_scale: { kind: 'valueNode', nodeId: 'data_3' },
                              EntityBB_poise: { kind: 'valueNode', nodeId: 'data_4' },
                              EntityBB_weak_scale: { kind: 'valueNode', nodeId: 'data_5' },
                              EntityBB_vulnerable_scale: { kind: 'valueNode', nodeId: 'data_6' },
                            },
                          },
                        },
                        next: 'modifyActionValue_5',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'bat_duration' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'bat_atk_scale' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'weak_scale' },
                      },
                      data_6: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'vulnerable_scale' },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_normal_skill: SkillDefinition = {
  key: 'chr_0033_camille_normal_skill',
  blackboard: {
    atb_obtain: 0,
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2],
    bat_atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    bat_duration: 45,
    cam_angle: 0,
    cam_duration: 0,
    input_angle: 0,
    poise: 10,
    vulnerable_scale: [0.05, 0.05, 0.05, 0.055, 0.055, 0.055, 0.06, 0.06, 0.06, 0.065, 0.065, 0.07],
    weak_scale: [0.05, 0.05, 0.05, 0.055, 0.055, 0.055, 0.06, 0.06, 0.06, 0.065, 0.065, 0.07],
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 192,
  exclusiveFrame: 26,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 18, endFrame: 34, skillIds: ['chr_0033_camille_combo_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'withActionBlackboardScope_3' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: camilleChr_0033_camille_normal_skillActionGraph,
};

export const camilleChr_0033_camille_normal_skill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0033_camille_ult_henshin_state'],
            reason: 'early',
          },
        },
        next: null,
      },
      startTimeDilation_2: {
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
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 100,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
          },
        },
        next: null,
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_5',
      },
      repeatEachTick_7: {
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
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      changeResourceByActionValue_8: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_9' },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'conditional_10',
      },
      once_12: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope1' },
          body: { $sequence: 'changeResourceByActionValue_8' },
        },
        next: 'dealDamage_11',
      },
      repeatEachTick_13: {
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
          body: { $sequence: 'once_12' },
        },
        next: null,
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_10',
      },
      repeatEachTick_17: {
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
          body: { $sequence: 'dealDamage_16' },
        },
        next: null,
      },
      createGlobalBuff_18: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_combo_trigger',
            definition: {
              stackingType: 'stack',
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              blackboard: { duration: 0, imbue_scale: 0 },
              children: [
                {
                  buffId: 'buff_common_affixes_combo_trigger',
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_8' } },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'valueNode', nodeId: 'data_9' } },
          },
        },
        next: null,
      },
      once_19: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope2' },
          body: { $sequence: 'createGlobalBuff_18' },
        },
        next: null,
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_21: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'Camille_Bat' },
          body: { $sequence: 'applyBuff_20' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_22: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
          },
        },
        next: 'forEachContextTarget_21',
      },
      changeResourceByActionValue_23: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_24: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'caster',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_11' },
            addition: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: null,
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'usp_gained',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResourceByActionValue_26: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'modifyActionValue_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_26' },
        },
        next: null,
      },
      startTimeDilation_28: {
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
                  time: -0.000869751,
                  value: 0.2992066,
                  inTangent: 0.02832832,
                  outTangent: 0.02832832,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.332526,
                  outTangent: 2.332526,
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
        next: 'conditional_27',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_24' },
        },
        next: 'startTimeDilation_28',
      },
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_18' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: 'conditional_29',
      },
      once_31: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope3' },
          body: { $sequence: 'changeResourceByActionValue_23' },
        },
        next: 'dealDamage_30',
      },
      conditional_32: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_22' },
        },
        next: 'once_31',
      },
      conditional_33: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'once_19' },
        },
        next: 'conditional_32',
      },
      repeatEachTick_34: {
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
          body: { $sequence: 'conditional_33' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_3' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'combo_duration' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ex' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_14: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'usp_gained', fallback: 0 },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_14' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_4' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'poise_2' } },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_21' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_normal_skill_2: SkillDefinition = {
  key: 'chr_0033_camille_normal_skill_2',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atk_scale_1_1: 0.1,
    atk_scale_1_2: 0.1,
    atk_scale_1_3: 0.1,
    atk_scale_2_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_4: [1.42, 1.57, 1.71, 1.85, 1.99, 2.14, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    poise_2: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
  timelineBlockFrames: 87,
  naturalDurationFrames: 213,
  exclusiveFrame: 86,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 79,
        endFrame: 127,
        skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'startTimeDilation_2' } },
    { startFrame: 52, endFrame: 67, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'repeatEachTick_13' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'repeatEachTick_17' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'repeatEachTick_34' } },
  ],
  costs: [{ resource: 'sp', value: 40 }],
  cooldownFrames: 90,
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: camilleChr_0033_camille_normal_skill_2ActionGraph,
};

export const camilleChr_0033_camille_combo_skillActionGraph = {
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
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_3',
      },
      repeatEachTick_5: {
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
          body: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_7',
      },
      repeatEachTick_9: {
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
          body: { $sequence: 'dealDamage_8' },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      createGlobalBuff_11: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_combo_trigger',
            definition: {
              stackingType: 'stack',
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              blackboard: { duration: 0, imbue_scale: 0 },
              children: [
                {
                  buffId: 'buff_common_affixes_combo_trigger',
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_5' } },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'valueNode', nodeId: 'data_6' } },
          },
        },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'createGlobalBuff_11' },
        },
        next: null,
      },
      forEachContextTarget_13: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'Camille_Bat' },
          body: { $sequence: 'applyBuff_10' },
        },
        next: 'conditional_12',
      },
      findOwnerSpawnedAbilityEntities_14: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
          },
        },
        next: 'forEachContextTarget_13',
      },
      changeResourceByActionValue_15: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_16: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'caster',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_10' },
            addition: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_16' },
        },
        next: null,
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      modifyActionValue_19: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'usp_gained',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResourceByActionValue_20: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_14' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'modifyActionValue_19',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_20' },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_18' },
        },
        next: 'conditional_21',
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
        },
        next: 'conditional_22',
      },
      dealDamage_24: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_19' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'conditional_23',
      },
      once_25: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'changeResourceByActionValue_15' },
        },
        next: 'dealDamage_24',
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_14' },
        },
        next: 'once_25',
      },
      repeatEachTick_27: {
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
          body: { $sequence: 'conditional_26' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1_1' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1_2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'combo_duration' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_12' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'usp_gained', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_17: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1_3' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_combo_skill: SkillDefinition = {
  actionGraph: camilleChr_0033_camille_combo_skillActionGraph,
  key: 'chr_0033_camille_combo_skill',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: 15,
    atk_scale_1_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_3: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale_2_1: 0.1,
    atk_scale_2_2: 0.1,
    atk_scale_2_3: 0.1,
    atk_scale_2_4: 0.1,
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
  timelineBlockFrames: 64,
  naturalDurationFrames: 191,
  exclusiveFrame: 63,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 51,
        endFrame: 63,
        skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 27, endFrame: 29, sequence: { $sequence: 'repeatEachTick_9' } },
    { startFrame: 47, endFrame: 50, sequence: { $sequence: 'repeatEachTick_27' } },
  ],
  smartTarget: 'enemy',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const camilleChr_0033_camille_combo_skill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0033_camille_ult_henshin_state'],
            reason: 'early',
          },
        },
        next: null,
      },
      startTimeDilation_2: {
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
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 100,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
          },
        },
        next: null,
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_5',
      },
      repeatEachTick_7: {
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
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      changeResourceByActionValue_8: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_9' },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'conditional_10',
      },
      once_12: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope1' },
          body: { $sequence: 'changeResourceByActionValue_8' },
        },
        next: 'dealDamage_11',
      },
      repeatEachTick_13: {
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
          body: { $sequence: 'once_12' },
        },
        next: null,
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_10',
      },
      repeatEachTick_17: {
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
          body: { $sequence: 'dealDamage_16' },
        },
        next: null,
      },
      createGlobalBuff_18: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_combo_trigger',
            definition: {
              stackingType: 'stack',
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              blackboard: { duration: 0, imbue_scale: 0 },
              children: [
                {
                  buffId: 'buff_common_affixes_combo_trigger',
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_8' } },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'valueNode', nodeId: 'data_9' } },
          },
        },
        next: null,
      },
      once_19: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope2' },
          body: { $sequence: 'createGlobalBuff_18' },
        },
        next: null,
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_21: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'Camille_Bat' },
          body: { $sequence: 'applyBuff_20' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_22: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
          },
        },
        next: 'forEachContextTarget_21',
      },
      changeResourceByActionValue_23: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_24: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'caster',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_11' },
            addition: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: null,
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'usp_gained',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResourceByActionValue_26: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'modifyActionValue_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_26' },
        },
        next: null,
      },
      startTimeDilation_28: {
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
                  time: -0.000869751,
                  value: 0.2992066,
                  inTangent: 0.02832832,
                  outTangent: 0.02832832,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.332526,
                  outTangent: 2.332526,
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
        next: 'conditional_27',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'heal_24' },
        },
        next: 'startTimeDilation_28',
      },
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_18' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: 'conditional_29',
      },
      once_31: {
        action: {
          kind: 'once',
          parameters: { scopeKey: '@scope3' },
          body: { $sequence: 'changeResourceByActionValue_23' },
        },
        next: 'dealDamage_30',
      },
      conditional_32: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_22' },
        },
        next: 'once_31',
      },
      conditional_33: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'once_19' },
        },
        next: 'conditional_32',
      },
      repeatEachTick_34: {
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
          body: { $sequence: 'conditional_33' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_3' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'combo_duration' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ex' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_14: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'usp_gained', fallback: 0 },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_14' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2_4' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'poise_2' } },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'talent_0', fallback: 0 } },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_21' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_combo_skill_2: SkillDefinition = {
  key: 'chr_0033_camille_combo_skill_2',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atk_scale_1_1: 0.1,
    atk_scale_1_2: 0.1,
    atk_scale_1_3: 0.1,
    atk_scale_2_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_4: [1.42, 1.57, 1.71, 1.85, 1.99, 2.14, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    poise_2: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
  timelineBlockFrames: 87,
  naturalDurationFrames: 213,
  exclusiveFrame: 86,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 79,
        endFrame: 127,
        skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'startTimeDilation_2' } },
    { startFrame: 52, endFrame: 67, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'repeatEachTick_13' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'repeatEachTick_17' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'repeatEachTick_34' } },
  ],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: camilleChr_0033_camille_combo_skill_2ActionGraph,
};

export const camilleChr_0033_camille_ultimate_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainChar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_1' },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 2.77 },
            slot: 'unassigned',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            ignoredTargets: ['caster'],
          },
        },
        next: null,
      },
      hideUi_4: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
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
              maxCountPerTarget: 7,
              targetTriggerIntervalSeconds: 0.05,
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
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
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
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'dealDamage_7' },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_ult_hit',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      applyElementalInfliction_10: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'applyBuff_9',
      },
      changeResourceByActionValue_11: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_12: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: -0.000869751,
                  value: 0.2992066,
                  inTangent: 0.02832832,
                  outTangent: 0.02832832,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.332526,
                  outTangent: 2.332526,
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
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'startTimeDilation_12',
      },
      once_14: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'changeResourceByActionValue_11' },
        },
        next: 'dealDamage_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyElementalInfliction_10' },
        },
        next: 'once_14',
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'conditional_15' },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_ult_henshin_state',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_18: {
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
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0033_camille_ult_hit'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_ultimate_skill: SkillDefinition = {
  actionGraph: camilleChr_0033_camille_ultimate_skillActionGraph,
  key: 'chr_0033_camille_ultimate_skill',
  blackboard: {
    atb: [32, 32, 32, 32, 32, 32, 32, 32, 36, 36, 36, 40],
    atk_scale_1: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale_2: [0.533, 0.587, 0.64, 0.693, 0.747, 0.8, 0.853, 0.907, 0.96, 1.027, 1.106, 1.2],
    atk_scale_3: [
      0.889, 0.978, 1.067, 1.156, 1.245, 1.334, 1.423, 1.512, 1.601, 1.712, 1.845, 2.001,
    ],
    duration: 15,
    poise: 15,
  },
  timelineBlockFrames: 134,
  naturalDurationFrames: 236,
  exclusiveFrame: 133,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 125,
        endFrame: 150,
        skillIds: [
          'chr_0033_camille_normal_skill',
          'chr_0033_camille_normal_skill_2',
          'chr_0033_camille_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 0, endFrame: 69, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 0, endFrame: 69, sequence: { $sequence: 'hideUi_4' } },
    { startFrame: 75, endFrame: 91, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 104, endFrame: 108, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 120, endFrame: 124, sequence: { $sequence: 'repeatEachTick_16' } },
    { startFrame: 118, endFrame: 119, sequence: { $sequence: 'applyBuff_17' } },
    { startFrame: 0, endFrame: 133, sequence: { $sequence: 'applyBuff_18' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 130 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const camilleCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: camilleCommon_character_perfect_dodgeActionGraph,
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

const camillePassive1ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0033_camille_normal_skill_bat_duration_icon'],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_bat_spawned',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'finishBuffsById_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_combo_2_type',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
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
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBat'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camillePassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0033_camille_passive_listen_normal_skill',
  blackboard: { atb: 15 },
  enableSequence: { $sequence: 'applyBuff_4' },
  actionGraph: camillePassive1ActionGraph,
  abilityEventResponses: [
    { event: 'abilityEntityFinished', priority: 0, sequence: { $sequence: 'conditional_3' } },
  ],
};

const camillePassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_talent1_atkup',
            target: 'partyExceptCaster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up_teammate', duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_talent1_atkup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
          },
        },
        next: 'applyBuff_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_talent1_atkup',
            target: 'partyExceptCaster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up_teammate', duration: 'duration' },
          },
        },
        next: 'conditional_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0033_camille_talent1_atkup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
          },
        },
        next: 'applyBuff_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_up_teammate',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_6',
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'eventOverheal' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventHealTagsMatch',
          match: 'hasAny',
          tags: [
            'Skill/Character/Common/Heal/NormalSkillHeal',
            'Skill/Character/Common/Heal/ComboSkillHeal',
            'Skill/Character/Common/Heal/UltimateSkillHeal',
          ],
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'teammate_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camillePassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0033_camille_passive_talent1',
  blackboard: { atk_up: [0.02, 0.04], duration: [40, 40], teammate_rate: [0.25, 0.25] },
  enableSequence: { $sequence: null },
  actionGraph: camillePassive2ActionGraph,
  abilityEventResponses: [
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'calculateActionValue_7' } },
  ],
};

const camilleComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0033_camille_combo_skill',
  event: 'buffAbsorbed',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: camilleComboCondition1ActionGraph,
};

const camilleComboCondition2ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0033_camille_combo_skill',
  event: 'buffConsumed',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: camilleComboCondition2ActionGraph,
};

const camilleBuff1ActionGraph = {
  main: {
    nodes: {
      castSkillDuringAction_1: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0033_camille_combo_skill_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: { blackboardKey: 'hit_cntmax' },
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'castSkillDuringAction_1' } },
  actionGraph: camilleBuff1ActionGraph,
};

const camilleBuff2ActionGraph = {
  main: {
    nodes: {
      changeNativeSkillType_1: {
        action: {
          kind: 'changeNativeSkillType',
          parameters: {
            targetSkillKey: 'chr_0033_camille_combo_skill_2',
            nativeSkillType: 'comboSkill',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'changeNativeSkillType_1' } },
  actionGraph: camilleBuff2ActionGraph,
};

const camilleBuff3ActionGraph = {
  main: {
    nodes: {
      finishCurrentAbilityEntity_1: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: false }, alwaysNext: true },
          whenTrue: { $sequence: 'finishCurrentAbilityEntity_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'conditional_opt1' } },
  actionGraph: camilleBuff3ActionGraph,
};

const camilleBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 999,
  presentation: {
    visible: true,
    iconId: 'icon_battle_camille_normal_skill_bat',
    iconPath: '/icons/icon_battle_camille_normal_skill_bat.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { bat_duration: 30 },
  attributeModifiers: [],
  actionGraph: camilleBuff4ActionGraph,
};

const camilleBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff5: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: camilleBuff5ActionGraph,
};

const camilleBuff6ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'bat_atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: 0.4,
  applyTags: [],
  extendTags: [],
  blackboard: { bat_atk_scale: 5, combo_duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'dealDamage_1' } },
  actionGraph: camilleBuff6ActionGraph,
};

const camilleBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: camilleBuff7ActionGraph,
};

const camilleBuff8ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_retargeting',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      finishCurrentAbilityEntity_2: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'src',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          },
        },
        next: 'finishCurrentAbilityEntity_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.1, poise: 10, remain_time: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'modifyActionValue_1' },
    finish: { $sequence: 'mergeContextTargets_3' },
  },
  actionGraph: camilleBuff8ActionGraph,
};

const camilleBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_fire',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_3' },
              rate: { kind: 'valueNode', nodeId: 'data_4' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
            },
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'vulnerable_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'weak_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff9: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_camille_normal_skill_bat',
    iconPath: '/icons/icon_battle_camille_normal_skill_bat.webp',
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
  applyTags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
  extendTags: [],
  blackboard: { duration: 60, vulnerable_scale: 0.1, weak_scale: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' } },
  actionGraph: camilleBuff9ActionGraph,
};

const camilleBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff10: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 60 },
  attributeModifiers: [],
  actionGraph: camilleBuff10ActionGraph,
};

const camilleBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_fire_dmg_up',
    iconPath: '/icons/icon_battle_fire_dmg_up.webp',
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
  blackboard: { atk_up: 0, duration: 0, max_stack: 5 },
  attributeModifiers: [
    { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: camilleBuff11ActionGraph,
};

const camilleBuff12ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ult_combo_count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_henshin',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_1',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_henshin',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff12: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_camille_ult_state',
    iconPath: '/icons/icon_battle_camille_ult_state.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: true,
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
  blackboard: { duration: 30 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'modifyActionValue_2' },
    finish: { $sequence: 'modifyActionValue_4' },
  },
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0033_camille_normal_skill_2',
      revertedSkillKey: 'chr_0033_camille_normal_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: camilleBuff12ActionGraph,
};

const camilleBuff13ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff13: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: camilleBuff13ActionGraph,
};

export const camille: OperatorDefinition = {
  slug: 'camille',
  gameId: 'CAMILLE',
  skillDisplayNameKeys: { chr_0033_camille_normal_skill_2: 'skillNames.pursuit' },
  rarity: 6,
  weaponType: 'polearm',
  element: 'heat',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [13, 32, 52, 72, 92, 102],
    agility: [17, 48, 80, 112, 144, 160],
    intellect: [14, 38, 64, 90, 116, 129],
    will: [11, 28, 46, 64, 82, 92],
    baseAttack: [30, 91, 155, 219, 283, 315],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        camilleChr_0033_camille_attack1,
        camilleChr_0033_camille_attack2,
        camilleChr_0033_camille_attack3,
        camilleChr_0033_camille_attack4,
        camilleChr_0033_camille_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: camilleChr_0033_camille_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: camilleChr_0033_camille_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: camilleChr_0033_camille_normal_skill,
      replacementSkillPlacements: { chr_0033_camille_normal_skill_2: 'standard' },
      routedReplacementSkills: [
        {
          skill: camilleChr_0033_camille_normal_skill_2,
          skillType: 'comboSkill',
          levelSource: 'comboSkill',
          executionSkillGroupKey: 'comboSkill',
          executionSkillKey: 'chr_0033_camille_combo_skill_2',
        },
      ],
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: camilleChr_0033_camille_combo_skill,
      replacementSkills: [camilleChr_0033_camille_combo_skill_2],
      replacementSkillPlacements: { chr_0033_camille_combo_skill_2: 'internal' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: camilleChr_0033_camille_ultimate_skill,
    },
  ],
  dodgeSkill: camilleCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0033_camille_normal_skill',
      replacementSkillKeys: ['chr_0033_camille_normal_skill_2'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0033_camille_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0033_camille_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0033_camille_attack1',
        'chr_0033_camille_attack2',
        'chr_0033_camille_attack3',
        'chr_0033_camille_attack4',
        'chr_0033_camille_attack5',
        'chr_0033_camille_plunging_attack_end',
        'chr_0033_camille_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0033_camille_attack1',
        'chr_0033_camille_attack2',
        'chr_0033_camille_attack3',
        'chr_0033_camille_attack4',
        'chr_0033_camille_attack5',
      ],
      defaultSkillKey: 'chr_0033_camille_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [camilleComboCondition1, camilleComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_sub_multi',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'heal_sub_multi',
          operation: 'assign',
          value: [0.15, 0.3],
        },
      ],
    },
    { levels: 2, passiveSkills: [camillePassive2] },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'weak_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'vulnerable_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'bat_duration',
          operation: 'add',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          frames: -60,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_4',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atb_ex',
          operation: 'multiply',
          value: 1.15,
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
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0033_camille_passive_talent1',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.06,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_bat_spawned: 0,
    EntityBB_henshin: 0,
    EntityBB_trigger_count: 0,
    EntityBB_ult_combo_count: 0,
  },
  passiveSkills: [camillePassive1],
  buffDefinitions: {
    buff_chr_0033_camille_cast_combo2: camilleBuff1,
    buff_chr_0033_camille_combo_2_type: camilleBuff2,
    buff_chr_0033_camille_normal_skill_bat_checktarget: camilleBuff3,
    buff_chr_0033_camille_normal_skill_bat_duration_icon: camilleBuff4,
    buff_chr_0033_camille_normal_skill_bateffect: camilleBuff5,
    buff_chr_0033_camille_normal_skill_delay_damage: camilleBuff6,
    buff_chr_0033_camille_normal_skill_listen_target_dead: camilleBuff7,
    buff_chr_0033_camille_normal_skill_reset_target: camilleBuff8,
    buff_chr_0033_camille_normal_skill_weak: camilleBuff9,
    buff_chr_0033_camille_normal_skill_weak_child: camilleBuff10,
    buff_chr_0033_camille_talent1_atkup: camilleBuff11,
    buff_chr_0033_camille_ult_henshin_state: camilleBuff12,
    buff_chr_0033_camille_ult_hit: camilleBuff13,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0033_camille_normal_skill: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0033_camille/NormalSkillBat',
      ],
      blackboard: {
        EntityBB_atk_scale: 0,
        EntityBB_bat_atk_scale: 0,
        EntityBB_bat_duration: 60,
        EntityBB_combo_duration: 0,
        EntityBB_poise: 0,
        EntityBB_retargeting: 0,
        EntityBB_vulnerable_scale: 0,
        EntityBB_weak_scale: 0,
      },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_bat_duration', fallback: 5 },
      },
      maxStackingCount: 1,
      childSkills: {
        chr_0033_camille_normal_skill_abilityrange_first: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
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
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_weak',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                      finishByAction: true,
                      asChildBuff: true,
                      copiedBlackboardAssignments: {
                        weak_scale: 'EntityBB_weak_scale',
                        vulnerable_scale: 'EntityBB_vulnerable_scale',
                        duration: 'EntityBB_bat_duration',
                      },
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead',
                      target: 'enemy',
                      source: 'currentAbilityEntity',
                      inheritSourceSkillCastInfo: true,
                      finishByAction: true,
                      asChildBuff: true,
                    },
                  },
                  next: null,
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_bat_duration_icon',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                      copiedBlackboardAssignments: { bat_duration: 'EntityBB_bat_duration' },
                    },
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'heat',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0033_camille_normal_skill:chr_0033_camille_normal_skill_abilityrange_first|chr_0033_camille_normal_skill_abilityrange:/childSkills/chr_0033_camille_normal_skill_abilityrange_first/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                applyElementalInfliction_6: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'heat', isExtra: false },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_poise' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0033_camille_normal_skill_abilityrange_first',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 2000,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, obtain_count: 0, poise: 10, weak_scale: 0.2 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 36, sequence: { $sequence: 'applyBuff_1' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_2' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_3' } },
            { startFrame: 3, endFrame: 6, sequence: { $sequence: 'applyBuff_4' } },
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'applyElementalInfliction_6' } },
          ],
        },
        chr_0033_camille_normal_skill_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
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
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_weak',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                      finishByAction: true,
                      asChildBuff: true,
                      copiedBlackboardAssignments: {
                        weak_scale: 'EntityBB_weak_scale',
                        vulnerable_scale: 'EntityBB_vulnerable_scale',
                        duration: 'EntityBB_bat_duration',
                      },
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead',
                      target: 'enemy',
                      source: 'currentAbilityEntity',
                      inheritSourceSkillCastInfo: true,
                      finishByAction: true,
                      asChildBuff: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'heat', isExtra: false },
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'heat',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0033_camille_normal_skill:chr_0033_camille_normal_skill_abilityrange_first|chr_0033_camille_normal_skill_abilityrange:/childSkills/chr_0033_camille_normal_skill_abilityrange/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_poise' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0033_camille_normal_skill_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 2000,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, obtain_count: 0, poise: 10, weak_scale: 0.2 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 36, sequence: { $sequence: 'applyBuff_1' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_2' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_3' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyElementalInfliction_4' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
          ],
        },
      },
      passiveSkills: [
        {
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
                mergeContextTargets_2: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: { saveToContextKey: 'tar', sources: [] },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_delay_damage',
                      target: 'enemy',
                      sourceContextKey: 'src',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        bat_atk_scale: 'EntityBB_bat_atk_scale',
                        combo_duration: 'EntityBB_combo_duration',
                      },
                    },
                  },
                  next: null,
                },
                forEachContextTarget_4: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { contextKey: 'tar' },
                    body: { $sequence: 'applyBuff_3' },
                  },
                  next: null,
                },
                mergeContextTargets_5: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'src',
                      sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
                    },
                  },
                  next: 'forEachContextTarget_4',
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                    whenTrue: { $sequence: 'mergeContextTargets_1' },
                    whenFalse: { $sequence: 'mergeContextTargets_2' },
                  },
                  next: 'mergeContextTargets_5',
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                    whenTrue: { $sequence: 'conditional_6' },
                  },
                  next: null,
                },
                conditional_8: {
                  action: {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                    whenTrue: { $sequence: 'conditional_7' },
                  },
                  next: null,
                },
                applyBuff_9: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0033_camille_normal_skill_bat_checktarget',
                      target: 'currentAbilityEntity',
                      source: 'currentAbilityEntity',
                      inheritSourceSkillCastInfo: false,
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'entityTagMatch',
                    target: 'enemy',
                    tagQueryType: 'hasAny',
                    tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
                  },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'currentAbilityEntity',
                    buffIds: ['buff_chr_0033_camille_normal_skill_bateffect'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'eventBuffIdMatch',
                    buffIds: ['buff_chr_0033_camille_normal_skill_bateffect'],
                  },
                },
              },
            },
            macros: {},
          },
          key: 'chr_0033_camille_passive_normal_skill_ability_entity',
          blackboard: { atb: 15 },
          enableSequence: { $sequence: 'applyBuff_9' },
          abilityEventResponses: [
            { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_8' } },
          ],
        },
      ],
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default camille;
