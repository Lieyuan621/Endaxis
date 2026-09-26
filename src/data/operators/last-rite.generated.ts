/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const lastRiteChr_0026_lastrite_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack2'] },
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

export const lastRiteChr_0026_lastrite_attack1: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_attack1ActionGraph,
  key: 'chr_0026_lastrite_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    env_dmg: 20,
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 171,
  exclusiveFrame: 25,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 35,
        input: 'basicAttack',
        targetSkillId: 'chr_0026_lastrite_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 35, skillIds: ['chr_0026_lastrite_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 20, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0026_lastrite_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lastRiteChr_0026_lastrite_attack2ActionGraph = {
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
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.067 },
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack3'] },
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

export const lastRiteChr_0026_lastrite_attack2: SkillDefinition = {
  key: 'chr_0026_lastrite_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
    env_dmg: 12.5,
    display_atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
  timelineBlockFrames: 29,
  naturalDurationFrames: 175,
  exclusiveFrame: 34,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0026_lastrite_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 29, endFrame: 44, skillIds: ['chr_0026_lastrite_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 29, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0026_lastrite_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack2ActionGraph,
};

export const lastRiteChr_0026_lastrite_attack3ActionGraph = {
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
      startTimeDilation_2: {
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
        next: 'changeResourceByActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_6: {
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
                  value: 0.3,
                  inTangent: 0.1907342,
                  outTangent: 0.1907342,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5,
                  value: 0.03,
                  inTangent: 0.008590988,
                  outTangent: 0.28,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.75,
                  value: 0.1,
                  inTangent: 0.4178908,
                  outTangent: 0.4481447,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.5,
                  inTangent: 3.019252,
                  outTangent: 3.019252,
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack3: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_attack3ActionGraph,
  key: 'chr_0026_lastrite_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
    env_dmg: 10,
    display_atk_scale: [0.68, 0.75, 0.82, 0.88, 0.95, 1.02, 1.09, 1.16, 1.22, 1.31, 1.41, 1.53],
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 230,
  exclusiveFrame: 47,
  offsetRecordFrame: 29,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 48,
        input: 'basicAttack',
        targetSkillId: 'chr_0026_lastrite_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 36, endFrame: 48, skillIds: ['chr_0026_lastrite_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 26, endFrame: 28, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 36, endFrame: 48, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0026_lastrite_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lastRiteChr_0026_lastrite_attack4ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isBuffed',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_1' },
        },
        next: null,
      },
      changeResourceByActionValue_5: {
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
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_5' },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_6',
      },
      startTimeDilation_8: {
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
                  value: 0.3,
                  inTangent: -0.956214,
                  outTangent: -0.956214,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1934154,
                  value: 0.1150535,
                  inTangent: -0.5494284,
                  outTangent: -0.5494284,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: -0.1426428,
                  outTangent: -0.1426428,
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
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_8' },
        },
        next: null,
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack1'] },
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
          buffIds: ['buff_chr_0026_lastrite_normal_skill'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
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
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack4: SkillDefinition = {
  key: 'chr_0026_lastrite_attack4',
  blackboard: {
    atb: 30,
    atk_scale: [0.9, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03],
    atk_scale2: 0.2,
    env_dmg: 35,
    isBuffed: 0,
    poise: 25,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 182,
  exclusiveFrame: 54,
  offsetRecordFrame: 21,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 54,
        input: 'basicAttack',
        targetSkillId: 'chr_0026_lastrite_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 46, endFrame: 54, skillIds: ['chr_0026_lastrite_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 22, endFrame: 23, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 46, endFrame: 54, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  timelineContinuationSkillId: 'chr_0026_lastrite_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack4ActionGraph,
};

export const lastRiteChr_0026_lastrite_power_attackActionGraph = {
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
            curve: { kind: 'named', key: 'common' },
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
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_3',
      },
      applyBuff_5: {
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
      applyBuff_6: {
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
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_power_attack: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_power_attackActionGraph,
  key: 'chr_0026_lastrite_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 40,
  naturalDurationFrames: 176,
  exclusiveFrame: 58,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 40,
        endFrame: 58,
        skillIds: ['chr_0026_lastrite_normal_skill', 'chr_0026_lastrite_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 41, endFrame: 42, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 40, endFrame: 40, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 58, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const lastRiteChr_0026_lastrite_plunging_attack_endActionGraph = {
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
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
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

export const lastRiteChr_0026_lastrite_plunging_attack_end: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_plunging_attack_endActionGraph,
  key: 'chr_0026_lastrite_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 133,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 9,
  scheduledSequences: [{ startFrame: 2, endFrame: 3, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lastRiteChr_0026_lastrite_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_inattack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              atk_scale: { kind: 'valueNode', nodeId: 'data_1' },
              duration: { kind: 'valueNode', nodeId: 'data_2' },
              atb: { kind: 'valueNode', nodeId: 'data_3' },
              atk_up: { kind: 'valueNode', nodeId: 'data_4' },
              poise: { kind: 'valueNode', nodeId: 'data_5' },
              potential_1: { kind: 'valueNode', nodeId: 'data_6' },
              usp: { kind: 'valueNode', nodeId: 'data_7' },
            },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ns_atb',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ns_atkscale2',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'modifyActionValue_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_ns_atkscale1',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'modifyActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'modifyActionValue_4',
      },
      jumpTimeline_6: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 300,
            condition: { kind: 'conditionNode', nodeId: 'data_12' },
          },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_7: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      jumpTimeline_8: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 429 } },
        next: null,
      },
      findCharacterTeamTargets_9: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_main_start',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
              usp: 'usp',
            },
          },
        },
        next: null,
      },
      launchProjectile_11: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', source: 'actionOwner', recycleDelaySeconds: 1 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                actionGraph: { main: { nodes: {} }, macros: {} },
                skillId: 'chr_0026_lastrite_normal_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_12: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_11' },
        },
        next: null,
      },
      changeResourceByActionValue_13: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_14: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'changeResourceByActionValue_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_self',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
              poise: 'poise',
            },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_14',
      },
      finishBuffsById_16: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'party',
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          },
        },
        next: 'applyBuff_15',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_12: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_11' } },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_normal_skill: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_normal_skillActionGraph,
  key: 'chr_0026_lastrite_normal_skill',
  blackboard: {
    atb: 30,
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    atk_up: 0.2,
    duration: 15,
    poise: 5,
    potential_1: 0,
    usp: 16,
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 429,
  exclusiveFrame: 373,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 34,
        endFrame: 51,
        skillIds: [
          'chr_0026_lastrite_attack1',
          'chr_0026_lastrite_attack2',
          'chr_0026_lastrite_attack3',
          'chr_0026_lastrite_attack4',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'modifyActionValue_5' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'jumpTimeline_6' } },
    { startFrame: 51, endFrame: 52, sequence: { $sequence: 'markCurrentSkillCanInterrupt_7' } },
    { startFrame: 187, endFrame: 188, sequence: { $sequence: 'jumpTimeline_8' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'findCharacterTeamTargets_9' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'applyBuff_10' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'withActionBlackboardScope_12' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'finishBuffsById_16' } },
  ],
  switchToBuffCast: {
    currentSkillTypes: ['basicAttack'],
    requiresCurrentSkillNotInterruptible: true,
    condition: { kind: 'casterControlled' },
    asSkillCast: true,
    sequence: { $sequence: 'applyBuff_1' },
  },
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const lastRiteChr_0026_lastrite_ultimate_skillActionGraph = {
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
          parameters: { saveToContextKey: 'mainchr', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      startUltimateTimeDilation_3: {
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
      hideUi_4: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_5: {
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
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            instantAttributeModifiers: [
              {
                targetSide: 'defender',
                attribute: 'cryoVulnerabilityIncrease',
                slot: 'baseFinalMultiplier',
                value: { kind: 'valueNode', nodeId: 'data_4' },
                attributeTiming: 'runtime',
              },
            ],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'dealDamage_6' },
          whenFalse: { $sequence: 'dealDamage_7' },
        },
        next: null,
      },
      repeatEachTick_9: {
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
          body: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: null,
      },
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            instantAttributeModifiers: [
              {
                targetSide: 'defender',
                attribute: 'cryoVulnerabilityIncrease',
                slot: 'baseFinalMultiplier',
                value: { kind: 'valueNode', nodeId: 'data_11' },
                attributeTiming: 'runtime',
              },
            ],
            stagger: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'dealDamage_14' },
          whenFalse: { $sequence: 'dealDamage_15' },
        },
        next: null,
      },
      repeatEachTick_17: {
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
          body: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.1 },
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
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'talent_2', fallback: 0 } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'talent_2', fallback: 0 } },
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

