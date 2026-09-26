/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const aleshChr_0024_deepfin_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.06 },
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
          parameters: { skillIds: ['chr_0024_deepfin_attack2'] },
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

export const aleshChr_0024_deepfin_attack1: SkillDefinition = {
  actionGraph: aleshChr_0024_deepfin_attack1ActionGraph,
  key: 'chr_0024_deepfin_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 130,
  exclusiveFrame: 25,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 7,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 25, skillIds: ['chr_0024_deepfin_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0024_deepfin_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const aleshChr_0024_deepfin_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.03 },
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
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack3'] },
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

export const aleshChr_0024_deepfin_attack2: SkillDefinition = {
  key: 'chr_0024_deepfin_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 128,
  exclusiveFrame: 25,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 6,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 25, skillIds: ['chr_0024_deepfin_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'startTimeDilation_5' } },
    { startFrame: 10, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0024_deepfin_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack2ActionGraph,
};

export const aleshChr_0024_deepfin_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack4'] },
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

export const aleshChr_0024_deepfin_attack3: SkillDefinition = {
  key: 'chr_0024_deepfin_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 145,
  exclusiveFrame: 29,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 13,
        endFrame: 31,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 31, skillIds: ['chr_0024_deepfin_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 16, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0024_deepfin_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack3ActionGraph,
};

export const aleshChr_0024_deepfin_attack4ActionGraph = {
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
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
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
          parameters: { skillIds: ['chr_0024_deepfin_attack5'] },
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

export const aleshChr_0024_deepfin_attack4: SkillDefinition = {
  actionGraph: aleshChr_0024_deepfin_attack4ActionGraph,
  key: 'chr_0024_deepfin_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 90,
  exclusiveFrame: 30,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 33, skillIds: ['chr_0024_deepfin_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 22, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0024_deepfin_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const aleshChr_0024_deepfin_attack5ActionGraph = {
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
            curve: { kind: 'named', key: 'char_hard_zero' },
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_2',
      },
      changeResourceByActionValue_4: {
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
      startTimeDilation_5: {
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
        next: 'changeResourceByActionValue_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_5' },
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
            stagger: { kind: 'constant', value: 0 },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack1'] },
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
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack5: SkillDefinition = {
  actionGraph: aleshChr_0024_deepfin_attack5ActionGraph,
  key: 'chr_0024_deepfin_attack5',
  blackboard: {
    atb: 19,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
    poise: 17,
    atk_scale_display: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 104,
  exclusiveFrame: 40,
  offsetRecordFrame: 18,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 14,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 31, endFrame: 40, skillIds: ['chr_0024_deepfin_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 31, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0024_deepfin_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const aleshChr_0024_deepfin_power_attackActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_zero' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
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
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_3',
      },
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_5' },
        },
        next: 'startTimeDilation_6',
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_7',
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      applyBuff_12: {
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
      applyBuff_13: {
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'startTimeDilation_9' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_power_attack: SkillDefinition = {
  key: 'chr_0024_deepfin_power_attack',
  blackboard: {
    atk_scale1: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale2: [3.2, 3.52, 3.84, 4.16, 4.48, 4.8, 5.12, 5.44, 5.76, 6.16, 6.64, 7.2],
  },
  timelineBlockFrames: 47,
  naturalDurationFrames: 113,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 47,
        endFrame: 75,
        skillIds: ['chr_0024_deepfin_normal_skill', 'chr_0024_deepfin_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 47, endFrame: 49, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_12' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_13' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: aleshChr_0024_deepfin_power_attackActionGraph,
};

export const aleshChr_0024_deepfin_plunging_attack_endActionGraph = {
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

export const aleshChr_0024_deepfin_plunging_attack_end: SkillDefinition = {
  actionGraph: aleshChr_0024_deepfin_plunging_attack_endActionGraph,
  key: 'chr_0024_deepfin_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 92,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const aleshChr_0024_deepfin_normal_skillActionGraph = {
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
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
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
      changeResourceByActionValue_13: {
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
      changeResourceByActionValue_12: {
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
      changeResourceByActionValue_11: {
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
      changeResourceByActionValue_10: {
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
      switch_19: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_9' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'changeResourceByActionValue_10' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'changeResourceByActionValue_11' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'changeResourceByActionValue_12' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'changeResourceByActionValue_13' },
            },
          ],
        },
        next: null,
      },
      calculateActionValue_15: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_4',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_10' },
            right: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'switch_19',
      },
      calculateActionValue_16: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_3',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_12' },
            right: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'calculateActionValue_15',
      },
      calculateActionValue_17: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_14' },
            right: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'calculateActionValue_16',
      },
      calculateActionValue_18: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_1',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_16' },
            right: { kind: 'valueNode', nodeId: 'data_17' },
          },
        },
        next: 'calculateActionValue_17',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_18' },
          whenFalse: { $sequence: 'switch_19' },
        },
        next: null,
      },
      startTimeDilation_21: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      dealDamage_22: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_20' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: 'startTimeDilation_21',
      },
      repeatEachTick_23: {
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
          body: { $sequence: 'dealDamage_22' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_24: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_cryst_cryst_frozen_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              consumed_type: { kind: 'constant', value: 2 },
              consumed_layer: { kind: 'valueNode', nodeId: 'data_22' },
              count: { kind: 'valueNode', nodeId: 'data_23' },
            },
          },
        },
        next: null,
      },
      finishBuffsByTag_26: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            reason: 'early',
            count: { kind: 'valueNode', nodeId: 'data_24' },
          },
        },
        next: 'applyBuff_25',
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' } },
          whenTrue: { $sequence: 'finishBuffsByTag_26' },
        },
        next: null,
      },
      readBuffStackCount_28: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'count',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'conditional_27',
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_27' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffStackCount_28' },
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
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_4' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_3' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atb_2' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb_1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'num' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_4' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1_atb' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb_3' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1_atb' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atb_2' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1_atb' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atb_1' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1_atb' } },
      data_18: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_18' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_25' },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_normal_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_normal_skill',
  blackboard: {
    atb_1: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
    atb_2: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_3: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
    atb_4: [40, 40, 40, 40, 40, 40, 40, 40, 40, 45, 45, 45],
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    count: 0,
    num: 0,
    num_1: 0,
    poise: 10,
    potential_1: 0,
    potential_1_atb: 0,
  },
  timelineBlockFrames: 51,
  naturalDurationFrames: 126,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'conditional_20' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_23' } },
    {
      startFrame: 27,
      endFrame: 28,
      sequence: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_24' },
    },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_30' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: aleshChr_0024_deepfin_normal_skillActionGraph,
};

