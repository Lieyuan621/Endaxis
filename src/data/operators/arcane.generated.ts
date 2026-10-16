/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const arcaneChr_0032_lizhiyan_attack1ActionGraph = {
  main: {
    nodes: {
      dealDamage_13: {
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
      repeatEachTick_15: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.1,
            },
          },
          body: { $sequence: 'dealDamage_13' },
        },
        next: null,
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.1,
            },
          },
          body: { $sequence: 'dealDamage_13' },
        },
        next: 'repeatEachTick_15',
      },
      reachSkillOperableBoundary_17: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0032_lizhiyan_attack2'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'dealDamage_13' },
          whenFalse: { $sequence: 'dealDamage_13' },
        },
        next: null,
      },
      repeatEachTick_opt2: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.1,
            },
          },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_attack1: SkillDefinition = {
  key: 'chr_0032_lizhiyan_attack1',
  element: 'nature',
  blackboard: {
    atk_scale: [0.062, 0.069, 0.075, 0.081, 0.087, 0.094, 0.1, 0.106, 0.112, 0.12, 0.129, 0.14],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 224,
  exclusiveFrame: 30,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 3,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0032_lizhiyan_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 30, skillIds: ['chr_0032_lizhiyan_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'repeatEachTick_opt2' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'repeatEachTick_16' } },
    { startFrame: 10, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_17' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0032_lizhiyan_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_attack1ActionGraph,
};

export const arcaneChr_0032_lizhiyan_attack2ActionGraph = {
  main: {
    nodes: {
      dealDamage_15: {
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
      changeResource_18: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 0.167 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_19: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'changeResource_18' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_29: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0032_lizhiyan_attack3'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'dealDamage_15' },
          whenFalse: { $sequence: 'dealDamage_15' },
        },
        next: null,
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      forEachContextTarget_opt3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: 'ifElse_19',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_attack2: SkillDefinition = {
  key: 'chr_0032_lizhiyan_attack2',
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.071, 0.078, 0.085, 0.092, 0.099, 0.107, 0.114, 0.121, 0.128, 0.137, 0.147, 0.16],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 215,
  exclusiveFrame: 30,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0032_lizhiyan_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 32, skillIds: ['chr_0032_lizhiyan_attack3'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'forEachContextTarget_opt2' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'forEachContextTarget_opt3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'forEachContextTarget_opt3' } },
    { startFrame: 14, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_29' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0032_lizhiyan_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_attack2ActionGraph,
};

export const arcaneChr_0032_lizhiyan_attack3ActionGraph = {
  main: {
    nodes: {
      dealDamage_5: {
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
      changeResource_8: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 0.167 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'changeResource_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_23: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0032_lizhiyan_attack4'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'dealDamage_5' },
          whenFalse: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: 'ifElse_9',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_attack3: SkillDefinition = {
  key: 'chr_0032_lizhiyan_attack3',
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.38],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 235,
  exclusiveFrame: 30,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0032_lizhiyan_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 39, skillIds: ['chr_0032_lizhiyan_attack4'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'forEachContextTarget_opt2' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'forEachContextTarget_opt2' } },
    { startFrame: 22, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_23' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0032_lizhiyan_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_attack3ActionGraph,
};

export const arcaneChr_0032_lizhiyan_attack4ActionGraph = {
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
      mergeContextTargets_2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_1',
      },
      mergeContextTargets_10: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar2', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_1',
      },
      createTimedMarker_17: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'lizhiyan_attack4',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'createTimedMarker_17',
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_18',
      },
      forEachContextTarget_20: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_19' },
        },
        next: null,
      },
      reachSkillOperableBoundary_21: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0032_lizhiyan_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'caster',
          markerId: 'lizhiyan_attack4',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_attack4: SkillDefinition = {
  key: 'chr_0032_lizhiyan_attack4',
  element: 'nature',
  blackboard: {
    atk_scale: [0.045, 0.049, 0.053, 0.058, 0.062, 0.067, 0.071, 0.076, 0.08, 0.086, 0.092, 0.1],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 230,
  exclusiveFrame: 26,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0032_lizhiyan_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 39, skillIds: ['chr_0032_lizhiyan_attack5'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'mergeContextTargets_2' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'mergeContextTargets_2' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'mergeContextTargets_2' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'mergeContextTargets_2' } },
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'mergeContextTargets_10' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'mergeContextTargets_10' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'mergeContextTargets_10' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'mergeContextTargets_10' } },
    { startFrame: 4, endFrame: 36, sequence: { $sequence: 'forEachContextTarget_20' } },
    { startFrame: 18, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0032_lizhiyan_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_attack4ActionGraph,
};

export const arcaneChr_0032_lizhiyan_attack5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isHitbyMain',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
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
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: null },
        },
        next: 'changeResource_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
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
        next: 'ifElse_6',
      },
      startTimeDilation_9: {
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
                  value: 0.6,
                  inTangent: -7.07589,
                  outTangent: -7.07589,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.15,
                  value: 0.03,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5,
                  value: 0.1,
                  inTangent: 0.4752959,
                  outTangent: 0.4752959,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.8,
                  inTangent: 2.06752,
                  outTangent: 2.06752,
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
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      createTimedMarker_20: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'lizhiyan_attack5',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      checkCondition_21: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'createTimedMarker_20',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'checkCondition_21',
      },
      reachSkillOperableBoundary_35: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0032_lizhiyan_attack1'] },
        },
        next: null,
      },
      forEachContextTarget_opt1: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_22' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'forEachContextTarget_opt1' },
          whenFalse: { $sequence: 'forEachContextTarget_opt1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'isHitbyMain', fallback: 0 },
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
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'caster',
          markerId: 'lizhiyan_attack5',
        },
      },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_attack5: SkillDefinition = {
  key: 'chr_0032_lizhiyan_attack5',
  element: 'nature',
  blackboard: {
    atb: 17,
    atk_scale: [0.47, 0.52, 0.56, 0.61, 0.66, 0.71, 0.75, 0.8, 0.85, 0.9, 0.98, 1.06],
    isHitbyMain: 0,
    poise: 17,
  },
  timelineBlockFrames: 40,
  naturalDurationFrames: 300,
  exclusiveFrame: 41,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 50,
        input: 'basicAttack',
        targetSkillId: 'chr_0032_lizhiyan_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 40, endFrame: 50, skillIds: ['chr_0032_lizhiyan_attack1'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 22, endFrame: 25, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 23, endFrame: 25, sequence: { $sequence: 'ifElse_10' } },
    { startFrame: 22, endFrame: 25, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 40, endFrame: 50, sequence: { $sequence: 'reachSkillOperableBoundary_35' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0032_lizhiyan_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_attack5ActionGraph,
};

export const arcaneChr_0032_lizhiyan_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
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
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: -7,
                  outTangent: -7,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.07,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.898291,
                  value: 0.1031128,
                  inTangent: 0.03048408,
                  outTangent: 0.03048408,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.3,
                  inTangent: 2.232943,
                  outTangent: 2.232943,
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
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'startTimeDilation_4',
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_5',
      },
      repeatEachTick_8: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'inputTarget' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 2,
              targetTriggerIntervalSeconds: 0.067,
            },
          },
          body: { $sequence: 'dealDamage_1' },
        },
        next: null,
      },
      createTimedMarker_9: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'lizhiyan_power_attack_effect',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      applyBuff_10: {
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
      applyBuff_11: {
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

export const arcaneChr_0032_lizhiyan_power_attack: SkillDefinition = {
  key: 'chr_0032_lizhiyan_power_attack',
  element: 'nature',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 52,
  naturalDurationFrames: 163,
  exclusiveFrame: 51,
  offsetRecordFrame: 21,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 34,
        endFrame: 51,
        skillIds: ['chr_0032_lizhiyan_normal_skill', 'chr_0032_lizhiyan_combo_skill'],
      },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 36, endFrame: 39, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 32, endFrame: 35, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 7, endFrame: 37, sequence: { $sequence: 'createTimedMarker_9' } },
    { startFrame: 0, endFrame: 51, sequence: { $sequence: 'applyBuff_10' } },
    { startFrame: 0, endFrame: 37, sequence: { $sequence: 'applyBuff_11' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: arcaneChr_0032_lizhiyan_power_attackActionGraph,
};

export const arcaneChr_0032_lizhiyan_plunging_attack_endActionGraph = {
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

export const arcaneChr_0032_lizhiyan_plunging_attack_end: SkillDefinition = {
  key: 'chr_0032_lizhiyan_plunging_attack_end',
  element: 'nature',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 120,
  exclusiveFrame: 12,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arcaneChr_0032_lizhiyan_plunging_attack_endActionGraph,
};

export const arcaneChr_0032_lizhiyan_normal_skillActionGraph = {
  main: {
    nodes: {
      createSpatialPointTargets_6: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'center', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'center' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_normal_skill',
            childSkillId: 'chr_0032_lizhiyan_normal_skill_abilityrange2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 7 },
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'valueNode', nodeId: 'data_1' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_normal_skill: SkillDefinition = {
  key: 'chr_0032_lizhiyan_normal_skill',
  useSkillGroupIcon: true,
  element: 'nature',
  blackboard: {
    atk_scale: 2.85,
    atk_scale_will: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    atk_scale_wisd: [2.22, 2.45, 2.67, 2.89, 3.11, 3.33, 3.56, 3.78, 4, 4.28, 4.61, 5],
    poise: 10,
    radius: 5,
  },
  timelineBlockFrames: 33,
  naturalDurationFrames: 225,
  exclusiveFrame: 32,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 56, skillIds: ['chr_0032_lizhiyan_combo_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'createSpatialPointTargets_6' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'spawnAbilityEntity_7' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: arcaneChr_0032_lizhiyan_normal_skillActionGraph,
};

export const arcaneChr_0032_lizhiyan_combo_skillActionGraph = {
  main: {
    nodes: {
      calculateActionValue_15: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'rate_final',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      calculateActionValue_16: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'rate_final',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_15',
      },
      ifElse_19: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'calculateActionValue_15' },
          whenFalse: { $sequence: 'calculateActionValue_16' },
        },
        next: null,
      },
      calculateActionValue_20: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'rate_final',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'ifElse_19',
      },
      storeSourceAttributeValue_21: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'will',
          },
        },
        next: 'calculateActionValue_20',
      },
      modifyActionValue_18: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'rate_final',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      mergeContextTargets_32: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'trigger',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: null,
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'mergeContextTargets_32' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_34: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.033 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          },
        },
        next: null,
      },
      setAbilityEntityRemainingDuration_35: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin4' },
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: null,
      },
      setAbilityEntityRemainingDuration_36: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin3' },
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_35',
      },
      setAbilityEntityRemainingDuration_37: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin2' },
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_36',
      },
      setAbilityEntityRemainingDuration_38: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin1' },
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_37',
      },
      spawnAbilityEntity_39: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'fixed', target: 'enemy' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'FR' },
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin4',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'valueNode', nodeId: 'data_10' },
            },
          },
        },
        next: 'setAbilityEntityRemainingDuration_38',
      },
      spawnAbilityEntity_40: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'fixed', target: 'enemy' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'FL' },
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin3',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'valueNode', nodeId: 'data_10' },
            },
          },
        },
        next: 'spawnAbilityEntity_39',
      },
      spawnAbilityEntity_41: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'fixed', target: 'enemy' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'BR' },
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin2',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'valueNode', nodeId: 'data_10' },
            },
          },
        },
        next: 'spawnAbilityEntity_40',
      },
      spawnAbilityEntity_42: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'fixed', target: 'enemy' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'context', key: 'BL' },
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin1',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'valueNode', nodeId: 'data_10' },
            },
          },
        },
        next: 'spawnAbilityEntity_41',
      },
      createSpatialPointTargets_43: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'FR', count: { kind: 'constant', value: 1 } },
        },
        next: 'spawnAbilityEntity_42',
      },
      createSpatialPointTargets_44: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'FL', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_43',
      },
      createSpatialPointTargets_45: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'BR', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_44',
      },
      createSpatialPointTargets_46: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'BL', count: { kind: 'constant', value: 1 } },
        },
        next: 'createSpatialPointTargets_45',
      },
      checkCondition_47: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'createSpatialPointTargets_46',
      },
      setAbilityEntityRemainingDuration_49: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin4' },
            value: { kind: 'constant', value: 30 },
          },
        },
        next: null,
      },
      setAbilityEntityRemainingDuration_50: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin3' },
            value: { kind: 'constant', value: 30 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_49',
      },
      setAbilityEntityRemainingDuration_51: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin2' },
            value: { kind: 'constant', value: 30 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_50',
      },
      setAbilityEntityRemainingDuration_52: {
        action: {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: 'bunshin1' },
            value: { kind: 'constant', value: 30 },
          },
        },
        next: 'setAbilityEntityRemainingDuration_51',
      },
      ifElse_53: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'setAbilityEntityRemainingDuration_52' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_54: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_combo_skill_precheck' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      calculateActionValue_55: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'duration_total',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_13' },
            right: { kind: 'constant', value: 0.067 },
          },
        },
        next: null,
      },
      applyBuff_56: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_total',
                copiedBlackboardAssignments: {
                  duration_total: 'duration_total',
                  duration_final: 'duration_final',
                  rate_final: 'rate_final',
                  trigger_time: 'trigger_time',
                  isWisd: 'EntityBB_wisd_greater_will',
                  atk_scale_boom: 'atk_scale_boom',
                  poise_boom: 'poise_boom',
                  duration_seal2: 'duration',
                  atk_scale_touch: 'atk_scale_touch',
                  poise_touch: 'poise_touch',
                  usp: 'usp',
                  atb_return_wisd: 'atb_return_wisd',
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
      startTimeDilation_57: {
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
      findCharacterTeamTargets_60: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      ifElse_61: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_60' },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'storeSourceAttributeValue_21',
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'modifyActionValue_18' },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      calculateActionValue_opt3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'trigger_time',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_13' },
            right: { kind: 'constant', value: -0.5 },
          },
        },
        next: 'ifElse_opt2',
      },
      calculateActionValue_opt4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'duration_final',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_18' },
            right: { kind: 'valueNode', nodeId: 'data_19' },
          },
        },
        next: 'calculateActionValue_opt3',
      },
      calculateActionValue_opt5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'duration',
            operation: 'add',
            left: { kind: 'constant', value: 0 },
            right: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'calculateActionValue_opt4',
      },
      ifElse_opt6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'calculateActionValue_opt4' },
          whenFalse: { $sequence: 'calculateActionValue_opt5' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'rate_final' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate_pre' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'max_spell_vul_will' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'rate_final', fallback: 0 },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_spell_vul_will', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_5' },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vul_per_will' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'will' } },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
      },
      data_11: {
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
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'duration_final' } },
      data_14: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_15: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_16: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'duration_pre' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'duration_will' } },
      data_21: {
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

export const arcaneChr_0032_lizhiyan_combo_skill: SkillDefinition = {
  key: 'chr_0032_lizhiyan_combo_skill',
  useSkillGroupIcon: true,
  element: 'nature',
  blackboard: {
    atb_return_wisd: [28, 28, 28, 28, 28, 28, 28, 28, 28, 30, 30, 30],
    atk_scale_boom: [0.53, 0.59, 0.64, 0.69, 0.75, 0.8, 0.85, 0.91, 0.96, 1.03, 1.11, 1.2],
    atk_scale_laser1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_laser2: [1.15, 1.27, 1.38, 1.5, 1.62, 1.73, 1.85, 1.96, 2.08, 2.22, 2.39, 2.6],
    atk_scale_touch: [0.35, 0.39, 0.42, 0.46, 0.5, 0.53, 0.57, 0.6, 0.64, 0.68, 0.73, 0.8],
    cd_reduce: 0,
    duration: 4,
    duration_extra: 6,
    duration_final: 0,
    duration_pre: 0.633,
    duration_total: 0,
    duration_will: 6,
    max_spell_vul_will: [0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.075, 0.075, 0.075, 0.08],
    poise_boom: 5,
    poise_laser: 0,
    poise_touch: 5,
    rate: 0.4,
    rate_final: 0,
    rate_pre: 0.04,
    spell_vul_per_will: 0.000125,
    trigger_time: 0,
    usp: 10,
    will: 0,
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 122,
  exclusiveFrame: 23,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 16, endFrame: 39, skillIds: ['chr_0032_lizhiyan_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_opt6' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_33' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'startTimeDilation_34' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'checkCondition_47' } },
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'ifElse_53' } },
    { startFrame: 0, endFrame: 11, sequence: { $sequence: 'applyBuff_54' } },
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'calculateActionValue_55' } },
    { startFrame: 9, endFrame: 30, sequence: { $sequence: 'applyBuff_56' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_57' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'ifElse_61' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: arcaneChr_0032_lizhiyan_combo_skillActionGraph,
};

export const arcaneChr_0032_lizhiyan_ultimate_skillActionGraph = {
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
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
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
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0032_lizhiyan_ultimate_skill_listener',
              'buff_chr_0032_lizhiyan_ultimate_skill_layer',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      setIgnoreGlobalTimeScale_6: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [
              {
                kind: 'ownerSpawned',
                abilityEntityIds: [
                  'abilityentity_chr_0032_lizhiyan_ultimate_skill',
                  'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
                ],
              },
            ],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 7 } },
          },
        },
        next: 'setIgnoreGlobalTimeScale_6',
      },
      spawnAbilityEntity_8: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 6 } },
          },
        },
        next: 'spawnAbilityEntity_7',
      },
      spawnAbilityEntity_9: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 5 } },
          },
        },
        next: 'spawnAbilityEntity_8',
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 4 } },
          },
        },
        next: 'spawnAbilityEntity_9',
      },
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 3 } },
          },
        },
        next: 'spawnAbilityEntity_10',
      },
      spawnAbilityEntity_12: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 2 } },
          },
        },
        next: 'spawnAbilityEntity_11',
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 1 } },
          },
        },
        next: 'spawnAbilityEntity_12',
      },
      spawnAbilityEntity_14: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 0 } },
          },
        },
        next: 'spawnAbilityEntity_13',
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'spawnAbilityEntity_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isWisd',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'spawnAbilityEntity_15',
      },
      finishOwner_17: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'owner' },
              objectType: 'abilityEntity',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
              sameSourceSkillCast: false,
            },
          },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_owner',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  isWisd: 'EntityBB_wisd_greater_will',
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
      restrictUltimateEnergyRecovery_19: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: false,
          },
        },
        next: null,
      },
      applyElementalInfliction_21: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: null,
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'applyElementalInfliction_21' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyElementalInfliction_23: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false },
        },
        next: null,
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyElementalInfliction_23' },
          whenFalse: { $sequence: 'ifElse_24' },
        },
        next: null,
      },
      applyElementalInfliction_26: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: null,
      },
      ifElse_30: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'applyElementalInfliction_26' },
          whenFalse: { $sequence: 'ifElse_27' },
        },
        next: null,
      },
      applyElementalInfliction_29: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: null,
      },
      ifElse_31: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'applyElementalInfliction_29' },
          whenFalse: { $sequence: 'ifElse_30' },
        },
        next: null,
      },
      forEachContextTarget_34: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_31' },
        },
        next: null,
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_natural_natural_corrupt_triggered',
                copiedBlackboardAssignments: { count: 'count', duration: 'duration2' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                copiedBlackboardAssignments: { rate: 'spell_vul_rate', duration: 'duration_vul' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_39: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'spell_vul_rate',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'applyBuff_38',
      },
      applyBuff_36: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                copiedBlackboardAssignments: {
                  rate: 'spell_vul_rate_calc',
                  duration: 'duration_vul',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_37: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'spell_vul_rate_calc',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'applyBuff_36',
      },
      ifElse_41: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'modifyActionValue_37' },
          whenFalse: { $sequence: 'modifyActionValue_39' },
        },
        next: null,
      },
      calculateActionValue_42: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'spell_vul_rate_calc',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_11' },
            right: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'ifElse_41',
      },
      storeSourceAttributeValue_43: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'will',
          },
        },
        next: 'calculateActionValue_42',
      },
      readBuffBlackboard_44: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate_per_will',
            outputKey: 'spell_vul_rate_per_will',
          },
        },
        next: 'storeSourceAttributeValue_43',
      },
      readBuffBlackboard_45: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'duration',
            outputKey: 'duration_vul',
          },
        },
        next: 'readBuffBlackboard_44',
      },
      checkCondition_46: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'readBuffBlackboard_45',
      },
      calculateActionValue_47: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'spell_vul_rate_calc',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_14' },
            right: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'checkCondition_46',
      },
      readBuffBlackboard_48: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate_potential',
            outputKey: 'spell_vul_rate_potential',
          },
        },
        next: 'calculateActionValue_47',
      },
      readBuffBlackboard_49: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate',
            outputKey: 'spell_vul_rate',
          },
        },
        next: 'readBuffBlackboard_48',
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'readBuffBlackboard_49',
      },
      dealDamage_51: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_16' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: null,
      },
      ifElse_52: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'checkCondition_50' },
        },
        next: 'dealDamage_51',
      },
      ifElse_53: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'applyBuff_33' },
          whenFalse: { $sequence: 'forEachContextTarget_34' },
        },
        next: 'ifElse_52',
      },
      mergeContextTargets_54: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'targets',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'ifElse_53',
      },
      applyBuff_55: {
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
      markCurrentSkillCanDash_56: {
        action: { kind: 'markCurrentSkillCanDash', parameters: {} },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_aura' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_9' },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'will' } },
      data_12: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vul_rate' } },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_talent1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_18: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_18' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_18' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_ultimate_skill: SkillDefinition = {
  key: 'chr_0032_lizhiyan_ultimate_skill',
  useSkillGroupIcon: true,
  element: 'nature',
  blackboard: {
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale_laser: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.45],
    atk_scale_laser_will: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.45],
    count: 1,
    duration: 20,
    duration_aura: 60,
    duration_vul: 0,
    duration2: 15,
    isWisd: 1,
    poise: 10,
    spell_vul_rate: 0,
    spell_vul_rate_calc: 0,
    spell_vul_rate_per_will: 0,
    spell_vul_rate_potential: 0,
    will: 0,
  },
  timelineBlockFrames: 73,
  naturalDurationFrames: 308,
  exclusiveFrame: 72,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 48,
        endFrame: 79,
        skillIds: ['chr_0032_lizhiyan_combo_skill', 'chr_0032_lizhiyan_normal_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'startUltimateTimeDilation_4' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_5' } },
    { startFrame: 41, endFrame: 55, sequence: { $sequence: 'modifyActionValue_16' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishOwner_17' } },
    { startFrame: 47, endFrame: 50, sequence: { $sequence: 'applyBuff_18' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'restrictUltimateEnergyRecovery_19' } },
    { startFrame: 47, endFrame: 47, sequence: { $sequence: 'mergeContextTargets_54' } },
    { startFrame: 0, endFrame: 72, sequence: { $sequence: 'applyBuff_55' } },
    { startFrame: 48, endFrame: 79, sequence: { $sequence: 'markCurrentSkillCanDash_56' } },
  ],
  defaultTarget: 'owner',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  enhancementStateBuffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_owner',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: arcaneChr_0032_lizhiyan_ultimate_skillActionGraph,
};

