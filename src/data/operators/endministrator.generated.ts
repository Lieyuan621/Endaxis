/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const endministratorChr_0003_endminf_attack1ActionGraph = {
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
          parameters: { skillIds: ['chr_0003_endminf_attack2'] },
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

export const endministratorChr_0003_endminf_attack1: SkillDefinition = {
  actionGraph: endministratorChr_0003_endminf_attack1ActionGraph,
  key: 'chr_0003_endminf_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51],
    poise: 0,
  },
  timelineBlockFrames: 9,
  naturalDurationFrames: 179,
  exclusiveFrame: 12,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 5,
        endFrame: 24,
        input: 'basicAttack',
        targetSkillId: 'chr_0003_endminf_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 9, endFrame: 24, skillIds: ['chr_0003_endminf_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 9, endFrame: 24, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0003_endminf_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const endministratorChr_0003_endminf_attack2ActionGraph = {
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
          parameters: { skillIds: ['chr_0003_endminf_attack3'] },
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

export const endministratorChr_0003_endminf_attack2: SkillDefinition = {
  actionGraph: endministratorChr_0003_endminf_attack2ActionGraph,
  key: 'chr_0003_endminf_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
    poise: 0,
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 105,
  exclusiveFrame: 15,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 4,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0003_endminf_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 30, skillIds: ['chr_0003_endminf_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0003_endminf_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const endministratorChr_0003_endminf_attack3ActionGraph = {
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
          parameters: { skillIds: ['chr_0003_endminf_attack4'] },
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

export const endministratorChr_0003_endminf_attack3: SkillDefinition = {
  actionGraph: endministratorChr_0003_endminf_attack3ActionGraph,
  key: 'chr_0003_endminf_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    poise: 0,
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.63, 0.68],
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 101,
  exclusiveFrame: 22,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 12,
        endFrame: 35,
        input: 'basicAttack',
        targetSkillId: 'chr_0003_endminf_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 17, endFrame: 35, skillIds: ['chr_0003_endminf_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 17, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  timelineContinuationSkillId: 'chr_0003_endminf_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const endministratorChr_0003_endminf_attack4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
        next: null,
      },
      changeResourceByActionValue_2: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.25 },
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
      startTimeDilation_9: {
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
        next: null,
      },
      changeResourceByActionValue_10: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 0.25 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_9',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_10' },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.02 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'endminf_stone' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_14: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 0.25 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_14' },
        },
        next: null,
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_15',
      },
      reachSkillOperableBoundary_17: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0003_endminf_attack5'] },
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
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_attack4: SkillDefinition = {
  key: 'chr_0003_endminf_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19],
    poise: 0,
    display_atk_scale: [0.35, 0.38, 0.41, 0.45, 0.48, 0.52, 0.55, 0.59, 0.62, 0.67, 0.72, 0.78],
  },
  timelineBlockFrames: 32,
  naturalDurationFrames: 127,
  exclusiveFrame: 34,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 18,
        endFrame: 45,
        input: 'basicAttack',
        targetSkillId: 'chr_0003_endminf_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 32, endFrame: 45, skillIds: ['chr_0003_endminf_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_16' } },
    { startFrame: 32, endFrame: 45, sequence: { $sequence: 'reachSkillOperableBoundary_17' } },
  ],
  timelineContinuationSkillId: 'chr_0003_endminf_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack4ActionGraph,
};

