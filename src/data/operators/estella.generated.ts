/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const estellaChr_0021_whiten_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.08 },
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
          parameters: { skillIds: ['chr_0021_whiten_attack2'] },
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

export const estellaChr_0021_whiten_attack1: SkillDefinition = {
  key: 'chr_0021_whiten_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 105,
  exclusiveFrame: 18,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 6,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0021_whiten_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 13, endFrame: 28, skillIds: ['chr_0021_whiten_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 13, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0021_whiten_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: estellaChr_0021_whiten_attack1ActionGraph,
};

export const estellaChr_0021_whiten_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.16 },
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
          parameters: { skillIds: ['chr_0021_whiten_attack3'] },
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

export const estellaChr_0021_whiten_attack2: SkillDefinition = {
  key: 'chr_0021_whiten_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 123,
  exclusiveFrame: 28,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 7,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0021_whiten_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 30, skillIds: ['chr_0021_whiten_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 16, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0021_whiten_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: estellaChr_0021_whiten_attack2ActionGraph,
};

export const estellaChr_0021_whiten_attack3ActionGraph = {
  main: {
    nodes: {
      changeResource_4: {
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
      startTimeDilation_5: {
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
            durationSeconds: { kind: 'constant', value: 0.15 },
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
          parameters: { skillIds: ['chr_0021_whiten_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaChr_0021_whiten_attack3: SkillDefinition = {
  key: 'chr_0021_whiten_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    atk_scale2: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 153,
  exclusiveFrame: 28,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 43,
        input: 'basicAttack',
        targetSkillId: 'chr_0021_whiten_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 28, endFrame: 43, skillIds: ['chr_0021_whiten_attack4'] }],
  },
  costFrame: 20,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 28, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0021_whiten_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: estellaChr_0021_whiten_attack3ActionGraph,
};

export const estellaChr_0021_whiten_attack4ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.38 },
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_5',
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0021_whiten_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaChr_0021_whiten_attack4: SkillDefinition = {
  key: 'chr_0021_whiten_attack4',
  element: 'physical',
  blackboard: {
    atb: 19,
    atk_scale: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
    poise: 17,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 134,
  exclusiveFrame: 46,
  offsetRecordFrame: 21,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 24,
        endFrame: 59,
        input: 'basicAttack',
        targetSkillId: 'chr_0021_whiten_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 46, endFrame: 59, skillIds: ['chr_0021_whiten_attack1'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 46, endFrame: 59, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0021_whiten_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: estellaChr_0021_whiten_attack4ActionGraph,
};

export const estellaChr_0021_whiten_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'white_power' },
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
      gainFinisherSp_5: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'gainFinisherSp_5' },
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
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_6',
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
      applyBuff_9: {
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
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaChr_0021_whiten_power_attack: SkillDefinition = {
  key: 'chr_0021_whiten_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 151,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 30,
        endFrame: 58,
        skillIds: ['chr_0021_whiten_normal_skill', 'chr_0021_whiten_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 30, endFrame: 33, sequence: { $sequence: 'ifElse_3' } },
    { startFrame: 30, endFrame: 39, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_9' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: estellaChr_0021_whiten_power_attackActionGraph,
};

export const estellaChr_0021_whiten_plunging_attack_endActionGraph = {
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

export const estellaChr_0021_whiten_plunging_attack_end: SkillDefinition = {
  key: 'chr_0021_whiten_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 175,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: estellaChr_0021_whiten_plunging_attack_endActionGraph,
};

export const estellaChr_0021_whiten_normal_skillActionGraph = {
  main: {
    nodes: {
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'front', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'createSpatialPointTargets_2' },
        },
        next: null,
      },
      findCharacterTeamTargets_4: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: 'ifElse_3',
      },
      findTargets_5: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'maintar',
          },
        },
        next: 'findCharacterTeamTargets_4',
      },
      createSpatialPointTargets_6: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'pos', count: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'createSpatialPointTargets_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      findCharacterTeamTargets_8: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: 'ifElse_7',
      },
      findTargets_9: {
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
      launchProjectile_29: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_first_hit: 0 },
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0021_whiten_normal_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 150,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, dmg_up: 0, poise: 30, up_atk_scale: 0 },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 0,
                    sequence: { $sequence: 'applyElementalInfliction_10' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_7: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      startTimeDilation_2: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.05 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_hard_stop' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          },
                        },
                        next: null,
                      },
                      applyBuff_3: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                            targets: { kind: 'source' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'startTimeDilation_2',
                      },
                      dealDamage_4: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'valueNode', nodeId: 'data_4' },
                              },
                            ],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'applyBuff_3',
                      },
                      modifyActionValue_5: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'up_atk_scale',
                            operation: 'assign',
                            value: { kind: 'valueNode', nodeId: 'data_1' },
                          },
                        },
                        next: 'dealDamage_4',
                      },
                      modifyActionValue_6: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_first_hit',
                            operation: 'add',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: 'modifyActionValue_5',
                      },
                      ifElse_8: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
                          whenTrue: { $sequence: 'modifyActionValue_6' },
                          whenFalse: { $sequence: 'dealDamage_7' },
                        },
                        next: null,
                      },
                      forEachContextTarget_9: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                          body: { $sequence: 'ifElse_8' },
                        },
                        next: null,
                      },
                      applyElementalInfliction_10: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'cryo', isExtra: false },
                        },
                        next: 'forEachContextTarget_9',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'up_atk_scale' },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_up' } },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_first_hit', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
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
          ],
        },
        next: null,
      },
      createSpatialPointTargets_30: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'tar_behind', count: { kind: 'constant', value: 1 } },
        },
        next: 'launchProjectile_29',
      },
      ifElse_31: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'createSpatialPointTargets_30' },
          whenFalse: { $sequence: 'createSpatialPointTargets_30' },
        },
        next: null,
      },
      findTargets_32: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'maintar',
          },
        },
        next: 'ifElse_31',
      },
      finishBuffsById_33: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0021_whiten_talent_0_active'],
            reason: 'other',
          },
        },
        next: null,
      },
      changeResource_34: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: 'finishBuffsById_33',
      },
      readBuffBlackboard_35: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0021_whiten_talent_0_active'] },
            desiredKey: 'atb',
            outputKey: 'atb',
          },
        },
        next: 'changeResource_34',
      },
      checkCondition_36: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readBuffBlackboard_35',
      },
    },
    dataNodes: {
      data_1: {
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
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0021_whiten_talent_0_active'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaChr_0021_whiten_normal_skill: SkillDefinition = {
  key: 'chr_0021_whiten_normal_skill',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    distance: 8,
    dmg_up: 0,
    poise: 10,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 121,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findTargets_5' } },
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'findCharacterTeamTargets_8' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'findTargets_9' } },
    { startFrame: 21, endFrame: 24, sequence: { $sequence: 'findTargets_32' } },
    { startFrame: 21, endFrame: 24, sequence: { $sequence: 'checkCondition_36' } },
  ],
  defaultTarget: 'owner',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: estellaChr_0021_whiten_normal_skillActionGraph,
};