export const arcaneChr_0032_lizhiyan_ultimate_skill2ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'spell_vul_rate',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'spell_vul_rate',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_4',
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      calculateActionValue_9: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'spell_vul_rate_calc',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'ifElse_8',
      },
      storeSourceAttributeValue_10: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'will',
          },
        },
        next: 'calculateActionValue_9',
      },
      readBuffBlackboard_11: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate_per_will',
            outputKey: 'spell_vul_rate_per_will',
          },
        },
        next: 'storeSourceAttributeValue_10',
      },
      readBuffBlackboard_12: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'duration',
            outputKey: 'duration_vul',
          },
        },
        next: 'readBuffBlackboard_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'readBuffBlackboard_12',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'applyBuff_6',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'checkCondition_7' },
          whenFalse: { $sequence: 'checkCondition_13' },
        },
        next: null,
      },
      calculateActionValue_16: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'spell_vul_rate_calc',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_13' },
            right: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'ifElse_15',
      },
      readBuffBlackboard_17: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate_potential',
            outputKey: 'spell_vul_rate_potential',
          },
        },
        next: 'calculateActionValue_16',
      },
      readBuffBlackboard_18: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'lv',
            outputKey: 'lv',
          },
        },
        next: 'readBuffBlackboard_17',
      },
      readBuffBlackboard_19: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'spell_vul_rate',
            outputKey: 'spell_vul_rate',
          },
        },
        next: 'readBuffBlackboard_18',
      },
      readBuffBlackboard_20: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'enhance_rate',
            outputKey: 'enhance_rate',
          },
        },
        next: 'readBuffBlackboard_19',
      },
      ifElse_21: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'readBuffBlackboard_20' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_22: {
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
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      finishBuffsById_24: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0032_lizhiyan_ultimate_skill_listener',
              'buff_chr_0032_lizhiyan_ultimate_skill_layer',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      finishOwner_25: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'ult_abilityentity' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_26: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ult_abilityentity',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'finishOwner_25',
      },
      changeSkillSlot_27: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'ultimate',
            targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: null,
      },
      dealDamage_34: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_15' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                copiedBlackboardAssignments: { rate: 'spell_vul_rate', duration: 'duration_vul' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      dealDamage_32: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_17' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: null,
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'applyBuff_30' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_32',
      },
      ifElse_35: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: 'ifElse_33' },
          whenFalse: { $sequence: 'dealDamage_34' },
        },
        next: null,
      },
      startTimeDilation_40: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.7,
                  inTangent: -6.591719,
                  outTangent: -6.591719,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7484403,
                  value: 0.1815591,
                  inTangent: 0.9312042,
                  outTangent: 0.9312042,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 2.428422,
                  outTangent: 2.428422,
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
      checkCondition_41: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: 'startTimeDilation_40',
      },
      adjustSkillCooldown_44: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0032_lizhiyan_combo_skill' },
            operation: 'reduce',
            basis: 'baseDurationRatio',
            value: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: null,
      },
      checkCondition_42: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' } },
        },
        next: null,
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' } },
        },
        next: 'checkCondition_42',
      },
      ifElse_45: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_25' },
          whenTrue: { $sequence: 'adjustSkillCooldown_44' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      hideUi_46: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_47: {
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
      applyBuff_48: {
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
      applyBuff_49: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_medium' }],
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
          condition: { kind: 'conditionNode', nodeId: 'data_26' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      mergeContextTargets_opt3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'main', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'forEachContextTarget_opt2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vul_rate_calc' } },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_4' },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'will' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vul_rate' } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_talent1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_will' } },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_20: {
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
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'cd_minus' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'cd_minus', fallback: 0 } },
      data_23: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_22' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_24: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_25: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_43' } },
      },
      data_26: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneChr_0032_lizhiyan_ultimate_skill2: SkillDefinition = {
  key: 'chr_0032_lizhiyan_ultimate_skill2',
  element: 'nature',
  blackboard: {
    atk_scale: [6.4, 7.04, 7.68, 8.32, 8.96, 9.6, 10.24, 10.88, 11.52, 12.32, 13.28, 14.4],
    atk_scale_will: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    cd_minus: 0,
    duration_vul: 0,
    enhance_rate: 0,
    lv: 0,
    poise: 10,
    spell_vul_rate: 0,
    spell_vul_rate_calc: 0,
    spell_vul_rate_per_will: 0,
    spell_vul_rate_potential: 0,
    will: 0,
  },
  timelineBlockFrames: 76,
  naturalDurationFrames: 287,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 60,
        endFrame: 91,
        skillIds: ['chr_0032_lizhiyan_normal_skill', 'chr_0032_lizhiyan_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 287, sequence: { $sequence: 'ifElse_21' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_22' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_23' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_24' } },
    { startFrame: 57, endFrame: 58, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_26' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeSkillSlot_27' } },
    { startFrame: 58, endFrame: 58, sequence: { $sequence: 'ifElse_35' } },
    { startFrame: 58, endFrame: 59, sequence: { $sequence: 'mergeContextTargets_opt3' } },
    { startFrame: 60, endFrame: 63, sequence: { $sequence: 'checkCondition_41' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_45' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'hideUi_46' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'startUltimateTimeDilation_47' } },
    { startFrame: 0, endFrame: 59, sequence: { $sequence: 'applyBuff_48' } },
    { startFrame: 59, endFrame: 75, sequence: { $sequence: 'applyBuff_49' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  icon: 'endaxis:operators/arcane/ultimate_03',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'normalSkill',
  actionGraph: arcaneChr_0032_lizhiyan_ultimate_skill2ActionGraph,
};

export const arcaneCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arcaneCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: arcaneCommon_character_perfect_dodgeActionGraph,
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

const arcanePassive1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_wisd_greater_will',
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
            key: 'EntityBB_wisd_greater_will',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_passive' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'ifElse_5',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'deckAttributeCompare',
          left: 'intellect',
          operator: 'greaterOrEqual',
          right: 'will',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcanePassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0032_lizhiyan_passive',
  enableSequence: { $sequence: 'applyBuff_6' },
  actionGraph: arcanePassive1ActionGraph,
};

const arcanePassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  enhance_rate: { kind: 'valueNode', nodeId: 'data_2' },
                  lv: { kind: 'valueNode', nodeId: 'data_3' },
                  spell_vul_rate: { kind: 'valueNode', nodeId: 'data_4' },
                  spell_vul_rate_per_will: { kind: 'valueNode', nodeId: 'data_5' },
                  spell_vul_rate_potential: { kind: 'valueNode', nodeId: 'data_6' },
                },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'lv' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'spell_vul_rate' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcanePassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0032_lizhiyan_talent1',
  blackboard: {
    duration: [10, 10],
    enhance_rate: [0, 0.24],
    lv: [1, 2],
    spell_vul_rate: [0, 0.128],
    spell_vul_rate_per_will: [0, 0.0002],
    spell_vul_rate_potential: [0, 0],
  },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: arcanePassive2ActionGraph,
};

