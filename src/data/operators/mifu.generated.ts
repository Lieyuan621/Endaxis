/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const mifuChr_0031_mifu_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_8: {
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
      startTimeDilation_5: {
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
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_8' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_8' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_8' },
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
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_11' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_12',
      },
      repeatEachTick_14: {
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
      modifyActionValue_18: {
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
      modifyActionValue_19: {
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
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'modifyActionValue_18' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_19',
      },
      reachSkillOperableBoundary_29: {
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
  element: 'physical',
  blackboard: {
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
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'modifyActionValue_16' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 17, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_29' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0031_mifu_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack1ActionGraph,
};

export const mifuChr_0031_mifu_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_4: {
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
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      repeatEachTick_7: {
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
          body: { $sequence: 'dealDamage_6' },
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
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_10',
      },
      repeatEachTick_12: {
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
          body: { $sequence: 'dealDamage_11' },
        },
        next: null,
      },
      reachSkillOperableBoundary_13: {
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
  key: 'chr_0031_mifu_attack2',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.3],
    atk_scale2: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 16, endFrame: 19, sequence: { $sequence: 'repeatEachTick_12' } },
    { startFrame: 21, endFrame: 67, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0031_mifu_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack2ActionGraph,
};

export const mifuChr_0031_mifu_attack3ActionGraph = {
  main: {
    nodes: {
      dealDamage_11: {
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
      repeatEachTick_12: {
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
          body: { $sequence: 'dealDamage_11' },
        },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_12',
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
        next: 'modifyActionValue_13',
      },
      startTimeDilation_19: {
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
      startTimeDilation_16: {
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
      switch_21: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_2' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_16' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_16' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_19' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_19' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_19' },
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
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_24: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_23',
      },
      repeatEachTick_25: {
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
      startTimeDilation_30: {
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
      startTimeDilation_28: {
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
      switch_33: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_2' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_28' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_30' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_30' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_16' },
            },
          ],
        },
        next: null,
      },
      modifyActionValue_34: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'switch_33',
      },
      ifElse_35: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'modifyActionValue_34' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_36: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_35',
      },
      repeatEachTick_37: {
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
          body: { $sequence: 'dealDamage_36' },
        },
        next: null,
      },
      modifyActionValue_38: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_37',
      },
      modifyActionValue_39: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_38',
      },
      modifyActionValue_41: {
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
      modifyActionValue_42: {
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
      ifElse_43: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'modifyActionValue_41' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_42',
      },
      reachSkillOperableBoundary_80: {
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
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
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
  element: 'physical',
  blackboard: {
    atk_scale1: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    atk_scale2: [0.31, 0.34, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.69],
    hit_target: 0,
    hitstop_times: 0,
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
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'modifyActionValue_14' } },
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'modifyActionValue_27' } },
    { startFrame: 30, endFrame: 33, sequence: { $sequence: 'modifyActionValue_39' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 30, endFrame: 31, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 37, endFrame: 76, sequence: { $sequence: 'reachSkillOperableBoundary_80' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0031_mifu_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack3ActionGraph,
};

export const mifuChr_0031_mifu_attack4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_4: {
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
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      repeatEachTick_7: {
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
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      changeResource_9: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_10: {
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
        next: 'changeResource_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_12: {
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
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
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
  key: 'chr_0031_mifu_attack4',
  element: 'physical',
  blackboard: {
    atb: 28,
    atk_scale1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale2: [0.72, 0.79, 0.86, 0.93, 1, 1.07, 1.14, 1.22, 1.29, 1.38, 1.48, 1.61],
    poise: 25,
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
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 30, endFrame: 30, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 38, endFrame: 99, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0031_mifu_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_attack4ActionGraph,
};

export const mifuChr_0031_mifu_plunging_attack_endActionGraph = {
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
            damageType: 'physical',
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

export const mifuChr_0031_mifu_plunging_attack_end: SkillDefinition = {
  key: 'chr_0031_mifu_plunging_attack_end',
  element: 'physical',
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
  scheduledSequences: [{ startFrame: 2, endFrame: 7, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: mifuChr_0031_mifu_plunging_attack_endActionGraph,
};

export const mifuChr_0031_mifu_powerattackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_5: {
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
      dealDamage_8: {
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
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_11: {
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
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_11',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'dealDamage_12' },
          whenFalse: { $sequence: 'dealDamage_13' },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_16: {
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
        next: null,
      },
      dealDamage_17: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_16',
      },
      gainFinisherSp_19: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'dealDamage_17' },
          whenFalse: { $sequence: 'dealDamage_18' },
        },
        next: 'gainFinisherSp_19',
      },
      applyBuff_21: {
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
      applyBuff_22: {
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
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0031_mifu_buffpause' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'dealDamage_8' },
          whenFalse: { $sequence: 'dealDamage_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 1 },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 1 },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_powerattack: SkillDefinition = {
  key: 'chr_0031_mifu_powerattack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 54,
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
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'startTimeDilation_5' } },
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 37, endFrame: 37, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 0, endFrame: 53, sequence: { $sequence: 'applyBuff_21' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'applyBuff_22' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'applyBuff_23' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: mifuChr_0031_mifu_powerattackActionGraph,
};

export const mifuChr_0031_mifu_normalskill_1ActionGraph = {
  main: {
    nodes: {
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0031_mifu_comboprocess' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
          },
        },
        next: null,
      },
      changeResource_17: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 50 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      forEachContextTarget_21: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_20: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 105 },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_18',
      },
      ifElse_22: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'jumpTimeline_20' },
          whenFalse: { $sequence: 'forEachContextTarget_21' },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'ifElse_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'ifElse_23',
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'applyBuff_24',
      },
      checkCondition_26: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'dealDamage_25',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_26',
      },
      markCurrentSkillCanInterrupt_28: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      applyBuff_37: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0031_mifu_normalskill_2' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      jumpTimeline_38: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 204 },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
        },
        next: null,
      },
      findTargets_opt1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
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
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_3: {
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
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_19' } },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: {
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
      data_8: {
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
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_normalskill_1: SkillDefinition = {
  key: 'chr_0031_mifu_normalskill_1',
  element: 'physical',
  blackboard: { atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5] },
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
    { startFrame: 11, endFrame: 38, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 105, endFrame: 156, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'findTargets_opt1' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'changeResource_17' } },
    { startFrame: 7, endFrame: 12, sequence: { $sequence: 'checkCondition_27' } },
    { startFrame: 25, endFrame: 31, sequence: { $sequence: 'markCurrentSkillCanInterrupt_28' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_37' } },
    { startFrame: 104, endFrame: 104, sequence: { $sequence: 'jumpTimeline_38' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: mifuChr_0031_mifu_normalskill_1ActionGraph,
};

export const mifuChr_0031_mifu_normalskill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0031_mifu_normalskill_2'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0031_mifu_comboprocess' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_3'],
          },
        },
        next: null,
      },
      finishBuffsById_11: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0031_mifu_comboprocess'],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_18: {
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
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_18',
      },
      checkCondition_20: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'dealDamage_19',
      },
      readBuffStackCount_24: {
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
      applyBuff_25: {
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
      startTimeDilation_26: {
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
        next: 'applyBuff_25',
      },
      dealDamage_27: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'startTimeDilation_26',
      },
      applyPhysicalInfliction_28: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: true,
          },
        },
        next: 'dealDamage_27',
      },
      forEachContextTarget_29: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'readBuffStackCount_24' },
        },
        next: 'applyPhysicalInfliction_28',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'forEachContextTarget_29',
      },
      startTimeDilation_31: {
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
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0031_mifu_listen_crush' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'finishBuffsById_11',
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      checkCondition_opt3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'ifElse_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
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
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_8: {
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

export const mifuChr_0031_mifu_normalskill_2: SkillDefinition = {
  normalSkillSubType: 'additionalNormalSkill',
  key: 'chr_0031_mifu_normalskill_2',
  element: 'physical',
  blackboard: {
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
    atk_scale2: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.68, 0.73, 0.79],
    poise: 5,
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
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'finishBuffsById_6' } },
    { startFrame: 28, endFrame: 129, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'checkCondition_opt3' } },
    { startFrame: 3, endFrame: 3, sequence: { $sequence: 'checkCondition_20' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'checkCondition_20' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'checkCondition_30' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_31' } },
    { startFrame: 22, endFrame: 27, sequence: { $sequence: 'applyBuff_32' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 50 }],
  icon: 'endaxis:operators/mifu/battle_02',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: mifuChr_0031_mifu_normalskill_2ActionGraph,
};

export const mifuChr_0031_mifu_normalskill_3ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0031_mifu_comboprocess'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_11: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0031_mifu_normalskill_3'],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_14: {
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
      startTimeDilation_13: {
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
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_13' },
          whenFalse: { $sequence: 'startTimeDilation_14' },
        },
        next: null,
      },
      dealStagger_16: {
        action: {
          kind: 'dealStagger',
          parameters: {
            value: { kind: 'valueNode', nodeId: 'data_2' },
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_15',
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'dealStagger_16',
      },
      startTimeDilation_20: {
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
      startTimeDilation_19: {
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
      dealStagger_21: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      ifElse_22: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_19' },
          whenFalse: { $sequence: 'startTimeDilation_20' },
        },
        next: 'dealStagger_21',
      },
      modifyActionValue_27: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: null,
      },
      modifyActionValue_28: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmulti',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_27',
      },
      modifyActionValue_29: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmultiadd_talent_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_28',
      },
      modifyActionValue_30: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'crushmulti',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_29',
      },
      anyCondition_25: {
        action: {
          kind: 'anyCondition',
          parameters: {},
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_9' },
          ],
        },
        next: null,
      },
      checkCondition_26: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'anyCondition_25',
      },
      dealDamage_31: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_12' },
            tags: [],
            features: ['canBreakWeakness', 'physicalInfliction'],
          },
        },
        next: null,
      },
      ifElse_32: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'modifyActionValue_30' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_31',
      },
      modifyActionValue_33: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'ifElse_32',
      },
      readSkillSettingData_34: {
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
        next: 'modifyActionValue_33',
      },
      modifyActionValue_35: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'readSkillSettingData_34',
      },
      applyBuff_36: {
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
      forEachContextTarget_37: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'modifyActionValue_35' },
        },
        next: 'applyBuff_36',
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'finishBuffsById_4',
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      checkCondition_opt3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'ifElse_opt2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 10 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 10 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'crushmulti' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'crushmultiadd_talent_runtime' },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'crushmultiadd_talent' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'poiseCompare',
          target: 'enemy',
          returnValueIfMissing: false,
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_9: {
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
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_runtime' } },
      data_13: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_26' } },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'yuanshi_multi' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_16: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_17: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_18: {
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

export const mifuChr_0031_mifu_normalskill_3: SkillDefinition = {
  normalSkillSubType: 'additionalNormalSkill',
  key: 'chr_0031_mifu_normalskill_3',
  element: 'physical',
  blackboard: {
    atk_scale: [4, 4.16, 4.32, 4.48, 4.64, 4.8, 4.96, 5.12, 5.28, 5.48, 5.72, 6],
    atk_scale_runtime: 0,
    crushmulti: 1,
    crushmultiadd_talent: 0,
    crushmultiadd_talent_runtime: 0,
    poise: 5,
    talent: 0,
    yuanshi_multi: 1,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 241,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'checkCondition_opt3' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'finishBuffsById_11' } },
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'checkCondition_17' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'ifElse_22' } },
    { startFrame: 26, endFrame: 26, sequence: { $sequence: 'forEachContextTarget_37' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 50 }],
  icon: 'endaxis:operators/mifu/battle_03',
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
            buffs: [{ buffId: 'buff_chr_0031_mifu_buffpause' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
            buffs: [{ buffId: 'buff_chr_0031_mifu_normalskill_2' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      startTimeDilation_6: {
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
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_6',
      },
      applyPhysicalInfliction_8: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 0.8 },
            height: { kind: 'constant', value: 1.2 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyPhysicalInfliction_8',
      },
      startTimeDilation_10: {
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
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'constant', value: 0 },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'dealDamage_11',
      },
      startTimeDilation_13: {
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
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'startTimeDilation_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      hideUi_16: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_17: {
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
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_ultimate_skill: SkillDefinition = {
  key: 'chr_0031_mifu_ultimate_skill',
  element: 'physical',
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
    { startFrame: 75, endFrame: 75, sequence: { $sequence: 'checkCondition_9' } },
    { startFrame: 98, endFrame: 98, sequence: { $sequence: 'checkCondition_12' } },
    { startFrame: 102, endFrame: 102, sequence: { $sequence: 'dealDamage_14' } },
    { startFrame: 0, endFrame: 118, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 71, sequence: { $sequence: 'hideUi_16' } },
    { startFrame: 0, endFrame: 71, sequence: { $sequence: 'startUltimateTimeDilation_17' } },
  ],
  defaultTarget: 'enemy',
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
            buffs: [{ buffId: 'buff_chr_0031_mifu_normalskill_2' }],
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
            buffs: [{ buffId: 'buff_chr_0031_mifu_comboprocess' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
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
                buffId: 'buff_chr_0031_mifu_potential_addattack',
                copiedBlackboardAssignments: {
                  addattack_effect: 'potential_addattack_effect',
                  addattack_duraion: 'potential_addattack_duration',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setGlobalCooldown_7: {
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
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0031_mifu_shield',
                copiedBlackboardAssignments: {
                  duration: 'talent_shield_duration',
                  FinalShield: 'talent_shield_maxhp',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'setGlobalCooldown_7',
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'talent_shield_maxhp',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'applyBuff_8',
      },
      storeSourceAttributeValue_10: {
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
        next: 'modifyActionValue_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyBuff_4' },
          whenFalse: { $sequence: null },
        },
        next: 'storeSourceAttributeValue_10',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_5',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'ifElse_11' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_20: {
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
      checkCondition_21: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'startTimeDilation_20',
      },
      dealDamage_22: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'checkCondition_21',
      },
      startTimeDilation_23: {
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
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'startTimeDilation_23',
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'checkCondition_24',
      },
      startTimeDilation_26: {
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
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'startTimeDilation_26',
      },
      modifyActionValue_29: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_time',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: null,
      },
      modifyActionValue_30: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_effect',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'modifyActionValue_29',
      },
      changeResource_32: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_16' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'changeResource_32' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_34: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_18' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: 'ifElse_33',
      },
      applyBuff_35: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0031_mifu_vulnerablephysic_comboskill',
                copiedBlackboardAssignments: { duration: 'final_time', rate: 'final_effect' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'dealDamage_34',
      },
      ifElse_36: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'modifyActionValue_30' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_35',
      },
      modifyActionValue_37: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_time',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: 'ifElse_36',
      },
      modifyActionValue_38: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_effect',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_22' },
          },
        },
        next: 'modifyActionValue_37',
      },
      startTimeDilation_39: {
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
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'caster',
          markerId: 'buff_chr_0031_mifu_shield',
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_5' } },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'talent', fallback: 0 } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_6' } },
      },
      data_10: {
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
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_12: {
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
      data_13: {
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
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'extra_time' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'extra_effect' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_17: { type: 'boolean', expression: { kind: 'skillHasHit' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mifuChr_0031_mifu_combo_skill: SkillDefinition = {
  key: 'chr_0031_mifu_combo_skill',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    atk_scale2: [0.51, 0.56, 0.61, 0.66, 0.71, 0.77, 0.82, 0.87, 0.92, 0.98, 1.06, 1.15],
    duration: 16,
    extra_effect: 0,
    extra_time: 0,
    final_effect: 0,
    final_time: 0,
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_12' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_22' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_25' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'checkCondition_27' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'modifyActionValue_38' } },
    { startFrame: 0, endFrame: 8, sequence: { $sequence: 'startTimeDilation_39' } },
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const mifuComboCondition1ActionGraph = {
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
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: false,
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
  sequence: { $sequence: 'checkCondition_3' },
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
    icon: 'endaxis:icons/icon_battle_buff_def_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
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
            buffs: [{ buffId: 'buff_chr_0031_mifu_normalskill_3' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'setGlobalCooldown_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_5',
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
      sequence: { $sequence: 'checkCondition_6' },
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
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'setCurrentBuffTimePaused_2',
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'setCurrentBuffTimePaused_4',
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
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: ['Skill/Character/chr_0031_mifu/normalskill_2'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'finishBuffsById_1' }] },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  skillSlotReplacements: [
    {
      skillSlotKey: 'battleSkill',
      targetSkillKey: 'chr_0031_mifu_normalskill_2',
      revertedSkillKey: 'chr_0031_mifu_normalskill_1',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: mifuBuff4ActionGraph,
};

const mifuBuff5ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'setCurrentBuffTimePaused_2',
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'setCurrentBuffTimePaused_4',
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
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: ['Skill/Character/chr_0031_mifu/normalskill_3'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'finishBuffsById_1' }] },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  skillSlotReplacements: [
    {
      skillSlotKey: 'battleSkill',
      targetSkillKey: 'chr_0031_mifu_normalskill_3',
      revertedSkillKey: 'chr_0031_mifu_normalskill_1',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: mifuBuff5ActionGraph,
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
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
    icon: 'endaxis:icons/icon_battle_shield',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/Common/HpShield'],
  extendTags: [],
  blackboard: { duration: 8, FinalShield: 1000 },
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
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_physical',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
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
    icon: 'endaxis:icons/icon_battle_buff_def_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15, rate: 0.25 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: mifuBuff8ActionGraph,
};

export const mifu: OperatorDefinition = {
  slug: 'mifu',
  gameId: 'MIFU',
  rarity: 6,
  weaponType: 'claym',
  element: 'physical',
  characterTypeId: 'Physical',
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
      operationType: 'basicAttack',
      skills: [
        mifuChr_0031_mifu_attack1,
        mifuChr_0031_mifu_attack2,
        mifuChr_0031_mifu_attack3,
        mifuChr_0031_mifu_attack4,
      ],
    },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: mifuChr_0031_mifu_plunging_attack_end,
    },
    { key: 'finisher', operationType: 'finisher', skills: mifuChr_0031_mifu_powerattack },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: mifuChr_0031_mifu_normalskill_1,
      placementSequenceSkillKeys: [
        'chr_0031_mifu_normalskill_1',
        'chr_0031_mifu_normalskill_2',
        'chr_0031_mifu_normalskill_3',
      ],
      replacementSkills: [mifuChr_0031_mifu_normalskill_2, mifuChr_0031_mifu_normalskill_3],
    },
    { key: 'ultimate', operationType: 'ultimate', skills: mifuChr_0031_mifu_ultimate_skill },
    { key: 'comboSkill', operationType: 'comboSkill', skills: mifuChr_0031_mifu_combo_skill },
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
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
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
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'talent_shield_hppercent',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'talent_shield_duration',
          operation: 'assign',
          value: [10, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
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
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'extra_effect',
          operation: 'assign',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'extra_time',
          operation: 'assign',
          value: 4,
        },
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0031_mifu_combo_skill', frames: -60 },
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
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'talent_shield_cd',
          operation: 'add',
          value: -15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'talent_shield_duration',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
          blackboardKey: 'potential_addattack_effect',
          operation: 'assign',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_combo_skill',
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
          skillKey: 'chr_0031_mifu_ultimate_skill',
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
          skillKey: 'chr_0031_mifu_ultimate_skill',
          blackboardKey: 'poise2',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_normalskill_1',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
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
