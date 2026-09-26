/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const akekuriChr_0019_karin_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0019_karin_attack2'] },
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

export const akekuriChr_0019_karin_attack1: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_attack1ActionGraph,
  key: 'chr_0019_karin_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 90,
  exclusiveFrame: 17,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 1,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0019_karin_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 32, skillIds: ['chr_0019_karin_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 14, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0019_karin_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const akekuriChr_0019_karin_attack2ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
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
        next: 'startTimeDilation_4',
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0019_karin_attack3'] },
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
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriChr_0019_karin_attack2: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_attack2ActionGraph,
  key: 'chr_0019_karin_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28],
    atk_scale_2: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 112,
  exclusiveFrame: 28,
  offsetRecordFrame: 16,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 13,
        endFrame: 38,
        input: 'basicAttack',
        targetSkillId: 'chr_0019_karin_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 38, skillIds: ['chr_0019_karin_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 22, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0019_karin_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const akekuriChr_0019_karin_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
          parameters: { skillIds: ['chr_0019_karin_attack4'] },
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

export const akekuriChr_0019_karin_attack3: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_attack3ActionGraph,
  key: 'chr_0019_karin_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 95,
  exclusiveFrame: 27,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 11,
        endFrame: 36,
        input: 'basicAttack',
        targetSkillId: 'chr_0019_karin_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 36, skillIds: ['chr_0019_karin_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 21, endFrame: 36, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0019_karin_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const akekuriChr_0019_karin_attack4ActionGraph = {
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
      startTimeDilation_2: {
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_7',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0019_karin_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriChr_0019_karin_attack4: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_attack4ActionGraph,
  key: 'chr_0019_karin_attack4',
  blackboard: {
    atb: 19,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    poise: 17,
    display_atk_scale: [0.5, 0.54, 0.59, 0.64, 0.69, 0.74, 0.79, 0.84, 0.89, 0.95, 1.03, 1.11],
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 110,
  exclusiveFrame: 34,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 24,
        endFrame: 52,
        input: 'basicAttack',
        targetSkillId: 'chr_0019_karin_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 35, endFrame: 52, skillIds: ['chr_0019_karin_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 35, endFrame: 52, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0019_karin_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const akekuriChr_0019_karin_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.16 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_2',
      },
      gainFinisherSp_4: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_4' },
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
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_5',
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      applyBuff_8: {
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
      applyBuff_9: {
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriChr_0019_karin_power_attack: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_power_attackActionGraph,
  key: 'chr_0019_karin_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 37,
  naturalDurationFrames: 137,
  exclusiveFrame: 60,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 37,
        endFrame: 60,
        skillIds: ['chr_0019_karin_normal_skill', 'chr_0019_karin_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 36, endFrame: 37, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 40, endFrame: 43, sequence: { $sequence: 'startTimeDilation_7' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 0, endFrame: 36, sequence: { $sequence: 'applyBuff_9' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const akekuriChr_0019_karin_plunging_attack_endActionGraph = {
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

export const akekuriChr_0019_karin_plunging_attack_end: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_plunging_attack_endActionGraph,
  key: 'chr_0019_karin_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 95,
  exclusiveFrame: 13,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const akekuriChr_0019_karin_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      startTimeDilation_2: {
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
        next: null,
      },
      dealDamage_3: {
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
        next: 'startTimeDilation_2',
      },
      applyElementalInfliction_4: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'dealDamage_3',
      },
      gainSquadUltimateEnergyFromSkillCost_5: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriChr_0019_karin_normal_skill: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_normal_skillActionGraph,
  key: 'chr_0019_karin_normal_skill',
  blackboard: {
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    poise: 10,
  },
  timelineBlockFrames: 41,
  naturalDurationFrames: 125,
  exclusiveFrame: 40,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'applyElementalInfliction_4' } },
    {
      startFrame: 20,
      endFrame: 21,
      sequence: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_5' },
    },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const akekuriChr_0019_karin_ultimate_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0019_karin_potential_3',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { atk: 'atk' },
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
      startTimeDilation_3: {
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
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_2',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_1',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_2',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_7',
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_1',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_6' },
          whenFalse: { $sequence: 'modifyActionValue_9' },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'max_ratio', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_10',
      },
      storeSourceAttributeValue_12: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_12' },
            base: { kind: 'constant', value: 1 },
            targetKey: 'atb_up',
          },
        },
        next: 'modifyActionValue_11',
      },
      changeResourceByActionValue_13: {
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
        next: null,
      },
      changeResourceByActionValue_14: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_14' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResourceByActionValue_15: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_15' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      findCharacterTeamTargets_16: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'main_char', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0019_karin_talent_2_combo',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { imbue_scale: 'imbue_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0019_karin_talent_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { potential_5_duration: 'potential_5_duration' },
          },
        },
        next: 'applyBuff_17',
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
          whenTrue: { $sequence: 'applyBuff_18' },
        },
        next: null,
      },
      applyBuff_20: {
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
      hideUi_21: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_22: {
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
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'max_ratio' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'max_ratio' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'max_ratio' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up', fallback: 0 } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_ratio', fallback: 0 },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_10' },
        },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'sub_ratio' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atb_1' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atb_2' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'atb_3' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'combo', fallback: 0 } },
      data_17: {
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

export const akekuriChr_0019_karin_ultimate_skill: SkillDefinition = {
  actionGraph: akekuriChr_0019_karin_ultimate_skillActionGraph,
  key: 'chr_0019_karin_ultimate_skill',
  blackboard: {
    atb_1: [19, 19, 20, 21, 21, 22, 23, 23, 24, 25, 25, 26],
    atb_2: [19, 20, 21, 21, 22, 23, 23, 24, 25, 25, 26, 27],
    atb_3: [20, 21, 21, 22, 23, 23, 24, 25, 25, 26, 27, 27],
    atb_up: 1,
    atk: 0,
    combo: 0,
    duration: 10,
    imbue_scale: 0,
    max_ratio: 0,
    potential_3: 0,
    potential_5_duration: 0,
    sub_ratio: 0,
  },
  timelineBlockFrames: 129,
  naturalDurationFrames: 233,
  exclusiveFrame: 150,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 120,
        endFrame: 201,
        input: 'basicAttack',
        targetSkillId: 'chr_0019_karin_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 129,
        endFrame: 201,
        skillIds: [
          'chr_0019_karin_normal_skill',
          'chr_0019_karin_attack1',
          'chr_0019_karin_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 150, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 0, endFrame: 12, sequence: { $sequence: 'storeSourceAttributeValue_12' } },
    { startFrame: 59, endFrame: 83, sequence: { $sequence: 'changeResourceByActionValue_13' } },
    { startFrame: 86, endFrame: 115, sequence: { $sequence: 'changeResourceByActionValue_14' } },
    { startFrame: 119, endFrame: 159, sequence: { $sequence: 'changeResourceByActionValue_15' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_16' } },
    { startFrame: 1, endFrame: 150, sequence: { $sequence: 'conditional_19' } },
    { startFrame: 0, endFrame: 83, sequence: { $sequence: 'applyBuff_20' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'hideUi_21' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'startUltimateTimeDilation_22' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 120 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const akekuriChr_0019_karin_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
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
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'changeResourceByActionValue_4',
      },
      startTimeDilation_6: {
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
        next: 'modifyActionValue_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'conditional_7',
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
        next: 'dealDamage_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: 'changeResourceByActionValue_9',
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'max_ratio', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_10',
      },
      storeSourceAttributeValue_12: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_12' },
            base: { kind: 'constant', value: 1 },
            targetKey: 'atb_up',
          },
        },
        next: 'modifyActionValue_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'sub_ratio',
            operation: 'divide',
            value: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'storeSourceAttributeValue_12',
      },
      startTimeDilation_15: {
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
        next: 'changeResourceByActionValue_4',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_16' },
        },
        next: null,
      },
      dealDamage_18: {
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
        next: 'conditional_17',
      },
      changeResourceByActionValue_19: {
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
        next: 'dealDamage_18',
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'assign', value: { kind: 'constant', value: 0 } },
        },
        next: 'changeResourceByActionValue_19',
      },
      startTimeDilation_21: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'max_ratio' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up', fallback: 0 } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_ratio', fallback: 0 },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'less',
          right: { kind: 'valueNode', nodeId: 'data_10' },
        },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'sub_ratio' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_14' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriChr_0019_karin_combo_skill: SkillDefinition = {
  key: 'chr_0019_karin_combo_skill',
  blackboard: {
    atb: 7.5,
    atb_up: 1,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    count: 0,
    max_ratio: 0,
    poise: 5,
    rate: 10,
    sub_ratio: 0,
    usp: 5,
  },
  timelineBlockFrames: 56,
  naturalDurationFrames: 136,
  exclusiveFrame: 55,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 38, endFrame: 71, skillIds: ['chr_0019_karin_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'modifyActionValue_13' } },
    { startFrame: 31, endFrame: 36, sequence: { $sequence: 'modifyActionValue_20' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_21' } },
  ],
  cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 270],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: akekuriChr_0019_karin_combo_skillActionGraph,
};

