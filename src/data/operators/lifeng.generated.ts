/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const lifengChr_0015_lifeng_attack1ActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
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
            durationSeconds: { kind: 'constant', value: 0.067 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -1.778889,
                  outTangent: -1.778889,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5059338,
                  value: 0.1,
                  inTangent: 0.02136457,
                  outTangent: 0.02136457,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 1.821618,
                  outTangent: 1.821618,
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0015_lifeng_attack2'] },
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

export const lifengChr_0015_lifeng_attack1: SkillDefinition = {
  key: 'chr_0015_lifeng_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 187,
  exclusiveFrame: 25,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0015_lifeng_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 24, endFrame: 32, skillIds: ['chr_0015_lifeng_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 24, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  timelineContinuationSkillId: 'chr_0015_lifeng_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_attack1ActionGraph,
};

export const lifengChr_0015_lifeng_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -1.778889,
                  outTangent: -1.778889,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5059338,
                  value: 0.1,
                  inTangent: 0.02136457,
                  outTangent: 0.02136457,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 1.821618,
                  outTangent: 1.821618,
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0015_lifeng_attack3'] },
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

export const lifengChr_0015_lifeng_attack2: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_attack2ActionGraph,
  key: 'chr_0015_lifeng_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.29, 0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.49, 0.52, 0.56, 0.6, 0.65],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 131,
  exclusiveFrame: 18,
  offsetRecordFrame: 4,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 24,
        input: 'basicAttack',
        targetSkillId: 'chr_0015_lifeng_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 24, skillIds: ['chr_0015_lifeng_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 18, endFrame: 24, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0015_lifeng_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lifengChr_0015_lifeng_attack3ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.167 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0015_lifeng_attack5'] },
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

export const lifengChr_0015_lifeng_attack3: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_attack3ActionGraph,
  key: 'chr_0015_lifeng_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
    display_atk_scale: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 115,
  exclusiveFrame: 14,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0015_lifeng_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 30, skillIds: ['chr_0015_lifeng_attack5'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 14, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0015_lifeng_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lifengChr_0015_lifeng_attack5ActionGraph = {
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
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
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
      startTimeDilation_4: {
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
                  inTangent: -10.34941,
                  outTangent: -10.34941,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.06079425,
                  value: 0.3708155,
                  inTangent: -1.727207,
                  outTangent: -1.727207,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5059338,
                  value: 0.1,
                  inTangent: -0.1658141,
                  outTangent: -0.1658141,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 1.821618,
                  outTangent: 1.821618,
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
        next: 'changeResourceByActionValue_3',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0015_lifeng_attack1'] },
        },
        next: null,
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'constant', value: 0 },
            tags: [],
          },
        },
        next: 'conditional_opt1',
      },
      forEachContextTarget_opt3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'dealDamage_2' },
        },
        next: 'dealDamage_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_attack5: SkillDefinition = {
  key: 'chr_0015_lifeng_attack5',
  blackboard: {
    atb: 21,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
    atk_scale2: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 19,
    display_atk_scale: [0.68, 0.74, 0.81, 0.88, 0.95, 1.01, 1.08, 1.15, 1.22, 1.3, 1.4, 1.52],
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 192,
  exclusiveFrame: 35,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 46,
        input: 'basicAttack',
        targetSkillId: 'chr_0015_lifeng_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 35, endFrame: 46, skillIds: ['chr_0015_lifeng_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'forEachContextTarget_opt3' } },
    { startFrame: 35, endFrame: 46, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0015_lifeng_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_attack5ActionGraph,
};

