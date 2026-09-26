/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const rossiChr_0028_wulfa_attack1ActionGraph = {
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack2'] },
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

export const rossiChr_0028_wulfa_attack1: SkillDefinition = {
  actionGraph: rossiChr_0028_wulfa_attack1ActionGraph,
  key: 'chr_0028_wulfa_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
  },
  timelineBlockFrames: 9,
  naturalDurationFrames: 139,
  exclusiveFrame: 15,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 3,
        endFrame: 34,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 9, endFrame: 34, skillIds: ['chr_0028_wulfa_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 9, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0028_wulfa_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const rossiChr_0028_wulfa_attack2ActionGraph = {
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
            curve: { kind: 'named', key: 'char_normal_attack' },
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
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_3',
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack2: SkillDefinition = {
  actionGraph: rossiChr_0028_wulfa_attack2ActionGraph,
  key: 'chr_0028_wulfa_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.54, 0.57, 0.61, 0.65, 0.71],
    poise: 0,
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 151,
  exclusiveFrame: 20,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 4,
        endFrame: 35,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 34, skillIds: ['chr_0028_wulfa_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'calculateActionValue_4' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 12, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0028_wulfa_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const rossiChr_0028_wulfa_attack3ActionGraph = {
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
            curve: { kind: 'named', key: 'char_normal_attack' },
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
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_3',
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_6: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 0.5 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_7',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack3: SkillDefinition = {
  actionGraph: rossiChr_0028_wulfa_attack3ActionGraph,
  key: 'chr_0028_wulfa_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
    poise: 0,
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 209,
  exclusiveFrame: 25,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 5,
        endFrame: 35,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 36, skillIds: ['chr_0028_wulfa_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'calculateActionValue_4' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 15, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0028_wulfa_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const rossiChr_0028_wulfa_attack4ActionGraph = {
  main: {
    nodes: {
      jumpTimeline_1: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 189 } },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'jumpTimeline_1' },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 0.25 },
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_3' },
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
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 0.2 },
          },
        },
        next: 'dealDamage_5',
      },
      calculateActionValue_22: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_5',
      },
      markCurrentSkillCanInterrupt_35: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_36: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      reachSkillOperableBoundary_37: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack4: SkillDefinition = {
  key: 'chr_0028_wulfa_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
    poise: 0,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 329,
  exclusiveFrame: 239,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 18,
        endFrame: 65,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack5',
      },
      {
        startFrame: 207,
        endFrame: 246,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack5',
      },
    ],
    allowedNextSkills: [
      { startFrame: 36, endFrame: 67, skillIds: ['chr_0028_wulfa_attack5'] },
      { startFrame: 225, endFrame: 250, skillIds: ['chr_0028_wulfa_attack5'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'calculateActionValue_6' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 23, endFrame: 25, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 195, endFrame: 197, sequence: { $sequence: 'calculateActionValue_22' } },
    { startFrame: 198, endFrame: 199, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 203, endFrame: 205, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 205, endFrame: 207, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 213, endFrame: 215, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 50, endFrame: 188, sequence: { $sequence: 'markCurrentSkillCanInterrupt_35' } },
    { startFrame: 188, endFrame: 189, sequence: { $sequence: 'finishTimeline_36' } },
    { startFrame: 36, endFrame: 67, sequence: { $sequence: 'reachSkillOperableBoundary_37' } },
    { startFrame: 225, endFrame: 250, sequence: { $sequence: 'reachSkillOperableBoundary_37' } },
  ],
  timelineContinuationSkillId: 'chr_0028_wulfa_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack4ActionGraph,
};

