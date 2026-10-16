/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const rossiChr_0028_wulfa_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      reachSkillOperableBoundary_7: {
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
  key: 'chr_0028_wulfa_attack1',
  element: 'physical',
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
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 9, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0028_wulfa_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack1ActionGraph,
};

export const rossiChr_0028_wulfa_attack2ActionGraph = {
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
            curve: { kind: 'named', key: 'char_normal_attack' },
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
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_6',
      },
      startTimeDilation_9: {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_10',
      },
      reachSkillOperableBoundary_12: {
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack2: SkillDefinition = {
  key: 'chr_0028_wulfa_attack2',
  element: 'physical',
  blackboard: {
    atk_scale: [0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.54, 0.57, 0.61, 0.65, 0.71],
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
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'calculateActionValue_7' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 12, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0028_wulfa_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack2ActionGraph,
};

export const rossiChr_0028_wulfa_attack3ActionGraph = {
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
            curve: { kind: 'named', key: 'char_normal_attack' },
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
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_5',
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_6',
      },
      startTimeDilation_9: {
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
      changeResource_10: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'changeResource_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_12: {
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
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
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
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack3: SkillDefinition = {
  key: 'chr_0028_wulfa_attack3',
  element: 'physical',
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
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'calculateActionValue_7' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 15, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0028_wulfa_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack3ActionGraph,
};

export const rossiChr_0028_wulfa_attack4ActionGraph = {
  main: {
    nodes: {
      jumpTimeline_2: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 189 },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
        },
        next: null,
      },
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'jumpTimeline_2' },
        },
        next: null,
      },
      changeResource_24: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 0.25 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_24' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_26: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_25',
      },
      calculateActionValue_27: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 0.2 },
          },
        },
        next: 'dealDamage_26',
      },
      calculateActionValue_48: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_26',
      },
      markCurrentSkillCanInterrupt_65: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_66: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      reachSkillOperableBoundary_67: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack4: SkillDefinition = {
  key: 'chr_0028_wulfa_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
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
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_3' } },
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'calculateActionValue_27' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 23, endFrame: 25, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 195, endFrame: 197, sequence: { $sequence: 'calculateActionValue_48' } },
    { startFrame: 198, endFrame: 199, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 203, endFrame: 205, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 205, endFrame: 207, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 213, endFrame: 215, sequence: { $sequence: 'dealDamage_26' } },
    { startFrame: 50, endFrame: 188, sequence: { $sequence: 'markCurrentSkillCanInterrupt_65' } },
    { startFrame: 188, endFrame: 189, sequence: { $sequence: 'interruptCurrentSkill_66' } },
    { startFrame: 36, endFrame: 67, sequence: { $sequence: 'reachSkillOperableBoundary_67' } },
    { startFrame: 225, endFrame: 250, sequence: { $sequence: 'reachSkillOperableBoundary_67' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0028_wulfa_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack4ActionGraph,
};

export const rossiChr_0028_wulfa_attack5ActionGraph = {
  main: {
    nodes: {
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_2',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      modifyActionValue_6: {
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
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'modifyActionValue_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'ifElse_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_9',
      },
      startTimeDilation_12: {
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
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'startTimeDilation_12' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0028_wulfa_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_3' } },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'isHitbyMain', fallback: 0 },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_attack5: SkillDefinition = {
  key: 'chr_0028_wulfa_attack5',
  element: 'physical',
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
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'ifElse_5' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 16, endFrame: 18, sequence: { $sequence: 'ifElse_13' } },
    { startFrame: 45, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0028_wulfa_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_attack5ActionGraph,
};

export const rossiChr_0028_wulfa_power_attackActionGraph = {
  main: {
    nodes: {
      changeResource_7: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 0 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      startTimeDilation_8: {
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
        next: 'changeResource_7',
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
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
        next: 'ifElse_9',
      },
      dealDamage_22: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_23: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'dealDamage_22',
      },
      startTimeDilation_24: {
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
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_24' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_powerattack_resumecombo' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'applyBuff_26',
      },
      applyBuff_28: {
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
      applyBuff_29: {
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
      checkCondition_opt1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'dealDamage_10',
      },
      findTargets_opt2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'checkCondition_opt1',
      },
      repeatEachTick_opt3: {
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
          body: { $sequence: 'findTargets_opt2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
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
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 66,
  naturalDurationFrames: 216,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'repeatEachTick_opt3' } },
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'repeatEachTick_opt3' } },
    { startFrame: 36, endFrame: 39, sequence: { $sequence: 'gainFinisherSp_23' } },
    { startFrame: 38, endFrame: 41, sequence: { $sequence: 'ifElse_25' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'checkCondition_27' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_28' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_29' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: rossiChr_0028_wulfa_power_attackActionGraph,
};

export const rossiChr_0028_wulfa_plunging_attack_endActionGraph = {
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

export const rossiChr_0028_wulfa_plunging_attack_end: SkillDefinition = {
  key: 'chr_0028_wulfa_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 161,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: rossiChr_0028_wulfa_plunging_attack_endActionGraph,
};

export const rossiChr_0028_wulfa_normal_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_21: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      mergeContextTargets_22: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar2', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      mergeContextTargets_23: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar3', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      modifyActionValue_27: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'trigger', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      ifElse_28: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'modifyActionValue_27' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_29: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_28',
      },
      findTargets_30: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'dealDamage_29',
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
          body: { $sequence: 'findTargets_30' },
        },
        next: null,
      },
      calculateActionValue_32: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 0.3 },
          },
        },
        next: 'repeatEachTick_31',
      },
      startTimeDilation_49: {
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
      ifElse_56: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'startTimeDilation_49' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_57: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'modifyActionValue_27' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_56',
      },
      dealDamage_58: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'ifElse_57',
      },
      applyPhysicalInfliction_59: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 1.2 },
            height: { kind: 'constant', value: 1.5 },
            speedFactorMultiplier: 1,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_58',
      },
      modifyActionValue_55: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'FollowAttackTrigger',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyPhysicalInfliction_59',
      },
      ifElse_60: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'modifyActionValue_55' },
          whenFalse: { $sequence: 'applyPhysicalInfliction_59' },
        },
        next: null,
      },
      repeatEachTick_61: {
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
          body: { $sequence: 'ifElse_60' },
        },
        next: null,
      },
      modifyActionValue_62: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'trigger',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_61',
      },
      calculateActionValue_63: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 0.4 },
          },
        },
        next: 'modifyActionValue_62',
      },
      applyBuff_64: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_wolf_timer' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      launchProjectile_65: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration_bleed: 0,
                  heal_scale: 0.005,
                  poise_2: 0,
                  potential_upgrade: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_59' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_67' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_55: {
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
                      applyBuff_39: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      applyBuff_37: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      ifElse_43: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'applyBuff_39' },
                        },
                        next: null,
                      },
                      ifElse_45: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'ifElse_43' },
                        },
                        next: null,
                      },
                      ifElse_49: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_8' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      ifElse_51: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_10' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'ifElse_49' },
                        },
                        next: null,
                      },
                      ifElse_54: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_11' },
                          whenTrue: { $sequence: 'ifElse_51' },
                          whenFalse: { $sequence: 'ifElse_51' },
                        },
                        next: null,
                      },
                      checkCondition_52: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                        },
                        next: null,
                      },
                      checkCondition_53: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                        },
                        next: 'checkCondition_52',
                      },
                      ifElse_56: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_14' },
                          whenTrue: { $sequence: 'ifElse_54' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      calculateActionValue_57: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'ifElse_56',
                      },
                      calculateActionValue_58: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_15' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_57',
                      },
                      repeatEachTick_59: {
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
                          body: { $sequence: 'calculateActionValue_58' },
                        },
                        next: null,
                      },
                      finishBuffsById_63: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResource_62: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_16' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_63',
                      },
                      ifElse_64: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_18' },
                          whenTrue: { $sequence: 'changeResource_62' },
                          whenFalse: { $sequence: 'finishBuffsById_63' },
                        },
                        next: null,
                      },
                      changeResource_65: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_19' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                          },
                        },
                        next: 'ifElse_64',
                      },
                      checkCondition_66: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
                        },
                        next: 'changeResource_65',
                      },
                      checkCondition_67: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
                        },
                        next: 'checkCondition_66',
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
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_53' },
                        },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
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
                      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: {
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
                },
              },
            },
          ],
        },
        next: 'applyBuff_64',
      },
      launchProjectile_66: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration_bleed: 0,
                  heal_scale: 0.005,
                  poise_2: 0,
                  potential_upgrade: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_59' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_67' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_55: {
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
                      applyBuff_39: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      applyBuff_37: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      ifElse_43: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'applyBuff_39' },
                        },
                        next: null,
                      },
                      ifElse_45: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'ifElse_43' },
                        },
                        next: null,
                      },
                      ifElse_49: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_8' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      ifElse_51: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_10' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'ifElse_49' },
                        },
                        next: null,
                      },
                      ifElse_54: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_11' },
                          whenTrue: { $sequence: 'ifElse_51' },
                          whenFalse: { $sequence: 'ifElse_51' },
                        },
                        next: null,
                      },
                      checkCondition_52: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                        },
                        next: null,
                      },
                      checkCondition_53: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                        },
                        next: 'checkCondition_52',
                      },
                      ifElse_56: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_14' },
                          whenTrue: { $sequence: 'ifElse_54' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      calculateActionValue_57: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'ifElse_56',
                      },
                      calculateActionValue_58: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_15' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_57',
                      },
                      repeatEachTick_59: {
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
                          body: { $sequence: 'calculateActionValue_58' },
                        },
                        next: null,
                      },
                      finishBuffsById_63: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResource_62: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_16' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_63',
                      },
                      ifElse_64: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_18' },
                          whenTrue: { $sequence: 'changeResource_62' },
                          whenFalse: { $sequence: 'finishBuffsById_63' },
                        },
                        next: null,
                      },
                      changeResource_65: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_19' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                          },
                        },
                        next: 'ifElse_64',
                      },
                      checkCondition_66: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
                        },
                        next: 'changeResource_65',
                      },
                      checkCondition_67: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
                        },
                        next: 'checkCondition_66',
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
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_53' },
                        },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
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
                      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: {
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
                },
              },
            },
          ],
        },
        next: 'launchProjectile_65',
      },
      launchProjectile_67: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration_bleed: 0,
                  heal_scale: 0.005,
                  poise_2: 0,
                  potential_upgrade: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_60' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_71' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_55: {
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
                      applyBuff_39: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      applyBuff_37: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      ifElse_43: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'applyBuff_39' },
                        },
                        next: null,
                      },
                      ifElse_45: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'ifElse_43' },
                        },
                        next: null,
                      },
                      ifElse_49: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_8' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      ifElse_51: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_10' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'ifElse_49' },
                        },
                        next: null,
                      },
                      ifElse_54: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_11' },
                          whenTrue: { $sequence: 'ifElse_51' },
                          whenFalse: { $sequence: 'ifElse_51' },
                        },
                        next: null,
                      },
                      checkCondition_52: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                        },
                        next: null,
                      },
                      checkCondition_53: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                        },
                        next: 'checkCondition_52',
                      },
                      ifElse_56: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_14' },
                          whenTrue: { $sequence: 'ifElse_54' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      applyBuff_57: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_chr_0028_wulfa_tut_normalskill_success' }],
                            targets: { kind: 'source' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                            finishByAction: true,
                          },
                        },
                        next: 'ifElse_56',
                      },
                      calculateActionValue_58: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'applyBuff_57',
                      },
                      calculateActionValue_59: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_15' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_58',
                      },
                      repeatEachTick_60: {
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
                          body: { $sequence: 'calculateActionValue_59' },
                        },
                        next: null,
                      },
                      finishBuffsById_67: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResource_66: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_16' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_67',
                      },
                      ifElse_68: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_18' },
                          whenTrue: { $sequence: 'changeResource_66' },
                          whenFalse: { $sequence: 'finishBuffsById_67' },
                        },
                        next: null,
                      },
                      changeResource_69: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_19' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                          },
                        },
                        next: 'ifElse_68',
                      },
                      checkCondition_70: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
                        },
                        next: 'changeResource_69',
                      },
                      checkCondition_71: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
                        },
                        next: 'checkCondition_70',
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
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_53' },
                        },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
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
                      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: {
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
                },
              },
            },
          ],
        },
        next: 'launchProjectile_66',
      },
      launchProjectile_68: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                  bleed_critical_damage_scale: 1,
                  damage_up: 0,
                  duration_bleed: 0,
                  heal_scale: 0.005,
                  poise_2: 0,
                  potential_upgrade: 0,
                  talent_1_1: 0,
                  talent_1_2: 0,
                  talent_2_1: 0,
                  talent_2_2: 0,
                  talent2_burning_damage_scale: 1.5,
                  usp_2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'repeatEachTick_59' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_67' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_55: {
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
                      applyBuff_39: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 0 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      applyBuff_37: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_chr_0028_wulfa_normal_bleed',
                                blackboardAssignments: { talent_2: { kind: 'constant', value: 1 } },
                                copiedBlackboardAssignments: {
                                  duration: 'duration_bleed',
                                  atk_scale: 'atk_scale_bleed',
                                  extra_atk_scale: 'bleed_critical_damage_scale',
                                  damage_up: 'damage_up',
                                  heal_scale: 'heal_scale',
                                  talent2_burning_damage_scale: 'talent2_burning_damage_scale',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                          },
                        },
                        next: 'dealDamage_55',
                      },
                      ifElse_43: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'applyBuff_39' },
                        },
                        next: null,
                      },
                      ifElse_45: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'applyBuff_37' },
                          whenFalse: { $sequence: 'ifElse_43' },
                        },
                        next: null,
                      },
                      ifElse_49: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_8' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      ifElse_51: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_10' },
                          whenTrue: { $sequence: 'ifElse_45' },
                          whenFalse: { $sequence: 'ifElse_49' },
                        },
                        next: null,
                      },
                      ifElse_54: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_11' },
                          whenTrue: { $sequence: 'ifElse_51' },
                          whenFalse: { $sequence: 'ifElse_51' },
                        },
                        next: null,
                      },
                      checkCondition_52: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
                        },
                        next: null,
                      },
                      checkCondition_53: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
                        },
                        next: 'checkCondition_52',
                      },
                      ifElse_56: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_14' },
                          whenTrue: { $sequence: 'ifElse_54' },
                          whenFalse: { $sequence: 'dealDamage_55' },
                        },
                        next: null,
                      },
                      calculateActionValue_57: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'poise_2',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_2' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'ifElse_56',
                      },
                      calculateActionValue_58: {
                        action: {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'atk_scale_once',
                            operation: 'multiply',
                            left: { kind: 'valueNode', nodeId: 'data_15' },
                            right: { kind: 'constant', value: 0.25 },
                          },
                        },
                        next: 'calculateActionValue_57',
                      },
                      repeatEachTick_59: {
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
                          body: { $sequence: 'calculateActionValue_58' },
                        },
                        next: null,
                      },
                      finishBuffsById_63: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      changeResource_62: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_16' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'finishBuffsById_63',
                      },
                      ifElse_64: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_18' },
                          whenTrue: { $sequence: 'changeResource_62' },
                          whenFalse: { $sequence: 'finishBuffsById_63' },
                        },
                        next: null,
                      },
                      changeResource_65: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_19' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                          },
                        },
                        next: 'ifElse_64',
                      },
                      checkCondition_66: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
                        },
                        next: 'changeResource_65',
                      },
                      checkCondition_67: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
                        },
                        next: 'checkCondition_66',
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
                        type: 'boolean',
                        expression: { kind: 'checkActionResult', action: { $sequence: null } },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
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
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_53' },
                        },
                      },
                      data_15: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
                      },
                      data_16: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atb_return' },
                      },
                      data_17: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_upgrade', fallback: 0 },
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
                      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
                      data_20: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
                          operator: 'equal',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_21: {
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
                },
              },
            },
          ],
        },
        next: 'launchProjectile_67',
      },
      applyBuff_69: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_smarttarget' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_68',
      },
      gainSquadUltimateEnergyFromSkillCost_70: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      checkCondition_71: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_70',
      },
      finishBuffsById_72: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_normal_wolf_timer'],
            reason: 'early',
          },
        },
        next: null,
      },
      jumpTimeline_78: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 215 },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_79: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_80: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      applyBuff_82: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_tut_normalskill_failure' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_83: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'applyBuff_82' },
        },
        next: null,
      },
      applyBuff_84: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_defup' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'FollowAttackTrigger', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise_1' } },
      data_8: {
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
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 0.9 },
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
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
  element: 'physical',
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
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'mergeContextTargets_21' } },
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'mergeContextTargets_22' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'mergeContextTargets_23' } },
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'calculateActionValue_63' } },
    { startFrame: 230, endFrame: 233, sequence: { $sequence: 'applyBuff_69' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'checkCondition_71' } },
    { startFrame: 215, endFrame: 218, sequence: { $sequence: 'finishBuffsById_72' } },
    { startFrame: 37, endFrame: 40, sequence: { $sequence: 'jumpTimeline_78' } },
    { startFrame: 49, endFrame: 214, sequence: { $sequence: 'markCurrentSkillCanInterrupt_79' } },
    { startFrame: 214, endFrame: 215, sequence: { $sequence: 'interruptCurrentSkill_80' } },
    { startFrame: 37, endFrame: 72, sequence: { $sequence: 'ifElse_83' } },
    { startFrame: 215, endFrame: 272, sequence: { $sequence: 'applyBuff_84' } },
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
      startTimeDilation_14: {
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
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_12',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      calculateActionValue_16: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'can_trigger_combo',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_15',
      },
      calculateActionValue_17: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'count',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_16',
      },
      dealDamage_18: {
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
        next: 'calculateActionValue_17',
      },
      calculateActionValue_19: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_18',
      },
      calculateActionValue_20: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'constant', value: 0.35 },
          },
        },
        next: 'calculateActionValue_19',
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
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'calculateActionValue_20' },
        },
        next: null,
      },
      findTargets_22: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'repeatEachTick_21',
      },
      calculateActionValue_29: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'count',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'constant', value: 1 },
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
                buffId: 'buff_chr_0028_wulfa_combo_2_damagewait',
                blackboardAssignments: {
                  trigger_times: { kind: 'constant', value: 3 },
                  damage_interval: { kind: 'constant', value: 0.125 },
                  duration: { kind: 'constant', value: 0.3 },
                },
                copiedBlackboardAssignments: { atk_scale: 'atk_scale_once' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'calculateActionValue_29',
      },
      calculateActionValue_31: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'constant', value: 0.1 },
          },
        },
        next: 'applyBuff_30',
      },
      dealDamage_32: {
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
        next: 'calculateActionValue_31',
      },
      calculateActionValue_33: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'dealDamage_32',
      },
      calculateActionValue_34: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'constant', value: 0.35 },
          },
        },
        next: 'calculateActionValue_33',
      },
      repeatEachTick_35: {
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
          body: { $sequence: 'calculateActionValue_34' },
        },
        next: null,
      },
      findTargets_36: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'repeatEachTick_35',
      },
      changeResource_38: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_11' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'changeResource_38' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      finishBuffsById_40: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_2_qte_timerlistening'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_42: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'finishBuffsById_40',
      },
      applyBuff_45: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
                copiedBlackboardAssignments: { time_succeed: 'time_succeed' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: null,
      },
      checkCondition_44: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
        },
        next: 'checkCondition_43',
      },
      ifElse_46: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'applyBuff_45' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeSkillSlot_47: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'comboSkill',
            targetSkillKey: 'chr_0028_wulfa_combo_3_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
            revertedSkillKey: 'chr_0028_wulfa_combo_2_skill',
          },
        },
        next: null,
      },
      checkCondition_48: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
        },
        next: 'changeSkillSlot_47',
      },
      finishBuffsById_49: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_usetimer'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: 'finishBuffsById_49',
      },
      applyBuff_51: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_combo_usecount' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_50',
      },
      finishBuffsById_62: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_56: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_combo_usetimer' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      adjustSkillCooldown_57: {
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
        next: 'applyBuff_56',
      },
      openComboWindow_58: {
        action: { kind: 'openComboWindow', parameters: { nextSkillKeyFromSlot: 'comboSkill' } },
        next: 'adjustSkillCooldown_57',
      },
      mergeContextTargets_59: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'new_target',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'openComboWindow_58',
      },
      ifElse_61: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'openComboWindow_58' },
          whenFalse: { $sequence: 'mergeContextTargets_59' },
        },
        next: null,
      },
      ifElse_63: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_22' },
          whenTrue: { $sequence: 'ifElse_61' },
          whenFalse: { $sequence: 'finishBuffsById_62' },
        },
        next: null,
      },
      startTimeDilation_64: {
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
      applyBuff_65: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_defup' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_13' } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'can_trigger_combo' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise_once' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use', fallback: 0 },
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
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'can_trigger_combo', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_44' } },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'ratio',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
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
  element: 'physical',
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
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'findTargets_22' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'findTargets_36' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'ifElse_39' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'checkCondition_42' } },
    { startFrame: 37, endFrame: 38, sequence: { $sequence: 'ifElse_46' } },
    { startFrame: 37, endFrame: 58, sequence: { $sequence: 'checkCondition_48' } },
    { startFrame: 0, endFrame: 37, sequence: { $sequence: 'applyBuff_51' } },
    { startFrame: 37, endFrame: 41, sequence: { $sequence: 'ifElse_63' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_64' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_65' } },
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
      startTimeDilation_6: {
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
      repeatEachTick_8: {
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
          body: { $sequence: 'ifElse_7' },
        },
        next: null,
      },
      findTargets_9: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'repeatEachTick_8',
      },
      modifyActionValue_16: {
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
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_combo_hasinflict' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_combo_inflictnum' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_12',
      },
      finishBuffsByTag_14: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'owner' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_13',
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
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'finishBuffsByTag_14',
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'readBuffStackCount_15' },
          whenFalse: { $sequence: 'modifyActionValue_16' },
        },
        next: null,
      },
      finishBuffsByTag_22: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'owner' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_13',
      },
      readBuffStackCount_23: {
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
        next: 'finishBuffsByTag_22',
      },
      ifElse_31: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'readBuffStackCount_23' },
          whenFalse: { $sequence: 'ifElse_24' },
        },
        next: null,
      },
      finishBuffsByTag_29: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'owner' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_13',
      },
      readBuffStackCount_30: {
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
        next: 'finishBuffsByTag_29',
      },
      ifElse_38: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'readBuffStackCount_30' },
          whenFalse: { $sequence: 'ifElse_31' },
        },
        next: null,
      },
      finishBuffsByTag_36: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'owner' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'early',
          },
        },
        next: 'applyBuff_13',
      },
      readBuffStackCount_37: {
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
        next: 'finishBuffsByTag_36',
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'readBuffStackCount_37' },
          whenFalse: { $sequence: 'ifElse_38' },
        },
        next: null,
      },
      repeatEachTick_40: {
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
          body: { $sequence: 'ifElse_39' },
        },
        next: null,
      },
      finishBuffsById_44: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_hasinflict'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyPhysicalInfliction_45: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 1 },
            height: { kind: 'constant', value: 20 },
            speedFactorMultiplier: 10,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'finishBuffsById_44',
      },
      checkCondition_46: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'applyPhysicalInfliction_45',
      },
      forEachContextTarget_48: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_46' },
        },
        next: null,
      },
      ifElse_50: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'forEachContextTarget_48' },
          whenFalse: { $sequence: 'forEachContextTarget_48' },
        },
        next: null,
      },
      ifElse_51: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'ifElse_50' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      calculateActionValue_61: {
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
      dealDamage_62: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_12' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'calculateActionValue_61',
      },
      finishBuffsById_63: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'],
            reason: 'other',
          },
        },
        next: 'dealDamage_62',
      },
      calculateActionValue_64: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_14' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_63',
      },
      calculateActionValue_65: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_64',
      },
      calculateActionValue_66: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'calculateActionValue_65',
      },
      calculateActionValue_67: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'calculateActionValue_66',
      },
      calculateActionValue_68: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_17' },
            right: { kind: 'valueNode', nodeId: 'data_18' },
          },
        },
        next: 'calculateActionValue_67',
      },
      readBuffStackCount_69: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'spellinflict_stack_max',
            query: { kind: 'id', buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'] },
          },
        },
        next: 'calculateActionValue_68',
      },
      repeatEachTick_70: {
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
          body: { $sequence: 'readBuffStackCount_69' },
        },
        next: null,
      },
      findTargets_71: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'repeatEachTick_70',
      },
      finishBuffsById_72: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_usetimer', 'buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_73: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
        },
        next: 'finishBuffsById_72',
      },
      changeSkillSlot_74: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'comboSkill',
            targetSkillKey: 'chr_0028_wulfa_combo_2_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'checkCondition_73',
      },
      adjustSkillCooldown_75: {
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
        next: 'changeSkillSlot_74',
      },
      applyBuff_76: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_combo_usecount' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'adjustSkillCooldown_75',
      },
      changeResource_77: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_20' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      checkCondition_78: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
        },
        next: 'changeResource_77',
      },
      modifyActionValue_87: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'buff_stack',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'modifyActionValue_16',
      },
      ifElse_95: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_23' },
          whenTrue: { $sequence: 'readBuffStackCount_15' },
          whenFalse: { $sequence: 'modifyActionValue_87' },
        },
        next: null,
      },
      ifElse_102: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_24' },
          whenTrue: { $sequence: 'readBuffStackCount_23' },
          whenFalse: { $sequence: 'ifElse_95' },
        },
        next: null,
      },
      ifElse_109: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_25' },
          whenTrue: { $sequence: 'readBuffStackCount_30' },
          whenFalse: { $sequence: 'ifElse_102' },
        },
        next: null,
      },
      ifElse_110: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_26' },
          whenTrue: { $sequence: 'readBuffStackCount_37' },
          whenFalse: { $sequence: 'ifElse_109' },
        },
        next: null,
      },
      repeatEachTick_111: {
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
          body: { $sequence: 'ifElse_110' },
        },
        next: null,
      },
      applyBuff_117: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_no_guard' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_44',
      },
      applyPhysicalInfliction_118: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 1 },
            height: { kind: 'constant', value: 20 },
            speedFactorMultiplier: 10,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'applyBuff_117',
      },
      checkCondition_119: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' } },
        },
        next: 'applyPhysicalInfliction_118',
      },
      forEachContextTarget_121: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_119' },
        },
        next: null,
      },
      ifElse_123: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_28' },
          whenTrue: { $sequence: 'forEachContextTarget_121' },
          whenFalse: { $sequence: 'forEachContextTarget_121' },
        },
        next: null,
      },
      ifElse_124: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_29' },
          whenTrue: { $sequence: 'ifElse_123' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      calculateActionValue_145: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'poise_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_30' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_63',
      },
      calculateActionValue_146: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'calculateActionValue_145',
      },
      calculateActionValue_147: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'calculateActionValue_146',
      },
      calculateActionValue_148: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'calculateActionValue_147',
      },
      calculateActionValue_149: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_once',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_17' },
            right: { kind: 'valueNode', nodeId: 'data_18' },
          },
        },
        next: 'calculateActionValue_148',
      },
      readBuffStackCount_150: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'spellinflict_stack_max',
            query: { kind: 'id', buffIds: ['buff_chr_0028_wulfa_combo_inflictnum'] },
          },
        },
        next: 'calculateActionValue_149',
      },
      repeatEachTick_151: {
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
          body: { $sequence: 'readBuffStackCount_150' },
        },
        next: null,
      },
      findTargets_152: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'repeatEachTick_151',
      },
      jumpTimeline_162: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 212 },
          condition: { kind: 'conditionNode', nodeId: 'data_31' },
        },
        next: null,
      },
      modifyActionValue_163: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'timing_success',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'jumpTimeline_162',
      },
      finishOwner_164: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'owner' },
              objectType: 'all',
              sameSourceSkillCast: false,
            },
          },
        },
        next: 'modifyActionValue_163',
      },
      finishBuffsById_165: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'owner' },
            buffIds: [
              'buff_chr_0028_wulfa_combo_2_qte_timer',
              'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
            ],
            reason: 'early',
          },
        },
        next: 'finishOwner_164',
      },
      calculateActionValue_154: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_s',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: null,
      },
      ifElse_156: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_33' },
          whenTrue: { $sequence: 'calculateActionValue_154' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      finishOwner_157: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'owner' },
              objectType: 'all',
              sameSourceSkillCast: false,
            },
          },
        },
        next: 'ifElse_156',
      },
      startTimeDilation_158: {
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
        next: 'finishOwner_157',
      },
      finishOwner_159: {
        action: {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              owner: { kind: 'owner' },
              objectType: 'all',
              sameSourceSkillCast: false,
            },
          },
        },
        next: 'startTimeDilation_158',
      },
      modifyActionValue_160: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'timing_success',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishOwner_159',
      },
      finishBuffsById_161: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'owner' },
            buffIds: [
              'buff_chr_0028_wulfa_combo_2_qte_timer',
              'buff_chr_0028_wulfa_combo_2_qte_timerlistening',
            ],
            reason: 'early',
          },
        },
        next: 'modifyActionValue_160',
      },
      ifElse_166: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_35' },
          whenTrue: { $sequence: 'finishBuffsById_161' },
          whenFalse: { $sequence: 'finishBuffsById_165' },
        },
        next: null,
      },
      checkCondition_167: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_36' } },
        },
        next: null,
      },
      checkCondition_168: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_37' } },
        },
        next: 'checkCondition_167',
      },
      ifElse_170: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_38' },
          whenTrue: { $sequence: 'changeResource_77' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_171: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_combo_criticalrate',
                copiedBlackboardAssignments: {
                  duration: 'crit_increase_duration',
                  critical_rate: 'crit_increase_rate',
                  critical_damage_inc: 'crit_damage_increase_rate',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_173: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_174: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      startTimeDilation_175: {
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
      applyBuff_179: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_tut_comboskill_failure' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_178: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_tut_comboskill_success' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_180: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_39' },
          whenTrue: { $sequence: 'applyBuff_178' },
          whenFalse: { $sequence: 'applyBuff_179' },
        },
        next: null,
      },
      applyBuff_183: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_tut_comboskill_finish' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_184: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_40' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'applyBuff_179' },
        },
        next: 'applyBuff_183',
      },
      applyBuff_189: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_defup' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_once' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'poise_once' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'poise_f' } },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_atk_multiply' },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_s' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spellinflict_stack_max' },
      },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'damage_add' } },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
          operator: 'equal',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'usp_s' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_21' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_23: {
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
      data_24: {
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
      data_25: {
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
      data_26: {
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
      data_27: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_chr_0028_wulfa_combo_hasinflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_28: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_29: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_30: { type: 'number', expression: { kind: 'blackboard', key: 'poise_s' } },
      data_31: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_32: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_33: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_32' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_34: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_Combo_QTE_Trigger', fallback: 0 },
      },
      data_35: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_34' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_36: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_21' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_37: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_38: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_168' } },
      },
      data_39: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_40: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
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
  element: 'physical',
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
    { startFrame: 225, endFrame: 226, sequence: { $sequence: 'findTargets_9' } },
    { startFrame: 227, endFrame: 227, sequence: { $sequence: 'repeatEachTick_40' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'ifElse_51' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'findTargets_71' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_76' } },
    { startFrame: 227, endFrame: 228, sequence: { $sequence: 'checkCondition_78' } },
    { startFrame: 29, endFrame: 29, sequence: { $sequence: 'repeatEachTick_111' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'ifElse_124' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'findTargets_9' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'findTargets_152' } },
    { startFrame: 0, endFrame: 28, sequence: { $sequence: 'ifElse_166' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'ifElse_170' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_171' } },
    { startFrame: 212, endFrame: 215, sequence: { $sequence: 'applyBuff_171' } },
    { startFrame: 60, endFrame: 211, sequence: { $sequence: 'markCurrentSkillCanInterrupt_173' } },
    { startFrame: 211, endFrame: 212, sequence: { $sequence: 'interruptCurrentSkill_174' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_175' } },
    { startFrame: 212, endFrame: 222, sequence: { $sequence: 'startTimeDilation_175' } },
    { startFrame: 29, endFrame: 58, sequence: { $sequence: 'ifElse_180' } },
    { startFrame: 29, endFrame: 59, sequence: { $sequence: 'ifElse_184' } },
    { startFrame: 227, endFrame: 257, sequence: { $sequence: 'ifElse_184' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_189' } },
    { startFrame: 212, endFrame: 259, sequence: { $sequence: 'applyBuff_189' } },
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
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_ult_stopenemy_elite',
                blackboardAssignments: { duration: { kind: 'constant', value: 3.099969 } },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'applyBuff_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_16' },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'ifElse_17',
      },
      findTargets_19: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'maintar',
          },
        },
        next: 'checkCondition_18',
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_ult_stopenemy',
                blackboardAssignments: { duration: { kind: 'constant', value: 2.866664 } },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyBuff_25' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_28: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_27' },
        },
        next: null,
      },
      checkCondition_29: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'ifElse_28',
      },
      findTargets_30: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'maintar',
          },
        },
        next: 'checkCondition_29',
      },
      applyBuff_34: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_ult_addtional_battleshape' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      modifyActionValue_35: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'hit_num', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      dealDamage_36: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'modifyActionValue_35',
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
            key: 'hit_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_37',
      },
      dealDamage_44: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'modifyActionValue_35',
      },
      applyElementalInfliction_45: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'dealDamage_44',
      },
      startTimeDilation_50: {
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
      ifElse_51: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'startTimeDilation_50' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_52: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      hideUi_53: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_54: {
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
      calculateActionValue_55: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'crit_damage_up_to_bleed',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: null,
      },
      calculateActionValue_56: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'calculateActionValue_55',
      },
      calculateActionValue_57: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'calculateActionValue_56',
      },
      calculateActionValue_58: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'calculateActionValue_57',
      },
      checkCondition_59: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
        },
        next: 'calculateActionValue_58',
      },
      applyBuff_60: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_ult_crit_damage_up_to_bleed',
                copiedBlackboardAssignments: {
                  critical_damage_up_to_bleed: 'crit_damage_up_to_bleed',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      dealDamage_64: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_15' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      ifElse_68: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'dealDamage_64' },
          whenFalse: { $sequence: 'dealDamage_64' },
        },
        next: null,
      },
      mergeContextTargets_69: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'ifElse_68',
      },
      createSpatialPointTargets_70: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos2', count: { kind: 'constant', value: 1 } },
        },
        next: 'mergeContextTargets_69',
      },
      ifElse_71: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: 'createSpatialPointTargets_70' },
          whenFalse: { $sequence: 'createSpatialPointTargets_70' },
        },
        next: null,
      },
      createSpatialPointTargets_72: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos1', count: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_71',
      },
      checkCondition_361: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: null,
      },
      repeatEachTick_362: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.03333,
            },
          },
          body: { $sequence: 'checkCondition_361' },
        },
        next: null,
      },
      findTargets_opt1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'maintar',
          },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'findTargets_opt1' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_22' },
          whenTrue: { $sequence: 'ifElse_opt2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_23' },
          whenTrue: { $sequence: 'applyElementalInfliction_45' },
          whenFalse: { $sequence: 'applyElementalInfliction_45' },
        },
        next: null,
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
      modifyActionValue_opt6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hit_num',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'repeatEachTick_opt5',
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
      data_4: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['mob'] } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Immune/Damage', 'SelectCategory/Unmarkable'],
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
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'hit_num', fallback: 0 } },
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'crit_damage_up_to_bleed' },
      },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_critical_damage' },
      },
      data_14: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_damage_scale' },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_16: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'greater',
          right: { kind: 'constant', value: 0.5 },
        },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_19: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_20: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['elite', 'boss'] } },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: true,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_22: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_23: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const rossiChr_0028_wulfa_ultimate_skill: SkillDefinition = {
  key: 'chr_0028_wulfa_ultimate_skill',
  element: 'heat',
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_opt3' } },
    { startFrame: 57, endFrame: 150, sequence: { $sequence: 'findTargets_19' } },
    { startFrame: 64, endFrame: 150, sequence: { $sequence: 'findTargets_30' } },
    { startFrame: 64, endFrame: 111, sequence: { $sequence: 'applyBuff_34' } },
    { startFrame: 122, endFrame: 125, sequence: { $sequence: 'modifyActionValue_38' } },
    { startFrame: 131, endFrame: 134, sequence: { $sequence: 'modifyActionValue_opt6' } },
    { startFrame: 134, endFrame: 135, sequence: { $sequence: 'ifElse_51' } },
    { startFrame: 0, endFrame: 155, sequence: { $sequence: 'applyBuff_52' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'hideUi_53' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'startUltimateTimeDilation_54' } },
    { startFrame: 58, endFrame: 208, sequence: { $sequence: 'checkCondition_59' } },
    { startFrame: 58, endFrame: 208, sequence: { $sequence: 'applyBuff_60' } },
    { startFrame: 63, endFrame: 64, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 65, endFrame: 66, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 66, endFrame: 67, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 69, endFrame: 70, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 71, endFrame: 72, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 74, endFrame: 75, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 75, endFrame: 76, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 77, endFrame: 78, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 78, endFrame: 79, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 80, endFrame: 81, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 83, endFrame: 84, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 84, endFrame: 85, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 87, endFrame: 88, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 88, endFrame: 89, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 90, endFrame: 91, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 92, endFrame: 93, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 94, endFrame: 95, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 96, endFrame: 97, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 97, endFrame: 98, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 99, endFrame: 100, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 102, endFrame: 103, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 103, endFrame: 104, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 106, endFrame: 107, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 108, endFrame: 109, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 111, endFrame: 112, sequence: { $sequence: 'createSpatialPointTargets_72' } },
    { startFrame: 63, endFrame: 131, sequence: { $sequence: 'repeatEachTick_362' } },
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const rossiComboCondition1ActionGraph = {
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
          compareZeroWhenTargetMissing: true,
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
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: rossiComboCondition1ActionGraph,
};

const rossiComboCondition2ActionGraph = {
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
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_3',
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
          compareZeroWhenTargetMissing: false,
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
  sequence: { $sequence: 'checkCondition_4' },
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
  blackboard: { atk_scale: 0.3, damage_interval: 0.1, duration: 1, trigger_times: 3 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'dealDamage_1' }] },
  actionGraph: rossiBuff1ActionGraph,
};

const rossiBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_combo_2_damage',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  trigger_times: 'trigger_times',
                  damage_interval: 'damage_interval',
                },
              },
            ],
            targets: { kind: 'inputTarget' },
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

const rossiBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 3,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0.3, damage_interval: 0.1, duration: 3, trigger_times: 3 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'applyBuff_1' }] },
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_tut_comboskill_success',
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
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_Combo_QTE_Trigger',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_2',
      },
      showComboRingQte_4: {
        action: {
          kind: 'showComboRingQte',
          parameters: {
            earlyDurationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            activeDurationSeconds: { kind: 'valueNode', nodeId: 'data_2' },
          },
          triggeredAction: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0028_wulfa_combo_qte_timing',
            childSkillId: 'chr_0028_wulfa_absorb_entity_effect_1',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'spawnAbilityEntity_5',
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0028_wulfa_combo_qte_timing',
            childSkillId: 'chr_0028_wulfa_absorb_entity_effect_2',
            inheritActionBlackboard: false,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'spawnAbilityEntity_7',
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'owner' },
            buffIds: ['buff_train_output_succbuff_or_failbuff_by_id'],
            reason: 'early',
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_tut_comboskill_failure',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.2 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: null,
      },
      setCurrentBuffTimePaused_12: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'setCurrentBuffTimePaused_12',
      },
      setCurrentBuffTimePaused_14: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'setCurrentBuffTimePaused_14',
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
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0028_wulfa_combo_1_qte_timer'],
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
    { startFrame: 0, endFrame: 180, sequence: { $sequence: 'showComboRingQte_4' } },
    { startFrame: 3, endFrame: 19, sequence: { $sequence: 'checkCondition_6' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'checkCondition_8' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'applyBuff_10' } },
  ],
  abilityEventResponses: [
    { event: 'buffEndsEarly', priority: 0, sequence: { $sequence: 'checkCondition_11' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_13' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_15' } },
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
    icon: 'endaxis:icons/icon_battle_crit_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { critical_damage_inc: 0.15, critical_rate: 0.1, duration: 10 },
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'adjustSkillCooldown_1',
      },
      changeSkillSlot_3: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'comboSkill',
            targetSkillKey: 'chr_0028_wulfa_combo_2_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          },
        },
        next: 'checkCondition_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
            reason: 'other',
          },
        },
        next: 'changeSkillSlot_3',
      },
      setCurrentBuffTimePaused_5: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'setCurrentBuffTimePaused_5',
      },
      setCurrentBuffTimePaused_7: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'setCurrentBuffTimePaused_7',
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
  blackboard: { duration: 6, need_set_cd: 1 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'finishBuffsById_4' }] },
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
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
            buffs: [{ buffId: 'buff_chr_0028_wulfa_normal_bleed_effect' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
            buffs: [
              {
                buffId: 'buff_chr_0028_wulfa_normal_bleed_crit_extra_damage',
                copiedBlackboardAssignments: {
                  atk_scale: 'extra_atk_scale',
                  heal_scale: 'heal_scale',
                  burning_damage_scale: 'talent2_burning_damage_scale',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
          },
        },
        next: null,
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
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
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
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
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
      },
      data_7: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
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
    icon: 'endaxis:icons/icon_battle_buff_wulfa_blood',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.razorClawmark',
  },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.3,
    damage_interval: 1,
    damage_up: 0.12,
    duration: 1,
    extra_atk_scale: 1.5,
    heal_scale: 0.2,
    talent_2: 0,
    talent2_burning_damage_scale: 1.5,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_7' },
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
      condition: { $sequence: 'checkCondition_8' },
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
  lifecycleSequences: { trigger: [{ $sequence: 'dealDamage_2' }] },
  abilityEventResponses: [
    { event: 'takeCriticalDamage', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
  ],
  actionGraph: rossiBuff9ActionGraph,
};

const rossiBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0028_wulfa_talent2_heal_effect' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_4',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'applyBuff_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      heal_14: {
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
        next: 'ifElse_13',
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: [],
            features: ['talentDamage'],
          },
        },
        next: 'heal_14',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'dealDamage_15',
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'calculateActionValue_11',
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'calculateActionValue_12' },
          whenFalse: { $sequence: 'dealDamage_15' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0028_wulfa_talent2_heal_effect'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_5' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'burning_damage_scale' } },
      data_7: {
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
  blackboard: { atk_scale: 0.3, burning_damage_scale: 1.5, duration: 1.2, heal_scale: 0.05 },
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 0, endFrame: 19, sequence: { $sequence: 'ifElse_16' } }],
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
  blackboard: { duration: 0.9 },
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
  blackboard: { defup: -0.5, duration: 5 },
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
  blackboard: { duration: 2 },
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
  blackboard: { duration: 10 },
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
  blackboard: { duration: 0.5 },
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
  blackboard: { duration: 1 },
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
  blackboard: { duration: 1 },
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
  blackboard: { duration: 1 },
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
  blackboard: { duration: 1 },
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
  blackboard: { duration: 1 },
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
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['ultimateSkill'] },
      },
    },
  },
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
      condition: { $sequence: 'checkCondition_1' },
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
  blackboard: { duration: 1.5 },
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
  blackboard: { duration: 1.5 },
  attributeModifiers: [],
  actionGraph: rossiBuff25ActionGraph,
};

