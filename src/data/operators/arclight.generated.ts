/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const arclightChr_0007_ikut_attack1ActionGraph = {
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
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0007_ikut_attack2'] },
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

export const arclightChr_0007_ikut_attack1: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_attack1ActionGraph,
  key: 'chr_0007_ikut_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
  },
  timelineBlockFrames: 9,
  naturalDurationFrames: 64,
  exclusiveFrame: 21,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 26, input: 'basicAttack', targetSkillId: 'chr_0007_ikut_attack2' },
    ],
    allowedNextSkills: [{ startFrame: 9, endFrame: 26, skillIds: ['chr_0007_ikut_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 9, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0007_ikut_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const arclightChr_0007_ikut_attack2ActionGraph = {
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
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0007_ikut_attack3'] },
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

export const arclightChr_0007_ikut_attack2: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_attack2ActionGraph,
  key: 'chr_0007_ikut_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 74,
  exclusiveFrame: 15,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 26, input: 'basicAttack', targetSkillId: 'chr_0007_ikut_attack3' },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 26, skillIds: ['chr_0007_ikut_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 10, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0007_ikut_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const arclightChr_0007_ikut_attack3ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0007_ikut_attack4'] },
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

export const arclightChr_0007_ikut_attack3: SkillDefinition = {
  key: 'chr_0007_ikut_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
    display_atk_scale: [0.26, 0.29, 0.31, 0.34, 0.36, 0.39, 0.42, 0.44, 0.47, 0.5, 0.54, 0.59],
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 71,
  exclusiveFrame: 33,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 30, input: 'basicAttack', targetSkillId: 'chr_0007_ikut_attack4' },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 30, skillIds: ['chr_0007_ikut_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 20, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0007_ikut_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack3ActionGraph,
};

export const arclightChr_0007_ikut_attack4ActionGraph = {
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
            tags: ['normalAttack'],
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
              maxCountPerTarget: 3,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0007_ikut_attack5'] },
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

export const arclightChr_0007_ikut_attack4: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_attack4ActionGraph,
  key: 'chr_0007_ikut_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 77,
  exclusiveFrame: 36,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 40, input: 'basicAttack', targetSkillId: 'chr_0007_ikut_attack5' },
    ],
    allowedNextSkills: [{ startFrame: 27, endFrame: 40, skillIds: ['chr_0007_ikut_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 20, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 27, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0007_ikut_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const arclightChr_0007_ikut_attack5ActionGraph = {
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_2',
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
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0007_ikut_attack1'] },
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

export const arclightChr_0007_ikut_attack5: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_attack5ActionGraph,
  key: 'chr_0007_ikut_attack5',
  blackboard: {
    atb: 17,
    atk_scale: [0.48, 0.52, 0.57, 0.62, 0.67, 0.71, 0.76, 0.81, 0.86, 0.91, 0.99, 1.07],
    poise: 16,
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 83,
  exclusiveFrame: 26,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 40, input: 'basicAttack', targetSkillId: 'chr_0007_ikut_attack1' },
    ],
    allowedNextSkills: [{ startFrame: 29, endFrame: 40, skillIds: ['chr_0007_ikut_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 29, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0007_ikut_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const arclightChr_0007_ikut_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.05,
            tags: ['normalAttack', 'powerAttack'],
          },
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.9,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_3',
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2667 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
      applyBuff_7: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_power_attack: SkillDefinition = {
  key: 'chr_0007_ikut_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 40,
  naturalDurationFrames: 131,
  exclusiveFrame: 68,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 40,
        endFrame: 68,
        skillIds: ['chr_0007_ikut_normal_skill', 'chr_0007_ikut_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 15, endFrame: 15, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 23, endFrame: 23, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 38, endFrame: 38, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 39, endFrame: 39, sequence: { $sequence: 'startTimeDilation_5' } },
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_7' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: arclightChr_0007_ikut_power_attackActionGraph,
};

export const arclightChr_0007_ikut_plunging_attack_endActionGraph = {
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

export const arclightChr_0007_ikut_plunging_attack_end: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_plunging_attack_endActionGraph,
  key: 'chr_0007_ikut_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 88,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const arclightChr_0007_ikut_normal_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.066 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_1',
      },
      gainSquadUltimateEnergyFromSkillCost_3: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
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
            targets: ['enemy', 'caster'],
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'startTimeDilation_4',
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
        next: 'startTimeDilation_1',
      },
      applyBuff_18: {
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
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'applyBuff_18',
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'dealDamage_19',
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0007_ikut_normal_skill_extra_count',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              pulse_up: 'pulse_up',
              duration: 'duration',
              count: 'count',
            },
          },
        },
        next: null,
      },
      finishBuffsByTag_11: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            reason: 'early',
          },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_12: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: 'finishBuffsByTag_11',
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'thirdhit',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'dealDamage_13',
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'modifyActionValue_14',
      },
      changeResourceByActionValue_16: {
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
        next: 'dealDamage_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_10' },
        },
        next: 'changeResourceByActionValue_16',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_17' },
          whenFalse: { $sequence: 'dealDamage_20' },
        },
        next: null,
      },
      startTimeDilation_22: {
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
                  value: 0.2,
                  inTangent: -3.063443,
                  outTangent: -3.063443,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.05224372,
                  value: 0.03995434,
                  inTangent: -0.110653,
                  outTangent: -0.110653,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.425575,
                  value: 0.03096347,
                  inTangent: 0.04099823,
                  outTangent: 0.04099823,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7615593,
                  value: 0.2709492,
                  inTangent: 0.9447426,
                  outTangent: 0.9447426,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.5,
                  inTangent: 0.7728162,
                  outTangent: 0.7728162,
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
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_22' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_24: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'SpawnThird',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_26: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_25' },
        },
        next: null,
      },
      jumpTimeline_27: {
        action: {
          kind: 'jumpTimeline',
          parameters: {
            destinationFrame: 96,
            condition: { kind: 'conditionNode', nodeId: 'data_20' },
          },
        },
        next: null,
      },
      jumpTimeline_28: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 204 } },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'thirdhit', fallback: 0 } },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
      data_19: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'SpawnThird', fallback: 0 },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_normal_skill: SkillDefinition = {
  key: 'chr_0007_ikut_normal_skill',
  blackboard: {
    atb: [30, 30, 30, 30, 30, 35, 35, 35, 35, 35, 35, 40],
    atk_scale: [0.45, 0.5, 0.54, 0.59, 0.63, 0.68, 0.72, 0.77, 0.81, 0.87, 0.93, 1.01],
    atk_scale2: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
    count: 0,
    duration: 0,
    poise1: 5,
    poise2: 5,
    pulse_up: 0,
    SpawnThird: 0,
    talent_1: 0,
    thirdhit: 0,
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 214,
  exclusiveFrame: 164,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 36, endFrame: 60, skillIds: ['chr_0007_ikut_normal_skill'] },
      { startFrame: 162, endFrame: 188, skillIds: ['chr_0007_ikut_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 19, endFrame: 19, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 112, endFrame: 112, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 118, endFrame: 118, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 136, endFrame: 136, sequence: { $sequence: 'conditional_21' } },
    { startFrame: 137, endFrame: 137, sequence: { $sequence: 'conditional_23' } },
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'markCurrentSkillCanInterrupt_24' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_26' } },
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'jumpTimeline_27' } },
    { startFrame: 95, endFrame: 95, sequence: { $sequence: 'jumpTimeline_28' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: arclightChr_0007_ikut_normal_skillActionGraph,
};

export const arclightChr_0007_ikut_ultimate_skillActionGraph = {
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
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'tar1', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'createSpatialPointTargets_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar1', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'conditional_4',
      },
      startUltimateTimeDilation_6: {
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
      hideUi_7: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_8: {
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
      spawnAbilityEntity_9: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0007_ikut_ultimate_skill',
            childSkillId: 'chr_0007_ikut_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetCountCompare',
          contextKey: 'tar1',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_ultimate_skill: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_ultimate_skillActionGraph,
  key: 'chr_0007_ikut_ultimate_skill',
  blackboard: {
    atk_scale1: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    atk_scale2: [2.44, 2.69, 2.93, 3.18, 3.42, 3.67, 3.91, 4.15, 4.4, 4.7, 5.07, 5.5],
    isWall: 0,
    poise1: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
    poise2: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
    radius: 1,
  },
  timelineBlockFrames: 86,
  naturalDurationFrames: 141,
  exclusiveFrame: 85,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 77,
        endFrame: 89,
        skillIds: ['chr_0007_ikut_normal_skill', 'chr_0007_ikut_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'startUltimateTimeDilation_6' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'hideUi_7' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 54, endFrame: 55, sequence: { $sequence: 'spawnAbilityEntity_9' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const arclightChr_0007_ikut_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_1' },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0007_ikut_combo_skill_counts'],
            reason: 'other',
          },
        },
        next: null,
      },
      changeResourceByActionValue_5: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      startTimeDilation_6: {
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
        next: 'changeResourceByActionValue_5',
      },
      dealDamage_7: {
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
        next: 'startTimeDilation_6',
      },
      changeResourceByActionValue_8: {
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
        next: 'dealDamage_7',
      },
      startTimeDilation_9: {
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
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_9',
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_combo_skill: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_combo_skillActionGraph,
  key: 'chr_0007_ikut_combo_skill',
  blackboard: {
    atb: [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
    atk_scale: [0.52, 0.57, 0.62, 0.67, 0.73, 0.78, 0.83, 0.88, 0.93, 1, 1.07, 1.17],
    count: 0,
    duration: 0,
    poise: 5,
    usp: 5,
  },
  timelineBlockFrames: 38,
  naturalDurationFrames: 86,
  exclusiveFrame: 37,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 27, endFrame: 60, skillIds: ['chr_0007_ikut_normal_skill'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 0, endFrame: 12, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_4' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'changeResourceByActionValue_8' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'dealDamage_11' } },
  ],
  smartTarget: 'input',
  cooldownFrames: 90,
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const arclightCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: arclightCommon_character_perfect_dodgeActionGraph,
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

const arclightComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0007_ikut_combo_skill',
  event: 'outputBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: arclightComboCondition1ActionGraph,
};

const arclightComboCondition2ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0007_ikut_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: arclightComboCondition2ActionGraph,
};

const arclightBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_pulse_dmg_up',
    iconPath: '/icons/icon_battle_pulse_dmg_up.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, pulse_up: 0 },
  attributeModifiers: [
    {
      attribute: 'electricDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'pulse_up' },
    },
  ],
  actionGraph: arclightBuff1ActionGraph,
};

