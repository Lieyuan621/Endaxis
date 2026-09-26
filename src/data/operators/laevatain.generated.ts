/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const laevatainChr_0016_laevat_attack1ActionGraph = {
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
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack1: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_attack1ActionGraph,
  key: 'chr_0016_laevat_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 120,
  exclusiveFrame: 16,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 33, skillIds: ['chr_0016_laevat_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 10, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const laevatainChr_0016_laevat_attack2ActionGraph = {
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
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      startTimeDilation_5: {
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: 'conditional_6',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_7',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack2: SkillDefinition = {
  key: 'chr_0016_laevat_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.5, 0.54],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 140,
  exclusiveFrame: 25,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 37,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 38, skillIds: ['chr_0016_laevat_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 13, endFrame: 16, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 16, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack2ActionGraph,
};

export const laevatainChr_0016_laevat_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack4'] },
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

export const laevatainChr_0016_laevat_attack3: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_attack3ActionGraph,
  key: 'chr_0016_laevat_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 105,
  exclusiveFrame: 22,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 32, skillIds: ['chr_0016_laevat_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const laevatainChr_0016_laevat_attack4ActionGraph = {
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
                skillId: 'chr_0016_laevat_attack_5_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0 },
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
      changeResourceByActionValue_5: {
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_5' },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_8',
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack5'] },
        },
        next: null,
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

export const laevatainChr_0016_laevat_attack4: SkillDefinition = {
  key: 'chr_0016_laevat_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
    display_atk_scale: [0.39, 0.43, 0.47, 0.51, 0.55, 0.59, 0.62, 0.66, 0.7, 0.75, 0.81, 0.88],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 121,
  exclusiveFrame: 35,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 5,
        endFrame: 45,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 45, skillIds: ['chr_0016_laevat_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 22, endFrame: 45, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack4ActionGraph,
};

export const laevatainChr_0016_laevat_attack5ActionGraph = {
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
      repeatEachTick_2: {
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
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: 'conditional_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_6',
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_7' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_opt1',
      },
      repeatEachTick_opt3: {
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
          body: { $sequence: 'dealDamage_opt2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack5: SkillDefinition = {
  key: 'chr_0016_laevat_attack5',
  blackboard: {
    atb: 20,
    atk_scale: [0.27, 0.29, 0.32, 0.34, 0.37, 0.4, 0.42, 0.45, 0.48, 0.51, 0.55, 0.6],
    count: 0,
    poise: 18,
    display_atk_scale: [0.53, 0.58, 0.64, 0.69, 0.74, 0.8, 0.85, 0.9, 0.95, 1.02, 1.1, 1.19],
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 145,
  exclusiveFrame: 42,
  offsetRecordFrame: 23,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 4,
        endFrame: 46,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 34, endFrame: 46, skillIds: ['chr_0016_laevat_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'repeatEachTick_2' } },
    { startFrame: 26, endFrame: 30, sequence: { $sequence: 'repeatEachTick_opt3' } },
    { startFrame: 34, endFrame: 46, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack5ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack1ActionGraph = {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_opt1',
      },
      repeatEachTick_opt3: {
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
          body: { $sequence: 'dealDamage_opt2' },
        },
        next: null,
      },
      modifyActionValue_opt4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_opt3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack1: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.65, 0.71, 0.78, 0.84, 0.91, 0.97, 1.04, 1.1, 1.17, 1.25, 1.34, 1.46],
    ratio: 1,
    stopped: 0,
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 155,
  exclusiveFrame: 25,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack2',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 17,
        endFrame: 32,
        skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 17, endFrame: 32, skillIds: ['chr_0016_laevat_ult_attack2'] },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 12, endFrame: 24, sequence: { $sequence: 'modifyActionValue_opt4' } },
    { startFrame: 17, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack2',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack1ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack2ActionGraph = {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped1', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_opt1',
      },
      repeatEachTick_opt3: {
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
          body: { $sequence: 'dealDamage_opt2' },
        },
        next: null,
      },
      modifyActionValue_opt4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_opt3',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped2', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_3',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'modifyActionValue_14' },
        },
        next: null,
      },
      conditional_opt5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_15' },
        },
        next: null,
      },
      dealDamage_opt6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_opt5',
      },
      repeatEachTick_opt7: {
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
          body: { $sequence: 'dealDamage_opt6' },
        },
        next: null,
      },
      reachSkillOperableBoundary_20: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'stopped1', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'stopped2', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_10: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack2: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
    ratio: 1,
    stopped1: 0,
    stopped2: 0,
    display_atk_scale: [0.81, 0.89, 0.97, 1.05, 1.13, 1.22, 1.3, 1.38, 1.46, 1.56, 1.68, 1.82],
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 245,
  exclusiveFrame: 36,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack3',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 27,
        endFrame: 44,
        skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 27, endFrame: 44, skillIds: ['chr_0016_laevat_ult_attack3'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 10, endFrame: 19, sequence: { $sequence: 'modifyActionValue_opt4' } },
    { startFrame: 21, endFrame: 29, sequence: { $sequence: 'repeatEachTick_opt7' } },
    { startFrame: 27, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_20' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack3',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack2ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack3ActionGraph = {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_12: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_opt1',
      },
      applyElementalInfliction_opt3: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'dealDamage_opt2',
      },
      repeatEachTick_opt4: {
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
          body: { $sequence: 'applyElementalInfliction_opt3' },
        },
        next: null,
      },
      modifyActionValue_opt5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_opt4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack3: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [1.15, 1.27, 1.39, 1.5, 1.62, 1.73, 1.85, 1.96, 2.08, 2.22, 2.4, 2.6],
    ratio: 1,
    stopped: 0,
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 180,
  exclusiveFrame: 20,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack4',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 14,
        endFrame: 28,
        skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 14, endFrame: 28, skillIds: ['chr_0016_laevat_ult_attack4'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 9, endFrame: 23, sequence: { $sequence: 'modifyActionValue_opt5' } },
    { startFrame: 14, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack4',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack3ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack4ActionGraph = {
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
      repeatEachTick_2: {
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
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'repeatEachTick_2',
      },
      changeResourceByActionValue_4: {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_4' },
        },
        next: null,
      },
      startTimeDilation_6: {
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
        next: 'conditional_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'modifyActionValue_7' },
        },
        next: null,
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_opt1',
      },
      repeatEachTick_opt3: {
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
          body: { $sequence: 'dealDamage_opt2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack4: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack4',
  blackboard: {
    atb: 22,
    atk_scale: [1.01, 1.11, 1.22, 1.32, 1.42, 1.52, 1.62, 1.72, 1.82, 1.95, 2.1, 2.28],
    hit: 0,
    poise: 24,
    ratio: 1,
    stopped: 0,
    display_atk_scale: [2.03, 2.23, 2.43, 2.63, 2.84, 3.04, 3.24, 3.44, 3.65, 3.9, 4.2, 4.56],
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 181,
  exclusiveFrame: 47,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 68,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 35,
        endFrame: 68,
        skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 35, endFrame: 68, skillIds: ['chr_0016_laevat_ult_attack1'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'modifyActionValue_3' } },
    { startFrame: 26, endFrame: 35, sequence: { $sequence: 'repeatEachTick_opt3' } },
    { startFrame: 35, endFrame: 68, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack1',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack4ActionGraph,
};

export const laevatainChr_0016_laevat_power_attackActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 0 },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'default',
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
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResourceByActionValue_1',
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
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_3',
      },
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.45 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -2.315953,
                  outTangent: -2.315953,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3436488,
                  value: 0.2041256,
                  inTangent: -0.6439322,
                  outTangent: 0.0176236,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8204471,
                  value: 0.3652225,
                  inTangent: 0.4345389,
                  outTangent: 2.729132,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.535323,
                  outTangent: 3.535323,
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
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_5' },
        },
        next: 'startTimeDilation_6',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_7',
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
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_power_attack: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_power_attackActionGraph,
  key: 'chr_0016_laevat_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 42,
  naturalDurationFrames: 141,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 42,
        endFrame: 62,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 42, endFrame: 46, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'applyBuff_10' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const laevatainChr_0016_laevat_plunging_attack_endActionGraph = {
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
            damageType: 'heat',
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

export const laevatainChr_0016_laevat_plunging_attack_end: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_plunging_attack_endActionGraph,
  key: 'chr_0016_laevat_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 145,
  exclusiveFrame: 13,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const laevatainChr_0016_laevat_normal_skillActionGraph = {
  main: {
    nodes: {
      jumpTimeline_1: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 231 } },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_has_max_energy',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0016_laevat_has_max_energy'],
            reason: 'other',
          },
        },
        next: null,
      },
      jumpTimeline_5: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 80,
            condition: { kind: 'conditionNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_4',
      },
      jumpTimeline_6: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 215 } },
        next: null,
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0016_laevat_normal_skill',
            childSkillId: 'chr_0016_laevat_normal_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'ball',
          },
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
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResourceByActionValue_9: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_9' },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_10',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'startTimeDilation_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_8' },
        },
        next: 'dealDamage_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'second_hit',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_fire_fire_burning_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', extra_scaling: 'extra_scaling' },
          },
        },
        next: 'modifyActionValue_14',
      },
      repeatEachTick_16: {
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
          body: { $sequence: 'applyBuff_15' },
        },
        next: null,
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0016_laevat_energy'],
            reason: 'other',
          },
        },
        next: 'repeatEachTick_16',
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'finishBuffsById_17',
      },
      finishCurrentAbilityEntity_19: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      forEachContextTarget_20: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'ball' },
          body: { $sequence: 'finishCurrentAbilityEntity_19' },
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
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 4 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_has_max_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'extra_usp' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
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
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise_extra' } },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
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
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_normal_skill: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_normal_skillActionGraph,
  key: 'chr_0016_laevat_normal_skill',
  blackboard: {
    atb: 0,
    atk_scale: [0.62, 0.68, 0.75, 0.81, 0.87, 0.93, 0.99, 1.06, 1.12, 1.2, 1.29, 1.4],
    atk_scale_2: [0.06, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    atk_scale_3: [3.42, 3.76, 4.1, 4.45, 4.79, 5.13, 5.47, 5.81, 6.16, 6.58, 7.1, 7.7],
    cam_angle: 0,
    cam_duration: 0,
    consumed_fire_count: 0,
    count: 4,
    duration: 5,
    entered: 0,
    extra_scaling: 1,
    extra_usp: 100,
    input_angle: 0,
    level: 1,
    max_consumed_fire_count: 0,
    poise: 10,
    poise_extra: 10,
    ratio: 1,
    second_hit: 0,
    triggered_burning: 0,
  },
  timelineBlockFrames: 118,
  naturalDurationFrames: 282,
  exclusiveFrame: 117,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 214, endFrame: 215, sequence: { $sequence: 'jumpTimeline_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 30, endFrame: 31, sequence: { $sequence: 'jumpTimeline_5' } },
    { startFrame: 37, endFrame: 51, sequence: { $sequence: 'jumpTimeline_6' } },
    { startFrame: 4, endFrame: 7, sequence: { $sequence: 'spawnAbilityEntity_7' } },
    { startFrame: 104, endFrame: 105, sequence: { $sequence: 'modifyActionValue_18' } },
    { startFrame: 105, endFrame: 109, sequence: { $sequence: 'forEachContextTarget_20' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const laevatainChr_0016_laevat_normal_skill_during_ultActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_has_max_energy',
            target: 'caster',
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
      jumpTimeline_3: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 75,
            condition: { kind: 'conditionNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      jumpTimeline_4: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 196 } },
        next: null,
      },
      jumpTimeline_5: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 270 } },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'triggered_burning',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'entered', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'applyBuff_7',
      },
      gainSquadUltimateEnergyFromSkillCost_9: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'modifyActionValue_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_9' },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_10',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'startTimeDilation_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_6' },
        },
        next: 'dealDamage_12',
      },
      repeatEachTick_14: {
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
          body: { $sequence: 'conditional_13' },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'entered', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_17: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'modifyActionValue_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
          whenTrue: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_17' },
        },
        next: null,
      },
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_18',
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_13' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'startTimeDilation_19',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_6' },
        },
        next: 'dealDamage_20',
      },
      repeatEachTick_22: {
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
          body: { $sequence: 'conditional_21' },
        },
        next: null,
      },
      changeResourceByActionValue_23: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_19' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_24: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.65 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
          whenTrue: { $sequence: 'startTimeDilation_24' },
        },
        next: null,
      },
      dealDamage_26: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_22' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_23' },
          },
        },
        next: 'conditional_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_25' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_23' },
        },
        next: 'dealDamage_26',
      },
      modifyActionValue_28: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'second_hit',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_27',
      },
      applyBuff_29: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_fire_fire_burning_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', extra_scaling: 'extra_scaling' },
          },
        },
        next: 'modifyActionValue_28',
      },
      repeatEachTick_30: {
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
          body: { $sequence: 'applyBuff_29' },
        },
        next: null,
      },
      finishBuffsById_31: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0016_laevat_energy'],
            reason: 'other',
          },
        },
        next: 'repeatEachTick_30',
      },
      modifyActionValue_32: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_26' },
          },
        },
        next: 'finishBuffsById_31',
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_pause_ult',
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
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 4 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_has_max_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'entered', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_energy_shard_attached_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'triggered_burning', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_7' },
            { kind: 'conditionNode', nodeId: 'data_9' },
          ],
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'entered', fallback: 0 } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_energy_shard_attached_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_16: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'triggered_burning', fallback: 0 },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_15' },
            { kind: 'conditionNode', nodeId: 'data_17' },
          ],
        },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_20: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_20' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_24: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_24' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_normal_skill_during_ult: SkillDefinition = {
  key: 'chr_0016_laevat_normal_skill_during_ult',
  blackboard: {
    atb: 0,
    atk_scale: [1.47, 1.61, 1.76, 1.91, 2.05, 2.2, 2.35, 2.49, 2.64, 2.82, 3.04, 3.3],
    atk_scale_2: [1.64, 1.81, 1.97, 2.14, 2.3, 2.47, 2.63, 2.79, 2.96, 3.16, 3.41, 3.7],
    atk_scale_3: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9],
    duration: 5,
    entered: 0,
    extra_scaling: 1,
    poise: 10,
    ratio: 1,
    second_hit: 0,
    triggered_burning: 0,
  },
  timelineBlockFrames: 116,
  naturalDurationFrames: 271,
  exclusiveFrame: 115,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 33,
        endFrame: 75,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'jumpTimeline_3' } },
    { startFrame: 39, endFrame: 40, sequence: { $sequence: 'jumpTimeline_4' } },
    { startFrame: 195, endFrame: 196, sequence: { $sequence: 'jumpTimeline_5' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'repeatEachTick_14' } },
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'repeatEachTick_22' } },
    { startFrame: 98, endFrame: 99, sequence: { $sequence: 'modifyActionValue_32' } },
    { startFrame: 0, endFrame: 115, sequence: { $sequence: 'applyBuff_33' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: laevatainChr_0016_laevat_normal_skill_during_ultActionGraph,
};

export const laevatainChr_0016_laevat_ultimate_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_show_weapon',
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_ult_end',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_2: {
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
      findCharacterTeamTargets_3: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
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
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_show_weapon',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_8: {
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ultimate_skill: SkillDefinition = {
  key: 'chr_0016_laevat_ultimate_skill',
  blackboard: { duration: 15 },
  timelineBlockFrames: 74,
  naturalDurationFrames: 245,
  exclusiveFrame: 73,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_2' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_3' } },
    { startFrame: 0, endFrame: 61, sequence: { $sequence: 'hideUi_5' } },
    { startFrame: 0, endFrame: 61, sequence: { $sequence: 'startUltimateTimeDilation_6' } },
    { startFrame: 0, endFrame: 87, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 73, sequence: { $sequence: 'applyBuff_8' } },
  ],
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 300 }],
  enhancementStateBuffId: 'buff_chr_0016_laevat_show_weapon',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: laevatainChr_0016_laevat_ultimate_skillActionGraph,
};

