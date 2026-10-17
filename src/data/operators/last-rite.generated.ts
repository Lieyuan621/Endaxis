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
        next: 'changeResource_2',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
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
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack2'] },
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack1: SkillDefinition = {
  key: 'chr_0026_lastrite_attack1',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
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
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 20, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0026_lastrite_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack1ActionGraph,
};

export const lastRiteChr_0026_lastrite_attack2ActionGraph = {
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
      startTimeDilation_4: {
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
        next: 'changeResource_3',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_7',
      },
      reachSkillOperableBoundary_15: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack3'] },
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack2: SkillDefinition = {
  key: 'chr_0026_lastrite_attack2',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
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
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 29, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_15' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0026_lastrite_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack2ActionGraph,
};

export const lastRiteChr_0026_lastrite_attack3ActionGraph = {
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
      startTimeDilation_4: {
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
        next: 'changeResource_3',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_7',
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
        next: null,
      },
      startTimeDilation_10: {
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
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'ifElse_12' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack4'] },
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack3: SkillDefinition = {
  key: 'chr_0026_lastrite_attack3',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 26, endFrame: 28, sequence: { $sequence: 'ifElse_13' } },
    { startFrame: 36, endFrame: 48, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0026_lastrite_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack3ActionGraph,
};

export const lastRiteChr_0026_lastrite_attack4ActionGraph = {
  main: {
    nodes: {
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
        next: null,
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_12' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_13',
      },
      startTimeDilation_15: {
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
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'startTimeDilation_15' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_17' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_19: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0026_lastrite_attack1'] },
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_attack4: SkillDefinition = {
  key: 'chr_0026_lastrite_attack4',
  element: 'cryo',
  blackboard: {
    atb: 30,
    atk_scale: [0.9, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03],
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
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_14' } },
    { startFrame: 22, endFrame: 23, sequence: { $sequence: 'ifElse_18' } },
    { startFrame: 46, endFrame: 54, sequence: { $sequence: 'reachSkillOperableBoundary_19' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0026_lastrite_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_attack4ActionGraph,
};

export const lastRiteChr_0026_lastrite_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
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
      gainFinisherSp_4: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_5: {
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
        next: 'gainFinisherSp_4',
      },
      applyBuff_6: {
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
      applyBuff_7: {
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_power_attack: SkillDefinition = {
  key: 'chr_0026_lastrite_power_attack',
  element: 'cryo',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 59,
  naturalDurationFrames: 176,
  exclusiveFrame: 58,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
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
    { startFrame: 41, endFrame: 42, sequence: { $sequence: 'ifElse_3' } },
    { startFrame: 40, endFrame: 40, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 58, sequence: { $sequence: 'applyBuff_7' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: lastRiteChr_0026_lastrite_power_attackActionGraph,
};

export const lastRiteChr_0026_lastrite_plunging_attack_endActionGraph = {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_plunging_attack_end: SkillDefinition = {
  key: 'chr_0026_lastrite_plunging_attack_end',
  element: 'cryo',
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
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lastRiteChr_0026_lastrite_plunging_attack_endActionGraph,
};

export const lastRiteChr_0026_lastrite_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_inattack',
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
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: true,
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
            value: { kind: 'valueNode', nodeId: 'data_3' },
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: null,
      },
      invertNextResult_7: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_6',
      },
      jumpTimeline_8: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 300 },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_9: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      jumpTimeline_10: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 429 },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
        },
        next: null,
      },
      findCharacterTeamTargets_11: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_main_start',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  atb: 'atb',
                  atk_up: 'atk_up',
                  potential_1: 'potential_1',
                  usp: 'usp',
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
      launchProjectile_13: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            source: 'actionOwner',
            recycleDelaySeconds: 1,
          },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0026_lastrite_normal_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [],
                actionGraph: { main: { nodes: {} }, macros: {} },
              },
            },
          ],
        },
        next: null,
      },
      changeResource_14: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_14',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_15',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_self',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  atb: 'atb',
                  atk_up: 'atk_up',
                  potential_1: 'potential_1',
                  poise: 'poise',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_16',
      },
      finishBuffsById_18: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'team' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          },
        },
        next: 'applyBuff_17',
      },
      findTargets_19: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'finishBuffsById_18',
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
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'invertNextResult_7' } },
      },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_normal_skill: SkillDefinition = {
  key: 'chr_0026_lastrite_normal_skill',
  element: 'cryo',
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
  dontInterruptCombo: true,
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
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'jumpTimeline_8' } },
    { startFrame: 51, endFrame: 52, sequence: { $sequence: 'markCurrentSkillCanInterrupt_9' } },
    { startFrame: 187, endFrame: 188, sequence: { $sequence: 'jumpTimeline_10' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'findCharacterTeamTargets_11' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'applyBuff_12' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'launchProjectile_13' } },
    { startFrame: 300, endFrame: 301, sequence: { $sequence: 'findTargets_19' } },
  ],
  defaultTarget: 'owner',
  switchToBuffCast: {
    currentSkillTypes: ['basicAttack'],
    requiresCurrentSkillNotInterruptible: true,
    condition: { kind: 'conditionNode', nodeId: 'data_11' },
    asSkillCast: true,
    sequence: { $sequence: 'applyBuff_1' },
  },
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: lastRiteChr_0026_lastrite_normal_skillActionGraph,
};

