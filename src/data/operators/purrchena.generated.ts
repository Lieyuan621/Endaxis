/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const purrchenaChr_0038_purrche_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      once_2: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'startTimeDilation_1' } },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'once_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 0.4 },
          },
        },
        next: 'dealDamage_4',
      },
      repeatEachTick_6: {
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
          body: { $sequence: 'calculateActionValue_5' },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      once_8: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'startTimeDilation_7' } },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'once_8' },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_9',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'constant', value: 0.6 },
          },
        },
        next: 'dealDamage_10',
      },
      repeatEachTick_12: {
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
          body: { $sequence: 'calculateActionValue_11' },
        },
        next: null,
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0038_purrche_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_attack1: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_attack1ActionGraph,
  key: 'chr_0038_purrche_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.48, 0.53, 0.58, 0.62, 0.67, 0.72, 0.77, 0.82, 0.86, 0.92, 1, 1.08],
    atk_scale_1: 0,
    atk_scale_2: 0,
    env_dmg: 15,
  },
  timelineBlockFrames: 23,
  naturalDurationFrames: 130,
  exclusiveFrame: 28,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 42,
        input: 'basicAttack',
        targetSkillId: 'chr_0038_purrche_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 23, endFrame: 42, skillIds: ['chr_0038_purrche_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'repeatEachTick_12' } },
    { startFrame: 23, endFrame: 42, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  timelineContinuationSkillId: 'chr_0038_purrche_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const purrchenaChr_0038_purrche_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstoptime_1',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 0.2 },
          },
        },
        next: 'dealDamage_5',
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
          body: { $sequence: 'calculateActionValue_6' },
        },
        next: null,
      },
      startTimeDilation_8: {
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
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstoptime_2',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'startTimeDilation_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_9' },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_10' },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_11',
      },
      calculateActionValue_13: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'constant', value: 0.3 },
          },
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
          body: { $sequence: 'calculateActionValue_13' },
        },
        next: null,
      },
      startTimeDilation_15: {
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
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstoptime_3',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'startTimeDilation_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_16' },
        },
        next: null,
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
        },
        next: null,
      },
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_14' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_18',
      },
      calculateActionValue_20: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_19',
      },
      repeatEachTick_21: {
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
          body: { $sequence: 'calculateActionValue_20' },
        },
        next: null,
      },
      reachSkillOperableBoundary_22: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0038_purrche_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstoptime_1', fallback: 0 },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstoptime_2', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstoptime_3', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_13: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_attack2: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_attack2ActionGraph,
  key: 'chr_0038_purrche_attack2',
  blackboard: {
    atk_scale: [0.52, 0.57, 0.62, 0.67, 0.72, 0.77, 0.82, 0.88, 0.93, 0.99, 1.07, 1.16],
    atk_scale_1: 0,
    atk_scale_2: 0,
    atk_scale_3: 0,
    hitstoptime_1: 0,
    hitstoptime_2: 0,
    hitstoptime_3: 0,
    atb: 0,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 180,
  exclusiveFrame: 48,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 53,
        input: 'basicAttack',
        targetSkillId: 'chr_0038_purrche_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 46, endFrame: 53, skillIds: ['chr_0038_purrche_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'repeatEachTick_14' } },
    { startFrame: 22, endFrame: 24, sequence: { $sequence: 'repeatEachTick_21' } },
    { startFrame: 46, endFrame: 53, sequence: { $sequence: 'reachSkillOperableBoundary_22' } },
  ],
  timelineContinuationSkillId: 'chr_0038_purrche_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const purrchenaChr_0038_purrche_attack3ActionGraph = {
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
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times_1',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'startTimeDilation_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 0.2 },
          },
        },
        next: 'dealDamage_5',
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
          body: { $sequence: 'calculateActionValue_6' },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_7',
      },
      changeResourceByActionValue_9: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_9' },
        },
        next: null,
      },
      once_11: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'conditional_10' } },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'once_11' },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_10' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_12',
      },
      calculateActionValue_14: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_11' },
            right: { kind: 'constant', value: 0.8 },
          },
        },
        next: 'dealDamage_13',
      },
      repeatEachTick_15: {
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
          body: { $sequence: 'calculateActionValue_14' },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_15',
      },
      reachSkillOperableBoundary_17: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0038_purrche_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstop_times_1', fallback: 0 },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_attack3: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_attack3ActionGraph,
  key: 'chr_0038_purrche_attack3',
  blackboard: {
    atb: 23,
    atk_scale: [1.02, 1.12, 1.22, 1.33, 1.43, 1.53, 1.63, 1.73, 1.84, 1.96, 2.12, 2.3],
    atk_scale_1: 0,
    atk_scale_2: 0,
    env_dmg: 20,
    hitstop_times_1: 0,
    hitstop_times_2: 0,
    poise: 21,
  },
  timelineBlockFrames: 47,
  naturalDurationFrames: 209,
  exclusiveFrame: 47,
  offsetRecordFrame: 21,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 58,
        input: 'basicAttack',
        targetSkillId: 'chr_0038_purrche_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 47, endFrame: 58, skillIds: ['chr_0038_purrche_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 18, endFrame: 20, sequence: { $sequence: 'modifyActionValue_8' } },
    { startFrame: 21, endFrame: 23, sequence: { $sequence: 'modifyActionValue_16' } },
    { startFrame: 47, endFrame: 58, sequence: { $sequence: 'reachSkillOperableBoundary_17' } },
  ],
  timelineContinuationSkillId: 'chr_0038_purrche_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const purrchenaChr_0038_purrche_power_attackActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.42 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.004006803,
                  value: 0.4333363,
                  inTangent: -14.53776,
                  outTangent: -14.53776,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.03453654,
                  value: -0.0104978,
                  inTangent: -0.00949474,
                  outTangent: -0.00949474,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9195074,
                  value: 0.001982015,
                  inTangent: 0.01377201,
                  outTangent: 0.01377201,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9931734,
                  value: 1.999922,
                  inTangent: 27.12162,
                  outTangent: 27.12162,
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
        next: 'gainFinisherSp_1',
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.005714327,
                  value: 0.2817955,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1.0057143,
                  value: 0.2817955,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_power_attack: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_power_attackActionGraph,
  key: 'chr_0038_purrche_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 47,
  naturalDurationFrames: 137,
  exclusiveFrame: 46,
  offsetRecordFrame: 0,
  inputWindows: { allowedNextSkills: [{ startFrame: 37, endFrame: 56, skillIds: [] }] },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 24, endFrame: 26, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 33, endFrame: 35, sequence: { $sequence: 'startTimeDilation_4' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const purrchenaChr_0038_purrche_plunging_attack_endActionGraph = {
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
            damageType: 'physical',
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

export const purrchenaChr_0038_purrche_plunging_attack_end: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_plunging_attack_endActionGraph,
  key: 'chr_0038_purrche_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 228,
  exclusiveFrame: 21,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const purrchenaChr_0038_purrche_normal_skillActionGraph = {
  main: {
    nodes: {
      castSkillDuringAction_1: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_1',
      },
      markCurrentSkillCanInterrupt_3: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_4: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_enter_normal_skill_end',
              'buff_chr_0038_purrche_block_end',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      findCharacterTeamTargets_8: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'MainChar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_9: {
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
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_aura_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            copiedBlackboardAssignments: {
              dmg_taken_down_1: 'dmg_taken_down_1',
              dmg_taken_down_2: 'dmg_taken_down_2',
              dmg_taken_down_3: 'dmg_taken_down_3',
              dmg_taken_down_4: 'dmg_taken_down_4',
            },
          },
        },
        next: null,
      },
      castSkillDuringAction_15: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_15',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_16' },
        },
        next: null,
      },
      castSkillDuringAction_11: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_11',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_12',
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_13' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_14' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
          },
        },
        next: null,
      },
      jumpTimeline_23: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 107 } },
        next: null,
      },
      conditional_opt3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'jumpTimeline_23' },
        },
        next: null,
      },
      castSkillDuringAction_20: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_block',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_20',
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      listenForCombatEvents_opt4: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_22' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt3' },
              },
            ],
          },
        },
        next: null,
      },
      jumpTimeline_27: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 252 } },
        next: null,
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'jumpTimeline_27' },
        },
        next: null,
      },
      listenForCombatEvents_29: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[32]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_28' },
              },
            ],
          },
        },
        next: null,
      },
      listenForCombatEvents_32: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[33]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_28' },
              },
            ],
          },
        },
        next: null,
      },
      jumpTimeline_33: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 674 } },
        next: null,
      },
      conditional_34: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'jumpTimeline_33' },
        },
        next: null,
      },
      listenForCombatEvents_35: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[34]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_34' },
              },
            ],
          },
        },
        next: null,
      },
      listenForCombatEvents_38: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[35]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_34' },
              },
            ],
          },
        },
        next: null,
      },
      applyBuff_39: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      changeResourceByActionValue_40: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      changeResourceByActionValue_41: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'changeResourceByActionValue_40',
      },
      applyBuff_42: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_change_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_atb' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill: SkillDefinition = {
  key: 'chr_0038_purrche_normal_skill',
  blackboard: {
    atb_return_1: 20,
    dmg_taken_down_1: 0.9,
    dmg_taken_down_2: 0.8,
    dmg_taken_down_3: 0.7,
    dmg_taken_down_4: 0.6,
    potential_5_atb: 0,
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 184,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 12, endFrame: 50, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      { startFrame: 300, endFrame: 585, skillIds: ['chr_0038_purrche_normal_skill_sp'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 49, endFrame: 49, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 1007, endFrame: 1010, sequence: { $sequence: 'markCurrentSkillCanInterrupt_3' } },
    { startFrame: 1134, endFrame: 1137, sequence: { $sequence: 'finishTimeline_4' } },
    { startFrame: 1429, endFrame: 1432, sequence: { $sequence: 'markCurrentSkillCanInterrupt_3' } },
    { startFrame: 1492, endFrame: 1495, sequence: { $sequence: 'finishTimeline_4' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_7' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_8' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_10' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 1204, endFrame: 1410, sequence: { $sequence: 'listenForCombatEvents_opt4' } },
    { startFrame: 312, endFrame: 417, sequence: { $sequence: 'listenForCombatEvents_29' } },
    { startFrame: 874, endFrame: 1006, sequence: { $sequence: 'listenForCombatEvents_32' } },
    { startFrame: 1204, endFrame: 1285, sequence: { $sequence: 'listenForCombatEvents_35' } },
    { startFrame: 1285, endFrame: 1428, sequence: { $sequence: 'listenForCombatEvents_38' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_39' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeResourceByActionValue_41' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_42' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  timelineBlockFollowUpSkillId: 'chr_0038_purrche_normal_skill_counter',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: purrchenaChr_0038_purrche_normal_skillActionGraph,
};

export const purrchenaChr_0038_purrche_normal_skill_counterActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_block_counter',
              'buff_chr_0038_purrche_block_change_skill',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      readBuffStackCount_2: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'block_time',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter'] },
          },
        },
        next: 'finishBuffsById_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_block_counter_mark'],
            reason: 'other',
          },
        },
        next: 'readBuffStackCount_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'is_block',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter_mark'] },
          },
        },
        next: 'finishBuffsById_3',
      },
      changeResourceByActionValue_5: {
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
      changeResourceByActionValue_6: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: 'changeResourceByActionValue_5',
      },
      startTimeDilation_7: {
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
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.7 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_3' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_7' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_8' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
          ],
        },
        next: null,
      },
      once_11: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'switch_10' } },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_6' },
        },
        next: 'once_11',
      },
      dealDamage_13: {
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
        next: 'conditional_12',
      },
      applyElementalInfliction_14: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: 'dealDamage_13',
      },
      repeatEachTick_15: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'applyElementalInfliction_14' },
        },
        next: null,
      },
      finishBuffsById_16: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_aura_block',
              'buff_chr_0038_purrche_block_shelter_down_aura_instance',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'block_time' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'is_block', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill_counter: SkillDefinition = {
  actionGraph: purrchenaChr_0038_purrche_normal_skill_counterActionGraph,
  key: 'chr_0038_purrche_normal_skill_counter',
  blackboard: {
    atb_return: 0,
    atk_scale: [1.78, 1.95, 2.13, 2.31, 2.49, 2.66, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    block_time: 1,
    is_block: 0,
    poise: 20,
    potential_5_atb: 0,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 399,
  exclusiveFrame: 35,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 15, endFrame: 45, skillIds: ['chr_0038_purrche_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'readBuffStackCount_4' } },
    { startFrame: 9, endFrame: 13, sequence: { $sequence: 'repeatEachTick_15' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'finishBuffsById_16' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const purrchenaChr_0038_purrche_normal_skill_block_1ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
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
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_2',
      },
      castSkillDuringAction_4: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_4',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      castSkillDuringAction_8: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_8',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_13' },
        },
        next: null,
      },
      listenForCombatEvents_15: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_14' },
              },
            ],
          },
        },
        next: null,
      },
      castSkillDuringAction_16: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'applyBuff_17' },
        },
        next: null,
      },
      listenForCombatEvents_19: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_18' },
              },
            ],
          },
        },
        next: null,
      },
      castSkillDuringAction_20: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'castSkillDuringAction_20' },
        },
        next: null,
      },
      applyBuff_22: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_21',
      },
      startTimeDilation_23: {
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
                  time: 0.000007561175,
                  value: 0.9554025,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.17689614,
                  value: 0.05861299,
                  inTangent: 3.83089883e-7,
                  outTangent: 3.83089883e-7,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.8731842,
                  value: 0.0586136,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.596606,
                  outTangent: 4.596606,
                  weightedMode: 0,
                  inWeight: 0.0243593454,
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
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_ult_add_red',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { stack: 'talent_1_stack' },
          },
        },
        next: null,
      },
      changeResourceByActionValue_26: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'applyBuff_25',
      },
      changeResourceByActionValue_27: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'changeResourceByActionValue_26',
      },
      changeResourceByActionValue_28: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'changeResourceByActionValue_27',
      },
      applyBuff_29: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_stay',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_7' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_atb' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1_usp' } },
      data_8: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill_block_1: SkillDefinition = {
  key: 'chr_0038_purrche_normal_skill_block_1',
  blackboard: { atb_return_2: 20, potential_5_atb: 0, talent_1_stack: 0, talent_1_usp: 0 },
  timelineBlockFrames: 26,
  naturalDurationFrames: 25,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 0, endFrame: 24, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 3, endFrame: 24, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 0, endFrame: 9, sequence: { $sequence: 'listenForCombatEvents_15' } },
    { startFrame: 9, endFrame: 24, sequence: { $sequence: 'listenForCombatEvents_19' } },
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'applyBuff_22' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_23' } },
    { startFrame: 0, endFrame: 9, sequence: { $sequence: 'applyBuff_24' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeResourceByActionValue_28' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'applyBuff_29' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: purrchenaChr_0038_purrche_normal_skill_block_1ActionGraph,
};

export const purrchenaChr_0038_purrche_normal_skill_block_2ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
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
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_2',
      },
      castSkillDuringAction_4: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_4',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      castSkillDuringAction_9: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_9',
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'applyBuff_14' },
        },
        next: null,
      },
      listenForCombatEvents_16: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_15' },
              },
            ],
          },
        },
        next: null,
      },
      castSkillDuringAction_17: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_18',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_19' },
        },
        next: null,
      },
      listenForCombatEvents_21: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_20' },
              },
            ],
          },
        },
        next: null,
      },
      castSkillDuringAction_22: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_22',
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'applyBuff_23' },
        },
        next: null,
      },
      startTimeDilation_25: {
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
                  time: -0.003320307,
                  value: 0.06893496,
                  inTangent: 0.002727071,
                  outTangent: 0.002727071,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1933896,
                  value: 0.0694714,
                  inTangent: -0.005988318,
                  outTangent: -0.005988318,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.2475097,
                  value: 0.2076706,
                  inTangent: -0.007820179,
                  outTangent: -0.007820179,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8658105,
                  value: 0.2205032,
                  inTangent: 0.08536714,
                  outTangent: 0.08536714,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 5.808926,
                  outTangent: 5.808926,
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
      startTimeDilation_26: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.002380371,
                  value: 0.01728821,
                  inTangent: -0.009265231,
                  outTangent: -0.009265231,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1802043,
                  value: 0.02063313,
                  inTangent: -0.1249941,
                  outTangent: -0.1249941,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.307336,
                  value: 0.1805526,
                  inTangent: 0.04394849,
                  outTangent: 0.04394849,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9206635,
                  value: 0.1941004,
                  inTangent: -0.002866605,
                  outTangent: -0.002866605,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 10.158,
                  outTangent: 10.158,
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
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_25' },
          whenFalse: { $sequence: 'startTimeDilation_26' },
        },
        next: null,
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'applyBuff_10' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_8' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
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
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill_block_2: SkillDefinition = {
  key: 'chr_0038_purrche_normal_skill_block_2',
  blackboard: {},
  timelineBlockFrames: 26,
  naturalDurationFrames: 25,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 0, endFrame: 25, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 22, endFrame: 22, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 2, endFrame: 25, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 0, endFrame: 12, sequence: { $sequence: 'listenForCombatEvents_16' } },
    { startFrame: 12, endFrame: 25, sequence: { $sequence: 'listenForCombatEvents_21' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'conditional_24' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_27' } },
    { startFrame: 0, endFrame: 11, sequence: { $sequence: 'applyBuff_28' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: purrchenaChr_0038_purrche_normal_skill_block_2ActionGraph,
};

export const purrchenaChr_0038_purrche_normal_skill_loop_1ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_2: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_3: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      jumpTimeline_6: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 360 } },
        next: null,
      },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
            reason: 'other',
          },
        },
        next: 'jumpTimeline_6',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'finishBuffsById_7' },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_7' },
          whenFalse: { $sequence: 'conditional_10' },
        },
        next: null,
      },
      finishBuffsById_12: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_12',
      },
      castSkillDuringAction_19: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_19',
      },
      mergeContextTargets_21: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'Attacker',
            sources: [{ kind: 'target', target: 'eventSource' }],
          },
        },
        next: 'applyBuff_20',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'mergeContextTargets_21' },
        },
        next: null,
      },
      castSkillDuringAction_14: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_14',
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_15',
      },
      mergeContextTargets_17: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'Attacker',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'applyBuff_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'mergeContextTargets_17' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_18' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
          },
        },
        next: null,
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'jumpTimeline_6' },
        },
        next: null,
      },
      listenForCombatEvents_27: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[26]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_26' },
              },
            ],
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
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill_loop_1: SkillDefinition = {
  key: 'chr_0038_purrche_normal_skill_loop_1',
  blackboard: {},
  timelineBlockFrames: 362,
  naturalDurationFrames: 494,
  exclusiveFrame: 361,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 1, endFrame: 494, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 494, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 361, endFrame: 364, sequence: { $sequence: 'markCurrentSkillCanInterrupt_2' } },
    { startFrame: 491, endFrame: 494, sequence: { $sequence: 'finishTimeline_3' } },
    { startFrame: 675, endFrame: 678, sequence: { $sequence: 'markCurrentSkillCanInterrupt_2' } },
    { startFrame: 738, endFrame: 741, sequence: { $sequence: 'finishTimeline_3' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_11' } },
    { startFrame: 1, endFrame: 2, sequence: { $sequence: 'finishBuffsById_13' } },
    { startFrame: 0, endFrame: 360, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 0, endFrame: 360, sequence: { $sequence: 'listenForCombatEvents_27' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: purrchenaChr_0038_purrche_normal_skill_loop_1ActionGraph,
};

export const purrchenaChr_0038_purrche_normal_skill_loop_2ActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_2: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      jumpTimeline_3: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 360 } },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
            reason: 'other',
          },
        },
        next: 'jumpTimeline_3',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'finishBuffsById_4' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_4' },
          whenFalse: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_10: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_9',
      },
      castSkillDuringAction_18: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_18',
      },
      mergeContextTargets_20: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'Attacker',
            sources: [{ kind: 'target', target: 'eventSource' }],
          },
        },
        next: 'applyBuff_19',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'mergeContextTargets_20' },
        },
        next: null,
      },
      castSkillDuringAction_13: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            targetContextKey: 'Attacker',
            target: 'context',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_14',
      },
      mergeContextTargets_16: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'Attacker',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'applyBuff_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'mergeContextTargets_16' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_17' },
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
          },
        },
        next: null,
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'jumpTimeline_3' },
        },
        next: null,
      },
      listenForCombatEvents_26: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_25' },
              },
            ],
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
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_normal_skill_loop_2: SkillDefinition = {
  key: 'chr_0038_purrche_normal_skill_loop_2',
  blackboard: {},
  timelineBlockFrames: 362,
  naturalDurationFrames: 431,
  exclusiveFrame: 361,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 0, endFrame: 431, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 431, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 361, endFrame: 364, sequence: { $sequence: 'markCurrentSkillCanInterrupt_2' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 1, endFrame: 2, sequence: { $sequence: 'finishBuffsById_10' } },
    { startFrame: 361, endFrame: 362, sequence: { $sequence: 'finishBuffsById_10' } },
    { startFrame: 0, endFrame: 360, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 0, endFrame: 360, sequence: { $sequence: 'listenForCombatEvents_26' } },
  ],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: purrchenaChr_0038_purrche_normal_skill_loop_2ActionGraph,
};