export const aleshChr_0024_deepfin_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0024_deepfin_combo_camera',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
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
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      dealDamage_4: {
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
        next: null,
      },
      changeResourceByActionValue_5: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'dealDamage_4',
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_combo2' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.95 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_combo2' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_6' },
          whenFalse: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      changeResourceByActionValue_9: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'conditional_8',
      },
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['comboSkill'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_15: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_14',
      },
      jumpTimeline_16: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 120 } },
        next: null,
      },
      dealDamage_17: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['comboSkill'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_18: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_11' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_17',
      },
      jumpTimeline_20: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 65 } },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
          whenTrue: { $sequence: 'jumpTimeline_20' },
        },
        next: null,
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
          whenTrue: { $sequence: 'jumpTimeline_20' },
        },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_21' },
          whenFalse: { $sequence: 'conditional_22' },
        },
        next: null,
      },
      storeSourceAttributeValue_24: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_19' },
            base: { kind: 'valueNode', nodeId: 'data_20' },
            targetKey: 'prob',
          },
        },
        next: 'conditional_23',
      },
      calculateActionValue_25: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'prob_add',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_21' },
            right: { kind: 'valueNode', nodeId: 'data_22' },
          },
        },
        next: 'storeSourceAttributeValue_24',
      },
      calculateActionValue_26: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'prob_max',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_23' },
            right: { kind: 'valueNode', nodeId: 'data_24' },
          },
        },
        next: 'calculateActionValue_25',
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0024_deepfin_potential_3',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'Duration' },
          },
        },
        next: null,
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_27' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2ex' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_sp' } },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'usp_normal' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1ex' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'prob_max' } },
      data_13: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_12' } },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_15: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_14' } },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'prob', fallback: 0 } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'prob_max', fallback: 0 } },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_16' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_17' },
        },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'prob_add' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'prob_add' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'prob_max' } },
      data_25: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
      },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_25' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_combo_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_combo_skill',
  blackboard: {
    atb: [10, 10, 10, 10, 10, 12, 12, 12, 12, 13, 13, 15],
    atb_sp: 10,
    atk_scale_1: [0.33, 0.37, 0.4, 0.43, 0.47, 0.5, 0.53, 0.57, 0.6, 0.64, 0.69, 0.75],
    atk_scale_1ex: [0.53, 0.59, 0.64, 0.69, 0.75, 0.8, 0.85, 0.91, 0.96, 1.03, 1.11, 1.2],
    atk_scale_2: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    atk_scale_2ex: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    atk_up: 0.15,
    Duration: 10,
    poise: 10,
    potential_3: 0,
    prob: 0.1,
    prob_add: 0,
    prob_max: 0,
    rate: 10,
    usp_normal: 10,
  },
  timelineBlockFrames: 131,
  naturalDurationFrames: 213,
  exclusiveFrame: 130,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 39, endFrame: 65, skillIds: ['chr_0024_deepfin_normal_skill'] },
      { startFrame: 94, endFrame: 120, skillIds: ['chr_0024_deepfin_normal_skill'] },
      { startFrame: 120, endFrame: 130, skillIds: ['chr_0024_deepfin_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 38, endFrame: 41, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 93, endFrame: 96, sequence: { $sequence: 'changeResourceByActionValue_5' } },
    { startFrame: 38, endFrame: 43, sequence: { $sequence: 'changeResourceByActionValue_9' } },
    { startFrame: 93, endFrame: 98, sequence: { $sequence: 'changeResourceByActionValue_9' } },
    { startFrame: 22, endFrame: 24, sequence: { $sequence: 'changeResourceByActionValue_15' } },
    { startFrame: 64, endFrame: 66, sequence: { $sequence: 'jumpTimeline_16' } },
    { startFrame: 77, endFrame: 79, sequence: { $sequence: 'changeResourceByActionValue_18' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'calculateActionValue_26' } },
    { startFrame: 93, endFrame: 96, sequence: { $sequence: 'conditional_28' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: aleshChr_0024_deepfin_combo_skillActionGraph,
};

export const aleshChr_0024_deepfin_ultimate_skillActionGraph = {
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
      dealDamage_4: {
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
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'dealDamage_4',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_3' },
          whenFalse: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      repeatEachTick_6: {
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
          body: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      applyElementalInfliction_7: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'repeatEachTick_6',
      },
      changeResourceByActionValue_9: {
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
        next: null,
      },
      changeResourceByActionValue_8: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_11' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_8' },
          whenFalse: { $sequence: 'changeResourceByActionValue_9' },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_up',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'conditional_10',
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_up',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'modifyActionValue_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_ult' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
          whenTrue: { $sequence: 'startTimeDilation_13' },
        },
        next: null,
      },
      applyBuff_15: {
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
      hideUi_16: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_17: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
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
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'hp_tar' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'ratio',
          operator: 'lessOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_6' },
            { kind: 'conditionNode', nodeId: 'data_8' },
          ],
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_max' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up', fallback: 0 } },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_12' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 100 },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'kill_num' } },
      data_16: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_ultimate_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_ultimate_skill',
  blackboard: {
    atb: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_max: 100,
    atb_up: [12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 15, 15],
    atk_scale: [4.36, 4.79, 5.23, 5.66, 6.1, 6.53, 6.97, 7.41, 7.84, 8.39, 9.04, 9.8],
    atk_up: 1.5,
    hp_tar: 0.5,
    kill_num: 0,
    poise: 20,
    potential_5: 0,
  },
  timelineBlockFrames: 96,
  naturalDurationFrames: 180,
  exclusiveFrame: 110,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 87,
        endFrame: 113,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 96,
        endFrame: 113,
        skillIds: [
          'chr_0024_deepfin_attack1',
          'chr_0024_deepfin_normal_skill',
          'chr_0024_deepfin_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 90, endFrame: 93, sequence: { $sequence: 'applyElementalInfliction_7' } },
    { startFrame: 91, endFrame: 94, sequence: { $sequence: 'modifyActionValue_12' } },
    { startFrame: 90, endFrame: 93, sequence: { $sequence: 'conditional_14' } },
    { startFrame: 0, endFrame: 110, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'hideUi_16' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'startUltimateTimeDilation_17' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: aleshChr_0024_deepfin_ultimate_skillActionGraph,
};

export const aleshCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: aleshCommon_character_perfect_dodgeActionGraph,
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

const aleshComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0024_deepfin_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: aleshComboCondition1ActionGraph,
};