export const laevatainChr_0016_laevat_combo_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [],
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'index', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_start',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { trigger: { kind: 'constant', value: 0.55 } },
            copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_start',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { trigger: { kind: 'constant', value: 0.6 } },
            copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_start',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { trigger: { kind: 'constant', value: 0.65 } },
            copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_start',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { trigger: { kind: 'constant', value: 0.7 } },
            copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_hitstop',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'applyBuff_4' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'applyBuff_5' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'applyBuff_6' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'applyBuff_8' } },
            { value: { kind: 'constant', value: 5 }, sequence: { $sequence: 'applyBuff_8' } },
          ],
        },
        next: 'applyBuff_9',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_3' },
        },
        next: 'switch_10',
      },
      forEachContextTarget_12: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar' },
          body: { $sequence: 'conditional_11' },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_hit_self',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'forEachContextTarget_12',
      },
      forEachContextTarget_14: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar' },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: 'applyBuff_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'mergeContextTargets_1' },
        },
        next: 'forEachContextTarget_14',
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_ult_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
          },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_show_weapon',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
          },
        },
        next: 'applyBuff_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'applyBuff_17' },
        },
        next: null,
      },
      repeatEachTick_19: {
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
          body: { $sequence: 'conditional_18' },
        },
        next: null,
      },
      mergeContextTargets_21: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_26: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'tar',
            sources: [{ kind: 'context', contextKey: 'smart_target' }],
          },
        },
        next: null,
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'count',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'modifyActionValue_22' },
        },
        next: null,
      },
      modifyActionValue_24: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_23',
      },
      forEachContextTarget_25: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'tar' },
          body: { $sequence: 'modifyActionValue_24' },
        },
        next: null,
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_25' },
          whenFalse: { $sequence: 'mergeContextTargets_26' },
        },
        next: null,
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'mergeContextTargets_1' },
          whenFalse: { $sequence: 'mergeContextTargets_21' },
        },
        next: 'conditional_27',
      },
      startTimeDilation_29: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'index' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'index', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'less',
          right: { kind: 'constant', value: 5 },
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
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_ult_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'limit' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'limit', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_8' },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: [
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_combo_skill: SkillDefinition = {
  key: 'chr_0016_laevat_combo_skill',
  blackboard: {
    atk_scale: [2.4, 2.64, 2.88, 3.12, 3.36, 3.6, 3.84, 4.08, 4.32, 4.62, 4.98, 5.4],
    count: 0,
    duration: 10,
    index: 0,
    limit: 5,
    poise: 10,
  },
  timelineBlockFrames: 58,
  naturalDurationFrames: 180,
  exclusiveFrame: 57,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 41,
        endFrame: 85,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 20, endFrame: 56, sequence: { $sequence: 'conditional_15' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'repeatEachTick_19' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'conditional_28' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_29' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 270],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: laevatainChr_0016_laevat_combo_skillActionGraph,
};

export const laevatainCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: laevatainCommon_character_perfect_dodgeActionGraph,
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

const laevatainComboCondition1ActionGraph = {
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
          buffTags: [
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0016_laevat_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: laevatainComboCondition1ActionGraph,
};

const laevatainBuff1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
          callbacks: [],
        },
        next: null,
      },
      finishBuffsByTag_2: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'buffOwner',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'early',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'launchProjectile_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'finishBuffsByTag_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'conditional_3' } },
  actionGraph: laevatainBuff1ActionGraph,
};

