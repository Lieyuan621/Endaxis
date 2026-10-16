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
      startTimeDilation_4: {
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
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_13: {
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
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
    atk_scale_2: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
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
    { startFrame: 4, endFrame: 6, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 12, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0033_camille_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack1ActionGraph,
};

export const camilleChr_0033_camille_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_4: {
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
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_13: {
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
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
    atk_scale_2: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
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
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 14, endFrame: 16, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 15, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0033_camille_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack2ActionGraph,
};

export const camilleChr_0033_camille_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_17: {
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
      changeResource_18: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_17',
      },
      ifElse_19: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_18' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_19',
      },
      repeatEachTick_21: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 4,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_20' },
        },
        next: null,
      },
      reachSkillOperableBoundary_22: {
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
  key: 'chr_0033_camille_attack3',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.075, 0.083, 0.09, 0.098, 0.105, 0.113, 0.12, 0.128, 0.135, 0.144, 0.156, 0.169],
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
    { startFrame: 7, endFrame: 22, sequence: { $sequence: 'repeatEachTick_21' } },
    { startFrame: 13, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_22' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0033_camille_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack3ActionGraph,
};

export const camilleChr_0033_camille_attack4ActionGraph = {
  main: {
    nodes: {
      createSpatialPointTargets_1: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'point', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 2, endFrame: 3, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_8' } },
                  { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_8' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_8: {
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
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_8: {
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
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.385, 0.415, 0.45],
    atk_scale_2: [0.02, 0.022, 0.024, 0.026, 0.028, 0.03, 0.032, 0.034, 0.036, 0.039, 0.042, 0.045],
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'createSpatialPointTargets_1' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'launchProjectile_2' } },
    { startFrame: 11, endFrame: 15, sequence: { $sequence: 'mergeContextTargets_3' } },
    { startFrame: 11, endFrame: 15, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 22, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0033_camille_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack4ActionGraph,
};

export const camilleChr_0033_camille_attack5ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
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
      changeResource_4: {
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
        next: 'startTimeDilation_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
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
        next: 'ifElse_5',
      },
      startTimeDilation_7: {
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
  key: 'chr_0033_camille_attack5',
  element: 'heat',
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
    { startFrame: 21, endFrame: 23, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'startTimeDilation_7' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_attack5ActionGraph,
};

export const camilleChr_0033_camille_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_2: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_3: {
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
        next: 'gainFinisherSp_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
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
        next: 'ifElse_4',
      },
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                blackboard: { atk_scale: 0.1 },
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
      launchProjectile_7: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                blackboard: { atk_scale: 0.1 },
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
      startTimeDilation_14: {
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
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_17: {
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
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_17' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_19: {
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
      applyBuff_20: {
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
  element: 'heat',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
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
    { startFrame: 43, endFrame: 44, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 40, endFrame: 43, sequence: { $sequence: 'ifElse_15' } },
    { startFrame: 46, endFrame: 50, sequence: { $sequence: 'ifElse_18' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_19' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'applyBuff_20' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: camilleChr_0033_camille_power_attackActionGraph,
};

export const camilleChr_0033_camille_plunging_attack_endActionGraph = {
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
            damageType: 'heat',
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

export const camilleChr_0033_camille_plunging_attack_end: SkillDefinition = {
  key: 'chr_0033_camille_plunging_attack_end',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 149,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: camilleChr_0033_camille_plunging_attack_endActionGraph,
};

export const camilleChr_0033_camille_normal_skillActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'checkCondition_6' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
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
                      startTimeDilation_2: {
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
                        next: 'applyBuff_1',
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_bateffect' }],
                            targets: { kind: 'context', key: 'Camille_Bat' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'startTimeDilation_2',
                      },
                      modifyActionValue_4: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_bat_spawned',
                            operation: 'assign',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'applyBuff_3',
                      },
                      spawnAbilityEntity_5: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'fixed', target: 'enemy' },
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
                        next: 'modifyActionValue_4',
                      },
                      checkCondition_6: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                        },
                        next: 'spawnAbilityEntity_5',
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
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: true,
                          operator: 'greaterOrEqual',
                          value: 1,
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_normal_skill: SkillDefinition = {
  key: 'chr_0033_camille_normal_skill',
  element: 'heat',
  blackboard: {
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2],
    bat_atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    bat_duration: 45,
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
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'launchProjectile_1' } },
  ],
  defaultTarget: 'enemy',
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
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
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
      startTimeDilation_16: {
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
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_16' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_17',
      },
      repeatEachTick_19: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_18' },
        },
        next: null,
      },
      changeResource_20: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_22: {
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
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_24: {
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
        next: 'ifElse_23',
      },
      once_25: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_20' } },
        next: 'dealDamage_24',
      },
      repeatEachTick_26: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'once_25' },
        },
        next: null,
      },
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_23',
      },
      repeatEachTick_31: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_30' },
        },
        next: null,
      },
      createGlobalBuff_32: {
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
      once_34: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'createGlobalBuff_32' } },
        next: null,
      },
      applyBuff_36: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_bateffect' }],
            targets: { kind: 'context', key: 'Camille_Bat' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_37: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'applyBuff_36',
      },
      changeResource_38: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_42: {
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
      modifyActionValue_50: {
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
      changeResource_51: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: 'modifyActionValue_50',
      },
      checkCondition_52: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'changeResource_51',
      },
      startTimeDilation_53: {
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
        next: 'checkCondition_52',
      },
      ifElse_54: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'heal_42' },
          whenFalse: { $sequence: null },
        },
        next: 'startTimeDilation_53',
      },
      dealDamage_55: {
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
        next: 'ifElse_54',
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'dealDamage_55' },
          whenFalse: { $sequence: 'dealDamage_55' },
        },
        next: null,
      },
      once_opt2: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_38' } },
        next: 'ifElse_opt1',
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_37' },
          whenFalse: { $sequence: null },
        },
        next: 'once_opt2',
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_22' },
          whenTrue: { $sequence: 'once_34' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_opt3',
      },
      repeatEachTick_opt5: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'ifElse_opt4' },
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
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_22: {
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
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_normal_skill_2: SkillDefinition = {
  key: 'chr_0033_camille_normal_skill_2',
  element: 'heat',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
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
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'repeatEachTick_19' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'repeatEachTick_26' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'repeatEachTick_31' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'repeatEachTick_opt5' } },
  ],
  defaultTarget: 'enemy',
  costs: [],
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
      startTimeDilation_14: {
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
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_15',
      },
      repeatEachTick_17: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
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
      startTimeDilation_19: {
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
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_19' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_20',
      },
      repeatEachTick_22: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_21' },
        },
        next: null,
      },
      createGlobalBuff_24: {
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
      ifElse_26: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'createGlobalBuff_24' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_bateffect' }],
            targets: { kind: 'context', key: 'Camille_Bat' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'ifElse_26',
      },
      findOwnerSpawnedAbilityEntities_28: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'applyBuff_27',
      },
      changeResource_29: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_37: {
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
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'heal_37' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_41: {
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
      modifyActionValue_49: {
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
      changeResource_50: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: 'modifyActionValue_49',
      },
      checkCondition_51: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'changeResource_50',
      },
      ifElse_52: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'startTimeDilation_41' },
          whenFalse: { $sequence: null },
        },
        next: 'checkCondition_51',
      },
      ifElse_53: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'ifElse_39' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_52',
      },
      dealDamage_54: {
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
        next: 'ifElse_53',
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'dealDamage_54' },
          whenFalse: { $sequence: 'dealDamage_54' },
        },
        next: null,
      },
      once_opt2: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_29' } },
        next: 'ifElse_opt1',
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_28' },
          whenFalse: { $sequence: null },
        },
        next: 'once_opt2',
      },
      repeatEachTick_opt4: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'ifElse_opt3' },
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
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
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
      data_16: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1_3' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_20: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
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
  key: 'chr_0033_camille_combo_skill',
  element: 'heat',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atk_scale_1_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_3: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
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
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'repeatEachTick_17' } },
    { startFrame: 27, endFrame: 29, sequence: { $sequence: 'repeatEachTick_22' } },
    { startFrame: 47, endFrame: 50, sequence: { $sequence: 'repeatEachTick_opt4' } },
  ],
  smartTarget: 'enemy',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: camilleChr_0033_camille_combo_skillActionGraph,
};

