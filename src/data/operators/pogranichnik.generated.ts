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
      startTimeDilation_1: {
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
  actionGraph: pogranichnikChr_0029_pograni_attack1ActionGraph,
  key: 'chr_0029_pograni_attack1',
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
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 29, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0029_pograni_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const pogranichnikChr_0029_pograni_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      changeResourceByActionValue_6: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_7',
      },
      reachSkillOperableBoundary_9: {
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
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack2: SkillDefinition = {
  actionGraph: pogranichnikChr_0029_pograni_attack2ActionGraph,
  key: 'chr_0029_pograni_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.17, 0.18, 0.2, 0.21, 0.22, 0.24, 0.25, 0.27, 0.29, 0.32],
    display_atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
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
    { startFrame: 7, endFrame: 13, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 14, endFrame: 20, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 19, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0029_pograni_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const pogranichnikChr_0029_pograni_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_3',
      },
      startTimeDilation_5: {
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
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack3: SkillDefinition = {
  actionGraph: pogranichnikChr_0029_pograni_attack3ActionGraph,
  key: 'chr_0029_pograni_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    poise: 0,
    display_atk_scale: [0.33, 0.36, 0.4, 0.43, 0.46, 0.5, 0.53, 0.56, 0.59, 0.64, 0.68, 0.74],
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 19, endFrame: 37, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0029_pograni_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const pogranichnikChr_0029_pograni_attack4ActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.167 },
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
            tags: ['normalAttack'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_2',
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
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_16' },
        },
        next: null,
      },
      reachSkillOperableBoundary_21: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack4: SkillDefinition = {
  key: 'chr_0029_pograni_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.06, 0.07, 0.08, 0.08, 0.09, 0.1, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    poise: 0,
    display_atk_scale: [0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86],
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
    { startFrame: 3, endFrame: 4, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 17, endFrame: 20, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 18, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  timelineContinuationSkillId: 'chr_0029_pograni_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: pogranichnikChr_0029_pograni_attack4ActionGraph,
};

export const pogranichnikChr_0029_pograni_attack5ActionGraph = {
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isHitbyMain',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'changeResourceByActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      dealDamage_4: {
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
        next: 'conditional_3',
      },
      startTimeDilation_5: {
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0029_pograni_attack1'] },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_attack5: SkillDefinition = {
  actionGraph: pogranichnikChr_0029_pograni_attack5ActionGraph,
  key: 'chr_0029_pograni_attack5',
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
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'conditional_6' } },
    { startFrame: 24, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0029_pograni_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const pogranichnikChr_0029_pograni_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_2',
      },
      startTimeDilation_4: {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_5',
      },
      gainFinisherSp_7: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_7' },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_8',
      },
      startTimeDilation_10: {
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
      applyBuff_13: {
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
      applyBuff_14: {
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
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'startTimeDilation_10' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_power_attack: SkillDefinition = {
  key: 'chr_0029_pograni_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 27,
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
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 14, endFrame: 17, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 25, endFrame: 27, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 0, endFrame: 27, sequence: { $sequence: 'applyBuff_14' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: pogranichnikChr_0029_pograni_power_attackActionGraph,
};

export const pogranichnikChr_0029_pograni_plunging_attack_endActionGraph = {
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

export const pogranichnikChr_0029_pograni_plunging_attack_end: SkillDefinition = {
  actionGraph: pogranichnikChr_0029_pograni_plunging_attack_endActionGraph,
  key: 'chr_0029_pograni_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 93,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 3, endFrame: 8, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const pogranichnikChr_0029_pograni_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      modifyActionValue_2: {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
      readBuffStackCount_4: {
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
        next: 'conditional_3',
      },
      repeatEachTick_5: {
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
          body: { $sequence: 'readBuffStackCount_4' },
        },
        next: null,
      },
      changeResourceByActionValue_6: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResourceByActionValue_7: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResourceByActionValue_8: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResourceByActionValue_9: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_9' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'changeResourceByActionValue_6' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'changeResourceByActionValue_7' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'changeResourceByActionValue_8' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'changeResourceByActionValue_9' },
            },
          ],
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
            curve: { kind: 'named', key: 'char_normal_attack' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'startTimeDilation_11',
      },
      startTimeDilation_13: {
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
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_12' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'startTimeDilation_13',
      },
      applyPhysicalInfliction_15: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'fracture',
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
            fractureBuffId: 'buff_physical_fracture',
            fractureDefinition: {
              stackingType: 'unlimited',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: 3,
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: false,
              maxTriggerCount: 0,
              applyTags: [],
              extendTags: [],
              blackboard: { count: 0, duration: 15 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'readBuffStackCount_3' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_do_fracture',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { duration: 'duration' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_2: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [12, 18, 24, 30],
                              column: { kind: 'valueNode', nodeId: 'data_1' },
                              storeKey: 'duration',
                            },
                          ],
                        },
                      },
                      next: 'applyBuff_1',
                    },
                    readBuffStackCount_3: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_2',
                    },
                  },
                  dataNodes: {
                    data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                  },
                },
                macros: {},
              },
            },
          },
        },
        next: 'dealDamage_14',
      },
      applyBuff_16: {
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
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb1' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atb3' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb4' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'num' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_normal_skill: SkillDefinition = {
  key: 'chr_0029_pograni_normal_skill',
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
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'switch_10' } },
    { startFrame: 28, endFrame: 29, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'applyPhysicalInfliction_15' } },
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'applyBuff_16' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: pogranichnikChr_0029_pograni_normal_skillActionGraph,
};