export const estellaChr_0021_whiten_ultimate_skillActionGraph = {
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
      hideUi_2: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
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
      applyPhysicalInfliction_5: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyPhysicalInfliction_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'dealDamage_7',
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_8',
      },
      forEachContextTarget_10: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'checkCondition_6' },
        },
        next: 'modifyActionValue_9',
      },
      applyBuff_11: {
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic'],
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_total' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_up_total' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaChr_0021_whiten_ultimate_skill: SkillDefinition = {
  key: 'chr_0021_whiten_ultimate_skill',
  element: 'physical',
  blackboard: {
    atk_scale: [4.89, 5.38, 5.86, 6.35, 6.84, 7.33, 7.82, 8.31, 8.8, 9.41, 10.14, 11],
    atk_scale_total: 0,
    dmg_up_total: 0,
    poise: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
  },
  timelineBlockFrames: 60,
  naturalDurationFrames: 168,
  exclusiveFrame: 77,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 51,
        endFrame: 77,
        input: 'basicAttack',
        targetSkillId: 'chr_0021_whiten_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 60,
        endFrame: 77,
        skillIds: [
          'chr_0021_whiten_attack1',
          'chr_0021_whiten_normal_skill',
          'chr_0021_whiten_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 54, sequence: { $sequence: 'hideUi_2' } },
    { startFrame: 0, endFrame: 54, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 54, endFrame: 57, sequence: { $sequence: 'forEachContextTarget_10' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'applyBuff_11' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 70 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: estellaChr_0021_whiten_ultimate_skillActionGraph,
};

export const estellaChr_0021_whiten_combo_skillActionGraph = {
  main: {
    nodes: {
      dealDamage_12: {
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
      applyPhysicalInfliction_13: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_12',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      applyPhysicalInfliction_8: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0021_whiten_combo_skill_physical_vulnerable',
                copiedBlackboardAssignments: { duration: 'duration', rate: 'rate' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyPhysicalInfliction_8',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'applyBuff_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'modifyActionValue_6' },
          whenFalse: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_11' },
          whenFalse: { $sequence: 'applyPhysicalInfliction_13' },
        },
        next: null,
      },
      changeResource_15: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'changeResource_15' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forEachContextTarget_17: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_14' },
        },
        next: 'ifElse_16',
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'whiten_combo' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_19: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'whiten_combo' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_21: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'startTimeDilation_19' },
          whenFalse: { $sequence: 'startTimeDilation_20' },
        },
        next: null,
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'ifElse_21',
      },
      startTimeDilation_23: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'rate_plus' } },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_potential1', fallback: 0 },
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
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_11: {
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

export const estellaChr_0021_whiten_combo_skill: SkillDefinition = {
  key: 'chr_0021_whiten_combo_skill',
  element: 'physical',
  blackboard: {
    atk_scale: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    atk_scale2: [2.8, 3.08, 3.36, 3.64, 3.92, 4.2, 4.48, 4.76, 5.04, 5.39, 5.81, 6.3],
    duration: 6,
    has_potential1: 0,
    poise: 10,
    rate: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15],
    rate_plus: -0.1,
    usp: 10,
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 154,
  exclusiveFrame: 33,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 20, endFrame: 59, skillIds: ['chr_0021_whiten_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 19, endFrame: 34, sequence: { $sequence: 'forEachContextTarget_17' } },
    { startFrame: 19, endFrame: 22, sequence: { $sequence: 'checkCondition_22' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_23' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: estellaChr_0021_whiten_combo_skillActionGraph,
};

export const estellaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const estellaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: estellaCommon_character_perfect_dodgeActionGraph,
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

const estellaComboCondition1ActionGraph = {
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
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0021_whiten_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: estellaComboCondition1ActionGraph,
};

const estellaBuff1ActionGraph = {
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

const estellaBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, rate: -0.3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: estellaBuff1ActionGraph,
};

const estellaBuff2ActionGraph = {
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
                buffId: 'buff_chr_0021_whiten_potential_5_inaura',
                blackboardAssignments: {
                  usp: { kind: 'valueNode', nodeId: 'data_1' },
                  cd: { kind: 'valueNode', nodeId: 'data_2' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 1, usp: 5 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
  actionGraph: estellaBuff2ActionGraph,
};

const estellaBuff3ActionGraph = {
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
          },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'buff_chr_0021_whiten_potential_5_cd',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_2' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'changeResource_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'createTimedMarker_2',
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'caster',
          markerId: 'buff_chr_0021_whiten_potential_5_cd',
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 1, usp: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
  ],
  actionGraph: estellaBuff3ActionGraph,
};

const estellaBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0021_whiten_talent_0_active',
                copiedBlackboardAssignments: { atb: 'atb' },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatusSpecial/Shatter'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: estellaBuff4ActionGraph,
};

const estellaBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 5 },
  attributeModifiers: [],
  actionGraph: estellaBuff5ActionGraph,
};

const estellaBuff6ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const estellaBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Immune/SpellInflictOnChar/CrystInflictOnChar'],
  extendTags: [],
  blackboard: { dmg_down: -0.2 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_down' },
        },
      ],
    },
  ],
  actionGraph: estellaBuff6ActionGraph,
};

