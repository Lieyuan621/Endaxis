/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const mifuChr_0031_mifu_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      switch_6: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_2' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_2' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
          ],
        },
        next: null,
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'switch_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_7' },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_8',
      },
      repeatEachTick_10: {
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
          body: { $sequence: 'dealDamage_9' },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_10',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
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
            key: 'hitstop_times',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_13' },
        },
        next: 'modifyActionValue_14',
      },
      reachSkillOperableBoundary_22: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0031_mifu_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hitstop_times' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_attack1: SkillDefinition = {
  key: 'chr_0031_mifu_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.47, 0.51, 0.54, 0.57, 0.61, 0.65, 0.7, 0.76],
    hit_target: 0,
    hitstop_times: 0,
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 196,
  exclusiveFrame: 27,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 38, input: 'basicAttack', targetSkillId: 'chr_0031_mifu_attack2' },
    ],
    allowedNextSkills: [{ startFrame: 17, endFrame: 38, skillIds: ['chr_0031_mifu_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'modifyActionValue_12' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'conditional_15' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'conditional_15' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'conditional_15' } },
    { startFrame: 17, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_22' } },
  ],
  timelineContinuationSkillId: 'chr_0031_mifu_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack1ActionGraph,
};

export const mifuChr_0031_mifu_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  value: 0,
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      repeatEachTick_4: {
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
          body: { $sequence: 'dealDamage_3' },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_6',
      },
      repeatEachTick_8: {
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
          body: { $sequence: 'dealDamage_7' },
        },
        next: null,
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0031_mifu_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_attack2: SkillDefinition = {
  actionGraph: mifuChr_0031_mifu_attack2ActionGraph,
  key: 'chr_0031_mifu_attack2',
  blackboard: {
    atb: 0,
    atk_scale1: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.3],
    atk_scale2: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
    display_atk_scale: [0.38, 0.42, 0.46, 0.5, 0.54, 0.57, 0.61, 0.65, 0.69, 0.74, 0.79, 0.86],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 217,
  exclusiveFrame: 29,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 67, input: 'basicAttack', targetSkillId: 'chr_0031_mifu_attack3' },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 67, skillIds: ['chr_0031_mifu_attack3'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'repeatEachTick_4' } },
    { startFrame: 16, endFrame: 19, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 21, endFrame: 67, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0031_mifu_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mifuChr_0031_mifu_attack3ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
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
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_3',
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
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
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_2' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_6' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_6' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
          ],
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'switch_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_11' },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_12',
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
          body: { $sequence: 'dealDamage_13' },
        },
        next: null,
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_15',
      },
      startTimeDilation_19: {
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
        next: null,
      },
      startTimeDilation_17: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      switch_21: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_17' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_19' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_19' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_6' },
            },
          ],
        },
        next: null,
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'switch_21',
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_22' },
        },
        next: null,
      },
      dealDamage_24: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_23',
      },
      repeatEachTick_25: {
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
          body: { $sequence: 'dealDamage_24' },
        },
        next: null,
      },
      modifyActionValue_26: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_25',
      },
      modifyActionValue_27: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_26',
      },
      modifyActionValue_28: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_29: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      conditional_30: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_28' },
        },
        next: 'modifyActionValue_29',
      },
      reachSkillOperableBoundary_58: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0031_mifu_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'hitstop_times' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'hitstop_times' } },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_attack3: SkillDefinition = {
  key: 'chr_0031_mifu_attack3',
  blackboard: {
    atb: 0,
    atk_scale1: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    atk_scale2: [0.31, 0.34, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.69],
    hit_target: 0,
    hitstop_times: 0,
    display_atk_scale: [0.61, 0.67, 0.73, 0.79, 0.85, 0.91, 0.97, 1.03, 1.09, 1.16, 1.26, 1.36],
  },
  timelineBlockFrames: 37,
  naturalDurationFrames: 425,
  exclusiveFrame: 54,
  offsetRecordFrame: 16,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 76, input: 'basicAttack', targetSkillId: 'chr_0031_mifu_attack4' },
    ],
    allowedNextSkills: [{ startFrame: 37, endFrame: 76, skillIds: ['chr_0031_mifu_attack4'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'modifyActionValue_4' } },
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'modifyActionValue_16' } },
    { startFrame: 30, endFrame: 33, sequence: { $sequence: 'modifyActionValue_27' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 30, endFrame: 31, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'conditional_30' } },
    { startFrame: 37, endFrame: 76, sequence: { $sequence: 'reachSkillOperableBoundary_58' } },
  ],
  timelineContinuationSkillId: 'chr_0031_mifu_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack3ActionGraph,
};