export const camilleChr_0033_camille_combo_skill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
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
      startTimeDilation_16: {
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
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_16' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_17',
      },
      repeatEachTick_19: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_18' },
        },
        next: null,
      },
      changeResource_20: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_22: {
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
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_24: {
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
        next: 'ifElse_23',
      },
      once_25: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_20' } },
        next: 'dealDamage_24',
      },
      repeatEachTick_26: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'once_25' },
        },
        next: null,
      },
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_23',
      },
      repeatEachTick_31: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_30' },
        },
        next: null,
      },
      createGlobalBuff_32: {
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
      once_34: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'createGlobalBuff_32' } },
        next: null,
      },
      applyBuff_36: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_bateffect' }],
            targets: { kind: 'context', key: 'Camille_Bat' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_37: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'Camille_Bat',
            abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'applyBuff_36',
      },
      changeResource_38: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      heal_42: {
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
      modifyActionValue_50: {
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
      changeResource_51: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: 'modifyActionValue_50',
      },
      checkCondition_52: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'changeResource_51',
      },
      startTimeDilation_53: {
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
        next: 'checkCondition_52',
      },
      ifElse_54: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'heal_42' },
          whenFalse: { $sequence: null },
        },
        next: 'startTimeDilation_53',
      },
      dealDamage_55: {
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
        next: 'ifElse_54',
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'dealDamage_55' },
          whenFalse: { $sequence: 'dealDamage_55' },
        },
        next: null,
      },
      once_opt2: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_38' } },
        next: 'ifElse_opt1',
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_37' },
          whenFalse: { $sequence: null },
        },
        next: 'once_opt2',
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_22' },
          whenTrue: { $sequence: 'once_34' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_opt3',
      },
      repeatEachTick_opt5: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'ifElse_opt4' },
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
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
        },
      },
      data_22: {
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
} as const satisfies ActionGraphResourceDefinition;