const arcaneComboCondition1ActionGraph = {
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
        expression: { kind: 'eventInflictionElementIn', elements: ['nature'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0032_lizhiyan_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { consumed_layer: 0, consumed_type: 0 },
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: arcaneComboCondition1ActionGraph,
};

const arcaneComboCondition2ActionGraph = {
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
          kind: 'contextTargetBuffStackCompare',
          compareZeroWhenTargetMissing: false,
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['heat'] },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0032_lizhiyan_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { consumed_layer: 0, consumed_type: 0 },
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: arcaneComboCondition2ActionGraph,
};

const arcaneComboCondition3ActionGraph = {
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
          kind: 'contextTargetBuffStackCompare',
          compareZeroWhenTargetMissing: false,
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['electric'] },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneComboCondition3: ComboSkillConditionDefinition = {
  key: 'native-combo:2',
  skillKey: 'chr_0032_lizhiyan_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { consumed_layer: 0, consumed_type: 0 },
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: arcaneComboCondition3ActionGraph,
};

const arcaneComboCondition4ActionGraph = {
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
          kind: 'contextTargetBuffStackCompare',
          compareZeroWhenTargetMissing: false,
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneComboCondition4: ComboSkillConditionDefinition = {
  key: 'native-combo:3',
  skillKey: 'chr_0032_lizhiyan_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { consumed_layer: 0, consumed_type: 0 },
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: arcaneComboCondition4ActionGraph,
};

const arcaneComboCondition5ActionGraph = {
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventInflictionElementIn',
          elements: ['heat', 'electric', 'cryo', 'nature'],
          outputKey: 'EntityBB_consumed_type',
        },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneComboCondition5: ComboSkillConditionDefinition = {
  key: 'native-combo:4',
  skillKey: 'chr_0032_lizhiyan_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { consumed_layer: 0, consumed_type: 0 },
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: arcaneComboCondition5ActionGraph,
};

const arcaneBuff1ActionGraph = {
  main: {
    nodes: {
      castSkillDuringAction_1: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'inputTarget' },
            skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_end',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'bunshin' } },
          body: { $sequence: 'castSkillDuringAction_1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'source' },
            sameSourceSkillCast: true,
          },
        },
        next: 'forEachContextTarget_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'findOwnerSpawnedAbilityEntities_3',
      },
      saveTransferredSource_5: {
        action: {
          kind: 'saveTransferredSource',
          parameters: { source: { kind: 'owner' }, saveToContextKey: 'trans_source' },
        },
        next: 'checkCondition_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          selection: 'all',
          contextKey: 'trans_source',
          other: 'actionInputTarget',
          operator: 'equal',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'soulDisabled', priority: 0, sequence: { $sequence: 'saveTransferredSource_5' } },
  ],
  actionGraph: arcaneBuff1ActionGraph,
};

const arcaneBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable_pre',
                copiedBlackboardAssignments: { duration_vul: 'duration', rate: 'rate_pre' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'applyBuff_2' },
          whenFalse: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      forEachContextTarget_4: {
        action: {
          kind: 'forEachContextTarget',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'source' },
              objectType: 'abilityEntity',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
              sameSourceSkillCast: true,
            },
          },
          body: { $sequence: null },
        },
        next: null,
      },
      castSkillDuringAction_5: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'inputTarget' },
            skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_end',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'has_finished',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'bunshin' } },
          body: { $sequence: 'castSkillDuringAction_5' },
        },
        next: 'modifyActionValue_6',
      },
      findOwnerSpawnedAbilityEntities_8: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'source' },
            sameSourceSkillCast: true,
          },
        },
        next: 'forEachContextTarget_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'findOwnerSpawnedAbilityEntities_8',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'findOwnerSpawnedAbilityEntities_8',
      },
      saveTransferredSource_15: {
        action: {
          kind: 'saveTransferredSource',
          parameters: { source: { kind: 'owner' }, saveToContextKey: 'trans_source' },
        },
        next: 'checkCondition_14',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'saveTransferredSource_15',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_finished', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          selection: 'all',
          contextKey: 'trans_source',
          other: 'actionInputTarget',
          operator: 'equal',
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'trigger_time' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5, has_finished: 0, rate_pre: 0.1, trigger_time: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'ifElse_3' }, { $sequence: 'forEachContextTarget_4' }],
    trigger: [{ $sequence: 'checkCondition_9' }],
  },
  abilityEventResponses: [
    { event: 'soulDisabled', priority: 0, sequence: { $sequence: 'checkCondition_16' } },
  ],
  actionGraph: arcaneBuff2ActionGraph,
};

const arcaneBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff3ActionGraph,
};

const arcaneBuff4ActionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'early', finishSource: 'actionSource' },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'lizhiyan_combo_hit',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'finishCurrentBuff_1',
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'createTimedMarker_2',
      },
      mergeContextTargets_4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_3',
      },
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'mergeContextTargets_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'changeResource_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_early_finish' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_early_finish' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_wisd' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_atb'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
          sameSourceSkillCast: true,
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal2'],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
          sameSourceSkillCast: true,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb_return_wisd: 10, atk_scale_early_finish: 1, poise_early_finish: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: arcaneBuff4ActionGraph,
};

const arcaneBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff5ActionGraph,
};

const arcaneBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff6ActionGraph,
};

const arcaneBuff7ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'lizhiyan_combo_hit',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
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
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'createTimedMarker_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: -6.042728,
                  outTangent: -6.042728,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.85,
                  value: 0.18,
                  inTangent: 0.5393099,
                  outTangent: 0.5393099,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 4.793082,
                  outTangent: 4.793082,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: [],
            abilityEntityTargets: [{ kind: 'context', contextKey: 'bunshin' }],
          },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: -6.042728,
                  outTangent: -6.042728,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.85,
                  value: 0.18,
                  inTangent: 0.5393099,
                  outTangent: 0.5393099,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 4.793082,
                  outTangent: 4.793082,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: [{ kind: 'owner' }, 'enemy'],
          },
        },
        next: 'startTimeDilation_4',
      },
      findOwnerSpawnedAbilityEntities_6: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: 'startTimeDilation_5',
      },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
            reason: 'other',
          },
        },
        next: null,
      },
      forEachContextTarget_8: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'finishBuffsById_7' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_laser2' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser2: 0, poise_final: 10 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 1, endFrame: 4, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_6' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'forEachContextTarget_8' } },
  ],
  actionGraph: arcaneBuff7ActionGraph,
};

const arcaneBuff8ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 2 },
            saveToContextKey: 'laser_root',
          },
        },
        next: null,
      },
      findCharacterTeamTargets_2: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: 'spawnAbilityEntity_1',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      createTimedMarker_12: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'lizhiyan_combo_hit',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      dealDamage_13: {
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
        next: 'createTimedMarker_12',
      },
      findOwnerSpawnedAbilityEntities_14: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: null,
      },
      startTimeDilation_15: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.6,
                  inTangent: -5.656393,
                  outTangent: -5.656393,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.85,
                  value: 0.18,
                  inTangent: 0.5393099,
                  outTangent: 0.5393099,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 4.793082,
                  outTangent: 4.793082,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: [],
            abilityEntityTargets: [{ kind: 'context', contextKey: 'bunshin' }],
          },
        },
        next: null,
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.6,
                  inTangent: -5.656393,
                  outTangent: -5.656393,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.85,
                  value: 0.18,
                  inTangent: 0.5393099,
                  outTangent: 0.5393099,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 4.793082,
                  outTangent: 4.793082,
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
        next: 'startTimeDilation_15',
      },
      findOwnerSpawnedAbilityEntities_17: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: 'startTimeDilation_16',
      },
      finishBuffsById_18: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
            reason: 'other',
          },
        },
        next: null,
      },
      forEachContextTarget_19: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'finishBuffsById_18' },
        },
        next: null,
      },
      createTimedMarker_21: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'lizhiyan_combo_wisd_has_finish',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      triggerCustomAbilityEvent_20: {
        action: {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'lizhiyan_combo_wisd_end',
            eventParam: 0,
            target: 'caster',
            source: 'currentAbilityEntity',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_laser1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_laser2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff8: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser1: 0.5, atk_scale_laser2: 3, poise_final: 10 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 2, endFrame: 4, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 5, endFrame: 7, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 8, endFrame: 10, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 11, endFrame: 13, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 17, endFrame: 23, sequence: { $sequence: 'dealDamage_13' } },
    { startFrame: 11, endFrame: 14, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_14' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_17' } },
    { startFrame: 17, endFrame: 20, sequence: { $sequence: 'forEachContextTarget_19' } },
  ],
  lifecycleSequences: {
    start: [{ $sequence: 'createTimedMarker_21' }],
    finish: [{ $sequence: 'triggerCustomAbilityEvent_20' }],
  },
  actionGraph: arcaneBuff8ActionGraph,
};

const arcaneBuff9ActionGraph = {
  main: {
    nodes: {
      castSkillDuringAction_1: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            caster: { kind: 'inputTarget' },
            skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_again',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishCurrentBuff_2: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'bunshin' } },
          body: { $sequence: 'castSkillDuringAction_1' },
        },
        next: 'finishCurrentBuff_2',
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            owner: { kind: 'source' },
            sameSourceSkillCast: true,
          },
        },
        next: 'forEachContextTarget_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'findOwnerSpawnedAbilityEntities_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: [
            'buff_chr_0032_lizhiyan_combo_skill_seal',
            'buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'buffEndsEarly', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  actionGraph: arcaneBuff9ActionGraph,
};

const arcaneBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff10ActionGraph,
};

const arcaneBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_listener',
                copiedBlackboardAssignments: {
                  duration: 'duration_final',
                  wisd_greater_will: 'EntityBB_wisd_greater_will',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
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
                buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal',
                copiedBlackboardAssignments: {
                  duration: 'duration_final',
                  rate_pre: 'rate_final',
                  trigger_time: 'trigger_time',
                  isWisd: 'EntityBB_wisd_greater_will',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_combo_skill_precheck' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyElementalInfliction_21: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_20: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_19: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_18: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: null,
      },
      switch_23: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'applyElementalInfliction_18' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'applyElementalInfliction_19' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'applyElementalInfliction_20' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'applyElementalInfliction_21' },
            },
          ],
        },
        next: null,
      },
      dealDamage_26: {
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
        next: null,
      },
      changeResource_29: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      startTimeDilation_31: {
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
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_31' },
        },
        next: null,
      },
      ifElse_40: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'changeResource_29' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_39',
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'dealDamage_26' },
          whenFalse: { $sequence: 'dealDamage_26' },
        },
        next: null,
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: 'ifElse_40',
      },
      applyBuff_opt3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal2',
                copiedBlackboardAssignments: {
                  duration: 'duration_seal2',
                  isWisd: 'EntityBB_wisd_greater_will',
                  atk_scale_early_finish: 'atk_scale_boom',
                  poise_early_finish: 'poise_boom',
                  atb_return_wisd: 'atb_return_wisd',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'forEachContextTarget_opt2',
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'switch_23' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_opt3',
      },
      mergeContextTargets_opt5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'ifElse_opt4',
      },
      ifElse_opt6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'mergeContextTargets_opt5' },
          whenFalse: { $sequence: 'mergeContextTargets_opt5' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_consumed_type' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_touch' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise_touch' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
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
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'less',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_total' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {
    atb_return_wisd: 0,
    atk_scale_boom: 0,
    atk_scale_touch: 0,
    duration_final: 0,
    duration_seal2: 0,
    duration_total: 5,
    poise_boom: 0,
    poise_touch: 0,
    rate_final: 0,
    trigger_time: 0.1,
    usp: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 2, endFrame: 21, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'ifElse_opt6' } },
  ],
  actionGraph: arcaneBuff11ActionGraph,
};

const arcaneBuff12ActionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'early', finishSource: 'actionSource' },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0032_lizhiyan_combo_skill_seal',
              'buff_chr_0032_lizhiyan_combo_skill_seal_effect',
            ],
            reason: 'early',
          },
        },
        next: 'finishCurrentBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_atb' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_2',
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'applyBuff_3',
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_4',
      },
      changeResource_6: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'mergeContextTargets_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'changeResource_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_early_finish' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_early_finish' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_wisd' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'isWisd', fallback: 0 } },
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

const arcaneBuff12: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_lizhiyan_combo_seal',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.imprisonment',
  },
  applyTags: ['Skill/Character/chr_0032_lizhiyan/combo_seal'],
  extendTags: [],
  blackboard: {
    atb_return_wisd: 0,
    atk_scale_early_finish: 1,
    duration: 5,
    isWisd: 1,
    poise_early_finish: 1,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: arcaneBuff12ActionGraph,
};

const arcaneBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_crystal',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
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
                buffId: 'buff_common_affixes_vulnerable_natural',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_vul' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff13: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_vul' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_lizhiyan_combo_vulnerable',
    showInHeadBarCommon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_vul: 6, rate: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: arcaneBuff13ActionGraph,
};

const arcaneBuff14ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_crystal',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
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
                buffId: 'buff_common_affixes_vulnerable_natural',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_vul' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_vul' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_lizhiyan_combo_vulnerable',
    showInHeadBarCommon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_vul: 6, rate: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: arcaneBuff14ActionGraph,
};