export const rossiChr_0028_wulfa_attack5ActionGraph = {
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
      modifyActionValue_3: {
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_4',
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.002923974,
                  value: 0.2,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1241782,
                  value: 0.1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5,
                  value: 0.1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.2,
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'isHitbyMain', fallback: 0 },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack5: SkillDefinition = {
  key: 'chr_0028_wulfa_attack5',
  blackboard: {
    atb: 21,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    isHitbyMain: 0,
    poise: 18,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 146,
  exclusiveFrame: 30,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 27,
        endFrame: 60,
        input: 'basicAttack',
        targetSkillId: 'chr_0028_wulfa_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 45, endFrame: 60, skillIds: ['chr_0028_wulfa_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 16, endFrame: 18, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 45, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0028_wulfa_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack5ActionGraph,
};

export const rossiChr_0028_wulfa_power_attackActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_3',
      },
      repeatEachTick_opt1: {
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
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_14: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'dealDamage_13',
      },
      startTimeDilation_15: {
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
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5935698,
                  value: 0.05,
                  inTangent: -0.02046953,
                  outTangent: -0.02046953,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.483965,
                  outTangent: 3.483965,
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
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_powerattack_resumecombo',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_16' },
        },
        next: null,
      },
      applyBuff_18: {
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
      applyBuff_19: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_combo_2_qte_timerlistening'],
          operator: 'greater',
          value: { kind: 'constant', value: 0.5 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_power_attack: SkillDefinition = {
  key: 'chr_0028_wulfa_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 66,
  naturalDurationFrames: 216,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'repeatEachTick_opt1' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'repeatEachTick_opt1' } },
    { startFrame: 36, endFrame: 39, sequence: { $sequence: 'gainFinisherSp_14' } },
    { startFrame: 38, endFrame: 41, sequence: { $sequence: 'startTimeDilation_15' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'conditional_17' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_18' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_19' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: rossiChr_0028_wulfa_power_attackActionGraph,
};

export const rossiChr_0028_wulfa_plunging_attack_endActionGraph = {
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
            damageType: 'physical',
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

export const rossiChr_0028_wulfa_plunging_attack_end: SkillDefinition = {
  actionGraph: rossiChr_0028_wulfa_plunging_attack_endActionGraph,
  key: 'chr_0028_wulfa_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 161,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const rossiChr_0028_wulfa_normal_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'trigger', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'modifyActionValue_1',
      },
      repeatEachTick_3: {
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
          body: { $sequence: 'dealDamage_2' },
        },
        next: null,
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0.3 },
          },
        },
        next: 'repeatEachTick_3',
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
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7389196,
                  value: 0.05473808,
                  inTangent: 0.02105814,
                  outTangent: 0.02105814,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.5,
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
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_10' },
        },
        next: null,
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'trigger', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_16',
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_17',
      },
      applyPhysicalInfliction_19: {
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
            duration: { kind: 'constant', value: 1.2 },
            height: { kind: 'constant', value: 1.5 },
            speedFactorMultiplier: 1,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_18',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FollowAttackTrigger',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyPhysicalInfliction_19',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_15' },
          whenFalse: { $sequence: 'applyPhysicalInfliction_19' },
        },
        next: null,
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
          body: { $sequence: 'conditional_20' },
        },
        next: null,
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'trigger',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_21',
      },
      calculateActionValue_23: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'constant', value: 0.4 },
          },
        },
        next: 'modifyActionValue_22',
      },
      launchProjectile_24: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 0.333333343267441,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0028_wulfa_normal_skill_projhit2',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 10,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb_return: 10,
                  atk_scale_3: 3,
                  atk_scale_bleed: 0,
                  atk_scale_once: 0,
                  bleed_critical_damage_interval: 2,
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration: 0,
                  duration_bleed: 0,
                  fire_duration: 0,
                  heal_scale: 0.005,
                  hit_bleed_num: 0,
                  poise_2: 0,
                  potential_upgrade: 0,
                  skillimbue: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp: 0,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_44' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_50' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_40: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_29: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      applyBuff_27: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      conditional_32: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'applyBuff_29' },
                        },
                        next: null,
                      },
                      conditional_33: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'conditional_32' },
                        },
                        next: null,
                      },
                      conditional_36: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_8' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      conditional_38: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'conditional_36' },
                        },
                        next: null,
                      },
                      conditional_39: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_38' },
                          whenFalse: { $sequence: 'conditional_38' },
                        },
                        next: null,
                      },
                      conditional_41: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_15' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_39' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      calculateActionValue_42: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_16' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'conditional_41',
                      },
                      calculateActionValue_43: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_17' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_42',
                      },
                      repeatEachTick_44: {
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
                          body: { $sequence: 'calculateActionValue_43' },
                        },
                        next: null,
                      },
                      finishBuffsById_47: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'caster',
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_46: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_18' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_47',
                      },
                      conditional_48: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_20' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_46' },
                          whenFalse: { $sequence: 'finishBuffsById_47' },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_49: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_21' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'conditional_48',
                      },
                      conditional_50: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_49' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_once' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_2', fallback: 0 },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_3' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_1', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_2', fallback: 0 },
                      },
                      data_8: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_7' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_1', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'skillimbue', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_13: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0028_wulfa_normal_smarttarget'],
                          operator: 'greater',
                          value: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_14: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_15: {
                        type: 'boolean',
                        expression: {
                          kind: 'all',
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_13' },
                            { kind: 'conditionNode', nodeId: 'data_14' },
                          ],
                        },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_18: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_19: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
                      },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_19' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_22: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
      launchProjectile_25: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 1,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0028_wulfa_normal_skill_projhit3',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb_return: 10,
                  atk_scale_3: 3,
                  atk_scale_bleed: 0,
                  atk_scale_once: 0,
                  bleed_critical_damage_interval: 2,
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration: 0,
                  duration_bleed: 0,
                  fire_duration: 0,
                  heal_scale: 0.005,
                  hit_bleed_num: 0,
                  poise_2: 0,
                  potential_upgrade: 0,
                  skillimbue: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp: 0,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_45' } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_47' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_54' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_40: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_29: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      applyBuff_27: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      conditional_32: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'applyBuff_29' },
                        },
                        next: null,
                      },
                      conditional_33: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'conditional_32' },
                        },
                        next: null,
                      },
                      conditional_36: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_8' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      conditional_38: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'conditional_36' },
                        },
                        next: null,
                      },
                      conditional_39: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_38' },
                          whenFalse: { $sequence: 'conditional_38' },
                        },
                        next: null,
                      },
                      conditional_41: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_15' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_39' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      applyBuff_42: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_tut_normalskill_success',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                            finishByAction: true,
                          },
                        },
                        next: 'conditional_41',
                      },
                      calculateActionValue_43: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_16' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'applyBuff_42',
                      },
                      calculateActionValue_44: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_17' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_43',
                      },
                      repeatEachTick_45: {
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
                          body: { $sequence: 'calculateActionValue_44' },
                        },
                        next: null,
                      },
                      calculateActionValue_46: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'hit_bleed_num',
                            operation: 'add',
                            left: { kind: 'valueNode', nodeId: 'data_18' },
                            right: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      conditional_47: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
                          whenTrue: { $sequence: 'calculateActionValue_46' },
                        },
                        next: null,
                      },
                      finishBuffsById_51: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'caster',
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_50: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_20' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_51',
                      },
                      conditional_52: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_22' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_50' },
                          whenFalse: { $sequence: 'finishBuffsById_51' },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_53: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_23' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'conditional_52',
                      },
                      conditional_54: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_53' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_once' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_2', fallback: 0 },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_3' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_1', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_2', fallback: 0 },
                      },
                      data_8: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_7' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_1', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'skillimbue', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_13: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0028_wulfa_normal_smarttarget'],
                          operator: 'greater',
                          value: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_14: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_15: {
                        type: 'boolean',
                        expression: {
                          kind: 'all',
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_13' },
                            { kind: 'conditionNode', nodeId: 'data_14' },
                          ],
                        },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_18: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'hit_bleed_num' },
                      },
                      data_19: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0028_wulfa_normal_bleed'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_20: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_21: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
                      },
                      data_22: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_21' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_24: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
      launchProjectile_26: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 1,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0028_wulfa_normal_skill_projhit4',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb_return: 10,
                  atk_scale_3: 3,
                  atk_scale_bleed: 0,
                  atk_scale_once: 0,
                  bleed_critical_damage_interval: 2,
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration: 0,
                  duration_bleed: 0,
                  fire_duration: 0,
                  heal_scale: 0.005,
                  hit_bleed_num: 0,
                  poise_2: 0,
                  potential_upgrade: 0,
                  skillimbue: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp: 0,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_44' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_50' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_40: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_29: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      applyBuff_27: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      conditional_32: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'applyBuff_29' },
                        },
                        next: null,
                      },
                      conditional_33: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'conditional_32' },
                        },
                        next: null,
                      },
                      conditional_36: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_8' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      conditional_38: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'conditional_36' },
                        },
                        next: null,
                      },
                      conditional_39: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_38' },
                          whenFalse: { $sequence: 'conditional_38' },
                        },
                        next: null,
                      },
                      conditional_41: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_15' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_39' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      calculateActionValue_42: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_16' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'conditional_41',
                      },
                      calculateActionValue_43: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_17' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_42',
                      },
                      repeatEachTick_44: {
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
                          body: { $sequence: 'calculateActionValue_43' },
                        },
                        next: null,
                      },
                      finishBuffsById_47: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'caster',
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_46: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_18' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_47',
                      },
                      conditional_48: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_20' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_46' },
                          whenFalse: { $sequence: 'finishBuffsById_47' },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_49: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_21' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'conditional_48',
                      },
                      conditional_50: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_49' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_once' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_2', fallback: 0 },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_3' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_1', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_2', fallback: 0 },
                      },
                      data_8: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_7' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_1', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'skillimbue', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_13: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0028_wulfa_normal_smarttarget'],
                          operator: 'greater',
                          value: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_14: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_15: {
                        type: 'boolean',
                        expression: {
                          kind: 'all',
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_13' },
                            { kind: 'conditionNode', nodeId: 'data_14' },
                          ],
                        },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_18: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_19: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
                      },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_19' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_22: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
      launchProjectile_27: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 1,
            hit: { onReach: true, finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0028_wulfa_normal_skill_projhit5',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb_return: 10,
                  atk_scale_3: 3,
                  atk_scale_bleed: 0,
                  atk_scale_once: 0,
                  bleed_critical_damage_interval: 2,
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration: 0,
                  duration_bleed: 0,
                  fire_duration: 0,
                  heal_scale: 0.005,
                  hit_bleed_num: 0,
                  poise_2: 0,
                  potential_upgrade: 0,
                  skillimbue: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp: 0,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_44' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_50' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_40: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyBuff_29: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      applyBuff_27: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_chr_0028_wulfa_normal_bleed',
                            target: 'enemy',
                            blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                            copiedBlackboardAssignments: {
                              duration: 'duration_bleed',
                              atk_scale: 'atk_scale_bleed',
                              extra_atk_scale: 'bleed_critical_damage_scale',
                              damage_cd: 'bleed_critical_damage_interval',
                              damage_up: 'damage_up',
                              heal_scale: 'heal_scale',
                              talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                            },
                          },
                        },
                        next: 'dealDamage_40',
                      },
                      conditional_32: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_4' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'applyBuff_29' },
                        },
                        next: null,
                      },
                      conditional_33: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'applyBuff_27' },
                          whenFalse: { $sequence: 'conditional_32' },
                        },
                        next: null,
                      },
                      conditional_36: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_8' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      conditional_38: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_33' },
                          whenFalse: { $sequence: 'conditional_36' },
                        },
                        next: null,
                      },
                      conditional_39: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_38' },
                          whenFalse: { $sequence: 'conditional_38' },
                        },
                        next: null,
                      },
                      conditional_41: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_15' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_39' },
                          whenFalse: { $sequence: 'dealDamage_40' },
                        },
                        next: null,
                      },
                      calculateActionValue_42: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_16' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'conditional_41',
                      },
                      calculateActionValue_43: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_17' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_42',
                      },
                      repeatEachTick_44: {
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
                          body: { $sequence: 'calculateActionValue_43' },
                        },
                        next: null,
                      },
                      finishBuffsById_47: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'caster',
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_46: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_18' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_47',
                      },
                      conditional_48: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_20' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_46' },
                          whenFalse: { $sequence: 'finishBuffsById_47' },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_49: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_21' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          },
                        },
                        next: 'conditional_48',
                      },
                      conditional_50: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
                          whenTrue: { $sequence: 'changeResourceByActionValue_49' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_once' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_2', fallback: 0 },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_3' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_2_1', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_2', fallback: 0 },
                      },
                      data_8: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_7' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent_1_1', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_11: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'skillimbue', fallback: 0 },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_11' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_13: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0028_wulfa_normal_smarttarget'],
                          operator: 'greater',
                          value: { kind: 'constant', value: 0.5 },
                        },
                      },
                      data_14: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_15: {
                        type: 'boolean',
                        expression: {
                          kind: 'all',
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_13' },
                            { kind: 'conditionNode', nodeId: 'data_14' },
                          ],
                        },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_2' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_18: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_19: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
                      },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_19' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_22: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
      withActionBlackboardScope_28: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_27' },
        },
        next: null,
      },
      withActionBlackboardScope_29: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_26' },
        },
        next: 'withActionBlackboardScope_28',
      },
      withActionBlackboardScope_30: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_25' },
        },
        next: 'withActionBlackboardScope_29',
      },
      withActionBlackboardScope_31: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_24' },
        },
        next: 'withActionBlackboardScope_30',
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_wolf_timer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'withActionBlackboardScope_31',
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_smarttarget',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_32',
      },
      gainSquadUltimateEnergyFromSkillCost_34: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      conditional_35: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_34' },
        },
        next: null,
      },
      finishBuffsById_36: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
            reason: 'early',
          },
        },
        next: null,
      },
      modifyActionValue_opt1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'skillimbue',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      jumpTimeline_40: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 215,
            condition: { kind: 'conditionNode', nodeId: 'data_12' },
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_41: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_42: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      applyBuff_43: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_normalskill_failure',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_44: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'applyBuff_43' },
        },
        next: null,
      },
      applyBuff_45: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_defup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'FollowAttackTrigger', fallback: 0 },
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
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise_1' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'trigger', fallback: 0 } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'FollowAttackTrigger', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 0.9 },
        },
      },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'FollowAttackTrigger', fallback: 0 },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_normal_skill: SkillDefinition = {
  key: 'chr_0028_wulfa_normal_skill',
  blackboard: {
    atb_return: 10,
    atk_scale_1: [0.85, 0.94, 1.02, 1.11, 1.19, 1.28, 1.37, 1.45, 1.54, 1.64, 1.77, 1.92],
    atk_scale_3: [1.28, 1.41, 1.53, 1.66, 1.79, 1.92, 2.04, 2.17, 2.3, 2.46, 2.65, 2.88],
    atk_scale_bleed: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    atk_scale_once: 0,
    bleed_critical_damage_interval: 2,
    bleed_critical_damage_scale: 1,
    damage_up: 0,
    duration_bleed: 15,
    FollowAttackTrigger: 0,
    heal_scale: 0.2,
    poise_1: 5,
    poise_2: [10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 15],
    potential_upgrade: 0,
    skillimbue: 0,
    talent_1_1: 0,
    talent_1_2: 0,
    talent_2_1: 0,
    talent_2_2: 0,
    talent2_burning_damage_scale: 1.5,
    trigger: 0,
    usp_2: 10,
  },
  timelineBlockFrames: 49,
  naturalDurationFrames: 475,
  exclusiveFrame: 272,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 38,
        endFrame: 56,
        skillIds: [
          'chr_0028_wulfa_normal_skill',
          'chr_0028_wulfa_combo_2_skill',
          'chr_0028_wulfa_combo_3_skill',
        ],
      },
      {
        startFrame: 258,
        endFrame: 277,
        skillIds: [
          'chr_0028_wulfa_normal_skill',
          'chr_0028_wulfa_combo_2_skill',
          'chr_0028_wulfa_combo_3_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'calculateActionValue_4' } },
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'calculateActionValue_4' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'calculateActionValue_23' } },
    { startFrame: 230, endFrame: 233, sequence: { $sequence: 'applyBuff_33' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'conditional_35' } },
    { startFrame: 215, endFrame: 218, sequence: { $sequence: 'finishBuffsById_36' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_opt1' } },
    { startFrame: 37, endFrame: 40, sequence: { $sequence: 'jumpTimeline_40' } },
    { startFrame: 49, endFrame: 214, sequence: { $sequence: 'markCurrentSkillCanInterrupt_41' } },
    { startFrame: 214, endFrame: 215, sequence: { $sequence: 'finishTimeline_42' } },
    { startFrame: 37, endFrame: 72, sequence: { $sequence: 'conditional_44' } },
    { startFrame: 215, endFrame: 272, sequence: { $sequence: 'applyBuff_45' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: rossiChr_0028_wulfa_normal_skillActionGraph,
};

export const rossiChr_0028_wulfa_combo_2_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.24 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.075,
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'can_trigger_combo',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'count',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'calculateActionValue_4',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_5',
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'constant', value: 0.35 },
          },
        },
        next: 'calculateActionValue_6',
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
          body: { $sequence: 'calculateActionValue_7' },
        },
        next: null,
      },
      calculateActionValue_9: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'count',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_11' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_2_damagewait',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              trigger_times: { kind: 'constant', value: 3 },
              damage_interval: { kind: 'constant', value: 0.125 },
              duration: { kind: 'constant', value: 0.3 },
            },
            copiedBlackboardAssignments: { atk_scale: 'atk_scale_once' },
          },
        },
        next: 'calculateActionValue_9',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'constant', value: 0.1 },
          },
        },
        next: 'applyBuff_10',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_13' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_14' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'calculateActionValue_11',
      },
      calculateActionValue_13: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_12',
      },
      calculateActionValue_14: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'constant', value: 0.35 },
          },
        },
        next: 'calculateActionValue_13',
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
      changeResourceByActionValue_16: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_17' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_16' },
        },
        next: null,
      },
      finishBuffsById_18: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0028_wulfa_combo_2_qte_timerlistening'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
          whenTrue: { $sequence: 'finishBuffsById_18' },
        },
        next: null,
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { time_succeed: 'time_succeed' },
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      changeSkillSlot_23: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillGroupKey: 'comboSkill',
            targetSkillKey: 'chr_0028_wulfa_combo_3_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
            revertedSkillKey: 'chr_0028_wulfa_combo_2_skill',
          },
        },
        next: null,
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_28' } },
          whenTrue: { $sequence: 'changeSkillSlot_23' },
        },
        next: null,
      },
      finishBuffsById_25: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0028_wulfa_combo_usetimer'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_29' } },
          whenTrue: { $sequence: 'finishBuffsById_25' },
        },
        next: null,
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_usecount',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_26',
      },
      finishBuffsById_35: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_usetimer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      adjustSkillCooldown_32: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0028_wulfa_combo_2_skill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'applyBuff_31',
      },
      openComboWindow_33: {
        action: { kind: 'openComboWindow', parameters: { nextSkillKeyFromSlot: 'comboSkill' } },
        next: 'adjustSkillCooldown_32',
      },
      conditional_34: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_30' }, alwaysNext: true },
          whenTrue: { $sequence: 'openComboWindow_33' },
          whenFalse: { $sequence: 'openComboWindow_33' },
        },
        next: null,
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_32' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_34' },
          whenFalse: { $sequence: 'finishBuffsById_35' },
        },
        next: null,
      },
      startTimeDilation_37: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.633 },
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
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_defup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_2' },
            { kind: 'conditionNode', nodeId: 'data_3' },
          ],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'can_trigger_combo' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise_once' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'poise_once' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_18' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_20: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use', fallback: 0 },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_20' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'can_trigger_combo', fallback: 0 },
      },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_24' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_23' },
            { kind: 'conditionNode', nodeId: 'data_25' },
          ],
        },
      },
      data_27: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'can_trigger_combo', fallback: 0 },
      },
      data_28: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_27' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_29: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_30: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'ratio',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_31: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'can_trigger_combo', fallback: 0 },
      },
      data_32: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_31' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_combo_2_skill: SkillDefinition = {
  key: 'chr_0028_wulfa_combo_2_skill',
  blackboard: {
    atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    atk_scale_once: 0.01,
    can_trigger_combo: 0,
    count: 0,
    poise: 0,
    poise_once: 0.01,
    time_succeed: 0.4,
    usp: 10,
  },
  timelineBlockFrames: 66,
  naturalDurationFrames: 198,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 37,
        endFrame: 65,
        skillIds: ['chr_0028_wulfa_normal_skill', 'chr_0028_wulfa_combo_3_skill'],
      },
    ],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'repeatEachTick_15' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'conditional_17' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'conditional_20' } },
    { startFrame: 37, endFrame: 38, sequence: { $sequence: 'conditional_22' } },
    { startFrame: 37, endFrame: 58, sequence: { $sequence: 'conditional_24' } },
    { startFrame: 0, endFrame: 37, sequence: { $sequence: 'applyBuff_27' } },
    { startFrame: 37, endFrame: 41, sequence: { $sequence: 'conditional_36' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_37' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_38' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [450, 450, 450, 450, 450, 450, 450, 450, 450, 450, 450, 420],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: rossiChr_0028_wulfa_combo_2_skillActionGraph,
};

export const rossiChr_0028_wulfa_combo_3_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.2,
                  value: 0.03,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.75,
                  value: 0.03,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0.149662,
                  outTangent: 0.149662,
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      repeatEachTick_3: {
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
          body: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'spellinflict_stack_max',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_hasinflict',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_inflictnum',
            target: 'enemy',
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_5',
      },
      finishBuffsByTag_7: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_6',
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'buff_stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'finishBuffsByTag_7',
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_8' },
          whenFalse: { $sequence: 'modifyActionValue_9' },
        },
        next: null,
      },
      finishBuffsByTag_14: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_6',
      },
      readBuffStackCount_15: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'buff_stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'finishBuffsByTag_14',
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_15' },
          whenFalse: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      finishBuffsByTag_20: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_6',
      },
      readBuffStackCount_21: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'buff_stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
        },
        next: 'finishBuffsByTag_20',
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_21' },
          whenFalse: { $sequence: 'conditional_22' },
        },
        next: null,
      },
      finishBuffsByTag_26: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_6',
      },
      readBuffStackCount_27: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'buff_stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
        },
        next: 'finishBuffsByTag_26',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_27' },
          whenFalse: { $sequence: 'conditional_28' },
        },
        next: null,
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
          body: { $sequence: 'conditional_29' },
        },
        next: null,
      },
      finishBuffsById_34: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'enemy',
            buffIds: ['buff_chr_0028_wulfa_combo_hasinflict'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyPhysicalInfliction_35: {
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
            duration: { kind: 'constant', value: 1 },
            height: { kind: 'constant', value: 20 },
            speedFactorMultiplier: 10,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'finishBuffsById_34',
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'applyPhysicalInfliction_35' },
        },
        next: null,
      },
      forEachContextTarget_38: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_36' },
        },
        next: null,
      },
      conditional_39: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_38' },
          whenFalse: { $sequence: 'forEachContextTarget_38' },
        },
        next: null,
      },
      conditional_40: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_39' },
        },
        next: null,
      },
      calculateActionValue_41: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'count',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      dealDamage_42: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_13' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'calculateActionValue_41',
      },
      finishBuffsById_43: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'enemy',
            buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'],
            reason: 'other',
          },
        },
        next: 'dealDamage_42',
      },
      calculateActionValue_44: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_43',
      },
      calculateActionValue_45: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_44',
      },
      calculateActionValue_46: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_17' },
            right: { kind: 'valueNode', nodeId: 'data_18' },
          },
        },
        next: 'calculateActionValue_45',
      },
      calculateActionValue_47: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'calculateActionValue_46',
      },
      calculateActionValue_48: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_21' },
            right: { kind: 'valueNode', nodeId: 'data_22' },
          },
        },
        next: 'calculateActionValue_47',
      },
      readBuffStackCount_49: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'spellinflict_stack_max',
            query: { kind: 'id', buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'] },
          },
        },
        next: 'calculateActionValue_48',
      },
      repeatEachTick_50: {
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
          body: { $sequence: 'readBuffStackCount_49' },
        },
        next: null,
      },
      finishBuffsById_51: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0028_wulfa_combo_usetimer', 'buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_52: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' } },
          whenTrue: { $sequence: 'finishBuffsById_51' },
        },
        next: null,
      },
      changeSkillSlot_53: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillGroupKey: 'comboSkill',
            targetSkillKey: 'chr_0028_wulfa_combo_2_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'conditional_52',
      },
      adjustSkillCooldown_54: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0028_wulfa_combo_2_skill' },
            operation: 'set',
            basis: 'baseDurationRatio',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'changeSkillSlot_53',
      },
      applyBuff_55: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_usecount',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'adjustSkillCooldown_54',
      },
      changeResourceByActionValue_56: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_24' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_57: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_56' },
        },
        next: null,
      },
      modifyActionValue_64: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'buff_stack',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_9',
      },
      conditional_71: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_8' },
          whenFalse: { $sequence: 'modifyActionValue_64' },
        },
        next: null,
      },
      conditional_77: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_28' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_15' },
          whenFalse: { $sequence: 'conditional_71' },
        },
        next: null,
      },
      conditional_83: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_29' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_21' },
          whenFalse: { $sequence: 'conditional_77' },
        },
        next: null,
      },
      conditional_84: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_30' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_27' },
          whenFalse: { $sequence: 'conditional_83' },
        },
        next: null,
      },
      repeatEachTick_85: {
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
          body: { $sequence: 'conditional_84' },
        },
        next: null,
      },
      applyBuff_91: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_physical_no_guard',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_34',
      },
      applyPhysicalInfliction_92: {
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
            duration: { kind: 'constant', value: 1 },
            height: { kind: 'constant', value: 20 },
            speedFactorMultiplier: 10,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'applyBuff_91',
      },
      conditional_93: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_31' } },
          whenTrue: { $sequence: 'applyPhysicalInfliction_92' },
        },
        next: null,
      },
      forEachContextTarget_95: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_93' },
        },
        next: null,
      },
      conditional_96: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_32' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_95' },
          whenFalse: { $sequence: 'forEachContextTarget_95' },
        },
        next: null,
      },
      conditional_97: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_34' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_96' },
        },
        next: null,
      },
      calculateActionValue_104: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_35' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_43',
      },
      calculateActionValue_105: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_36' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_104',
      },
      calculateActionValue_106: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_37' },
            right: { kind: 'valueNode', nodeId: 'data_38' },
          },
        },
        next: 'calculateActionValue_105',
      },
      calculateActionValue_107: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_39' },
            right: { kind: 'valueNode', nodeId: 'data_40' },
          },
        },
        next: 'calculateActionValue_106',
      },
      calculateActionValue_108: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_41' },
            right: { kind: 'valueNode', nodeId: 'data_42' },
          },
        },
        next: 'calculateActionValue_107',
      },
      readBuffStackCount_109: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'spellinflict_stack_max',
            query: { kind: 'id', buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'] },
          },
        },
        next: 'calculateActionValue_108',
      },
      repeatEachTick_110: {
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
          body: { $sequence: 'readBuffStackCount_109' },
        },
        next: null,
      },
      finishCurrentAbilityEntity_114: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      jumpTimeline_123: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 212 } },
        next: null,
      },
      modifyActionValue_124: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'timing_success',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'jumpTimeline_123',
      },
      forEachContextTarget_125: {
        action: {
          kind: 'forEachContextTarget',
          parameters: {
            contextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].failActions.actionData[1]',
          },
          body: { $sequence: 'finishCurrentAbilityEntity_114' },
        },
        next: 'modifyActionValue_124',
      },
      findOwnerSpawnedAbilityEntities_126: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].failActions.actionData[1]',
          },
        },
        next: 'forEachContextTarget_125',
      },
      finishBuffsById_127: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0028_wulfa_combo_2_qte_timer',
              'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
            ],
            reason: 'early',
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_126',
      },
      calculateActionValue_113: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_s',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_43' },
            right: { kind: 'valueNode', nodeId: 'data_44' },
          },
        },
        next: null,
      },
      conditional_115: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_46' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_113' },
        },
        next: null,
      },
      forEachContextTarget_116: {
        action: {
          kind: 'forEachContextTarget',
          parameters: {
            contextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].succeedActions.actionData[13]',
          },
          body: { $sequence: 'finishCurrentAbilityEntity_114' },
        },
        next: 'conditional_115',
      },
      findOwnerSpawnedAbilityEntities_117: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].succeedActions.actionData[13]',
          },
        },
        next: 'forEachContextTarget_116',
      },
      startTimeDilation_118: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'unassigned',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: ['caster'],
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_117',
      },
      forEachContextTarget_119: {
        action: {
          kind: 'forEachContextTarget',
          parameters: {
            contextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].succeedActions.actionData[2]',
          },
          body: { $sequence: 'finishCurrentAbilityEntity_114' },
        },
        next: 'startTimeDilation_118',
      },
      findOwnerSpawnedAbilityEntities_120: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey:
              '__finishOwnerAll:SkillData.chr_0028_wulfa_combo_3_skill.actionGroupData.timelineActions[22]._sequenceActionData.actionData[1].succeedActions.actionData[2]',
          },
        },
        next: 'forEachContextTarget_119',
      },
      modifyActionValue_121: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'timing_success',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_120',
      },
      finishBuffsById_122: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0028_wulfa_combo_2_qte_timer',
              'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
            ],
            reason: 'early',
          },
        },
        next: 'modifyActionValue_121',
      },
      conditional_128: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_48' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_122' },
          whenFalse: { $sequence: 'finishBuffsById_127' },
        },
        next: null,
      },
      conditional_130: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_53' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_56' },
        },
        next: null,
      },
      applyBuff_131: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_criticalrate',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'crit_increase_duration',
              critical_rate: 'crit_increase_rate',
              critical_damage_inc: 'crit_damage_increase_rate',
            },
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_133: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_134: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      startTimeDilation_135: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.633 },
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
      applyBuff_138: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_comboskill_failure',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_137: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_comboskill_success',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_139: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_55' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_137' },
          whenFalse: { $sequence: 'applyBuff_138' },
        },
        next: null,
      },
      applyBuff_141: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_comboskill_finish',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_142: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_57' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'applyBuff_138' },
        },
        next: 'applyBuff_141',
      },
      applyBuff_146: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_defup',
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'buff_stack' } },
      data_4: {
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
      data_5: {
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
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0028_wulfa_combo_hasinflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'poise_once' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'poise_f' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_18: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_atk_multiply' },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_s' } },
      data_21: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spellinflict_stack_max' },
      },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'damage_add' } },
      data_23: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
          operator: 'equal',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'usp_s' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_25' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_27: {
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
      data_28: {
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
      data_29: {
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
      data_30: {
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
      data_31: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0028_wulfa_combo_hasinflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_32: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_33: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_34: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_33' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_35: { type: 'number', expression: { kind: 'blackboard', key: 'poise_s' } },
      data_36: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_37: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_38: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_atk_multiply' },
      },
      data_39: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_40: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_s' } },
      data_41: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spellinflict_stack_max' },
      },
      data_42: { type: 'number', expression: { kind: 'blackboard', key: 'damage_add' } },
      data_43: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_s' } },
      data_44: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_atk_multiply' },
      },
      data_45: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_46: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_45' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_47: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_QTE_Trigger', fallback: 0 },
      },
      data_48: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_47' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_49: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_50: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_49' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_51: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_52: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_51' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_53: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_50' },
            { kind: 'conditionNode', nodeId: 'data_52' },
          ],
        },
      },
      data_54: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_55: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_54' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_56: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'timing_success', fallback: 0 },
      },
      data_57: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_56' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_combo_3_skill: SkillDefinition = {
  key: 'chr_0028_wulfa_combo_3_skill',
  blackboard: {
    atk_scale_f: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    atk_scale_once: 0,
    atk_scale_s: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    buff_stack: 0,
    count: 0,
    crit_damage_increase_rate: [0.3, 0.3, 0.3, 0.34, 0.34, 0.34, 0.38, 0.38, 0.42, 0.42, 0.46, 0.5],
    crit_increase_duration: 15,
    crit_increase_rate: [0.15, 0.15, 0.15, 0.17, 0.17, 0.17, 0.19, 0.19, 0.21, 0.21, 0.23, 0.25],
    damage_add: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    poise_f: 5,
    poise_once: 0,
    poise_s: 5,
    potential_1: 0,
    potential_atk_multiply: 1,
    spellinflict_stack_max: 0,
    timing_success: 0,
    usp_s: 10,
  },
  timelineBlockFrames: 60,
  naturalDurationFrames: 409,
  exclusiveFrame: 259,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 52, endFrame: 72, skillIds: ['chr_0028_wulfa_normal_skill'] },
      { startFrame: 249, endFrame: 269, skillIds: ['chr_0028_wulfa_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 225, endFrame: 226, sequence: { $sequence: 'repeatEachTick_3' } },
    { startFrame: 227, endFrame: 227, sequence: { $sequence: 'repeatEachTick_30' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'conditional_40' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'repeatEachTick_50' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_55' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'conditional_57' } },
    { startFrame: 29, endFrame: 29, sequence: { $sequence: 'repeatEachTick_85' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'conditional_97' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_3' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'repeatEachTick_110' } },
    { startFrame: 0, endFrame: 28, sequence: { $sequence: 'conditional_128' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'conditional_130' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_131' } },
    { startFrame: 212, endFrame: 215, sequence: { $sequence: 'applyBuff_131' } },
    { startFrame: 60, endFrame: 211, sequence: { $sequence: 'markCurrentSkillCanInterrupt_133' } },
    { startFrame: 211, endFrame: 212, sequence: { $sequence: 'finishTimeline_134' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_135' } },
    { startFrame: 212, endFrame: 222, sequence: { $sequence: 'startTimeDilation_135' } },
    { startFrame: 29, endFrame: 58, sequence: { $sequence: 'conditional_139' } },
    { startFrame: 29, endFrame: 59, sequence: { $sequence: 'conditional_142' } },
    { startFrame: 227, endFrame: 257, sequence: { $sequence: 'conditional_142' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_146' } },
    { startFrame: 212, endFrame: 259, sequence: { $sequence: 'applyBuff_146' } },
  ],
  smartTarget: 'enemy',
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: rossiChr_0028_wulfa_combo_3_skillActionGraph,
};

export const rossiChr_0028_wulfa_ultimate_skillActionGraph = {
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
            buffId: 'buff_chr_0028_wulfa_ult_stopenemy_elite',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 3.099969 } },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_ult_stopenemy',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 2.866664 } },
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_ult_addtional_battleshape',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'hit_num', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'modifyActionValue_11',
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
          body: { $sequence: 'dealDamage_12' },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_13',
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_11',
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
            key: 'hit_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_opt4',
      },
      startTimeDilation_24: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.32 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.6,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.6,
                  inTangent: 1.865142,
                  outTangent: 1.865142,
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
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_24' },
        },
        next: null,
      },
      applyBuff_26: {
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
      hideUi_27: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_28: {
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
      calculateActionValue_29: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'crit_damage_up_to_bleed',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: null,
      },
      calculateActionValue_30: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'calculateActionValue_29',
      },
      calculateActionValue_31: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_14' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'calculateActionValue_30',
      },
      calculateActionValue_32: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'calculateActionValue_31',
      },
      conditional_33: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
          whenTrue: { $sequence: 'calculateActionValue_32' },
        },
        next: null,
      },
      applyBuff_34: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_ult_crit_damage_up_to_bleed',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { critical_damage_up_to_bleed: 'crit_damage_up_to_bleed' },
          },
        },
        next: null,
      },
      dealDamage_52: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_20' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      createSpatialPointTargets_53: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
        },
        next: 'dealDamage_52',
      },
      repeatEachTick_510: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.03333,
            },
          },
          body: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['elite'] } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Immune/Damage', 'SelectCategory/Unmarkable'],
        },
      },
      data_3: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['mob'] } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Immune/Damage', 'SelectCategory/Unmarkable'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'hit_num', fallback: 0 } },
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'crit_damage_up_to_bleed' },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_critical_damage' },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_damage_scale' },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_damage_scale' },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_damage_scale' },
      },
      data_18: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_18' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_ultimate_skill: SkillDefinition = {
  key: 'chr_0028_wulfa_ultimate_skill',
  blackboard: {
    atk_scale_1: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
    atk_scale_2: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale_3: [3.33, 3.67, 4, 4.33, 4.67, 5, 5.34, 5.67, 6, 6.42, 6.92, 7.5],
    crit_damage_up_to_bleed: 0.6,
    hit_num: 0,
    poise: 25,
    potential_5: 0,
    potential_5_critical_damage: 0,
    potential_5_damage_scale: 1.2,
  },
  timelineBlockFrames: 156,
  naturalDurationFrames: 311,
  exclusiveFrame: 155,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 57, endFrame: 150, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 64, endFrame: 150, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 64, endFrame: 111, sequence: { $sequence: 'applyBuff_10' } },
    { startFrame: 122, endFrame: 125, sequence: { $sequence: 'modifyActionValue_14' } },
    { startFrame: 131, endFrame: 134, sequence: { $sequence: 'modifyActionValue_opt5' } },
    { startFrame: 134, endFrame: 135, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 0, endFrame: 155, sequence: { $sequence: 'applyBuff_26' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'hideUi_27' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'startUltimateTimeDilation_28' } },
    { startFrame: 58, endFrame: 208, sequence: { $sequence: 'conditional_33' } },
    { startFrame: 58, endFrame: 208, sequence: { $sequence: 'applyBuff_34' } },
    { startFrame: 63, endFrame: 64, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 65, endFrame: 66, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 66, endFrame: 67, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 69, endFrame: 70, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 71, endFrame: 72, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 74, endFrame: 75, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 75, endFrame: 76, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 77, endFrame: 78, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 78, endFrame: 79, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 80, endFrame: 81, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 83, endFrame: 84, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 84, endFrame: 85, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 87, endFrame: 88, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 88, endFrame: 89, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 90, endFrame: 91, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 92, endFrame: 93, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 94, endFrame: 95, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 96, endFrame: 97, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 97, endFrame: 98, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 99, endFrame: 100, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 102, endFrame: 103, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 103, endFrame: 104, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 106, endFrame: 107, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 108, endFrame: 109, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 111, endFrame: 112, sequence: { $sequence: 'createSpatialPointTargets_53' } },
    { startFrame: 63, endFrame: 131, sequence: { $sequence: 'repeatEachTick_510' } },
  ],
  smartTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 110 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: rossiChr_0028_wulfa_ultimate_skillActionGraph,
};