export const mifuChr_0031_mifu_attack4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      repeatEachTick_4: {
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
          body: { $sequence: 'dealDamage_3' },
        },
        next: null,
      },
      changeResourceByActionValue_5: {
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
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  value: 0,
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
        next: 'changeResourceByActionValue_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_7',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0031_mifu_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_attack4: SkillDefinition = {
  actionGraph: mifuChr_0031_mifu_attack4ActionGraph,
  key: 'chr_0031_mifu_attack4',
  blackboard: {
    atb: 28,
    atk_scale1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale2: [0.72, 0.79, 0.86, 0.93, 1, 1.07, 1.14, 1.22, 1.29, 1.38, 1.48, 1.61],
    poise: 25,
    display_atk_scale: [0.77, 0.84, 0.92, 0.99, 1.07, 1.15, 1.22, 1.3, 1.38, 1.47, 1.59, 1.72],
  },
  timelineBlockFrames: 38,
  naturalDurationFrames: 280,
  exclusiveFrame: 54,
  offsetRecordFrame: 30,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 99, input: 'basicAttack', targetSkillId: 'chr_0031_mifu_attack1' },
    ],
    allowedNextSkills: [{ startFrame: 38, endFrame: 99, skillIds: ['chr_0031_mifu_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'repeatEachTick_4' } },
    { startFrame: 30, endFrame: 30, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 38, endFrame: 99, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0031_mifu_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mifuChr_0031_mifu_plunging_attack_endActionGraph = {
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

export const mifuChr_0031_mifu_plunging_attack_end: SkillDefinition = {
  actionGraph: mifuChr_0031_mifu_plunging_attack_endActionGraph,
  key: 'chr_0031_mifu_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 206,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 12, endFrame: 21, skillIds: ['chr_0009_azrila_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [{ startFrame: 2, endFrame: 7, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mifuChr_0031_mifu_powerattackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7471619,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
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
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.3,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.8024494,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.530997,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 5.061995,
                  outTangent: 5.061995,
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
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_3',
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
            durationSeconds: { kind: 'constant', value: 0.23 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.7007455,
                  value: 0,
                  inTangent: 0,
                  outTangent: 1.670819,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.341638,
                  outTangent: 3.341638,
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
        next: 'gainFinisherSp_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_6',
      },
      applyBuff_8: {
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
      applyBuff_9: {
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
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_buffpause',
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

export const mifuChr_0031_mifu_powerattack: SkillDefinition = {
  actionGraph: mifuChr_0031_mifu_powerattackActionGraph,
  key: 'chr_0031_mifu_powerattack',
  blackboard: {
    atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9],
    atk_scale2: 0.58,
  },
  timelineBlockFrames: 38,
  naturalDurationFrames: 282,
  exclusiveFrame: 53,
  offsetRecordFrame: 26,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 38,
        endFrame: 67,
        skillIds: [
          'chr_0031_mifu_combo_skill',
          'chr_0031_mifu_normalskill_1',
          'chr_0031_mifu_normalskill_2',
          'chr_0031_mifu_normalskill_3',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 37, endFrame: 37, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 53, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'applyBuff_10' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const mifuChr_0031_mifu_normalskill_1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
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
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 50 },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      forEachContextTarget_6: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_5: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 105 } },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_5' },
          whenFalse: { $sequence: 'forEachContextTarget_6' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_opt2: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'conditional_opt1',
      },
      dealDamage_opt3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_opt2',
      },
      markCurrentSkillCanInterrupt_12: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'effect_z_scale',
            operation: 'divide',
            value: { kind: 'constant', value: 8 },
          },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'effect_z_scale',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'effect_z_scale',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_14',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      jumpTimeline_18: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 204 } },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_normalskill_1: SkillDefinition = {
  key: 'chr_0031_mifu_normalskill_1',
  blackboard: {
    atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    effect_z_scale: 1,
  },
  timelineBlockFrames: 11,
  naturalDurationFrames: 203,
  exclusiveFrame: 125,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 131,
        input: 'basicAttack',
        targetSkillId: 'chr_0031_mifu_attack2',
      },
    ],
    allowedNextSkills: [
      { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_normalskill_2'] },
      { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_normalskill_2'] },
      { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_attack2'] },
      { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_attack2'] },
      { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_powerattack'] },
      { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_powerattack'] },
      { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_combo_skill'] },
      { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_combo_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 11, endFrame: 38, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 105, endFrame: 156, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'findCharacterTeamTargets_3' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'changeResourceByActionValue_4' } },
    { startFrame: 7, endFrame: 12, sequence: { $sequence: 'dealDamage_opt3' } },
    { startFrame: 25, endFrame: 31, sequence: { $sequence: 'markCurrentSkillCanInterrupt_12' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'modifyActionValue_15' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_17' } },
    { startFrame: 104, endFrame: 104, sequence: { $sequence: 'jumpTimeline_18' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: mifuChr_0031_mifu_normalskill_1ActionGraph,
};

export const mifuChr_0031_mifu_normalskill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_normalskill_2'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_3'],
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_comboprocess'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'finishBuffsById_3' },
        },
        next: null,
      },
      readBuffStackCount_12: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
        },
        next: null,
      },
      applyBuff_13: {
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
      startTimeDilation_14: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
                  inTangent: 3.945662,
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
        next: 'applyBuff_13',
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'startTimeDilation_14',
      },
      applyPhysicalInfliction_16: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
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
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
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
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
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
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'knockback',
                iconPath: '/icons/knockback.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
              extendTags: [],
              blackboard: {
                atk_scale: 1,
                count: 0,
                dmg_multiplier: 1,
                duration: 3,
                ignore_hit_effect: 0,
              },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_18' } },
              actionGraph: {
                main: {
                  nodes: {
                    dealDamage_1: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                        },
                      },
                      next: null,
                    },
                    finishBuffsById_2: {
                      action: {
                        kind: 'finishBuffsById',
                        parameters: {
                          target: 'buffOwner',
                          buffIds: ['buff_physical_no_guard'],
                          reason: 'early',
                        },
                      },
                      next: 'dealDamage_1',
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
                      next: 'finishBuffsById_2',
                    },
                    readSkillSettingData_4: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [3, 4.5, 6, 7.5],
                              column: { kind: 'valueNode', nodeId: 'data_3' },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'modifyActionValue_3',
                    },
                    readBuffStackCount_5: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_4',
                    },
                    applyBuff_6: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_7: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_8: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 15,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
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
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_10: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.25 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
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
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.5 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_12: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.65 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    switch_13: {
                      action: {
                        kind: 'switch',
                        parameters: {
                          choice: { kind: 'valueNode', nodeId: 'data_4' },
                          alwaysNext: true,
                        },
                        options: [
                          {
                            value: { kind: 'constant', value: 0 },
                            sequence: { $sequence: 'startTimeDilation_8' },
                          },
                          {
                            value: { kind: 'constant', value: 1 },
                            sequence: { $sequence: 'startTimeDilation_9' },
                          },
                          {
                            value: { kind: 'constant', value: 2 },
                            sequence: { $sequence: 'startTimeDilation_10' },
                          },
                          {
                            value: { kind: 'constant', value: 3 },
                            sequence: { $sequence: 'startTimeDilation_11' },
                          },
                          {
                            value: { kind: 'constant', value: 4 },
                            sequence: { $sequence: 'startTimeDilation_12' },
                          },
                        ],
                      },
                      next: null,
                    },
                    conditional_14: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        whenTrue: { $sequence: 'switch_13' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_15: {
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
                        body: { $sequence: 'conditional_14' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_16: {
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
                        body: { $sequence: 'igniteBuffs_7' },
                      },
                      next: 'withActionBlackboardScope_15',
                    },
                    withActionBlackboardScope_17: {
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
                        body: { $sequence: 'applyBuff_6' },
                      },
                      next: 'withActionBlackboardScope_16',
                    },
                    withActionBlackboardScope_18: {
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
                        body: { $sequence: 'readBuffStackCount_5' },
                      },
                      next: 'withActionBlackboardScope_17',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'dmg_multiplier' },
                    },
                    data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_5: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
                    },
                    data_6: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_5' },
                        operator: 'less',
                        right: { kind: 'constant', value: 0.5 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: true,
          },
        },
        next: 'dealDamage_15',
      },
      forEachContextTarget_17: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'readBuffStackCount_12' },
        },
        next: 'applyPhysicalInfliction_16',
      },
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 99999 },
            slot: 'TimeDilation/Layer/Entity/VisualAdjust',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1.25,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1.25,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: ['caster'],
          },
        },
        next: null,
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_listen_crush',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      startTimeDilation_opt1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
                  inTangent: 3.945662,
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
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_opt1',
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_normalskill_2: SkillDefinition = {
  key: 'chr_0031_mifu_normalskill_2',
  blackboard: {
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
    atk_scale2: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.68, 0.73, 0.79],
    poise: 5,
    potential: 0,
    stack: 4,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 150,
  exclusiveFrame: 34,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_normalskill_3'] },
      { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_powerattack'] },
      { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_combo_skill'] },
      {
        startFrame: 28,
        endFrame: 62,
        skillIds: [
          'chr_0031_mifu_attack1',
          'chr_0031_mifu_attack2',
          'chr_0031_mifu_attack3',
          'chr_0031_mifu_attack4',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 28, endFrame: 129, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 3, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'dealDamage_opt2' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'forEachContextTarget_17' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_19' } },
    { startFrame: 22, endFrame: 27, sequence: { $sequence: 'applyBuff_20' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 50 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: mifuChr_0031_mifu_normalskill_2ActionGraph,
};

export const mifuChr_0031_mifu_normalskill_3ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_comboprocess'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'finishBuffsById_1' },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_normalskill_3'],
            reason: 'other',
          },
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
                  value: 0,
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
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.16 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  value: 0,
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
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
          whenFalse: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      dealStagger_8: {
        action: {
          kind: 'dealStagger',
          parameters: {
            value: { kind: 'valueNode', nodeId: 'data_3' },
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_7',
      },
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08888 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.7513477,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
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
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06666 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.7513477,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
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
        next: null,
      },
      dealStagger_12: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_4' } },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: 'startTimeDilation_11' },
        },
        next: 'dealStagger_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmulti',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmultiadd_talent_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmulti',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_16',
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: [],
            features: ['canBreakWeakness', 'physicalInfliction'],
          },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_17' },
        },
        next: 'dealDamage_18',
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'conditional_19',
      },
      readSkillSettingData_21: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [1, 1, 1, 1],
                column: { kind: 'constant', value: 1 },
                storeKey: 'yuanshi_multi',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'modifyActionValue_20',
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'readSkillSettingData_21',
      },
      applyBuff_23: {
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
      forEachContextTarget_24: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'modifyActionValue_22' },
        },
        next: 'applyBuff_23',
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'Ifmoveto',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: true }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_25' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 10 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 10 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'crushmulti' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'crushmultiadd_talent_runtime' },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'crushmultiadd_talent' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_runtime' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'talent', fallback: 0 } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'poiseCompare',
          target: 'enemy',
          returnValueIfMissing: false,
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'any',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'conditionNode', nodeId: 'data_13' },
          ],
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_11' },
            { kind: 'conditionNode', nodeId: 'data_14' },
          ],
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'yuanshi_multi' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_normalskill_3: SkillDefinition = {
  key: 'chr_0031_mifu_normalskill_3',
  blackboard: {
    atk_scale: [4, 4.16, 4.32, 4.48, 4.64, 4.8, 4.96, 5.12, 5.28, 5.48, 5.72, 6],
    atk_scale_runtime: 0,
    crushmulti: 1,
    crushmultiadd_talent: 0,
    crushmultiadd_talent_runtime: 0,
    Ifmoveto: 0,
    poise: 5,
    potential: 0,
    talent: 0,
    yuanshi_multi: 1,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 241,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'finishBuffsById_4' } },
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'dealStagger_8' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'conditional_13' } },
    { startFrame: 26, endFrame: 26, sequence: { $sequence: 'forEachContextTarget_24' } },
    { startFrame: 21, endFrame: 23, sequence: { $sequence: 'conditional_opt1' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 50 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: mifuChr_0031_mifu_normalskill_3ActionGraph,
};

export const mifuChr_0031_mifu_ultimate_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_buffpause',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.596829,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.480337,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: -0.5423906,
                  outTangent: -0.5423906,
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
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_3',
      },
      applyPhysicalInfliction_5: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
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
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
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
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
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
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
                        },
                      },
                      next: null,
                    },
                    dealDamage_2: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_5: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
                        },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_6: {
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
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
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
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
                    },
                    withActionBlackboardScope_8: {
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
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
                    },
                    withActionBlackboardScope_9: {
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
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'constant', value: 0.8 },
            height: { kind: 'constant', value: 1.2 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_4',
      },
      startTimeDilation_7: {
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
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
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
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'constant', value: 0 },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_7',
      },
      startTimeDilation_10: {
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
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: -3.065404,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3262213,
                  value: 0,
                  inTangent: -0.1830944,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
                  value: 0,
                  inTangent: 0,
                  outTangent: -0.5801874,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.945662,
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
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'startTimeDilation_10',
      },
      applyBuff_12: {
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
      hideUi_13: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_ultimate_skill: SkillDefinition = {
  key: 'chr_0031_mifu_ultimate_skill',
  blackboard: {
    atk_scale: [0.9, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03],
    atk_scale2: [2.21, 2.43, 2.65, 2.87, 3.09, 3.31, 3.54, 3.76, 3.98, 4.25, 4.58, 4.97],
    poise2: 20,
  },
  timelineBlockFrames: 113,
  naturalDurationFrames: 249,
  exclusiveFrame: 118,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_powerattack'] },
      { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_normalskill_2'] },
      { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_normalskill_3'] },
      { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_combo_skill'] },
      {
        startFrame: 113,
        endFrame: 124,
        skillIds: [
          'chr_0031_mifu_attack1',
          'chr_0031_mifu_attack2',
          'chr_0031_mifu_attack3',
          'chr_0031_mifu_attack4',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 105, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 102, endFrame: 102, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 75, endFrame: 75, sequence: { $sequence: 'applyPhysicalInfliction_5' } },
    { startFrame: 98, endFrame: 98, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 102, endFrame: 102, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 0, endFrame: 118, sequence: { $sequence: 'applyBuff_12' } },
    { startFrame: 0, endFrame: 71, sequence: { $sequence: 'hideUi_13' } },
    { startFrame: 0, endFrame: 71, sequence: { $sequence: 'startUltimateTimeDilation_14' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: mifuChr_0031_mifu_ultimate_skillActionGraph,
};

export const mifuChr_0031_mifu_combo_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_potential_addattack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              addattack_effect: 'potential_addattack_effect',
              addattack_duraion: 'potential_addattack_duration',
            },
          },
        },
        next: null,
      },
      setGlobalCooldown_4: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'caster',
            markerId: 'buff_chr_0031_mifu_shield',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_shield',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'talent_shield_duration',
              FinalShield: 'talent_shield_maxhp',
            },
          },
        },
        next: 'setGlobalCooldown_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'talent_shield_maxhp',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'applyBuff_5',
      },
      storeSourceAttributeValue_7: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'maxHealth' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'talent_shield_maxhp',
          },
        },
        next: 'modifyActionValue_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: 'storeSourceAttributeValue_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'Ifmoveto',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.7500001,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
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
        next: null,
      },
      startTimeDilation_16: {
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
                  value: 0,
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
        next: null,
      },
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
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
                  time: 0.7,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.481606,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.333333,
                  outTangent: 3.333333,
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
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_time',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: null,
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_effect',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'modifyActionValue_21',
      },
      changeResourceByActionValue_23: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_12' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_23' },
        },
        next: null,
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_15' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'conditional_24',
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_vulnerablephysic_comboskill',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'final_time', rate: 'final_effect' },
          },
        },
        next: 'dealDamage_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_22' },
        },
        next: 'applyBuff_26',
      },
      modifyActionValue_28: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_time',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: 'conditional_27',
      },
      modifyActionValue_29: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_effect',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'modifyActionValue_28',
      },
      startTimeDilation_30: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.36666 },
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
      dealDamage_opt1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_21' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_13',
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_22' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_16',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'talent_shield_cd' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'talent_shield_hppercent' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'talent', fallback: 0 } },
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
          kind: 'globalCooldownPresent',
          target: 'caster',
          markerId: 'buff_chr_0031_mifu_shield',
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_7' } },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
          ],
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'extra_time' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'extra_effect' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: '__endaxis_native_skill_has_hit' },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential', fallback: 0 },
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
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_combo_skill: SkillDefinition = {
  key: 'chr_0031_mifu_combo_skill',
  blackboard: {
    atk_scale1: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    atk_scale2: [0.51, 0.56, 0.61, 0.66, 0.71, 0.77, 0.82, 0.87, 0.92, 0.98, 1.06, 1.15],
    duration: 16,
    extra_effect: 0,
    extra_time: 0,
    final_effect: 0,
    final_time: 0,
    Ifmoveto: 0,
    poise: 10,
    potential: 0,
    potential_addattack_duration: 0,
    potential_addattack_effect: 0,
    rate: 0.05,
    talent: 0,
    talent_shield_cd: 0,
    talent_shield_duration: 0,
    talent_shield_hppercent: 0,
    talent_shield_maxhp: 0,
    usp: 10,
    __endaxis_native_skill_has_hit: 0,
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 211,
  exclusiveFrame: 41,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 35, endFrame: 73, skillIds: ['chr_0031_mifu_powerattack'] },
      {
        startFrame: 35,
        endFrame: 73,
        skillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
      },
      {
        startFrame: 35,
        endFrame: 73,
        skillIds: [
          'chr_0031_mifu_attack1',
          'chr_0031_mifu_attack2',
          'chr_0031_mifu_attack3',
          'chr_0031_mifu_attack4',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 35, endFrame: 73, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 2, endFrame: 8, sequence: { $sequence: 'modifyActionValue_10' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_opt1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_opt2' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'startTimeDilation_19' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'modifyActionValue_29' } },
    { startFrame: 0, endFrame: 8, sequence: { $sequence: 'startTimeDilation_30' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: mifuChr_0031_mifu_combo_skillActionGraph,
};

export const mifuCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: mifuCommon_character_perfect_dodgeActionGraph,
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

const mifuComboCondition1ActionGraph = {
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
          kind: 'contextTargetBuffIdStackCompare',
          contextKey: 'trigger',
          buffIds: ['buff_physical_no_guard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 3 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0031_mifu_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: mifuComboCondition1ActionGraph,
};

const mifuBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_down',
    iconPath: '/icons/icon_battle_buff_def_down.webp',
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
  applyTags: [],
  extendTags: [],
  blackboard: { def: 0, dur: 0, prob: 0 },
  attributeModifiers: [],
  actionGraph: mifuBuff1ActionGraph,
};

const mifuBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: mifuBuff2ActionGraph,
};

const mifuBuff3ActionGraph = {
  main: {
    nodes: {
      setGlobalCooldown_1: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0031_mifu_listen_crush',
            durationSeconds: { kind: 'constant', value: 0.1 },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0031_mifu_normalskill_3',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'setGlobalCooldown_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_5' },
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
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 3 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0031_mifu_listen_crush',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_2' } },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'originSkillTypeIn', skillTypes: ['battleSkill'] },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventPhysicalInflictionTypeIn', types: ['crush'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff3: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    {
      event: 'beforeOutputPhysicalInfliction',
      priority: 0,
      sequence: { $sequence: 'conditional_6' },
    },
  ],
  actionGraph: mifuBuff3ActionGraph,
};

const mifuBuff4ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0031_mifu_normalskill_3'],
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 15,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_up',
    iconPath: '/icons/icon_battle_buff_def_up.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
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
  applyTags: ['Skill/Character/chr_0031_mifu/normalskill_2'],
  extendTags: [],
  blackboard: { def: 0, dur: 0, prob: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'finishBuffsById_1' } },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: mifuBuff4ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0031_mifu_normalskill_2',
      revertedSkillKey: 'chr_0031_mifu_normalskill_1',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
};