export const purrchenaChr_0038_purrche_combo_skillActionGraph = {
  main: {
    nodes: {
      inheritBuffById_1: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      inheritBuffById_2: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      findCharacterTeamTargets_4: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'box_pos', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      jumpTimeline_6: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 210 } },
        next: null,
      },
      jumpTimeline_5: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 270 } },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_5' },
          whenFalse: { $sequence: 'jumpTimeline_6' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim', 'buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          },
        },
        next: 'conditional_8',
      },
      markCurrentSkillCanInterrupt_10: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_11: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      castSkillDuringAction_12: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_12',
      },
      castSkillDuringAction_14: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_14',
      },
      applyBuff_75: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_combo_lasttype',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { combotype: 'comboType_last' },
          },
        },
        next: null,
      },
      modifyActionValue_76: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType_last',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'applyBuff_75',
      },
      modifyActionValue_73: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'modifyActionValue_76',
      },
      modifyActionValue_70: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_76',
      },
      conditional_74: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_70' },
          whenFalse: { $sequence: 'modifyActionValue_73' },
        },
        next: null,
      },
      conditional_79: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_74' },
          whenFalse: { $sequence: 'modifyActionValue_76' },
        },
        next: null,
      },
      modifyActionValue_80: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'conditional_79',
      },
      modifyActionValue_64: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'modifyActionValue_76',
      },
      conditional_65: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_70' },
          whenFalse: { $sequence: 'modifyActionValue_64' },
        },
        next: null,
      },
      conditional_77: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_65' },
          whenFalse: { $sequence: 'modifyActionValue_76' },
        },
        next: null,
      },
      modifyActionValue_78: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'conditional_77',
      },
      conditional_83: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_78' },
          whenFalse: { $sequence: 'modifyActionValue_80' },
        },
        next: null,
      },
      conditional_56: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_73' },
          whenFalse: { $sequence: 'modifyActionValue_64' },
        },
        next: null,
      },
      conditional_81: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_56' },
          whenFalse: { $sequence: 'modifyActionValue_76' },
        },
        next: null,
      },
      modifyActionValue_82: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_81',
      },
      conditional_86: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_82' },
          whenFalse: { $sequence: 'conditional_83' },
        },
        next: null,
      },
      applyBuff_87: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_combo_lasttype',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_86',
      },
      readBuffBlackboard_85: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_combo_lasttype'] },
            desiredKey: 'combotype',
            outputKey: 'comboType_last',
          },
        },
        next: 'conditional_86',
      },
      conditional_88: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_85' },
          whenFalse: { $sequence: 'applyBuff_87' },
        },
        next: null,
      },
      modifyActionValue_89: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: null,
      },
      conditional_91: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_89' },
        },
        next: null,
      },
      modifyActionValue_90: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      conditional_93: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_90' },
          whenFalse: { $sequence: 'conditional_91' },
        },
        next: null,
      },
      modifyActionValue_92: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'comboType',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_94: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_92' },
          whenFalse: { $sequence: 'conditional_93' },
        },
        next: null,
      },
      launchProjectile_96: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            syncTimeScale: true,
            recycleDelaySeconds: 0.0666666701436043,
            hit: { onReach: true, target: 'controlledOperator', finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0038_purrche_combo_skill_gene',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 2,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_blackhole_dot: 0,
                  atk_scale_blackhole_end: 0.1,
                  atk_scale_boom: 1,
                  comboType: 0,
                  duration: 0,
                  poise: 15,
                  usp: 0,
                },
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
                            abilityEntityId: 'abilityentity_chr_0038_purrche_combo',
                            childSkillId: 'chr_0038_purrche_combo_skill_giftbox_abilityrange',
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
      withActionBlackboardScope_98: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_96' },
        },
        next: null,
      },
      conditional_99: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_98' },
          whenFalse: { $sequence: 'withActionBlackboardScope_98' },
        },
        next: null,
      },
      startTimeDilation_256: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.667 },
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
      startTimeDilation_257: {
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
      startTimeDilation_258: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
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
      castSkillDuringAction_264: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_265: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_264',
      },
      applyBuff_266: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_265',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' } },
          whenTrue: { $sequence: 'applyBuff_266' },
        },
        next: null,
      },
      castSkillDuringAction_259: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_260: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_259',
      },
      applyBuff_261: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter_mark',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_260',
      },
      applyBuff_262: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_261',
      },
      conditional_263: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' } },
          whenTrue: { $sequence: 'applyBuff_262' },
        },
        next: null,
      },
      listenForCombatEvents_opt2: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[49]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_263' },
              },
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[49]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt1' },
              },
            ],
          },
        },
        next: null,
      },
      castSkillDuringAction_275: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'actionInputTarget',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_276: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_275',
      },
      applyBuff_277: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_combo_to_normal_skill_hit',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_276',
      },
      applyBuff_278: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_277',
      },
      conditional_opt3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_25' } },
          whenTrue: { $sequence: 'applyBuff_278' },
        },
        next: null,
      },
      castSkillDuringAction_270: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0038_purrche_normal_skill_block_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_271: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'castSkillDuringAction_270',
      },
      applyBuff_272: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter_mark',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_271',
      },
      applyBuff_273: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_272',
      },
      conditional_274: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' } },
          whenTrue: { $sequence: 'applyBuff_273' },
        },
        next: null,
      },
      listenForCombatEvents_opt4: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[50]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_274' },
              },
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[50]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt3' },
              },
            ],
          },
        },
        next: null,
      },
      applyBuff_282: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_283: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' } },
          whenTrue: { $sequence: 'applyBuff_282' },
        },
        next: null,
      },
      listenForCombatEvents_284: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[51]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_283' },
              },
            ],
          },
        },
        next: null,
      },
      listenForCombatEvents_287: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[52]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_283' },
              },
            ],
          },
        },
        next: null,
      },
      applyBuff_288: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_pause_block',
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
          buffIds: ['buff_chr_0038_purrche_block_counter'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'comboType' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'comboType', fallback: 0 } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_6' },
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'comboType', fallback: 0 } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_10' },
        },
      },
      data_12: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_13: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_14: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'comboType', fallback: 0 },
      },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_14' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_15' },
        },
      },
      data_17: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.3333 } },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_combo_lasttype'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_combo_always_fish'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_combo_always_bomb'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_combo_always_black_hole'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_22: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_23: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_25: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_27: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_combo_skill: SkillDefinition = {
  key: 'chr_0038_purrche_combo_skill',
  blackboard: {
    angletorotate: 60,
    angletotarget: 0,
    atk_scale_blackhole_dot: [
      0.11, 0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.23, 0.25,
    ],
    atk_scale_blackhole_end: [0.22, 0.24, 0.27, 0.29, 0.31, 0.33, 0.36, 0.38, 0.4, 0.43, 0.46, 0.5],
    atk_scale_boom: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    cam_angle: 0,
    cam_duration: 0,
    comboType: 1,
    comboType_last: 0,
    heal_scale: [0.5, 0.6, 0.71, 0.81, 0.86, 0.91, 0.96, 1.01, 1.06, 1.08, 1.11, 1.13],
    heal_scale_fish: [0.34, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
    heal_static_value: [
      216, 259.2, 302.4, 345.6, 367.2, 388.8, 410.4, 432, 453.6, 464.4, 475.2, 486,
    ],
    heal_static_value_fish: [
      144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324,
    ],
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    potential_3: 0,
    radiusadd_display: 0,
    usp: 10,
    display_atk_scale_blackhole: [
      0.66, 0.72, 0.79, 0.85, 0.95, 1.01, 1.08, 1.14, 1.2, 1.27, 1.38, 1.5,
    ],
    display_usp: 10,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 330,
  exclusiveFrame: 330,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 26,
        endFrame: 75,
        skillIds: ['chr_0038_purrche_normal_skill_counter', 'chr_0038_purrche_normal_skill'],
      },
      { startFrame: 221, endFrame: 251, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      { startFrame: 281, endFrame: 310, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 332, sequence: { $sequence: 'inheritBuffById_1' } },
    { startFrame: 210, endFrame: 251, sequence: { $sequence: 'inheritBuffById_2' } },
    { startFrame: 270, endFrame: 310, sequence: { $sequence: 'inheritBuffById_2' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'findCharacterTeamTargets_4' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'finishBuffsById_9' } },
    { startFrame: 28, endFrame: 28, sequence: { $sequence: 'markCurrentSkillCanInterrupt_10' } },
    { startFrame: 206, endFrame: 206, sequence: { $sequence: 'finishTimeline_11' } },
    { startFrame: 250, endFrame: 250, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 309, endFrame: 309, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'conditional_88' } },
    { startFrame: 2, endFrame: 2, sequence: { $sequence: 'conditional_94' } },
    { startFrame: 17, endFrame: 20, sequence: { $sequence: 'conditional_99' } },
    { startFrame: 211, endFrame: 211, sequence: { $sequence: 'conditional_88' } },
    { startFrame: 221, endFrame: 224, sequence: { $sequence: 'conditional_99' } },
    { startFrame: 271, endFrame: 271, sequence: { $sequence: 'conditional_88' } },
    { startFrame: 281, endFrame: 284, sequence: { $sequence: 'conditional_99' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'startTimeDilation_256' } },
    { startFrame: 210, endFrame: 225, sequence: { $sequence: 'startTimeDilation_257' } },
    { startFrame: 270, endFrame: 282, sequence: { $sequence: 'startTimeDilation_258' } },
    { startFrame: 221, endFrame: 251, sequence: { $sequence: 'listenForCombatEvents_opt2' } },
    { startFrame: 281, endFrame: 310, sequence: { $sequence: 'listenForCombatEvents_opt4' } },
    { startFrame: 210, endFrame: 251, sequence: { $sequence: 'listenForCombatEvents_284' } },
    { startFrame: 270, endFrame: 310, sequence: { $sequence: 'listenForCombatEvents_287' } },
    { startFrame: 210, endFrame: 251, sequence: { $sequence: 'applyBuff_288' } },
    { startFrame: 270, endFrame: 310, sequence: { $sequence: 'applyBuff_288' } },
  ],
  cooldownFrames: [720, 720, 720, 720, 720, 720, 720, 720, 690, 690, 690, 660],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: purrchenaChr_0038_purrche_combo_skillActionGraph,
};

