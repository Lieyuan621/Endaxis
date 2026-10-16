/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const pogranichnikChr_0029_pograni_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
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
          parameters: { skillIds: ['chr_0029_pograni_attack2'] },
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

export const pogranichnikChr_0029_pograni_attack1: SkillDefinition = {
  key: 'chr_0029_pograni_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.28, 0.3, 0.32, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 118,
  exclusiveFrame: 17,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 7,
        endFrame: 29,
        input: 'basicAttack',
        targetSkillId: 'chr_0029_pograni_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 29, skillIds: ['chr_0029_pograni_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0029_pograni_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack1ActionGraph,
};

export const pogranichnikChr_0029_pograni_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.02 },
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
            coefficient: { kind: 'constant', value: 1 },
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      startTimeDilation_9: {
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
      changeResource_10: {
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
        next: 'startTimeDilation_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0029_pograni_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack2: SkillDefinition = {
  key: 'chr_0029_pograni_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.17, 0.18, 0.2, 0.21, 0.22, 0.24, 0.25, 0.27, 0.29, 0.32],
  },
  timelineBlockFrames: 19,
  naturalDurationFrames: 124,
  exclusiveFrame: 22,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 7,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0029_pograni_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 19, endFrame: 39, skillIds: ['chr_0029_pograni_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 7, endFrame: 13, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 14, endFrame: 20, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 19, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0029_pograni_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack2ActionGraph,
};

export const pogranichnikChr_0029_pograni_attack3ActionGraph = {
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
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
            amount: { kind: 'valueNode', nodeId: 'data_1' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0029_pograni_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack3: SkillDefinition = {
  key: 'chr_0029_pograni_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    poise: 0,
  },
  timelineBlockFrames: 19,
  naturalDurationFrames: 175,
  exclusiveFrame: 29,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 11,
        endFrame: 37,
        input: 'basicAttack',
        targetSkillId: 'chr_0029_pograni_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 19, endFrame: 37, skillIds: ['chr_0029_pograni_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 19, endFrame: 37, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0029_pograni_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack3ActionGraph,
};

export const pogranichnikChr_0029_pograni_attack4ActionGraph = {
  main: {
    nodes: {
      changeResource_6: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.167 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_7',
      },
      startTimeDilation_30: {
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
                  value: 0.3,
                  inTangent: -11.12636,
                  outTangent: -11.12636,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.05082683,
                  value: 0.06,
                  inTangent: -0.8463666,
                  outTangent: 0.1598016,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5199714,
                  value: 0.2766429,
                  inTangent: 0.9066172,
                  outTangent: 0.9066172,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.363477,
                  outTangent: 2.363477,
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
      checkCondition_28: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_29: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_28',
      },
      ifElse_31: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'startTimeDilation_30' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_36: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0029_pograni_attack5'] },
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
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_29' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack4: SkillDefinition = {
  key: 'chr_0029_pograni_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.06, 0.07, 0.08, 0.08, 0.09, 0.1, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    poise: 0,
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 125,
  exclusiveFrame: 26,
  offsetRecordFrame: 3,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 10,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0029_pograni_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 33, skillIds: ['chr_0029_pograni_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 17, endFrame: 20, sequence: { $sequence: 'ifElse_31' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 18, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_36' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0029_pograni_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack4ActionGraph,
};

export const pogranichnikChr_0029_pograni_attack5ActionGraph = {
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
            damageType: 'physical',
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
            durationSeconds: { kind: 'constant', value: 0.35 },
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
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0029_pograni_attack1'] },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack5: SkillDefinition = {
  key: 'chr_0029_pograni_attack5',
  element: 'physical',
  blackboard: {
    atb: 20,
    atk_scale: [0.43, 0.47, 0.52, 0.56, 0.6, 0.65, 0.69, 0.73, 0.77, 0.83, 0.89, 0.97],
    isHitbyMain: 0,
    poise: 18,
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 124,
  exclusiveFrame: 32,
  offsetRecordFrame: 16,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0029_pograni_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 24, endFrame: 32, skillIds: ['chr_0029_pograni_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'ifElse_10' } },
    { startFrame: 24, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0029_pograni_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack5ActionGraph,
};

export const pogranichnikChr_0029_pograni_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
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
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_2' },
          whenFalse: { $sequence: null },
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
        next: 'ifElse_3',
      },
      startTimeDilation_6: {
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
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
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
        next: 'ifElse_7',
      },
      gainFinisherSp_10: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'gainFinisherSp_10' },
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
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_11',
      },
      startTimeDilation_13: {
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
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'startTimeDilation_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_14',
      },
      applyBuff_16: {
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
      applyBuff_17: {
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
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_power_attack: SkillDefinition = {
  key: 'chr_0029_pograni_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 48,
  naturalDurationFrames: 145,
  exclusiveFrame: 47,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 27,
        endFrame: 49,
        skillIds: ['chr_0029_pograni_normal_skill', 'chr_0029_pograni_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 14, endFrame: 17, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 25, endFrame: 27, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'checkCondition_15' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_16' } },
    { startFrame: 0, endFrame: 27, sequence: { $sequence: 'applyBuff_17' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: pogranichnikChr_0029_pograni_power_attackActionGraph,
};

export const pogranichnikChr_0029_pograni_plunging_attack_endActionGraph = {
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

export const pogranichnikChr_0029_pograni_plunging_attack_end: SkillDefinition = {
  key: 'chr_0029_pograni_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 93,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 3, endFrame: 8, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_plunging_attack_endActionGraph,
};

export const pogranichnikChr_0029_pograni_normal_skillActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'mainTar',
          },
        },
        next: null,
      },
      modifyActionValue_24: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'num',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'modifyActionValue_24' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      readBuffStackCount_26: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'num_1',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
        },
        next: 'ifElse_25',
      },
      repeatEachTick_27: {
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
          body: { $sequence: 'readBuffStackCount_26' },
        },
        next: null,
      },
      changeResource_31: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_30: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_29: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_28: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      switch_32: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_9' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'changeResource_28' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'changeResource_29' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'changeResource_30' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'changeResource_31' } },
          ],
        },
        next: null,
      },
      startTimeDilation_33: {
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
        next: null,
      },
      dealDamage_34: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'startTimeDilation_33',
      },
      mergeContextTargets_35: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'total_tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_34',
      },
      changeResource_37: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_12' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      checkCondition_38: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'changeResource_37',
      },
      startTimeDilation_39: {
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
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.15,
                  value: 1,
                  inTangent: Number.POSITIVE_INFINITY,
                  outTangent: -4.930326,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.2077375,
                  value: 0.02,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.6975113,
                  value: 0.02,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.753838,
                  outTangent: 4.753838,
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
      dealDamage_40: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_15' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'startTimeDilation_39',
      },
      applyPhysicalInfliction_41: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: { type: 'fracture', target: 'enemy', isExtra: false },
        },
        next: 'dealDamage_40',
      },
      ifElse_42: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'checkCondition_38' },
          whenFalse: { $sequence: null },
        },
        next: 'applyPhysicalInfliction_41',
      },
      mergeContextTargets_43: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'total_tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'ifElse_42',
      },
      applyBuff_44: {
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
      ifElse_45: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'applyBuff_44' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'num_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'num_1', fallback: 0 } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'num', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb4' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb3' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atb2' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'num' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_potential1', fallback: 0 },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 2,
        },
      },
      data_17: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_normal_skill: SkillDefinition = {
  key: 'chr_0029_pograni_normal_skill',
  element: 'physical',
  blackboard: {
    atb_return: 15,
    atb1: 5,
    atb2: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
    atb3: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb4: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
    atk_scale: [0.86, 0.94, 1.03, 1.11, 1.2, 1.28, 1.37, 1.45, 1.54, 1.65, 1.77, 1.92],
    atk_scale2: [1.06, 1.16, 1.27, 1.37, 1.48, 1.58, 1.69, 1.8, 1.9, 2.03, 2.19, 2.38],
    has_potential1: 0,
    num: 0,
    num_1: 0,
    poise: 5,
  },
  timelineBlockFrames: 48,
  naturalDurationFrames: 218,
  exclusiveFrame: 55,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 48,
        endFrame: 55,
        skillIds: [
          'chr_0029_pograni_attack1',
          'chr_0029_pograni_attack2',
          'chr_0029_pograni_attack3',
          'chr_0029_pograni_attack4',
          'chr_0029_pograni_attack5',
        ],
      },
      { startFrame: 45, endFrame: 55, skillIds: ['chr_0029_pograni_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 157, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 0, endFrame: 28, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 28, endFrame: 157, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'repeatEachTick_27' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'switch_32' } },
    { startFrame: 28, endFrame: 29, sequence: { $sequence: 'mergeContextTargets_35' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'mergeContextTargets_43' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'ifElse_45' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: pogranichnikChr_0029_pograni_normal_skillActionGraph,
};

export const pogranichnikChr_0029_pograni_combo_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0029_pograni_combo_skill_count1',
              'buff_chr_0029_pograni_combo_skill_count2',
              'buff_chr_0029_pograni_combo_skill_count3',
              'buff_chr_0029_pograni_combo_skill_count4',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_4',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'finishBuffsById_4',
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'modifyActionValue_5' },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'finishBuffsById_4',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_8' },
          whenFalse: { $sequence: 'ifElse_9' },
        },
        next: null,
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: 'finishBuffsById_4',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_12' },
          whenFalse: { $sequence: 'ifElse_13' },
        },
        next: null,
      },
      jumpTimeline_16: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 200 },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
        },
        next: null,
      },
      ifElse_19: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'jumpTimeline_16' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_18: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 400 },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
        },
        next: null,
      },
      ifElse_22: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'jumpTimeline_18' },
          whenFalse: { $sequence: 'ifElse_19' },
        },
        next: null,
      },
      jumpTimeline_21: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 600 },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'jumpTimeline_21' },
          whenFalse: { $sequence: 'ifElse_22' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_24: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_25: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      changeResource_39: {
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
      startTimeDilation_40: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.133 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_39',
      },
      dealDamage_41: {
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
        next: 'startTimeDilation_40',
      },
      changeResource_42: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_14' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_41',
      },
      calculateActionValue_43: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'changeResource_42',
      },
      startTimeDilation_44: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.133 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      dealDamage_45: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_17' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'startTimeDilation_44',
      },
      changeResource_46: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_18' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_45',
      },
      calculateActionValue_47: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'changeResource_46',
      },
      startTimeDilation_48: {
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
                  time: 0,
                  value: 0.45,
                  inTangent: -7.146868,
                  outTangent: -7.146868,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.08,
                  value: 0.05,
                  inTangent: 0.0647267,
                  outTangent: 0.0647267,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.4542674,
                  value: 0.08,
                  inTangent: 0.09682205,
                  outTangent: 0.857443,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.77354,
                  outTangent: 2.77354,
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
      dealDamage_49: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_20' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: 'startTimeDilation_48',
      },
      changeResource_50: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_22' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_49',
      },
      calculateActionValue_51: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb4',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_23' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'changeResource_50',
      },
      dealDamage_62: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_24' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_25' },
          },
        },
        next: 'startTimeDilation_48',
      },
      changeResource_63: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_26' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_62',
      },
      calculateActionValue_64: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb3',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_27' },
            right: { kind: 'valueNode', nodeId: 'data_16' },
          },
        },
        next: 'changeResource_63',
      },
      startTimeDilation_79: {
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
      startTimeDilation_81: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.700000048 },
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
      startTimeDilation_82: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.73300004 },
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
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0029_pograni_combo_skill_count2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0029_pograni_combo_skill_count3'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0029_pograni_combo_skill_count4'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 2 },
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
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb1' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atb1' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ratio' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb2' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atb2' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale4' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'poise4' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb4' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'atb4' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb3' } },
      data_27: { type: 'number', expression: { kind: 'blackboard', key: 'atb3' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_combo_skill: SkillDefinition = {
  key: 'chr_0029_pograni_combo_skill',
  element: 'physical',
  blackboard: {
    atb_ratio: 1,
    atb1: 5,
    atb2: 7,
    atb3: 13,
    atb4: 23,
    atk_scale: [0.42, 0.46, 0.5, 0.55, 0.59, 0.63, 0.67, 0.71, 0.76, 0.81, 0.87, 0.95],
    atk_scale2: [0.54, 0.59, 0.65, 0.7, 0.76, 0.81, 0.86, 0.92, 0.97, 1.04, 1.12, 1.22],
    atk_scale3: [0.66, 0.73, 0.79, 0.86, 0.92, 0.99, 1.06, 1.12, 1.19, 1.27, 1.37, 1.49],
    atk_scale4: [1.32, 1.45, 1.58, 1.72, 1.85, 1.98, 2.11, 2.24, 2.38, 2.54, 2.74, 2.97],
    calc_atb1: 0,
    calc_atb2: 0,
    calc_atb3: 0,
    calc_atb4: 0,
    poise1: 3,
    poise3: 4,
    poise4: 9,
    usp: 10,
  },
  timelineBlockFrames: 72,
  naturalDurationFrames: 728,
  exclusiveFrame: 649,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 66, endFrame: 96, skillIds: ['chr_0029_pograni_normal_skill'] },
      { startFrame: 266, endFrame: 296, skillIds: ['chr_0029_pograni_normal_skill'] },
      { startFrame: 442, endFrame: 460, skillIds: ['chr_0029_pograni_normal_skill'] },
      { startFrame: 628, endFrame: 660, skillIds: ['chr_0029_pograni_normal_skill'] },
      {
        startFrame: 72,
        endFrame: 96,
        skillIds: [
          'chr_0029_pograni_attack1',
          'chr_0029_pograni_attack2',
          'chr_0029_pograni_attack3',
          'chr_0029_pograni_attack4',
          'chr_0029_pograni_attack5',
        ],
      },
      {
        startFrame: 272,
        endFrame: 296,
        skillIds: [
          'chr_0029_pograni_attack1',
          'chr_0029_pograni_attack2',
          'chr_0029_pograni_attack3',
          'chr_0029_pograni_attack4',
          'chr_0029_pograni_attack5',
        ],
      },
      {
        startFrame: 446,
        endFrame: 460,
        skillIds: [
          'chr_0029_pograni_attack1',
          'chr_0029_pograni_attack2',
          'chr_0029_pograni_attack3',
          'chr_0029_pograni_attack4',
          'chr_0029_pograni_attack5',
        ],
      },
      {
        startFrame: 632,
        endFrame: 660,
        skillIds: [
          'chr_0029_pograni_attack1',
          'chr_0029_pograni_attack2',
          'chr_0029_pograni_attack3',
          'chr_0029_pograni_attack4',
          'chr_0029_pograni_attack5',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_23' } },
    { startFrame: 80, endFrame: 83, sequence: { $sequence: 'markCurrentSkillCanInterrupt_24' } },
    { startFrame: 191, endFrame: 194, sequence: { $sequence: 'interruptCurrentSkill_25' } },
    { startFrame: 280, endFrame: 283, sequence: { $sequence: 'markCurrentSkillCanInterrupt_24' } },
    { startFrame: 391, endFrame: 394, sequence: { $sequence: 'interruptCurrentSkill_25' } },
    { startFrame: 450, endFrame: 453, sequence: { $sequence: 'markCurrentSkillCanInterrupt_24' } },
    { startFrame: 545, endFrame: 548, sequence: { $sequence: 'interruptCurrentSkill_25' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'calculateActionValue_43' } },
    { startFrame: 37, endFrame: 40, sequence: { $sequence: 'calculateActionValue_47' } },
    { startFrame: 61, endFrame: 64, sequence: { $sequence: 'calculateActionValue_51' } },
    { startFrame: 223, endFrame: 226, sequence: { $sequence: 'calculateActionValue_43' } },
    { startFrame: 237, endFrame: 240, sequence: { $sequence: 'calculateActionValue_47' } },
    { startFrame: 261, endFrame: 264, sequence: { $sequence: 'calculateActionValue_64' } },
    { startFrame: 423, endFrame: 426, sequence: { $sequence: 'calculateActionValue_43' } },
    { startFrame: 437, endFrame: 440, sequence: { $sequence: 'calculateActionValue_47' } },
    { startFrame: 623, endFrame: 626, sequence: { $sequence: 'calculateActionValue_43' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'startTimeDilation_79' } },
    { startFrame: 200, endFrame: 221, sequence: { $sequence: 'startTimeDilation_79' } },
    { startFrame: 400, endFrame: 418, sequence: { $sequence: 'startTimeDilation_81' } },
    { startFrame: 600, endFrame: 619, sequence: { $sequence: 'startTimeDilation_82' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: pogranichnikChr_0029_pograni_combo_skillActionGraph,
};

export const pogranichnikChr_0029_pograni_ultimate_skillActionGraph = {
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
      setIgnoreGlobalTimeScale_2: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae4' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: null,
      },
      setIgnoreGlobalTimeScale_3: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae3' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_2',
      },
      setIgnoreGlobalTimeScale_4: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae2' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_3',
      },
      setIgnoreGlobalTimeScale_5: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae1' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_4',
      },
      spawnAbilityEntity_6: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae4',
          },
        },
        next: 'setIgnoreGlobalTimeScale_5',
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae3',
          },
        },
        next: 'spawnAbilityEntity_6',
      },
      spawnAbilityEntity_8: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae2',
          },
        },
        next: 'spawnAbilityEntity_7',
      },
      spawnAbilityEntity_9: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae1',
          },
        },
        next: 'spawnAbilityEntity_8',
      },
      dealDamage_12: {
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
      applyBuff_13: {
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
      hideUi_14: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_15: {
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
      finishBuffsById_16: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishOwner_17: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'soldiers' } },
        },
        next: 'finishBuffsById_16',
      },
      findOwnerSpawnedAbilityEntities_18: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soldiers',
            abilityEntityIds: ['abilityentity_chr_0029_pograni_ultimate_skill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'finishOwner_17',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_rush' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_rush' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_ultimate_skill: SkillDefinition = {
  key: 'chr_0029_pograni_ultimate_skill',
  element: 'physical',
  blackboard: {
    angle: 120,
    atb_final: [30, 30, 30, 30, 30, 30, 30, 30, 30, 40, 40, 40],
    atb_trigger: [7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 10, 10, 10],
    atk_scale_final: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    atk_scale_rush: [1.33, 1.47, 1.6, 1.73, 1.86, 2, 2.13, 2.26, 2.4, 2.56, 2.76, 3],
    atk_scale_trigger: [0.45, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    center_radius: 6,
    duration: 30,
    height: 4,
    poise_final: 15,
    poise_rush: 10,
    radius: 5,
  },
  timelineBlockFrames: 91,
  naturalDurationFrames: 210,
  exclusiveFrame: 90,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 74, endFrame: 77, sequence: { $sequence: 'spawnAbilityEntity_9' } },
    { startFrame: 76, endFrame: 82, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'hideUi_14' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'startUltimateTimeDilation_15' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_18' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: pogranichnikChr_0029_pograni_ultimate_skillActionGraph,
};

export const pogranichnikCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: pogranichnikCommon_character_perfect_dodgeActionGraph,
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

const pogranichnikPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_talent1',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  atk_up: 'atk_up',
                  physpell_up: 'physpell_up',
                  max_stack: 'max_stack_owner',
                },
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_atb_contain',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'applyBuff_1',
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_gain_minus',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'modifyActionValue_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'calculateActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_atb_contain',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'checkCondition_4',
      },
      storeEventSpGainAmount_6: {
        action: { kind: 'storeEventSpGainAmount', parameters: { outputKey: 'atb_contain_temp' } },
        next: 'modifyActionValue_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'storeEventSpGainAmount_6',
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_talent1_exist',
                blackboardAssignments: {
                  atk_up: { kind: 'valueNode', nodeId: 'data_8' },
                  max_stack_owner: { kind: 'valueNode', nodeId: 'data_9' },
                  physpell_up: { kind: 'valueNode', nodeId: 'data_10' },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_gain_minus' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb_gain' } },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_atb_contain', fallback: 0 },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb_gain', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_4' },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_contain_temp' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack_owner' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'physpell_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0029_pograni_talent1',
  blackboard: {
    atb_gain: [80, 80],
    atk_up: [0.04, 0.08],
    duration: [20, 20],
    max_stack_owner: [3, 3],
    physpell_up: [4, 8],
  },
  enableSequence: { $sequence: 'applyBuff_8' },
  abilityEventResponses: [
    { event: 'skillSpGained', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
  ],
  actionGraph: pogranichnikPassive1ActionGraph,
};