const mifuBuff5ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0031_mifu_normalskill_2'],
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff5: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 15,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_up',
    iconPath: '/icons/icon_battle_buff_def_up.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
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
  applyTags: ['Skill/Character/chr_0031_mifu/normalskill_3'],
  extendTags: [],
  blackboard: { def: 0, dur: 0, prob: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'finishBuffsById_1' } },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: mifuBuff5ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0031_mifu_normalskill_3',
      revertedSkillKey: 'chr_0031_mifu_normalskill_1',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
};

const mifuBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'addattack_duraion' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
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
  blackboard: { addattack_duraion: 0, addattack_effect: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'addattack_effect' } },
  ],
  actionGraph: mifuBuff6ActionGraph,
};

const mifuBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: ['Skill/Character/Common/HpShield'],
  extendTags: [],
  blackboard: { duration: 8, extraattack: 0, FinalShield: 1000, potential_5: 0, shelter: 0 },
  attributeModifiers: [],
  shields: [
    {
      infinityValue: false,
      value: { blackboardKey: 'FinalShield' },
      damageAbsorptions: [],
      absorbCount: -1,
      absorbAllDamageWhenConsumed: false,
      removeBuffWhenConsumed: true,
      priority: 'normal',
      replaceHitEffect: true,
    },
  ],
  actionGraph: mifuBuff7ActionGraph,
};