const arcaneBuff15ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_normal_skill_listener' }],
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
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff15: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeInfliction', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: arcaneBuff15ActionGraph,
};

const arcaneBuff16ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.5,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff16ActionGraph,
};

const arcaneBuff17ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_wisd_greater_will',
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
            key: 'EntityBB_wisd_greater_will',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      finishOwner_5: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'owner' },
              objectType: 'abilityEntity',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
              sameSourceSkillCast: false,
            },
          },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'tar' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0032_lizhiyan_combo_skill_seal',
              'buff_chr_0032_lizhiyan_combo_skill_seal2',
              'buff_chr_0032_lizhiyan_combo_skill_seal_effect',
              'buff_chr_0032_lizhiyan_combo_skill_seal_listener',
            ],
            reason: 'other',
          },
        },
        next: 'finishOwner_5',
      },
      mergeContextTargets_7: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'finishBuffsById_6',
      },
      listenForTagQuery_8: {
        action: {
          kind: 'listenForTagQuery',
          parameters: {
            tags: [
              'GlobalState/Performance/Cutscene',
              'GlobalState/Performance/Cutscene/Transition',
            ],
            tagQueryType: 'hasAny',
            executeOnMatch: true,
            sequence: { $sequence: 'mergeContextTargets_7' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'deckAttributeCompare',
          left: 'intellect',
          operator: 'greaterOrEqual',
          right: 'will',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff17: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'ifElse_4' }],
    enable: [{ $sequence: 'listenForTagQuery_8' }],
  },
  actionGraph: arcaneBuff17ActionGraph,
};

const arcaneBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff18: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {
    duration: 10,
    enhance_rate: 0.1,
    lv: 2,
    spell_vul_rate: 0.1,
    spell_vul_rate_per_will: 0,
    spell_vul_rate_potential: 0,
  },
  attributeModifiers: [],
  actionGraph: arcaneBuff18ActionGraph,
};

const arcaneBuff19ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_spell',
                blackboardAssignments: {
                  duration: { kind: 'constant', value: -1 },
                  rate: { kind: 'valueNode', nodeId: 'data_1' },
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'enhance_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff19: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { enhance_rate: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: arcaneBuff19ActionGraph,
};

const arcaneBuff20ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_crystal',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
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
                buffId: 'buff_common_affixes_vulnerable_natural',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
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

const arcaneBuff20: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_lizhiyan_combo_vulnerable',
    showInHeadBarCommon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: arcaneBuff20ActionGraph,
};

const arcaneBuff21ActionGraph = {
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

const arcaneBuff21: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1.5,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'finishOwner_1' }] },
  actionGraph: arcaneBuff21ActionGraph,
};

const arcaneBuff22ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'usp_step',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: 2 },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_2: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'maxUltimateEnergy' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'usp_step',
          },
        },
        next: 'calculateActionValue_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_target_mark',
                copiedBlackboardAssignments: {
                  atk_scale_laser: 'atk_scale_laser',
                  usp_step: 'usp_step',
                },
              },
            ],
            targets: { kind: 'context', key: 'ult_death' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_death',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 0.2 },
            saveToContextKey: 'ult_death',
          },
        },
        next: 'applyBuff_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'spawnAbilityEntity_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_6',
      },
      changeResource_18: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
            ignoreUltimateEnergyGainMultiplier: true,
          },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2',
                copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
              },
            ],
            targets: { kind: 'context', key: 'laser_target2' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_18',
      },
      spawnAbilityEntity_20: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'laser_target2',
          },
        },
        next: 'applyBuff_19',
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'spawnAbilityEntity_20' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1',
                copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
              },
            ],
            targets: { kind: 'context', key: 'laser_target1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_18',
      },
      spawnAbilityEntity_24: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'laser_target1',
          },
        },
        next: 'applyBuff_23',
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_layer' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'spawnAbilityEntity_24' },
          whenFalse: { $sequence: 'ifElse_25' },
        },
        next: 'applyBuff_26',
      },
      findOwnerSpawnedAbilityEntities_28: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_27',
      },
      modifyActionValue_29: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'is_power_attacked',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_28',
      },
      createTimedMarker_30: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'chr_0032_lizhiyan_ultimate_count',
            durationSeconds: { kind: 'constant', value: 0.4 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'modifyActionValue_29',
      },
      checkCondition_31: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'createTimedMarker_30',
      },
      checkCondition_32: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'checkCondition_31',
      },
      checkCondition_33: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'checkCondition_32',
      },
      checkCondition_34: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_33',
      },
      checkCondition_35: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'checkCondition_34',
      },
      modifyActionValue_36: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'is_power_attacked',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp_step' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: {
            kind: 'ownerSpawned',
            owner: { kind: 'source' },
            objectType: 'abilityEntity',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            sameSourceSkillCast: false,
          },
          distance: 60,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffSource',
          markerId: 'chr_0032_lizhiyan_ultimate_count',
        },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'is_power_attacked', fallback: 0 },
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
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['powerAttack'] },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: {
            kind: 'ownerSpawned',
            owner: { kind: 'source' },
            objectType: 'abilityEntity',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            sameSourceSkillCast: false,
          },
          distance: 60,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_12: {
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
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff22: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser: 0.5, is_power_attacked: 0, usp_step: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'storeSourceAttributeValue_2' }] },
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_35' } },
    { event: 'poiseZero', priority: 0, sequence: { $sequence: 'modifyActionValue_36' } },
  ],
  actionGraph: arcaneBuff22ActionGraph,
};

const arcaneBuff23ActionGraph = {
  main: {
    nodes: {
      findOwnerSpawnedAbilityEntities_1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'placesorted',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
            owner: { kind: 'source' },
            circularOrder: {
              indexBlackboardKey: 'EntityBB_index',
              desiredCount: 8,
              reverseFlag: 1,
            },
          },
        },
        next: null,
      },
      pickContextTarget_2: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'fifth',
            index: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      pickContextTarget_3: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'forth',
            index: { kind: 'constant', value: 3 },
          },
        },
        next: 'pickContextTarget_2',
      },
      pickContextTarget_4: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'third',
            index: { kind: 'constant', value: 2 },
          },
        },
        next: 'pickContextTarget_3',
      },
      pickContextTarget_5: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'second',
            index: { kind: 'constant', value: 1 },
          },
        },
        next: 'pickContextTarget_4',
      },
      pickContextTarget_6: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'first',
            index: { kind: 'constant', value: 0 },
          },
        },
        next: 'pickContextTarget_5',
      },
      mergeContextTargets_7: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'fifth', sources: [] },
        },
        next: 'pickContextTarget_6',
      },
      mergeContextTargets_8: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'forth', sources: [] },
        },
        next: 'mergeContextTargets_7',
      },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'third', sources: [] },
        },
        next: 'mergeContextTargets_8',
      },
      mergeContextTargets_10: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'second', sources: [] },
        },
        next: 'mergeContextTargets_9',
      },
      mergeContextTargets_11: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'first', sources: [] },
        },
        next: 'mergeContextTargets_10',
      },
      spawnAbilityEntity_12: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'first' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'second' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_14: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'third' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'forth' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff23: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser: 10 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'mergeContextTargets_11' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_12' } },
    { startFrame: 4, endFrame: 7, sequence: { $sequence: 'spawnAbilityEntity_13' } },
    { startFrame: 8, endFrame: 11, sequence: { $sequence: 'spawnAbilityEntity_14' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'spawnAbilityEntity_15' } },
  ],
  actionGraph: arcaneBuff23ActionGraph,
};

const arcaneBuff24ActionGraph = {
  main: {
    nodes: {
      findOwnerSpawnedAbilityEntities_1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'placesorted',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
            owner: { kind: 'source' },
            circularOrder: {
              indexBlackboardKey: 'EntityBB_index',
              desiredCount: 8,
              reverseFlag: -1,
            },
          },
        },
        next: null,
      },
      pickContextTarget_2: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'fifth',
            index: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      pickContextTarget_3: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'forth',
            index: { kind: 'constant', value: 3 },
          },
        },
        next: 'pickContextTarget_2',
      },
      pickContextTarget_4: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'third',
            index: { kind: 'constant', value: 2 },
          },
        },
        next: 'pickContextTarget_3',
      },
      pickContextTarget_5: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'second',
            index: { kind: 'constant', value: 1 },
          },
        },
        next: 'pickContextTarget_4',
      },
      pickContextTarget_6: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'placesorted',
            saveToContextKey: 'first',
            index: { kind: 'constant', value: 0 },
          },
        },
        next: 'pickContextTarget_5',
      },
      mergeContextTargets_7: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'fifth', sources: [] },
        },
        next: 'pickContextTarget_6',
      },
      mergeContextTargets_8: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'forth', sources: [] },
        },
        next: 'mergeContextTargets_7',
      },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'third', sources: [] },
        },
        next: 'mergeContextTargets_8',
      },
      mergeContextTargets_10: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'second', sources: [] },
        },
        next: 'mergeContextTargets_9',
      },
      mergeContextTargets_11: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'first', sources: [] },
        },
        next: 'mergeContextTargets_10',
      },
      spawnAbilityEntity_12: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'first' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'second' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_14: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'third' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
      spawnAbilityEntity_15: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'forth' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'currentAbilityEntity',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff24: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser: 10 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'mergeContextTargets_11' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_12' } },
    { startFrame: 4, endFrame: 7, sequence: { $sequence: 'spawnAbilityEntity_13' } },
    { startFrame: 8, endFrame: 11, sequence: { $sequence: 'spawnAbilityEntity_14' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'spawnAbilityEntity_15' } },
  ],
  actionGraph: arcaneBuff24ActionGraph,
};

const arcaneBuff25ActionGraph = {
  main: {
    nodes: {
      setCharacterPassiveUiValue_1: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      readBuffStackCount_2: {
        action: {
          kind: 'readBuffStackCount',
          parameters: { target: 'caster', outputKey: 'count', query: { kind: 'environment' } },
        },
        next: 'setCharacterPassiveUiValue_1',
      },
      setCharacterPassiveUiValue_3: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff25: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'setCharacterPassiveUiValue_3' }],
    enhanceChanged: [{ $sequence: 'readBuffStackCount_2' }],
  },
  actionGraph: arcaneBuff25ActionGraph,
};

const arcaneBuff26ActionGraph = {
  main: {
    nodes: {
      restrictUltimateEnergyRecovery_1: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: true,
          },
        },
        next: null,
      },
      changeResource_2: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'constant', value: -999 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
            reason: 'other',
          },
        },
        next: 'changeResource_2',
      },
      setCharacterPassiveUiValue_4: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'finishBuffsById_3',
      },
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'constant', value: 1 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            isPercentValue: true,
            ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
          },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_listener_owner'],
            reason: 'other',
          },
        },
        next: 'changeResource_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_7',
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'enhance_rate',
            outputKey: 'enhance_rate',
          },
        },
        next: 'checkCondition_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'readBuffBlackboard_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_10',
      },
      setCharacterPassiveUiValue_12: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 2 } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_talent1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
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