export const pogranichnikChr_0029_pograni_combo_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'enemy',
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
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_3',
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 2 },
          },
        },
        next: 'finishBuffsById_3',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'finishBuffsById_3',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_6' },
          whenFalse: { $sequence: 'conditional_7' },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_noguard_count',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: 'finishBuffsById_3',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_9' },
          whenFalse: { $sequence: 'conditional_10' },
        },
        next: null,
      },
      jumpTimeline_12: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 200 } },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_12' },
        },
        next: null,
      },
      jumpTimeline_13: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 400 } },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_13' },
          whenFalse: { $sequence: 'conditional_14' },
        },
        next: null,
      },
      jumpTimeline_15: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 600 } },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_15' },
          whenFalse: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      findCharacterTeamTargets_18: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_22: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_23: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      changeResourceByActionValue_28: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      startTimeDilation_29: {
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
        next: 'changeResourceByActionValue_28',
      },
      dealDamage_30: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'startTimeDilation_29',
      },
      changeResourceByActionValue_31: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_30',
      },
      calculateActionValue_32: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_14' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'changeResourceByActionValue_31',
      },
      startTimeDilation_33: {
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
      dealDamage_34: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_16' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'startTimeDilation_33',
      },
      changeResourceByActionValue_35: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_18' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_34',
      },
      calculateActionValue_36: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_19' },
            right: { kind: 'valueNode', nodeId: 'data_20' },
          },
        },
        next: 'changeResourceByActionValue_35',
      },
      startTimeDilation_37: {
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
      dealDamage_38: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_21' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_22' },
          },
        },
        next: 'startTimeDilation_37',
      },
      changeResourceByActionValue_39: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_23' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_38',
      },
      calculateActionValue_40: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb4',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_24' },
            right: { kind: 'valueNode', nodeId: 'data_25' },
          },
        },
        next: 'changeResourceByActionValue_39',
      },
      dealDamage_51: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_26' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_27' },
          },
        },
        next: 'startTimeDilation_37',
      },
      changeResourceByActionValue_52: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_28' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_51',
      },
      calculateActionValue_53: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'calc_atb3',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_29' },
            right: { kind: 'valueNode', nodeId: 'data_30' },
          },
        },
        next: 'changeResourceByActionValue_52',
      },
      startTimeDilation_68: {
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
      startTimeDilation_70: {
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
      startTimeDilation_71: {
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb1' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atb1' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ratio' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb2' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atb2' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ratio' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale4' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'poise4' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb4' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'atb4' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ratio' } },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
      data_27: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
      data_28: { type: 'number', expression: { kind: 'blackboard', key: 'calc_atb3' } },
      data_29: { type: 'number', expression: { kind: 'blackboard', key: 'atb3' } },
      data_30: { type: 'number', expression: { kind: 'blackboard', key: 'atb_ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const pogranichnikChr_0029_pograni_combo_skill: SkillDefinition = {
  key: 'chr_0029_pograni_combo_skill',
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
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_11' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_17' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_18' } },
    { startFrame: 200, endFrame: 201, sequence: { $sequence: 'findCharacterTeamTargets_18' } },
    { startFrame: 400, endFrame: 401, sequence: { $sequence: 'findCharacterTeamTargets_18' } },
    { startFrame: 600, endFrame: 601, sequence: { $sequence: 'findCharacterTeamTargets_18' } },
    { startFrame: 80, endFrame: 83, sequence: { $sequence: 'markCurrentSkillCanInterrupt_22' } },
    { startFrame: 191, endFrame: 194, sequence: { $sequence: 'finishTimeline_23' } },
    { startFrame: 280, endFrame: 283, sequence: { $sequence: 'markCurrentSkillCanInterrupt_22' } },
    { startFrame: 391, endFrame: 394, sequence: { $sequence: 'finishTimeline_23' } },
    { startFrame: 450, endFrame: 453, sequence: { $sequence: 'markCurrentSkillCanInterrupt_22' } },
    { startFrame: 545, endFrame: 548, sequence: { $sequence: 'finishTimeline_23' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 37, endFrame: 40, sequence: { $sequence: 'calculateActionValue_36' } },
    { startFrame: 61, endFrame: 64, sequence: { $sequence: 'calculateActionValue_40' } },
    { startFrame: 223, endFrame: 226, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 237, endFrame: 240, sequence: { $sequence: 'calculateActionValue_36' } },
    { startFrame: 261, endFrame: 264, sequence: { $sequence: 'calculateActionValue_53' } },
    { startFrame: 423, endFrame: 426, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 437, endFrame: 440, sequence: { $sequence: 'calculateActionValue_36' } },
    { startFrame: 623, endFrame: 626, sequence: { $sequence: 'calculateActionValue_32' } },
    { startFrame: 0, endFrame: 21, sequence: { $sequence: 'startTimeDilation_68' } },
    { startFrame: 200, endFrame: 221, sequence: { $sequence: 'startTimeDilation_68' } },
    { startFrame: 400, endFrame: 418, sequence: { $sequence: 'startTimeDilation_70' } },
    { startFrame: 600, endFrame: 619, sequence: { $sequence: 'startTimeDilation_71' } },
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
      findCharacterTeamTargets_2: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      setIgnoreGlobalTimeScale_4: {
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
      setIgnoreGlobalTimeScale_5: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae3' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_4',
      },
      setIgnoreGlobalTimeScale_6: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae2' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_5',
      },
      setIgnoreGlobalTimeScale_7: {
        action: {
          kind: 'setIgnoreGlobalTimeScale',
          parameters: {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae1' }],
            ignore: true,
            revertOnEnd: true,
          },
        },
        next: 'setIgnoreGlobalTimeScale_6',
      },
      spawnAbilityEntity_8: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae4',
          },
        },
        next: 'setIgnoreGlobalTimeScale_7',
      },
      spawnAbilityEntity_9: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae3',
          },
        },
        next: 'spawnAbilityEntity_8',
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae2',
          },
        },
        next: 'spawnAbilityEntity_9',
      },
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae1',
          },
        },
        next: 'spawnAbilityEntity_10',
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
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
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
      finishCurrentAbilityEntity_16: {
        action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
        next: null,
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
            reason: 'other',
          },
        },
        next: null,
      },
      forEachContextTarget_18: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'soldiers' },
          body: { $sequence: 'finishCurrentAbilityEntity_16' },
        },
        next: 'finishBuffsById_17',
      },
      findOwnerSpawnedAbilityEntities_19: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'soldiers',
            abilityEntityIds: ['abilityentity_chr_0029_pograni_ultimate_skill'],
          },
        },
        next: 'forEachContextTarget_18',
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 74, endFrame: 77, sequence: { $sequence: 'spawnAbilityEntity_11' } },
    { startFrame: 76, endFrame: 82, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'hideUi_14' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'startUltimateTimeDilation_15' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_19' } },
  ],
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
            buffId: 'buff_chr_0029_pograni_talent1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              atk_up: 'atk_up',
              physpell_up: 'physpell_up',
              max_stack: 'max_stack_owner',
            },
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'calculateActionValue_3' },
        },
        next: null,
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
        next: 'conditional_4',
      },
      storeEventSpGainAmount_6: {
        action: { kind: 'storeEventSpGainAmount', parameters: { outputKey: 'atb_contain_temp' } },
        next: 'modifyActionValue_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'storeEventSpGainAmount_6' },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_talent1_exist',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: {
              atk_up: { kind: 'valueNode', nodeId: 'data_8' },
              max_stack_owner: { kind: 'valueNode', nodeId: 'data_9' },
              physpell_up: { kind: 'valueNode', nodeId: 'data_10' },
            },
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
    max_stack_team: [3, 3],
    physpell_up: [4, 8],
  },
  enableSequence: { $sequence: 'applyBuff_8' },
  actionGraph: pogranichnikPassive1ActionGraph,
  abilityEventResponses: [
    { event: 'skillSpGained', priority: 0, sequence: { $sequence: 'conditional_7' } },
  ],
};