export const rossi: OperatorDefinition = {
  slug: 'rossi',
  gameId: 'ROSSI',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  characterTypeId: 'Physical',
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
      operationType: 'basicAttack',
      skills: [
        rossiChr_0028_wulfa_attack1,
        rossiChr_0028_wulfa_attack2,
        rossiChr_0028_wulfa_attack3,
        rossiChr_0028_wulfa_attack4,
        rossiChr_0028_wulfa_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: rossiChr_0028_wulfa_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: rossiChr_0028_wulfa_plunging_attack_end,
    },
    { key: 'battleSkill', operationType: 'battleSkill', skills: rossiChr_0028_wulfa_normal_skill },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
      skills: rossiChr_0028_wulfa_combo_2_skill,
      placementSequenceSkillKeys: ['chr_0028_wulfa_combo_2_skill', 'chr_0028_wulfa_combo_3_skill'],
      replacementSkills: [rossiChr_0028_wulfa_combo_3_skill],
    },
    { key: 'ultimate', operationType: 'ultimate', skills: rossiChr_0028_wulfa_ultimate_skill },
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
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'talent_1_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 1,
          maximumUpgradeLevel: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'talent_1_2',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'atk_scale_bleed',
          operation: 'assign',
          value: [0.25, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'duration_bleed',
          operation: 'assign',
          value: [15, 25],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
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
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'talent_2_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 1,
          maximumUpgradeLevel: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'talent_2_2',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'bleed_critical_damage_scale',
          operation: 'assign',
          value: [0.12, 0.24],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'bleed_critical_damage_interval',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.04, 0.08],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
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
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'potential_upgrade',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_combo_2_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'atk_scale_s',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'atk_scale_f',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_combo_3_skill',
          blackboardKey: 'damage_add',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
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
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'bleed_critical_damage_scale',
          operation: 'add',
          value: 0.08,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
          blackboardKey: 'bleed_critical_damage_interval',
          operation: 'add',
          value: -0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_normal_skill',
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
          skillKey: 'chr_0028_wulfa_ultimate_skill',
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
          skillKey: 'chr_0028_wulfa_ultimate_skill',
          blackboardKey: 'potential_5_damage_scale',
          operation: 'assign',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_ultimate_skill',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0028_wulfa_ultimate_skill',
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
      faction: 'good',
      bornTags: ['Status/UnLockable', 'Status/NonAITarget'],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      deathReleaseDelaySeconds: 0.1,
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
          blackboard: {},
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
          blackboard: {},
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