export const purrchenaChr_0038_purrche_ultimate_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_pause_change_skill_buff',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      findCharacterTeamTargets_3: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'MainChar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'box_num', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'normal_boom_prob',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'normal_boom_prob',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_13',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'box_num',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'modifyActionValue_13',
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_ult_add_red'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_16' },
        },
        next: 'finishBuffsById_17',
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_14' },
        },
        next: 'conditional_18',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_12' },
        },
        next: 'conditional_19',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: 'conditional_20',
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_9' },
        },
        next: 'conditional_21',
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_8' },
        },
        next: 'conditional_22',
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_5' },
        },
        next: 'conditional_23',
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_5' },
        },
        next: 'conditional_24',
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_5' },
        },
        next: 'conditional_25',
      },
      calculateActionValue_27: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'prob',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_13' },
            right: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'conditional_26',
      },
      calculateActionValue_28: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'add_prob',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'calculateActionValue_27',
      },
      readBuffStackCount_29: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'skill_defend_count',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_ult_add_red'] },
          },
        },
        next: 'calculateActionValue_28',
      },
      startTimeDilation_30: {
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
      launchProjectile_46: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0038_purrche_ult_skill_normal_bomb_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 1, duration: 0, poise_1: 5, stack: 0, usp: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 14, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'physical',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['ultimateSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
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
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_1' },
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
      withActionBlackboardScope_49: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_46' },
        },
        next: null,
      },
      launchProjectile_45: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0038_purrche_ult_skill_normal_blackhole_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 1,
                  atk_scale_blackhole_dot: 0,
                  atk_scale_blackhole_end: 0,
                  duration: 0,
                  poise_1: 15,
                  stack: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                            childSkillId: 'chr_0038_purrche_ultimate_skill_abilityrange_blackhole',
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
      withActionBlackboardScope_47: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_45' },
        },
        next: null,
      },
      modifyActionValue_48: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'black_hole_count',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'withActionBlackboardScope_47',
      },
      conditional_51: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_48' },
          whenFalse: { $sequence: 'withActionBlackboardScope_49' },
        },
        next: null,
      },
      conditional_52: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_49' },
          whenFalse: { $sequence: 'conditional_51' },
        },
        next: null,
      },
      launchProjectile_33: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.466666668653488 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0038_purrche_ult_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 14,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 1,
                  atk_scale_ult: 4,
                  duration: 0,
                  duration_vul: 0,
                  poise_2: 10,
                  rate_vul: 0,
                  stack: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_2' } },
                  { startFrame: 2, endFrame: 2, sequence: { $sequence: 'startTimeDilation_5' } },
                  { startFrame: 6, endFrame: 6, sequence: { $sequence: 'startTimeDilation_8' } },
                  { startFrame: 0, endFrame: 44, sequence: { $sequence: null } },
                  { startFrame: 2, endFrame: 2, sequence: { $sequence: null } },
                  { startFrame: 7, endFrame: 7, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 15, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'physical',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['ultimateSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_2: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0038_purrche_ult_spell_vulnerable',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              duration_vul: 'duration_vul',
                              rate: 'rate_vul',
                            },
                          },
                        },
                        next: 'dealDamage_1',
                      },
                      startTimeDilation_3: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.034 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: {
                              kind: 'inline',
                              keys: [
                                {
                                  time: -0.002857149,
                                  value: 0.07730663,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.9971429,
                                  value: 0.07730663,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                              ],
                            },
                            finishByAction: false,
                            targets: ['caster'],
                            abilityEntityTargets: [{ kind: 'context', contextKey: 'projectile' }],
                          },
                        },
                        next: null,
                      },
                      findUnfinishedProjectileTargets_4: {
                        action: {
                          kind: 'findUnfinishedProjectileTargets',
                          parameters: { saveToContextKey: 'projectile' },
                        },
                        next: 'startTimeDilation_3',
                      },
                      startTimeDilation_5: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.034 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: {
                              kind: 'inline',
                              keys: [
                                {
                                  time: -0.002857149,
                                  value: 0.07730663,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.9971429,
                                  value: 0.07730663,
                                  inTangent: 0,
                                  outTangent: 0,
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
                        next: 'findUnfinishedProjectileTargets_4',
                      },
                      startTimeDilation_6: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.0667 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: {
                              kind: 'inline',
                              keys: [
                                {
                                  time: -0.005714298,
                                  value: 0.0488777,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.9942858,
                                  value: 0.0488777,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                              ],
                            },
                            finishByAction: false,
                            targets: [],
                            abilityEntityTargets: [{ kind: 'context', contextKey: 'projectile' }],
                          },
                        },
                        next: null,
                      },
                      findUnfinishedProjectileTargets_7: {
                        action: {
                          kind: 'findUnfinishedProjectileTargets',
                          parameters: { saveToContextKey: 'projectile' },
                        },
                        next: 'startTimeDilation_6',
                      },
                      startTimeDilation_8: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.0667 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: {
                              kind: 'inline',
                              keys: [
                                {
                                  time: 0.002857089,
                                  value: 0.05236897,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 1.002857,
                                  value: 0.05236897,
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
                            abilityEntityTargets: [{ kind: 'current' }],
                          },
                        },
                        next: 'findUnfinishedProjectileTargets_7',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_ult' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
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
      switch_53: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_21' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'conditional_52' } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'conditional_52' } },
          ],
        },
        next: null,
      },
      switch_69: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_22' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'conditional_52' } },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
          ],
        },
        next: null,
      },
      switch_99: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_23' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'withActionBlackboardScope_34' },
            },
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'conditional_52' } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'conditional_52' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'conditional_52' } },
          ],
        },
        next: null,
      },
      startTimeDilation_100: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 2.3 },
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
      hideUi_101: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      jumpTimeline_102: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 68,
            condition: { kind: 'conditionNode', nodeId: 'data_25' },
          },
        },
        next: null,
      },
      jumpTimeline_103: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 135 } },
        next: null,
      },
      applyBuff_104: {
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
          buffIds: ['buff_chr_0038_purrche_perform_test_always2r1h'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_perform_test_always1r1b1h'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_perform_test_always3boom'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_perform_test_always3r'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_train_ult_always2y1r'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0038_purrche_train_ult_always3y'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_8: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_7' } },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_10: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_9' } },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_12: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_11' } },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'add_prob' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'skill_defend_count' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'talent1_prob_up' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'black_hole_count', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'normal_boom_prob' } },
      data_20: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_19' } },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'box_num' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'box_num' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'box_num' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'box_num', fallback: 0 } },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_24' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaChr_0038_purrche_ultimate_skill: SkillDefinition = {
  key: 'chr_0038_purrche_ultimate_skill',
  blackboard: {
    add_prob: 0,
    atk_scale: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    atk_scale_blackhole_dot: [
      0.11, 0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.23, 0.25,
    ],
    atk_scale_blackhole_end: [0.22, 0.24, 0.27, 0.29, 0.31, 0.33, 0.36, 0.38, 0.4, 0.43, 0.46, 0.5],
    atk_scale_ult: [2.67, 2.93, 3.2, 3.47, 3.73, 4, 4.27, 4.53, 4.8, 5.13, 5.53, 6],
    black_hole_count: 0,
    box_num: 0,
    duration_vul: 5,
    normal_boom_prob: 0.5,
    poise_1: 10,
    poise_2: 15,
    prob: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.18, 0.18, 0.18, 0.2],
    rate_vul: [0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.02, 0.02, 0.02, 0.025],
    skill_defend_count: 0,
    talent_add_red: 0,
    talent1_prob_up: 0,
    display_atk_scale_blackhole: [
      0.66, 0.72, 0.79, 0.85, 0.95, 1.01, 1.08, 1.14, 1.2, 1.27, 1.38, 1.5,
    ],
  },
  timelineBlockFrames: 158,
  naturalDurationFrames: 262,
  exclusiveFrame: 157,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 146,
        endFrame: 180,
        skillIds: ['chr_0038_purrche_combo_skill', 'chr_0038_purrche_normal_skill'],
      },
      { startFrame: 146, endFrame: 180, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1, endFrame: 143, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 69, endFrame: 143, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'findCharacterTeamTargets_3' } },
    { startFrame: 68, endFrame: 71, sequence: { $sequence: 'findCharacterTeamTargets_3' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'readBuffStackCount_29' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'startTimeDilation_30' } },
    { startFrame: 138, endFrame: 139, sequence: { $sequence: 'switch_53' } },
    { startFrame: 138, endFrame: 139, sequence: { $sequence: 'switch_69' } },
    { startFrame: 138, endFrame: 139, sequence: { $sequence: 'switch_99' } },
    { startFrame: 0, endFrame: 135, sequence: { $sequence: 'startTimeDilation_100' } },
    { startFrame: 0, endFrame: 135, sequence: { $sequence: 'hideUi_101' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'jumpTimeline_102' } },
    { startFrame: 67, endFrame: 67, sequence: { $sequence: 'jumpTimeline_103' } },
    { startFrame: 0, endFrame: 157, sequence: { $sequence: 'applyBuff_104' } },
    { startFrame: 68, endFrame: 157, sequence: { $sequence: 'applyBuff_104' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: purrchenaChr_0038_purrche_ultimate_skillActionGraph,
};

export const purrchenaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const purrchenaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: purrchenaCommon_character_perfect_dodgeActionGraph,
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

const purrchenaPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_talent_2',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: {
              cd: { kind: 'valueNode', nodeId: 'data_1' },
              dmg_down: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_down' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0038_purrche_talent_2',
  blackboard: { cd: [180, 90], dmg_down: [0.5, 0.5] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: purrchenaPassive1ActionGraph,
};

const purrchenaComboCondition1ActionGraph = {
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

const purrchenaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0038_purrche_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: purrchenaComboCondition1ActionGraph,
};

const purrchenaBuff1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              dmg_taken_down_1: 'dmg_taken_down_1',
              dmg_taken_down_2: 'dmg_taken_down_2',
              dmg_taken_down_3: 'dmg_taken_down_3',
              dmg_taken_down_4: 'dmg_taken_down_4',
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: [
              'buff_chr_0038_purrche_block_shelter_down',
              'buff_chr_0038_purrche_block_shelter_down_count',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_counter'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'finishBuffsById_4' },
        },
        next: null,
      },
      withActionBlackboardScope_24: {
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
        next: null,
      },
      withActionBlackboardScope_25: {
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
          body: { $sequence: 'finishBuffsById_3' },
        },
        next: 'withActionBlackboardScope_24',
      },
      withActionBlackboardScope_26: {
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
          body: { $sequence: 'applyBuff_2' },
        },
        next: 'withActionBlackboardScope_25',
      },
      setCurrentBuffTimePaused_6: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_6' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_8: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_8' },
        },
        next: null,
      },
      finishBuffsById_10: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_aura_block'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'finishBuffsById_10' },
        },
        next: null,
      },
      finishCurrentBuff_14: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'finishCurrentBuff_14' },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'assign', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      setCurrentBuffRemainingDuration_17: {
        action: {
          kind: 'setCurrentBuffRemainingDuration',
          parameters: {
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
            target: 'eventTarget',
          },
        },
        next: 'modifyActionValue_16',
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'setCurrentBuffRemainingDuration_17' },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_18' },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'conditional_19' },
        },
        next: null,
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_down',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'conditional_22' },
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
          buffIds: ['buff_chr_0038_purrche_block_change_skill'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: [
            'chr_0038_purrche_normal_skill_block_1',
            'chr_0038_purrche_normal_skill_block_2',
            'chr_0038_purrche_combo_skill',
          ],
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_dash'] },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['ultimate'] },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'actionInputTarget',
          buffIds: ['buff_chr_0038_purrche_block_counter'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_counter'] },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0038_purrche_block_counter'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_counter'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff1: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
  blackboard: {
    count: 0,
    dmg_taken_down_1: 0.9,
    dmg_taken_down_2: 0.7,
    dmg_taken_down_3: 0.5,
    dmg_taken_down_4: 0.3,
    duration: 3,
    hit: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'applyBuff_1' },
    finish: { $sequence: 'withActionBlackboardScope_26' },
  },
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_7' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_9' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_11' } },
    { event: 'ownerSwitchToGuard', priority: 0, sequence: { $sequence: 'finishBuffsById_10' } },
    { event: 'ownerSwitchToCenter', priority: 0, sequence: { $sequence: 'finishBuffsById_10' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_15' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_20' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_23' } },
  ],
  actionGraph: purrchenaBuff1ActionGraph,
};

const purrchenaBuff2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'dmg_taken_down',
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
            key: 'dmg_taken_down',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'dmg_taken_down',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'dmg_taken_down',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_instance_aura',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { dmg_taken_down: 'dmg_taken_down' },
          },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_instance'],
            reason: 'other',
          },
        },
        next: 'applyBuff_5',
      },
      switch_7: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'modifyActionValue_1' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'modifyActionValue_2' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'modifyActionValue_3' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'modifyActionValue_4' },
            },
          ],
        },
        next: 'finishBuffsById_6',
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'caster',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'] },
          },
        },
        next: 'switch_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_down_aura',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'applyBuff_9' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down_2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down_3' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down_4' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: {
    count: 0,
    dmg_taken_down: 0.9,
    dmg_taken_down_1: 0.9,
    dmg_taken_down_2: 0.7,
    dmg_taken_down_3: 0.5,
    dmg_taken_down_4: 0.3,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'readBuffStackCount_8' } },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_11' } },
  ],
  actionGraph: purrchenaBuff2ActionGraph,
};

