/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const siChr_0036_jsspsi_attack1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstopcount',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      startTimeDilation_5: {
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
        next: 'modifyActionValue_4',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_8',
      },
      repeatEachTick_10: {
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
          body: { $sequence: 'dealDamage_9' },
        },
        next: null,
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstopcount1',
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
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'modifyActionValue_12',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_13' },
        },
        next: null,
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_15' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_17: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_16',
      },
      repeatEachTick_18: {
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
          body: { $sequence: 'dealDamage_17' },
        },
        next: null,
      },
      reachSkillOperableBoundary_19: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0036_jsspsi_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstopcount', fallback: 0 },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstopcount1', fallback: 0 },
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
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_attack1: SkillDefinition = {
  key: 'chr_0036_jsspsi_attack1',
  element: 'cryo',
  blackboard: {
    atk_scale1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale2: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    hitstopcount: 0,
    hitstopcount1: 0,
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 170,
  exclusiveFrame: 21,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0036_jsspsi_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 25, skillIds: ['chr_0036_jsspsi_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'repeatEachTick_10' } },
    { startFrame: 15, endFrame: 18, sequence: { $sequence: 'repeatEachTick_18' } },
    { startFrame: 20, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_19' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0036_jsspsi_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_attack1ActionGraph,
};

export const siChr_0036_jsspsi_attack2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstopcount',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.067 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'modifyActionValue_6',
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
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
          parameters: { skillIds: ['chr_0036_jsspsi_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstopcount', fallback: 0 },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_attack2: SkillDefinition = {
  key: 'chr_0036_jsspsi_attack2',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.32, 0.35, 0.38, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.66, 0.72],
    hitstopcount: 0,
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 205,
  exclusiveFrame: 35,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0036_jsspsi_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 13, endFrame: 28, skillIds: ['chr_0036_jsspsi_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 9, sequence: { $sequence: 'repeatEachTick_12' } },
    { startFrame: 13, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0036_jsspsi_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_attack2ActionGraph,
};

export const siChr_0036_jsspsi_attack3ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstopcount',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      startTimeDilation_6: {
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
        next: 'modifyActionValue_5',
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      repeatEachTick_11: {
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
          body: { $sequence: 'dealDamage_10' },
        },
        next: null,
      },
      reachSkillOperableBoundary_12: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0036_jsspsi_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstopcount', fallback: 0 },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_attack3: SkillDefinition = {
  key: 'chr_0036_jsspsi_attack3',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.29, 0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.53, 0.56, 0.61, 0.66],
    hitstopcount: 0,
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 160,
  exclusiveFrame: 22,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0036_jsspsi_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 33, skillIds: ['chr_0036_jsspsi_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'repeatEachTick_11' } },
    { startFrame: 12, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0036_jsspsi_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_attack3ActionGraph,
};

export const siChr_0036_jsspsi_attack4ActionGraph = {
  main: {
    nodes: {
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
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
              maxCountPerTarget: 6,
              targetTriggerIntervalSeconds: 0.1,
            },
          },
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0036_jsspsi_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_attack4: SkillDefinition = {
  key: 'chr_0036_jsspsi_attack4',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.04, 0.04, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 552,
  exclusiveFrame: 34,
  offsetRecordFrame: 26,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 34,
        input: 'basicAttack',
        targetSkillId: 'chr_0036_jsspsi_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 26, endFrame: 34, skillIds: ['chr_0036_jsspsi_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 40, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 26, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0036_jsspsi_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_attack4ActionGraph,
};

export const siChr_0036_jsspsi_attack5ActionGraph = {
  main: {
    nodes: {
      changeResource_9: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      startTimeDilation_10: {
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
        next: 'changeResource_9',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_10' },
        },
        next: null,
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'ifElse_12' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_17',
      },
      mergeContextTargets_19: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_18',
      },
      reachSkillOperableBoundary_21: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0036_jsspsi_attack1'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'mergeContextTargets_19' },
          whenFalse: { $sequence: 'mergeContextTargets_19' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstopcount', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_attack5: SkillDefinition = {
  key: 'chr_0036_jsspsi_attack5',
  element: 'cryo',
  blackboard: {
    atb: 20,
    atk_scale: [0.64, 0.7, 0.77, 0.83, 0.9, 0.96, 1.02, 1.09, 1.15, 1.23, 1.33, 1.44],
    hitstopcount: 0,
    poise: 18,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 189,
  exclusiveFrame: 31,
  offsetRecordFrame: 25,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 52,
        input: 'basicAttack',
        targetSkillId: 'chr_0036_jsspsi_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 31, endFrame: 52, skillIds: ['chr_0036_jsspsi_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 31, endFrame: 52, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0036_jsspsi_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_attack5ActionGraph,
};

export const siChr_0036_jsspsi_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.07,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
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
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.13,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
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
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'endmin_powerattack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'gainFinisherSp_5',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.7,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_7',
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
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_power_attack: SkillDefinition = {
  key: 'chr_0036_jsspsi_power_attack',
  element: 'cryo',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 207,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 39,
        endFrame: 50,
        skillIds: ['chr_0036_jsspsi_normal_skill', 'chr_0036_jsspsi_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 3, endFrame: 5, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 21, endFrame: 23, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 37, endFrame: 39, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_10' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: siChr_0036_jsspsi_power_attackActionGraph,
};

export const siChr_0036_jsspsi_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      changeResource_2: {
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
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'changeResource_2',
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_plunging_attack_ayao' }],
            targets: { kind: 'context', key: 'ayao3' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_22: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_plunging_attack_ayao' }],
            targets: { kind: 'context', key: 'ayao2' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_21',
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_plunging_attack_ayao' }],
            targets: { kind: 'context', key: 'ayao1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_22',
      },
      switch_24: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_3' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'applyBuff_23' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'applyBuff_23' } },
          ],
        },
        next: null,
      },
      switch_25: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_4' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'switch_24' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'switch_24' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'switch_24' } },
          ],
        },
        next: null,
      },
      storeRandomInteger_26: {
        action: {
          kind: 'storeRandomInteger',
          parameters: {
            key: 'ayao_pos2',
            minimum: { kind: 'constant', value: 1 },
            maximum: { kind: 'constant', value: 3 },
          },
        },
        next: 'switch_25',
      },
      storeRandomInteger_27: {
        action: {
          kind: 'storeRandomInteger',
          parameters: {
            key: 'ayao_pos1',
            minimum: { kind: 'constant', value: 1 },
            maximum: { kind: 'constant', value: 4 },
          },
        },
        next: 'storeRandomInteger_26',
      },
      spawnAbilityEntity_28: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos1' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_plunging_attack_ayao',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ayao3',
          },
        },
        next: 'storeRandomInteger_27',
      },
      spawnAbilityEntity_29: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos1' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_plunging_attack_ayao',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ayao2',
          },
        },
        next: 'spawnAbilityEntity_28',
      },
      spawnAbilityEntity_30: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos1' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_plunging_attack_ayao',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ayao1',
          },
        },
        next: 'spawnAbilityEntity_29',
      },
      createSpatialPointTargets_31: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos4', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_30',
      },
      createSpatialPointTargets_32: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos3', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_31',
      },
      createSpatialPointTargets_33: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_32',
      },
      createSpatialPointTargets_34: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_33',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'ayao_pos2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'ayao_pos1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_plunging_attack_end: SkillDefinition = {
  key: 'chr_0036_jsspsi_plunging_attack_end',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    ayao_pos1: 1,
    ayao_pos2: 1,
    display_atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 9,
  naturalDurationFrames: 175,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 9, endFrame: 20, skillIds: ['chr_0036_jsspsi_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 1, endFrame: 4, sequence: { $sequence: 'createSpatialPointTargets_34' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: siChr_0036_jsspsi_plunging_attack_endActionGraph,
};

export const siChr_0036_jsspsi_normal_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ink_damage_rate',
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
            key: 'EntityBB_ink_boom_range',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_1',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_issoulfinish',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_havesoul',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ink_boom_poise',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ink_damage',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_5',
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos1' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_normal_skill_1',
            childSkillId: 'chr_0036_jsspsi_normal_skill_abilityrange_1',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'normal',
            blackboardAssignments: {
              EntityBB_atk_scale: { kind: 'valueNode', nodeId: 'data_4' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_static_duration: { kind: 'valueNode', nodeId: 'data_6' },
              EntityBB_ink_damage_rate: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_poise: { kind: 'valueNode', nodeId: 'data_7' },
            },
          },
        },
        next: null,
      },
      createSpatialPointTargets_16: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_15',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage_rate' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ink_boom_range' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'ink_boom_poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'static_duration' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_normal_skill: SkillDefinition = {
  key: 'chr_0036_jsspsi_normal_skill',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.44, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    duration: 20,
    ink_boom_poise: 5,
    ink_boom_range: 0,
    ink_damage_rate: [0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.1, 0.1, 0.1, 0.11, 0.12, 0.13],
    poise: 5,
    static_duration: 1,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 168,
  exclusiveFrame: 35,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 34, endFrame: 53, skillIds: ['chr_0036_jsspsi_normal_skill_1'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'modifyActionValue_6' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'createSpatialPointTargets_16' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: siChr_0036_jsspsi_normal_skillActionGraph,
};

export const siChr_0036_jsspsi_normal_skill_1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_issoulfinish',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_1',
      },
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'mainCharacter' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soul_target',
          },
        },
        next: 'modifyActionValue_2',
      },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_check'],
            reason: 'other',
          },
        },
        next: null,
      },
      changeSkillSlot_8: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
            revertedSkillKey: 'chr_0036_jsspsi_normal_skill',
          },
        },
        next: 'finishBuffsById_7',
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_12: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'soul_target' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill',
            childSkillId: 'chr_0036_jsspsi_normal_skill_abilityrange',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'soul_target' },
            saveToContextKey: 'normalskill',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_bufftime: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: 'applyBuff_11',
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'changeSkillSlot_8' },
        },
        next: null,
      },
      findTargets_opt3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'mainCharacter' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soul_target',
          },
        },
        next: 'ifElse_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'soul_hpmax' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'soulbufftime' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'soul_target' },
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

export const siChr_0036_jsspsi_normal_skill_1: SkillDefinition = {
  normalSkillSubType: 'additionalNormalSkill',
  key: 'chr_0036_jsspsi_normal_skill_1',
  element: 'cryo',
  blackboard: { soul_hpmax: 0, soulbufftime: 0 },
  timelineBlockFrames: 31,
  naturalDurationFrames: 178,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 22, endFrame: 41, skillIds: ['chr_0036_jsspsi_normal_skill_2'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findTargets_3' } },
    { startFrame: 1, endFrame: 3, sequence: { $sequence: 'findTargets_opt3' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_12' } },
  ],
  defaultTarget: 'owner',
  costs: [{ resource: 'sp', value: 15 }],
  icon: 'endaxis:operators/si/battle_02',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: siChr_0036_jsspsi_normal_skill_1ActionGraph,
};

export const siChr_0036_jsspsi_normal_skill_2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_check'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_inkboom_camera' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_2',
      },
      changeSkillSlot_4: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'applyBuff_3',
      },
      findTargets_5: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soul_target',
          },
        },
        next: 'changeSkillSlot_4',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_inkboom' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_inkboom' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: true,
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
          target: { kind: 'owner' },
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

export const siChr_0036_jsspsi_normal_skill_2: SkillDefinition = {
  normalSkillSubType: 'additionalNormalSkill',
  key: 'chr_0036_jsspsi_normal_skill_2',
  element: 'cryo',
  blackboard: {},
  timelineBlockFrames: 46,
  naturalDurationFrames: 168,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: { allowedNextSkills: [{ startFrame: 9, endFrame: 38, skillIds: [] }] },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findTargets_5' } },
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'applyBuff_6' } },
  ],
  defaultTarget: 'owner',
  switchToBuffCast: {
    condition: { kind: 'conditionNode', nodeId: 'data_1' },
    asSkillCast: true,
    sequence: { $sequence: 'applyBuff_1' },
  },
  icon: 'endaxis:operators/si/battle_03',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: siChr_0036_jsspsi_normal_skill_2ActionGraph,
};

export const siChr_0036_jsspsi_combo_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_qizi_absorb',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_9',
      },
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos3' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill_inklong01',
            childSkillId: 'chr_0036_jsspsi_combo_skill_abilityrange_1',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'smart_target' },
            saveToContextKey: 'combolong1',
          },
        },
        next: 'modifyActionValue_10',
      },
      createSpatialPointTargets_12: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos3', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_11',
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'pos2' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_normal_skill',
            childSkillId: 'chr_0036_jsspsi_combo_skill_abilityrange',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'smart_target' },
            saveToContextKey: 'combolong',
            blackboardAssignments: {
              EntityBB_combo_count: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_atk_scale: { kind: 'valueNode', nodeId: 'data_2' },
              EntityBB_usp: { kind: 'valueNode', nodeId: 'data_3' },
              EntityBB_poise: { kind: 'valueNode', nodeId: 'data_4' },
              EntityBB_atk_scale2: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_atk_scale2_1: { kind: 'valueNode', nodeId: 'data_6' },
              EntityBB_potential5: { kind: 'valueNode', nodeId: 'data_7' },
              EntityBB_potential2_base: { kind: 'valueNode', nodeId: 'data_8' },
              EntityBB_potential2_enhance: { kind: 'valueNode', nodeId: 'data_9' },
              EntityBB_potential2_duration: { kind: 'valueNode', nodeId: 'data_10' },
            },
          },
        },
        next: 'createSpatialPointTargets_12',
      },
      createSpatialPointTargets_14: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_13',
      },
      mergeContextTargets_15: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'smart_target',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'createSpatialPointTargets_14',
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_obtain_ultimate_sp',
                blackboardAssignments: { ratio: { kind: 'constant', value: 1 } },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_26',
      },
      startTimeDilation_28: {
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
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'mergeContextTargets_15' },
          whenFalse: { $sequence: 'mergeContextTargets_15' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'createSpatialPointTargets_14' },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_count' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2_1' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'potential5' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'potential2_base' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'potential2_enhance' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'potential2_duration' } },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_12: {
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
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_combo_skill: SkillDefinition = {
  key: 'chr_0036_jsspsi_combo_skill',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale2: [1.556, 1.711, 1.867, 2.022, 2.178, 2.333, 2.489, 2.644, 2.8, 2.994, 3.228, 3.5],
    atk_scale2_1: [0.44, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    atk_scale2_2: 0,
    atk_scale2_3: 0,
    poise: 10,
    potential2_base: 0,
    potential2_duration: 0,
    potential2_enhance: 0,
    potential5: 0,
    usp: 10,
    potential2_display: 0,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 228,
  exclusiveFrame: 35,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 20,
        endFrame: 81,
        skillIds: ['chr_0036_jsspsi_normal_skill', 'chr_0036_jsspsi_normal_skill_1'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'checkCondition_27' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'startTimeDilation_28' } },
  ],
  smartTarget: 'input',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: siChr_0036_jsspsi_combo_skillActionGraph,
};

