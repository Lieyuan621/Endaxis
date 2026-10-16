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
      startTimeDilation_3: {
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
      changeResource_4: {
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
        next: 'startTimeDilation_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_4' },
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
  key: 'chr_0003_endminf_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51],
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
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 9, endFrame: 24, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0003_endminf_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack1ActionGraph,
};

export const endministratorChr_0003_endminf_attack2ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
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
      changeResource_4: {
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
        next: 'startTimeDilation_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_4' },
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
  key: 'chr_0003_endminf_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
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
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0003_endminf_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack2ActionGraph,
};

export const endministratorChr_0003_endminf_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_4: {
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
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_5' },
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
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_6',
      },
      startTimeDilation_9: {
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
      changeResource_10: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'changeResource_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_12: {
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
        next: 'ifElse_11',
      },
      reachSkillOperableBoundary_13: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_attack3: SkillDefinition = {
  key: 'chr_0003_endminf_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    poise: 0,
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
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 17, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0003_endminf_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack3ActionGraph,
};

export const endministratorChr_0003_endminf_attack4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_5: {
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
      changeResource_6: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.25 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_5',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_7',
      },
      startTimeDilation_15: {
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
      changeResource_16: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.25 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_15',
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_16' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_17',
      },
      startTimeDilation_21: {
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
      changeResource_22: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.25 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_21',
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'changeResource_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_24: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_23',
      },
      reachSkillOperableBoundary_25: {
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
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_attack4: SkillDefinition = {
  key: 'chr_0003_endminf_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19],
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
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_18' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_24' } },
    { startFrame: 32, endFrame: 45, sequence: { $sequence: 'reachSkillOperableBoundary_25' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0003_endminf_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack4ActionGraph,
};

export const endministratorChr_0003_endminf_attack5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'isHitbyMain',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResource_5: {
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
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: null },
        },
        next: 'changeResource_5',
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
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_7',
      },
      startTimeDilation_11: {
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
      finishBuffsById_13: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0003_endminf_attack4'],
            reason: 'other',
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0003_endminf_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
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
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'isHitbyMain', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
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
  element: 'physical',
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
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'ifElse_12' } },
    { startFrame: 18, endFrame: 21, sequence: { $sequence: 'finishBuffsById_13' } },
    { startFrame: 25, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0003_endminf_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_attack5ActionGraph,
};