const purrchenaBuff3ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_counter'],
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
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0038_purrche_pause_change_skill_buff'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0038_purrche_pause_change_skill_buff'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  timeClock: 'global',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'finishBuffsById_1' } },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: purrchenaBuff3ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0038_purrche_normal_skill_counter',
      revertedSkillKey: 'chr_0038_purrche_normal_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
};

const purrchenaBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_counter_mark',
            target: 'buffOwner',
            source: 'buffSource',
            asChildBuff: true,
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
      readBuffStackCount_3: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'enhance',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter'] },
          },
        },
        next: 'conditional_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'enhance', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 2 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff4: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 30, enhance: 0, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enhanceChanged: { $sequence: 'readBuffStackCount_3' } },
  actionGraph: purrchenaBuff4ActionGraph,
};

const purrchenaBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff5ActionGraph,
};

const purrchenaBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 2,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_taken_down: 0.1 },
  attributeModifiers: [],
  actionGraph: purrchenaBuff6ActionGraph,
};

const purrchenaBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff7: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 0.5,
  applyTags: ['Skill/Character/chr_0038_purrche/ImmuneNormalSkillfx'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff7ActionGraph,
};

const purrchenaBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 99999 },
              rate: { kind: 'valueNode', nodeId: 'data_1' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
                operation: 'add',
                value: { kind: 'valueNode', nodeId: 'data_2' },
              },
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'shelter_add' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { dmg_taken_down: 0.9, shelter_add: -0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff8ActionGraph,
};

const purrchenaBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_instance',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { dmg_taken_down: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff9: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { dmg_taken_down: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff9ActionGraph,
};

const purrchenaBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_down_count',
            target: 'buffOwner',
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
      finishCurrentBuff_4: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'finishCurrentBuff_4' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_6: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_6' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_8: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_8' },
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
          buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'],
          operator: 'less',
          value: { kind: 'constant', value: 3 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0038_purrche_aura_block'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: [
            'chr_0038_purrche_normal_skill_block_1',
            'chr_0038_purrche_normal_skill_block_2',
            'chr_0038_purrche_combo_skill',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'conditional_3' } },
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_7' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_9' } },
  ],
  actionGraph: purrchenaBuff10ActionGraph,
};

const purrchenaBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_down_aura_instance',
            target: 'party',
            finishByAction: true,
            onActionEndFinishBuffs: {
              target: 'buffOwner',
              buffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
            },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_taken_down: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff11ActionGraph,
};

const purrchenaBuff12ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: purrchenaBuff12ActionGraph,
};

const purrchenaBuff13ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff13: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: 3,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff13ActionGraph,
};

const purrchenaBuff14ActionGraph = {
  main: {
    nodes: {
      setCurrentBuffTimePaused_2: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_block_shelter_stay_instance',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { dmg_taken_down: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
      finishCurrentBuff_3: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'finishCurrentBuff_3' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_5: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_5' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: [
            'chr_0038_purrche_normal_skill_block_1',
            'chr_0038_purrche_normal_skill_block_2',
            'chr_0038_purrche_combo_skill',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff14: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { dmg_taken_down: 0.9, duration: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'setCurrentBuffTimePaused_2' },
    enable: { $sequence: 'applyBuff_1' },
  },
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_4' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_8' } },
  ],
  actionGraph: purrchenaBuff14ActionGraph,
};