export const siChr_0036_jsspsi_ultimate_skillActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill',
            childSkillId: 'chr_0036_jsspsi_ultimate_skill_abilityrange_1',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'dazhao',
            blackboardAssignments: {
              EntityBB_enhance_final: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_enhance_duration: { kind: 'valueNode', nodeId: 'data_2' },
              EntityBB_atk_scale: { kind: 'valueNode', nodeId: 'data_3' },
              EntityBB_poise: { kind: 'valueNode', nodeId: 'data_4' },
              EntityBB_atk_scale_2: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_poise_2: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: null,
      },
      spawnAbilityEntity_2: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill',
            childSkillId: 'chr_0036_jsspsi_ultimate_skill_abilityrange',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'dazhao',
            blackboardAssignments: {
              EntityBB_enhance_final: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_enhance_duration: { kind: 'valueNode', nodeId: 'data_2' },
              EntityBB_atk_scale: { kind: 'valueNode', nodeId: 'data_3' },
              EntityBB_poise: { kind: 'valueNode', nodeId: 'data_4' },
              EntityBB_atk_scale_2: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_poise_2: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'spawnAbilityEntity_2' },
          whenFalse: { $sequence: 'spawnAbilityEntity_3' },
        },
        next: null,
      },
      startUltimateTimeDilation_5: {
        action: {
          kind: 'startUltimateTimeDilation',
          parameters: {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [{ kind: 'context', contextKey: 'dazhao' }],
          },
        },
        next: null,
      },
      hideUi_6: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_7: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_final' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise_2' } },
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_ultimate_skill: SkillDefinition = {
  key: 'chr_0036_jsspsi_ultimate_skill',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.18, 0.2, 0.21, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.34, 0.37, 0.4],
    atk_scale_2: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    enhance_duration: 12,
    enhance_final: [0.2, 0.21, 0.22, 0.24, 0.25, 0.26, 0.28, 0.29, 0.3, 0.32, 0.34, 0.36],
    poise: 0,
    poise_2: 20,
  },
  timelineBlockFrames: 86,
  naturalDurationFrames: 214,
  exclusiveFrame: 85,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 64,
        endFrame: 85,
        skillIds: [
          'chr_0036_jsspsi_normal_skill',
          'chr_0036_jsspsi_combo_skill',
          'chr_0036_jsspsi_normal_skill_1',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_4' } },
    { startFrame: 0, endFrame: 58, sequence: { $sequence: 'startUltimateTimeDilation_5' } },
    { startFrame: 0, endFrame: 59, sequence: { $sequence: 'hideUi_6' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_7' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 900,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: siChr_0036_jsspsi_ultimate_skillActionGraph,
};

export const siChr_0036_jsspsi_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const siChr_0036_jsspsi_perfect_dodge: SkillDefinition = {
  actionGraph: siChr_0036_jsspsi_perfect_dodgeActionGraph,
  key: 'chr_0036_jsspsi_perfect_dodge',
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

const siComboCondition1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_count_tmp',
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
            key: 'EntityBB_combo_count',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'modifyActionValue_2',
      },
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_combo_skill_layercount',
                copiedBlackboardAssignments: { combo_ui_duration: 'EntityBB_combo_ui_duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setBuffRemainingDuration_6: {
        action: {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_combo_skill_layercount'] },
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'setBuffRemainingDuration_6' },
          whenFalse: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'checkCondition_3' },
          whenFalse: { $sequence: 'modifyActionValue_4' },
        },
        next: 'ifElse_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'ifElse_9',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count_tmp' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count_tmp', fallback: 0 },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffEnhanceLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          outputKey: 'EntityBB_combo_count_tmp',
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_ui_duration' },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_combo_skill_layercount'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_1' } },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellInflict/FireInflict',
            'Skill/Character/Common/SpellInflict/CrystInflict',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0036_jsspsi_combo_skill',
  event: 'buffAbsorbedFrameEnd',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_10' },
  actionGraph: siComboCondition1ActionGraph,
};

const siComboCondition2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_count_tmp',
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
            key: 'EntityBB_combo_count',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'modifyActionValue_2',
      },
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_combo_skill_layercount',
                copiedBlackboardAssignments: { combo_ui_duration: 'EntityBB_combo_ui_duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setBuffRemainingDuration_6: {
        action: {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_combo_skill_layercount'] },
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'setBuffRemainingDuration_6' },
          whenFalse: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'checkCondition_3' },
          whenFalse: { $sequence: 'modifyActionValue_4' },
        },
        next: 'ifElse_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'ifElse_9',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count_tmp' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count_tmp', fallback: 0 },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_count', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffEnhanceLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          outputKey: 'EntityBB_combo_count_tmp',
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_combo_ui_duration' },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_combo_skill_layercount'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_1' } },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellInflict/FireInflict',
            'Skill/Character/Common/SpellInflict/CrystInflict',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0036_jsspsi_combo_skill',
  event: 'buffConsumedFrameEnd',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_10' },
  actionGraph: siComboCondition2ActionGraph,
};

const siBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff1: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_speedup',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  actionGraph: siBuff1ActionGraph,
};

const siBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_crystal',
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_fire',
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
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_final' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, enhance_final: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: siBuff2ActionGraph,
};

const siBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff3: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'potential2_duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { potential2_count: 0, potential2_duration: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'potential2_count' } },
  ],
  actionGraph: siBuff3ActionGraph,
};

const siBuff4ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'combo_ui_duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { combo_ui_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'modifyActionValue_1' }] },
  actionGraph: siBuff4ActionGraph,
};

const siBuff5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_soulback',
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
            key: 'EntityBB_normal_skill_id',
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

const siBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'modifyActionValue_2' }] },
  actionGraph: siBuff5ActionGraph,
};

const siBuff6ActionGraph = {
  main: {
    nodes: {
      finishOwner_4: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soulback' } },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_check'],
            reason: 'other',
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_6: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'finishBuffsById_5',
      },
      finishOwner_7: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'soul' } } },
        next: 'setCharacterPassiveUiValue_6',
      },
      findTargets_8: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'context', key: 'soul_target' },
            query: { kind: 'ownerSoul', owner: { kind: 'context', key: 'soul_target' } },
            saveToContextKey: 'soul',
          },
        },
        next: 'finishOwner_7',
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'soul_target' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
              'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
              'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay',
              'buff_chr_0036_jsspsi_train_inksoultarget',
            ],
            reason: 'other',
          },
        },
        next: 'findTargets_8',
      },
      findTargets_10: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'source' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soul_target',
          },
        },
        next: 'finishBuffsById_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'finishOwner_4' },
          whenFalse: { $sequence: null },
        },
        next: 'findTargets_10',
      },
      findOwnerSpawnedAbilityEntities_12: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_11',
      },
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_soul_timedisplay_jsspsiself'],
            reason: 'other',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_12',
      },
      changeSkillSlot_14: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'finishBuffsById_13',
      },
      changeSkillSlot_2: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill_1',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'specificTime',
            durationSeconds: { kind: 'constant', value: 99 },
          },
        },
        next: null,
      },
      changeSkillSlot_1: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill_2',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'specificTime',
            durationSeconds: { kind: 'constant', value: 99 },
          },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'skill_id_cur',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      switch_17: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_3' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'changeSkillSlot_1' } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'changeSkillSlot_2' } },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'changeSkillSlot_14' },
            },
          ],
        },
        next: 'modifyActionValue_16',
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'switch_17' },
        },
        next: null,
      },
      finishOwner_20: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soul_back' } },
        },
        next: null,
      },
      finishOwner_21: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'soul' } } },
        next: null,
      },
      findTargets_22: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'context', key: 'soultarget' },
            query: { kind: 'ownerSoul', owner: { kind: 'context', key: 'soultarget' } },
            saveToContextKey: 'soul',
          },
        },
        next: 'finishOwner_21',
      },
      setCharacterPassiveUiValue_23: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'findTargets_22',
      },
      finishOwner_24: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soul_display' } },
        },
        next: 'setCharacterPassiveUiValue_23',
      },
      findOwnerSpawnedAbilityEntities_25: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soul_display',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1'],
            owner: { kind: 'source' },
          },
        },
        next: 'finishOwner_24',
      },
      ifElse_26: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'finishOwner_20' },
          whenFalse: { $sequence: null },
        },
        next: 'findOwnerSpawnedAbilityEntities_25',
      },
      findOwnerSpawnedAbilityEntities_27: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soul_back',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_26',
      },
      finishBuffsById_28: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'soultarget' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_soul_timedisplay'],
            reason: 'other',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_27',
      },
      finishBuffsById_29: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'soultarget' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_xianjing_inkhurteffect'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_28',
      },
      modifyActionValue_30: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_inkmark_will_boom',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'finishBuffsById_29',
      },
      finishBuffsById_31: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_soul_timedisplay_jsspsiself'],
            reason: 'other',
          },
        },
        next: 'modifyActionValue_30',
      },
      changeSkillSlot_32: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battleSkill',
            targetSkillKey: 'chr_0036_jsspsi_normal_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'finishBuffsById_31',
      },
      modifyActionValue_33: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'changeSkillSlot_32',
      },
      findTargets_34: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soultarget',
          },
        },
        next: 'modifyActionValue_33',
      },
      checkCondition_35: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'findTargets_34',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_soulback', fallback: 0 },
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_normal_skill_id' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'skill_id_cur', fallback: 0 },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_normal_skill_id', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_5' },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'have_delay', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 99,
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { have_delay: 0, skill_id_cur: 3 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'ifElse_18' }],
    finish: [{ $sequence: 'checkCondition_35' }],
  },
  actionGraph: siBuff6ActionGraph,
};

const siBuff7ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishOwner_3: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: 'modifyActionValue_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'constant', value: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'finishOwner_3' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'ifElse_4' }] },
  actionGraph: siBuff7ActionGraph,
};

const siBuff8ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [
    'Skill/Character/chr_0036_jsspsi/soul/SoulBuff',
    'Immune/Damage',
    'Immune/Frozen',
    'Immune/Stunned',
    'Immune/Airborne',
    'Immune/KnockDown',
    'Immune/KnockBack',
    'Immune/Pull',
    'SelectCategory/UnSkillAutoSelectable',
    'SelectCategory/Unmarkable',
  ],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: siBuff8ActionGraph,
};

const siBuff9ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: -1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
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
            finishByAction: true,
            targets: ['caster'],
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'startTimeDilation_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Immune/Static'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    icon: 'endaxis:operators/si/battle_01',
    showInSquadIcon: true,
    nameKey: 'effects.name.immobilization',
  },
  applyTags: ['Skill/Character/Common/Affixes/static'],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: siBuff9ActionGraph,
};

const siBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: siBuff10ActionGraph,
};

const siBuff11ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_issoulfinish',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'modifyActionValue_1' }] },
  actionGraph: siBuff11ActionGraph,
};

const siBuff12ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
  blackboard: { ink_damage: 0, ink_poise: 0 },
  attributeModifiers: [],
  actionGraph: siBuff12ActionGraph,
};

const siBuff13ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_inkmark_will_boom',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff13: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'modifyActionValue_2' }] },
  actionGraph: siBuff13ActionGraph,
};

const siBuff14ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay_jsspsiself',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_jsspsi_inkmark',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.artfulIntent',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: siBuff14ActionGraph,
};

const siBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff15: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: { visible: true, showInHeadBarCommon: false, showInHeadBarAttached: false },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  actionGraph: siBuff15ActionGraph,
};

const siBuff16ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff16: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.9 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'finishOwner_1' }] },
  actionGraph: siBuff16ActionGraph,
};

const siBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff17: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration_speedup: 0, ratio_speed: 0 },
  attributeModifiers: [],
  actionGraph: siBuff17ActionGraph,
};

const siBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff18: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration_speedup: 0, ratio_speed: 0 },
  attributeModifiers: [],
  actionGraph: siBuff18ActionGraph,
};

const siBuff19ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_speedup',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_speedup' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff19: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_speedup' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_speedup',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_speedup: 0, ratio_speed: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: siBuff19ActionGraph,
};

const siBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { coolDown: 0 },
  attributeModifiers: [],
  actionGraph: siBuff20ActionGraph,
};

const siBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff21: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { coolDown: 0 },
  attributeModifiers: [],
  actionGraph: siBuff21ActionGraph,
};

const siBuff22ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff22: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_speedup',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: siBuff22ActionGraph,
};

const siBuff23ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishOwner_26: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soul_display' } },
        },
        next: 'modifyActionValue_25',
      },
      launchProjectile_27: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_ink_boom_poise: 0, EntityBB_ink_damage: 0 },
            entityAssignments: {
              EntityBB_ink_damage: { kind: 'valueNode', nodeId: 'data_1' },
              EntityBB_ink_boom_poise: { kind: 'valueNode', nodeId: 'data_2' },
            },
            emitters: { kind: 'context', contextKey: 'soul_display' },
            targets: { kind: 'context', contextKey: 'soul_display' },
            onlyHitTargets: { kind: 'context', key: 'benti' },
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 4.06666660308838,
          },
          callbacks: [
            {
              event: 'launch',
              skill: {
                skillId: 'chr_0036_jsspsi_normal_skill_inboom_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 122,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 1, endFrame: 2, sequence: { $sequence: 'ifElse_34' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      startTimeDilation_19: {
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
                      ifElse_25: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
                          whenTrue: { $sequence: 'startTimeDilation_19' },
                          whenFalse: { $sequence: 'startTimeDilation_19' },
                        },
                        next: null,
                      },
                      modifyActionValue_26: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_ink_damage',
                            operation: 'assign',
                            value: { kind: 'constant', value: 0 },
                          },
                        },
                        next: 'ifElse_25',
                      },
                      dealDamage_27: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'fixed',
                            attackScale: { kind: 'constant', value: 1 },
                            calculation: 'definite',
                            calculationValue: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'modifyActionValue_26',
                      },
                      setCharacterPassiveUiValue_28: {
                        action: {
                          kind: 'setCharacterPassiveUiValue',
                          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                        },
                        next: 'dealDamage_27',
                      },
                      mergeContextTargets_29: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'tar',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: 'setCharacterPassiveUiValue_28',
                      },
                      ifElse_33: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'mergeContextTargets_29' },
                          whenFalse: { $sequence: 'mergeContextTargets_29' },
                        },
                        next: null,
                      },
                      modifyActionValue_32: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_ink_damage',
                            operation: 'assign',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'ifElse_33',
                      },
                      ifElse_34: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'modifyActionValue_32' },
                          whenFalse: { $sequence: 'ifElse_33' },
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
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_damage' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_boom_poise' },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_damage', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'equal',
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
        next: 'finishOwner_26',
      },
      findOwnerSpawnedAbilityEntities_28: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soul_display',
            abilityEntityIds: [],
            owner: { kind: 'source' },
          },
        },
        next: 'launchProjectile_27',
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_talent1_speedup',
                copiedBlackboardAssignments: {
                  ratio_speed: 'ratio_speed',
                  duration_speedup: 'duration_speedup',
                },
              },
            ],
            targets: { kind: 'context', key: 'chrteam' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'source' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'source' } },
            saveToContextKey: 'chrteam',
          },
        },
        next: 'applyBuff_2',
      },
      readBuffBlackboard_4: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_2'] },
            desiredKey: 'duration_speedup',
            outputKey: 'duration_speedup',
          },
        },
        next: 'findTargets_3',
      },
      readBuffBlackboard_5: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_2'] },
            desiredKey: 'ratio_speed',
            outputKey: 'ratio_speed',
          },
        },
        next: 'readBuffBlackboard_4',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'readBuffBlackboard_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_1'] },
            desiredKey: 'duration_speedup',
            outputKey: 'duration_speedup',
          },
        },
        next: 'findTargets_3',
      },
      readBuffBlackboard_10: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_1'] },
            desiredKey: 'ratio_speed',
            outputKey: 'ratio_speed',
          },
        },
        next: 'readBuffBlackboard_9',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'readBuffBlackboard_10' },
          whenFalse: { $sequence: 'ifElse_11' },
        },
        next: null,
      },
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'benti' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_soul_timedisplay'],
            reason: 'other',
          },
        },
        next: 'ifElse_12',
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_damage',
                copiedBlackboardAssignments: {
                  ink_damage: 'EntityBB_ink_damage',
                  ink_poise: 'EntityBB_ink_boom_poise',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_issoulfinish',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_14',
      },
      finishOwner_16: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'soul' } } },
        next: 'modifyActionValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_soulback',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishOwner_16',
      },
      castSkillDuringAction_18: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'context', key: 'soulback' },
            skillId: 'chr_0036_jsspsi_normal_skill_inkmove_2',
            targetContextKey: 'benti',
            target: 'context',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_17',
      },
      setAbilityEntityRemainingDuration_19: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'soulback' },
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'castSkillDuringAction_18',
      },
      checkCondition_20: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'setAbilityEntityRemainingDuration_19',
      },
      findOwnerSpawnedAbilityEntities_21: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'owner' },
          },
        },
        next: 'checkCondition_20',
      },
      findTargets_22: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'benti',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_21',
      },
      findTargets_23: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'context', key: 'benti' },
            query: { kind: 'ownerSoul', owner: { kind: 'context', key: 'benti' } },
            saveToContextKey: 'soul',
          },
        },
        next: 'findTargets_22',
      },
      findTargets_24: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'benti',
          },
        },
        next: 'findTargets_23',
      },
      ifElse_29: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findOwnerSpawnedAbilityEntities_28' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_ink_damage' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_ink_boom_poise' },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_talent1_2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_talent1_1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: true,
          contextKey: 'benti',
          buffIds: ['buff_chr_0036_jsspsi_xianjing_inkhurteffect'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'findTargets_24' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff23: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 2, duration_speedup: 0, ratio_speed: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'ifElse_29' }] },
  actionGraph: siBuff23ActionGraph,
};