const arclightBuff2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'finishBuffsById_1' } },
  actionGraph: arclightBuff2ActionGraph,
};

const arclightBuff3ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0007_ikut_atk_buff_talent',
            target: 'party',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { pulse_up: 'final_pulse_up', duration: 'duration' },
          },
        },
        next: 'finishBuffsById_1',
      },
      storeSourceAttributeValue_3: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'final_pulse_up',
          },
        },
        next: 'applyBuff_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'storeSourceAttributeValue_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'pulse_up' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
          operator: 'greaterOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightBuff3: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 3,
  presentation: {
    visible: true,
    iconId: 'icon_battle_ikut_talent_1',
    iconPath: '/icons/icon_battle_ikut_talent_1.webp',
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
  blackboard: { count: 0, duration: 0, final_pulse_up: 0, pulse_up: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enhanceChanged: { $sequence: 'conditional_4' } },
  actionGraph: arclightBuff3ActionGraph,
};

const arclightBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { prob: 0.3 },
  attributeModifiers: [],
  actionGraph: arclightBuff4ActionGraph,
};

const arclightBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const arclightBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Immune/SpellInflictOnChar'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: arclightBuff5ActionGraph,
};

export const arclight: OperatorDefinition = {
  slug: 'arclight',
  gameId: 'ARCLIGHT',
  rarity: 5,
  weaponType: 'sword',
  element: 'electric',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [14, 33, 54, 75, 96, 107],
    agility: [14, 42, 71, 101, 130, 145],
    intellect: [12, 36, 61, 86, 111, 123],
    will: [10, 29, 49, 69, 89, 100],
    baseAttack: [30, 89, 151, 213, 275, 306],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        arclightChr_0007_ikut_attack1,
        arclightChr_0007_ikut_attack2,
        arclightChr_0007_ikut_attack3,
        arclightChr_0007_ikut_attack4,
        arclightChr_0007_ikut_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: arclightChr_0007_ikut_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: arclightChr_0007_ikut_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: arclightChr_0007_ikut_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: arclightChr_0007_ikut_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: arclightChr_0007_ikut_combo_skill,
    },
  ],
  dodgeSkill: arclightCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0007_ikut_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0007_ikut_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0007_ikut_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0007_ikut_attack1',
        'chr_0007_ikut_attack2',
        'chr_0007_ikut_attack3',
        'chr_0007_ikut_attack4',
        'chr_0007_ikut_attack5',
        'chr_0007_ikut_plunging_attack_end',
        'chr_0007_ikut_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0007_ikut_attack1',
        'chr_0007_ikut_attack2',
        'chr_0007_ikut_attack3',
        'chr_0007_ikut_attack4',
        'chr_0007_ikut_attack5',
      ],
      defaultSkillKey: 'chr_0007_ikut_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [arclightComboCondition1, arclightComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'pulse_up',
          operation: 'add',
          value: [0.0005, 0.0008],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'count',
          operation: 'assign',
          value: [3, 3],
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0007_ikut_talent_2', blackboardAssignments: { prob: [0.3, 0.5] } },
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
          blackboardKey: 'atb',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'pulse_up',
          operation: 'multiply',
          value: 1.3,
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
          blackboardKey: 'count',
          operation: 'assign',
          value: 2,
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0007_ikut_finish_count_p5' }],
    },
  ],
  buffDefinitions: {
    buff_chr_0007_ikut_atk_buff_talent: arclightBuff1,
    buff_chr_0007_ikut_finish_count_p5: arclightBuff2,
    buff_chr_0007_ikut_normal_skill_extra_count: arclightBuff3,
    buff_chr_0007_ikut_talent_2: arclightBuff4,
    buff_chr_0007_ikut_talent_2_immune: arclightBuff5,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0007_ikut_ultimate_skill: {
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
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                  key: 'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              applyElementalInfliction_2: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'electric', isExtra: false },
                },
                next: 'dealDamage_1',
              },
              forEachContextTarget_3: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { target: 'enemy' },
                  body: { $sequence: null },
                },
                next: null,
              },
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                  key: 'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
                },
                next: null,
              },
              applyBuff_5: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_common_pulse_pulse_conduct_triggered',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      consumed_type: { kind: 'constant', value: 1 },
                      consumed_layer: { kind: 'valueNode', nodeId: 'data_5' },
                      count: { kind: 'valueNode', nodeId: 'data_6' },
                    },
                  },
                },
                next: null,
              },
              finishBuffsByTag_6: {
                action: {
                  kind: 'finishBuffsByTag',
                  parameters: {
                    target: 'enemy',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                    reason: 'early',
                    count: { kind: 'valueNode', nodeId: 'data_7' },
                  },
                },
                next: 'applyBuff_5',
              },
              conditional_7: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
                  whenTrue: { $sequence: 'finishBuffsByTag_6' },
                },
                next: null,
              },
              readBuffStackCount_8: {
                action: {
                  kind: 'readBuffStackCount',
                  parameters: {
                    target: 'enemy',
                    outputKey: 'count',
                    query: {
                      kind: 'tag',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                    },
                  },
                },
                next: 'conditional_7',
              },
              conditional_9: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: { kind: 'conditionNode', nodeId: 'data_10' },
                    alwaysNext: true,
                  },
                  whenTrue: { $sequence: 'readBuffStackCount_8' },
                },
                next: null,
              },
              forEachContextTarget_10: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { target: 'enemy' },
                  body: { $sequence: 'conditional_9' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
              data_7: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
              data_8: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'buffStackCompare',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'valueNode', nodeId: 'data_8' },
                },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'entityTagMatch',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  tags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0007_ikut_ultimate_skill_abentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 150,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale1: 0.2,
          atk_scale2: 0,
          count: 0,
          duration: 12,
          poise1: 0,
          poise2: 0,
        },
        scheduledSequences: [
          { startFrame: 7, endFrame: 8, sequence: { $sequence: 'applyElementalInfliction_2' } },
          { startFrame: 7, endFrame: 8, sequence: { $sequence: 'forEachContextTarget_3' } },
          { startFrame: 63, endFrame: 64, sequence: { $sequence: 'dealDamage_4' } },
          { startFrame: 63, endFrame: 64, sequence: { $sequence: 'forEachContextTarget_10' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default arclight;