const laevatainBuff2ActionGraph = {
  main: {
    nodes: {
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_4' },
          whenFalse: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_usp',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_6' },
          whenFalse: { $sequence: 'conditional_6' },
        },
        next: 'applyBuff_7',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'conditional_8',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0.7,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, poise: 0 },
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_9' } }],
  actionGraph: laevatainBuff2ActionGraph,
};

const laevatainBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
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

const laevatainBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 21, endFrame: 24, sequence: { $sequence: 'applyBuff_1' } }],
  actionGraph: laevatainBuff3ActionGraph,
};

const laevatainBuff4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'startTimeDilation_1' } },
  ],
  actionGraph: laevatainBuff4ActionGraph,
};

const laevatainBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_combo_skill_hit',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { poise: 'poise', atk_scale: 'atk_scale' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, poise: 0, trigger: 1 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'applyBuff_1' } },
  actionGraph: laevatainBuff5ActionGraph,
};

const laevatainBuff6ActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
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
      changeResourceByActionValue_2: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      switch_5: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'changeResourceByActionValue_1' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'changeResourceByActionValue_2' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'changeResourceByActionValue_3' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'changeResourceByActionValue_4' },
            },
          ],
        },
        next: null,
      },
      readBuffStackCount_6: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_combo_skill_usp'] },
          },
        },
        next: 'switch_5',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp_3' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp_4' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, usp_1: 25, usp_2: 5, usp_3: 5, usp_4: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'readBuffStackCount_6' } },
  actionGraph: laevatainBuff6ActionGraph,
};

const laevatainBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy_icon_5',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              ignore_fire_resist: 'ignore_fire_resist',
              ignore_fire_resist_duration: 'ignore_fire_resist_duration',
            },
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_5: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
            desiredKey: 'ignore_fire_resist_duration',
            outputKey: 'ignore_fire_resist_duration',
          },
        },
        next: null,
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
            desiredKey: 'ignore_fire_resist',
            outputKey: 'ignore_fire_resist',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0016_laevat_energy_icon_5'],
            reason: 'other',
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_9: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'finishBuffsById_8',
      },
      withActionBlackboardScope_10: {
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
          body: { $sequence: 'readBuffBlackboard_7' },
        },
        next: null,
      },
      withActionBlackboardScope_11: {
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
          body: { $sequence: 'setCharacterPassiveUiValue_5' },
        },
        next: 'withActionBlackboardScope_10',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      setCharacterPassiveUiValue_opt2: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_4' } },
        },
        next: 'conditional_opt1',
      },
      readBuffStackCount_opt3: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_energy'] },
          },
        },
        next: 'setCharacterPassiveUiValue_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff7: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    count: 0,
    duration: 0,
    ignore: 0,
    ignore_fire_resist: 0,
    ignore_fire_resist_duration: 0,
    max_stack: 4,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'withActionBlackboardScope_11' },
    enhanceChanged: { $sequence: 'readBuffStackCount_opt3' },
    finish: { $sequence: 'setCharacterPassiveUiValue_9' },
  },
  actionGraph: laevatainBuff7ActionGraph,
};

const laevatainBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_ignore_fire_resist',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              ignore_fire_resist_duration: 'ignore_fire_resist_duration',
              ignore_fire_resist: 'ignore_fire_resist',
            },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff8: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 5,
  maxStackCount: 5,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: laevatainBuff8ActionGraph,
};

const laevatainBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 5,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: laevatainBuff9ActionGraph,
};

const laevatainBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'ignore_fire_resist_duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_laevat_potential_1',
    iconPath: '/icons/icon_battle_laevat_potential_1.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      processors: [
        {
          kind: 'instantAttribute',
          targetSide: 'defender',
          attribute: 'FireResistance',
          values: { slot: 'baseAddition', value: { blackboardKey: 'ignore_fire_resist' } },
          attributeTiming: 'runtime',
        },
      ],
    },
  ],
  actionGraph: laevatainBuff10ActionGraph,
};

const laevatainBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_passive_enemy',
            target: 'enemy',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_passive_teammate',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { max_stack: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
      withActionBlackboardScope_3: {
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
          body: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      withActionBlackboardScope_4: {
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
        next: 'withActionBlackboardScope_3',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0, max_stack: 4 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'withActionBlackboardScope_4' } },
  actionGraph: laevatainBuff11ActionGraph,
};

const laevatainBuff12ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff12: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  actionGraph: laevatainBuff12ActionGraph,
};