const pogranichnikComboCondition1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_combo_skill_count2',
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
            buffId: 'buff_chr_0029_pograni_combo_skill_count1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_combo_skill_count3',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
          whenFalse: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_combo_skill_count4',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_3' },
          whenFalse: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_5' },
          whenFalse: { $sequence: 'conditional_6' },
        },
        next: null,
      },
      readBuffStackCount_8: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'eventTarget',
            outputKey: 'EntityBB_noguard_count',
            query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
          },
        },
        next: 'conditional_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'readBuffStackCount_8' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_9' },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'conditional_10' },
        },
        next: null,
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 3 },
        },
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
          operator: 'equal',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy', 'enemyPart'],
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          contextKey: 'trigger',
          buffIds: ['buff_physical_no_guard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: {
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
  sequence: { $sequence: 'conditional_11' },
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
    visible: true,
    iconId: 'icon_battle_pograni_talent_1',
    iconPath: '/icons/icon_battle_pograni_talent_1.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
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
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura',
            target: 'enemy',
            source: 'buffOwner',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              atk_scale_trigger: { kind: 'valueNode', nodeId: 'data_2' },
              atk_scale_final: { kind: 'valueNode', nodeId: 'data_3' },
              atb_trigger: { kind: 'valueNode', nodeId: 'data_4' },
              atb_final: { kind: 'valueNode', nodeId: 'data_5' },
              poise_final: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_count',
            target: 'buffSource',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_7' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
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
    atk_scale_rush: 0,
    atk_scale_trigger: 0,
    count: 5,
    duration: 20,
    poise_final: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'applyBuff_2' },
    enable: { $sequence: 'applyBuff_1' },
    finish: { $sequence: 'finishBuffsById_3' },
  },
  actionGraph: pogranichnikBuff8ActionGraph,
};