export const camilleChr_0033_camille_combo_skill_2: SkillDefinition = {
  key: 'chr_0033_camille_combo_skill_2',
  element: 'heat',
  blackboard: {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
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
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'repeatEachTick_19' } },
    { startFrame: 33, endFrame: 36, sequence: { $sequence: 'repeatEachTick_26' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'repeatEachTick_31' } },
    { startFrame: 70, endFrame: 73, sequence: { $sequence: 'repeatEachTick_opt5' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: camilleChr_0033_camille_combo_skill_2ActionGraph,
};

export const camilleChr_0033_camille_ultimate_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      hideUi_2: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      repeatEachTick_22: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 7,
              targetTriggerIntervalSeconds: 0.05,
            },
          },
          body: { $sequence: 'dealDamage_21' },
        },
        next: null,
      },
      dealDamage_23: {
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
      repeatEachTick_24: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'dealDamage_23' },
        },
        next: null,
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_ult_hit' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      applyElementalInfliction_27: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'applyBuff_26',
      },
      changeResource_28: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_29: {
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
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'startTimeDilation_29',
      },
      once_31: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_28' } },
        next: 'dealDamage_30',
      },
      ifElse_32: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'applyElementalInfliction_27' },
          whenFalse: { $sequence: null },
        },
        next: 'once_31',
      },
      repeatEachTick_33: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'ifElse_32' },
        },
        next: null,
      },
      applyBuff_34: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0033_camille_ult_henshin_state',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_35: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
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
  key: 'chr_0033_camille_ultimate_skill',
  element: 'heat',
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
    { startFrame: 0, endFrame: 69, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 69, sequence: { $sequence: 'hideUi_2' } },
    { startFrame: 75, endFrame: 91, sequence: { $sequence: 'repeatEachTick_22' } },
    { startFrame: 104, endFrame: 108, sequence: { $sequence: 'repeatEachTick_24' } },
    { startFrame: 120, endFrame: 124, sequence: { $sequence: 'repeatEachTick_33' } },
    { startFrame: 118, endFrame: 119, sequence: { $sequence: 'applyBuff_34' } },
    { startFrame: 0, endFrame: 133, sequence: { $sequence: 'applyBuff_35' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 130 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: camilleChr_0033_camille_ultimate_skillActionGraph,
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
  defaultTarget: 'enemy',
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
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'modifyActionValue_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_combo_2_type' }],
            targets: { kind: 'fixed', target: 'caster' },
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
  blackboard: {},
  enableSequence: { $sequence: 'applyBuff_4' },
  abilityEventResponses: [
    { event: 'abilityEntityFinished', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: camillePassive1ActionGraph,
};

const camillePassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0033_camille_talent1_atkup',
                copiedBlackboardAssignments: { atk_up: 'atk_up_teammate', duration: 'duration' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'characterTeam', excludeOwner: true } },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0033_camille_talent1_atkup',
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'forEachContextTarget_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_4',
      },
      forEachContextTarget_6: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'characterTeam', excludeOwner: true } },
          body: { $sequence: 'applyBuff_1' },
        },
        next: 'checkCondition_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0033_camille_talent1_atkup',
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'forEachContextTarget_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_7',
      },
      calculateActionValue_9: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_up_teammate',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'checkCondition_8',
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
  abilityEventResponses: [
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'calculateActionValue_9' } },
  ],
  actionGraph: camillePassive2ActionGraph,
};