export const lastRiteChr_0026_lastrite_ultimate_skill: SkillDefinition = {
  key: 'chr_0026_lastrite_ultimate_skill',
  blackboard: {
    atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale2: [3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8],
    poise1: 5,
    poise2: 10,
    rate: 0,
    talent_2: 0,
  },
  timelineBlockFrames: 171,
  naturalDurationFrames: 360,
  exclusiveFrame: 170,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 86,
        endFrame: 170,
        input: 'basicAttack',
        targetSkillId: 'chr_0026_lastrite_combo_skill',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 140,
        endFrame: 170,
        skillIds: ['chr_0026_lastrite_normal_skill', 'chr_0026_lastrite_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'hideUi_4' } },
    { startFrame: 0, endFrame: 172, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 86, endFrame: 89, sequence: { $sequence: 'repeatEachTick_9' } },
    { startFrame: 105, endFrame: 108, sequence: { $sequence: 'repeatEachTick_9' } },
    { startFrame: 134, endFrame: 137, sequence: { $sequence: 'repeatEachTick_17' } },
    { startFrame: 86, endFrame: 86, sequence: { $sequence: 'startTimeDilation_18' } },
    { startFrame: 85, endFrame: 145, sequence: { $sequence: 'startTimeDilation_19' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 240 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: lastRiteChr_0026_lastrite_ultimate_skillActionGraph,
};

export const lastRiteChr_0026_lastrite_combo_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'recover_usp',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResourceByActionValue_2: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'valueNode', nodeId: 'data_2' },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: 'modifyActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
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
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: 'conditional_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
          },
        },
        next: 'changeResourceByActionValue_4',
      },
      readBuffStackCount_6: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'infliction_num',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'dealDamage_5',
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
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'finishBuffsByTag_7',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'dealDamage_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'infliction_num_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'dealDamage_9',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_combo_atkscale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'modifyActionValue_10',
      },
      readBuffStackCount_12: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'infliction_num',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'calculateActionValue_11',
      },
      forEachContextTarget_13: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'readBuffStackCount_12' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_combo_skill_hitstop',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      changeResourceByActionValue_15: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_12' },
            coefficient: { kind: 'constant', value: 4 },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      changeResourceByActionValue_16: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_13' },
            coefficient: { kind: 'valueNode', nodeId: 'data_14' },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_15' },
          whenFalse: { $sequence: 'changeResourceByActionValue_16' },
        },
        next: null,
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
        },
        next: null,
      },
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.333 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_20: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'current',
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp_base' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'final_combo_atkscale' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num_total' } },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'infliction_num_total', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'recover_usp', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_combo_skill: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_combo_skillActionGraph,
  key: 'chr_0026_lastrite_combo_skill',
  blackboard: {
    atb: 0,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale2: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale3: [1.07, 1.17, 1.28, 1.39, 1.49, 1.6, 1.71, 1.81, 1.92, 2.05, 2.21, 2.4],
    final_combo_atkscale: 0,
    infliction_num: 0,
    infliction_num_total: 0,
    poise: 15,
    recover_usp: 0,
    usp: 15,
    usp_base: 40,
  },
  timelineBlockFrames: 91,
  naturalDurationFrames: 216,
  exclusiveFrame: 90,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 65, endFrame: 91, skillIds: ['chr_0026_lastrite_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'readBuffStackCount_6' } },
    { startFrame: 63, endFrame: 63, sequence: { $sequence: 'forEachContextTarget_13' } },
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 63, endFrame: 63, sequence: { $sequence: 'conditional_18' } },
    { startFrame: 64, endFrame: 64, sequence: { $sequence: 'startTimeDilation_19' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_20' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const lastRiteCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: lastRiteCommon_character_perfect_dodgeActionGraph,
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

const lastRitePassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_passive',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRitePassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0026_lastrite_passive',
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: lastRitePassive1ActionGraph,
};

const lastRiteComboCondition1ActionGraph = {
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
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0026_lastrite_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: lastRiteComboCondition1ActionGraph,
};

const lastRiteBuff1ActionGraph = {
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
            targets: ['enemy'],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'startTimeDilation_1' } },
  actionGraph: lastRiteBuff1ActionGraph,
};