export const rossiCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: rossiCommon_character_perfect_dodgeActionGraph,
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

const rossiComboCondition1ActionGraph = {
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
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: [
            'buff_chr_0028_wulfa_combo_usetimer',
            'buff_chr_0028_wulfa_combo_cannottrigger',
          ],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0028_wulfa_combo_2_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: rossiComboCondition1ActionGraph,
};

const rossiComboCondition2ActionGraph = {
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_3' },
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
          buffIds: [
            'buff_chr_0028_wulfa_combo_usetimer',
            'buff_chr_0028_wulfa_combo_cannottrigger',
          ],
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_physical_no_guard'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0028_wulfa_combo_2_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_4' },
  actionGraph: rossiComboCondition2ActionGraph,
};

const rossiBuff1ActionGraph = {
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
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff1: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'damage_interval' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: { blackboardKey: 'trigger_times' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_interval: 0.1,
    duration: 1,
    poise: 0,
    posie: 0,
    trigger_times: 3,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'dealDamage_1' } },
  actionGraph: rossiBuff1ActionGraph,
};

const rossiBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_combo_2_damage',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              poise: 'poise',
              trigger_times: 'trigger_times',
              damage_interval: 'damage_interval',
            },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_interval: 0.1,
    duration: 3,
    poise: 0,
    posie: 0,
    trigger_times: 3,
  },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'applyBuff_1' } },
  actionGraph: rossiBuff2ActionGraph,
};

