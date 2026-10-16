/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const avywennaChr_0012_avywen_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
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
          parameters: { skillIds: ['chr_0012_avywen_attack2'] },
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

export const avywennaChr_0012_avywen_attack1: SkillDefinition = {
  key: 'chr_0012_avywen_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
  },
  timelineBlockFrames: 8,
  naturalDurationFrames: 188,
  exclusiveFrame: 20,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 27,
        input: 'basicAttack',
        targetSkillId: 'chr_0012_avywen_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 8, endFrame: 27, skillIds: ['chr_0012_avywen_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 8, endFrame: 27, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0012_avywen_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_attack1ActionGraph,
};

export const avywennaChr_0012_avywen_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.07 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
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
          parameters: { skillIds: ['chr_0012_avywen_attack3'] },
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

export const avywennaChr_0012_avywen_attack2: SkillDefinition = {
  key: 'chr_0012_avywen_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37, 0.39, 0.41, 0.45, 0.48],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 224,
  exclusiveFrame: 17,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0012_avywen_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 25, skillIds: ['chr_0012_avywen_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 14, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0012_avywen_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_attack2ActionGraph,
};

export const avywennaChr_0012_avywen_attack3ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0012_avywen_attack4'] },
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

export const avywennaChr_0012_avywen_attack3: SkillDefinition = {
  key: 'chr_0012_avywen_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 183,
  exclusiveFrame: 17,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0012_avywen_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 25, skillIds: ['chr_0012_avywen_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 10, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0012_avywen_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_attack3ActionGraph,
};

export const avywennaChr_0012_avywen_attack4ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
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
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.22 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_4',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0012_avywen_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaChr_0012_avywen_attack4: SkillDefinition = {
  key: 'chr_0012_avywen_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale_2: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 208,
  exclusiveFrame: 30,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0012_avywen_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 40, skillIds: ['chr_0012_avywen_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 22, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0012_avywen_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_attack4ActionGraph,
};

export const avywennaChr_0012_avywen_attack5ActionGraph = {
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
          whenTrue: { $sequence: 'changeResource_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'ifElse_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0012_avywen_attack1'] },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaChr_0012_avywen_attack5: SkillDefinition = {
  key: 'chr_0012_avywen_attack5',
  element: 'physical',
  blackboard: {
    atb: 19,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 17,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 192,
  exclusiveFrame: 45,
  offsetRecordFrame: 24,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 55,
        input: 'basicAttack',
        targetSkillId: 'chr_0012_avywen_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 45, endFrame: 55, skillIds: ['chr_0012_avywen_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 45, endFrame: 55, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0012_avywen_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_attack5ActionGraph,
};

export const avywennaChr_0012_avywen_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'gainFinisherSp_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.3,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_4',
      },
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
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_7',
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
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
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_9',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_7',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'startTimeDilation_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_14',
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaChr_0012_avywen_power_attack: SkillDefinition = {
  key: 'chr_0012_avywen_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 45,
  naturalDurationFrames: 207,
  exclusiveFrame: 44,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 29,
        endFrame: 49,
        skillIds: ['chr_0012_avywen_normal_skill', 'chr_0012_avywen_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 28, endFrame: 29, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 29, endFrame: 30, sequence: { $sequence: 'dealDamage_15' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'applyBuff_16' } },
    { startFrame: 0, endFrame: 29, sequence: { $sequence: 'applyBuff_17' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: avywennaChr_0012_avywen_power_attackActionGraph,
};

export const avywennaChr_0012_avywen_plunging_attack_endActionGraph = {
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

export const avywennaChr_0012_avywen_plunging_attack_end: SkillDefinition = {
  key: 'chr_0012_avywen_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 11,
  naturalDurationFrames: 228,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 11, endFrame: 15, skillIds: ['chr_0012_avywen_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: avywennaChr_0012_avywen_plunging_attack_endActionGraph,
};

const avywennaChr_0012_avywen_normal_skillActionGraphCallback2 = {
  skillId: 'chr_0012_avywen_combo_skill_lance_back_reach',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 15,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: {},
  scheduledSequences: [
    { startFrame: 0, endFrame: 9, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_7' } },
  ],
  actionGraph: {
    main: {
      nodes: {
        startTimeDilation_3: {
          action: {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'global',
              durationSeconds: { kind: 'constant', value: 0.2 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 10,
              curve: {
                kind: 'inline',
                keys: [
                  {
                    time: 0,
                    value: 0.2,
                    inTangent: 0.04379496,
                    outTangent: 0.04379496,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.8847446,
                    value: 0.2387474,
                    inTangent: 0.04379496,
                    outTangent: 6.604918,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 1,
                    value: 1,
                    inTangent: 6.604918,
                    outTangent: 6.604918,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                ],
              },
              finishByAction: false,
              ignoredTargets: ['controlled'],
            },
          },
          next: null,
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
            },
          },
          next: null,
        },
        checkCondition_6: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          },
          next: 'changeResource_5',
        },
        checkCondition_7: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          },
          next: 'checkCondition_6',
        },
        ifElse_opt1: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_5' },
            whenTrue: { $sequence: 'startTimeDilation_3' },
            whenFalse: { $sequence: 'startTimeDilation_3' },
          },
          next: null,
        },
      },
      dataNodes: {
        data_1: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_talent0' } },
        data_2: {
          type: 'boolean',
          expression: {
            kind: 'buffIdStackCompare',
            target: 'caster',
            buffIds: ['buff_chr_0012_avywen_talent_0'],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
        },
        data_3: {
          type: 'number',
          expression: { kind: 'blackboard', key: 'EntityBB_talent0', fallback: 0 },
        },
        data_4: {
          type: 'boolean',
          expression: {
            kind: 'actionValueCompare',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            operator: 'greater',
            right: { kind: 'constant', value: 0 },
          },
        },
        data_5: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: null } },
        },
      },
    },
    macros: {},
  },
} as const;