const aleshComboCondition2ActionGraph = {
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0024_deepfin_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: aleshComboCondition2ActionGraph,
};

const aleshBuff1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.63 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.3 },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 0, count: 0, owner_mainchar_alpha: 0, owner_mainchar_distance: 0, usp: 10 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_1' } },
  ],
  actionGraph: aleshBuff1ActionGraph,
};

const aleshBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff2: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
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
  blackboard: { atk_up: 0.15, duration: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: aleshBuff2ActionGraph,
};

const aleshBuff3ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'talent',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      changeResourceByActionValue_2: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'createTimedMarker_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
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
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_7' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_4' } },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_7' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 0, count: 0, usp: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_4' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_8' } },
  ],
  actionGraph: aleshBuff3ActionGraph,
};

const aleshBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0024_deepfin_talent_1',
            target: 'partyExceptCaster',
            finishByAction: true,
            blackboardAssignments: {
              usp: { kind: 'valueNode', nodeId: 'data_1' },
              CD: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'talent',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      changeResourceByActionValue_3: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'createTimedMarker_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'usp_final',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'changeResourceByActionValue_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'calculateActionValue_4' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp_final' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'usp_self' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_8' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 3, count: 0, usp: 10, usp_final: 0, usp_self: 12 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
  ],
  actionGraph: aleshBuff4ActionGraph,
};