const pogranichnikBuff9ActionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_talent1',
            target: 'eventSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration_temp',
              atk_up: 'atk_up_temp',
              physpell_up: 'physpell_up_temp',
              max_stack: 'max_stack_team_temp',
            },
          },
        },
        next: null,
      },
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_talent1',
            target: 'eventSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration_temp',
              atk_up: 'atk_up_temp',
              physpell_up: 'physpell_up_temp',
              max_stack: 'max_stack_owner_temp',
            },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
          whenFalse: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      readBuffBlackboard_4: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_team',
            outputKey: 'max_stack_team_temp',
          },
        },
        next: 'conditional_3',
      },
      readBuffBlackboard_5: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_owner',
            outputKey: 'max_stack_owner_temp',
          },
        },
        next: 'readBuffBlackboard_4',
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'physpell_up',
            outputKey: 'physpell_up_temp',
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
            desiredKey: 'atk_up',
            outputKey: 'atk_up_temp',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      readBuffBlackboard_8: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
            desiredKey: 'duration',
            outputKey: 'duration_temp',
          },
        },
        next: 'readBuffBlackboard_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'readBuffBlackboard_8' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_9' },
        },
        next: null,
      },
      createTimedMarker_11: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffSource',
            markerId: 'chr_0029_pograni_soldier_attacked',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_4' },
            autoFinishByAction: false,
          },
        },
        next: 'conditional_10',
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale_final: 'atk_scale_final',
              atb_final: 'atb_final',
              poise_final: 'poise_final',
            },
          },
        },
        next: 'createTimedMarker_11',
      },
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_12',
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'finishBuffsById_13' },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'conditional_14' },
        },
        next: null,
      },
      finishBuffsById_27: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createTimedMarker_11',
      },
      spawnAbilityEntity_28: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: 'finishBuffsById_27',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_28' },
        },
        next: null,
      },
      conditional_30: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
          whenTrue: { $sequence: 'conditional_29' },
        },
        next: null,
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_talent1',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration_temp',
              atk_up: 'atk_up_temp',
              physpell_up: 'physpell_up_temp',
              max_stack: 'max_stack_owner_temp',
            },
          },
        },
        next: null,
      },
      readBuffBlackboard_32: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'max_stack_owner',
            outputKey: 'max_stack_owner_temp',
          },
        },
        next: 'applyBuff_31',
      },
      readBuffBlackboard_33: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'physpell_up',
            outputKey: 'physpell_up_temp',
          },
        },
        next: 'readBuffBlackboard_32',
      },
      readBuffBlackboard_34: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
            desiredKey: 'atk_up',
            outputKey: 'atk_up_temp',
          },
        },
        next: 'readBuffBlackboard_33',
      },
      readBuffBlackboard_35: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffSource',
            query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
            desiredKey: 'duration',
            outputKey: 'duration_temp',
          },
        },
        next: 'readBuffBlackboard_34',
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'readBuffBlackboard_35' },
        },
        next: null,
      },
      conditional_37: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
          whenTrue: { $sequence: 'conditional_36' },
        },
        next: null,
      },
      createTimedMarker_38: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffSource',
            markerId: 'chr_0029_pograni_soldier_attacked',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_13' },
            autoFinishByAction: false,
          },
        },
        next: 'conditional_37',
      },
      applyBuff_39: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale_final: 'atk_scale_final',
              atb_final: 'atb_final',
              poise_final: 'poise_final',
            },
          },
        },
        next: 'createTimedMarker_38',
      },
      finishBuffsById_40: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_39',
      },
      conditional_41: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
          whenTrue: { $sequence: 'finishBuffsById_40' },
        },
        next: null,
      },
      conditional_42: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
          whenTrue: { $sequence: 'conditional_41' },
        },
        next: null,
      },
      conditional_43: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
          whenTrue: { $sequence: 'conditional_42' },
        },
        next: null,
      },
      conditional_44: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
          whenTrue: { $sequence: 'conditional_43' },
        },
        next: null,
      },
      finishBuffsById_53: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createTimedMarker_38',
      },
      spawnAbilityEntity_54: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: 'finishBuffsById_53',
      },
      conditional_55: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_54' },
        },
        next: null,
      },
      conditional_56: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
          whenTrue: { $sequence: 'conditional_55' },
        },
        next: null,
      },
      conditional_57: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
          whenTrue: { $sequence: 'conditional_56' },
        },
        next: null,
      },
      conditional_58: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_23' } },
          whenTrue: { $sequence: 'conditional_57' },
        },
        next: null,
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
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_6' } },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'greater',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_10: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_9' } },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent1_exist'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_talent2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'interval' } },
      data_14: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'equal',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_16: { type: 'boolean', expression: { kind: 'eventSourceMatchesBuffSource' } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_17' } },
      },
      data_19: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffSource',
          buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
          operator: 'greater',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_21: { type: 'boolean', expression: { kind: 'eventSourceMatchesBuffSource' } },
      data_22: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffSource',
          markerId: 'chr_0029_pograni_soldier_attacked',
        },
      },
      data_23: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_22' } },
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
      sequence: { $sequence: 'conditional_15' },
    },
    {
      event: 'beforeTakePhysicalInfliction',
      priority: 0,
      sequence: { $sequence: 'conditional_30' },
    },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_44' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_58' } },
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
    visible: true,
    iconId: 'icon_battle_pograni_buff',
    iconPath: '/icons/icon_battle_pograni_buff.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
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
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      startTimeDilation_5: {
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
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'startTimeDilation_5' } },
  ],
  actionGraph: pogranichnikBuff11ActionGraph,
};