export const avywennaChr_0012_avywen_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_4: {
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
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_4',
      },
      mergeContextTargets_6: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'targets',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: null,
      },
      startTimeDilation_8: {
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
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'ifElse_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'ifElse_10',
      },
      forEachContextTarget_15: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'lances' } },
          body: { $sequence: null },
        },
        next: null,
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'forEachContextTarget_15',
      },
      findOwnerSpawnedAbilityEntities_18: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'lances',
            abilityEntityIds: [
              'abilityentity_chr_0012_avywen_combo_skill_lance',
              'abilityentity_chr_0012_avywen_ultimate_skill_lance',
            ],
            owner: { kind: 'owner' },
          },
        },
        next: 'checkCondition_17',
      },
      launchProjectile_19: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_talent0: 0 },
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.5,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0012_avywen_combo_skill_lance_back',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_lance: 3,
                  poise_lance: 0,
                  potential_5_rate: 0,
                  talent0_usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'checkCondition_8' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      modifyActionValue_4: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale_lance',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'dealDamage_5',
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_6: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_7' },
                          whenTrue: { $sequence: 'modifyActionValue_4' },
                          whenFalse: { $sequence: 'dealDamage_5' },
                        },
                        next: null,
                      },
                      modifyActionValue_7: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_talent0',
                            operation: 'assign',
                            value: { kind: 'valueNode', nodeId: 'data_8' },
                          },
                        },
                        next: 'ifElse_6',
                      },
                      checkCondition_8: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
                        },
                        next: 'modifyActionValue_7',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_lance' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_lance' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_5_rate' },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_5_rate', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent0_usp' },
                      },
                      data_9: {
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
            { event: 'reach', skill: avywennaChr_0012_avywen_normal_skillActionGraphCallback2 },
          ],
        },
        next: null,
      },
      createSpatialPointTargets_20: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'launchPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_19',
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0012_avywen_lance_becalled' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createSpatialPointTargets_20',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'applyBuff_21',
      },
      forEachContextTarget_23: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'ComboLances' } },
          body: { $sequence: 'checkCondition_22' },
        },
        next: null,
      },
      checkCondition_25: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'forEachContextTarget_23',
      },
      findOwnerSpawnedAbilityEntities_26: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ComboLances',
            abilityEntityIds: ['abilityentity_chr_0012_avywen_combo_skill_lance'],
            owner: { kind: 'owner' },
          },
        },
        next: 'checkCondition_25',
      },
      launchProjectile_27: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_talent0: 0 },
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.5,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0012_avywen_ultimate_skill_lance_back',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_lance_ult: 3,
                  poise_lance_ult: 0,
                  potential_5_rate: 0,
                  talent0_usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_11' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      startTimeDilation_6: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.4 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'interrupt_weakness' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          },
                        },
                        next: null,
                      },
                      dealDamage_7: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'startTimeDilation_6',
                      },
                      modifyActionValue_5: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'atk_scale_lance_ult',
                            operation: 'multiply',
                            value: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: 'dealDamage_7',
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_8: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_7' },
                          whenTrue: { $sequence: 'modifyActionValue_5' },
                          whenFalse: { $sequence: 'dealDamage_7' },
                        },
                        next: null,
                      },
                      modifyActionValue_9: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_talent0',
                            operation: 'assign',
                            value: { kind: 'valueNode', nodeId: 'data_8' },
                          },
                        },
                        next: 'ifElse_8',
                      },
                      applyBuff_10: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_chr_0012_avywen_lance_pulse_check' }],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'modifyActionValue_9',
                      },
                      checkCondition_11: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
                        },
                        next: 'applyBuff_10',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_lance_ult' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_lance_ult' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_5_rate' },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_5_rate', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent0_usp' },
                      },
                      data_9: {
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
            { event: 'reach', skill: avywennaChr_0012_avywen_normal_skillActionGraphCallback2 },
          ],
        },
        next: null,
      },
      createSpatialPointTargets_28: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'launchPos', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_27',
      },
      applyBuff_29: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0012_avywen_lance_becalled' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createSpatialPointTargets_28',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'applyBuff_29',
      },
      forEachContextTarget_31: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'UltiLances' } },
          body: { $sequence: 'checkCondition_30' },
        },
        next: null,
      },
      checkCondition_33: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'forEachContextTarget_31',
      },
      findOwnerSpawnedAbilityEntities_34: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'UltiLances',
            abilityEntityIds: ['abilityentity_chr_0012_avywen_ultimate_skill_lance'],
            owner: { kind: 'owner' },
          },
        },
        next: 'checkCondition_33',
      },
      findOwnerSpawnedAbilityEntities_opt1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'lances',
            abilityEntityIds: [
              'abilityentity_chr_0012_avywen_combo_skill_lance',
              'abilityentity_chr_0012_avywen_ultimate_skill_lance',
            ],
            owner: { kind: 'owner' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'lances' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'ComboLances' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'UltiLances' },
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

