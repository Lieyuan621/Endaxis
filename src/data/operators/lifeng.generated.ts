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
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_5: {
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
        next: 'changeResource_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_5' },
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
      reachSkillOperableBoundary_13: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_attack1: SkillDefinition = {
  key: 'chr_0015_lifeng_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.23, 0.25, 0.27],
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 24, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0015_lifeng_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_attack1ActionGraph,
};

export const lifengChr_0015_lifeng_attack2ActionGraph = {
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
      startTimeDilation_4: {
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
        next: 'changeResource_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      reachSkillOperableBoundary_7: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_attack2: SkillDefinition = {
  key: 'chr_0015_lifeng_attack2',
  element: 'physical',
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
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 18, endFrame: 24, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0015_lifeng_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_attack2ActionGraph,
};

export const lifengChr_0015_lifeng_attack3ActionGraph = {
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
      startTimeDilation_4: {
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
        next: 'changeResource_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      reachSkillOperableBoundary_7: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_attack3: SkillDefinition = {
  key: 'chr_0015_lifeng_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
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
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 14, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0015_lifeng_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_attack3ActionGraph,
};

export const lifengChr_0015_lifeng_attack5ActionGraph = {
  main: {
    nodes: {
      dealDamage_3: {
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
      dealDamage_6: {
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
      changeResource_10: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_11: {
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
        next: 'changeResource_10',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_8',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'startTimeDilation_11' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'constant', value: 0 },
            tags: [],
          },
        },
        next: 'ifElse_12',
      },
      reachSkillOperableBoundary_15: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0015_lifeng_attack1'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'dealDamage_6' },
          whenFalse: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      forEachContextTarget_opt2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_opt1' },
        },
        next: 'dealDamage_13',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
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
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_9' } },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_attack5: SkillDefinition = {
  key: 'chr_0015_lifeng_attack5',
  element: 'physical',
  blackboard: {
    atb: 21,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
    atk_scale2: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 19,
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
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'forEachContextTarget_opt2' } },
    { startFrame: 35, endFrame: 46, sequence: { $sequence: 'reachSkillOperableBoundary_15' } },
  ],
  defaultTarget: 'enemy',
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.9,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_2',
      },
      startTimeDilation_5: {
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
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_7: {
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
      applyBuff_8: {
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_power_attack: SkillDefinition = {
  key: 'chr_0015_lifeng_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 69,
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
    { startFrame: 34, endFrame: 34, sequence: { $sequence: 'ifElse_6' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'applyBuff_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: lifengChr_0015_lifeng_power_attackActionGraph,
};

export const lifengChr_0015_lifeng_plunging_attack_endActionGraph = {
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

export const lifengChr_0015_lifeng_plunging_attack_end: SkillDefinition = {
  key: 'chr_0015_lifeng_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 181,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: lifengChr_0015_lifeng_plunging_attack_endActionGraph,
};

export const lifengChr_0015_lifeng_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0015_lifeng_purify',
                copiedBlackboardAssignments: { rate: 'phy_resist_down', duration: 'duration' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'applyBuff_23' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forEachContextTarget_25: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_24' },
        },
        next: null,
      },
      startTimeDilation_26: {
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
      dealDamage_27: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_26',
      },
      applyBuff_30: {
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
      dealDamage_31: {
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
        next: 'applyBuff_30',
      },
      applyPhysicalInfliction_32: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'knockDown',
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_31',
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
  element: 'physical',
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
    { startFrame: 54, endFrame: 56, sequence: { $sequence: 'forEachContextTarget_25' } },
    { startFrame: 7, endFrame: 9, sequence: { $sequence: 'dealDamage_27' } },
    { startFrame: 20, endFrame: 22, sequence: { $sequence: 'dealDamage_27' } },
    { startFrame: 54, endFrame: 56, sequence: { $sequence: 'applyPhysicalInfliction_32' } },
  ],
  defaultTarget: 'enemy',
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
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      modifyActionValue_8: {
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
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      spawnAbilityEntity_13: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'fixed', target: 'enemy' },
            abilityEntityId: 'abilityentity_chr_0015_lifeng_ultimate_skill',
            childSkillId: 'chr_0015_lifeng_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      mergeContextTargets_12: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'abepos',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'spawnAbilityEntity_13',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'mergeContextTargets_12' },
          whenFalse: { $sequence: 'spawnAbilityEntity_13' },
        },
        next: null,
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_ultimate_skill: SkillDefinition = {
  key: 'chr_0015_lifeng_ultimate_skill',
  element: 'physical',
  blackboard: {
    atk_scale1: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale2: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    isCombo: 0,
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
    { startFrame: 1, endFrame: 3, sequence: { $sequence: 'ifElse_9' } },
    { startFrame: 58, endFrame: 59, sequence: { $sequence: 'ifElse_14' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: lifengChr_0015_lifeng_ultimate_skillActionGraph,
};

export const lifengChr_0015_lifeng_combo_skillActionGraph = {
  main: {
    nodes: {
      dealDamage_11: {
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
      changeResource_19: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'changeResource_19',
      },
      createGlobalBuff_22: {
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
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_5' } },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'valueNode', nodeId: 'data_6' } },
          },
        },
        next: null,
      },
      startTimeDilation_23: {
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
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_11',
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_20',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const lifengChr_0015_lifeng_combo_skill: SkillDefinition = {
  key: 'chr_0015_lifeng_combo_skill',
  element: 'physical',
  blackboard: {
    atk_scale: [0.47, 0.51, 0.56, 0.61, 0.65, 0.7, 0.75, 0.79, 0.84, 0.9, 0.97, 1.05],
    atk_scale2: [1.67, 1.83, 2, 2.17, 2.33, 2.5, 2.67, 2.83, 3, 3.21, 3.46, 3.75],
    duration: 20,
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
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 48, endFrame: 49, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'createGlobalBuff_22' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'startTimeDilation_23' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: lifengChr_0015_lifeng_combo_skillActionGraph,
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
  defaultTarget: 'enemy',
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
            buffs: [{ buffId: 'buff_chr_0015_lifeng_passive' }],
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
            buffs: [
              {
                buffId: 'buff_chr_0015_lifeng_talent_1',
                blackboardAssignments: { atk_up: { kind: 'valueNode', nodeId: 'data_1' } },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
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
          compareZeroWhenTargetMissing: false,
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
  sequence: { $sequence: 'checkCondition_3' },
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'modifyActionValue_1',
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
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
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
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
            buffs: [
              {
                buffId: 'buff_chr_0015_lifeng_potential_5_1',
                copiedBlackboardAssignments: {
                  atk_scale_potential5: 'atk_scale_potential5',
                  poise_potential5: 'poise_potential5',
                  interval: 'interval',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_1',
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
  lifecycleSequences: { trigger: [{ $sequence: 'checkCondition_3' }] },
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
    icon: 'endaxis:icons/icon_battle_lifeng_potential_5',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_physical',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0015_lifeng_purify_icon' },
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

const lifengBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_physical_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: [],
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
                buffId: 'buff_chr_0015_lifeng_potential_5',
                copiedBlackboardAssignments: {
                  interval: 'interval',
                  atk_scale_potential5: 'atk_scale_potential5',
                  poise_potential5: 'poise_potential5',
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
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0015_lifeng_potential_5_1'],
            reason: 'other',
          },
        },
        next: 'applyBuff_2',
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: [],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'finishBuffsById_3',
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_atk_scale_talent2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'dealDamage_4',
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'poise_potential5',
            outputKey: 'poise_potential5',
          },
        },
        next: 'calculateActionValue_5',
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'interval',
            outputKey: 'interval',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      readBuffBlackboard_8: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
            desiredKey: 'atk_scale_potential5',
            outputKey: 'atk_scale_potential5',
          },
        },
        next: 'readBuffBlackboard_7',
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'readBuffBlackboard_8' },
          whenFalse: { $sequence: 'dealDamage_9' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_talent2' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'final_atk_scale_talent2' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise_potential5' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_potential5' } },
      data_5: {
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
    { event: 'beforeOutputKnockDown', priority: 0, sequence: { $sequence: 'ifElse_10' } },
  ],
  actionGraph: lifengBuff7ActionGraph,
};

export const lifeng: OperatorDefinition = {
  slug: 'lifeng',
  gameId: 'LIFENG',
  rarity: 6,
  weaponType: 'lance',
  element: 'physical',
  characterTypeId: 'Physical',
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
      operationType: 'basicAttack',
      skills: [
        lifengChr_0015_lifeng_attack1,
        lifengChr_0015_lifeng_attack2,
        lifengChr_0015_lifeng_attack3,
        lifengChr_0015_lifeng_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: lifengChr_0015_lifeng_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: lifengChr_0015_lifeng_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: lifengChr_0015_lifeng_normal_skill,
    },
    { key: 'ultimate', operationType: 'ultimate', skills: lifengChr_0015_lifeng_ultimate_skill },
    { key: 'comboSkill', operationType: 'comboSkill', skills: lifengChr_0015_lifeng_combo_skill },
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
          skillKey: 'chr_0015_lifeng_normal_skill',
          blackboardKey: 'phy_resist_down',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0015_lifeng_normal_skill',
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
          skillKey: 'chr_0015_lifeng_ultimate_skill',
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
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      deathReleaseDelaySeconds: 0.1,
      childSkill: {
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
          { startFrame: 6, endFrame: 7, sequence: { $sequence: 'applyPhysicalInfliction_5' } },
          { startFrame: 66, endFrame: 67, sequence: { $sequence: 'applyPhysicalInfliction_7' } },
          { startFrame: 121, endFrame: 122, sequence: { $sequence: 'dealDamage_8' } },
          { startFrame: 67, endFrame: 68, sequence: { $sequence: 'ifElse_12' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: null,
              },
              applyPhysicalInfliction_5: {
                action: {
                  kind: 'applyPhysicalInfliction',
                  parameters: {
                    type: 'knockDown',
                    target: 'enemy',
                    duration: { kind: 'constant', value: 2.1 },
                    force: false,
                    isExtra: false,
                    targetFilter: 'aliveOnly',
                    returnWhen: 'always',
                  },
                },
                next: 'dealDamage_4',
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: null,
              },
              applyPhysicalInfliction_7: {
                action: {
                  kind: 'applyPhysicalInfliction',
                  parameters: {
                    type: 'knockDown',
                    target: 'enemy',
                    duration: { kind: 'constant', value: 2.1 },
                    force: false,
                    isExtra: false,
                    targetFilter: 'aliveOnly',
                    returnWhen: 'always',
                  },
                },
                next: 'dealDamage_6',
              },
              dealDamage_8: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_6' },
                  },
                  key: 'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_8/action',
                },
                next: null,
              },
              modifyActionValue_11: {
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
              jumpTimeline_10: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 150 },
                  condition: { kind: 'conditionNode', nodeId: 'data_7' },
                },
                next: null,
              },
              ifElse_12: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  whenTrue: { $sequence: 'jumpTimeline_10' },
                  whenFalse: { $sequence: 'modifyActionValue_11' },
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
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
              },
              data_8: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'isCombo', fallback: 0 },
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
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default lifeng;