const camilleComboCondition1ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
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
  sequence: { $sequence: 'checkCondition_1' },
  actionGraph: camilleComboCondition1ActionGraph,
};

const camilleComboCondition2ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
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
  sequence: { $sequence: 'checkCondition_1' },
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
  lifecycleSequences: { enable: [{ $sequence: 'castSkillDuringAction_1' }] },
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
  lifecycleSequences: { enable: [{ $sequence: 'changeNativeSkillType_1' }] },
  actionGraph: camilleBuff2ActionGraph,
};

const camilleBuff3ActionGraph = {
  main: {
    nodes: {
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
      finishOwner_3: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'finishOwner_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      findTargets_5: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'abilityEntityTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: 'ifElse_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_retargeting', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'tar' },
          containsHittableTarget: false,
          excludeDeadEntity: true,
          operator: 'lessOrEqual',
          value: 0,
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
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
  lifecycleSequences: { trigger: [{ $sequence: 'findTargets_5' }] },
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
    icon: 'endaxis:icons/icon_battle_camille_normal_skill_bat',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    nameKey: 'effects.name.firefangVesperwings',
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
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
  blackboard: { bat_atk_scale: 5 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'dealDamage_1' }] },
  actionGraph: camilleBuff6ActionGraph,
};

const camilleBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_reset_target' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
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
  abilityEventResponses: [
    { event: 'ownerHpZero', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
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
      findTargets_2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'abilityEntityTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'lasttar',
          },
        },
        next: 'modifyActionValue_1',
      },
      finishOwner_7: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_bat_duration',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      readBuffRemainingDuration_5: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'src' },
            query: {
              kind: 'id',
              buffIds: ['buff_chr_0033_camille_normal_skill_bat_duration_icon'],
            },
            outputKey: 'remain_time',
          },
        },
        next: 'modifyActionValue_4',
      },
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 2.96666669845581,
            hit: { onReach: true, finishOnHit: true },
            targets: { kind: 'context', contextKey: 'resettar' },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0033_camille_normal_skill_projhit_sub',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 89,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_4: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_reset_target' }],
                            targets: { kind: 'source' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: null,
                      },
                      modifyActionValue_2: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_retargeting',
                            operation: 'assign',
                            value: { kind: 'constant', value: 0 },
                          },
                        },
                        next: null,
                      },
                      castSkillDuringAction_3: {
                        action: {
                          kind: 'castSkillDuringAction',
                          parameters: {
                            skillId: 'chr_0033_camille_normal_skill_abilityrange',
                            target: 'enemy',
                            skipApplyCost: false,
                            inheritSourceSkillCastInfo: false,
                          },
                        },
                        next: 'modifyActionValue_2',
                      },
                      ifElse_5: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
                          whenTrue: { $sequence: 'castSkillDuringAction_3' },
                          whenFalse: { $sequence: 'applyBuff_4' },
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
                          excludeDeadEntity: true,
                          operator: 'greaterOrEqual',
                          value: 1,
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
        next: 'readBuffRemainingDuration_5',
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'launchProjectile_6' },
          whenFalse: { $sequence: 'finishOwner_7' },
        },
        next: null,
      },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'src',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          },
        },
        next: 'ifElse_8',
      },
      copyContextTargets_10: {
        action: {
          kind: 'copyContextTargets',
          parameters: {
            source: {
              kind: 'enemyByTags',
              tagQueryType: 'exceptAny',
              tags: ['SelectCategory/Unmarkable'],
            },
            excludeTargets: { kind: 'context', key: 'lasttar' },
            saveToContextKey: 'resettar',
          },
        },
        next: 'mergeContextTargets_9',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'remain_time' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'resettar' },
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

const camilleBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { remain_time: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'findTargets_2' }],
    finish: [{ $sequence: 'copyContextTargets_10' }],
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
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_fire',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
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
                buffId: 'buff_common_affixes_weak',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_3' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
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
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'vulnerable_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'weak_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const camilleBuff9: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_camille_normal_skill_bat',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.firefangVesperwings',
  },
  applyTags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
  extendTags: [],
  blackboard: { duration: 60, vulnerable_scale: 0.1, weak_scale: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
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
    icon: 'endaxis:icons/icon_battle_fire_dmg_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
    icon: 'endaxis:icons/icon_battle_camille_ult_state',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 30 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'modifyActionValue_2' }],
    finish: [{ $sequence: 'modifyActionValue_4' }],
  },
  skillSlotReplacements: [
    {
      skillSlotKey: 'battleSkill',
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
  rarity: 6,
  weaponType: 'lance',
  element: 'heat',
  characterTypeId: 'Fire',
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
      operationType: 'basicAttack',
      skills: [
        camilleChr_0033_camille_attack1,
        camilleChr_0033_camille_attack2,
        camilleChr_0033_camille_attack3,
        camilleChr_0033_camille_attack4,
        camilleChr_0033_camille_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: camilleChr_0033_camille_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: camilleChr_0033_camille_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: camilleChr_0033_camille_normal_skill,
    },
    {
      key: 'replacementBattleSkill',
      operationType: 'battleSkill',
      nameKey: 'skillNames.replacement',
      skills: [],
      routedReplacementSkills: [
        {
          skill: camilleChr_0033_camille_normal_skill_2,
          executionSkillKey: 'chr_0033_camille_combo_skill_2',
        },
      ],
    },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
      skills: camilleChr_0033_camille_combo_skill,
      replacementSkills: [camilleChr_0033_camille_combo_skill_2],
      replacementSkillPlacements: { chr_0033_camille_combo_skill_2: 'internal' },
    },
    { key: 'ultimate', operationType: 'ultimate', skills: camilleChr_0033_camille_ultimate_skill },
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
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_sub_multi',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
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
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'weak_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'vulnerable_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
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
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0033_camille_combo_skill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_4',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
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
          skillKey: 'chr_0033_camille_ultimate_skill',
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
      faction: 'good',
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
          skillId: 'chr_0033_camille_normal_skill_abilityrange_first',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 2000,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 36, sequence: { $sequence: 'applyBuff_1' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_2' } },
            { startFrame: 0, endFrame: 2000, sequence: { $sequence: 'applyBuff_3' } },
            { startFrame: 3, endFrame: 6, sequence: { $sequence: 'applyBuff_4' } },
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'applyElementalInfliction_7' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_full_immune' }],
                      targets: { kind: 'owner' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
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
                          buffId: 'buff_chr_0033_camille_normal_skill_weak',
                          copiedBlackboardAssignments: {
                            weak_scale: 'EntityBB_weak_scale',
                            vulnerable_scale: 'EntityBB_vulnerable_scale',
                            duration: 'EntityBB_bat_duration',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                      finishByAction: true,
                      asChildBuff: true,
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'owner' },
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
                      buffs: [
                        {
                          buffId: 'buff_chr_0033_camille_normal_skill_bat_duration_icon',
                          copiedBlackboardAssignments: { bat_duration: 'EntityBB_bat_duration' },
                        },
                      ],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                    },
                  },
                  next: null,
                },
                dealDamage_6: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'heat',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0033_camille_normal_skill:chr_0033_camille_normal_skill_abilityrange_first|chr_0033_camille_normal_skill_abilityrange:/childSkills/chr_0033_camille_normal_skill_abilityrange_first/actionGraph/main/nodes/dealDamage_6/action',
                  },
                  next: null,
                },
                applyElementalInfliction_7: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'heat', isExtra: false },
                  },
                  next: 'dealDamage_6',
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
        },
        chr_0033_camille_normal_skill_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_full_immune' }],
                      targets: { kind: 'owner' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
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
                          buffId: 'buff_chr_0033_camille_normal_skill_weak',
                          copiedBlackboardAssignments: {
                            weak_scale: 'EntityBB_weak_scale',
                            vulnerable_scale: 'EntityBB_vulnerable_scale',
                            duration: 'EntityBB_bat_duration',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                      iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                      finishByAction: true,
                      asChildBuff: true,
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'owner' },
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
                    parameters: {
                      element: 'heat',
                      isExtra: false,
                      target: { kind: 'inputTarget' },
                    },
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: 'actionInputTarget',
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
          blackboard: {},
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
          key: 'chr_0033_camille_passive_normal_skill_ability_entity',
          blackboard: {},
          enableSequence: { $sequence: 'applyBuff_6' },
          abilityEventResponses: [
            { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0033_camille_normal_skill_delay_damage',
                          copiedBlackboardAssignments: {
                            bat_atk_scale: 'EntityBB_bat_atk_scale',
                            combo_duration: 'EntityBB_combo_duration',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar' },
                      source: { kind: 'context', key: 'src' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                mergeContextTargets_2: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'src',
                      sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
                    },
                  },
                  next: 'applyBuff_1',
                },
                findTargets_3: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'enemyByTags',
                        tagQueryType: 'hasAny',
                        tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'mergeContextTargets_2',
                },
                checkCondition_4: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'findTargets_3',
                },
                checkCondition_5: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                  },
                  next: 'checkCondition_4',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0033_camille_normal_skill_bat_checktarget' }],
                      targets: { kind: 'owner' },
                      source: { kind: 'owner' },
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
                    kind: 'buffIdStackCompare',
                    target: 'currentAbilityEntity',
                    buffIds: ['buff_chr_0033_camille_normal_skill_bateffect'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 2 },
                  },
                },
                data_2: {
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
        },
      ],
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default camille;