export const avywennaChr_0012_avywen_normal_skill: SkillDefinition = {
  key: 'chr_0012_avywen_normal_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    atk_scale_lance: [0.75, 0.82, 0.9, 0.97, 1.04, 1.12, 1.19, 1.27, 1.34, 1.44, 1.55, 1.68],
    atk_scale_lance_ult: [1.92, 2.11, 2.3, 2.5, 2.69, 2.88, 3.07, 3.26, 3.46, 3.7, 3.98, 4.32],
    poise: 5,
    poise_lance: 5,
    poise_lance_ult: 10,
    potential_5_rate: 0,
    talent0_usp: 0,
  },
  timelineBlockFrames: 39,
  naturalDurationFrames: 306,
  exclusiveFrame: 38,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 34, endFrame: 60, skillIds: ['chr_0012_avywen_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt1' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'checkCondition_5' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'mergeContextTargets_6' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 0, endFrame: 6, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_18' } },
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_26' } },
    { startFrame: 7, endFrame: 10, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_34' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: avywennaChr_0012_avywen_normal_skillActionGraph,
};

export const avywennaChr_0012_avywen_combo_skillActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickBlock',
            recycleDelaySeconds: 30,
          },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0012_avywen_combo_skill_lance_gene',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 900,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { potential_2: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'fixed', target: 'enemy' },
                            abilityEntityId: 'abilityentity_chr_0012_avywen_combo_skill_lance',
                            childSkillId: 'chr_0012_avywen_combo_skill_lance',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'lance_land_pos3',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'launchProjectile_1',
      },
      createSpatialPointTargets_3: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'lance_land_pos2',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createSpatialPointTargets_2',
      },
      createSpatialPointTargets_4: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'lance_land_pos1',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'createSpatialPointTargets_3',
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      changeResource_6: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'changeResource_6' },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'forEachContextTarget_7',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'checkCondition_8',
      },
      startTimeDilation_10: {
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
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'talent0_usp' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0012_avywen_talent_0'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaChr_0012_avywen_combo_skill: SkillDefinition = {
  key: 'chr_0012_avywen_combo_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [1.69, 1.86, 2.03, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.25, 3.5, 3.8],
    poise: 10,
    potential_2: 0,
    talent0_usp: 0,
  },
  timelineBlockFrames: 41,
  naturalDurationFrames: 254,
  exclusiveFrame: 40,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 21, endFrame: 68, skillIds: ['chr_0012_avywen_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'createSpatialPointTargets_4' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 0, endFrame: 12, sequence: { $sequence: 'startTimeDilation_10' } },
  ],
  defaultTarget: 'owner',
  cooldownFrames: [390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 360],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: avywennaChr_0012_avywen_combo_skillActionGraph,
};