export const lifengChr_0015_lifeng_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_2: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.9,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2667 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -4.725137,
                  outTangent: -4.725137,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1938458,
                  value: 0.08405209,
                  inTangent: -0.1121379,
                  outTangent: -0.1121379,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7754285,
                  value: 0.06392533,
                  inTangent: 0.06279767,
                  outTangent: 0.06279767,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.168271,
                  outTangent: 4.168271,
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_power_attack: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_power_attackActionGraph,
  key: 'chr_0015_lifeng_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 33,
  naturalDurationFrames: 194,
  exclusiveFrame: 68,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 33,
        endFrame: 68,
        skillIds: ['chr_0015_lifeng_normal_skill', 'chr_0015_lifeng_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 33, endFrame: 33, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 34, endFrame: 34, sequence: { $sequence: 'startTimeDilation_4' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const lifengChr_0015_lifeng_plunging_attack_endActionGraph = {
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

export const lifengChr_0015_lifeng_plunging_attack_end: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_plunging_attack_endActionGraph,
  key: 'chr_0015_lifeng_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 181,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const lifengChr_0015_lifeng_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0015_lifeng_purify',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { rate: 'phy_resist_down', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_2' },
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
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_4',
      },
      gainSquadUltimateEnergyFromSkillCost_8: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_8',
      },
      applyKnockDown_10: {
        action: {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_9',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'num' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'lessOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_normal_skill: SkillDefinition = {
  key: 'chr_0015_lifeng_normal_skill',
  blackboard: {
    atk_scale: [0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86],
    atk_scale2: [1.19, 1.31, 1.43, 1.55, 1.67, 1.78, 1.9, 2.02, 2.14, 2.29, 2.47, 2.68],
    duration: 12,
    num: 0,
    phy_resist_down: [0.05, 0.05, 0.05, 0.05, 0.05, 0.07, 0.07, 0.07, 0.09, 0.1, 0.1, 0.12],
    poise: 10,
  },
  timelineBlockFrames: 71,
  naturalDurationFrames: 216,
  exclusiveFrame: 70,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 67, endFrame: 89, skillIds: ['chr_0015_lifeng_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 54, endFrame: 56, sequence: { $sequence: 'forEachContextTarget_3' } },
    { startFrame: 7, endFrame: 9, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 20, endFrame: 22, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 54, endFrame: 56, sequence: { $sequence: 'applyKnockDown_10' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: lifengChr_0015_lifeng_normal_skillActionGraph,
};

export const lifengChr_0015_lifeng_ultimate_skillActionGraph = {
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
      startUltimateTimeDilation_2: {
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
      hideUi_3: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_4: {
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
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'abepos',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isCombo',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_6' },
        },
        next: null,
      },
      spawnAbilityEntity_8: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0015_lifeng_ultimate_skill',
            childSkillId: 'chr_0015_lifeng_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      mergeContextTargets_9: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'abepos',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'spawnAbilityEntity_8',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_isCombo', fallback: 0 },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_ultimate_skill: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_ultimate_skillActionGraph,
  key: 'chr_0015_lifeng_ultimate_skill',
  blackboard: {
    atk_scale1: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale2: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    isCombo: 0,
    poise1: 0,
    poise2: 5,
    atk_scale3: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 5,
    poise3: 5,
  },
  timelineBlockFrames: 76,
  naturalDurationFrames: 190,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 66,
        endFrame: 80,
        skillIds: ['chr_0015_lifeng_normal_skill', 'chr_0015_lifeng_combo_skill'],
      },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'startUltimateTimeDilation_2' } },
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 1, endFrame: 3, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 58, endFrame: 59, sequence: { $sequence: 'mergeContextTargets_9' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const lifengChr_0015_lifeng_combo_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'main_near',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'changeResourceByActionValue_4',
      },
      createGlobalBuff_6: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_combo_trigger',
            definition: {
              stackingType: 'stack',
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              blackboard: { duration: 0, imbue_scale: 0 },
              children: [
                {
                  buffId: 'buff_common_affixes_combo_trigger',
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_6' } },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'valueNode', nodeId: 'data_7' } },
          },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.933 },
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
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_combo_skill: SkillDefinition = {
  actionGraph: lifengChr_0015_lifeng_combo_skillActionGraph,
  key: 'chr_0015_lifeng_combo_skill',
  blackboard: {
    atk_scale: [0.47, 0.51, 0.56, 0.61, 0.65, 0.7, 0.75, 0.79, 0.84, 0.9, 0.97, 1.05],
    atk_scale2: [1.67, 1.83, 2, 2.17, 2.33, 2.5, 2.67, 2.83, 3, 3.21, 3.46, 3.75],
    duration: 20,
    main_near: 0,
    poise: 10,
    usp: 10,
  },
  timelineBlockFrames: 65,
  naturalDurationFrames: 168,
  exclusiveFrame: 64,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 50, endFrame: 89, skillIds: ['chr_0015_lifeng_normal_skill'] },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 48, endFrame: 49, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'createGlobalBuff_6' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'startTimeDilation_7' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const lifengCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: lifengCommon_character_perfect_dodgeActionGraph,
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

const lifengPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0015_lifeng_passive',
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

const lifengPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0015_lifeng_passive',
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: lifengPassive1ActionGraph,
};

const lifengPassive2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0015_lifeng_talent_1',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: { atk_up: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengPassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0015_lifeng_talent_1',
  blackboard: { atk_up: [0.001, 0.0015] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: lifengPassive2ActionGraph,
};

const lifengComboCondition1ActionGraph = {
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
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffStackCompare',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          buffTags: [
            'Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic',
            'Skill/Character/Common/PhysicalStatus/FractureStatus',
          ],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0015_lifeng_combo_skill',
  event: 'beforeTakeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: lifengComboCondition1ActionGraph,
};