const siBuff24ActionGraph = {
  main: {
    nodes: {
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'context', key: 'benti' },
            query: { kind: 'ownerSoul', owner: { kind: 'context', key: 'benti' } },
            saveToContextKey: 'soul',
          },
        },
        next: null,
      },
      findTargets_4: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'benti',
          },
        },
        next: 'findTargets_3',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff24: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'findTargets_4' }] },
  actionGraph: siBuff24ActionGraph,
};

const siBuff25ActionGraph = {
  main: {
    nodes: {
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_train_inksoultarget' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'applyBuff_8',
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_check_unmarkable' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0036_jsspsi_normal_skill_check_unmarkable'],
            reason: 'other',
          },
        },
        next: null,
      },
      listenForTagQuery_3: {
        action: {
          kind: 'listenForTagQuery',
          parameters: {
            tags: ['SelectCategory/Unmarkable', 'GameplayState/TravelPole'],
            tagQueryType: 'hasAny',
            executeOnMatch: false,
            sequence: { $sequence: 'finishBuffsById_2' },
          },
        },
        next: null,
      },
      listenForTagQuery_4: {
        action: {
          kind: 'listenForTagQuery',
          parameters: {
            tags: ['SelectCategory/Unmarkable', 'GameplayState/TravelPole'],
            tagQueryType: 'hasAny',
            executeOnMatch: true,
            sequence: { $sequence: 'applyBuff_1' },
          },
        },
        next: 'listenForTagQuery_3',
      },
      refreshCurrentBuffAttributeModifiers_17: {
        action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
        next: null,
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'ink_damage_display',
            operation: 'assign',
            value: { kind: 'constant', value: 999 },
          },
        },
        next: 'refreshCurrentBuffAttributeModifiers_17',
      },
      setCharacterPassiveUiValue_21: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      ifElse_22: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_18' },
          whenFalse: { $sequence: null },
        },
        next: 'setCharacterPassiveUiValue_21',
      },
      setCharacterPassiveUiValue_20: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 1000 } },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'setCharacterPassiveUiValue_20' },
          whenFalse: { $sequence: 'ifElse_22' },
        },
        next: null,
      },
      modifyActionValue_24: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'ink_damage_display',
            operation: 'floor',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'ifElse_23',
      },
      calculateActionValue_25: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'ink_damage_display',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 10000 },
          },
        },
        next: 'modifyActionValue_24',
      },
      repeatEachTick_26: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: true,
              target: { kind: 'source' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'calculateActionValue_25' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_check_unmarkable' }],
            targets: { kind: 'context', key: 'soul1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findTargets_6: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'ownerSoul', owner: { kind: 'owner' } },
            saveToContextKey: 'soul1',
          },
        },
        next: 'applyBuff_5',
      },
      listenForTagQuery_7: {
        action: {
          kind: 'listenForTagQuery',
          parameters: {
            tags: ['SelectCategory/Unmarkable', 'GameplayState/TravelPole'],
            tagQueryType: 'hasAny',
            executeOnMatch: true,
            sequence: { $sequence: 'findTargets_6' },
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ink_damage',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      launchProjectile_11: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_ink_boom_poise: 0, EntityBB_ink_damage: 0 },
            entityAssignments: {
              EntityBB_ink_damage: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_ink_boom_poise: { kind: 'valueNode', nodeId: 'data_6' },
            },
            finish: 'firstTickReach',
            recycleDelaySeconds: 1.06666672229767,
          },
          callbacks: [
            {
              event: 'launch',
              skill: {
                skillId: 'chr_0036_jsspsi_normal_skill_inkmark_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 32,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 14, endFrame: 15, sequence: { $sequence: 'ifElse_33' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      startTimeDilation_18: {
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
                      ifElse_24: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
                          whenTrue: { $sequence: 'startTimeDilation_18' },
                          whenFalse: { $sequence: 'startTimeDilation_18' },
                        },
                        next: null,
                      },
                      modifyActionValue_25: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_ink_damage',
                            operation: 'assign',
                            value: { kind: 'constant', value: 0 },
                          },
                        },
                        next: 'ifElse_24',
                      },
                      dealDamage_26: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'fixed',
                            attackScale: { kind: 'constant', value: 1 },
                            calculation: 'definite',
                            calculationValue: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'modifyActionValue_25',
                      },
                      setCharacterPassiveUiValue_27: {
                        action: {
                          kind: 'setCharacterPassiveUiValue',
                          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                        },
                        next: 'dealDamage_26',
                      },
                      mergeContextTargets_28: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'tar',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: 'setCharacterPassiveUiValue_27',
                      },
                      ifElse_32: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'mergeContextTargets_28' },
                          whenFalse: { $sequence: 'mergeContextTargets_28' },
                        },
                        next: null,
                      },
                      modifyActionValue_31: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_ink_damage',
                            operation: 'assign',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'ifElse_32',
                      },
                      ifElse_33: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'modifyActionValue_31' },
                          whenFalse: { $sequence: 'ifElse_32' },
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
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_damage' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_boom_poise' },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_ink_damage', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'equal',
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
        next: 'modifyActionValue_10',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'launchProjectile_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'modifyActionValue_12',
      },
      createSpatialPointTargets_14: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
        },
        next: 'checkCondition_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'createSpatialPointTargets_14',
      },
      finishOwner_28: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soulback' } },
        },
        next: null,
      },
      ifElse_30: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'finishOwner_28' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_31: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_30',
      },
      modifyActionValue_33: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      ifElse_34: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'modifyActionValue_33' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      finishOwner_35: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'soul' } } },
        next: 'ifElse_34',
      },
      findTargets_36: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'ownerSoul', owner: { kind: 'owner' } },
            saveToContextKey: 'soul',
          },
        },
        next: 'finishOwner_35',
      },
      ifElse_37: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'constant', value: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findOwnerSpawnedAbilityEntities_31' },
        },
        next: 'findTargets_36',
      },
      calculateActionValue_38: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_ink_damage',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: null,
      },
      calculateActionValue_39: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'ink_damage2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'calculateActionValue_38',
      },
      storeEventDamageValue_40: {
        action: {
          kind: 'storeEventDamageValue',
          parameters: { value: 'real', outputKey: 'ink_damage' },
        },
        next: 'calculateActionValue_39',
      },
      checkCondition_41: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'storeEventDamageValue_40',
      },
      setGlobalCooldown_42: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: null,
      },
      castSkillDuringAction_43: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'context', key: 'moying2' },
            skillId: 'chr_0036_jsspsi_normal_skill_inkhurt_front',
            target: { kind: 'mainCharacter' },
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'setGlobalCooldown_42',
      },
      findOwnerSpawnedAbilityEntities_44: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'moying2',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'castSkillDuringAction_43',
      },
      checkCondition_45: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
        },
        next: 'findOwnerSpawnedAbilityEntities_44',
      },
      applyBuff_46: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_linkline_2' }],
            targets: { kind: 'context', key: 'moying1' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_45',
      },
      checkCondition_47: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
        },
        next: 'applyBuff_46',
      },
      triggerCustomAbilityEvent_48: {
        action: {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'yichuline1',
            eventParam: 0,
            target: { kind: 'context', key: 'moying1' },
            source: { kind: 'owner' },
          },
        },
        next: 'checkCondition_47',
      },
      checkCondition_49: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' } },
        },
        next: 'triggerCustomAbilityEvent_48',
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_25' } },
        },
        next: 'checkCondition_49',
      },
      modifyActionValue_60: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      modifyActionValue_52: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_havesoul',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      modifyActionValue_53: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'modifyActionValue_52',
      },
      applyBuff_54: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_53',
      },
      applyBuff_55: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline',
                blackboardAssignments: { iswaitenemy: { kind: 'constant', value: 1 } },
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  ink_damage_rate: 'ink_damage_rate',
                  curcounttime: 'soulbufftime',
                },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_54',
      },
      readBuffRemainingDuration_56: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'soulbufftime',
          },
        },
        next: 'applyBuff_55',
      },
      spawnAbilityEntity_57: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'soul_pos' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'owner' },
            saveToContextKey: 'moying',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_26' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_27' },
            },
          },
        },
        next: 'readBuffRemainingDuration_56',
      },
      createSpatialPointTargets_58: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'soul_pos', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_57',
      },
      calculateActionValue_59: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'soulbufftime',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_28' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'createSpatialPointTargets_58',
      },
      modifyActionValue_62: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'ink_damage_display',
            operation: 'assign',
            value: { kind: 'constant', value: 999 },
          },
        },
        next: null,
      },
      ifElse_66: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_29' },
          whenTrue: { $sequence: 'modifyActionValue_62' },
          whenFalse: { $sequence: null },
        },
        next: 'setCharacterPassiveUiValue_21',
      },
      ifElse_67: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_30' },
          whenTrue: { $sequence: 'setCharacterPassiveUiValue_20' },
          whenFalse: { $sequence: 'ifElse_66' },
        },
        next: null,
      },
      calculateActionValue_68: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'ink_damage_display',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 10000 },
          },
        },
        next: 'ifElse_67',
      },
      ifElse_69: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'constant', value: true },
          whenTrue: { $sequence: 'calculateActionValue_59' },
          whenFalse: { $sequence: 'modifyActionValue_60' },
        },
        next: 'calculateActionValue_68',
      },
      createSpatialPointTargets_70: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_69',
      },
      checkCondition_71: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_31' } },
        },
        next: 'createSpatialPointTargets_70',
      },
      calculateActionValue_72: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'EntityBB_ink_damage',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_32' },
          },
        },
        next: 'checkCondition_71',
      },
      calculateActionValue_73: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'kill_damage',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_17' },
            right: { kind: 'valueNode', nodeId: 'data_32' },
          },
        },
        next: 'calculateActionValue_72',
      },
      modifyActionValue_74: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_soulbufftime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_27' },
          },
        },
        next: 'calculateActionValue_73',
      },
      readBuffRemainingDuration_75: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'soulbufftime',
          },
        },
        next: 'modifyActionValue_74',
      },
      refreshCurrentBuffAttributeModifiers_76: {
        action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
        next: 'readBuffRemainingDuration_75',
      },
      modifyActionValue_77: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_zero',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'refreshCurrentBuffAttributeModifiers_76',
      },
      modifyActionValue_80: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'kill_damage',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      storeEntityPropertyValue_79: {
        action: {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target: 'actionOwner',
            property: 'currentHealth',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'kill_damage',
          },
        },
        next: null,
      },
      ifElse_81: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_33' },
          whenTrue: { $sequence: 'storeEntityPropertyValue_79' },
          whenFalse: { $sequence: 'modifyActionValue_80' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage_display' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'ink_damage_display', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 999 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_ink_damage' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_ink_boom_poise' },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_havesoul', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_inkmark_will_boom', fallback: 0 },
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
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_soulback', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'hp_zero', fallback: 0 } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage2' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage_rate' } },
      data_18: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['character'] },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'ink_hitcd' } },
      data_20: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_issoulfinish', fallback: 0 },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_20' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: true,
          contextKey: 'moying1',
          buffIds: ['buff_chr_0036_jsspsi_xianjing_linkline_2'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_23: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
        },
      },
      data_24: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_23' } },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'eventTransferredPartTagsMatch',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoul'],
          saveToContextKey: 'moying1',
        },
      },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'soul_hp' } },
      data_27: { type: 'number', expression: { kind: 'blackboard', key: 'soulbufftime' } },
      data_28: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_soulbufftime' } },
      data_29: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 999 },
        },
      },
      data_30: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_31: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_32: { type: 'number', expression: { kind: 'blackboard', key: 'kill_damage' } },
      data_33: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['character'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff25: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
  extendTags: [],
  blackboard: {
    duration: 15,
    hp_zero: 0,
    ink_damage: 0,
    ink_damage_display: 0,
    ink_damage_rate: 0,
    ink_damage2: 0,
    ink_hitcd: 0.5,
    kill_damage: 0,
    soul_hp: 999999999999,
    soulbufftime: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'applyBuff_9' }],
    enable: [{ $sequence: 'listenForTagQuery_4' }, { $sequence: 'repeatEachTick_26' }],
    trigger: [{ $sequence: 'listenForTagQuery_7' }],
    finish: [{ $sequence: 'checkCondition_15' }],
    release: [{ $sequence: 'ifElse_37' }],
  },
  abilityEventResponses: [
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'checkCondition_41' } },
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'checkCondition_50' } },
    { event: 'ownerHpZero', priority: 0, sequence: { $sequence: 'modifyActionValue_77' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'ifElse_81' } },
  ],
  actionGraph: siBuff25ActionGraph,
};