const laevatainBuff13ActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'fire_inflicted', sources: [] },
        },
        next: null,
      },
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'fire_inflicted',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: null,
      },
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsByTag_25: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_24',
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'finishBuffsByTag_25' },
        },
        next: null,
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_26',
      },
      finishBuffsByTag_28: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_27',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'finishBuffsByTag_28' },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_29',
      },
      finishBuffsByTag_31: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_30',
      },
      conditional_32: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'finishBuffsByTag_31' },
        },
        next: null,
      },
      launchProjectile_33: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
          callbacks: [],
        },
        next: 'conditional_32',
      },
      applyBuff_34: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_33',
      },
      finishBuffsByTag_35: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_34',
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'finishBuffsByTag_35' },
        },
        next: null,
      },
      launchProjectile_20: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
          callbacks: [],
        },
        next: 'conditional_29',
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_20',
      },
      finishBuffsByTag_22: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_21',
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'finishBuffsByTag_22' },
        },
        next: null,
      },
      launchProjectile_10: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
          callbacks: [],
        },
        next: 'conditional_26',
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_10',
      },
      finishBuffsByTag_12: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
          whenTrue: { $sequence: 'finishBuffsByTag_12' },
        },
        next: null,
      },
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
          callbacks: [],
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_energy',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_3',
      },
      finishBuffsByTag_5: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
          },
        },
        next: 'applyBuff_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
          whenTrue: { $sequence: 'finishBuffsByTag_5' },
        },
        next: null,
      },
      switch_37: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_15' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'conditional_6' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'conditional_13' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'conditional_23' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'conditional_36' } },
          ],
        },
        next: null,
      },
      readBuffStackCount_38: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'count',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
        },
        next: 'switch_37',
      },
      forEachContextTarget_39: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'fire_inflicted' },
          body: { $sequence: 'readBuffStackCount_38' },
        },
        next: null,
      },
      modifyActionValue_40: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'distance',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'forEachContextTarget_39',
      },
      conditional_41: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
          whenTrue: { $sequence: 'mergeContextTargets_1' },
          whenFalse: { $sequence: 'mergeContextTargets_2' },
        },
        next: 'modifyActionValue_40',
      },
      applyBuff_42: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_passive_teammate_cd',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_41',
      },
      conditional_43: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
          whenTrue: { $sequence: 'applyBuff_42' },
        },
        next: null,
      },
      conditional_44: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
          whenTrue: { $sequence: 'conditional_43' },
        },
        next: null,
      },
      conditional_45: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
          whenTrue: { $sequence: 'conditional_44' },
        },
        next: null,
      },
      conditional_46: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
          whenTrue: { $sequence: 'conditional_45' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_5' },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_9' },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_11' },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_13' },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0016_laevat_passive_teammate_cd'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_18' },
        },
      },
      data_20: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['powerAttack', 'normalAttackLastCombo'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff13: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, curve_rate: 0, distance: 0, max_stack: 0, speed: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_46' } },
  ],
  actionGraph: laevatainBuff13ActionGraph,
};

const laevatainBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff14: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: laevatainBuff14ActionGraph,
};

const laevatainBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff15: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: laevatainBuff15ActionGraph,
};

const laevatainBuff16ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'curr_duration',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0016_laevat_ring_start_asset'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff16: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { curr_duration: 0, extend_duration: 0, max_duration: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: laevatainBuff16ActionGraph,
};