export const lastRiteChr_0026_lastrite_combo_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_3: {
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
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'valueNode', nodeId: 'data_2' },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: 'modifyActionValue_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'changeResource_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_6: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: 'ifElse_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
          },
        },
        next: 'changeResource_6',
      },
      readBuffStackCount_8: {
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
        next: 'dealDamage_7',
      },
      finishBuffsByTag_9: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            reason: 'early',
          },
        },
        next: null,
      },
      dealDamage_10: {
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
        next: 'finishBuffsByTag_9',
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'dealDamage_10',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'infliction_num_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'dealDamage_11',
      },
      calculateActionValue_13: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_combo_atkscale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_12',
      },
      readBuffStackCount_14: {
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
        next: 'calculateActionValue_13',
      },
      forEachContextTarget_15: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'readBuffStackCount_14' },
        },
        next: null,
      },
      mergeContextTargets_16: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'forEachContextTarget_15',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0026_lastrite_combo_skill_hitstop' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'applyBuff_17' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_21: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'valueNode', nodeId: 'data_11' },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      changeResource_20: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 4 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'changeResource_20' },
          whenFalse: { $sequence: 'changeResource_21' },
        },
        next: null,
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
          whenTrue: { $sequence: 'ifElse_23' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_25: {
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
      ifElse_26: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'startTimeDilation_25' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_27: {
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
          target: { kind: 'fixed', target: 'enemy' },
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
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'infliction_num_total' } },
      data_12: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'infliction_num_total', fallback: 0 },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_12' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_14: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'recover_usp', fallback: 0 },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_14' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_16: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_combo_skill: SkillDefinition = {
  key: 'chr_0026_lastrite_combo_skill',
  element: 'cryo',
  blackboard: {
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
  dontInterruptCombo: true,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 65, endFrame: 91, skillIds: ['chr_0026_lastrite_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'readBuffStackCount_8' } },
    { startFrame: 63, endFrame: 63, sequence: { $sequence: 'mergeContextTargets_16' } },
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'ifElse_18' } },
    { startFrame: 63, endFrame: 63, sequence: { $sequence: 'ifElse_24' } },
    { startFrame: 64, endFrame: 64, sequence: { $sequence: 'ifElse_26' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_27' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: lastRiteChr_0026_lastrite_combo_skillActionGraph,
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
            targets: [{ kind: 'owner' }],
          },
        },
        next: null,
      },
      startUltimateTimeDilation_11: {
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
      hideUi_12: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_13: {
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
      dealDamage_25: {
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
      dealDamage_24: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            instantAttributeModifiers: [
              {
                targetSide: 'defender',
                attribute: 'cryoVulnerabilityIncrease',
                slot: 'baseFinalMultiplier',
                value: { kind: 'valueNode', nodeId: 'data_3' },
                attributeTiming: 'runtime',
              },
            ],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      dealDamage_39: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: null,
      },
      dealDamage_38: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            instantAttributeModifiers: [
              {
                targetSide: 'defender',
                attribute: 'cryoVulnerabilityIncrease',
                slot: 'baseFinalMultiplier',
                value: { kind: 'valueNode', nodeId: 'data_3' },
                attributeTiming: 'runtime',
              },
            ],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: null,
      },
      ifElse_40: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'dealDamage_38' },
          whenFalse: { $sequence: 'dealDamage_39' },
        },
        next: null,
      },
      repeatEachTick_41: {
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
          body: { $sequence: 'ifElse_40' },
        },
        next: null,
      },
      startTimeDilation_42: {
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
      startTimeDilation_43: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: [{ kind: 'owner' }],
          },
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
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'dealDamage_24' },
          whenFalse: { $sequence: 'dealDamage_25' },
        },
        next: 'ifElse_opt2',
      },
      repeatEachTick_opt4: {
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
          body: { $sequence: 'ifElse_opt3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
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
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
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
  element: 'cryo',
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findTargets_opt1' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'startUltimateTimeDilation_11' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'hideUi_12' } },
    { startFrame: 0, endFrame: 172, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 86, endFrame: 89, sequence: { $sequence: 'repeatEachTick_opt4' } },
    { startFrame: 105, endFrame: 108, sequence: { $sequence: 'repeatEachTick_opt4' } },
    { startFrame: 134, endFrame: 137, sequence: { $sequence: 'repeatEachTick_41' } },
    { startFrame: 86, endFrame: 86, sequence: { $sequence: 'startTimeDilation_42' } },
    { startFrame: 85, endFrame: 145, sequence: { $sequence: 'startTimeDilation_43' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 240 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: lastRiteChr_0026_lastrite_ultimate_skillActionGraph,
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

export const lastRiteChr_0026_lastrite_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lastRiteChr_0026_lastrite_plunging_attack_start: SkillDefinition = {
  actionGraph: lastRiteChr_0026_lastrite_plunging_attack_startActionGraph,
  key: 'chr_0026_lastrite_plunging_attack_start',
  element: 'physical',
  blackboard: {},
  timelineBlockFrames: 1501,
  naturalDurationFrames: 1500,
  exclusiveFrame: 1500,
  offsetRecordFrame: 0,
  costFrame: 9,
  scheduledSequences: [],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  nativeSkillType: 'attack',
  levelSource: 'basicAttack',
};

const lastRitePassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0026_lastrite_passive' }],
            targets: { kind: 'fixed', target: 'caster' },
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
          kind: 'buffStackCompare',
          target: { kind: 'context', key: 'trigger' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
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
  sequence: { $sequence: 'checkCondition_2' },
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
  lifecycleSequences: { enable: [{ $sequence: 'startTimeDilation_1' }] },
  actionGraph: lastRiteBuff1ActionGraph,
};

const lastRiteBuff2ActionGraph = {
  main: {
    nodes: {
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_17',
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_18',
      },
      dealStagger_1: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'dealStagger_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'checkCondition_4',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0026_lastrite_normal_skill_tag' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
                buffId: 'buff_chr_0026_lastrite_normal_skill_phantom',
                copiedBlackboardAssignments: { atk_scale: 'atk_scale' },
              },
            ],
            targets: { kind: 'mainTarget', owner: { kind: 'owner' } },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_9',
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_phantom_main',
                copiedBlackboardAssignments: { atk_scale1: 'atk_scale' },
              },
            ],
            targets: { kind: 'mainTarget', owner: { kind: 'owner' } },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_9',
      },
      createTimedMarker_11: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'applyBuff_8' },
          whenFalse: { $sequence: 'applyBuff_10' },
        },
        next: 'createTimedMarker_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'ifElse_12',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'checkCondition_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'checkCondition_14',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'checkCondition_15',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: { kind: 'fixed', target: 'enemy' },
          valueType: 'current',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'owner' },
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0026_lastrite'],
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: { kind: 'fixed', target: 'enemy' },
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
    icon: 'endaxis:icons/icon_battle_lastrite_buff',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 3, atk_up: 0, duration: 15, poise: 0, potential_1: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_19' },
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
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_16' } },
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
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_self',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  atb: 'atb',
                  atk_up: 'atk_up',
                  poise: 'poise',
                  potential_1: 'potential_1',
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
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'team' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0026_lastrite_normal_skill'],
            reason: 'other',
          },
        },
        next: 'applyBuff_1',
      },
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'finishBuffsById_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'findTargets_3',
      },
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_6',
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
  lifecycleSequences: {
    start: [{ $sequence: 'modifyActionValue_4' }, { $sequence: 'checkCondition_7' }],
  },
  actionGraph: lastRiteBuff3ActionGraph,
};