const lastRiteBuff2ActionGraph = {
  main: {
    nodes: {
      dealStagger_1: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'dealStagger_1' },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_2' },
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_tag',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_phantom',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_scale: 'atk_scale' },
          },
        },
        next: 'applyBuff_8',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_phantom_main',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_scale1: 'atk_scale' },
          },
        },
        next: 'applyBuff_8',
      },
      createTimedMarker_10: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_7' },
          whenFalse: { $sequence: 'applyBuff_9' },
        },
        next: 'createTimedMarker_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_11' },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'conditional_12' },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'conditional_13' },
        },
        next: null,
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
          whenTrue: { $sequence: 'conditional_14' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'current',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0026_lastrite'],
        },
      },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_10' } },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'current',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_lastrite_buff',
    iconPath: '/icons/icon_battle_lastrite_buff.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: true,
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
  blackboard: { atb: 30, atk_scale: 3, atk_up: 0, duration: 15, poise: 0, potential_1: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: {
        kind: 'all',
        conditions: [
          { kind: 'casterControlled' },
          { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalAttackLastCombo'] },
          {
            kind: 'buffBlackboardCompare',
            left: { blackboardKey: 'potential_1' },
            operator: 'equal',
            right: 1,
          },
        ],
      },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'normal',
          addition: { blackboardKey: 'atk_up' },
        },
      ],
    },
  ],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_5' } },
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_15' } },
  ],
  actionGraph: lastRiteBuff2ActionGraph,
};

const lastRiteBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_self',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              poise: 'poise',
              potential_1: 'potential_1',
            },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'party',
            buffIds: ['buff_chr_0026_lastrite_normal_skill'],
            reason: 'other',
          },
        },
        next: 'applyBuff_1',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'finishBuffsById_2',
      },
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_5: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'changeResourceByActionValue_4',
      },
      withActionBlackboardScope_6: {
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
          body: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_5' },
        },
        next: null,
      },
      withActionBlackboardScope_7: {
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
          body: { $sequence: 'modifyActionValue_3' },
        },
        next: 'withActionBlackboardScope_6',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff3: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: ['Status/DisableNormalSkill'],
  extendTags: [],
  blackboard: { atb: 0, atk_scale: 0, atk_up: 0, duration: 0, poise: 0, potential_1: 0, usp: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_7' } },
  actionGraph: lastRiteBuff3ActionGraph,
};

const lastRiteBuff4ActionGraph = {
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
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_2: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'changeResourceByActionValue_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill_self',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
            },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'party',
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          },
        },
        next: 'applyBuff_3',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1.5,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 0, atk_scale: 0, atk_up: 0, duration: 0, potential_1: 0, usp: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 26, endFrame: 27, sequence: { $sequence: 'finishBuffsById_4' } },
  ],
  actionGraph: lastRiteBuff4ActionGraph,
};

const lastRiteBuff5ActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'main', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['controlled'],
          },
        },
        next: 'dealDamage_2',
      },
      applyElementalInfliction_4: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'startTimeDilation_3',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'applyElementalInfliction_4' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_2' } },
  ],
  actionGraph: lastRiteBuff5ActionGraph,
};

const lastRiteBuff6ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.33 },
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
            targets: ['caster'],
          },
        },
        next: 'dealDamage_1',
      },
      applyElementalInfliction_3: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'startTimeDilation_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale1: 0, atk_scale2: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'applyElementalInfliction_3' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_1' } },
  ],
  actionGraph: lastRiteBuff6ActionGraph,
};

const lastRiteBuff7ActionGraph = {
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
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_normal_skill',
            target: 'party',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              atk_scale: 'atk_scale',
              atb: 'atb',
              poise: 'poise',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
            },
          },
        },
        next: 'changeResourceByActionValue_1',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 0, atk_scale: 0, atk_up: 0, duration: 0, poise: 0, potential_1: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_2' } },
  actionGraph: lastRiteBuff7ActionGraph,
};

const lastRiteBuff8ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'party',
            buffIds: ['buff_chr_0026_lastrite_normal_skill'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'finishBuffsById_2' },
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
          buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
  ],
  actionGraph: lastRiteBuff8ActionGraph,
};