const laevatainBuff17ActionGraph = {
  main: {
    nodes: {
      changePlayerActionMode_1: {
        action: {
          kind: 'changePlayerActionMode',
          parameters: { modeId: 'ult', lifetime: 'finishByAction' },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0016_laevat_wpn_vfx'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff17: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'changePlayerActionMode_1' },
    finish: { $sequence: 'finishBuffsById_2' },
  },
  actionGraph: laevatainBuff17ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0016_laevat_normal_skill_during_ult',
      revertedSkillKey: 'chr_0016_laevat_normal_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
};

const laevatainBuff18ActionGraph = {
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
      adjustSkillCooldown_2: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'ultimate' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 10 },
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_ult_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_ring_start_asset',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_3',
      },
      setCurrentBuffTimePaused_5: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_5' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_7: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_7' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff18: SkillBuffDefinition = {
  stackingType: 'extend',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 15,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
  applyTags: ['Status/DisableBreakingAttack'],
  extendTags: [],
  blackboard: { duration: 16 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'applyBuff_4' },
    enable: { $sequence: 'restrictUltimateEnergyRecovery_1' },
    finish: { $sequence: 'adjustSkillCooldown_2' },
  },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_8' } },
  ],
  actionGraph: laevatainBuff18ActionGraph,
};

const laevatainBuff19ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0016_laevat_talent_2_1',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              heal_max_hp: 'heal_max_hp',
              duration: 'duration',
              shelter: 'shelter_real',
            },
          },
        },
        next: null,
      },
      setGlobalCooldown_2: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'caster',
            markerId: 'buff_chr_0016_laevat_talent_2_0',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'applyBuff_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'setGlobalCooldown_2' },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'caster',
          markerId: 'buff_chr_0016_laevat_talent_2_0',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_2' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'hp_threshold' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_4' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff19: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 0, duration: 0, heal_max_hp: 0, hp_threshold: 0, shelter: 0, shelter_real: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'conditional_4' } },
  ],
  actionGraph: laevatainBuff19ActionGraph,
};

const laevatainBuff20ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_2' },
              rate: { kind: 'valueNode', nodeId: 'data_3' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_max_hp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff20: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, heal_max_hp: 0, shelter: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' }, trigger: { $sequence: 'heal_1' } },
  actionGraph: laevatainBuff20ActionGraph,
};

const laevatainBuff21ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: [
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      setCurrentBuffTimePaused_2: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_2' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff21: SkillBuffDefinition = {
  stackingType: 'extend',
  priority: 0,
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
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'finishBuffsById_1' } },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: laevatainBuff21ActionGraph,
};