const mifuBuff8ActionGraph = {
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
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mifuBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_down',
    iconPath: '/icons/icon_battle_buff_def_down.webp',
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
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15, rate: 0.25 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: mifuBuff8ActionGraph,
};

export const mifu: OperatorDefinition = {
  slug: 'mifu',
  gameId: 'MIFU',
  rarity: 6,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [22, 54, 88, 122, 156, 173],
    agility: [10, 27, 46, 65, 83, 92],
    intellect: [9, 27, 45, 63, 81, 90],
    will: [14, 37, 60, 84, 107, 119],
    baseAttack: [30, 91, 155, 219, 283, 315],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        mifuChr_0031_mifu_attack1,
        mifuChr_0031_mifu_attack2,
        mifuChr_0031_mifu_attack3,
        mifuChr_0031_mifu_attack4,
      ],
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: mifuChr_0031_mifu_plunging_attack_end,
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: mifuChr_0031_mifu_powerattack,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: mifuChr_0031_mifu_normalskill_1,
      placementSequenceSkillKeys: [
        'chr_0031_mifu_normalskill_1',
        'chr_0031_mifu_normalskill_2',
        'chr_0031_mifu_normalskill_3',
      ],
      replacementSkills: [mifuChr_0031_mifu_normalskill_2, mifuChr_0031_mifu_normalskill_3],
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: mifuChr_0031_mifu_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: mifuChr_0031_mifu_combo_skill,
    },
  ],
  dodgeSkill: mifuCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0031_mifu_normalskill_1',
      replacementSkillKeys: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0031_mifu_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0031_mifu_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0031_mifu_attack1',
        'chr_0031_mifu_attack2',
        'chr_0031_mifu_attack3',
        'chr_0031_mifu_attack4',
        'chr_0031_mifu_plunging_attack_end',
        'chr_0031_mifu_powerattack',
      ],
      normalAttackSkillKeys: [
        'chr_0031_mifu_attack1',
        'chr_0031_mifu_attack2',
        'chr_0031_mifu_attack3',
        'chr_0031_mifu_attack4',
      ],
      defaultSkillKey: 'chr_0031_mifu_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [mifuComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'crushmultiadd_talent',
          operation: 'assign',
          value: [0.1, 0.2],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_hppercent',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_duration',
          operation: 'assign',
          value: [10, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_cd',
          operation: 'assign',
          value: [60, 60],
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extra_effect',
          operation: 'assign',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extra_time',
          operation: 'assign',
          value: 4,
        },
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_cd',
          operation: 'add',
          value: -15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_duration',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_addattack_effect',
          operation: 'assign',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_addattack_duration',
          operation: 'assign',
          value: 20,
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
          blackboardKey: 'poise2',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_1',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_normalskill_1_moveto: 0 },
  buffDefinitions: {
    buff_chr_0031_mifu_buffpause: mifuBuff1,
    buff_chr_0031_mifu_comboprocess: mifuBuff2,
    buff_chr_0031_mifu_listen_crush: mifuBuff3,
    buff_chr_0031_mifu_normalskill_2: mifuBuff4,
    buff_chr_0031_mifu_normalskill_3: mifuBuff5,
    buff_chr_0031_mifu_potential_addattack: mifuBuff6,
    buff_chr_0031_mifu_shield: mifuBuff7,
    buff_chr_0031_mifu_vulnerablephysic_comboskill: mifuBuff8,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default mifu;