const lastRiteBuff9ActionGraph = {
  main: {
    nodes: {
      restrictUltimateEnergyRecovery_1: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0026_lastrite'],
            clearUltimateEnergyOnEnd: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff9: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'restrictUltimateEnergyRecovery_1' } },
  actionGraph: lastRiteBuff9ActionGraph,
};

const lastRiteBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0026_lastrite_talent_1_vul',
            target: 'eventTarget',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { crystal_vul: 'crystal_vul', duration: 'duration' },
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'crystal_vul',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'applyBuff_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'crystal_up' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventConsumedBuffLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          outputKey: 'infliction_num',
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff10: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { crystal_up: 0, crystal_vul: 0, duration: 0, infliction_num: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'buffConsumed', priority: 0, sequence: { $sequence: 'conditional_4' } },
  ],
  actionGraph: lastRiteBuff10ActionGraph,
};

const lastRiteBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_crystal',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
      readCurrentBuffRemainingDuration_2: {
        action: {
          kind: 'readCurrentBuffRemainingDuration',
          parameters: { outputKey: 'real_duration' },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'real_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'crystal_vul' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lastRiteBuff11: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'crystal_vul' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { crystal_vul: 0, duration: 0, real_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'readCurrentBuffRemainingDuration_2' } },
  actionGraph: lastRiteBuff11ActionGraph,
};

export const lastRite: OperatorDefinition = {
  slug: 'last-rite',
  gameId: 'LASTRITE',
  rarity: 6,
  weaponType: 'greatsword',
  element: 'cryo',
  role: 'striker',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [21, 50, 80, 110, 140, 155],
    agility: [8, 29, 50, 72, 93, 104],
    intellect: [9, 27, 46, 65, 84, 93],
    will: [15, 35, 56, 77, 98, 109],
    baseAttack: [30, 95, 162, 230, 298, 332],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        lastRiteChr_0026_lastrite_attack1,
        lastRiteChr_0026_lastrite_attack2,
        lastRiteChr_0026_lastrite_attack3,
        lastRiteChr_0026_lastrite_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: lastRiteChr_0026_lastrite_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: lastRiteChr_0026_lastrite_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: lastRiteChr_0026_lastrite_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: lastRiteChr_0026_lastrite_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: lastRiteChr_0026_lastrite_combo_skill,
    },
  ],
  dodgeSkill: lastRiteCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0026_lastrite_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0026_lastrite_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0026_lastrite_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0026_lastrite_attack1',
        'chr_0026_lastrite_attack2',
        'chr_0026_lastrite_attack3',
        'chr_0026_lastrite_attack4',
        'chr_0026_lastrite_plunging_attack_end',
        'chr_0026_lastrite_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0026_lastrite_attack1',
        'chr_0026_lastrite_attack2',
        'chr_0026_lastrite_attack3',
        'chr_0026_lastrite_attack4',
      ],
      defaultSkillKey: 'chr_0026_lastrite_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [lastRiteComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0026_lastrite_talent_1',
          blackboardAssignments: { crystal_up: [0.02, 0.04], duration: 15 },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate',
          operation: 'assign',
          value: [1.2, 1.5],
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
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'poise',
          operation: 'assign',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'cryo', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.15,
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_ns_atb: 0, EntityBB_ns_atkscale1: 0, EntityBB_ns_atkscale2: 0 },
  passiveSkills: [lastRitePassive1],
  buffDefinitions: {
    buff_chr_0026_lastrite_combo_skill_hitstop: lastRiteBuff1,
    buff_chr_0026_lastrite_normal_skill: lastRiteBuff2,
    buff_chr_0026_lastrite_normal_skill_inattack: lastRiteBuff3,
    buff_chr_0026_lastrite_normal_skill_main_start: lastRiteBuff4,
    buff_chr_0026_lastrite_normal_skill_phantom: lastRiteBuff5,
    buff_chr_0026_lastrite_normal_skill_phantom_main: lastRiteBuff6,
    buff_chr_0026_lastrite_normal_skill_self: lastRiteBuff7,
    buff_chr_0026_lastrite_normal_skill_tag: lastRiteBuff8,
    buff_chr_0026_lastrite_passive: lastRiteBuff9,
    buff_chr_0026_lastrite_talent_1: lastRiteBuff10,
    buff_chr_0026_lastrite_talent_1_vul: lastRiteBuff11,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default lastRite;