const pogranichnikComboCondition1ActionGraph = {
  main: {
    nodes: {
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0029_pograni_combo_skill_count1' }],
            targets: { kind: 'source' },
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
            buffs: [{ buffId: 'buff_chr_0029_pograni_combo_skill_count2' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'applyBuff_2' },
          whenFalse: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0029_pograni_combo_skill_count3' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'applyBuff_5' },
          whenFalse: { $sequence: 'ifElse_6' },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0029_pograni_combo_skill_count4' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyBuff_8' },
          whenFalse: { $sequence: 'ifElse_9' },
        },
        next: null,
      },
      readBuffStackCount_11: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'eventTarget',
            outputKey: 'EntityBB_noguard_count',
            query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
          },
        },
        next: 'ifElse_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readBuffStackCount_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_12',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_13',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy', 'enemyPart'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: false,
          contextKey: 'trigger',
          buffIds: ['buff_physical_no_guard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/PhysicalStatus/FractureStatus',
            'Skill/Character/Common/PhysicalStatus/CrushStatus',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0029_pograni_combo_skill',
  event: 'beforeAddedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_14' },
  actionGraph: pogranichnikComboCondition1ActionGraph,
};

const pogranichnikBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff1: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo1'],
  extendTags: [],
  blackboard: { duration: 6 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff1ActionGraph,
};

const pogranichnikBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff2: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo2'],
  extendTags: [],
  blackboard: { duration: 6 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff2ActionGraph,
};

const pogranichnikBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff3: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo3'],
  extendTags: [],
  blackboard: { duration: 6 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff3ActionGraph,
};

const pogranichnikBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff4: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo4'],
  extendTags: [],
  blackboard: { duration: 6 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff4ActionGraph,
};

const pogranichnikBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff5: SkillBuffDefinition = {
  stackingType: 'highPriorityWithMaxStack',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_pograni_talent_1',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0.1, duration: 20, max_stack: 3, physpell_up: 10 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
    {
      attribute: 'PhysicalAndSpellInflictionEnhance',
      slot: 'baseAddition',
      value: { blackboardKey: 'physpell_up' },
    },
  ],
  actionGraph: pogranichnikBuff5ActionGraph,
};

const pogranichnikBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, max_stack_owner: 5, max_stack_team: 3, physpell_up: 0 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff6ActionGraph,
};

const pogranichnikBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 20 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff7ActionGraph,
};

const pogranichnikBuff8ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  atk_scale_trigger: { kind: 'valueNode', nodeId: 'data_2' },
                  atk_scale_final: { kind: 'valueNode', nodeId: 'data_3' },
                  atb_trigger: { kind: 'valueNode', nodeId: 'data_4' },
                  atb_final: { kind: 'valueNode', nodeId: 'data_5' },
                  poise_final: { kind: 'valueNode', nodeId: 'data_6' },
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_ultimate_skill_count',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_7' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_effect_layer'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_trigger' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_final' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_final' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff8: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atb_final: 0,
    atb_trigger: 0,
    atk_scale_final: 0,
    atk_scale_trigger: 0,
    count: 5,
    duration: 20,
    poise_final: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'applyBuff_2' }],
    enable: [{ $sequence: 'aura_1' }],
    finish: [{ $sequence: 'finishBuffsById_3' }],
  },
  actionGraph: pogranichnikBuff8ActionGraph,
};

const pogranichnikBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_talent1',
                copiedBlackboardAssignments: {
                  duration: 'duration_temp',
                  atk_up: 'atk_up_temp',
                  physpell_up: 'physpell_up_temp',
                  max_stack: 'max_stack_team_temp',
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_talent1',
                copiedBlackboardAssignments: {
                  duration: 'duration_temp',
                  atk_up: 'atk_up_temp',
                  physpell_up: 'physpell_up_temp',
                  max_stack: 'max_stack_owner_temp',
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
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'applyBuff_2' },
          whenFalse: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      readBuffBlackboard_5: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_team',
            outputKey: 'max_stack_team_temp',
          },
        },
        next: 'ifElse_4',
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_owner',
            outputKey: 'max_stack_owner_temp',
          },
        },
        next: 'readBuffBlackboard_5',
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'physpell_up',
            outputKey: 'physpell_up_temp',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      readBuffBlackboard_8: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'atk_up',
            outputKey: 'atk_up_temp',
          },
        },
        next: 'readBuffBlackboard_7',
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
            desiredKey: 'duration',
            outputKey: 'duration_temp',
          },
        },
        next: 'readBuffBlackboard_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'readBuffBlackboard_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_10',
      },
      createTimedMarker_12: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'chr_0029_pograni_soldier_attacked',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_4' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'checkCondition_11',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
                copiedBlackboardAssignments: {
                  atk_scale_final: 'atk_scale_final',
                  atb_final: 'atb_final',
                  poise_final: 'poise_final',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createTimedMarker_12',
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'finishBuffsById_14',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_15',
      },
      finishBuffsById_29: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createTimedMarker_12',
      },
      spawnAbilityEntity_30: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: 'finishBuffsById_29',
      },
      checkCondition_31: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'spawnAbilityEntity_30',
      },
      checkCondition_32: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_31',
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_talent1',
                copiedBlackboardAssignments: {
                  duration: 'duration_temp',
                  atk_up: 'atk_up_temp',
                  physpell_up: 'physpell_up_temp',
                  max_stack: 'max_stack_owner_temp',
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
      readBuffBlackboard_34: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_owner',
            outputKey: 'max_stack_owner_temp',
          },
        },
        next: 'applyBuff_33',
      },
      readBuffBlackboard_35: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'physpell_up',
            outputKey: 'physpell_up_temp',
          },
        },
        next: 'readBuffBlackboard_34',
      },
      readBuffBlackboard_36: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'atk_up',
            outputKey: 'atk_up_temp',
          },
        },
        next: 'readBuffBlackboard_35',
      },
      readBuffBlackboard_37: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
            desiredKey: 'duration',
            outputKey: 'duration_temp',
          },
        },
        next: 'readBuffBlackboard_36',
      },
      checkCondition_38: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'readBuffBlackboard_37',
      },
      checkCondition_39: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'checkCondition_38',
      },
      createTimedMarker_40: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'chr_0029_pograni_soldier_attacked',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_4' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'checkCondition_39',
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
                copiedBlackboardAssignments: {
                  atk_scale_final: 'atk_scale_final',
                  atb_final: 'atb_final',
                  poise_final: 'poise_final',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createTimedMarker_40',
      },
      finishBuffsById_42: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_41',
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'finishBuffsById_42',
      },
      checkCondition_44: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'checkCondition_43',
      },
      checkCondition_45: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'checkCondition_44',
      },
      checkCondition_46: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'checkCondition_45',
      },
      finishBuffsById_55: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createTimedMarker_40',
      },
      spawnAbilityEntity_56: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: 'finishBuffsById_55',
      },
      checkCondition_57: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'spawnAbilityEntity_56',
      },
      checkCondition_58: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'checkCondition_57',
      },
      checkCondition_59: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
        },
        next: 'checkCondition_58',
      },
      checkCondition_60: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'checkCondition_59',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent1_exist'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'interval' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'equal',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'greater',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent1_exist'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'equal',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: { kind: 'eventSourceMatchesBuffSourceEntitySource' },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_15: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'greater',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_17: {
        type: 'boolean',
        expression: { kind: 'eventSourceMatchesBuffSourceEntitySource' },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atb_final: 0,
    atb_trigger: 0,
    atk_scale_final: 0,
    atk_scale_trigger: 0,
    atk_up_temp: 0,
    duration: 20,
    duration_temp: 0,
    interval: 0.1,
    max_stack_owner_temp: 0,
    max_stack_team_temp: 0,
    physpell_up_temp: 0,
    poise_final: 0,
    radius: 5,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    {
      event: 'beforeTakePhysicalInfliction',
      priority: 0,
      sequence: { $sequence: 'checkCondition_16' },
    },
    {
      event: 'beforeTakePhysicalInfliction',
      priority: 0,
      sequence: { $sequence: 'checkCondition_32' },
    },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_46' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_60' } },
  ],
  actionGraph: pogranichnikBuff9ActionGraph,
};

const pogranichnikBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_pograni_buff',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    nameKey: 'effects.name.steelOath',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { count: 4, duration: 30 },
  attributeModifiers: [],
  actionGraph: pogranichnikBuff10ActionGraph,
};

const pogranichnikBuff11ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 1 },
            slot: 'unassigned',
            priority: 100,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [
              {
                kind: 'ownerSpawned',
                abilityEntityIds: ['abilityentity_chr_0029_pograni_ultimate_skill'],
              },
            ],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const pogranichnikBuff11: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1.2,
  applyTags: [],
  extendTags: [],
  blackboard: { atb_final: 0, atk_scale_final: 0, count: 4, duration: 20, poise_final: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'startTimeDilation_7' } },
  ],
  actionGraph: pogranichnikBuff11ActionGraph,
};

export const pogranichnik: OperatorDefinition = {
  slug: 'pogranichnik',
  gameId: 'POGRANICHNK',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  characterTypeId: 'Physical',
  role: 'vanguard',
  mainAttribute: 'will',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [12, 31, 51, 71, 91, 101],
    agility: [13, 34, 55, 77, 99, 110],
    intellect: [10, 28, 48, 67, 87, 97],
    will: [20, 52, 87, 121, 156, 173],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        pogranichnikChr_0029_pograni_attack1,
        pogranichnikChr_0029_pograni_attack2,
        pogranichnikChr_0029_pograni_attack3,
        pogranichnikChr_0029_pograni_attack4,
        pogranichnikChr_0029_pograni_attack5,
      ],
    },
    {
      key: 'finisher',
      operationType: 'finisher',
      skills: pogranichnikChr_0029_pograni_power_attack,
    },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: pogranichnikChr_0029_pograni_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: pogranichnikChr_0029_pograni_normal_skill,
    },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
      skills: pogranichnikChr_0029_pograni_combo_skill,
    },
    {
      key: 'ultimate',
      operationType: 'ultimate',
      skills: pogranichnikChr_0029_pograni_ultimate_skill,
    },
  ],
  dodgeSkill: pogranichnikCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0029_pograni_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0029_pograni_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0029_pograni_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0029_pograni_attack1',
        'chr_0029_pograni_attack2',
        'chr_0029_pograni_attack3',
        'chr_0029_pograni_attack4',
        'chr_0029_pograni_attack5',
        'chr_0029_pograni_power_attack',
        'chr_0029_pograni_plunging_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0029_pograni_attack1',
        'chr_0029_pograni_attack2',
        'chr_0029_pograni_attack3',
        'chr_0029_pograni_attack4',
        'chr_0029_pograni_attack5',
      ],
      defaultSkillKey: 'chr_0029_pograni_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [pogranichnikComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    { levels: 2, passiveSkills: [pogranichnikPassive1] },
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0029_pograni_talent2', blackboardAssignments: { duration: [5, 10] } },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0029_pograni_normal_skill',
          blackboardKey: 'has_potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0029_pograni_normal_skill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0029_pograni_talent1',
          blackboardKey: 'atb_gain',
          operation: 'assign',
          value: 60,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0029_pograni_talent1',
          blackboardKey: 'max_stack_owner',
          operation: 'assign',
          value: 5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0029_pograni_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0029_pograni_combo_skill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0029_pograni_combo_skill',
          blackboardKey: 'atb_ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_atb_contain: 0, EntityBB_noguard_count: 0 },
  buffDefinitions: {
    buff_chr_0029_pograni_combo_skill_count1: pogranichnikBuff1,
    buff_chr_0029_pograni_combo_skill_count2: pogranichnikBuff2,
    buff_chr_0029_pograni_combo_skill_count3: pogranichnikBuff3,
    buff_chr_0029_pograni_combo_skill_count4: pogranichnikBuff4,
    buff_chr_0029_pograni_talent1: pogranichnikBuff5,
    buff_chr_0029_pograni_talent1_exist: pogranichnikBuff6,
    buff_chr_0029_pograni_talent2: pogranichnikBuff7,
    buff_chr_0029_pograni_ultimate_skill: pogranichnikBuff8,
    buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura: pogranichnikBuff9,
    buff_chr_0029_pograni_ultimate_skill_count: pogranichnikBuff10,
    buff_chr_0029_pograni_ultimate_skill_finall_rush: pogranichnikBuff11,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0029_pograni_ultimate_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0029_pgrani/Soldier',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkills: {
        chr_0029_pograni_ultimate_skill_abilityentity: {
          actionGraph: {
            main: {
              nodes: {
                finishOwner_1: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0029_pograni_ultimate_skill',
                          copiedBlackboardAssignments: {
                            duration: 'duration',
                            atk_scale_trigger: 'atk_scale_trigger',
                            atk_scale_final: 'atk_scale_final',
                            atb_trigger: 'atb_trigger',
                            atb_final: 'atb_final',
                            poise_final: 'poise_final',
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
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyBuff_2',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 0 },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 0,
            atb_trigger: 4,
            atk_scale_final: 0,
            atk_scale_trigger: 0,
            duration: 20,
            poise_final: 0,
          },
          scheduledSequences: [
            { startFrame: 50, endFrame: 53, sequence: { $sequence: 'finishOwner_1' } },
            { startFrame: 3, endFrame: 17, sequence: { $sequence: 'checkCondition_3' } },
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_attack2: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 400,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb_trigger: 10, atk_scale_trigger: 1 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_11' } },
            { startFrame: 59, endFrame: 62, sequence: { $sequence: 'finishOwner_12' } },
            { startFrame: 64, endFrame: 67, sequence: { $sequence: 'interruptCurrentSkill_13' } },
            { startFrame: 157, endFrame: 160, sequence: { $sequence: 'finishOwner_12' } },
            { startFrame: 165, endFrame: 168, sequence: { $sequence: 'interruptCurrentSkill_13' } },
            { startFrame: 257, endFrame: 260, sequence: { $sequence: 'finishOwner_12' } },
            { startFrame: 265, endFrame: 268, sequence: { $sequence: 'interruptCurrentSkill_13' } },
            { startFrame: 357, endFrame: 360, sequence: { $sequence: 'finishOwner_12' } },
            { startFrame: 365, endFrame: 368, sequence: { $sequence: 'interruptCurrentSkill_13' } },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'changeResource_26' } },
            { startFrame: 108, endFrame: 112, sequence: { $sequence: 'changeResource_29' } },
            { startFrame: 209, endFrame: 213, sequence: { $sequence: 'changeResource_32' } },
            { startFrame: 307, endFrame: 311, sequence: { $sequence: 'changeResource_35' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_36' } },
            { startFrame: 100, endFrame: 103, sequence: { $sequence: 'startTimeDilation_36' } },
            { startFrame: 200, endFrame: 203, sequence: { $sequence: 'startTimeDilation_36' } },
            { startFrame: 300, endFrame: 303, sequence: { $sequence: 'startTimeDilation_36' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                jumpTimeline_2: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 300 },
                    condition: { kind: 'conditionNode', nodeId: 'data_1' },
                  },
                  next: null,
                },
                ifElse_5: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                    whenTrue: { $sequence: 'jumpTimeline_2' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                jumpTimeline_4: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 200 },
                    condition: { kind: 'conditionNode', nodeId: 'data_3' },
                  },
                  next: null,
                },
                ifElse_8: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    whenTrue: { $sequence: 'jumpTimeline_4' },
                    whenFalse: { $sequence: 'ifElse_5' },
                  },
                  next: null,
                },
                jumpTimeline_7: {
                  action: {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 100 },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_6' },
                    whenTrue: { $sequence: 'jumpTimeline_7' },
                    whenFalse: { $sequence: 'ifElse_8' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: null },
                    whenFalse: { $sequence: 'ifElse_10' },
                  },
                  next: null,
                },
                finishOwner_12: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                interruptCurrentSkill_13: {
                  action: {
                    kind: 'interruptCurrentSkill',
                    parameters: { targets: { kind: 'inputTarget' } },
                  },
                  next: null,
                },
                startTimeDilation_24: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.2 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 10,
                      curve: { kind: 'named', key: 'char_normal_attack' },
                      finishByAction: false,
                      targets: ['enemy'],
                      abilityEntityTargets: [{ kind: 'current' }],
                    },
                  },
                  next: null,
                },
                dealDamage_25: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_25/action',
                  },
                  next: 'startTimeDilation_24',
                },
                changeResource_26: {
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
                  next: 'dealDamage_25',
                },
                dealDamage_28: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_28/action',
                  },
                  next: 'startTimeDilation_24',
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
                  next: 'dealDamage_28',
                },
                dealDamage_31: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_31/action',
                  },
                  next: 'startTimeDilation_24',
                },
                changeResource_32: {
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
                  next: 'dealDamage_31',
                },
                dealDamage_34: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_34/action',
                  },
                  next: 'startTimeDilation_24',
                },
                changeResource_35: {
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
                  next: 'dealDamage_34',
                },
                startTimeDilation_36: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 30,
                      curve: {
                        kind: 'inline',
                        keys: [
                          {
                            time: 0,
                            value: 0.3,
                            inTangent: -11.5167389,
                            outTangent: -11.5167389,
                            weightedMode: 2,
                            inWeight: 0,
                            outWeight: 0.318046421,
                          },
                          {
                            time: 0.05494036,
                            value: 0.04303966,
                            inTangent: 0.115633719,
                            outTangent: 0.115633719,
                            weightedMode: 1,
                            inWeight: 0.333333343,
                            outWeight: 0.6580062,
                          },
                          {
                            time: 1,
                            value: 1,
                            inTangent: 4.71006632,
                            outTangent: 4.71006632,
                            weightedMode: 1,
                            inWeight: 0.2407477,
                            outWeight: 0,
                          },
                        ],
                      },
                      finishByAction: false,
                      targets: ['caster'],
                      abilityEntityTargets: [{ kind: 'current' }],
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
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 3 },
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: { kind: 'checkActionResult', action: { $sequence: null } },
                },
                data_6: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 4 },
                  },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_trigger' },
                },
                data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
              },
            },
            macros: {},
          },
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish1: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb: 10, atk_scale: 1 },
          scheduledSequences: [
            { startFrame: 36, endFrame: 46, sequence: { $sequence: 'finishOwner_1' } },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_5' } },
            { startFrame: 0, endFrame: 14, sequence: { $sequence: 'startTimeDilation_6' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishOwner_1: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
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
                      spGainSource: 'skill',
                    },
                  },
                  next: 'startTimeDilation_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish1/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'changeResource_4',
                },
                startTimeDilation_6: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'global',
                      durationSeconds: { kind: 'constant', value: 0.467 },
                      slot: 'unassigned',
                      priority: 30,
                      curve: { kind: 'named', key: 'ComboSkill' },
                      finishByAction: false,
                      ignoredTargets: [],
                      ignoredAbilityEntityTargets: [{ kind: 'current' }],
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              },
            },
            macros: {},
          },
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish2: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb: 10, atk_scale: 1 },
          scheduledSequences: [
            { startFrame: 36, endFrame: 46, sequence: { $sequence: 'finishOwner_1' } },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_4' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishOwner_1: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
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
                      spGainSource: 'skill',
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
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish2/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: 'changeResource_3',
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              },
            },
            macros: {},
          },
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish3: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish3',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb: 10, atk_scale: 1 },
          scheduledSequences: [
            { startFrame: 36, endFrame: 46, sequence: { $sequence: 'finishOwner_1' } },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_4' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishOwner_1: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
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
                      spGainSource: 'skill',
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
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish3/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: 'changeResource_3',
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              },
            },
            macros: {},
          },
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish4: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 81,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atb_final: 50, atk_scale_final: 1, poise_final: 0 },
          scheduledSequences: [
            { startFrame: 75, endFrame: 78, sequence: { $sequence: 'finishOwner_1' } },
            { startFrame: 31, endFrame: 38, sequence: { $sequence: 'finishBuffsById_2' } },
            { startFrame: 25, endFrame: 52, sequence: { $sequence: 'ifElse_9' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_10' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                finishOwner_1: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                finishBuffsById_2: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'source' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish4/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: null,
                },
                createTimedMarker_6: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      targets: { kind: 'source' },
                      markerId: 'chr_0029_pograni_ultimate_finalhit',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                      timeDomain: 'globalScaled',
                    },
                  },
                  next: 'dealDamage_5',
                },
                changeResource_7: {
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
                  next: 'createTimedMarker_6',
                },
                findTargets_8: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: { kind: 'mainTarget', owner: { kind: 'owner' } },
                      saveToContextKey: 'maintar',
                    },
                  },
                  next: 'changeResource_7',
                },
                ifElse_9: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                    whenTrue: { $sequence: 'findTargets_8' },
                    whenFalse: { $sequence: null },
                  },
                  next: null,
                },
                startTimeDilation_10: {
                  action: {
                    kind: 'startTimeDilation',
                    parameters: {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.4 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 30,
                      curve: {
                        kind: 'inline',
                        keys: [
                          {
                            time: 0,
                            value: 0.3,
                            inTangent: -11.5167389,
                            outTangent: -11.5167389,
                            weightedMode: 2,
                            inWeight: 0,
                            outWeight: 0.318046421,
                          },
                          {
                            time: 0.05,
                            value: 0.01,
                            inTangent: 0.15876019,
                            outTangent: 0.0561449826,
                            weightedMode: 3,
                            inWeight: 0.333333343,
                            outWeight: 0.73591876,
                          },
                          {
                            time: 1,
                            value: 1,
                            inTangent: 3.72562432,
                            outTangent: 3.72562432,
                            weightedMode: 1,
                            inWeight: 0.306914866,
                            outWeight: 0,
                          },
                        ],
                      },
                      finishByAction: false,
                      targets: ['caster'],
                      abilityEntityTargets: [{ kind: 'current' }],
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_final' },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_final' } },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'timedMarkerPresent',
                    returnTrueIfNotExists: true,
                    target: 'caster',
                    markerId: 'chr_0029_pograni_ultimate_finalhit',
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

export default pogranichnik;