const rossiBuff3ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_Combo_QTE_Trigger',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      showComboRingQte_2: {
        action: {
          kind: 'showComboRingQte',
          parameters: {
            earlyDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            activeDurationSeconds: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0028_wulfa_combo_qte_timing',
            childSkillId: 'chr_0028_wulfa_absorb_entity_effect_1',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_3' },
        },
        next: null,
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0028_wulfa_combo_qte_timing',
            childSkillId: 'chr_0028_wulfa_absorb_entity_effect_2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_5' },
        },
        next: null,
      },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_train_output_succbuff_or_failbuff_by_id'],
            reason: 'early',
          },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_comboskill_failure',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
          },
        },
        next: 'finishBuffsById_7',
      },
      setCurrentBuffTimePaused_9: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_9' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_11: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_11' },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_tut_comboskill_success',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
          },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_Combo_QTE_Trigger',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'modifyActionValue_14' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'time_warning' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'time_succeed' } },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use', fallback: 0 },
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
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0028_wulfa_powerattack_resumecombo'],
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_power_attack'] },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
      data_10: { type: 'boolean', expression: { kind: 'eventComboRingQteSucceeded' } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_9' },
            { kind: 'conditionNode', nodeId: 'data_10' },
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 6, time_succeed: 0.5, time_warning: 0.5 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'modifyActionValue_1' } },
    { startFrame: 0, endFrame: 180, sequence: { $sequence: 'showComboRingQte_2' } },
    { startFrame: 3, endFrame: 19, sequence: { $sequence: 'conditional_4' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'conditional_6' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'applyBuff_8' } },
  ],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_10' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_12' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_15' } },
  ],
  actionGraph: rossiBuff3ActionGraph,
};

const rossiBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff4: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_crit_up',
    iconPath: '/icons/icon_battle_crit_up.webp',
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
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {
    critical_damage_inc: 0.15,
    critical_rate: 0.1,
    duration: 10,
    usp_stage_1: 0.35,
    usp_stage_2: 0.7,
    usp_stage_3: 1,
  },
  attributeModifiers: [
    { attribute: 'criticalRate', slot: 'baseAddition', value: { blackboardKey: 'critical_rate' } },
    {
      attribute: 'criticalDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'critical_damage_inc' },
    },
  ],
  actionGraph: rossiBuff4ActionGraph,
};

const rossiBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff5: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  actionGraph: rossiBuff5ActionGraph,
};

const rossiBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  actionGraph: rossiBuff6ActionGraph,
};

const rossiBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff7: SkillBuffDefinition = {
  stackingType: 'enhanceAndOverwriteDuration',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: 10,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: rossiBuff7ActionGraph,
};

const rossiBuff8ActionGraph = {
  main: {
    nodes: {
      adjustSkillCooldown_1: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0028_wulfa_combo_2_skill' },
            operation: 'set',
            basis: 'baseDurationRatio',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'adjustSkillCooldown_1' },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: 'conditional_2',
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'setCurrentBuffTimePaused_4' },
        },
        next: null,
      },
      setCurrentBuffTimePaused_6: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
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
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'need_set_cd', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0028_wulfa_powerattack_resumecombo'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_power_attack'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff8: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 6, End_Early: 0, need_set_cd: 1 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'finishBuffsById_3' } },
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_5' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_7' } },
  ],
  actionGraph: rossiBuff8ActionGraph,
};

const rossiBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_bleed_effect',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
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
            takeAttackSnapshot: true,
            tags: [],
            features: ['dot', 'talentDamage'],
          },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_normal_bleed_crit_extra_damage',
            target: 'buffOwner',
            source: 'buffSource',
            copiedBlackboardAssignments: {
              atk_scale: 'extra_atk_scale',
              damage_cd: 'damage_cd',
              heal_scale: 'heal_scale',
              burning_damage_scale: 'talent2_burning_damage_scale',
            },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'talent_2', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff9: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'damage_interval' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_wulfa_blood',
    iconPath: '/icons/icon_battle_buff_wulfa_blood.webp',
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
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_cd: 1.5,
    damage_interval: 1,
    damage_up: 0.12,
    duration: 1,
    extra_atk_scale: 1.5,
    heal_scale: 0.2,
    poise: 0,
    posie: 0,
    talent_2: 0,
    talent2_burning_damage_scale: 1.5,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'damage_up' },
        },
      ],
    },
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['heat'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'damage_up' },
        },
      ],
    },
  ],
  lifecycleSequences: { trigger: { $sequence: 'dealDamage_2' } },
  abilityEventResponses: [
    { event: 'takeCriticalDamage', priority: 0, sequence: { $sequence: 'conditional_6' } },
  ],
  actionGraph: rossiBuff9ActionGraph,
};

const rossiBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0028_wulfa_talent2_heal_effect',
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
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      heal_9: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'caster',
            tags: [],
            attribute: 'intellect',
            multiplier: { kind: 'valueNode', nodeId: 'data_4' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_8',
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: [],
            features: ['talentDamage'],
          },
        },
        next: 'heal_9',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'dealDamage_10',
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'calculateActionValue_6',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_7' },
          whenFalse: { $sequence: 'dealDamage_10' },
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
          buffIds: ['buff_chr_0028_wulfa_talent2_heal_effect'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_1' },
            { kind: 'conditionNode', nodeId: 'data_2' },
          ],
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'burning_damage_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'burning_damage_scale' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Burning'],
          operator: 'greater',
          value: { kind: 'constant', value: 0.5 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    burning_damage_scale: 1.5,
    damage_cd: 1.5,
    damage_interval: 1,
    duration: 1.2,
    heal_scale: 0.05,
    poise: 0,
    posie: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 0, endFrame: 19, sequence: { $sequence: 'conditional_11' } }],
  actionGraph: rossiBuff10ActionGraph,
};

const rossiBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff11: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_cd: 1.5,
    damage_interval: 1,
    duration: 0.9,
    extra_atk_scale: 1.5,
    poise: 0,
    posie: 0,
    talent_2: 0,
  },
  attributeModifiers: [],
  actionGraph: rossiBuff11ActionGraph,
};

const rossiBuff12ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff12: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_cd: 1.5,
    damage_interval: 1,
    damage_up: 0.12,
    defup: -0.5,
    duration: 5,
    extra_atk_scale: 1.5,
    heal_scale: 0.2,
    poise: 0,
    posie: 0,
    talent_2: 0,
    talent2_burning_damage_scale: 1.5,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'defup' },
        },
      ],
    },
  ],
  actionGraph: rossiBuff12ActionGraph,
};

const rossiBuff13ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff13: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_cd: 1.5,
    damage_interval: 1,
    duration: 2,
    extra_atk_scale: 1.5,
    poise: 0,
    posie: 0,
    talent_2: 0,
  },
  attributeModifiers: [],
  actionGraph: rossiBuff13ActionGraph,
};

const rossiBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff14: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3 },
  attributeModifiers: [],
  actionGraph: rossiBuff14ActionGraph,
};

const rossiBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff15: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10, End_Early: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff15ActionGraph,
};

const rossiBuff16ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff16: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.5, interval: 0.3 },
  attributeModifiers: [],
  actionGraph: rossiBuff16ActionGraph,
};

const rossiBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff17: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 1, duration: 1, poise: 0, posie: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff17ActionGraph,
};

const rossiBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff18: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 1, duration: 1, poise: 0, posie: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff18ActionGraph,
};

const rossiBuff19ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff19: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 1, duration: 1, poise: 0, posie: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff19ActionGraph,
};

const rossiBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff20: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 1, duration: 1, poise: 0, posie: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff20ActionGraph,
};

const rossiBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff21: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 1, duration: 1, poise: 0, posie: 0 },
  attributeModifiers: [],
  actionGraph: rossiBuff21ActionGraph,
};

const rossiBuff22ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff22: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 2 },
  attributeModifiers: [],
  actionGraph: rossiBuff22ActionGraph,
};

const rossiBuff23ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff23: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { critical_damage_up_to_bleed: 0.2, duration: 5 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['ultimateSkill'] },
      processors: [
        {
          kind: 'instantAttribute',
          targetSide: 'attacker',
          attribute: 'criticalDamageIncrease',
          values: { slot: 'baseAddition', value: { blackboardKey: 'critical_damage_up_to_bleed' } },
          attributeTiming: 'runtime',
        },
      ],
    },
  ],
  actionGraph: rossiBuff23ActionGraph,
};

const rossiBuff24ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff24: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Status/Immobilized'],
  extendTags: [],
  blackboard: { duration: 1.5, usp_stage_1: 0.35, usp_stage_2: 0.7, usp_stage_3: 1 },
  attributeModifiers: [],
  actionGraph: rossiBuff24ActionGraph,
};

