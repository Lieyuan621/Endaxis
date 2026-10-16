/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const arclightChr_0007_ikut_attack1ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      reachSkillOperableBoundary_6: {
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
  key: 'chr_0007_ikut_attack1',
  element: 'physical',
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
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 9, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0007_ikut_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack1ActionGraph,
};

export const arclightChr_0007_ikut_attack2ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      reachSkillOperableBoundary_6: {
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
  key: 'chr_0007_ikut_attack2',
  element: 'physical',
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
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 10, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0007_ikut_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack2ActionGraph,
};

export const arclightChr_0007_ikut_attack3ActionGraph = {
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
      reachSkillOperableBoundary_11: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_attack3: SkillDefinition = {
  key: 'chr_0007_ikut_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
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
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 20, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0007_ikut_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack3ActionGraph,
};

export const arclightChr_0007_ikut_attack4ActionGraph = {
  main: {
    nodes: {
      changeResource_17: {
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
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_17' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_18',
      },
      repeatEachTick_20: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 3,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_19' },
        },
        next: null,
      },
      reachSkillOperableBoundary_21: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_attack4: SkillDefinition = {
  key: 'chr_0007_ikut_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
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
    { startFrame: 5, endFrame: 20, sequence: { $sequence: 'repeatEachTick_20' } },
    { startFrame: 27, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0007_ikut_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack4ActionGraph,
};

export const arclightChr_0007_ikut_attack5ActionGraph = {
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_4',
      },
      startTimeDilation_7: {
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
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'startTimeDilation_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'ifElse_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      reachSkillOperableBoundary_10: {
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
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_attack5: SkillDefinition = {
  key: 'chr_0007_ikut_attack5',
  element: 'physical',
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
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'ifElse_9' } },
    { startFrame: 29, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0007_ikut_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_attack5ActionGraph,
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
            buffs: [{ buffId: 'buff_common_full_immune_medium' }],
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_power_attack: SkillDefinition = {
  key: 'chr_0007_ikut_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 69,
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
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: arclightChr_0007_ikut_power_attackActionGraph,
};

export const arclightChr_0007_ikut_plunging_attack_endActionGraph = {
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

export const arclightChr_0007_ikut_plunging_attack_end: SkillDefinition = {
  key: 'chr_0007_ikut_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 88,
  exclusiveFrame: 25,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: arclightChr_0007_ikut_plunging_attack_endActionGraph,
};

export const arclightChr_0007_ikut_normal_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_5: {
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
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      startTimeDilation_8: {
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
        next: 'applyBuff_7',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'startTimeDilation_8',
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'startTimeDilation_5',
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'applyBuff_7',
      },
      dealDamage_26: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'dealDamage_25',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0007_ikut_normal_skill_extra_count',
                copiedBlackboardAssignments: {
                  pulse_up: 'pulse_up',
                  duration: 'duration',
                  count: 'count',
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
      finishBuffsByTag_17: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
            reason: 'early',
          },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsByTag_17',
      },
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'applyBuff_18',
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'thirdhit',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'dealDamage_19',
      },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_20',
      },
      changeResource_22: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_21',
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'applyBuff_15' },
          whenFalse: { $sequence: null },
        },
        next: 'changeResource_22',
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'ifElse_23' },
          whenFalse: { $sequence: 'dealDamage_26' },
        },
        next: null,
      },
      ifElse_28: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'ifElse_27' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      mergeContextTargets_29: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'ifElse_28',
      },
      startTimeDilation_31: {
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
      ifElse_32: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'startTimeDilation_31' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_33: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      modifyActionValue_35: {
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
      ifElse_36: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'modifyActionValue_35' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_38: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 96 },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
        },
        next: null,
      },
      jumpTimeline_39: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 204 },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'thirdhit', fallback: 0 } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'SpawnThird', fallback: 0 },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_normal_skill: SkillDefinition = {
  key: 'chr_0007_ikut_normal_skill',
  element: 'electric',
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
    { startFrame: 19, endFrame: 19, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 112, endFrame: 112, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 118, endFrame: 118, sequence: { $sequence: 'dealDamage_13' } },
    { startFrame: 136, endFrame: 136, sequence: { $sequence: 'mergeContextTargets_29' } },
    { startFrame: 137, endFrame: 137, sequence: { $sequence: 'ifElse_32' } },
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'markCurrentSkillCanInterrupt_33' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_36' } },
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'jumpTimeline_38' } },
    { startFrame: 95, endFrame: 95, sequence: { $sequence: 'jumpTimeline_39' } },
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
      spawnAbilityEntity_5: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0007_ikut_ultimate_skill',
            childSkillId: 'chr_0007_ikut_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_ultimate_skill: SkillDefinition = {
  actionGraph: arclightChr_0007_ikut_ultimate_skillActionGraph,
  key: 'chr_0007_ikut_ultimate_skill',
  element: 'electric',
  blackboard: {
    atk_scale1: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    atk_scale2: [2.44, 2.69, 2.93, 3.18, 3.42, 3.67, 3.91, 4.15, 4.4, 4.7, 5.07, 5.5],
    poise1: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
    poise2: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
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
    { startFrame: 0, endFrame: 56, sequence: { $sequence: 'startUltimateTimeDilation_2' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 54, endFrame: 55, sequence: { $sequence: 'spawnAbilityEntity_5' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const arclightChr_0007_ikut_combo_skillActionGraph = {
  main: {
    nodes: {
      findTargets_opt1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findTargets_opt1' },
        },
        next: null,
      },
      startTimeDilation_5: {
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
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0007_ikut_combo_skill_counts'],
            reason: 'other',
          },
        },
        next: null,
      },
      changeResource_10: {
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
      startTimeDilation_11: {
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
        next: 'changeResource_10',
      },
      dealDamage_12: {
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
        next: 'startTimeDilation_11',
      },
      changeResource_13: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_12',
      },
      startTimeDilation_14: {
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
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_14',
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const arclightChr_0007_ikut_combo_skill: SkillDefinition = {
  key: 'chr_0007_ikut_combo_skill',
  element: 'physical',
  blackboard: {
    atb: [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
    atk_scale: [0.52, 0.57, 0.62, 0.67, 0.73, 0.78, 0.83, 0.88, 0.93, 1, 1.07, 1.17],
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 0, endFrame: 12, sequence: { $sequence: 'startTimeDilation_5' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_6' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'changeResource_13' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'dealDamage_15' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'dealDamage_16' } },
  ],
  smartTarget: 'input',
  cooldownFrames: 90,
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: arclightChr_0007_ikut_combo_skillActionGraph,
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const arclightComboCondition1ActionGraph = {
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
  sequence: { $sequence: 'checkCondition_1' },
  actionGraph: arclightComboCondition1ActionGraph,
};

const arclightComboCondition2ActionGraph = {
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
  sequence: { $sequence: 'checkCondition_1' },
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
    icon: 'endaxis:icons/icon_battle_pulse_dmg_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
  lifecycleSequences: { start: [{ $sequence: 'finishBuffsById_1' }] },
  actionGraph: arclightBuff2ActionGraph,
};

const arclightBuff3ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
            buffs: [
              {
                buffId: 'buff_chr_0007_ikut_atk_buff_talent',
                copiedBlackboardAssignments: { pulse_up: 'final_pulse_up', duration: 'duration' },
              },
            ],
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'storeSourceAttributeValue_3',
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
    icon: 'endaxis:icons/icon_battle_ikut_talent_1',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, duration: 0, final_pulse_up: 0, pulse_up: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enhanceChanged: [{ $sequence: 'checkCondition_4' }] },
  actionGraph: arclightBuff3ActionGraph,
};

const arclightBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0007_ikut_talent_2_immune',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.067 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_1' } },
      },
    },
  },
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
  abilityEventResponses: [
    {
      event: 'beforeTakeSpellInfliction',
      priority: 0,
      sequence: { $sequence: 'checkCondition_2' },
    },
  ],
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
  characterTypeId: 'Pulse',
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
      operationType: 'basicAttack',
      skills: [
        arclightChr_0007_ikut_attack1,
        arclightChr_0007_ikut_attack2,
        arclightChr_0007_ikut_attack3,
        arclightChr_0007_ikut_attack4,
        arclightChr_0007_ikut_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: arclightChr_0007_ikut_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: arclightChr_0007_ikut_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: arclightChr_0007_ikut_normal_skill,
    },
    { key: 'ultimate', operationType: 'ultimate', skills: arclightChr_0007_ikut_ultimate_skill },
    { key: 'comboSkill', operationType: 'comboSkill', skills: arclightChr_0007_ikut_combo_skill },
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
          skillKey: 'chr_0007_ikut_normal_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0007_ikut_normal_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0007_ikut_normal_skill',
          blackboardKey: 'pulse_up',
          operation: 'add',
          value: [0.0005, 0.0008],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0007_ikut_normal_skill',
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
          skillKey: 'chr_0007_ikut_normal_skill',
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
          skillKey: 'chr_0007_ikut_normal_skill',
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
          skillKey: 'chr_0007_ikut_ultimate_skill',
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
          skillKey: 'chr_0007_ikut_normal_skill',
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
        skillId: 'chr_0007_ikut_ultimate_skill_abentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 150,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale1: 0.2, atk_scale2: 0, count: 0, poise1: 0, poise2: 0 },
        scheduledSequences: [
          { startFrame: 7, endFrame: 8, sequence: { $sequence: 'applyElementalInfliction_3' } },
          { startFrame: 7, endFrame: 8, sequence: { $sequence: 'forEachContextTarget_5' } },
          { startFrame: 63, endFrame: 64, sequence: { $sequence: 'dealDamage_6' } },
          { startFrame: 63, endFrame: 64, sequence: { $sequence: 'forEachContextTarget_11' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_2: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                  key: 'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_2/action',
                },
                next: null,
              },
              applyElementalInfliction_3: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'electric', isExtra: false },
                },
                next: 'dealDamage_2',
              },
              forEachContextTarget_5: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                  body: { $sequence: null },
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_4' },
                  },
                  key: 'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: null,
              },
              forceSpellStatus_8: {
                action: {
                  kind: 'forceSpellStatus',
                  parameters: {
                    target: 'enemy',
                    element: 'electric',
                    consumedElement: 'electric',
                    consumedLayers: { kind: 'valueNode', nodeId: 'data_5' },
                    count: { kind: 'valueNode', nodeId: 'data_5' },
                    isExtra: false,
                  },
                },
                next: null,
              },
              readBuffStackCount_9: {
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
                next: 'forceSpellStatus_8',
              },
              ifElse_10: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_6' },
                  whenTrue: { $sequence: 'readBuffStackCount_9' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              forEachContextTarget_11: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                  body: { $sequence: 'ifElse_10' },
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
              data_6: {
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
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default arclight;