const lifengBuff1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_isCombo',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'modifyActionValue_1' },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_isCombo',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_affixes_skillimbue_atk'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
    { event: 'skillEnd', priority: 0, sequence: { $sequence: 'modifyActionValue_3' } },
  ],
  actionGraph: lifengBuff1ActionGraph,
};

const lifengBuff2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0015_lifeng_potential_5'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0015_lifeng_potential_5_1',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale_potential5: 'atk_scale_potential5',
              poise_potential5: 'poise_potential5',
              interval: 'interval',
            },
          },
        },
        next: 'finishBuffsById_1',
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
          target: 'buffOwner',
          buffIds: ['buff_chr_0015_lifeng_talent_2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: { blackboardKey: 'interval' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_potential5: 0, interval: 0, poise_potential5: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'conditional_3' } },
  actionGraph: lifengBuff2ActionGraph,
};

const lifengBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_lifeng_potential_5',
    iconPath: '/icons/icon_battle_lifeng_potential_5.webp',
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
  blackboard: { atk_scale_potential5: 0, interval: 0, poise_potential5: 0 },
  attributeModifiers: [],
  actionGraph: lifengBuff3ActionGraph,
};

const lifengBuff4ActionGraph = {
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
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0015_lifeng_purify_icon' },
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

const lifengBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: lifengBuff4ActionGraph,
};

const lifengBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_physical_vulnerable',
    iconPath: '/icons/icon_battle_affix_physical_vulnerable.webp',
    showInHeadBarCommon: true,
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: lifengBuff5ActionGraph,
};

const lifengBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0 },
  attributeModifiers: [
    {
      attribute: 'AtkIncreaseFactorFromWisd',
      slot: 'baseAddition',
      value: { blackboardKey: 'atk_up' },
    },
    {
      attribute: 'AtkIncreaseFactorFromWill',
      slot: 'addition',
      value: { blackboardKey: 'atk_up' },
    },
  ],
  actionGraph: lifengBuff6ActionGraph,
};

const lifengBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0015_lifeng_potential_5',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              interval: 'interval',
              atk_scale_potential5: 'atk_scale_potential5',
              poise_potential5: 'poise_potential5',
            },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0015_lifeng_potential_5_1'],
            reason: 'other',
          },
        },
        next: 'applyBuff_1',
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: [],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_atk_scale_talent2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'dealDamage_3',
      },
      readBuffBlackboard_5: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'poise_potential5',
            outputKey: 'poise_potential5',
          },
        },
        next: 'calculateActionValue_4',
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'interval',
            outputKey: 'interval',
          },
        },
        next: 'readBuffBlackboard_5',
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'atk_scale_potential5',
            outputKey: 'atk_scale_potential5',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: [],
          },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_7' },
          whenFalse: { $sequence: 'dealDamage_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'final_atk_scale_talent2' },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_potential5' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_talent2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_potential5' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_talent2' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0015_lifeng_potential_5_1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const lifengBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale_potential5: 0,
    atk_scale_talent2: 0,
    final_atk_scale_talent2: 0,
    interval: 0,
    poise_potential5: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputKnockDown', priority: 0, sequence: { $sequence: 'conditional_9' } },
  ],
  actionGraph: lifengBuff7ActionGraph,
};