const rossiBuff25ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const rossiBuff25: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1.5, usp_stage_1: 0.35, usp_stage_2: 0.7, usp_stage_3: 1 },
  attributeModifiers: [],
  actionGraph: rossiBuff25ActionGraph,
};

export const rossi: OperatorDefinition = {
  slug: 'rossi',
  gameId: 'ROSSI',
  buffDisplayNameKeys: { buff_chr_0028_wulfa_normal_bleed: 'effects.name.razorClawmark' },
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [9, 28, 48, 68, 88, 97],
    agility: [23, 55, 90, 124, 159, 176],
    intellect: [14, 36, 59, 83, 106, 118],
    will: [9, 26, 44, 62, 80, 89],
    baseAttack: [30, 93, 159, 225, 291, 323],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        rossiChr_0028_wulfa_attack1,
        rossiChr_0028_wulfa_attack2,
        rossiChr_0028_wulfa_attack3,
        rossiChr_0028_wulfa_attack4,
        rossiChr_0028_wulfa_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: rossiChr_0028_wulfa_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: rossiChr_0028_wulfa_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: rossiChr_0028_wulfa_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: rossiChr_0028_wulfa_combo_2_skill,
      placementSequenceSkillKeys: ['chr_0028_wulfa_combo_2_skill', 'chr_0028_wulfa_combo_3_skill'],
      replacementSkills: [rossiChr_0028_wulfa_combo_3_skill],
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: rossiChr_0028_wulfa_ultimate_skill,
    },
  ],
  dodgeSkill: rossiCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0028_wulfa_normal_skill', replacementSkillKeys: [] },
    {
      key: 'comboSkill',
      baseSkillKey: 'chr_0028_wulfa_combo_2_skill',
      replacementSkillKeys: ['chr_0028_wulfa_combo_3_skill'],
    },
    { key: 'ultimate', baseSkillKey: 'chr_0028_wulfa_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0028_wulfa_attack1',
        'chr_0028_wulfa_attack2',
        'chr_0028_wulfa_attack3',
        'chr_0028_wulfa_attack4',
        'chr_0028_wulfa_attack5',
        'chr_0028_wulfa_power_attack',
        'chr_0028_wulfa_plunging_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0028_wulfa_attack1',
        'chr_0028_wulfa_attack2',
        'chr_0028_wulfa_attack3',
        'chr_0028_wulfa_attack4',
        'chr_0028_wulfa_attack5',
      ],
      defaultSkillKey: 'chr_0028_wulfa_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [rossiComboCondition1, rossiComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_1_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 1,
          maximumUpgradeLevel: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_1_2',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale_bleed',
          operation: 'assign',
          value: [0.25, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'duration_bleed',
          operation: 'assign',
          value: [15, 25],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'damage_up',
          operation: 'assign',
          value: [0.06, 0.12],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_2_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 1,
          maximumUpgradeLevel: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_2_2',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'bleed_critical_damage_scale',
          operation: 'assign',
          value: [0.12, 0.24],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'bleed_critical_damage_interval',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.04, 0.08],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent2_burning_damage_scale',
          operation: 'assign',
          value: [1.5, 1.5],
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
          blackboardKey: 'potential_upgrade',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0028_wulfa_combo_2_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'atk_scale_s',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'atk_scale_f',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'damage_add',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'criticalRate', operation: 'flat', value: 0.07 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'bleed_critical_damage_scale',
          operation: 'add',
          value: 0.08,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'bleed_critical_damage_interval',
          operation: 'add',
          value: -0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'add',
          value: 0.04,
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
          blackboardKey: 'potential_5_damage_scale',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_5_critical_damage',
          operation: 'assign',
          value: 0.3,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_Combo_qte_proto_use: 1,
    EntityBB_Combo_QTE_Trigger: 0,
    EntityBB_ComboUseCount: 0,
    EntityBB_NormalSkill_wolf_gain_usp: 0,
  },
  buffDefinitions: {
    buff_chr_0028_wulfa_combo_2_damage: rossiBuff1,
    buff_chr_0028_wulfa_combo_2_damagewait: rossiBuff2,
    buff_chr_0028_wulfa_combo_2_qte_timerlistening: rossiBuff3,
    buff_chr_0028_wulfa_combo_criticalrate: rossiBuff4,
    buff_chr_0028_wulfa_combo_hasinflict: rossiBuff5,
    buff_chr_0028_wulfa_combo_inflictnum: rossiBuff6,
    buff_chr_0028_wulfa_combo_usecount: rossiBuff7,
    buff_chr_0028_wulfa_combo_usetimer: rossiBuff8,
    buff_chr_0028_wulfa_normal_bleed: rossiBuff9,
    buff_chr_0028_wulfa_normal_bleed_crit_extra_damage: rossiBuff10,
    buff_chr_0028_wulfa_normal_bleed_effect: rossiBuff11,
    buff_chr_0028_wulfa_normal_defup: rossiBuff12,
    buff_chr_0028_wulfa_normal_smarttarget: rossiBuff13,
    buff_chr_0028_wulfa_normal_wolf_timer: rossiBuff14,
    buff_chr_0028_wulfa_powerattack_resumecombo: rossiBuff15,
    buff_chr_0028_wulfa_talent2_heal_effect: rossiBuff16,
    buff_chr_0028_wulfa_tut_comboskill_failure: rossiBuff17,
    buff_chr_0028_wulfa_tut_comboskill_finish: rossiBuff18,
    buff_chr_0028_wulfa_tut_comboskill_success: rossiBuff19,
    buff_chr_0028_wulfa_tut_normalskill_failure: rossiBuff20,
    buff_chr_0028_wulfa_tut_normalskill_success: rossiBuff21,
    buff_chr_0028_wulfa_ult_addtional_battleshape: rossiBuff22,
    buff_chr_0028_wulfa_ult_crit_damage_up_to_bleed: rossiBuff23,
    buff_chr_0028_wulfa_ult_stopenemy: rossiBuff24,
    buff_chr_0028_wulfa_ult_stopenemy_elite: rossiBuff25,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0028_wulfa_combo_qte_timing: {
      bornTags: ['Status/UnLockable', 'Status/NonAITarget'],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkills: {
        chr_0028_wulfa_absorb_entity_effect_1: {
          actionGraph: { main: { nodes: {} }, macros: {} },
          skillId: 'chr_0028_wulfa_absorb_entity_effect_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 22,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0, duration: 0 },
          scheduledSequences: [],
        },
        chr_0028_wulfa_absorb_entity_effect_2: {
          actionGraph: {
            main: {
              nodes: {
                startTimeDilation_1: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'global',
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      slot: 'unassigned',
                      priority: 50,
                      curve: {
                        kind: 'inline',
                        keys: [
                          {
                            time: -0.01169591,
                            value: 1.01995,
                            inTangent: 0,
                            outTangent: 0,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 0.251462,
                            value: 0.4,
                            inTangent: 0,
                            outTangent: 0,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 0.4853801,
                            value: 0.4,
                            inTangent: 0,
                            outTangent: 0,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                          {
                            time: 1,
                            value: 1,
                            inTangent: 0,
                            outTangent: 0,
                            weightedMode: 0,
                            inWeight: 0,
                            outWeight: 0,
                          },
                        ],
                      },
                      finishByAction: true,
                      ignoredTargets: [],
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0028_wulfa_absorb_entity_effect_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 22,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0, duration: 0 },
          scheduledSequences: [
            { startFrame: 1, endFrame: 16, sequence: { $sequence: 'startTimeDilation_1' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default rossi;