const lastRiteBuff4ActionGraph = {
  main: {
    nodes: {
      changeResource_1: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill_self',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  atb: 'atb',
                  atk_up: 'atk_up',
                  potential_1: 'potential_1',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_3',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'team' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          },
        },
        next: 'applyBuff_4',
      },
      findTargets_6: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'finishBuffsById_5',
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
  scheduledSequences: [{ startFrame: 26, endFrame: 27, sequence: { $sequence: 'findTargets_6' } }],
  actionGraph: lastRiteBuff4ActionGraph,
};

const lastRiteBuff5ActionGraph = {
  main: {
    nodes: {
      dealDamage_3: {
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
      startTimeDilation_4: {
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
        next: 'dealDamage_3',
      },
      applyElementalInfliction_5: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'startTimeDilation_4',
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'applyElementalInfliction_5' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_3' } },
  ],
  actionGraph: lastRiteBuff5ActionGraph,
};

const lastRiteBuff6ActionGraph = {
  main: {
    nodes: {
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
  blackboard: { atk_scale1: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'applyElementalInfliction_4' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_2' } },
  ],
  actionGraph: lastRiteBuff6ActionGraph,
};

const lastRiteBuff7ActionGraph = {
  main: {
    nodes: {
      changeResource_1: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
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
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_normal_skill',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  atk_scale: 'atk_scale',
                  poise: 'poise',
                  atk_up: 'atk_up',
                  potential_1: 'potential_1',
                },
              },
            ],
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'changeResource_1',
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
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: lastRiteBuff7ActionGraph,
};

const lastRiteBuff8ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
            targets: { kind: 'context', key: 'team' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0026_lastrite_normal_skill'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_1',
      },
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'finishBuffsById_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'findTargets_3',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
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
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
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
  lifecycleSequences: { enable: [{ $sequence: 'restrictUltimateEnergyRecovery_1' }] },
  actionGraph: lastRiteBuff9ActionGraph,
};

const lastRiteBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0026_lastrite_talent_1_vul',
                copiedBlackboardAssignments: { crystal_vul: 'crystal_vul', duration: 'duration' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'calculateActionValue_2',
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
    { event: 'buffConsumed', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
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
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_crystal',
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
            finishByAction: true,
          },
        },
        next: null,
      },
      readBuffRemainingDuration_2: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'real_duration',
          },
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
  lifecycleSequences: { enable: [{ $sequence: 'readBuffRemainingDuration_2' }] },
  actionGraph: lastRiteBuff11ActionGraph,
};