export const akekuriCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const akekuriCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: akekuriCommon_character_perfect_dodgeActionGraph,
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

const akekuriComboCondition1ActionGraph = {
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
    },
    dataNodes: {
      data_1: {
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

const akekuriComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0019_karin_combo_skill',
  event: 'poiseZero',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: akekuriComboCondition1ActionGraph,
};

const akekuriComboCondition2ActionGraph = {
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
    },
    dataNodes: {
      data_1: {
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

const akekuriComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0019_karin_combo_skill',
  event: 'poiseKnotBreak',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: akekuriComboCondition2ActionGraph,
};

const akekuriBuff1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0019_karin_potential_1_1',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', atk_up: 'atk_up' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, duration: 0, max_stack: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'skillSpGained', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: akekuriBuff1ActionGraph,
};

const akekuriBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff2: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
  blackboard: { atk_up: 0, duration: 5, max_stack: 1 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: akekuriBuff2ActionGraph,
};

const akekuriBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
  blackboard: { atk: 0.1 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk' } },
  ],
  actionGraph: akekuriBuff3ActionGraph,
};

const akekuriBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: akekuriBuff4ActionGraph,
};

const akekuriBuff5ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0019_karin_talent_2_combo'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'potential_5_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { potential_5_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'finishBuffsById_1' } },
  actionGraph: akekuriBuff5ActionGraph,
};

const akekuriBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0019_karin_potential_5_combo',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { potential_5_duration: 'potential_5_duration' },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0019_karin_talent_2_combo'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_1' },
          whenFalse: { $sequence: 'finishBuffsById_2' },
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
          buffIds: ['buff_chr_0019_karin_potential_5'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { potential_5_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'conditional_3' } },
  actionGraph: akekuriBuff6ActionGraph,
};

const akekuriBuff7ActionGraph = {
  main: {
    nodes: {
      createGlobalBuff_1: {
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
                  blackboardAssignments: { imbue_scale: { kind: 'valueNode', nodeId: 'data_1' } },
                },
              ],
            },
            source: 'buffOwner',
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_2' },
              imbue_scale: { kind: 'valueNode', nodeId: 'data_3' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const akekuriBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, imbue_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'createGlobalBuff_1' } },
  actionGraph: akekuriBuff7ActionGraph,
};

export const akekuri: OperatorDefinition = {
  slug: 'akekuri',
  gameId: 'AKEKURI',
  rarity: 4,
  weaponType: 'sword',
  element: 'heat',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [13, 34, 55, 77, 99, 110],
    agility: [15, 42, 70, 98, 126, 140],
    intellect: [12, 32, 53, 75, 96, 106],
    will: [9, 30, 52, 74, 96, 108],
    baseAttack: [30, 92, 157, 222, 287, 319],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        akekuriChr_0019_karin_attack1,
        akekuriChr_0019_karin_attack2,
        akekuriChr_0019_karin_attack3,
        akekuriChr_0019_karin_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: akekuriChr_0019_karin_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: akekuriChr_0019_karin_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: akekuriChr_0019_karin_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: akekuriChr_0019_karin_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: akekuriChr_0019_karin_combo_skill,
    },
  ],
  dodgeSkill: akekuriCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0019_karin_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0019_karin_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0019_karin_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0019_karin_attack1',
        'chr_0019_karin_attack2',
        'chr_0019_karin_attack3',
        'chr_0019_karin_attack4',
        'chr_0019_karin_plunging_attack_end',
        'chr_0019_karin_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0019_karin_attack1',
        'chr_0019_karin_attack2',
        'chr_0019_karin_attack3',
        'chr_0019_karin_attack4',
      ],
      defaultSkillKey: 'chr_0019_karin_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [akekuriComboCondition1, akekuriComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'sub_ratio',
          operation: 'assign',
          value: [0.01, 0.015],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'max_ratio',
          operation: 'assign',
          value: [0.5, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'rate',
          operation: 'assign',
          value: [10, 10],
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'combo',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'imbue_scale',
          operation: 'assign',
          value: 0.2,
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0019_karin_potential_1',
          blackboardAssignments: { atk_up: 0.1, duration: 10, max_stack: 5 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 10 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk',
          operation: 'assign',
          value: 0.1,
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
          multiplier: 0.9,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_5_duration',
          operation: 'assign',
          value: 5,
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0019_karin_potential_5' }],
    },
  ],
  buffDefinitions: {
    buff_chr_0019_karin_potential_1: akekuriBuff1,
    buff_chr_0019_karin_potential_1_1: akekuriBuff2,
    buff_chr_0019_karin_potential_3: akekuriBuff3,
    buff_chr_0019_karin_potential_5: akekuriBuff4,
    buff_chr_0019_karin_potential_5_combo: akekuriBuff5,
    buff_chr_0019_karin_talent_2: akekuriBuff6,
    buff_chr_0019_karin_talent_2_combo: akekuriBuff7,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default akekuri;