const purrchenaBuff15ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 99999 },
              rate: { kind: 'valueNode', nodeId: 'data_1' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_taken_down' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff15: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 999,
  presentation: {
    visible: true,
    iconId: 'icon_battle_shield',
    iconPath: '/icons/icon_battle_shield.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { dmg_taken_down: 0.9, duration: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff15ActionGraph,
};

const purrchenaBuff16ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff16: SkillBuffDefinition = {
  stackingType: 'modify',
  priority: 0,
  maxStackCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: { combotype: 0 },
  attributeModifiers: [],
  actionGraph: purrchenaBuff16ActionGraph,
};

const purrchenaBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff17: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  durationSeconds: 5,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff17ActionGraph,
};

const purrchenaBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff18: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff18ActionGraph,
};

const purrchenaBuff19ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff19: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff19ActionGraph,
};

const purrchenaBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  timeClock: 'global',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: purrchenaBuff20ActionGraph,
};

const purrchenaBuff21ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_talent_2_effectbuff',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              dmg_down: { kind: 'valueNode', nodeId: 'data_1' },
              cd: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_down' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff21: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 0, dmg_down: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff21ActionGraph,
};

const purrchenaBuff22ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0038_purrche_talent_2_effectbuff_Add',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { dmg_down: 'dmg_down_true', cd: 'cd' },
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'dmg_down_true',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'applyBuff_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'calculateActionValue_2' },
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
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'calculateActionValue_2' },
        },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'conditional_11' },
        },
        next: null,
      },
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_talent_2_effectbuff_Add'],
            reason: 'other',
          },
        },
        next: null,
      },
      calculateActionValue_14: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'dmg_down_true',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'finishBuffsById_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'calculateActionValue_14' },
        },
        next: null,
      },
      setGlobalCooldown_16: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'setGlobalCooldown_16' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_down' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'equal',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_3' } },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_5' } },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'equal',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_down' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0038_purrche_talent_2_effectbuff_Add'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff22: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 0, dmg_down: 0, dmg_down_true: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'conditional_4' },
    trigger: { $sequence: 'conditional_4' },
  },
  abilityEventResponses: [
    { event: 'hpChanged', priority: 0, sequence: { $sequence: 'conditional_12' } },
    { event: 'hpChanged', priority: 0, sequence: { $sequence: 'conditional_15' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_17' } },
  ],
  actionGraph: purrchenaBuff22ActionGraph,
};

const purrchenaBuff23ActionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff23: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_purrche_talent_02',
    iconPath: '/icons/icon_battle_buff_purrche_talent_02.webp',
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
  blackboard: { cd: 0, dmg_down: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'product',
          addition: { blackboardKey: 'dmg_down' },
        },
      ],
    },
  ],
  abilityEventResponses: [
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'finishCurrentBuff_1' } },
  ],
  actionGraph: purrchenaBuff23ActionGraph,
};