export const alesh: OperatorDefinition = {
  slug: 'alesh',
  gameId: 'ALESH',
  rarity: 5,
  weaponType: 'sword',
  element: 'cryo',
  role: 'vanguard',
  mainAttribute: 'strength',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [20, 49, 80, 111, 142, 158],
    agility: [9, 27, 47, 66, 86, 95],
    intellect: [13, 37, 62, 87, 113, 125],
    will: [10, 27, 45, 63, 81, 89],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        aleshChr_0024_deepfin_attack1,
        aleshChr_0024_deepfin_attack2,
        aleshChr_0024_deepfin_attack3,
        aleshChr_0024_deepfin_attack4,
        aleshChr_0024_deepfin_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: aleshChr_0024_deepfin_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: aleshChr_0024_deepfin_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: aleshChr_0024_deepfin_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: aleshChr_0024_deepfin_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: aleshChr_0024_deepfin_ultimate_skill,
    },
  ],
  dodgeSkill: aleshCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0024_deepfin_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0024_deepfin_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0024_deepfin_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
        'chr_0024_deepfin_plunging_attack_end',
        'chr_0024_deepfin_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
      ],
      defaultSkillKey: 'chr_0024_deepfin_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [aleshComboCondition1, aleshComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0024_deepfin_talent_1_auro',
          blackboardAssignments: { usp: [3, 4], usp_self: [6, 8] },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'prob_add',
          operation: 'assign',
          value: [0.002, 0.005],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'prob_max',
          operation: 'assign',
          value: [0.3, 0.3],
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
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_1_atb',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'Duration',
          operation: 'assign',
          value: 10,
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
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'hp_tar',
          operation: 'assign',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 1.5,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0024_deepfin_combo_camera: aleshBuff1,
    buff_chr_0024_deepfin_potential_3: aleshBuff2,
    buff_chr_0024_deepfin_talent_1: aleshBuff3,
    buff_chr_0024_deepfin_talent_1_auro: aleshBuff4,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default alesh;