const siBuff26ActionGraph = {
  main: {
    nodes: {
      setGlobalCooldown_1: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
            durationSeconds: { kind: 'constant', value: 9999 },
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'setGlobalCooldown_1',
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
          kind: 'eventInflictionElementIn',
          elements: ['heat', 'electric', 'cryo', 'nature'],
          outputKey: 'spellinfliction',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_2' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff26: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
  extendTags: [],
  blackboard: { duration: 15, spellinfliction: 6 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterTakeInfliction', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: siBuff26ActionGraph,
};

const siBuff27ActionGraph = {
  main: {
    nodes: {
      setCurrentBuffRemainingDuration_2: {
        action: {
          kind: 'setCurrentBuffRemainingDuration',
          parameters: { operation: 'assign', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'setCurrentBuffRemainingDuration_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_havesoul',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_3',
      },
      applyBuff_51: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_check_isfight' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_36: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      finishOwner_37: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: 'modifyActionValue_36',
      },
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay',
                copiedBlackboardAssignments: { duration: 'soulbufftime' },
              },
            ],
            targets: { kind: 'context', key: 'soul_target1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishOwner_37',
      },
      applyBuff_39: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                copiedBlackboardAssignments: {
                  duration: 'soulbufftime',
                  ink_damage_rate: 'ink_damage_rate',
                },
              },
            ],
            targets: { kind: 'context', key: 'soul_target1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_38',
      },
      calculateActionValue_40: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'soulbufftime',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_39',
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'context', key: 'moying1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'calculateActionValue_40',
      },
      applyBuff_42: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline_1',
                copiedBlackboardAssignments: { duration: 'soulbufftime' },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'context', key: 'soul_target1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_41',
      },
      applyBuff_43: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  ink_damage_rate: 'ink_damage_rate',
                  curcounttime: 'soulbufftime',
                },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_42',
      },
      spawnAbilityEntity_44: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'soul_target1' },
            saveToContextKey: 'moying1',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: 'applyBuff_43',
      },
      spawnAbilityEntity_45: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'soul_target1' },
            saveToContextKey: 'moying',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: 'spawnAbilityEntity_44',
      },
      calculateActionValue_46: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'inksoultime',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: 2 },
          },
        },
        next: 'spawnAbilityEntity_45',
      },
      readBuffRemainingDuration_47: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'soulbufftime',
          },
        },
        next: 'calculateActionValue_46',
      },
      ifElse_49: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'readBuffRemainingDuration_47' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      findTargets_50: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'mainCharacter' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'exceptAny',
              tags: ['SelectCategory/Unmarkable'],
            },
            saveToContextKey: 'soul_target1',
          },
        },
        next: 'ifElse_49',
      },
      ifElse_53: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'constant', value: true },
          whenTrue: { $sequence: 'findTargets_50' },
          whenFalse: { $sequence: 'applyBuff_51' },
        },
        next: null,
      },
      ifElse_54: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'ifElse_53' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_talent1_speedup',
                copiedBlackboardAssignments: {
                  ratio_speed: 'ratio_speed',
                  duration_speedup: 'duration_speedup',
                },
              },
            ],
            targets: { kind: 'context', key: 'chrteam' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findTargets_7: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'source' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'source' } },
            saveToContextKey: 'chrteam',
          },
        },
        next: 'applyBuff_6',
      },
      readBuffBlackboard_8: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_2'] },
            desiredKey: 'duration_speedup',
            outputKey: 'duration_speedup',
          },
        },
        next: 'findTargets_7',
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_2'] },
            desiredKey: 'ratio_speed',
            outputKey: 'ratio_speed',
          },
        },
        next: 'readBuffBlackboard_8',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'readBuffBlackboard_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      readBuffBlackboard_13: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_1'] },
            desiredKey: 'duration_speedup',
            outputKey: 'duration_speedup',
          },
        },
        next: 'findTargets_7',
      },
      readBuffBlackboard_14: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent1_1'] },
            desiredKey: 'ratio_speed',
            outputKey: 'ratio_speed',
          },
        },
        next: 'readBuffBlackboard_13',
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'readBuffBlackboard_14' },
          whenFalse: { $sequence: 'ifElse_15' },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_inkboom_camera' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'ifElse_16',
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ink_damage',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'applyBuff_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_damage',
                copiedBlackboardAssignments: {
                  ink_damage: 'EntityBB_ink_damage',
                  ink_poise: 'EntityBB_ink_boom_poise',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_18',
      },
      finishOwner_20: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: 'applyBuff_19',
      },
      finishBuffsById_21: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'soul_target1' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
              'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay',
            ],
            reason: 'other',
          },
        },
        next: 'finishOwner_20',
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_soulback',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_21',
      },
      castSkillDuringAction_23: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'context', key: 'soulback' },
            skillId: 'chr_0036_jsspsi_normal_skill_inkmove_2',
            targetContextKey: 'soul_target1',
            target: 'context',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'modifyActionValue_22',
      },
      setAbilityEntityRemainingDuration_24: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'soulback' },
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'castSkillDuringAction_23',
      },
      findOwnerSpawnedAbilityEntities_25: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'setAbilityEntityRemainingDuration_24',
      },
      modifyActionValue_26: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_issoulfinish',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_25',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'modifyActionValue_26',
      },
      findOwnerSpawnedAbilityEntities_28: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: [],
            owner: { kind: 'source' },
          },
        },
        next: 'checkCondition_27',
      },
      findTargets_29: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
            },
            saveToContextKey: 'soul_target1',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_28',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'findTargets_29',
      },
      finishOwner_31: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      setCharacterPassiveUiValue_32: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'finishOwner_31',
      },
      modifyActionValue_33: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_normal_skill_id',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'setCharacterPassiveUiValue_32',
      },
      checkCondition_34: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'modifyActionValue_33',
      },
      finishOwner_64: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soulback' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_65: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: [],
            owner: { kind: 'source' },
          },
        },
        next: 'finishOwner_64',
      },
      applyBuff_58: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline',
                blackboardAssignments: { iswaitenemy: { kind: 'constant', value: 1 } },
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  ink_damage_rate: 'ink_damage_rate',
                  curcounttime: 'soulbufftime',
                },
              },
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom',
                copiedBlackboardAssignments: { duration: 'soulbufftime' },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'context', key: 'zhuren' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      readBuffRemainingDuration_59: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'soulbufftime',
          },
        },
        next: 'applyBuff_58',
      },
      finishOwner_60: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soulback' } },
        },
        next: 'readBuffRemainingDuration_59',
      },
      findOwnerSpawnedAbilityEntities_61: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'finishOwner_60',
      },
      spawnAbilityEntity_62: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1',
            source: { kind: 'context', key: 'zhuren' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'owner' },
            saveToContextKey: 'moying',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_4' },
            },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_61',
      },
      calculateActionValue_63: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'soulbufftime',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'spawnAbilityEntity_62',
      },
      ifElse_78: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'constant', value: true },
          whenTrue: { $sequence: 'calculateActionValue_63' },
          whenFalse: { $sequence: 'findOwnerSpawnedAbilityEntities_65' },
        },
        next: null,
      },
      modifyActionValue_56: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_soulbufftime',
            operation: 'assign',
            value: { kind: 'constant', value: 0.7 },
          },
        },
        next: null,
      },
      applyBuff_67: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay',
                copiedBlackboardAssignments: { duration: 'EntityBB_soulbufftime' },
              },
            ],
            targets: { kind: 'context', key: 'soul_target1' },
            source: { kind: 'context', key: 'zhuren' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_68: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline_1',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'context', key: 'soul_target1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_67',
      },
      applyBuff_69: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_linkline',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  ink_damage_rate: 'ink_damage_rate',
                  curcounttime: 'soulbufftime',
                },
              },
            ],
            targets: { kind: 'context', key: 'moying' },
            source: { kind: 'context', key: 'zhuren' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_68',
      },
      calculateActionValue_70: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'soulbufftime',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 0.95 },
          },
        },
        next: 'applyBuff_69',
      },
      applyBuff_71: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                copiedBlackboardAssignments: {
                  duration: 'EntityBB_soulbufftime',
                  ink_damage_rate: 'EntityBB_ink_damage_rate',
                },
              },
            ],
            targets: { kind: 'context', key: 'soul_target1' },
            source: { kind: 'context', key: 'zhuren' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'calculateActionValue_70',
      },
      setAbilityEntityRemainingDuration_72: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'soulback' },
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'applyBuff_71',
      },
      findOwnerSpawnedAbilityEntities_73: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soulback',
            abilityEntityIds: ['abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2'],
            owner: { kind: 'source' },
          },
        },
        next: 'setAbilityEntityRemainingDuration_72',
      },
      spawnAbilityEntity_74: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom',
            source: { kind: 'context', key: 'zhuren' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'soul_target1' },
            saveToContextKey: 'moying',
            blackboardAssignments: {
              EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_5' },
              EntityBB_duration: { kind: 'valueNode', nodeId: 'data_4' },
            },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_73',
      },
      calculateActionValue_75: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'soulbufftime',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'spawnAbilityEntity_74',
      },
      ifElse_76: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'modifyActionValue_56' },
          whenFalse: { $sequence: null },
        },
        next: 'calculateActionValue_75',
      },
      finishOwner_77: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: 'ifElse_76',
      },
      ifElse_81: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'finishOwner_77' },
          whenFalse: { $sequence: 'ifElse_78' },
        },
        next: null,
      },
      findTargets_82: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'mainCharacter' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'exceptAny',
              tags: ['SelectCategory/Unmarkable'],
            },
            saveToContextKey: 'soul_target1',
          },
        },
        next: 'ifElse_81',
      },
      checkCondition_83: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
        },
        next: 'findTargets_82',
      },
      checkCondition_84: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: 'checkCondition_83',
      },
      mergeContextTargets_85: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'zhuren',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          },
        },
        next: 'checkCondition_84',
      },
      checkCondition_86: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
        },
        next: 'mergeContextTargets_85',
      },
      checkCondition_79: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
        },
        next: null,
      },
      checkCondition_80: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' } },
        },
        next: 'checkCondition_79',
      },
      ifElse_87: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_24' },
          whenTrue: { $sequence: 'checkCondition_86' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'curcounttime' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'curcounttime', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'soulbufftime' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'soul_hp' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'inksoultime' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'soul_target1' },
          containsHittableTarget: false,
          excludeDeadEntity: true,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'iswaitenemy', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_talent1_2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0036_jsspsi_talent1_1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'soul_target1' },
          containsHittableTarget: false,
          excludeDeadEntity: true,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_soulbufftime' } },
      data_16: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_soulbufftime', fallback: 0 },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0.7 },
        },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'soul_target1' },
          containsHittableTarget: false,
          excludeDeadEntity: true,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: true,
          contextKey: 'zhuren',
          buffIds: ['buff_chr_0036_jsspsi_xianjing_inkboom'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'zhuren' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'abilityEntityRemainingDurationCompare',
          target: { kind: 'owner' },
          outputKey: 'curduration',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_23: {
        type: 'boolean',
        expression: { kind: 'eventAbilityEntityFinishReasonIn', reasons: ['soulMainBodyDied'] },
      },
      data_24: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_80' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff27: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
  extendTags: [],
  blackboard: {
    curcounttime: 0,
    curduration: 0,
    duration: 0,
    duration_speedup: 0,
    ink_damage: 0,
    ink_damage_rate: 0,
    inksoultime: 0,
    iswaitenemy: 0,
    ratio_speed: 0,
    soul_hp: 999999999,
    soulbufftime: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'modifyActionValue_4' }],
    trigger: [{ $sequence: 'ifElse_54' }],
    finish: [{ $sequence: 'checkCondition_30' }, { $sequence: 'checkCondition_34' }],
  },
  abilityEventResponses: [
    { event: 'abilityEntitySelfFinished', priority: 0, sequence: { $sequence: 'ifElse_87' } },
  ],
  actionGraph: siBuff27ActionGraph,
};

const siBuff28ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff28: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: siBuff28ActionGraph,
};