export const avywennaChr_0012_avywen_ultimate_skillActionGraph = {
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
      createSpatialPointTargets_3: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'TelePos', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'createSpatialPointTargets_3' },
        },
        next: null,
      },
      findTargets_5: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'ifElse_4',
      },
      findCharacterTeamTargets_6: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'MainChar', selection: { kind: 'controlledOperator' } },
        },
        next: 'findTargets_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'findCharacterTeamTargets_6',
      },
      hideUi_8: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_9: {
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
      launchProjectile_10: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickBlock',
            recycleDelaySeconds: 30,
          },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0012_avywen_ultimate_skill_lance_gene',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 900,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { potential_2: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'fixed', target: 'enemy' },
                            abilityEntityId: 'abilityentity_chr_0012_avywen_ultimate_skill_lance',
                            childSkillId: 'chr_0012_avywen_ultimate_skill_lance',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      createSpatialPointTargets_11: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'UltiLancePos', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_10',
      },
      mergeContextTargets_12: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0012_avywen_ultimate_skill_debuff',
                copiedBlackboardAssignments: {
                  pulse_vul_rate: 'pulse_vul_rate',
                  pulse_vul_duration: 'pulse_vul_duration',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      changeResource_15: {
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
      forEachContextTarget_16: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'changeResource_15' },
        },
        next: null,
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'forEachContextTarget_16',
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'checkCondition_17',
      },
      ifElse_19: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'applyBuff_14' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_18',
      },
      applyBuff_20: {
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
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'talent0_usp' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0012_avywen_talent_0'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'pulse_vul_duration', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaChr_0012_avywen_ultimate_skill: SkillDefinition = {
  key: 'chr_0012_avywen_ultimate_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [4.22, 4.64, 5.07, 5.49, 5.91, 6.33, 6.75, 7.18, 7.6, 8.13, 8.76, 9.5],
    poise: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
    potential_2: 0,
    pulse_vul_duration: 0,
    pulse_vul_rate: 0,
    talent0_usp: 0,
  },
  timelineBlockFrames: 66,
  naturalDurationFrames: 273,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 57,
        endFrame: 73,
        skillIds: ['chr_0012_avywen_combo_skill', 'chr_0012_avywen_normal_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_7' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'hideUi_8' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'startUltimateTimeDilation_9' } },
    { startFrame: 45, endFrame: 48, sequence: { $sequence: 'createSpatialPointTargets_11' } },
    { startFrame: 51, endFrame: 54, sequence: { $sequence: 'mergeContextTargets_12' } },
    { startFrame: 51, endFrame: 54, sequence: { $sequence: 'ifElse_19' } },
    { startFrame: 0, endFrame: 65, sequence: { $sequence: 'applyBuff_20' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: avywennaChr_0012_avywen_ultimate_skillActionGraph,
};

export const avywennaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const avywennaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: avywennaCommon_character_perfect_dodgeActionGraph,
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

const avywennaComboCondition1ActionGraph = {
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
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          tags: [
            'Skill/Character/Common/SpellStatus/Conduct',
            'Skill/Character/Common/SpellInflict/PulseInflict',
          ],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          selection: 'first',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttackLastCombo'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const avywennaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0012_avywen_combo_skill',
  event: 'beforeOutputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_4' },
  actionGraph: avywennaComboCondition1ActionGraph,
};

const avywennaBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const avywennaBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: avywennaBuff1ActionGraph,
};

const avywennaBuff2ActionGraph = {
  main: {
    nodes: {
      applyElementalInfliction_1: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false, target: 'buffOwner' },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyElementalInfliction_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0012_avywen_lance_pulse_check'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const avywennaBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: 0.3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: avywennaBuff2ActionGraph,
};

const avywennaBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const avywennaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: avywennaBuff3ActionGraph,
};

const avywennaBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_pulse',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'pulse_vul_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'pulse_vul_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const avywennaBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'pulse_vul_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { pulse_vul_duration: 10, pulse_vul_rate: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: avywennaBuff4ActionGraph,
};