export const lastRite: OperatorDefinition = {
  slug: 'last-rite',
  gameId: 'LASTRITE',
  rarity: 6,
  weaponType: 'claym',
  element: 'cryo',
  characterTypeId: 'Cryst',
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
  skills: [
    lastRiteChr_0026_lastrite_attack1,
    lastRiteChr_0026_lastrite_attack2,
    lastRiteChr_0026_lastrite_attack3,
    lastRiteChr_0026_lastrite_attack4,
    lastRiteChr_0026_lastrite_power_attack,
    lastRiteChr_0026_lastrite_plunging_attack_end,
    lastRiteChr_0026_lastrite_normal_skill,
    lastRiteChr_0026_lastrite_combo_skill,
    lastRiteChr_0026_lastrite_ultimate_skill,
    lastRiteCommon_character_perfect_dodge,
    lastRiteChr_0026_lastrite_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0026_lastrite_attack1',
        'chr_0026_lastrite_attack2',
        'chr_0026_lastrite_attack3',
        'chr_0026_lastrite_attack4',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0026_lastrite_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0026_lastrite_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0026_lastrite_normal_skill'],
    },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0026_lastrite_ultimate_skill'] },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0026_lastrite_combo_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0026_lastrite_plunging_attack_start',
    endSkillId: 'chr_0026_lastrite_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 2,
  },
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
          skillKey: 'chr_0026_lastrite_ultimate_skill',
          blackboardKey: 'talent_2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_ultimate_skill',
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
          skillKey: 'chr_0026_lastrite_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_normal_skill',
          blackboardKey: 'poise',
          operation: 'assign',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_normal_skill',
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
          skillKey: 'chr_0026_lastrite_combo_skill',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_combo_skill',
          blackboardKey: 'atk_scale3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_combo_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_ultimate_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_ultimate_skill',
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
          skillKey: 'chr_0026_lastrite_ultimate_skill',
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
          skillKey: 'chr_0026_lastrite_normal_skill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0026_lastrite_normal_skill',
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