export const laevatain: OperatorDefinition = {
  slug: 'laevatain',
  gameId: 'LAEVATAIN',
  rarity: 6,
  weaponType: 'sword',
  element: 'heat',
  role: 'striker',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 36, 60, 85, 109, 121],
    agility: [9, 28, 49, 69, 89, 99],
    intellect: [22, 55, 90, 125, 160, 177],
    will: [9, 26, 44, 62, 80, 89],
    baseAttack: [30, 91, 156, 221, 285, 318],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'laevatainCounter', maximum: 4, activeAt: 4 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        laevatainChr_0016_laevat_attack1,
        laevatainChr_0016_laevat_attack2,
        laevatainChr_0016_laevat_attack3,
        laevatainChr_0016_laevat_attack4,
        laevatainChr_0016_laevat_attack5,
      ],
      variants: [
        {
          key: 'enhancedBasicAttack',
          levelSource: 'ultimate',
          libraryNameQualifier: 'enhanced',
          skills: [
            laevatainChr_0016_laevat_ult_attack1,
            laevatainChr_0016_laevat_ult_attack2,
            laevatainChr_0016_laevat_ult_attack3,
            laevatainChr_0016_laevat_ult_attack4,
          ],
        },
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: laevatainChr_0016_laevat_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: laevatainChr_0016_laevat_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: laevatainChr_0016_laevat_normal_skill,
      replacementSkills: [laevatainChr_0016_laevat_normal_skill_during_ult],
      replacementSkillPlacements: { chr_0016_laevat_normal_skill_during_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0016_laevat_normal_skill_during_ult: 'enhanced' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: laevatainChr_0016_laevat_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: laevatainChr_0016_laevat_combo_skill,
    },
  ],
  dodgeSkill: laevatainCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0016_laevat_normal_skill',
      replacementSkillKeys: ['chr_0016_laevat_normal_skill_during_ult'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0016_laevat_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0016_laevat_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
        'chr_0016_laevat_plunging_attack_end',
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
        'chr_0016_laevat_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
      ],
      defaultSkillKey: 'chr_0016_laevat_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'ult',
      modeLayer: 'ult',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0016_laevat_ult_attack1' } },
    },
  ],
  comboSkillConditions: [laevatainComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_passive',
          blackboardAssignments: {
            ignore_fire_resist: [-10, -15, -20],
            ignore_fire_resist_duration: 20,
            max_stack: 4,
          },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_talent_2_0',
          blackboardAssignments: {
            cd: 120,
            duration: [4, 8],
            heal_max_hp: 0.05,
            hp_threshold: 0.4,
            shelter: 0.9,
            shelter_real: 0.9,
          },
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
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'normalAttack', value: 0.15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
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
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack1',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack2',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack3',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack4',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_potential_5',
          blackboardAssignments: { extend_duration: 1, max_duration: 7 },
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0016_laevat_absorb_fire_inflict: laevatainBuff1,
    buff_chr_0016_laevat_combo_skill_hit: laevatainBuff2,
    buff_chr_0016_laevat_combo_skill_hit_self: laevatainBuff3,
    buff_chr_0016_laevat_combo_skill_hitstop: laevatainBuff4,
    buff_chr_0016_laevat_combo_skill_start: laevatainBuff5,
    buff_chr_0016_laevat_combo_skill_usp: laevatainBuff6,
    buff_chr_0016_laevat_energy: laevatainBuff7,
    buff_chr_0016_laevat_energy_icon_5: laevatainBuff8,
    buff_chr_0016_laevat_has_max_energy: laevatainBuff9,
    buff_chr_0016_laevat_ignore_fire_resist: laevatainBuff10,
    buff_chr_0016_laevat_passive: laevatainBuff11,
    buff_chr_0016_laevat_passive_enemy: laevatainBuff12,
    buff_chr_0016_laevat_passive_teammate: laevatainBuff13,
    buff_chr_0016_laevat_passive_teammate_cd: laevatainBuff14,
    buff_chr_0016_laevat_pause_ult: laevatainBuff15,
    buff_chr_0016_laevat_potential_5: laevatainBuff16,
    buff_chr_0016_laevat_ring_start_asset: laevatainBuff17,
    buff_chr_0016_laevat_show_weapon: laevatainBuff18,
    buff_chr_0016_laevat_talent_2_0: laevatainBuff19,
    buff_chr_0016_laevat_talent_2_1: laevatainBuff20,
    buff_chr_0016_laevat_ult_end: laevatainBuff21,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0016_laevat_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0016_laevat_normal_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 100,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 3, atk_scale_2: 0, atk_scale_3: 0, hit_count: 0, poise: 0 },
        scheduledSequences: [
          { startFrame: 18, endFrame: 18, sequence: { $sequence: 'forEachContextTarget_opt1' } },
          { startFrame: 25, endFrame: 25, sequence: { $sequence: 'dealDamage_opt2' } },
          { startFrame: 29, endFrame: 29, sequence: { $sequence: 'dealDamage_opt3' } },
          { startFrame: 33, endFrame: 33, sequence: { $sequence: 'dealDamage_opt4' } },
          { startFrame: 37, endFrame: 37, sequence: { $sequence: 'dealDamage_opt5' } },
          { startFrame: 41, endFrame: 41, sequence: { $sequence: 'dealDamage_opt6' } },
          { startFrame: 45, endFrame: 45, sequence: { $sequence: 'dealDamage_opt7' } },
          { startFrame: 50, endFrame: 50, sequence: { $sequence: 'dealDamage_opt8' } },
          { startFrame: 54, endFrame: 54, sequence: { $sequence: 'dealDamage_opt9' } },
          { startFrame: 58, endFrame: 58, sequence: { $sequence: 'dealDamage_opt10' } },
          { startFrame: 62, endFrame: 62, sequence: { $sequence: 'dealDamage_opt11' } },
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
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              modifyActionValue_2: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              gainSquadUltimateEnergyFromSkillCost_3: {
                action: {
                  kind: 'gainSquadUltimateEnergyFromSkillCost',
                  parameters: { coefficient: 1 },
                },
                next: 'modifyActionValue_2',
              },
              applyBuff_4: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'gainSquadUltimateEnergyFromSkillCost_3',
              },
              forEachContextTarget_opt1: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { target: 'enemy' },
                  body: { $sequence: 'dealDamage_1' },
                },
                next: 'applyBuff_4',
              },
              applyBuff_7: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              applyBuff_8: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_7',
              },
              modifyActionValue_9: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: 'applyBuff_8',
              },
              conditional_10: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                  whenTrue: { $sequence: 'modifyActionValue_9' },
                },
                next: null,
              },
              dealDamage_opt2: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_12/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt3: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_6' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_18/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_24/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_30/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_9' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_36/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt7: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_42/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt8: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_11' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_48/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt9: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_12' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_54/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt10: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_13' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_60/action',
                },
                next: 'conditional_10',
              },
              dealDamage_opt11: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_14' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_66/action',
                },
                next: 'conditional_10',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
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
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
            },
          },
          macros: {},
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default laevatain;