export const lifeng: OperatorDefinition = {
  slug: 'lifeng',
  gameId: 'LIFENG',
  rarity: 6,
  weaponType: 'polearm',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [14, 38, 62, 86, 111, 123],
    agility: [20, 44, 69, 94, 119, 132],
    intellect: [13, 35, 58, 81, 104, 115],
    will: [12, 35, 58, 82, 105, 117],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        lifengChr_0015_lifeng_attack1,
        lifengChr_0015_lifeng_attack2,
        lifengChr_0015_lifeng_attack3,
        lifengChr_0015_lifeng_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: lifengChr_0015_lifeng_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: lifengChr_0015_lifeng_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: lifengChr_0015_lifeng_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: lifengChr_0015_lifeng_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: lifengChr_0015_lifeng_combo_skill,
    },
  ],
  dodgeSkill: lifengCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0015_lifeng_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0015_lifeng_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0015_lifeng_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0015_lifeng_attack1',
        'chr_0015_lifeng_attack2',
        'chr_0015_lifeng_attack3',
        'chr_0015_lifeng_attack5',
        'chr_0015_lifeng_plunging_attack_end',
        'chr_0015_lifeng_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0015_lifeng_attack1',
        'chr_0015_lifeng_attack2',
        'chr_0015_lifeng_attack3',
        'chr_0015_lifeng_attack5',
      ],
      defaultSkillKey: 'chr_0015_lifeng_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [lifengComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    { levels: 2, passiveSkills: [lifengPassive2] },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0015_lifeng_talent_2',
          blackboardAssignments: { atk_scale_talent2: [0.5, 1] },
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
          blackboardKey: 'phy_resist_down',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'num',
          operation: 'assign',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0015_lifeng_talent_1',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.0005,
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
      attachedBuffs: [
        {
          buffId: 'buff_chr_0015_lifeng_potential_5',
          blackboardAssignments: { atk_scale_potential5: 2.5, interval: 15, poise_potential5: 5 },
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_isCombo: 0 },
  passiveSkills: [lifengPassive1],
  buffDefinitions: {
    buff_chr_0015_lifeng_passive: lifengBuff1,
    buff_chr_0015_lifeng_potential_5: lifengBuff2,
    buff_chr_0015_lifeng_potential_5_1: lifengBuff3,
    buff_chr_0015_lifeng_purify: lifengBuff4,
    buff_chr_0015_lifeng_purify_icon: lifengBuff5,
    buff_chr_0015_lifeng_talent_1: lifengBuff6,
    buff_chr_0015_lifeng_talent_2: lifengBuff7,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0015_lifeng_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              dealDamage_1: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              applyKnockDown_2: {
                action: {
                  kind: 'applyKnockDown',
                  parameters: {
                    target: 'enemy',
                    duration: { kind: 'constant', value: 2.1 },
                    force: false,
                    isExtra: false,
                    targetFilter: 'aliveOnly',
                    returnWhen: 'always',
                  },
                },
                next: 'dealDamage_1',
              },
              dealDamage_3: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_3/action',
                },
                next: null,
              },
              applyKnockDown_4: {
                action: {
                  kind: 'applyKnockDown',
                  parameters: {
                    target: 'enemy',
                    duration: { kind: 'constant', value: 2.1 },
                    force: false,
                    isExtra: false,
                    targetFilter: 'aliveOnly',
                    returnWhen: 'always',
                  },
                },
                next: 'dealDamage_3',
              },
              dealDamage_5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_6' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: null,
              },
              jumpTimeline_6: {
                action: { kind: 'jumpTimeline', parameters: { destinationFrame: 150 } },
                next: null,
              },
              modifyActionValue_7: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'EntityBB_isCombo',
                    operation: 'assign',
                    value: { kind: 'constant', value: 0 },
                  },
                },
                next: null,
              },
              conditional_8: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_8' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'jumpTimeline_6' },
                  whenFalse: { $sequence: 'modifyActionValue_7' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'isCombo', fallback: 0 },
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
            },
          },
          macros: {},
        },
        skillId: 'chr_0015_lifeng_ultimate_skill_abentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 150,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale1: 1,
          atk_scale2: 1.5,
          atk_scale3: 0,
          isCombo: 0,
          poise: 0,
          poise2: 0,
          poise3: 0,
        },
        scheduledSequences: [
          { startFrame: 6, endFrame: 7, sequence: { $sequence: 'applyKnockDown_2' } },
          { startFrame: 66, endFrame: 67, sequence: { $sequence: 'applyKnockDown_4' } },
          { startFrame: 121, endFrame: 122, sequence: { $sequence: 'dealDamage_5' } },
          { startFrame: 67, endFrame: 68, sequence: { $sequence: 'conditional_8' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default lifeng;