export const endministratorChr_0003_endminf_attack5ActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
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
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isHitbyMain',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'changeResourceByActionValue_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      dealDamage_5: {
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
        next: 'conditional_4',
      },
      startTimeDilation_7: {
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
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'enemy',
            buffIds: ['buff_chr_0003_endminf_attack4'],
            reason: 'other',
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0003_endminf_attack1'] },
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

export const endministratorChr_0003_endminf_attack5: SkillDefinition = {
  key: 'chr_0003_endminf_attack5',
  blackboard: {
    atb: 20,
    atk_scale: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
    isHitbyMain: 0,
    poise: 18,
  },
  timelineBlockFrames: 25,
  naturalDurationFrames: 125,
  exclusiveFrame: 26,
  offsetRecordFrame: 18,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0003_endminf_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 25, endFrame: 32, skillIds: ['chr_0003_endminf_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 16, endFrame: 19, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'finishBuffsById_9' } },
    { startFrame: 25, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  timelineContinuationSkillId: 'chr_0003_endminf_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack5ActionGraph,
};

export const endministratorChr_0003_endminf_power_attack2ActionGraph = {
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
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
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
            calculationMultiplier: 0.9,
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
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
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
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_power_attack2: SkillDefinition = {
  key: 'chr_0003_endminf_power_attack2',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 27,
  naturalDurationFrames: 192,
  exclusiveFrame: 47,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 27,
        endFrame: 58,
        skillIds: ['chr_0003_endminf_normal_skill', 'chr_0003_endminf_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 9, endFrame: 15, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 27, endFrame: 29, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 30, endFrame: 32, sequence: { $sequence: 'conditional_opt1' } },
    { startFrame: 11, endFrame: 29, sequence: { $sequence: 'conditional_opt2' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 0, endFrame: 27, sequence: { $sequence: 'applyBuff_14' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: endministratorChr_0003_endminf_power_attack2ActionGraph,
};

export const endministratorChr_0003_endminf_plunging_attack_endActionGraph = {
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

export const endministratorChr_0003_endminf_plunging_attack_end: SkillDefinition = {
  actionGraph: endministratorChr_0003_endminf_plunging_attack_endActionGraph,
  key: 'chr_0003_endminf_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 154,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const endministratorChr_0003_endminf_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'trigger', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.36 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.4,
                  inTangent: -4.16987,
                  outTangent: -4.16987,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.15,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.4844323,
                  value: 0.07220779,
                  inTangent: 0.1940728,
                  outTangent: 0.1940728,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.032697,
                  outTangent: 3.032697,
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
        next: 'modifyActionValue_10',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_11' },
        },
        next: null,
      },
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_13',
      },
      applyPhysicalInfliction_15: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
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
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'knockback',
                iconPath: '/icons/knockback.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: false,
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
              extendTags: [],
              blackboard: {
                atk_scale: 1,
                count: 0,
                dmg_multiplier: 1,
                duration: 3,
                ignore_hit_effect: 0,
              },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_18' } },
              actionGraph: {
                main: {
                  nodes: {
                    dealDamage_1: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                        },
                      },
                      next: null,
                    },
                    finishBuffsById_2: {
                      action: {
                        kind: 'finishBuffsById',
                        parameters: {
                          target: 'buffOwner',
                          buffIds: ['buff_physical_no_guard'],
                          reason: 'early',
                        },
                      },
                      next: 'dealDamage_1',
                    },
                    modifyActionValue_3: {
                      action: {
                        kind: 'modifyActionValue',
                        parameters: {
                          key: 'atk_scale',
                          operation: 'multiply',
                          value: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: 'finishBuffsById_2',
                    },
                    readSkillSettingData_4: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [3, 4.5, 6, 7.5],
                              column: { kind: 'valueNode', nodeId: 'data_3' },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'modifyActionValue_3',
                    },
                    readBuffStackCount_5: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_4',
                    },
                    applyBuff_6: {
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
                    igniteBuffs_7: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
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
                          priority: 15,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_9: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_10: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.25 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_11: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.5 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_12: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.65 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    switch_13: {
                      action: {
                        kind: 'switch',
                        parameters: {
                          choice: { kind: 'valueNode', nodeId: 'data_4' },
                          alwaysNext: true,
                        },
                        options: [
                          {
                            value: { kind: 'constant', value: 0 },
                            sequence: { $sequence: 'startTimeDilation_8' },
                          },
                          {
                            value: { kind: 'constant', value: 1 },
                            sequence: { $sequence: 'startTimeDilation_9' },
                          },
                          {
                            value: { kind: 'constant', value: 2 },
                            sequence: { $sequence: 'startTimeDilation_10' },
                          },
                          {
                            value: { kind: 'constant', value: 3 },
                            sequence: { $sequence: 'startTimeDilation_11' },
                          },
                          {
                            value: { kind: 'constant', value: 4 },
                            sequence: { $sequence: 'startTimeDilation_12' },
                          },
                        ],
                      },
                      next: null,
                    },
                    conditional_14: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        whenTrue: { $sequence: 'switch_13' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_15: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:3',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_14' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_16: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:2',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_7' },
                      },
                      next: 'withActionBlackboardScope_15',
                    },
                    withActionBlackboardScope_17: {
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
                        body: { $sequence: 'applyBuff_6' },
                      },
                      next: 'withActionBlackboardScope_16',
                    },
                    withActionBlackboardScope_18: {
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
                        body: { $sequence: 'readBuffStackCount_5' },
                      },
                      next: 'withActionBlackboardScope_17',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'dmg_multiplier' },
                    },
                    data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_5: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
                    },
                    data_6: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_5' },
                        operator: 'less',
                        right: { kind: 'constant', value: 0.5 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: 'dealDamage_14',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'has_returned',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'dealDamage_14',
      },
      changeResourceByActionValue_7: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: 'modifyActionValue_6',
      },
      applyPhysicalInfliction_8: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
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
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'knockback',
                iconPath: '/icons/knockback.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: false,
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
              extendTags: [],
              blackboard: {
                atk_scale: 1,
                count: 0,
                dmg_multiplier: 1,
                duration: 3,
                ignore_hit_effect: 0,
              },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_18' } },
              actionGraph: {
                main: {
                  nodes: {
                    dealDamage_1: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                        },
                      },
                      next: null,
                    },
                    finishBuffsById_2: {
                      action: {
                        kind: 'finishBuffsById',
                        parameters: {
                          target: 'buffOwner',
                          buffIds: ['buff_physical_no_guard'],
                          reason: 'early',
                        },
                      },
                      next: 'dealDamage_1',
                    },
                    modifyActionValue_3: {
                      action: {
                        kind: 'modifyActionValue',
                        parameters: {
                          key: 'atk_scale',
                          operation: 'multiply',
                          value: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: 'finishBuffsById_2',
                    },
                    readSkillSettingData_4: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [3, 4.5, 6, 7.5],
                              column: { kind: 'valueNode', nodeId: 'data_3' },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'modifyActionValue_3',
                    },
                    readBuffStackCount_5: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_4',
                    },
                    applyBuff_6: {
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
                    igniteBuffs_7: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
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
                          priority: 15,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_9: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_10: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.25 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_11: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.5 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_12: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.65 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    switch_13: {
                      action: {
                        kind: 'switch',
                        parameters: {
                          choice: { kind: 'valueNode', nodeId: 'data_4' },
                          alwaysNext: true,
                        },
                        options: [
                          {
                            value: { kind: 'constant', value: 0 },
                            sequence: { $sequence: 'startTimeDilation_8' },
                          },
                          {
                            value: { kind: 'constant', value: 1 },
                            sequence: { $sequence: 'startTimeDilation_9' },
                          },
                          {
                            value: { kind: 'constant', value: 2 },
                            sequence: { $sequence: 'startTimeDilation_10' },
                          },
                          {
                            value: { kind: 'constant', value: 3 },
                            sequence: { $sequence: 'startTimeDilation_11' },
                          },
                          {
                            value: { kind: 'constant', value: 4 },
                            sequence: { $sequence: 'startTimeDilation_12' },
                          },
                        ],
                      },
                      next: null,
                    },
                    conditional_14: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        whenTrue: { $sequence: 'switch_13' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_15: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:3',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_14' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_16: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:2',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_7' },
                      },
                      next: 'withActionBlackboardScope_15',
                    },
                    withActionBlackboardScope_17: {
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
                        body: { $sequence: 'applyBuff_6' },
                      },
                      next: 'withActionBlackboardScope_16',
                    },
                    withActionBlackboardScope_18: {
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
                        body: { $sequence: 'readBuffStackCount_5' },
                      },
                      next: 'withActionBlackboardScope_17',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'dmg_multiplier' },
                    },
                    data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_5: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
                    },
                    data_6: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_5' },
                        operator: 'less',
                        right: { kind: 'constant', value: 0.5 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: 'changeResourceByActionValue_7',
      },
      readBuffBlackboard_9: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential1'] },
            desiredKey: 'atb_return',
            outputKey: 'atb_return',
          },
        },
        next: 'applyPhysicalInfliction_8',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'readBuffBlackboard_9' },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_12' },
          whenFalse: { $sequence: 'applyPhysicalInfliction_15' },
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
      gainSquadUltimateEnergyFromSkillCost_18: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_potential5_trigger',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_19' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'trigger', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_originum_frozen'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_originum_frozen'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_returned', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_7' },
            { kind: 'conditionNode', nodeId: 'data_8' },
            { kind: 'conditionNode', nodeId: 'data_10' },
          ],
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_12' },
            { kind: 'conditionNode', nodeId: 'data_13' },
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_normal_skill: SkillDefinition = {
  key: 'chr_0003_endminf_normal_skill',
  blackboard: {
    atb_return: 0,
    atk_scale: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    has_returned: 0,
    poise: 10,
    trigger: 0,
  },
  timelineBlockFrames: 29,
  naturalDurationFrames: 151,
  exclusiveFrame: 28,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 54, skillIds: ['chr_0003_endminf_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'repeatEachTick_17' } },
    {
      startFrame: 11,
      endFrame: 12,
      sequence: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_18' },
    },
    { startFrame: 11, endFrame: 14, sequence: { $sequence: 'conditional_20' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: endministratorChr_0003_endminf_normal_skillActionGraph,
};

export const endministratorChr_0003_endminf_ultimate_skillActionGraph = {
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
      igniteBuffs_4: {
        action: {
          kind: 'igniteBuffs',
          parameters: { target: 'enemy', source: 'caster', igniteType: 'EndminUlt' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
          },
        },
        next: 'igniteBuffs_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'conditional_6' },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'forEachContextTarget_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_potential5_trigger',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
      applyBuff_12: {
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
      hideUi_13: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_14: {
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
        expression: { kind: 'blackboard', key: 'originum_ult_break_scale' },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_originum_frozen'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_5' },
            { kind: 'conditionNode', nodeId: 'data_6' },
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_ultimate_skill: SkillDefinition = {
  key: 'chr_0003_endminf_ultimate_skill',
  blackboard: {
    atk_scale: [3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8],
    originum_ult_break_scale: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 25,
  },
  timelineBlockFrames: 56,
  naturalDurationFrames: 250,
  exclusiveFrame: 55,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 50, endFrame: 53, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 50, endFrame: 53, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'applyBuff_12' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'hideUi_13' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'startUltimateTimeDilation_14' } },
  ],
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: endministratorChr_0003_endminf_ultimate_skillActionGraph,
};

export const endministratorChr_0003_endminf_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      changeResourceByActionValue_2: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
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
        next: 'changeResourceByActionValue_2',
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'startTimeDilation_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_originum_frozen',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              atk_scale_trigger: 'atk_scale_trigger',
              originum_ult_break_scale: 'originum_ult_break_scale',
            },
          },
        },
        next: 'dealDamage_4',
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'constant', value: 0 },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'applyBuff_5',
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.867000043 },
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
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 30,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.05,
                  inTangent: 0.000489342,
                  outTangent: 0.000489342,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.6112276,
                  value: 0.03604198,
                  inTangent: 0.3674083,
                  outTangent: 0.3674083,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.44,
                  outTangent: 4.44,
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
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_combo_skill: SkillDefinition = {
  actionGraph: endministratorChr_0003_endminf_combo_skillActionGraph,
  key: 'chr_0003_endminf_combo_skill',
  blackboard: {
    atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    atk_scale_trigger: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    duration: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4.5, 4.5, 5],
    originum_ult_break_scale: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 10,
    usp: 10,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 164,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 23, endFrame: 54, skillIds: ['chr_0003_endminf_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'startTimeDilation_7' } },
    { startFrame: 0, endFrame: 4, sequence: { $sequence: 'conditional_9' } },
  ],
  smartTarget: 'input',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const endministratorCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: endministratorCommon_character_perfect_dodgeActionGraph,
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

const endministratorPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_talent_0_aura',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
            blackboardAssignments: { dmg: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0003_endminf_talent_0',
  blackboard: { dmg: [0.1, 0.2] },
  enableSequence: { $sequence: 'applyBuff_1' },
  actionGraph: endministratorPassive1ActionGraph,
};

const endministratorComboCondition1ActionGraph = {
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_1' },
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_2' } },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0003_endminf_combo_skill',
  event: 'outputDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: endministratorComboCondition1ActionGraph,
};

const endministratorBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb_return: 50 },
  attributeModifiers: [],
  actionGraph: endministratorBuff1ActionGraph,
};

const endministratorBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ratio: 0.5 },
  attributeModifiers: [],
  actionGraph: endministratorBuff2ActionGraph,
};

const endministratorBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { usp: 15 },
  attributeModifiers: [],
  actionGraph: endministratorBuff3ActionGraph,
};

const endministratorBuff4ActionGraph = {
  main: {
    nodes: {
      adjustSkillCooldown_1: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0002_endminm_combo_skill' },
            operation: 'reduce',
            basis: 'absoluteSeconds',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      adjustSkillCooldown_2: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0003_endminf_combo_skill' },
            operation: 'reduce',
            basis: 'absoluteSeconds',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'adjustSkillCooldown_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'adjustSkillCooldown_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd_minus' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'cd_minus' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd_minus: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
  ],
  actionGraph: endministratorBuff4ActionGraph,
};

const endministratorBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: endministratorBuff5ActionGraph,
};

const endministratorBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: {
        kind: 'all',
        conditions: [
          {
            kind: 'buffIdCountCompare',
            target: 'enemy',
            buffIds: ['buff_common_originum_frozen'],
            operator: 'greaterOrEqual',
            value: 1,
          },
          { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
        ],
      },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'dmg' },
        },
      ],
    },
  ],
  actionGraph: endministratorBuff6ActionGraph,
};

const endministratorBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_talent_0',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { dmg: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: endministratorBuff7ActionGraph,
};

const endministratorBuff8ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0.15, duration: 15 },
  attributeModifiers: [],
  actionGraph: endministratorBuff8ActionGraph,
};

const endministratorBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const endministratorBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0.1, duration: 10 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: endministratorBuff9ActionGraph,
};

export const endministrator: OperatorDefinition = {
  slug: 'endministrator',
  gameId: 'ENDMINISTRATOR',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [14, 38, 62, 86, 111, 123],
    agility: [14, 41, 69, 98, 126, 140],
    intellect: [9, 28, 47, 67, 87, 96],
    will: [10, 31, 53, 74, 96, 107],
    baseAttack: [30, 92, 157, 222, 287, 319],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        endministratorChr_0003_endminf_attack1,
        endministratorChr_0003_endminf_attack2,
        endministratorChr_0003_endminf_attack3,
        endministratorChr_0003_endminf_attack4,
        endministratorChr_0003_endminf_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: endministratorChr_0003_endminf_power_attack2,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: endministratorChr_0003_endminf_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: endministratorChr_0003_endminf_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: endministratorChr_0003_endminf_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: endministratorChr_0003_endminf_combo_skill,
    },
  ],
  dodgeSkill: endministratorCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0003_endminf_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0003_endminf_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0003_endminf_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0003_endminf_attack1',
        'chr_0003_endminf_attack2',
        'chr_0003_endminf_attack3',
        'chr_0003_endminf_attack4',
        'chr_0003_endminf_attack5',
        'chr_0003_endminf_plunging_attack_end',
        'chr_0003_endminf_power_attack2',
      ],
      normalAttackSkillKeys: [
        'chr_0003_endminf_attack1',
        'chr_0003_endminf_attack2',
        'chr_0003_endminf_attack3',
        'chr_0003_endminf_attack4',
        'chr_0003_endminf_attack5',
      ],
      defaultSkillKey: 'chr_0003_endminf_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [endministratorComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0003_endminf_talent_1',
          blackboardAssignments: { atk_up: [0.15, 0.3], duration: 15 },
        },
      ],
    },
    { levels: 2, passiveSkills: [endministratorPassive1] },
  ],
  potentials: [
    {
      levels: 1,
      attachedBuffs: [
        { buffId: 'buff_chr_0003_endminf_potential1', blackboardAssignments: { atb_return: 50 } },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        { buffId: 'buff_chr_0003_endminf_potential2', blackboardAssignments: { ratio: 0.5 } },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        { buffId: 'buff_chr_0003_endminf_potential3', blackboardAssignments: { usp: 15 } },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'health', operation: 'percent', value: 0.1 },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        { buffId: 'buff_chr_0003_endminf_potential5', blackboardAssignments: { cd_minus: 2 } },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0003_endminf_potential1: endministratorBuff1,
    buff_chr_0003_endminf_potential2: endministratorBuff2,
    buff_chr_0003_endminf_potential3: endministratorBuff3,
    buff_chr_0003_endminf_potential5: endministratorBuff4,
    buff_chr_0003_endminf_potential5_trigger: endministratorBuff5,
    buff_chr_0003_endminf_talent_0: endministratorBuff6,
    buff_chr_0003_endminf_talent_0_aura: endministratorBuff7,
    buff_chr_0003_endminf_talent_1: endministratorBuff8,
    buff_chr_0003_endminf_talent_1_tirgger: endministratorBuff9,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default endministrator;