const arcaneBuff26: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_ult_laser',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10, enhance_rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [
      { $sequence: 'finishBuffsById_6' },
      { $sequence: 'checkCondition_11' },
      { $sequence: 'setCharacterPassiveUiValue_12' },
    ],
    enable: [{ $sequence: 'restrictUltimateEnergyRecovery_1' }],
    finish: [{ $sequence: 'setCharacterPassiveUiValue_4' }],
  },
  skillSlotReplacements: [
    {
      skillSlotKey: 'ultimate',
      targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill2',
      revertedSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: arcaneBuff26ActionGraph,
};

const arcaneBuff27ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'source' },
              objectType: 'abilityEntity',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
              sameSourceSkillCast: false,
            },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
            reason: 'other',
          },
        },
        next: 'finishOwner_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff27: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'finishBuffsById_2' }] },
  actionGraph: arcaneBuff27ActionGraph,
};

const arcaneBuff28ActionGraph = {
  main: {
    nodes: {
      setCharacterPassiveUiValue_1: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 3 } },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_2',
      },
      readBuffBlackboard_4: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
            desiredKey: 'enhance_rate',
            outputKey: 'enhance_rate',
          },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'readBuffBlackboard_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_5',
      },
      restrictUltimateEnergyRecovery_7: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: true,
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_9: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: null,
      },
      changeResource_10: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'constant', value: -999 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: 'setCharacterPassiveUiValue_9',
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_abilityentity_finish_self' }],
            targets: { kind: 'context', key: 'ult_aura' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_12: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            owner: { kind: 'source' },
            sameSourceSkillCast: true,
          },
        },
        next: 'applyBuff_11',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'changeResource_10' },
        },
        next: 'findOwnerSpawnedAbilityEntities_12',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'applyBuff_15' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_talent1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'isWisd', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff28: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_ult_skill',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 30, enhance_rate: 0, isWisd: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'setCharacterPassiveUiValue_1' }, { $sequence: 'checkCondition_6' }],
    enable: [{ $sequence: 'restrictUltimateEnergyRecovery_7' }],
    finish: [{ $sequence: 'ifElse_13' }],
  },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'ifElse_16' } },
  ],
  skillSlotReplacements: [
    {
      skillSlotKey: 'ultimate',
      targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill2',
      revertedSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: arcaneBuff28ActionGraph,
};

const arcaneBuff29ActionGraph = {
  main: {
    nodes: {
      changeResource_11: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
            ignoreUltimateEnergyGainMultiplier: true,
          },
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2',
                copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
              },
            ],
            targets: { kind: 'context', key: 'laser_target2' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_11',
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'laser_target2',
          },
        },
        next: 'applyBuff_12',
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'spawnAbilityEntity_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1',
                copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
              },
            ],
            targets: { kind: 'context', key: 'laser_target1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_11',
      },
      spawnAbilityEntity_17: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'laser_target1',
          },
        },
        next: 'applyBuff_16',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_layer' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'spawnAbilityEntity_17' },
          whenFalse: { $sequence: 'ifElse_18' },
        },
        next: 'applyBuff_19',
      },
      findOwnerSpawnedAbilityEntities_21: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_20',
      },
      createTimedMarker_22: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'chr_0032_lizhiyan_ultimate_count',
            durationSeconds: { kind: 'constant', value: 0.4 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_21',
      },
      checkCondition_23: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'createTimedMarker_22',
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_23',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp_step' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'caster',
          markerId: 'chr_0032_lizhiyan_ultimate_count',
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_listener_owner'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff29: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  triggerIntervalSeconds: 0.033,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_laser: 0, usp_step: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'checkCondition_24' }] },
  actionGraph: arcaneBuff29ActionGraph,
};

const arcaneBuff30ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arcaneBuff30: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: arcaneBuff30ActionGraph,
};