export const pogranichnik: OperatorDefinition = {
  slug: 'pogranichnik',
  gameId: 'POGRANICHNK',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
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
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
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
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: pogranichnikChr_0029_pograni_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: pogranichnikChr_0029_pograni_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: pogranichnikChr_0029_pograni_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: pogranichnikChr_0029_pograni_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'has_potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
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
          skillGroupKey: 'ultimate',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
                finishActionOwnerAbilityEntity_1: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0029_pograni_ultimate_skill',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                        atk_scale_trigger: 'atk_scale_trigger',
                        atk_scale_final: 'atk_scale_final',
                        atb_trigger: 'atb_trigger',
                        atb_final: 'atb_final',
                        poise_final: 'poise_final',
                      },
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
            atk_scale_rush: 1,
            atk_scale_trigger: 0,
            duration: 20,
            poise_final: 0,
            radius: 5,
          },
          scheduledSequences: [
            {
              startFrame: 50,
              endFrame: 53,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
            },
            { startFrame: 3, endFrame: 17, sequence: { $sequence: 'conditional_3' } },
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
          blackboard: {
            atb_trigger: 10,
            atk_scale_trigger: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            radius: 5,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_7' } },
            {
              startFrame: 59,
              endFrame: 62,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_8' },
            },
            {
              startFrame: 157,
              endFrame: 160,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_8' },
            },
            {
              startFrame: 257,
              endFrame: 260,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_8' },
            },
            {
              startFrame: 357,
              endFrame: 360,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_8' },
            },
            {
              startFrame: 9,
              endFrame: 13,
              sequence: { $sequence: 'changeResourceByActionValue_14' },
            },
            {
              startFrame: 108,
              endFrame: 112,
              sequence: { $sequence: 'changeResourceByActionValue_17' },
            },
            {
              startFrame: 209,
              endFrame: 213,
              sequence: { $sequence: 'changeResourceByActionValue_20' },
            },
            {
              startFrame: 307,
              endFrame: 311,
              sequence: { $sequence: 'changeResourceByActionValue_23' },
            },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_24' } },
            { startFrame: 100, endFrame: 103, sequence: { $sequence: 'startTimeDilation_24' } },
            { startFrame: 200, endFrame: 203, sequence: { $sequence: 'startTimeDilation_24' } },
            { startFrame: 300, endFrame: 303, sequence: { $sequence: 'startTimeDilation_24' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                jumpTimeline_1: {
                  action: { kind: 'jumpTimeline', parameters: { destinationFrame: 300 } },
                  next: null,
                },
                conditional_3: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_1' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'jumpTimeline_1' },
                  },
                  next: null,
                },
                jumpTimeline_2: {
                  action: { kind: 'jumpTimeline', parameters: { destinationFrame: 200 } },
                  next: null,
                },
                conditional_5: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_2' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'jumpTimeline_2' },
                    whenFalse: { $sequence: 'conditional_3' },
                  },
                  next: null,
                },
                jumpTimeline_4: {
                  action: { kind: 'jumpTimeline', parameters: { destinationFrame: 100 } },
                  next: null,
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_3' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'jumpTimeline_4' },
                    whenFalse: { $sequence: 'conditional_5' },
                  },
                  next: null,
                },
                conditional_7: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_4' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: null },
                    whenFalse: { $sequence: 'conditional_6' },
                  },
                  next: null,
                },
                finishActionOwnerAbilityEntity_8: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                startTimeDilation_12: {
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
                dealDamage_13: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_13/action',
                  },
                  next: 'startTimeDilation_12',
                },
                changeResourceByActionValue_14: {
                  action: {
                    kind: 'changeResourceByActionValue',
                    parameters: {
                      resource: 'sp',
                      amount: { kind: 'valueNode', nodeId: 'data_6' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    },
                  },
                  next: 'dealDamage_13',
                },
                dealDamage_16: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_16/action',
                  },
                  next: 'startTimeDilation_12',
                },
                changeResourceByActionValue_17: {
                  action: {
                    kind: 'changeResourceByActionValue',
                    parameters: {
                      resource: 'sp',
                      amount: { kind: 'valueNode', nodeId: 'data_8' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    },
                  },
                  next: 'dealDamage_16',
                },
                dealDamage_19: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_9' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_19/action',
                  },
                  next: 'startTimeDilation_12',
                },
                changeResourceByActionValue_20: {
                  action: {
                    kind: 'changeResourceByActionValue',
                    parameters: {
                      resource: 'sp',
                      amount: { kind: 'valueNode', nodeId: 'data_10' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    },
                  },
                  next: 'dealDamage_19',
                },
                dealDamage_22: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_11' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/actionGraph/main/nodes/dealDamage_22/action',
                  },
                  next: 'startTimeDilation_12',
                },
                changeResourceByActionValue_23: {
                  action: {
                    kind: 'changeResourceByActionValue',
                    parameters: {
                      resource: 'sp',
                      amount: { kind: 'valueNode', nodeId: 'data_12' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    },
                  },
                  next: 'dealDamage_22',
                },
                startTimeDilation_24: {
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
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 2 },
                  },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 3 },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 4 },
                  },
                },
                data_4: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 5 },
                  },
                },
                data_5: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_trigger' },
                },
                data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
                data_7: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_trigger' },
                },
                data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
                data_9: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_trigger' },
                },
                data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
                data_11: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_trigger' },
                },
                data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb_trigger' } },
              },
            },
            macros: {},
          },
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish1: {
          actionGraph: {
            main: {
              nodes: {
                finishActionOwnerAbilityEntity_1: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                startTimeDilation_2: {
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
                changeResourceByActionValue_3: {
                  action: {
                    kind: 'changeResourceByActionValue',
                    parameters: {
                      resource: 'sp',
                      amount: { kind: 'valueNode', nodeId: 'data_1' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    },
                  },
                  next: 'startTimeDilation_2',
                },
                dealDamage_4: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['ultimateSkill'],
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish1/actionGraph/main/nodes/dealDamage_4/action',
                  },
                  next: 'changeResourceByActionValue_3',
                },
                startTimeDilation_5: {
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
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 10,
            atk_scale: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            radius: 5,
          },
          scheduledSequences: [
            {
              startFrame: 36,
              endFrame: 46,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
            },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_4' } },
            { startFrame: 0, endFrame: 14, sequence: { $sequence: 'startTimeDilation_5' } },
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish2: {
          actionGraph: {
            main: {
              nodes: {
                finishActionOwnerAbilityEntity_1: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
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
                      spGainSource: 'skill',
                    },
                  },
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
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish2/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: 'changeResourceByActionValue_2',
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 10,
            atk_scale: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            radius: 5,
          },
          scheduledSequences: [
            {
              startFrame: 36,
              endFrame: 46,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
            },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_3' } },
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish3: {
          actionGraph: {
            main: {
              nodes: {
                finishActionOwnerAbilityEntity_1: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
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
                      spGainSource: 'skill',
                    },
                  },
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
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish3/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: 'changeResourceByActionValue_2',
                },
              },
              dataNodes: {
                data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish3',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 65,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb: 10,
            atk_scale: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            radius: 5,
          },
          scheduledSequences: [
            {
              startFrame: 36,
              endFrame: 46,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
            },
            { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_3' } },
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish4: {
          actionGraph: {
            main: {
              nodes: {
                finishActionOwnerAbilityEntity_1: {
                  action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                  next: null,
                },
                finishBuffsById_2: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'caster',
                      buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                dealDamage_3: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                    key: 'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish1|chr_0029_pograni_ultimate_skill_abilityentity_finish2|chr_0029_pograni_ultimate_skill_abilityentity_finish3|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish4/actionGraph/main/nodes/dealDamage_3/action',
                  },
                  next: null,
                },
                createTimedMarker_4: {
                  action: {
                    kind: 'createTimedMarker',
                    parameters: {
                      target: 'caster',
                      markerId: 'chr_0029_pograni_ultimate_finalhit',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                    },
                  },
                  next: 'dealDamage_3',
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
                      spGainSource: 'skill',
                    },
                  },
                  next: 'createTimedMarker_4',
                },
                conditional_6: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: { kind: 'conditionNode', nodeId: 'data_5' },
                      alwaysNext: true,
                    },
                    whenTrue: { $sequence: 'changeResourceByActionValue_5' },
                  },
                  next: null,
                },
                startTimeDilation_7: {
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
                    target: 'caster',
                    markerId: 'chr_0029_pograni_ultimate_finalhit',
                  },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'not',
                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 81,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 50,
            atk_scale_final: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            poise_final: 0,
            radius: 5,
          },
          scheduledSequences: [
            {
              startFrame: 75,
              endFrame: 78,
              sequence: { $sequence: 'finishActionOwnerAbilityEntity_1' },
            },
            { startFrame: 31, endFrame: 38, sequence: { $sequence: 'finishBuffsById_2' } },
            { startFrame: 25, endFrame: 52, sequence: { $sequence: 'conditional_6' } },
            { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_7' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default pogranichnik;