export const estella: OperatorDefinition = {
  slug: 'estella',
  gameId: 'ESTELLA',
  rarity: 4,
  weaponType: 'lance',
  element: 'cryo',
  characterTypeId: 'Cryst',
  role: 'guard',
  mainAttribute: 'will',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 32, 53, 73, 94, 104],
    agility: [8, 27, 47, 67, 87, 97],
    intellect: [14, 34, 56, 78, 99, 110],
    will: [15, 44, 74, 105, 136, 151],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        estellaChr_0021_whiten_attack1,
        estellaChr_0021_whiten_attack2,
        estellaChr_0021_whiten_attack3,
        estellaChr_0021_whiten_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: estellaChr_0021_whiten_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: estellaChr_0021_whiten_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: estellaChr_0021_whiten_normal_skill,
    },
    { key: 'ultimate', operationType: 'ultimate', skills: estellaChr_0021_whiten_ultimate_skill },
    { key: 'comboSkill', operationType: 'comboSkill', skills: estellaChr_0021_whiten_combo_skill },
  ],
  dodgeSkill: estellaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0021_whiten_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0021_whiten_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0021_whiten_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0021_whiten_attack1',
        'chr_0021_whiten_attack2',
        'chr_0021_whiten_attack3',
        'chr_0021_whiten_attack4',
        'chr_0021_whiten_plunging_attack_end',
        'chr_0021_whiten_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0021_whiten_attack1',
        'chr_0021_whiten_attack2',
        'chr_0021_whiten_attack3',
        'chr_0021_whiten_attack4',
      ],
      defaultSkillKey: 'chr_0021_whiten_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [estellaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0021_whiten_talent_0', blackboardAssignments: { atb: [7.5, 15] } },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0021_whiten_talent_1',
          blackboardAssignments: { dmg_down: [-0.1, -0.2] },
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
          skillKey: 'chr_0021_whiten_combo_skill',
          blackboardKey: 'has_potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0021_whiten_combo_skill',
          blackboardKey: 'rate_plus',
          operation: 'assign',
          value: 3,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0021_whiten_ultimate_skill',
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
          skillKey: 'chr_0021_whiten_normal_skill',
          blackboardKey: 'distance',
          operation: 'assign',
          value: 12,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0021_whiten_normal_skill',
          blackboardKey: 'dmg_up',
          operation: 'assign',
          value: 0.4,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 10 },
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 10 },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        { buffId: 'buff_chr_0021_whiten_potential_5', blackboardAssignments: { usp: 5 } },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0021_whiten_combo_skill_physical_vulnerable: estellaBuff1,
    buff_chr_0021_whiten_potential_5: estellaBuff2,
    buff_chr_0021_whiten_potential_5_inaura: estellaBuff3,
    buff_chr_0021_whiten_talent_0: estellaBuff4,
    buff_chr_0021_whiten_talent_0_active: estellaBuff5,
    buff_chr_0021_whiten_talent_1: estellaBuff6,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default estella;