export const endministratorChr_0003_endminf_power_attack2ActionGraph = {
  main: {
    nodes: {
      changeResource_2: {
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
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'changeResource_2' },
          whenFalse: { $sequence: null },
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
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_3',
      },
      gainFinisherSp_6: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'gainFinisherSp_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_8: {
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
        next: 'ifElse_7',
      },
      startTimeDilation_9: {
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
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'startTimeDilation_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_10',
      },
      startTimeDilation_12: {
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
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'startTimeDilation_12',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_13',
      },
      applyBuff_15: {
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
      applyBuff_16: {
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
      data_4: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: {
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
      data_7: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_power_attack2: SkillDefinition = {
  key: 'chr_0003_endminf_power_attack2',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 48,
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
    { startFrame: 9, endFrame: 15, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 27, endFrame: 29, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 30, endFrame: 32, sequence: { $sequence: 'checkCondition_11' } },
    { startFrame: 11, endFrame: 29, sequence: { $sequence: 'checkCondition_14' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 27, sequence: { $sequence: 'applyBuff_16' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: endministratorChr_0003_endminf_power_attack2ActionGraph,
};

export const endministratorChr_0003_endminf_plunging_attack_endActionGraph = {
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

export const endministratorChr_0003_endminf_plunging_attack_end: SkillDefinition = {
  key: 'chr_0003_endminf_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 154,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: endministratorChr_0003_endminf_plunging_attack_endActionGraph,
};

export const endministratorChr_0003_endminf_normal_skillActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
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
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'trigger', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      startTimeDilation_26: {
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
        next: 'modifyActionValue_25',
      },
      ifElse_37: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_26' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_38: {
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
        next: 'ifElse_37',
      },
      applyPhysicalInfliction_39: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: 'dealDamage_38',
      },
      modifyActionValue_32: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'has_returned',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'dealDamage_38',
      },
      changeResource_33: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: 'modifyActionValue_32',
      },
      applyPhysicalInfliction_34: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: 'changeResource_33',
      },
      readBuffBlackboard_35: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential1'] },
            desiredKey: 'atb_return',
            outputKey: 'atb_return',
          },
        },
        next: 'applyPhysicalInfliction_34',
      },
      checkCondition_36: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'readBuffBlackboard_35',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: null,
      },
      checkCondition_28: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'checkCondition_27',
      },
      checkCondition_29: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'checkCondition_28',
      },
      ifElse_40: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'checkCondition_36' },
          whenFalse: { $sequence: 'applyPhysicalInfliction_39' },
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
      applyBuff_42: {
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
      ifElse_43: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'applyBuff_42' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_46: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0003_endminf_potential5_trigger' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_44: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: null,
      },
      checkCondition_45: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'checkCondition_44',
      },
      ifElse_47: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
          whenTrue: { $sequence: 'applyBuff_46' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      checkCondition_48: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'ifElse_47',
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_returned', fallback: 0 },
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
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_originum_frozen'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_29' } },
      },
      data_12: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
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
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_45' } },
      },
      data_16: {
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

export const endministratorChr_0003_endminf_normal_skill: SkillDefinition = {
  key: 'chr_0003_endminf_normal_skill',
  element: 'physical',
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
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 0, endFrame: 9, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'repeatEachTick_41' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'ifElse_43' } },
    { startFrame: 11, endFrame: 14, sequence: { $sequence: 'checkCondition_48' } },
  ],
  defaultTarget: 'enemy',
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
      igniteBuffs_3: {
        action: {
          kind: 'igniteBuffs',
          parameters: { target: 'enemy', source: 'caster', igniteType: 'EndminUlt' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
          },
        },
        next: 'igniteBuffs_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'dealDamage_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forEachContextTarget_6: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'ifElse_5' },
        },
        next: null,
      },
      dealDamage_7: {
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
        next: 'forEachContextTarget_6',
      },
      mergeContextTargets_8: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'targets',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_7',
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0003_endminf_potential5_trigger' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_9',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'applyBuff_11' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'ifElse_12',
      },
      applyBuff_14: {
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
      hideUi_15: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_16: {
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
          buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential5'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_10' } },
      },
      data_8: {
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

export const endministratorChr_0003_endminf_ultimate_skill: SkillDefinition = {
  key: 'chr_0003_endminf_ultimate_skill',
  element: 'physical',
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
    { startFrame: 50, endFrame: 53, sequence: { $sequence: 'mergeContextTargets_8' } },
    { startFrame: 50, endFrame: 53, sequence: { $sequence: 'checkCondition_13' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'hideUi_15' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'startUltimateTimeDilation_16' } },
  ],
  defaultTarget: 'enemy',
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
      ifElse_2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_1' },
          whenFalse: { $sequence: null },
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
        next: 'ifElse_2',
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
        next: 'startTimeDilation_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_originum_frozen',
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  atk_scale_trigger: 'atk_scale_trigger',
                  originum_ult_break_scale: 'originum_ult_break_scale',
                },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'dealDamage_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_8: {
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
      startTimeDilation_10: {
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
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'startTimeDilation_10' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const endministratorChr_0003_endminf_combo_skill: SkillDefinition = {
  key: 'chr_0003_endminf_combo_skill',
  element: 'physical',
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
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'ifElse_7' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'startTimeDilation_8' } },
    { startFrame: 0, endFrame: 4, sequence: { $sequence: 'ifElse_11' } },
  ],
  smartTarget: 'input',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: endministratorChr_0003_endminf_combo_skillActionGraph,
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
  defaultTarget: 'enemy',
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
            buffs: [
              {
                buffId: 'buff_chr_0003_endminf_talent_0_aura',
                blackboardAssignments: { dmg: { kind: 'valueNode', nodeId: 'data_1' } },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
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
      invertNextResult_3: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'invertNextResult_3',
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
          selection: 'all',
          contextKey: 'trigger',
          other: 'actionSource',
          operator: 'equal',
        },
      },
      data_3: {
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
  sequence: { $sequence: 'checkCondition_4' },
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'adjustSkillCooldown_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'adjustSkillCooldown_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd_minus' } },
      data_2: {
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
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
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
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'actionInputTarget',
          buffIds: ['buff_common_originum_frozen'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
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
      condition: { $sequence: 'checkCondition_2' },
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
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            buffs: [
              {
                buffId: 'buff_chr_0003_endminf_talent_0',
                blackboardAssignments: { dmg: { kind: 'valueNode', nodeId: 'data_1' } },
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
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
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
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
  characterTypeId: 'Physical',
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
      operationType: 'basicAttack',
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
      operationType: 'finisher',
      skills: endministratorChr_0003_endminf_power_attack2,
    },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: endministratorChr_0003_endminf_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: endministratorChr_0003_endminf_normal_skill,
    },
    {
      key: 'ultimate',
      operationType: 'ultimate',
      skills: endministratorChr_0003_endminf_ultimate_skill,
    },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
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
  playerActionModes: [],
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
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0003_endminf_ultimate_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0003_endminf_ultimate_skill',
          blackboardKey: 'originum_ult_break_scale',
          operation: 'multiply',
          value: 1.2,
        },
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