const siBuff29ActionGraph = {
  main: {
    nodes: {
      copyContextTargets_1: {
        action: {
          kind: 'copyContextTargets',
          parameters: { source: { kind: 'source' }, saveToContextKey: 'benti' },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0036_jsspsi_xianjing_linkline_3' }],
            targets: { kind: 'owner' },
            source: { kind: 'context', key: 'benti' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff29: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
  extendTags: [],
  blackboard: { duration: 0.5 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'copyContextTargets_1' }],
    finish: [{ $sequence: 'applyBuff_2' }],
  },
  actionGraph: siBuff29ActionGraph,
};

const siBuff30ActionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'none' },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishCurrentBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventCustomAbilityNameMatch', eventName: 'yichuline1' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const siBuff30: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'customAbilityEvent', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: siBuff30ActionGraph,
};

export const si: OperatorDefinition = {
  slug: 'si',
  gameId: 'SI',
  rarity: 6,
  weaponType: 'claym',
  element: 'cryo',
  characterTypeId: 'Cryst',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [17, 38, 60, 83, 105, 117],
    agility: [10, 29, 49, 69, 89, 100],
    intellect: [24, 57, 92, 127, 162, 179],
    will: [10, 29, 49, 69, 89, 100],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        siChr_0036_jsspsi_attack1,
        siChr_0036_jsspsi_attack2,
        siChr_0036_jsspsi_attack3,
        siChr_0036_jsspsi_attack4,
        siChr_0036_jsspsi_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: siChr_0036_jsspsi_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: siChr_0036_jsspsi_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: [
        siChr_0036_jsspsi_normal_skill,
        siChr_0036_jsspsi_normal_skill_1,
        siChr_0036_jsspsi_normal_skill_2,
      ],
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: siChr_0036_jsspsi_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: siChr_0036_jsspsi_ultimate_skill },
  ],
  dodgeSkill: siChr_0036_jsspsi_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'chr_0036_jsspsi_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0036_jsspsi_normal_skill',
      replacementSkillKeys: ['chr_0036_jsspsi_normal_skill_2', 'chr_0036_jsspsi_normal_skill_1'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0036_jsspsi_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0036_jsspsi_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0036_jsspsi_attack1',
        'chr_0036_jsspsi_attack2',
        'chr_0036_jsspsi_attack3',
        'chr_0036_jsspsi_attack4',
        'chr_0036_jsspsi_attack5',
        'chr_0036_jsspsi_plunging_attack_end',
        'chr_0036_jsspsi_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0036_jsspsi_attack1',
        'chr_0036_jsspsi_attack2',
        'chr_0036_jsspsi_attack3',
        'chr_0036_jsspsi_attack4',
        'chr_0036_jsspsi_attack5',
      ],
      defaultSkillKey: 'chr_0036_jsspsi_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [siComboCondition1, siComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0036_jsspsi_talent2_1',
          enabledLevels: [1],
          blackboardAssignments: { coolDown: -10 },
        },
        {
          buffId: 'buff_chr_0036_jsspsi_talent2_2',
          enabledLevels: [2],
          blackboardAssignments: { coolDown: -20 },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0036_jsspsi_talent1_1',
          enabledLevels: [1],
          blackboardAssignments: { ratio_speed: 0.15, duration_speedup: 5 },
        },
        {
          buffId: 'buff_chr_0036_jsspsi_talent1_2',
          enabledLevels: [2],
          blackboardAssignments: { ratio_speed: 0.3, duration_speedup: 5 },
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
          skillKey: 'chr_0036_jsspsi_normal_skill',
          blackboardKey: 'static_duration',
          operation: 'add',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_normal_skill',
          blackboardKey: 'ink_damage_rate',
          operation: 'add',
          value: 0.07,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_normal_skill',
          blackboardKey: 'ink_boom_range',
          operation: 'add',
          value: 0.4,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'potential2_duration',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'potential2_base',
          operation: 'assign',
          value: 0.08,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'potential2_enhance',
          operation: 'assign',
          value: 0.03,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'potential2_display',
          operation: 'assign',
          value: 0.11,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_ultimate_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_ultimate_skill',
          blackboardKey: 'enhance_final',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_ultimate_skill',
          blackboardKey: 'atk_scale_2',
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
          skillKey: 'chr_0036_jsspsi_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0036_jsspsi_combo_skill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'atk_scale2_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'atk_scale2_2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'atk_scale2_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0036_jsspsi_combo_skill',
          blackboardKey: 'potential5',
          operation: 'add',
          value: 1,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_atk_scale_qizi: 0,
    EntityBB_ayao_big_cnt: 0,
    EntityBB_ayao_big_limit: 2,
    EntityBB_combo_count: 0,
    EntityBB_combo_count_tmp: 0,
    EntityBB_combo_ui_duration: 6,
    EntityBB_comboskill_count: 1,
    EntityBB_havesoul: 0,
    EntityBB_ink_boom_poise: 0,
    EntityBB_ink_boom_range: 0,
    EntityBB_ink_damage: 0,
    EntityBB_ink_damage_rate: 0,
    EntityBB_ink_hp_percent: 30,
    EntityBB_ink_maxhp: 0,
    EntityBB_inkmark_will_boom: 1,
    EntityBB_issoulfinish: 0,
    EntityBB_normal_skill_id: 0,
    EntityBB_poise_qizi: 0,
    EntityBB_qizi_buff: 0,
    EntityBB_qizi_countnow: 0,
    EntityBB_soul_back_end: 0,
    EntityBB_soulback: 0,
    EntityBB_soulbufftime: 0,
  },
  buffDefinitions: {
    buff_chr_0027_tangtang_water_icon: siBuff1,
    buff_chr_0036_jsspsi_atk_buff_2: siBuff2,
    buff_chr_0036_jsspsi_combo_potential2: siBuff3,
    buff_chr_0036_jsspsi_combo_skill_layercount: siBuff4,
    buff_chr_0036_jsspsi_normal_skill_boomrevert: siBuff5,
    buff_chr_0036_jsspsi_normal_skill_check: siBuff6,
    buff_chr_0036_jsspsi_normal_skill_check_isfight: siBuff7,
    buff_chr_0036_jsspsi_normal_skill_finish_immune: siBuff8,
    buff_chr_0036_jsspsi_normal_skill_hitstop: siBuff9,
    buff_chr_0036_jsspsi_normal_skill_inkphantom: siBuff10,
    buff_chr_0036_jsspsi_normal_skill_inkphantom_canbehit: siBuff11,
    buff_chr_0036_jsspsi_normal_skill_inkphantom_damage: siBuff12,
    buff_chr_0036_jsspsi_normal_skill_modifysoucebb: siBuff13,
    buff_chr_0036_jsspsi_normal_skill_soul_timedisplay: siBuff14,
    buff_chr_0036_jsspsi_normal_skill_soul_timedisplay_jsspsiself: siBuff15,
    buff_chr_0036_jsspsi_plunging_attack_ayao: siBuff16,
    buff_chr_0036_jsspsi_talent1_1: siBuff17,
    buff_chr_0036_jsspsi_talent1_2: siBuff18,
    buff_chr_0036_jsspsi_talent1_speedup: siBuff19,
    buff_chr_0036_jsspsi_talent2_1: siBuff20,
    buff_chr_0036_jsspsi_talent2_2: siBuff21,
    buff_chr_0036_jsspsi_train_inksoultarget: siBuff22,
    buff_chr_0036_jsspsi_xianjing_inkboom: siBuff23,
    buff_chr_0036_jsspsi_xianjing_inkboom_camera: siBuff24,
    buff_chr_0036_jsspsi_xianjing_inkhurteffect: siBuff25,
    buff_chr_0036_jsspsi_xianjing_inkhurteffect_1: siBuff26,
    buff_chr_0036_jsspsi_xianjing_linkline: siBuff27,
    buff_chr_0036_jsspsi_xianjing_linkline_1: siBuff28,
    buff_chr_0036_jsspsi_xianjing_linkline_2: siBuff29,
    buff_chr_0036_jsspsi_xianjing_linkline_3: siBuff30,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0036_jsspsi_plunging_attack_ayao: {
      faction: 'good',
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0036_jsspsi/ayao',
      ],
      blackboard: { EntityBB_maxCnt: 3, EntityBB_x: 0, EntityBB_y: 0, EntityBB_z: 0 },
      lifetime: { kind: 'infinite' },
      maxStackingCount: { blackboardKey: 'EntityBB_maxCnt', fallback: 1 },
    },
    abilityentity_chr_0036_jsspsi_normal_skill_1: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: {
        EntityBB_atk_scale: 0,
        EntityBB_duration: 0,
        EntityBB_ink_damage_rate: 0,
        EntityBB_poise: 0,
        EntityBB_static_duration: 0,
      },
      lifetime: { kind: 'limited', durationSeconds: 1 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0036_jsspsi_normal_skill_abilityrange_1',
        nativeSkillType: 'attachSkill',
        naturalDurationFrames: 30,
        normalSkillSubType: 'additionalNormalSkill',
        castResource: {
          costFrame: 8,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { soulbufftime: 0, spellinficttype: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 25, sequence: { $sequence: 'setIgnoreGlobalTimeScale_1' } },
          { startFrame: 6, endFrame: 7, sequence: { $sequence: 'copyContextTargets_9' } },
          {
            startFrame: 6,
            endFrame: 7,
            sequence: { $sequence: 'storeCharacterTypeBySquadSlot_25' },
          },
        ],
        actionGraph: {
          main: {
            nodes: {
              setIgnoreGlobalTimeScale_1: {
                action: {
                  kind: 'setIgnoreGlobalTimeScale',
                  parameters: {
                    abilityEntityTargets: [{ kind: 'current' }],
                    ignore: true,
                    revertOnEnd: true,
                  },
                },
                next: null,
              },
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_check' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              applyBuff_3: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_modifysoucebb' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_2',
              },
              applyBuff_4: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_normal_skill_soul_timedisplay',
                        copiedBlackboardAssignments: { duration: 'soulbufftime' },
                      },
                    ],
                    targets: { kind: 'context', key: 'soul_target' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_3',
              },
              applyBuff_5: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        copiedBlackboardAssignments: {
                          duration: 'soulbufftime',
                          ink_damage_rate: 'EntityBB_ink_damage_rate',
                        },
                      },
                    ],
                    targets: { kind: 'context', key: 'soul_target' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_4',
              },
              calculateActionValue_6: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'soulbufftime',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'constant', value: 0 },
                  },
                },
                next: 'applyBuff_5',
              },
              checkCondition_7: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                },
                next: 'calculateActionValue_6',
              },
              checkCondition_8: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'checkCondition_7',
              },
              copyContextTargets_9: {
                action: {
                  kind: 'copyContextTargets',
                  parameters: {
                    source: { kind: 'inputTarget' },
                    saveToContextKey: 'soul_target',
                    replacePartsWithMainBodies: true,
                  },
                },
                next: 'checkCondition_8',
              },
              applyBuff_17: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              startTimeDilation_18: {
                action: {
                  kind: 'startTimeDilation',
                  parameters: {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.1 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_normal_attack' },
                    finishByAction: false,
                    targets: [{ kind: 'context', key: 'chr_jsspsi' }],
                  },
                },
                next: 'applyBuff_17',
              },
              applyBuff_19: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_normal_skill_hitstop',
                        copiedBlackboardAssignments: { duration: 'EntityBB_static_duration' },
                      },
                    ],
                    targets: { kind: 'inputTarget' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'startTimeDilation_18',
              },
              dealDamage_20: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    target: 'actionInputTarget',
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill_1:chr_0036_jsspsi_normal_skill_abilityrange_1:/childSkill/actionGraph/main/nodes/dealDamage_20/action',
                },
                next: 'applyBuff_19',
              },
              checkCondition_21: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                },
                next: 'dealDamage_20',
              },
              applyElementalInfliction_22: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: {
                    element: 'cryo',
                    isExtra: false,
                    source: { kind: 'context', key: 'chr_jsspsi' },
                    target: { kind: 'inputTarget' },
                  },
                },
                next: 'checkCondition_21',
              },
              dealDamage_14: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    target: 'actionInputTarget',
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill_1:chr_0036_jsspsi_normal_skill_abilityrange_1:/childSkill/actionGraph/main/nodes/dealDamage_14/action',
                },
                next: 'applyBuff_19',
              },
              checkCondition_15: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                },
                next: 'dealDamage_14',
              },
              applyElementalInfliction_16: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: {
                    element: 'heat',
                    isExtra: false,
                    source: { kind: 'context', key: 'chr_jsspsi' },
                    target: { kind: 'inputTarget' },
                  },
                },
                next: 'checkCondition_15',
              },
              ifElse_23: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  whenTrue: { $sequence: 'applyElementalInfliction_16' },
                  whenFalse: { $sequence: 'applyElementalInfliction_22' },
                },
                next: null,
              },
              mergeContextTargets_24: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'chr_jsspsi',
                    sources: [{ kind: 'abilitySystemSource', owner: 'actionSource' }],
                  },
                },
                next: 'ifElse_23',
              },
              storeCharacterTypeBySquadSlot_25: {
                action: {
                  kind: 'storeCharacterTypeBySquadSlot',
                  parameters: {
                    slotIndex: { kind: 'constant', value: 0 },
                    defaultValue: -1,
                    outputKey: 'spellinficttype',
                  },
                },
                next: 'mergeContextTargets_24',
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_duration' },
              },
              data_2: {
                type: 'boolean',
                expression: {
                  kind: 'contextTargetObjectTypeMatch',
                  contextKey: 'soul_target',
                  objectTypes: ['enemy'],
                },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'soul_target' },
                  containsHittableTarget: false,
                  excludeDeadEntity: true,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_poise' } },
              data_6: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'inputTarget' },
                  containsHittableTarget: false,
                  excludeDeadEntity: true,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'inputTarget' },
                  containsHittableTarget: false,
                  excludeDeadEntity: true,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_8: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'spellinficttype', fallback: 0 },
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
            },
          },
          macros: {},
        },
      },
    },
    abilityentity_chr_0036_jsspsi_combo_skill: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: {
        EntityBB_bufftime: 0,
        EntityBB_duration: 0,
        EntityBB_ink_damage_rate: 0,
        EntityBB_poise: 0,
        EntityBB_scale: 0,
        EntityBB_soul_hp: 0,
        EntityBB_usp: 0,
      },
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0036_jsspsi_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 127,
        castResource: {
          costFrame: 8,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { havesoul: 0, soul_hpmax: 0, soulbufftime: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 25, sequence: { $sequence: 'setIgnoreGlobalTimeScale_1' } },
          { startFrame: 8, endFrame: 9, sequence: { $sequence: 'mergeContextTargets_21' } },
          { startFrame: 20, endFrame: 23, sequence: { $sequence: 'checkCondition_25' } },
          { startFrame: 20, endFrame: 23, sequence: { $sequence: 'checkCondition_31' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              setIgnoreGlobalTimeScale_1: {
                action: {
                  kind: 'setIgnoreGlobalTimeScale',
                  parameters: {
                    abilityEntityTargets: [{ kind: 'current' }],
                    ignore: true,
                    revertOnEnd: true,
                  },
                },
                next: null,
              },
              applyBuff_3: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_xianjing_linkline',
                        copiedBlackboardAssignments: {
                          duration: 'soulbufftime',
                          ink_damage_rate: 'EntityBB_ink_damage_rate',
                        },
                      },
                    ],
                    targets: { kind: 'context', key: 'moying' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              calculateActionValue_4: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'soulbufftime',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'constant', value: 0.98 },
                  },
                },
                next: 'applyBuff_3',
              },
              readBuffRemainingDuration_5: {
                action: {
                  kind: 'readBuffRemainingDuration',
                  parameters: {
                    target: { kind: 'context', key: 'soul_target' },
                    query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_xianjing_inkhurteffect'] },
                    outputKey: 'soulbufftime',
                  },
                },
                next: 'calculateActionValue_4',
              },
              applyBuff_6: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom',
                        copiedBlackboardAssignments: { duration: 'soulbufftime' },
                      },
                    ],
                    targets: { kind: 'context', key: 'moying1' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'readBuffRemainingDuration_5',
              },
              spawnAbilityEntity_7: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    bornAt: { kind: 'context', key: 'soul_target' },
                    abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2',
                    childSkillId: 'chr_0036_jsspsi_normal_skill_inkmove_1',
                    inheritActionBlackboard: false,
                    dieWhenSourceDies: false,
                    target: { kind: 'context', key: 'soul_target' },
                    saveToContextKey: 'moying1',
                    blackboardAssignments: {
                      EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_2' },
                      EntityBB_duration: { kind: 'valueNode', nodeId: 'data_1' },
                    },
                  },
                },
                next: 'applyBuff_6',
              },
              spawnAbilityEntity_8: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    bornAt: { kind: 'context', key: 'soul_target' },
                    abilityEntityId: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom',
                    childSkillId: 'chr_0036_jsspsi_normal_skill_inkmove_1',
                    inheritActionBlackboard: false,
                    dieWhenSourceDies: false,
                    target: { kind: 'context', key: 'soul_target' },
                    saveToContextKey: 'moying',
                    blackboardAssignments: {
                      EntityBB_soul_hp: { kind: 'valueNode', nodeId: 'data_2' },
                      EntityBB_duration: { kind: 'valueNode', nodeId: 'data_1' },
                    },
                  },
                },
                next: 'spawnAbilityEntity_7',
              },
              storeEntityPropertyValue_9: {
                action: {
                  kind: 'storeEntityPropertyValue',
                  parameters: {
                    target: { kind: 'context', key: 'soul_target' },
                    property: 'maxHealth',
                    useFloor: false,
                    divisor: { kind: 'constant', value: 1 },
                    multiplier: { kind: 'constant', value: 1 },
                    base: { kind: 'constant', value: 100000000000 },
                    targetKey: 'soul_hpmax',
                  },
                },
                next: 'spawnAbilityEntity_8',
              },
              calculateActionValue_10: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'soulbufftime',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'constant', value: 1.2 },
                  },
                },
                next: 'storeEntityPropertyValue_9',
              },
              readBuffRemainingDuration_11: {
                action: {
                  kind: 'readBuffRemainingDuration',
                  parameters: {
                    target: { kind: 'context', key: 'soul_target' },
                    query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_xianjing_inkhurteffect'] },
                    outputKey: 'soulbufftime',
                  },
                },
                next: 'calculateActionValue_10',
              },
              createSpatialPointTargets_12: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
                },
                next: 'readBuffRemainingDuration_11',
              },
              ifElse_14: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_3' },
                  whenTrue: { $sequence: 'createSpatialPointTargets_12' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              checkCondition_15: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                },
                next: 'ifElse_14',
              },
              copyContextTargets_16: {
                action: {
                  kind: 'copyContextTargets',
                  parameters: {
                    source: { kind: 'context', key: 'soul_target' },
                    saveToContextKey: 'soul_target',
                  },
                },
                next: 'checkCondition_15',
              },
              findTargets_17: {
                action: {
                  kind: 'findTargets',
                  parameters: {
                    owner: { kind: 'mainCharacter' },
                    query: {
                      kind: 'enemyByTags',
                      tagQueryType: 'hasAny',
                      tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
                    },
                    saveToContextKey: 'soul_target',
                  },
                },
                next: 'copyContextTargets_16',
              },
              checkCondition_18: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                },
                next: 'findTargets_17',
              },
              readBuffBlackboard_19: {
                action: {
                  kind: 'readBuffBlackboard',
                  parameters: {
                    target: 'caster',
                    query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_normal_skill_check'] },
                    desiredKey: 'EntityBB_havesoul',
                    outputKey: 'havesoul',
                  },
                },
                next: 'checkCondition_18',
              },
              mergeContextTargets_20: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: { saveToContextKey: 'moying1', sources: [] },
                },
                next: 'readBuffBlackboard_19',
              },
              mergeContextTargets_21: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: { saveToContextKey: 'moying', sources: [] },
                },
                next: 'mergeContextTargets_20',
              },
              applyBuff_22: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_canbehit' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              castSkillDuringAction_23: {
                action: {
                  kind: 'castSkillDuringAction',
                  parameters: {
                    caster: { kind: 'context', key: 'moying1' },
                    skillId: 'chr_0036_jsspsi_normal_skill_born',
                    target: 'caster',
                    skipApplyCost: false,
                    inheritSourceSkillCastInfo: false,
                  },
                },
                next: 'applyBuff_22',
              },
              checkCondition_24: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                },
                next: 'castSkillDuringAction_23',
              },
              checkCondition_25: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
                },
                next: 'checkCondition_24',
              },
              applyBuff_26: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_xianjing_linkline_1',
                        copiedBlackboardAssignments: { duration: 'soulbufftime' },
                      },
                    ],
                    targets: { kind: 'context', key: 'moying' },
                    source: { kind: 'context', key: 'soul_target' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              calculateActionValue_27: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'soulbufftime',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'constant', value: 0.98 },
                  },
                },
                next: 'applyBuff_26',
              },
              readBuffRemainingDuration_28: {
                action: {
                  kind: 'readBuffRemainingDuration',
                  parameters: {
                    target: { kind: 'context', key: 'soul_target' },
                    query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_xianjing_inkhurteffect'] },
                    outputKey: 'soulbufftime',
                  },
                },
                next: 'calculateActionValue_27',
              },
              checkCondition_29: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
                },
                next: 'readBuffRemainingDuration_28',
              },
              checkCondition_30: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
                },
                next: 'checkCondition_29',
              },
              checkCondition_31: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
                },
                next: 'checkCondition_30',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'soulbufftime' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'soul_hpmax' } },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'soul_target' },
                  containsHittableTarget: false,
                  excludeDeadEntity: true,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'contextTargetObjectTypeMatch',
                  contextKey: 'soul_target',
                  objectTypes: ['enemy'],
                },
              },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'havesoul', fallback: 0 },
              },
              data_6: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_5' },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'moying' },
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
                  target: { kind: 'context', key: 'moying1' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'soul_target' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'moying1' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_11: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'moying' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
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
    abilityentity_chr_0036_jsspsi_normal_skill: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: {
        EntityBB_atk_scale: 0,
        EntityBB_atk_scale2: 0,
        EntityBB_atk_scale2_1: 0,
        EntityBB_combo_count: 0,
        EntityBB_poise: 0,
        EntityBB_potential2_base: 0,
        EntityBB_potential2_duration: 0,
        EntityBB_potential2_enhance: 0,
        EntityBB_potential5: 0,
        EntityBB_usp: 0,
      },
      lifetime: { kind: 'limited', durationSeconds: 3.5 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0036_jsspsi_combo_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 127,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_count: 0, combolayer_count: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_22' } },
          { startFrame: 14, endFrame: 16, sequence: { $sequence: 'dealDamage_24' } },
          { startFrame: 17, endFrame: 19, sequence: { $sequence: 'dealDamage_25' } },
          { startFrame: 20, endFrame: 22, sequence: { $sequence: 'dealDamage_26' } },
          { startFrame: 23, endFrame: 25, sequence: { $sequence: 'dealDamage_27' } },
          { startFrame: 26, endFrame: 28, sequence: { $sequence: 'dealDamage_28' } },
          { startFrame: 29, endFrame: 31, sequence: { $sequence: 'dealDamage_29' } },
          { startFrame: 32, endFrame: 34, sequence: { $sequence: 'dealDamage_30' } },
          { startFrame: 35, endFrame: 37, sequence: { $sequence: 'dealDamage_31' } },
          { startFrame: 38, endFrame: 40, sequence: { $sequence: 'dealDamage_32' } },
          { startFrame: 41, endFrame: 43, sequence: { $sequence: 'dealDamage_33' } },
          { startFrame: 49, endFrame: 51, sequence: { $sequence: 'ifElse_50' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              applyBuff_17: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0036_jsspsi_combo_potential2',
                        copiedBlackboardAssignments: {
                          potential2_duration: 'EntityBB_potential2_duration',
                          potential2_base: 'EntityBB_potential2_base',
                          potential2_enhance: 'EntityBB_potential2_enhance',
                          potential2_count: 'combolayer_count',
                        },
                      },
                    ],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              calculateActionValue_18: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: 'applyBuff_17',
              },
              calculateActionValue_19: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                },
                next: 'calculateActionValue_18',
              },
              calculateActionValue_15: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                },
                next: 'calculateActionValue_18',
              },
              calculateActionValue_16: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'constant', value: 1 },
                  },
                },
                next: 'calculateActionValue_15',
              },
              ifElse_21: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_6' },
                  whenTrue: { $sequence: 'calculateActionValue_16' },
                  whenFalse: { $sequence: 'calculateActionValue_19' },
                },
                next: null,
              },
              ifElse_22: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_8' },
                  whenTrue: { $sequence: 'ifElse_21' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              changeResource_23: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'valueNode', nodeId: 'data_9' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                  },
                },
                next: null,
              },
              dealDamage_24: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_24/action',
                },
                next: 'changeResource_23',
              },
              dealDamage_25: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_25/action',
                },
                next: null,
              },
              dealDamage_26: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_26/action',
                },
                next: null,
              },
              dealDamage_27: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_27/action',
                },
                next: null,
              },
              dealDamage_28: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_28/action',
                },
                next: null,
              },
              dealDamage_29: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_29/action',
                },
                next: null,
              },
              dealDamage_30: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_30/action',
                },
                next: null,
              },
              dealDamage_31: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_31/action',
                },
                next: null,
              },
              dealDamage_32: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_32/action',
                },
                next: null,
              },
              dealDamage_33: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_10' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_33/action',
                },
                next: null,
              },
              startTimeDilation_37: {
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
              ifElse_45: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_11' },
                  whenTrue: { $sequence: 'startTimeDilation_37' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              dealDamage_46: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_12' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_13' },
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_46/action',
                },
                next: 'ifElse_45',
              },
              calculateActionValue_47: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_12' },
                    right: { kind: 'valueNode', nodeId: 'data_14' },
                  },
                },
                next: 'dealDamage_46',
              },
              calculateActionValue_48: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_count',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'valueNode', nodeId: 'data_15' },
                  },
                },
                next: 'calculateActionValue_47',
              },
              calculateActionValue_49: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'constant', value: 0 },
                  },
                },
                next: 'calculateActionValue_48',
              },
              dealDamage_40: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_12' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_13' },
                  },
                  key: 'abilityentity_chr_0036_jsspsi_normal_skill:chr_0036_jsspsi_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_40/action',
                },
                next: 'ifElse_45',
              },
              calculateActionValue_41: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_12' },
                    right: { kind: 'valueNode', nodeId: 'data_14' },
                  },
                },
                next: 'dealDamage_40',
              },
              calculateActionValue_42: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'atk_scale_count',
                    operation: 'multiply',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    right: { kind: 'valueNode', nodeId: 'data_15' },
                  },
                },
                next: 'calculateActionValue_41',
              },
              calculateActionValue_43: {
                action: {
                  kind: 'calculateActionValue',
                  parameters: {
                    key: 'combolayer_count',
                    operation: 'add',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    right: { kind: 'constant', value: 0 },
                  },
                },
                next: 'calculateActionValue_42',
              },
              modifyActionValue_44: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'EntityBB_combo_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: 'calculateActionValue_43',
              },
              ifElse_50: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_16' },
                  whenTrue: { $sequence: 'modifyActionValue_44' },
                  whenFalse: { $sequence: 'calculateActionValue_49' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'combolayer_count' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_potential2_base' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_combo_count' },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_potential2_enhance' },
              },
              data_5: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_potential5', fallback: 0 },
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
                type: 'number',
                expression: {
                  kind: 'blackboard',
                  key: 'EntityBB_potential2_duration',
                  fallback: 0,
                },
              },
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_7' },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
              },
              data_9: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_usp' } },
              data_10: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
              },
              data_11: { type: 'boolean', expression: { kind: 'casterControlled' } },
              data_12: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_count' },
              },
              data_13: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_poise' },
              },
              data_14: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_atk_scale2' },
              },
              data_15: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'EntityBB_atk_scale2_1' },
              },
              data_16: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_5' },
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
    abilityentity_chr_0036_jsspsi_ultimate_skill_inklong01: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0036_jsspsi_combo_skill_abilityrange_1',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 127,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0036_jsspsi_ultimate_skill: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: {
        EntityBB_atk_scale: 0,
        EntityBB_atk_scale_2: 0,
        EntityBB_enhance_duration: 0,
        EntityBB_enhance_final: 0,
        EntityBB_ink_damage: 0,
        EntityBB_poise: 0,
        EntityBB_poise_2: 0,
      },
      lifetime: { kind: 'limited', durationSeconds: 8 },
      maxStackingCount: 1,
      childSkills: {
        chr_0036_jsspsi_ultimate_skill_abilityrange: {
          skillId: 'chr_0036_jsspsi_ultimate_skill_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 306,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { bufftime1: 0, bufftime2: 0, bufftime3: 0, talent_combo_reduce: 0 },
          scheduledSequences: [
            {
              startFrame: 38,
              endFrame: 41,
              sequence: { $sequence: 'createSpatialPointTargets_2' },
            },
            {
              startFrame: 58,
              endFrame: 61,
              sequence: { $sequence: 'createSpatialPointTargets_4' },
            },
            { startFrame: 81, endFrame: 82, sequence: { $sequence: 'finishOwner_5' } },
            { startFrame: 59, endFrame: 60, sequence: { $sequence: 'finishOwner_6' } },
            { startFrame: 63, endFrame: 64, sequence: { $sequence: 'dealDamage_16' } },
            { startFrame: 66, endFrame: 67, sequence: { $sequence: 'dealDamage_17' } },
            { startFrame: 70, endFrame: 71, sequence: { $sequence: 'dealDamage_18' } },
            { startFrame: 73, endFrame: 74, sequence: { $sequence: 'dealDamage_19' } },
            { startFrame: 77, endFrame: 78, sequence: { $sequence: 'dealDamage_20' } },
            { startFrame: 80, endFrame: 81, sequence: { $sequence: 'dealDamage_21' } },
            { startFrame: 84, endFrame: 85, sequence: { $sequence: 'dealDamage_22' } },
            { startFrame: 88, endFrame: 89, sequence: { $sequence: 'dealDamage_23' } },
            { startFrame: 100, endFrame: 101, sequence: { $sequence: 'dealDamage_24' } },
            {
              startFrame: 62,
              endFrame: 63,
              sequence: { $sequence: 'findCharacterBySquadSlot_41' },
            },
            { startFrame: 97, endFrame: 100, sequence: { $sequence: 'calculateActionValue_44' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                spawnAbilityEntity_1: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'context', key: 'pos2' },
                      abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill_inklong02',
                      inheritActionBlackboard: false,
                      dieWhenSourceDies: false,
                      target: 'actionInputTarget',
                      saveToContextKey: 'long2',
                    },
                  },
                  next: null,
                },
                createSpatialPointTargets_2: {
                  action: {
                    kind: 'createSpatialPointTargets',
                    parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
                  },
                  next: 'spawnAbilityEntity_1',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'context', key: 'pos2' },
                      abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill_inklong01',
                      inheritActionBlackboard: false,
                      dieWhenSourceDies: false,
                      target: 'actionInputTarget',
                      saveToContextKey: 'long1',
                    },
                  },
                  next: null,
                },
                createSpatialPointTargets_4: {
                  action: {
                    kind: 'createSpatialPointTargets',
                    parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                finishOwner_5: {
                  action: {
                    kind: 'finishOwner',
                    parameters: { targets: { kind: 'context', key: 'long1' } },
                  },
                  next: null,
                },
                finishOwner_6: {
                  action: {
                    kind: 'finishOwner',
                    parameters: { targets: { kind: 'context', key: 'long2' } },
                  },
                  next: null,
                },
                dealDamage_16: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_16/action',
                  },
                  next: null,
                },
                dealDamage_17: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_17/action',
                  },
                  next: null,
                },
                dealDamage_18: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_18/action',
                  },
                  next: null,
                },
                dealDamage_19: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_19/action',
                  },
                  next: null,
                },
                dealDamage_20: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_20/action',
                  },
                  next: null,
                },
                dealDamage_21: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_21/action',
                  },
                  next: null,
                },
                dealDamage_22: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_22/action',
                  },
                  next: null,
                },
                dealDamage_23: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_23/action',
                  },
                  next: null,
                },
                dealDamage_24: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange/actionGraph/main/nodes/dealDamage_24/action',
                  },
                  next: null,
                },
                applyBuff_31: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_atk_buff_2',
                          copiedBlackboardAssignments: {
                            enhance_final: 'EntityBB_enhance_final',
                            duration: 'EntityBB_enhance_duration',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar1' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                findTargets_32: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'source' },
                      query: {
                        kind: 'characterTeam',
                        excludeOwner: false,
                        owner: { kind: 'source' },
                      },
                      saveToContextKey: 'tar1',
                    },
                  },
                  next: 'applyBuff_31',
                },
                adjustSkillCooldown_28: {
                  action: {
                    kind: 'adjustSkillCooldown',
                    parameters: {
                      target: { kind: 'context', key: 'chr1' },
                      skill: { kind: 'type', skillType: 'comboSkill' },
                      operation: 'reduce',
                      basis: 'absoluteSeconds',
                      value: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                  },
                  next: 'findTargets_32',
                },
                calculateActionValue_29: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'talent_combo_reduce',
                      operation: 'multiply',
                      left: { kind: 'valueNode', nodeId: 'data_5' },
                      right: { kind: 'constant', value: -1 },
                    },
                  },
                  next: 'adjustSkillCooldown_28',
                },
                readBuffBlackboard_30: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent2_2'] },
                      desiredKey: 'coolDown',
                      outputKey: 'talent_combo_reduce',
                    },
                  },
                  next: 'calculateActionValue_29',
                },
                ifElse_39: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_6' },
                    whenTrue: { $sequence: 'readBuffBlackboard_30' },
                    whenFalse: { $sequence: 'findTargets_32' },
                  },
                  next: null,
                },
                readBuffBlackboard_38: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent2_1'] },
                      desiredKey: 'coolDown',
                      outputKey: 'talent_combo_reduce',
                    },
                  },
                  next: 'calculateActionValue_29',
                },
                ifElse_40: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'readBuffBlackboard_38' },
                    whenFalse: { $sequence: 'ifElse_39' },
                  },
                  next: null,
                },
                findCharacterBySquadSlot_41: {
                  action: {
                    kind: 'findCharacterBySquadSlot',
                    parameters: {
                      slotIndex: { kind: 'constant', value: 0 },
                      saveToContextKey: 'chr1',
                    },
                  },
                  next: 'ifElse_40',
                },
                calculateActionValue_42: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime3',
                      operation: 'add',
                      left: { kind: 'constant', value: 1 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: null,
                },
                calculateActionValue_43: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime2',
                      operation: 'add',
                      left: { kind: 'constant', value: 0.5 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: 'calculateActionValue_42',
                },
                calculateActionValue_44: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime1',
                      operation: 'add',
                      left: { kind: 'constant', value: 0 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: 'calculateActionValue_43',
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
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_atk_scale_2' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_poise_2' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent_combo_reduce' },
                },
                data_6: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0036_jsspsi_talent2_2'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0036_jsspsi_talent2_1'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_enhance_duration' },
                },
              },
            },
            macros: {},
          },
        },
        chr_0036_jsspsi_ultimate_skill_abilityrange_1: {
          skillId: 'chr_0036_jsspsi_ultimate_skill_abilityrange_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 228,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { bufftime1: 0, bufftime2: 0, bufftime3: 0, talent_combo_reduce: 0 },
          scheduledSequences: [
            {
              startFrame: 38,
              endFrame: 41,
              sequence: { $sequence: 'createSpatialPointTargets_2' },
            },
            {
              startFrame: 55,
              endFrame: 58,
              sequence: { $sequence: 'createSpatialPointTargets_4' },
            },
            { startFrame: 81, endFrame: 82, sequence: { $sequence: 'finishOwner_5' } },
            { startFrame: 57, endFrame: 58, sequence: { $sequence: 'finishOwner_6' } },
            { startFrame: 63, endFrame: 64, sequence: { $sequence: 'dealDamage_16' } },
            { startFrame: 66, endFrame: 67, sequence: { $sequence: 'dealDamage_17' } },
            { startFrame: 70, endFrame: 71, sequence: { $sequence: 'dealDamage_18' } },
            { startFrame: 73, endFrame: 74, sequence: { $sequence: 'dealDamage_19' } },
            { startFrame: 77, endFrame: 78, sequence: { $sequence: 'dealDamage_20' } },
            { startFrame: 80, endFrame: 81, sequence: { $sequence: 'dealDamage_21' } },
            { startFrame: 84, endFrame: 85, sequence: { $sequence: 'dealDamage_22' } },
            { startFrame: 88, endFrame: 89, sequence: { $sequence: 'dealDamage_23' } },
            { startFrame: 100, endFrame: 101, sequence: { $sequence: 'dealDamage_24' } },
            {
              startFrame: 62,
              endFrame: 63,
              sequence: { $sequence: 'findCharacterBySquadSlot_41' },
            },
            { startFrame: 97, endFrame: 100, sequence: { $sequence: 'calculateActionValue_44' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                spawnAbilityEntity_1: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'context', key: 'pos2' },
                      abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill_inklong02',
                      inheritActionBlackboard: false,
                      dieWhenSourceDies: false,
                      target: 'actionInputTarget',
                      saveToContextKey: 'long2',
                    },
                  },
                  next: null,
                },
                createSpatialPointTargets_2: {
                  action: {
                    kind: 'createSpatialPointTargets',
                    parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
                  },
                  next: 'spawnAbilityEntity_1',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'context', key: 'pos2' },
                      abilityEntityId: 'abilityentity_chr_0036_jsspsi_ultimate_skill_inklong01',
                      inheritActionBlackboard: false,
                      dieWhenSourceDies: false,
                      target: 'actionInputTarget',
                      saveToContextKey: 'long1',
                    },
                  },
                  next: null,
                },
                createSpatialPointTargets_4: {
                  action: {
                    kind: 'createSpatialPointTargets',
                    parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                finishOwner_5: {
                  action: {
                    kind: 'finishOwner',
                    parameters: { targets: { kind: 'context', key: 'long1' } },
                  },
                  next: null,
                },
                finishOwner_6: {
                  action: {
                    kind: 'finishOwner',
                    parameters: { targets: { kind: 'context', key: 'long2' } },
                  },
                  next: null,
                },
                dealDamage_16: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_16/action',
                  },
                  next: null,
                },
                dealDamage_17: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_17/action',
                  },
                  next: null,
                },
                dealDamage_18: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_18/action',
                  },
                  next: null,
                },
                dealDamage_19: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_19/action',
                  },
                  next: null,
                },
                dealDamage_20: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_20/action',
                  },
                  next: null,
                },
                dealDamage_21: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_21/action',
                  },
                  next: null,
                },
                dealDamage_22: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_22/action',
                  },
                  next: null,
                },
                dealDamage_23: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_23/action',
                  },
                  next: null,
                },
                dealDamage_24: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_ultimate_skill:chr_0036_jsspsi_ultimate_skill_abilityrange|chr_0036_jsspsi_ultimate_skill_abilityrange_1:/childSkills/chr_0036_jsspsi_ultimate_skill_abilityrange_1/actionGraph/main/nodes/dealDamage_24/action',
                  },
                  next: null,
                },
                applyBuff_31: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_atk_buff_2',
                          copiedBlackboardAssignments: {
                            enhance_final: 'EntityBB_enhance_final',
                            duration: 'EntityBB_enhance_duration',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar1' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                findTargets_32: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'source' },
                      query: {
                        kind: 'characterTeam',
                        excludeOwner: false,
                        owner: { kind: 'source' },
                      },
                      saveToContextKey: 'tar1',
                    },
                  },
                  next: 'applyBuff_31',
                },
                adjustSkillCooldown_28: {
                  action: {
                    kind: 'adjustSkillCooldown',
                    parameters: {
                      target: { kind: 'context', key: 'chr1' },
                      skill: { kind: 'type', skillType: 'comboSkill' },
                      operation: 'reduce',
                      basis: 'absoluteSeconds',
                      value: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                  },
                  next: 'findTargets_32',
                },
                calculateActionValue_29: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'talent_combo_reduce',
                      operation: 'multiply',
                      left: { kind: 'valueNode', nodeId: 'data_5' },
                      right: { kind: 'constant', value: -1 },
                    },
                  },
                  next: 'adjustSkillCooldown_28',
                },
                readBuffBlackboard_30: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent2_2'] },
                      desiredKey: 'coolDown',
                      outputKey: 'talent_combo_reduce',
                    },
                  },
                  next: 'calculateActionValue_29',
                },
                ifElse_39: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_6' },
                    whenTrue: { $sequence: 'readBuffBlackboard_30' },
                    whenFalse: { $sequence: 'findTargets_32' },
                  },
                  next: null,
                },
                readBuffBlackboard_38: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: { kind: 'id', buffIds: ['buff_chr_0036_jsspsi_talent2_1'] },
                      desiredKey: 'coolDown',
                      outputKey: 'talent_combo_reduce',
                    },
                  },
                  next: 'calculateActionValue_29',
                },
                ifElse_40: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'readBuffBlackboard_38' },
                    whenFalse: { $sequence: 'ifElse_39' },
                  },
                  next: null,
                },
                findCharacterBySquadSlot_41: {
                  action: {
                    kind: 'findCharacterBySquadSlot',
                    parameters: {
                      slotIndex: { kind: 'constant', value: 0 },
                      saveToContextKey: 'chr1',
                    },
                  },
                  next: 'ifElse_40',
                },
                calculateActionValue_42: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime3',
                      operation: 'add',
                      left: { kind: 'constant', value: 1 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: null,
                },
                calculateActionValue_43: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime2',
                      operation: 'add',
                      left: { kind: 'constant', value: 0.5 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: 'calculateActionValue_42',
                },
                calculateActionValue_44: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'bufftime1',
                      operation: 'add',
                      left: { kind: 'constant', value: 0 },
                      right: { kind: 'valueNode', nodeId: 'data_8' },
                    },
                  },
                  next: 'calculateActionValue_43',
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
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_atk_scale_2' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_poise_2' },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent_combo_reduce' },
                },
                data_6: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0036_jsspsi_talent2_2'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0036_jsspsi_talent2_1'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'EntityBB_enhance_duration' },
                },
              },
            },
            macros: {},
          },
        },
      },
    },
    abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2: {
      faction: 'bad',
      bornTags: [
        'Visual/ShowHPBar/HideLevel',
        'SelectCategory/Unmarkable',
        'Status/UnLockable',
        'Immune/Airborne',
        'Immune/Pull',
        'Immune/Damage',
        'Skill/Character/chr_0036_jsspsi/soul/soulback',
      ],
      blackboard: { EntityBB_duration: 0, EntityBB_soul_hp: 999999995904 },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 15 },
      },
      maxStackingCount: 1,
      childSkills: {
        chr_0036_jsspsi_normal_skill_inkmove_1: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'setIgnoreGlobalTimeScale_1' } },
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'findTargets_opt1' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                setIgnoreGlobalTimeScale_1: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                findTargets_opt1: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'mainCharacter' },
                      query: {
                        kind: 'enemyByTags',
                        tagQueryType: 'hasAny',
                        tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
                      },
                      saveToContextKey: 'soul_target',
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
        chr_0036_jsspsi_normal_skill_inkmove_2: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { distancecount: 0, ink_boom_range: 0, ink_damage: 0, ink_poise: 0 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'modifyActionValue_7' } },
            { startFrame: 0, endFrame: 6, sequence: { $sequence: 'applyBuff_13' } },
            { startFrame: 0, endFrame: 21, sequence: { $sequence: 'setIgnoreGlobalTimeScale_14' } },
            { startFrame: 6, endFrame: 20, sequence: { $sequence: 'switch_18' } },
            { startFrame: 19, endFrame: 20, sequence: { $sequence: 'checkCondition_20' } },
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_21' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'applyBuff_65' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'checkCondition_67' } },
            { startFrame: 12, endFrame: 13, sequence: { $sequence: 'checkCondition_69' } },
            { startFrame: 13, endFrame: 14, sequence: { $sequence: 'checkCondition_117' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_5: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 2 },
                    },
                  },
                  next: null,
                },
                modifyActionValue_4: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: null,
                },
                ifElse_6: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                    whenTrue: { $sequence: 'modifyActionValue_4' },
                    whenFalse: { $sequence: 'modifyActionValue_5' },
                  },
                  next: null,
                },
                modifyActionValue_7: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'EntityBB_soulback',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'ifElse_6',
                },
                applyBuff_13: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                setIgnoreGlobalTimeScale_14: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                applyBuff_17: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.4 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyBuff_16: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.15 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                switch_18: {
                  action: {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'valueNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: { $sequence: 'applyBuff_16' },
                      },
                      {
                        value: { kind: 'constant', value: 2 },
                        sequence: { $sequence: 'applyBuff_17' },
                      },
                    ],
                  },
                  next: null,
                },
                readBuffBlackboard_19: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: null,
                },
                checkCondition_20: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                finishBuffsById_21: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                startTimeDilation_41: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.25 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 10,
                      curve: { kind: 'named', key: 'char_normal_attack' },
                      finishByAction: false,
                      targets: [{ kind: 'context', key: 'tar' }, 'caster'],
                    },
                  },
                  next: null,
                },
                ifElse_49: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: null,
                },
                modifyActionValue_50: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_49',
                },
                finishBuffsById_51: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_50',
                },
                dealDamage_52: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_52/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_53: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_52',
                },
                dealDamage_46: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_46/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_47: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_46',
                },
                modifyActionValue_48: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_47',
                },
                ifElse_58: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'modifyActionValue_48' },
                    whenFalse: { $sequence: 'readBuffBlackboard_53' },
                  },
                  next: null,
                },
                readBuffBlackboard_59: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_58',
                },
                setCharacterPassiveUiValue_60: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_59',
                },
                findTargets_61: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_60',
                },
                dealDamage_36: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_36/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_37: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_36',
                },
                dealDamage_30: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_30/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_31: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_30',
                },
                modifyActionValue_32: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_31',
                },
                ifElse_54: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    whenTrue: { $sequence: 'modifyActionValue_32' },
                    whenFalse: { $sequence: 'readBuffBlackboard_37' },
                  },
                  next: null,
                },
                readBuffBlackboard_55: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_54',
                },
                setCharacterPassiveUiValue_56: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_55',
                },
                findTargets_57: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_56',
                },
                ifElse_62: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    whenTrue: { $sequence: 'findTargets_57' },
                    whenFalse: { $sequence: 'findTargets_61' },
                  },
                  next: null,
                },
                readBuffBlackboard_63: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_62',
                },
                checkCondition_64: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                  },
                  next: 'readBuffBlackboard_63',
                },
                applyBuff_65: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_64',
                },
                finishOwner_66: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                checkCondition_67: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                  },
                  next: 'finishOwner_66',
                },
                checkCondition_69: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                ifElse_101: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_15' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: 'finishOwner_66',
                },
                modifyActionValue_102: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_101',
                },
                finishBuffsById_103: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_102',
                },
                dealDamage_104: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_104/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_105: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_104',
                },
                dealDamage_97: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_97/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_98: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_97',
                },
                modifyActionValue_99: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_98',
                },
                ifElse_110: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_16' },
                    whenTrue: { $sequence: 'modifyActionValue_99' },
                    whenFalse: { $sequence: 'readBuffBlackboard_105' },
                  },
                  next: null,
                },
                readBuffBlackboard_111: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_110',
                },
                setCharacterPassiveUiValue_112: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_111',
                },
                findTargets_113: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_112',
                },
                dealDamage_86: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_86/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_87: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_86',
                },
                dealDamage_79: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_2:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkmove_2|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkhurt_front:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_79/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_80: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_79',
                },
                modifyActionValue_81: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_80',
                },
                ifElse_106: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_17' },
                    whenTrue: { $sequence: 'modifyActionValue_81' },
                    whenFalse: { $sequence: 'readBuffBlackboard_87' },
                  },
                  next: null,
                },
                readBuffBlackboard_107: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_106',
                },
                setCharacterPassiveUiValue_108: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_107',
                },
                findTargets_109: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_108',
                },
                ifElse_114: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_18' },
                    whenTrue: { $sequence: 'findTargets_109' },
                    whenFalse: { $sequence: 'findTargets_113' },
                  },
                  next: null,
                },
                readBuffBlackboard_115: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_114',
                },
                applyBuff_116: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'readBuffBlackboard_115',
                },
                checkCondition_117: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
                  },
                  next: 'applyBuff_116',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'targetDistance',
                    source: { kind: 'owner' },
                    target: { kind: 'inputTarget' },
                    distance: 15,
                    lessThan: true,
                    includeTargetRadius: true,
                    containsHittableObject: false,
                  },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_6: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage' } },
                data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ink_poise' } },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'ink_damage', fallback: 0 },
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
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_11: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_12: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_13: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_14: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_15: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_16: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_17: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_18: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_19: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                },
              },
            },
            macros: {},
          },
        },
        chr_0036_jsspsi_normal_skill_born: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_canbehit' }],
                      targets: { kind: 'source' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0036_jsspsi_normal_skill_born',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_1' } },
          ],
        },
        chr_0036_jsspsi_normal_skill_inkhurt_front: {
          actionGraph: { main: { nodes: {} }, macros: {} },
          skillId: 'chr_0036_jsspsi_normal_skill_inkhurt_front',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 24,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [],
        },
      },
    },
    abilityentity_chr_0036_jsspsi_combo_skill_inkphantom: {
      faction: 'bad',
      soul: {
        useMainBodyHp: false,
        useMainBodyPoise: true,
        canBeHitIndividually: false,
        onlyHitByNormalAttack: false,
        canBeDirectlyBuffed: false,
        asIndividualInExcludeTargetProcessor: false,
        damageTransferType: 'sharedDamage',
        damageRatio: 0,
        poiseRatio: 1,
        soulHpBlackboardKey: 'EntityBB_soul_hp',
        soulDamageRatio: 1,
        soulPoiseRatio: 1,
        asPrimaryTarget: true,
      },
      bornTags: [
        'Skill/Character/chr_0036_jsspsi/soul/inksoul',
        'Visual/ShowHPBar/HideLevel',
        'Visual/ShowHPBar/ShowWhenFullHp',
        'Immune/Airborne',
        'Immune/Pull',
      ],
      blackboard: { EntityBB_duration: 0, EntityBB_soul_hp: 10000000000 },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 15 },
      },
      maxStackingCount: 1,
      childSkills: {
        chr_0036_jsspsi_normal_skill_inkmove_1: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'setIgnoreGlobalTimeScale_1' } },
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'findTargets_opt1' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                setIgnoreGlobalTimeScale_1: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                findTargets_opt1: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'mainCharacter' },
                      query: {
                        kind: 'enemyByTags',
                        tagQueryType: 'hasAny',
                        tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
                      },
                      saveToContextKey: 'soul_target',
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
        chr_0036_jsspsi_normal_skill_inkhurt_front: {
          actionGraph: { main: { nodes: {} }, macros: {} },
          skillId: 'chr_0036_jsspsi_normal_skill_inkhurt_front',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 24,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [],
        },
        chr_0036_jsspsi_normal_skill_born: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_canbehit' }],
                      targets: { kind: 'source' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0036_jsspsi_normal_skill_born',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_1' } },
          ],
        },
        chr_0036_jsspsi_normal_skill_inkmove_2: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { distancecount: 0, ink_boom_range: 0, ink_damage: 0, ink_poise: 0 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'modifyActionValue_7' } },
            { startFrame: 0, endFrame: 6, sequence: { $sequence: 'applyBuff_13' } },
            { startFrame: 0, endFrame: 21, sequence: { $sequence: 'setIgnoreGlobalTimeScale_14' } },
            { startFrame: 6, endFrame: 20, sequence: { $sequence: 'switch_18' } },
            { startFrame: 19, endFrame: 20, sequence: { $sequence: 'checkCondition_20' } },
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_21' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'applyBuff_65' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'checkCondition_67' } },
            { startFrame: 12, endFrame: 13, sequence: { $sequence: 'checkCondition_69' } },
            { startFrame: 13, endFrame: 14, sequence: { $sequence: 'checkCondition_117' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_5: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 2 },
                    },
                  },
                  next: null,
                },
                modifyActionValue_4: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: null,
                },
                ifElse_6: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                    whenTrue: { $sequence: 'modifyActionValue_4' },
                    whenFalse: { $sequence: 'modifyActionValue_5' },
                  },
                  next: null,
                },
                modifyActionValue_7: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'EntityBB_soulback',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'ifElse_6',
                },
                applyBuff_13: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                setIgnoreGlobalTimeScale_14: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                applyBuff_17: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.4 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyBuff_16: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.15 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                switch_18: {
                  action: {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'valueNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: { $sequence: 'applyBuff_16' },
                      },
                      {
                        value: { kind: 'constant', value: 2 },
                        sequence: { $sequence: 'applyBuff_17' },
                      },
                    ],
                  },
                  next: null,
                },
                readBuffBlackboard_19: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: null,
                },
                checkCondition_20: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                finishBuffsById_21: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                startTimeDilation_41: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.25 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 10,
                      curve: { kind: 'named', key: 'char_normal_attack' },
                      finishByAction: false,
                      targets: [{ kind: 'context', key: 'tar' }, 'caster'],
                    },
                  },
                  next: null,
                },
                ifElse_49: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: null,
                },
                modifyActionValue_50: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_49',
                },
                finishBuffsById_51: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_50',
                },
                dealDamage_52: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_52/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_53: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_52',
                },
                dealDamage_46: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_46/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_47: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_46',
                },
                modifyActionValue_48: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_47',
                },
                ifElse_58: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'modifyActionValue_48' },
                    whenFalse: { $sequence: 'readBuffBlackboard_53' },
                  },
                  next: null,
                },
                readBuffBlackboard_59: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_58',
                },
                setCharacterPassiveUiValue_60: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_59',
                },
                findTargets_61: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_60',
                },
                dealDamage_36: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_36/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_37: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_36',
                },
                dealDamage_30: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_30/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_31: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_30',
                },
                modifyActionValue_32: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_31',
                },
                ifElse_54: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    whenTrue: { $sequence: 'modifyActionValue_32' },
                    whenFalse: { $sequence: 'readBuffBlackboard_37' },
                  },
                  next: null,
                },
                readBuffBlackboard_55: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_54',
                },
                setCharacterPassiveUiValue_56: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_55',
                },
                findTargets_57: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_56',
                },
                ifElse_62: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    whenTrue: { $sequence: 'findTargets_57' },
                    whenFalse: { $sequence: 'findTargets_61' },
                  },
                  next: null,
                },
                readBuffBlackboard_63: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_62',
                },
                checkCondition_64: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                  },
                  next: 'readBuffBlackboard_63',
                },
                applyBuff_65: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_64',
                },
                finishOwner_66: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                checkCondition_67: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                  },
                  next: 'finishOwner_66',
                },
                checkCondition_69: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                ifElse_101: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_15' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: 'finishOwner_66',
                },
                modifyActionValue_102: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_101',
                },
                finishBuffsById_103: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_102',
                },
                dealDamage_104: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_104/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_105: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_104',
                },
                dealDamage_97: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_97/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_98: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_97',
                },
                modifyActionValue_99: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_98',
                },
                ifElse_110: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_16' },
                    whenTrue: { $sequence: 'modifyActionValue_99' },
                    whenFalse: { $sequence: 'readBuffBlackboard_105' },
                  },
                  next: null,
                },
                readBuffBlackboard_111: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_110',
                },
                setCharacterPassiveUiValue_112: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_111',
                },
                findTargets_113: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_112',
                },
                dealDamage_86: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_86/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_87: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_86',
                },
                dealDamage_79: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom:chr_0036_jsspsi_normal_skill_inkmove_1||chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_79/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_80: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_79',
                },
                modifyActionValue_81: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_80',
                },
                ifElse_106: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_17' },
                    whenTrue: { $sequence: 'modifyActionValue_81' },
                    whenFalse: { $sequence: 'readBuffBlackboard_87' },
                  },
                  next: null,
                },
                readBuffBlackboard_107: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_106',
                },
                setCharacterPassiveUiValue_108: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_107',
                },
                findTargets_109: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_108',
                },
                ifElse_114: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_18' },
                    whenTrue: { $sequence: 'findTargets_109' },
                    whenFalse: { $sequence: 'findTargets_113' },
                  },
                  next: null,
                },
                readBuffBlackboard_115: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_114',
                },
                applyBuff_116: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'readBuffBlackboard_115',
                },
                checkCondition_117: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
                  },
                  next: 'applyBuff_116',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'targetDistance',
                    source: { kind: 'owner' },
                    target: { kind: 'inputTarget' },
                    distance: 15,
                    lessThan: true,
                    includeTargetRadius: true,
                    containsHittableObject: false,
                  },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_6: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage' } },
                data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ink_poise' } },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'ink_damage', fallback: 0 },
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
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_11: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_12: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_13: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_14: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_15: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_16: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_17: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_18: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_19: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                },
              },
            },
            macros: {},
          },
        },
      },
    },
    abilityentity_chr_0036_jsspsi_ultimate_skill_inklong02: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
    },
    abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1: {
      faction: 'bad',
      bornTags: [
        'Visual/ShowHPBar/HideLevel',
        'Visual/ShowHPBar/ShowWhenFullHp',
        'SelectCategory/Unmarkable',
        'Status/UnLockable',
        'Visual/ShowHPBar/OnlySpecialCountDownBar',
        'Immune/Airborne',
        'Immune/Pull',
        'Skill/Character/chr_0036_jsspsi/soul/souldisplay',
      ],
      blackboard: { EntityBB_duration: 0, EntityBB_soul_hp: 100 },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 15 },
      },
      maxStackingCount: 1,
      childSkills: {
        chr_0036_jsspsi_normal_skill_inkhurt_front: {
          actionGraph: { main: { nodes: {} }, macros: {} },
          skillId: 'chr_0036_jsspsi_normal_skill_inkhurt_front',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 24,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [],
        },
        chr_0036_jsspsi_normal_skill_born: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_inkphantom_canbehit' }],
                      targets: { kind: 'source' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0036_jsspsi_normal_skill_born',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_1' } },
          ],
        },
        chr_0036_jsspsi_normal_skill_inkmove_1: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 9,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'setIgnoreGlobalTimeScale_1' } },
            { startFrame: 0, endFrame: 9, sequence: { $sequence: 'findTargets_opt1' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                setIgnoreGlobalTimeScale_1: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                findTargets_opt1: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'mainCharacter' },
                      query: {
                        kind: 'enemyByTags',
                        tagQueryType: 'hasAny',
                        tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoultarget'],
                      },
                      saveToContextKey: 'soul_target',
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
        chr_0036_jsspsi_normal_skill_inkmove_2: {
          skillId: 'chr_0036_jsspsi_normal_skill_inkmove_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { distancecount: 0, ink_boom_range: 0, ink_damage: 0, ink_poise: 0 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'modifyActionValue_7' } },
            { startFrame: 0, endFrame: 6, sequence: { $sequence: 'applyBuff_13' } },
            { startFrame: 0, endFrame: 21, sequence: { $sequence: 'setIgnoreGlobalTimeScale_14' } },
            { startFrame: 6, endFrame: 20, sequence: { $sequence: 'switch_18' } },
            { startFrame: 19, endFrame: 20, sequence: { $sequence: 'checkCondition_20' } },
            { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_21' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'applyBuff_65' } },
            { startFrame: 20, endFrame: 21, sequence: { $sequence: 'checkCondition_67' } },
            { startFrame: 12, endFrame: 13, sequence: { $sequence: 'checkCondition_69' } },
            { startFrame: 13, endFrame: 14, sequence: { $sequence: 'checkCondition_117' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                modifyActionValue_5: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 2 },
                    },
                  },
                  next: null,
                },
                modifyActionValue_4: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'distancecount',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: null,
                },
                ifElse_6: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                    whenTrue: { $sequence: 'modifyActionValue_4' },
                    whenFalse: { $sequence: 'modifyActionValue_5' },
                  },
                  next: null,
                },
                modifyActionValue_7: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'EntityBB_soulback',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'ifElse_6',
                },
                applyBuff_13: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                setIgnoreGlobalTimeScale_14: {
                  action: {
                    kind: 'setIgnoreGlobalTimeScale',
                    parameters: {
                      abilityEntityTargets: [{ kind: 'current' }],
                      ignore: true,
                      revertOnEnd: true,
                    },
                  },
                  next: null,
                },
                applyBuff_17: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.4 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyBuff_16: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0036_jsspsi_normal_skill_finish_immune',
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.15 } },
                        },
                      ],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                switch_18: {
                  action: {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'valueNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: { $sequence: 'applyBuff_16' },
                      },
                      {
                        value: { kind: 'constant', value: 2 },
                        sequence: { $sequence: 'applyBuff_17' },
                      },
                    ],
                  },
                  next: null,
                },
                readBuffBlackboard_19: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: null,
                },
                checkCondition_20: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                finishBuffsById_21: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                startTimeDilation_41: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.25 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 10,
                      curve: { kind: 'named', key: 'char_normal_attack' },
                      finishByAction: false,
                      targets: [{ kind: 'context', key: 'tar' }, 'caster'],
                    },
                  },
                  next: null,
                },
                ifElse_49: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: null,
                },
                modifyActionValue_50: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_49',
                },
                finishBuffsById_51: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_50',
                },
                dealDamage_52: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_52/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_53: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_52',
                },
                dealDamage_46: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_46/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_47: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_46',
                },
                modifyActionValue_48: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_47',
                },
                ifElse_58: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'modifyActionValue_48' },
                    whenFalse: { $sequence: 'readBuffBlackboard_53' },
                  },
                  next: null,
                },
                readBuffBlackboard_59: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_58',
                },
                setCharacterPassiveUiValue_60: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_59',
                },
                findTargets_61: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_60',
                },
                dealDamage_36: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_36/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_37: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_36',
                },
                dealDamage_30: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_30/action',
                  },
                  next: 'finishBuffsById_51',
                },
                readBuffBlackboard_31: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_30',
                },
                modifyActionValue_32: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_31',
                },
                ifElse_54: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    whenTrue: { $sequence: 'modifyActionValue_32' },
                    whenFalse: { $sequence: 'readBuffBlackboard_37' },
                  },
                  next: null,
                },
                readBuffBlackboard_55: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_54',
                },
                setCharacterPassiveUiValue_56: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_55',
                },
                findTargets_57: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_56',
                },
                ifElse_62: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    whenTrue: { $sequence: 'findTargets_57' },
                    whenFalse: { $sequence: 'findTargets_61' },
                  },
                  next: null,
                },
                readBuffBlackboard_63: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_62',
                },
                checkCondition_64: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                  },
                  next: 'readBuffBlackboard_63',
                },
                applyBuff_65: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_64',
                },
                finishOwner_66: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                checkCondition_67: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                  },
                  next: 'finishOwner_66',
                },
                checkCondition_69: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
                  },
                  next: 'readBuffBlackboard_19',
                },
                ifElse_101: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_15' },
                    whenTrue: { $sequence: 'startTimeDilation_41' },
                    whenFalse: { $sequence: 'startTimeDilation_41' },
                  },
                  next: 'finishOwner_66',
                },
                modifyActionValue_102: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'ifElse_101',
                },
                finishBuffsById_103: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect',
                        'buff_chr_0036_jsspsi_xianjing_inkhurteffect_1',
                      ],
                      reason: 'other',
                    },
                  },
                  next: 'modifyActionValue_102',
                },
                dealDamage_104: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_104/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_105: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_104',
                },
                dealDamage_97: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_97/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_98: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_97',
                },
                modifyActionValue_99: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_98',
                },
                ifElse_110: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_16' },
                    whenTrue: { $sequence: 'modifyActionValue_99' },
                    whenFalse: { $sequence: 'readBuffBlackboard_105' },
                  },
                  next: null,
                },
                readBuffBlackboard_111: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_110',
                },
                setCharacterPassiveUiValue_112: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_111',
                },
                findTargets_113: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_112',
                },
                dealDamage_86: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_86/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_87: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_86',
                },
                dealDamage_79: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'fixed',
                      attackScale: { kind: 'constant', value: 1 },
                      calculation: 'definite',
                      calculationValue: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0036_jsspsi_combo_skill_inkphantom_1:|chr_0036_jsspsi_normal_skill_inkhurt_front|chr_0036_jsspsi_normal_skill_born|chr_0036_jsspsi_normal_skill_inkmove_1|chr_0036_jsspsi_normal_skill_inkmove_2:/childSkills/chr_0036_jsspsi_normal_skill_inkmove_2/actionGraph/main/nodes/dealDamage_79/action',
                  },
                  next: 'finishBuffsById_103',
                },
                readBuffBlackboard_80: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_poise',
                      outputKey: 'ink_poise',
                    },
                  },
                  next: 'dealDamage_79',
                },
                modifyActionValue_81: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'ink_damage',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'readBuffBlackboard_80',
                },
                ifElse_106: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_17' },
                    whenTrue: { $sequence: 'modifyActionValue_81' },
                    whenFalse: { $sequence: 'readBuffBlackboard_87' },
                  },
                  next: null,
                },
                readBuffBlackboard_107: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'ink_damage',
                      outputKey: 'ink_damage',
                    },
                  },
                  next: 'ifElse_106',
                },
                setCharacterPassiveUiValue_108: {
                  action: {
                    kind: 'setCharacterPassiveUiValue',
                    parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
                  },
                  next: 'readBuffBlackboard_107',
                },
                findTargets_109: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: {
                        kind: 'allyHitBox',
                        owner: { kind: 'owner' },
                        checkAlive: true,
                        containsUnmarkable: false,
                        replacePartsWithMainBodies: true,
                      },
                      saveToContextKey: 'tar',
                    },
                  },
                  next: 'setCharacterPassiveUiValue_108',
                },
                ifElse_114: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_18' },
                    whenTrue: { $sequence: 'findTargets_109' },
                    whenFalse: { $sequence: 'findTargets_113' },
                  },
                  next: null,
                },
                readBuffBlackboard_115: {
                  action: {
                    kind: 'readBuffBlackboard',
                    parameters: {
                      target: 'caster',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_chr_0036_jsspsi_normal_skill_inkphantom_damage'],
                      },
                      desiredKey: 'EntityBB_ink_boom_range',
                      outputKey: 'ink_boom_range',
                    },
                  },
                  next: 'ifElse_114',
                },
                applyBuff_116: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0036_jsspsi_normal_skill_boomrevert' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'readBuffBlackboard_115',
                },
                checkCondition_117: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
                  },
                  next: 'applyBuff_116',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'targetDistance',
                    source: { kind: 'owner' },
                    target: { kind: 'inputTarget' },
                    distance: 15,
                    lessThan: true,
                    includeTargetRadius: true,
                    containsHittableObject: false,
                  },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'distancecount', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_6: { type: 'number', expression: { kind: 'blackboard', key: 'ink_damage' } },
                data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ink_poise' } },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'ink_damage', fallback: 0 },
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
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_11: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_12: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_13: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_14: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_15: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_16: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_17: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_8' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                data_18: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_19: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
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

export default si;