export const avywenna: OperatorDefinition = {
  slug: 'avywenna',
  gameId: 'AVYWENNA',
  rarity: 5,
  weaponType: 'lance',
  element: 'electric',
  characterTypeId: 'Pulse',
  role: 'striker',
  mainAttribute: 'will',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [12, 33, 54, 75, 96, 107],
    agility: [10, 31, 52, 74, 95, 106],
    intellect: [14, 34, 56, 78, 99, 110],
    will: [15, 43, 73, 103, 133, 148],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        avywennaChr_0012_avywen_attack1,
        avywennaChr_0012_avywen_attack2,
        avywennaChr_0012_avywen_attack3,
        avywennaChr_0012_avywen_attack4,
        avywennaChr_0012_avywen_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: avywennaChr_0012_avywen_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: avywennaChr_0012_avywen_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: avywennaChr_0012_avywen_normal_skill,
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: avywennaChr_0012_avywen_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: avywennaChr_0012_avywen_ultimate_skill },
  ],
  dodgeSkill: avywennaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0012_avywen_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0012_avywen_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0012_avywen_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0012_avywen_attack1',
        'chr_0012_avywen_attack2',
        'chr_0012_avywen_attack3',
        'chr_0012_avywen_attack4',
        'chr_0012_avywen_attack5',
        'chr_0012_avywen_plunging_attack_end',
        'chr_0012_avywen_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0012_avywen_attack1',
        'chr_0012_avywen_attack2',
        'chr_0012_avywen_attack3',
        'chr_0012_avywen_attack4',
        'chr_0012_avywen_attack5',
      ],
      defaultSkillKey: 'chr_0012_avywen_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [avywennaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_normal_skill',
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_combo_skill',
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_ultimate_skill',
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0012_avywen_talent_0' }],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_ultimate_skill',
          blackboardKey: 'pulse_vul_rate',
          operation: 'assign',
          value: [0.06, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_ultimate_skill',
          blackboardKey: 'pulse_vul_duration',
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
          skillKey: 'chr_0012_avywen_normal_skill',
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_combo_skill',
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_ultimate_skill',
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_combo_skill',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0012_avywen_ultimate_skill',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 20,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
        { kind: 'addStaticDamageIncrease', target: 'electric', value: 0.08 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0012_avywen_ultimate_skill',
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
          skillKey: 'chr_0012_avywen_normal_skill',
          blackboardKey: 'potential_5_rate',
          operation: 'assign',
          value: 1.15,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0012_avywen_lance_becalled: avywennaBuff1,
    buff_chr_0012_avywen_lance_pulse_check: avywennaBuff2,
    buff_chr_0012_avywen_talent_0: avywennaBuff3,
    buff_chr_0012_avywen_ultimate_skill_debuff: avywennaBuff4,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0012_avywen_combo_skill_lance: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
        'Skill/Character/chr_0012_avywen/Lance/ComboLance',
      ],
      lifetime: { kind: 'limited', durationSeconds: 62 },
      childSkill: {
        skillId: 'chr_0012_avywen_combo_skill_lance',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1559,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { potential_2: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_2' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_3' } },
          { startFrame: 900, endFrame: 901, sequence: { $sequence: 'checkCondition_5' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_3' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              jumpTimeline_2: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 1500 },
                  condition: { kind: 'conditionNode', nodeId: 'data_1' },
                },
                next: null,
              },
              finishOwner_3: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              checkCondition_5: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'finishOwner_3',
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0012_avywen_lance_becalled'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_2' },
                  operator: 'less',
                  right: { kind: 'constant', value: 1 },
                },
              },
            },
          },
          macros: {},
        },
      },
      presentation: {
        icon: 'endaxis:operators/avywenna/combo_01',
        nameKey: 'effects.name.thunderlance',
        placement: 'operator',
      },
    },
    abilityentity_chr_0012_avywen_ultimate_skill_lance: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
        'Immune/Stunned',
        'Immune/Frozen',
        'Immune/Airborne',
        'Immune/KnockDown',
        'Immune/KnockBack',
        'Immune/Pull',
        'Immune/PowerSmash',
        'Immune/Poise',
        'Skill/Character/chr_0012_avywen/Lance/UltiLance',
      ],
      lifetime: { kind: 'limited', durationSeconds: 62 },
      childSkill: {
        skillId: 'chr_0012_avywen_ultimate_skill_lance',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1560,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { potential_2: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_2' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_3' } },
          { startFrame: 900, endFrame: 901, sequence: { $sequence: 'checkCondition_5' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_3' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              jumpTimeline_2: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 1500 },
                  condition: { kind: 'conditionNode', nodeId: 'data_1' },
                },
                next: null,
              },
              finishOwner_3: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              checkCondition_5: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'finishOwner_3',
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0012_avywen_lance_becalled'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_2' },
                  operator: 'less',
                  right: { kind: 'constant', value: 1 },
                },
              },
            },
          },
          macros: {},
        },
      },
      presentation: {
        icon: 'endaxis:operators/avywenna/ultimate_01',
        nameKey: 'effects.name.thunderlanceEx',
        placement: 'operator',
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default avywenna;