export const arcane: OperatorDefinition = {
  slug: 'arcane',
  gameId: 'ARCANE',
  rarity: 6,
  weaponType: 'funnel',
  element: 'nature',
  characterTypeId: 'Natural',
  role: 'caster',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 26, 45, 64, 82, 91],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [21, 54, 89, 124, 159, 176],
    will: [14, 37, 61, 85, 109, 121],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  trustAttributeBonus: { values: [8, 10, 10, 15], attributes: ['intellect', 'will'] },
  passiveUi: { kind: 'numeric', appearance: 'arcaneSigils', maximum: 3 },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        arcaneChr_0032_lizhiyan_attack1,
        arcaneChr_0032_lizhiyan_attack2,
        arcaneChr_0032_lizhiyan_attack3,
        arcaneChr_0032_lizhiyan_attack4,
        arcaneChr_0032_lizhiyan_attack5,
      ],
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'finisher',
      operationType: 'finisher',
      skills: arcaneChr_0032_lizhiyan_power_attack,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: arcaneChr_0032_lizhiyan_plunging_attack_end,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: arcaneChr_0032_lizhiyan_normal_skill,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/battle_01',
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/battle_02',
        },
      ],
    },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
      skills: arcaneChr_0032_lizhiyan_combo_skill,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/combo_01',
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/combo_02',
        },
      ],
    },
    {
      key: 'ultimate',
      operationType: 'ultimate',
      skills: arcaneChr_0032_lizhiyan_ultimate_skill,
      placementSequenceSkillKeys: [
        'chr_0032_lizhiyan_ultimate_skill',
        'chr_0032_lizhiyan_ultimate_skill2',
      ],
      replacementSkills: [arcaneChr_0032_lizhiyan_ultimate_skill2],
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/ultimate_01',
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
          icon: 'endaxis:operators/arcane/ultimate_02',
        },
      ],
    },
  ],
  dodgeSkill: arcaneCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0032_lizhiyan_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0032_lizhiyan_combo_skill', replacementSkillKeys: [] },
    {
      key: 'ultimate',
      baseSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
      replacementSkillKeys: ['chr_0032_lizhiyan_ultimate_skill2'],
    },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0032_lizhiyan_attack1',
        'chr_0032_lizhiyan_attack2',
        'chr_0032_lizhiyan_attack3',
        'chr_0032_lizhiyan_attack4',
        'chr_0032_lizhiyan_attack5',
        'chr_0032_lizhiyan_plunging_attack_end',
        'chr_0032_lizhiyan_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0032_lizhiyan_attack1',
        'chr_0032_lizhiyan_attack2',
        'chr_0032_lizhiyan_attack3',
        'chr_0032_lizhiyan_attack4',
        'chr_0032_lizhiyan_attack5',
      ],
      defaultSkillKey: 'chr_0032_lizhiyan_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    arcaneComboCondition1,
    arcaneComboCondition2,
    arcaneComboCondition3,
    arcaneComboCondition4,
    arcaneComboCondition5,
  ],
  comboSkillPriority: 'enemyRank',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'addSkillCooldownFrames',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          frames: -180,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
      ],
      passiveSkills: [arcanePassive2],
    },
    {
      levels: 2,
      modifiers: [
        { kind: 'addReactionDuration', reaction: 'corrosion', seconds: [5, 10] },
        { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: [0.05, 0.1] },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'atk_scale_touch',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'atk_scale_boom',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'atk_scale_laser1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'atk_scale_laser2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'atb_return_wisd',
          operation: 'add',
          value: 10,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_combo_skill',
          blackboardKey: 'rate_pre',
          operation: 'add',
          value: 0.06,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addReactionDuration', reaction: 'corrosion', seconds: 5 },
        { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: 0.2 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
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
          passiveSkillKey: 'chr_0032_lizhiyan_talent1',
          blackboardKey: 'enhance_rate',
          operation: 'add',
          value: 0.16,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0032_lizhiyan_talent1',
          blackboardKey: 'spell_vul_rate_potential',
          operation: 'add',
          value: 0.07,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          blackboardKey: 'cd_minus',
          operation: 'add',
          value: 0.3,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_consumed_layer: 0,
    EntityBB_consumed_type: 0,
    EntityBB_ult_hit: 0,
    EntityBB_wisd_greater_will: 1,
  },
  passiveSkills: [arcanePassive1],
  buffDefinitions: {
    buff_chr_0032_lizhiyan_combo_skill_precheck: arcaneBuff1,
    buff_chr_0032_lizhiyan_combo_skill_seal: arcaneBuff2,
    buff_chr_0032_lizhiyan_combo_skill_seal_atb: arcaneBuff3,
    buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener: arcaneBuff4,
    buff_chr_0032_lizhiyan_combo_skill_seal_finish_count: arcaneBuff5,
    buff_chr_0032_lizhiyan_combo_skill_seal_finish_self_dead: arcaneBuff6,
    buff_chr_0032_lizhiyan_combo_skill_seal_finisher: arcaneBuff7,
    buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd: arcaneBuff8,
    buff_chr_0032_lizhiyan_combo_skill_seal_listener: arcaneBuff9,
    buff_chr_0032_lizhiyan_combo_skill_seal_self_dead: arcaneBuff10,
    buff_chr_0032_lizhiyan_combo_skill_seal_total: arcaneBuff11,
    buff_chr_0032_lizhiyan_combo_skill_seal2: arcaneBuff12,
    buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable: arcaneBuff13,
    buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable_pre: arcaneBuff14,
    buff_chr_0032_lizhiyan_normal_skill_aura: arcaneBuff15,
    buff_chr_0032_lizhiyan_normal_skill_listener: arcaneBuff16,
    buff_chr_0032_lizhiyan_passive: arcaneBuff17,
    buff_chr_0032_lizhiyan_talent1: arcaneBuff18,
    buff_chr_0032_lizhiyan_talent1_enhance: arcaneBuff19,
    buff_chr_0032_lizhiyan_talent1_vulnerable: arcaneBuff20,
    buff_chr_0032_lizhiyan_ultimate_skill_abilityentity_finish_self: arcaneBuff21,
    buff_chr_0032_lizhiyan_ultimate_skill_inaura: arcaneBuff22,
    buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1: arcaneBuff23,
    buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2: arcaneBuff24,
    buff_chr_0032_lizhiyan_ultimate_skill_layer: arcaneBuff25,
    buff_chr_0032_lizhiyan_ultimate_skill_listener: arcaneBuff26,
    buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity: arcaneBuff27,
    buff_chr_0032_lizhiyan_ultimate_skill_listener_owner: arcaneBuff28,
    buff_chr_0032_lizhiyan_ultimate_skill_target_mark: arcaneBuff29,
    buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener: arcaneBuff30,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0032_lizhiyan_combo_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/combo_bunshin',
      ],
      blackboard: { EntityBB_wisd_greater_will: 1 },
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkills: {
        chr_032_lizhiyan_combo_skill_abilityentity_seal: {
          actionGraph: { main: { nodes: {} }, macros: {} },
          skillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 190,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [],
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_end: {
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_end',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 45,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb_return_wisd: 0, atk_scale_boom: 1, poise_boom: 5 },
          scheduledSequences: [
            { startFrame: 9, endFrame: 12, sequence: { $sequence: 'finishBuffsById_1' } },
            {
              startFrame: 21,
              endFrame: 22,
              sequence: { $sequence: 'triggerCustomAbilityEvent_2' },
            },
            { startFrame: 44, endFrame: 45, sequence: { $sequence: 'finishOwner_3' } },
            { startFrame: 0, endFrame: 15, sequence: { $sequence: 'repeatEachTick_opt2' } },
            { startFrame: 0, endFrame: 14, sequence: { $sequence: 'checkCondition_11' } },
            { startFrame: 14, endFrame: 20, sequence: { $sequence: 'ifElse_26' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'createTimedMarker_27' } },
            { startFrame: 14, endFrame: 17, sequence: { $sequence: 'forEachContextTarget_31' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: [
                        'buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect',
                        'buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect_line',
                      ],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                triggerCustomAbilityEvent_2: {
                  action: {
                    kind: 'triggerCustomAbilityEvent',
                    parameters: {
                      eventName: 'lizhiyan_combo_normal_end',
                      eventParam: 0,
                      target: 'caster',
                      source: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                finishOwner_3: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                createTimedMarker_8: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'source' },
                      markerId: 'lizhiyan_combo_end_not_finish',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                      timeDomain: 'globalScaled',
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
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener',
                          copiedBlackboardAssignments: {
                            atk_scale_early_finish: 'atk_scale_boom',
                            poise_early_finish: 'poise_boom',
                            atb_return_wisd: 'atb_return_wisd',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                      finishByAction: true,
                    },
                  },
                  next: 'createTimedMarker_8',
                },
                checkCondition_10: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                  },
                  next: 'applyBuff_9',
                },
                checkCondition_11: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                  },
                  next: 'checkCondition_10',
                },
                createTimedMarker_22: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'source' },
                      markerId: 'lizhiyan_combo_hit',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                      timeDomain: 'globalScaled',
                    },
                  },
                  next: null,
                },
                dealDamage_23: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_combo_skill:chr_032_lizhiyan_combo_skill_abilityentity_seal|chr_0032_lizhiyan_combo_skill_abilityentity_end|chr_0032_lizhiyan_combo_skill_abilityentity_seal_again|chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher:/childSkills/chr_0032_lizhiyan_combo_skill_abilityentity_end/actionGraph/main/nodes/dealDamage_23/action',
                  },
                  next: 'createTimedMarker_22',
                },
                applyBuff_24: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_self_dead' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'dealDamage_23',
                },
                checkCondition_25: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                  },
                  next: 'applyBuff_24',
                },
                dealDamage_18: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_5' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_combo_skill:chr_032_lizhiyan_combo_skill_abilityentity_seal|chr_0032_lizhiyan_combo_skill_abilityentity_end|chr_0032_lizhiyan_combo_skill_abilityentity_seal_again|chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher:/childSkills/chr_0032_lizhiyan_combo_skill_abilityentity_end/actionGraph/main/nodes/dealDamage_18/action',
                  },
                  next: 'createTimedMarker_22',
                },
                startTimeDilation_20: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.3 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 15,
                      curve: {
                        kind: 'inline',
                        keys: [
                          {
                            time: 0,
                            value: 1,
                            inTangent: -14.14286,
                            outTangent: -14.14286,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 0.07,
                            value: 0.01,
                            inTangent: 0.03159265,
                            outTangent: 0.03159265,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 0.9385403,
                            value: 0.1655021,
                            inTangent: 0.5255258,
                            outTangent: 0.5255258,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 1,
                            value: 0.3,
                            inTangent: 3.249784,
                            outTangent: 3.249784,
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
                  next: null,
                },
                ifElse_21: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'dealDamage_18' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'startTimeDilation_20',
                },
                ifElse_26: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_8' },
                    whenTrue: { $sequence: 'ifElse_21' },
                    whenFalse: { $sequence: 'checkCondition_25' },
                  },
                  next: null,
                },
                createTimedMarker_27: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'owner' },
                      markerId: 'lizhiyan_bunshin_end',
                      durationSeconds: { kind: 'constant', value: 1 },
                      autoFinishByAction: false,
                      timeDomain: 'self',
                    },
                  },
                  next: null,
                },
                finishBuffsById_29: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'fixed', target: 'enemy' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                ifElse_30: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'finishBuffsById_29' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                forEachContextTarget_31: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                    body: { $sequence: 'ifElse_30' },
                  },
                  next: null,
                },
                ifElse_opt1: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    whenTrue: { $sequence: null },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                repeatEachTick_opt2: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: true,
                        target: { kind: 'inputTarget' },
                        executeEachFrame: true,
                        triggerIntervalSeconds: 0.033,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: 0.033,
                      },
                    },
                    body: { $sequence: 'ifElse_opt1' },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: {
                    kind: 'blackboard',
                    key: 'EntityBB_wisd_greater_will',
                    fallback: 0,
                  },
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
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    returnTrueIfNotExists: true,
                    target: 'caster',
                    markerId: 'lizhiyan_combo_end_not_finish',
                  },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_boom' },
                },
                data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise_boom' } },
                data_6: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'actionInputTarget',
                    buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_self_dead'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 0 },
                    sameSourceSkillCast: true,
                  },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    returnTrueIfNotExists: true,
                    target: 'caster',
                    markerId: 'lizhiyan_combo_hit',
                  },
                },
                data_8: {
                  type: 'boolean',
                  expression: {
                    kind: 'entityCountCompare',
                    target: { kind: 'source' },
                    containsHittableTarget: false,
                    excludeDeadEntity: true,
                    operator: 'greaterOrEqual',
                    value: 1,
                  },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'enemy',
                    buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                data_10: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
              },
            },
            macros: {},
          },
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_seal_again: {
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_again',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 243,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale_laser1: 6,
            atk_scale_laser2: 2,
            duration_calc: 0,
            duration_extra: 0,
            duration_vul: 2,
            isWisd: 1,
            poise_laser: 5,
            rate_final: 0.3,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_1' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_7' } },
            { startFrame: 41, endFrame: 44, sequence: { $sequence: 'ifElse_18' } },
            { startFrame: 23, endFrame: 26, sequence: { $sequence: 'finishBuffsById_19' } },
            { startFrame: 239, endFrame: 239, sequence: { $sequence: 'checkCondition_24' } },
            { startFrame: 240, endFrame: 243, sequence: { $sequence: 'finishOwner_25' } },
            { startFrame: 0, endFrame: 240, sequence: { $sequence: 'checkCondition_31' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect_line'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                calculateActionValue_5: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_calc',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_1' },
                      right: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                  },
                  next: null,
                },
                modifyActionValue_6: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'isWisd',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    },
                  },
                  next: 'calculateActionValue_5',
                },
                calculateActionValue_3: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'duration_calc',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_1' },
                      right: { kind: 'constant', value: 0 },
                    },
                  },
                  next: null,
                },
                modifyActionValue_4: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'isWisd',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'calculateActionValue_3',
                },
                ifElse_7: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    whenTrue: { $sequence: 'modifyActionValue_4' },
                    whenFalse: { $sequence: 'modifyActionValue_6' },
                  },
                  next: null,
                },
                jumpTimeline_15: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 240 },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                  },
                  next: null,
                },
                jumpTimeline_10: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 239 },
                    condition: { kind: 'conditionNode', nodeId: 'data_6' },
                  },
                  next: null,
                },
                applyBuff_11: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd',
                          copiedBlackboardAssignments: {
                            atk_scale_laser1: 'atk_scale_laser1',
                            atk_scale_laser2: 'atk_scale_laser2',
                            poise_final: 'poise_laser',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'death' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'jumpTimeline_10',
                },
                spawnAbilityEntity_12: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'inputTarget' },
                      abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill_death',
                      childSkillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_death_move',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'actionInputTarget',
                      saveToContextKey: 'death',
                    },
                  },
                  next: 'applyBuff_11',
                },
                applyBuff_13: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finish_count' }],
                      targets: { kind: 'source' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'spawnAbilityEntity_12',
                },
                applyBuff_14: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        { buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finish_self_dead' },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'inputTarget' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'applyBuff_13',
                },
                checkCondition_8: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                  },
                  next: null,
                },
                checkCondition_9: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
                  },
                  next: 'checkCondition_8',
                },
                ifElse_17: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyBuff_14' },
                    whenFalse: { $sequence: 'jumpTimeline_15' },
                  },
                  next: null,
                },
                ifElse_18: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    whenTrue: { $sequence: 'ifElse_17' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                finishBuffsById_19: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                createTimedMarker_21: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'source' },
                      markerId: 'lizhiyan_combo_finisher',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                      timeDomain: 'globalScaled',
                    },
                  },
                  next: null,
                },
                applyBuff_22: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finisher',
                          copiedBlackboardAssignments: {
                            atk_scale_laser2: 'atk_scale_laser2',
                            poise_final: 'poise_laser',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'createTimedMarker_21',
                },
                ifElse_23: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_12' },
                    whenTrue: { $sequence: null },
                    whenFalse: { $sequence: 'applyBuff_22' },
                  },
                  next: null,
                },
                checkCondition_24: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                  },
                  next: 'ifElse_23',
                },
                finishOwner_25: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                applyBuff_28: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable',
                          copiedBlackboardAssignments: {
                            rate: 'rate_final',
                            duration_vul: 'duration_calc',
                          },
                        },
                      ],
                      targets: { kind: 'fixed', target: 'enemy' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                createTimedMarker_29: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'source' },
                      markerId: 'lizhiyan_combo_vul',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                      timeDomain: 'globalScaled',
                    },
                  },
                  next: 'applyBuff_28',
                },
                ifElse_30: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_14' },
                    whenTrue: { $sequence: 'createTimedMarker_29' },
                    whenFalse: { $sequence: 'createTimedMarker_29' },
                  },
                  next: null,
                },
                checkCondition_31: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
                  },
                  next: 'ifElse_30',
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_vul' } },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'duration_extra' },
                },
                data_3: {
                  type: 'number',
                  expression: {
                    kind: 'blackboard',
                    key: 'EntityBB_wisd_greater_will',
                    fallback: 0,
                  },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_3' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_6: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'actionInputTarget',
                    buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_finish_self_dead'],
                    operator: 'less',
                    value: { kind: 'constant', value: 1 },
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_finish_count'],
                    operator: 'less',
                    value: { kind: 'constant', value: 1 },
                    sameSourceSkillCast: true,
                  },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'checkActionResult',
                    action: { $sequence: 'checkCondition_9' },
                  },
                },
                data_10: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                },
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
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_10' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_13: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    returnTrueIfNotExists: true,
                    target: 'caster',
                    markerId: 'lizhiyan_combo_finisher',
                  },
                },
                data_14: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_15: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    returnTrueIfNotExists: true,
                    target: 'caster',
                    markerId: 'lizhiyan_combo_vul',
                  },
                },
              },
            },
            macros: {},
          },
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher: {
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
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 19,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [
            { startFrame: 18, endFrame: 19, sequence: { $sequence: 'finishOwner_1' } },
          ],
        },
      },
    },
    abilityentity_chr_0032_lizhiyan_normal_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      blackboard: { EntityBB_wisd_greater_will: 1 },
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkills: {
        chr_0032_lizhiyan_normal_skill_abilityrange2: {
          skillId: 'chr_0032_lizhiyan_normal_skill_abilityrange2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 240,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale_will: 1,
            atk_scale_wisd: 1,
            effect_count: 0,
            max_effect_count: 3,
            poise: 0,
          },
          scheduledSequences: [
            { startFrame: 20, endFrame: 22, sequence: { $sequence: 'forEachContextTarget_15' } },
            { startFrame: 20, endFrame: 23, sequence: { $sequence: 'ifElse_17' } },
            { startFrame: 22, endFrame: 25, sequence: { $sequence: 'finishOwner_18' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                calculateActionValue_4: {
                  action: {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'effect_count',
                      operation: 'add',
                      left: { kind: 'valueNode', nodeId: 'data_1' },
                      right: { kind: 'constant', value: 1 },
                    },
                  },
                  next: null,
                },
                ifElse_6: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    whenTrue: { $sequence: 'calculateActionValue_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                ifElse_7: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: null },
                    whenFalse: { $sequence: 'ifElse_6' },
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_6' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange2/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                dealDamage_10: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_7' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange2/actionGraph/main/nodes/dealDamage_10/action',
                  },
                  next: null,
                },
                mergeContextTargets_11: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'mainPos',
                      sources: [{ kind: 'target', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_10',
                },
                startTimeDilation_12: {
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
                            time: 0,
                            value: 1,
                            inTangent: -14.14286,
                            outTangent: -14.14286,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 0.07,
                            value: 0.01,
                            inTangent: 0,
                            outTangent: 0,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 1,
                            value: 0.1,
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
                  next: null,
                },
                ifElse_13: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    whenTrue: { $sequence: 'dealDamage_9' },
                    whenFalse: { $sequence: 'mergeContextTargets_11' },
                  },
                  next: 'startTimeDilation_12',
                },
                applyElementalInfliction_14: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'nature', isExtra: false },
                  },
                  next: 'ifElse_13',
                },
                forEachContextTarget_15: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                    body: { $sequence: 'ifElse_7' },
                  },
                  next: 'applyElementalInfliction_14',
                },
                applyBuff_16: {
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
                ifElse_17: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_11' },
                    whenTrue: { $sequence: 'applyBuff_16' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                finishOwner_18: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'effect_count' } },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'effect_count', fallback: 0 },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'max_effect_count', fallback: 0 },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_2' },
                    operator: 'less',
                    right: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'targetDistance',
                    source: { kind: 'owner' },
                    target: { kind: 'fixed', target: 'enemy' },
                    distance: 0.5,
                    lessThan: false,
                    includeTargetRadius: true,
                    containsHittableObject: false,
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_wisd' },
                },
                data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_will' },
                },
                data_9: {
                  type: 'number',
                  expression: {
                    kind: 'blackboard',
                    key: 'EntityBB_wisd_greater_will',
                    fallback: 0,
                  },
                },
                data_10: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_9' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_11: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
              },
            },
            macros: {},
          },
        },
        chr_0032_lizhiyan_normal_skill_abilityrange: {
          skillId: 'chr_0032_lizhiyan_normal_skill_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 240,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0, isJumped: 0, poise: 0 },
          scheduledSequences: [
            { startFrame: 21, endFrame: 180, sequence: { $sequence: 'aura_1' } },
            { startFrame: 21, endFrame: 180, sequence: { $sequence: 'listenForCombatEvents_5' } },
            { startFrame: 187, endFrame: 190, sequence: { $sequence: 'finishOwner_8' } },
            { startFrame: 20, endFrame: 23, sequence: { $sequence: 'forEachContextTarget_11' } },
            { startFrame: 186, endFrame: 189, sequence: { $sequence: 'forEachContextTarget_15' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                aura_1: {
                  action: {
                    kind: 'aura',
                    parameters: {
                      targets: { kind: 'fixed', target: 'enemy' },
                      source: { kind: 'owner' },
                      inheritSourceSkillCastInfo: false,
                      buffs: [
                        {
                          buffId: 'buff_chr_0032_lizhiyan_normal_skill_aura',
                          blackboardAssignments: {},
                          stringBlackboardAssignments: {},
                        },
                      ],
                    },
                    onEnter: { $sequence: null },
                    onExit: { $sequence: null },
                  },
                  next: null,
                },
                jumpTimeline_2: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 180 },
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                  },
                  next: null,
                },
                modifyActionValue_3: {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'isJumped',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: 'jumpTimeline_2',
                },
                checkCondition_4: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                  },
                  next: 'modifyActionValue_3',
                },
                listenForCombatEvents_5: {
                  action: {
                    kind: 'listenForCombatEvents',
                    parameters: {
                      responses: [
                        {
                          key: 'SkillData.chr_0032_lizhiyan_normal_skill_abilityrange.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                          event: { kind: 'abilityEvent', event: 'beforeAddedBuff' },
                          phase: 'dataAction',
                          priority: 0,
                          sequence: { $sequence: 'checkCondition_4' },
                        },
                      ],
                    },
                  },
                  next: null,
                },
                finishOwner_8: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                applyElementalInfliction_9: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'nature', isExtra: false, inverseReaction: true },
                  },
                  next: null,
                },
                dealDamage_10: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange/actionGraph/main/nodes/dealDamage_10/action',
                  },
                  next: 'applyElementalInfliction_9',
                },
                forEachContextTarget_11: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                    body: { $sequence: null },
                  },
                  next: 'dealDamage_10',
                },
                checkCondition_13: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                  },
                  next: 'applyElementalInfliction_9',
                },
                dealDamage_14: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'nature',
                      attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_4' },
                    },
                    key: 'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange/actionGraph/main/nodes/dealDamage_14/action',
                  },
                  next: 'checkCondition_13',
                },
                forEachContextTarget_15: {
                  action: {
                    kind: 'forEachContextTarget',
                    parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                    body: { $sequence: null },
                  },
                  next: 'dealDamage_14',
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
                    kind: 'eventBuffIdMatch',
                    buffIds: ['buff_chr_0032_lizhiyan_normal_skill_listener'],
                  },
                },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'isJumped', fallback: 0 },
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
              },
            },
            macros: {},
          },
        },
      },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_aura',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      childSkill: {
        skillId: 'chr_0032_lizhiyan_ultimate_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1800,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_laser: 0.5, atk_scale_laser_will: 0.2, isWisd: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'applyBuff_1' } },
          { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'ifElse_5' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              applyBuff_1: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      { buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity' },
                    ],
                    targets: { kind: 'owner' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                  },
                },
                next: null,
              },
              aura_3: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [
                      {
                        buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura',
                        blackboardAssignments: {
                          atk_scale_laser: { kind: 'valueNode', nodeId: 'data_1' },
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
              aura_4: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [
                      {
                        buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura',
                        blackboardAssignments: {
                          atk_scale_laser: { kind: 'valueNode', nodeId: 'data_2' },
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
              ifElse_5: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  whenTrue: { $sequence: 'aura_3' },
                  whenFalse: { $sequence: 'aura_4' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_laser' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_laser_will' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_3' },
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
    abilityentity_chr_0032_lizhiyan_ultimate_skill_place: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_place',
      ],
      blackboard: { EntityBB_index: 0 },
      lifetime: { kind: 'limited', durationSeconds: 30 },
    },
    abilityentity_chr_0032_lizhiyan_combo_skill_death: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_death_move',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 200,
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
    abilityentity_chr_0032_lizhiyan_combo_skill_place: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_death: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_laser: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_tower',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      childSkill: {
        skillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_laser: 1 },
        scheduledSequences: [
          { startFrame: 12, endFrame: 28, sequence: { $sequence: 'mergeContextTargets_opt2' } },
          { startFrame: 13, endFrame: 45, sequence: { $sequence: 'ifElse_14' } },
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
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser:chr_0032_lizhiyan_ultimate_skill_laser:/childSkill/actionGraph/main/nodes/dealDamage_2/action',
                },
                next: null,
              },
              createTimedMarker_6: {
                action: {
                  kind: 'createTimedMarker',
                  parameters: {
                    targets: { kind: 'source' },
                    markerId: 'lizhiyan_ult_laser_hit3',
                    durationSeconds: { kind: 'constant', value: 0.8 },
                    autoFinishByAction: false,
                    timeDomain: 'globalScaled',
                  },
                },
                next: null,
              },
              checkCondition_7: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                },
                next: null,
              },
              createTimedMarker_9: {
                action: {
                  kind: 'createTimedMarker',
                  parameters: {
                    targets: { kind: 'source' },
                    markerId: 'lizhiyan_ult_laser_hit2',
                    durationSeconds: { kind: 'constant', value: 0.8 },
                    autoFinishByAction: false,
                    timeDomain: 'globalScaled',
                  },
                },
                next: null,
              },
              ifElse_10: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_3' },
                  whenTrue: { $sequence: 'createTimedMarker_6' },
                  whenFalse: { $sequence: 'checkCondition_7' },
                },
                next: null,
              },
              createTimedMarker_12: {
                action: {
                  kind: 'createTimedMarker',
                  parameters: {
                    targets: { kind: 'source' },
                    markerId: 'lizhiyan_ult_laser_hit1',
                    durationSeconds: { kind: 'constant', value: 0.8 },
                    autoFinishByAction: false,
                    timeDomain: 'globalScaled',
                  },
                },
                next: null,
              },
              ifElse_13: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  whenTrue: { $sequence: 'createTimedMarker_9' },
                  whenFalse: { $sequence: 'ifElse_10' },
                },
                next: null,
              },
              ifElse_14: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_5' },
                  whenTrue: { $sequence: 'createTimedMarker_12' },
                  whenFalse: { $sequence: 'ifElse_13' },
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
                next: 'dealDamage_2',
              },
              mergeContextTargets_opt2: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'tar',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'ifElse_opt1',
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_laser' },
              },
              data_2: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  returnTrueIfNotExists: true,
                  target: 'caster',
                  markerId: 'lizhiyan_power_attack_effect',
                },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  returnTrueIfNotExists: true,
                  target: 'caster',
                  markerId: 'lizhiyan_ult_laser_hit3',
                },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  returnTrueIfNotExists: true,
                  target: 'caster',
                  markerId: 'lizhiyan_ult_laser_hit2',
                },
              },
              data_5: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  returnTrueIfNotExists: true,
                  target: 'caster',
                  markerId: 'lizhiyan_ult_laser_hit1',
                },
              },
              data_6: {
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
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

export default arcane;