const purrchenaBuff24ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff24: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_purrche_talent_01',
    iconPath: '/icons/icon_battle_buff_purrche_talent_01.webp',
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
  blackboard: { stack: 0 },
  attributeModifiers: [],
  actionGraph: purrchenaBuff24ActionGraph,
};

const purrchenaBuff25ActionGraph = {
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
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0038_purrche_vulnerable_spell_child',
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_vul' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff25: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration_vul' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_purrche_ult_vulnerable',
    iconPath: '/icons/icon_battle_buff_purrche_ult_vulnerable.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_vul: 0, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: purrchenaBuff25ActionGraph,
};

const purrchenaBuff26ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const purrchenaBuff26: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_purrche_ult_vulnerable',
    iconPath: '/icons/icon_battle_buff_purrche_ult_vulnerable.webp',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: purrchenaBuff26ActionGraph,
};

export const purrchena: OperatorDefinition = {
  slug: 'purrchena',
  gameId: 'PURRCHENA',
  rarity: 5,
  weaponType: 'sword',
  element: 'physical',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [20, 52, 85, 118, 152, 168],
    agility: [8, 26, 45, 64, 84, 93],
    intellect: [9, 26, 44, 62, 80, 89],
    will: [12, 34, 56, 79, 102, 113],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        purrchenaChr_0038_purrche_attack1,
        purrchenaChr_0038_purrche_attack2,
        purrchenaChr_0038_purrche_attack3,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: purrchenaChr_0038_purrche_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: purrchenaChr_0038_purrche_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: purrchenaChr_0038_purrche_normal_skill,
      placementSequenceSkillKeys: [
        'chr_0038_purrche_normal_skill',
        'chr_0038_purrche_normal_skill_counter',
      ],
      replacementSkills: [
        purrchenaChr_0038_purrche_normal_skill_counter,
        purrchenaChr_0038_purrche_normal_skill_block_1,
        purrchenaChr_0038_purrche_normal_skill_block_2,
        purrchenaChr_0038_purrche_normal_skill_loop_1,
        purrchenaChr_0038_purrche_normal_skill_loop_2,
      ],
      replacementSkillPlacements: {
        chr_0038_purrche_normal_skill_block_1: 'internal',
        chr_0038_purrche_normal_skill_block_2: 'internal',
        chr_0038_purrche_normal_skill_loop_1: 'internal',
        chr_0038_purrche_normal_skill_loop_2: 'internal',
      },
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: purrchenaChr_0038_purrche_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: purrchenaChr_0038_purrche_ultimate_skill,
    },
  ],
  dodgeSkill: purrchenaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0038_purrche_normal_skill',
      replacementSkillKeys: ['chr_0038_purrche_normal_skill_counter'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0038_purrche_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0038_purrche_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0038_purrche_attack1',
        'chr_0038_purrche_attack2',
        'chr_0038_purrche_attack3',
        'chr_0038_purrche_power_attack',
        'chr_0038_purrche_plunging_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0038_purrche_attack1',
        'chr_0038_purrche_attack2',
        'chr_0038_purrche_attack3',
      ],
      defaultSkillKey: 'chr_0038_purrche_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [purrchenaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0038_purrche_normal_skill_block_1',
          blackboardKey: 'talent_1_usp',
          operation: 'assign',
          value: [6, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent1_prob_up',
          operation: 'assign',
          value: [0.1, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0038_purrche_normal_skill_block_1',
          blackboardKey: 'talent_1_stack',
          operation: 'assign',
          value: [3, 3],
        },
      ],
    },
    { levels: 2, passiveSkills: [purrchenaPassive1] },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'prob',
          operation: 'multiply',
          value: 1.5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_static_value_fish',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_scale_fish',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_boom',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'radiusadd_display',
          operation: 'multiply',
          value: 0.2,
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
          blackboardKey: 'atk_scale_ult',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_vul',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0038_purrche_aura_block: purrchenaBuff1,
    buff_chr_0038_purrche_block: purrchenaBuff2,
    buff_chr_0038_purrche_block_change_skill: purrchenaBuff3,
    buff_chr_0038_purrche_block_counter: purrchenaBuff4,
    buff_chr_0038_purrche_block_counter_mark: purrchenaBuff5,
    buff_chr_0038_purrche_block_end: purrchenaBuff6,
    buff_chr_0038_purrche_block_immune_skillfx: purrchenaBuff7,
    buff_chr_0038_purrche_block_instance: purrchenaBuff8,
    buff_chr_0038_purrche_block_instance_aura: purrchenaBuff9,
    buff_chr_0038_purrche_block_shelter_down: purrchenaBuff10,
    buff_chr_0038_purrche_block_shelter_down_aura: purrchenaBuff11,
    buff_chr_0038_purrche_block_shelter_down_aura_instance: purrchenaBuff12,
    buff_chr_0038_purrche_block_shelter_down_count: purrchenaBuff13,
    buff_chr_0038_purrche_block_shelter_stay: purrchenaBuff14,
    buff_chr_0038_purrche_block_shelter_stay_instance: purrchenaBuff15,
    buff_chr_0038_purrche_combo_lasttype: purrchenaBuff16,
    buff_chr_0038_purrche_combo_to_normal_skill_hit: purrchenaBuff17,
    buff_chr_0038_purrche_enter_normal_skill_end: purrchenaBuff18,
    buff_chr_0038_purrche_pause_block: purrchenaBuff19,
    buff_chr_0038_purrche_pause_change_skill_buff: purrchenaBuff20,
    buff_chr_0038_purrche_talent_2: purrchenaBuff21,
    buff_chr_0038_purrche_talent_2_effectbuff: purrchenaBuff22,
    buff_chr_0038_purrche_talent_2_effectbuff_Add: purrchenaBuff23,
    buff_chr_0038_purrche_ult_add_red: purrchenaBuff24,
    buff_chr_0038_purrche_ult_spell_vulnerable: purrchenaBuff25,
    buff_chr_0038_purrche_vulnerable_spell_child: purrchenaBuff26,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0038_purrche_combo: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'infinite' },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0038_purrche_combo_skill_giftbox_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 120,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 10,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_blackhole_dot: 0.1,
          atk_scale_blackhole_end: 0,
          atk_scale_boom: 0,
          comboType: 0,
          heal_scale: 1,
          heal_scale_fish: 1,
          heal_static_value: 100,
          heal_static_value_fish: 100,
          poise: 15,
          usp: 0,
        },
        scheduledSequences: [
          {
            startFrame: 64,
            endFrame: 67,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
          },
          { startFrame: 45, endFrame: 48, sequence: { $sequence: 'switch_12' } },
          { startFrame: 44, endFrame: 45, sequence: { $sequence: 'findCharacterTeamTargets_13' } },
          { startFrame: 44, endFrame: 45, sequence: { $sequence: 'forEachContextTarget_16' } },
          {
            startFrame: 44,
            endFrame: 47,
            sequence: { $sequence: 'changeResourceByActionValue_17' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              finishActionOwnerAbilityEntity_1: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
              launchProjectile_10: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0038_purrche_combo_skill_projhit_3',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 1,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale_boom: 1, duration: 0, poise: 15, usp: 0 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'physical',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    tags: ['comboSkill'],
                                    features: ['canBreakWeakness'],
                                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                                  },
                                  key: 'abilityentity_chr_0038_purrche_combo:chr_0038_purrche_combo_skill_giftbox_abilityrange:/childSkill/actionGraph/main/nodes/launchProjectile_10/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
                                },
                                next: null,
                              },
                            },
                            dataNodes: {
                              data_1: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'atk_scale_boom' },
                              },
                              data_2: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'poise' },
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
                  body: { $sequence: 'launchProjectile_10' },
                },
                next: null,
              },
              launchProjectile_6: {
                action: {
                  kind: 'launchProjectile',
                  parameters: {
                    finish: { reachAfterTicks: 2, maxDurationSeconds: 5 },
                    recycleDelaySeconds: 0.0666666701436043,
                    hit: { onReach: true, target: 'currentTarget', finishOnHit: true },
                  },
                  callbacks: [
                    {
                      event: 'hit',
                      skill: {
                        skillId: 'chr_0038_purrche_combo_skill_projhit_4',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 2,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { heal_scale_fish: 1, heal_static_value_fish: 100 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 0, sequence: { $sequence: 'heal_1' } },
                          { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              heal_1: {
                                action: {
                                  kind: 'heal',
                                  parameters: {
                                    target: 'actionInputTarget',
                                    alwaysNext: true,
                                    tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                                    attribute: 'will',
                                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                                    addition: { kind: 'valueNode', nodeId: 'data_2' },
                                  },
                                },
                                next: null,
                              },
                            },
                            dataNodes: {
                              data_1: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'heal_scale_fish' },
                              },
                              data_2: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'heal_static_value_fish' },
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
                  body: { $sequence: 'launchProjectile_6' },
                },
                next: null,
              },
              forEachContextTarget_8: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { contextKey: 'team' },
                  body: { $sequence: 'withActionBlackboardScope_7' },
                },
                next: null,
              },
              findCharacterTeamTargets_9: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'team',
                    selection: { kind: 'controlledOperator' },
                  },
                },
                next: 'forEachContextTarget_8',
              },
              launchProjectile_4: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0038_purrche_combo_skill_projhit_1',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 1,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: {
                          atk_scale: 1,
                          atk_scale_blackhole_dot: 0,
                          duration: 0,
                          poise: 10,
                          potential_3: 0,
                          usp: 0,
                        },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_3' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              spawnAbilityEntity_2: {
                                action: {
                                  kind: 'spawnAbilityEntity',
                                  parameters: {
                                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                                    childSkillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1',
                                    inheritActionBlackboard: true,
                                    dieWhenSourceDies: false,
                                  },
                                },
                                next: null,
                              },
                              spawnAbilityEntity_1: {
                                action: {
                                  kind: 'spawnAbilityEntity',
                                  parameters: {
                                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                                    childSkillId:
                                      'chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3',
                                    inheritActionBlackboard: true,
                                    dieWhenSourceDies: false,
                                  },
                                },
                                next: null,
                              },
                              conditional_3: {
                                action: {
                                  kind: 'conditional',
                                  parameters: {
                                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                                    alwaysNext: true,
                                  },
                                  whenTrue: { $sequence: 'spawnAbilityEntity_1' },
                                  whenFalse: { $sequence: 'spawnAbilityEntity_2' },
                                },
                                next: null,
                              },
                            },
                            dataNodes: {
                              data_1: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
                              },
                              data_2: {
                                type: 'boolean',
                                expression: {
                                  kind: 'actionValueCompare',
                                  left: { kind: 'valueNode', nodeId: 'data_1' },
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
              switch_12: {
                action: {
                  kind: 'switch',
                  parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
                  options: [
                    {
                      value: { kind: 'constant', value: 0 },
                      sequence: { $sequence: 'withActionBlackboardScope_5' },
                    },
                    {
                      value: { kind: 'constant', value: 1 },
                      sequence: { $sequence: 'withActionBlackboardScope_5' },
                    },
                    {
                      value: { kind: 'constant', value: 3 },
                      sequence: { $sequence: 'findCharacterTeamTargets_9' },
                    },
                    {
                      value: { kind: 'constant', value: 2 },
                      sequence: { $sequence: 'withActionBlackboardScope_11' },
                    },
                  ],
                },
                next: null,
              },
              findCharacterTeamTargets_13: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: { saveToContextKey: 'team', selection: { kind: 'allOperators' } },
                },
                next: null,
              },
              heal_14: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: 'currentTarget',
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                    attribute: 'will',
                    multiplier: { kind: 'valueNode', nodeId: 'data_2' },
                    addition: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                },
                next: null,
              },
              repeatEachTick_15: {
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
                  body: { $sequence: 'heal_14' },
                },
                next: null,
              },
              forEachContextTarget_16: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { contextKey: 'team' },
                  body: { $sequence: 'repeatEachTick_15' },
                },
                next: null,
              },
              changeResourceByActionValue_17: {
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
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'comboType' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_static_value' },
              },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0038_purrche_combo_item_1: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'infinite' },
      maxStackingCount: 1,
      childSkills: {
        chr_0038_purrche_ultimate_skill_abilityrange_blackhole: {
          actionGraph: {
            main: {
              nodes: {
                dealDamage_1: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_ultimate_skill_abilityrange_blackhole/actionGraph/main/nodes/dealDamage_1/action',
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_2: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_ultimate_skill_abilityrange_blackhole/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                repeatEachTick_4: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 },
                    },
                    body: { $sequence: 'dealDamage_3' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0038_purrche_ultimate_skill_abilityrange_blackhole',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            { startFrame: 56, endFrame: 59, sequence: { $sequence: 'dealDamage_1' } },
            {
              startFrame: 64,
              endFrame: 67,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_2' },
            },
            { startFrame: 0, endFrame: 56, sequence: { $sequence: 'repeatEachTick_4' } },
          ],
        },
        chr_0038_purrche_combo_skill_abilityrange_1_1: {
          actionGraph: {
            main: {
              nodes: {
                dealDamage_1: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1/actionGraph/main/nodes/dealDamage_1/action',
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_2: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['comboSkill'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                repeatEachTick_4: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 },
                    },
                    body: { $sequence: 'dealDamage_3' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            { startFrame: 56, endFrame: 59, sequence: { $sequence: 'dealDamage_1' } },
            {
              startFrame: 64,
              endFrame: 67,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_2' },
            },
            { startFrame: 0, endFrame: 56, sequence: { $sequence: 'repeatEachTick_4' } },
          ],
        },
        chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3: {
          actionGraph: {
            main: {
              nodes: {
                dealDamage_1: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3/actionGraph/main/nodes/dealDamage_1/action',
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_2: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['comboSkill'],
                    },
                    key: 'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                repeatEachTick_4: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 },
                    },
                    body: { $sequence: 'dealDamage_3' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            { startFrame: 56, endFrame: 59, sequence: { $sequence: 'dealDamage_1' } },
            {
              startFrame: 64,
              endFrame: 67,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_2' },
            },
            { startFrame: 0, endFrame: 56, sequence: { $sequence: 'repeatEachTick_4' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default purrchena;
