/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const chenQianyuChr_0005_chen_attack1ActionGraph = {
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
      changeResource_8: {
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
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0005_chen_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack1: SkillDefinition = {
  key: 'chr_0005_chen_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 110,
  exclusiveFrame: 19,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 30, input: 'basicAttack', targetSkillId: 'chr_0005_chen_attack2' },
    ],
    allowedNextSkills: [{ startFrame: 14, endFrame: 30, skillIds: ['chr_0005_chen_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 14, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0005_chen_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack1ActionGraph,
};

export const chenQianyuChr_0005_chen_attack2ActionGraph = {
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
          parameters: { skillIds: ['chr_0005_chen_attack3'] },
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

export const chenQianyuChr_0005_chen_attack2: SkillDefinition = {
  key: 'chr_0005_chen_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.5, 0.54],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 127,
  exclusiveFrame: 15,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 26, input: 'basicAttack', targetSkillId: 'chr_0005_chen_attack3' },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 26, skillIds: ['chr_0005_chen_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 7, endFrame: 9, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 10, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0005_chen_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack2ActionGraph,
};

export const chenQianyuChr_0005_chen_attack3ActionGraph = {
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
      changeResource_8: {
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
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0005_chen_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack3: SkillDefinition = {
  key: 'chr_0005_chen_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28, 0.3],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 135,
  exclusiveFrame: 22,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 30, input: 'basicAttack', targetSkillId: 'chr_0005_chen_attack4' },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 30, skillIds: ['chr_0005_chen_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 18, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0005_chen_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack3ActionGraph,
};

export const chenQianyuChr_0005_chen_attack4ActionGraph = {
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
      changeResource_8: {
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
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0005_chen_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack4: SkillDefinition = {
  key: 'chr_0005_chen_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 108,
  exclusiveFrame: 30,
  offsetRecordFrame: 4,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 31, input: 'basicAttack', targetSkillId: 'chr_0005_chen_attack5' },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 31, skillIds: ['chr_0005_chen_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 21, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0005_chen_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack4ActionGraph,
};

export const chenQianyuChr_0005_chen_attack5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'hit', operation: 'assign', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      changeResource_8: {
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
        next: 'modifyActionValue_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'changeResource_8',
      },
      startTimeDilation_10: {
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
        next: 'checkCondition_9',
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_11',
      },
      repeatEachTick_13: {
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
          body: { $sequence: 'dealDamage_12' },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0005_chen_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'hit', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack5: SkillDefinition = {
  key: 'chr_0005_chen_attack5',
  element: 'physical',
  blackboard: {
    atb: 18,
    atk_scale: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
    hit: 0,
    poise: 16,
  },
  timelineBlockFrames: 32,
  naturalDurationFrames: 126,
  exclusiveFrame: 42,
  offsetRecordFrame: 16,
  inputWindows: {
    commandMappings: [
      { startFrame: 0, endFrame: 42, input: 'basicAttack', targetSkillId: 'chr_0005_chen_attack1' },
    ],
    allowedNextSkills: [{ startFrame: 32, endFrame: 42, skillIds: ['chr_0005_chen_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 16, endFrame: 21, sequence: { $sequence: 'repeatEachTick_13' } },
    { startFrame: 32, endFrame: 42, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0005_chen_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack5ActionGraph,
};

export const chenQianyuChr_0005_chen_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_2: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'gainFinisherSp_2' },
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
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_3',
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
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
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
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
      applyBuff_12: {
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
      applyBuff_13: {
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

export const chenQianyuChr_0005_chen_power_attack: SkillDefinition = {
  key: 'chr_0005_chen_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 154,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 30,
        endFrame: 56,
        skillIds: ['chr_0005_chen_normal_skill', 'chr_0005_chen_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 29, endFrame: 38, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 31, endFrame: 34, sequence: { $sequence: 'ifElse_7' } },
    { startFrame: 5, endFrame: 7, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'ifElse_11' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_12' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_13' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: chenQianyuChr_0005_chen_power_attackActionGraph,
};

export const chenQianyuChr_0005_chen_plunging_attack_endActionGraph = {
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
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'changeResource_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_plunging_attack_end: SkillDefinition = {
  key: 'chr_0005_chen_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 122,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_plunging_attack_endActionGraph,
};

export const chenQianyuChr_0005_chen_normal_skillActionGraph = {
  main: {
    nodes: {
      findTargets_18: {
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
      applyBuff_19: {
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
      applyPhysicalInfliction_20: {
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
            targetFilter: 'skipAll',
            returnWhen: 'always',
          },
        },
        next: 'applyBuff_19',
      },
      startTimeDilation_21: {
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
        next: 'applyPhysicalInfliction_20',
      },
      dealDamage_22: {
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
        next: 'startTimeDilation_21',
      },
      applyPhysicalInfliction_23: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'valueNode', nodeId: 'data_3' },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_22',
      },
      storeSourceAttributeValue_24: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'strength' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_4' },
            base: { kind: 'valueNode', nodeId: 'data_5' },
            targetKey: 'airborne',
          },
        },
        next: 'applyPhysicalInfliction_23',
      },
      mergeContextTargets_25: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'storeSourceAttributeValue_24',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'airborne' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'airborne_coefficient' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'airborne_initial' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_normal_skill: SkillDefinition = {
  key: 'chr_0005_chen_normal_skill',
  element: 'physical',
  blackboard: {
    airborne: 0,
    airborne_coefficient: 0,
    airborne_initial: [1, 1, 1, 1, 1, 1.5, 1.5, 1.5, 2, 2, 2, 2.5],
    atk_scale: [1.69, 1.86, 2.03, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.25, 3.5, 3.8],
    poise: 10,
  },
  timelineBlockFrames: 33,
  naturalDurationFrames: 136,
  exclusiveFrame: 32,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 25, endFrame: 54, skillIds: ['chr_0005_chen_normal_skill'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findTargets_18' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'mergeContextTargets_25' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: chenQianyuChr_0005_chen_normal_skillActionGraph,
};

export const chenQianyuChr_0005_chen_combo_skillActionGraph = {
  main: {
    nodes: {
      changeResource_4: {
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
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'changeResource_4',
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
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
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
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_7',
      },
      applyPhysicalInfliction_9: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_8',
      },
      aura_10: {
        action: {
          kind: 'aura',
          parameters: { targets: { kind: 'fixed', target: 'enemy' }, buffs: [] },
          onEnter: { $sequence: 'applyPhysicalInfliction_9' },
          onExit: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.633 },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_combo_skill: SkillDefinition = {
  key: 'chr_0005_chen_combo_skill',
  element: 'physical',
  blackboard: {
    atk_scale: [1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7],
    count: 0,
    usp: 10,
  },
  timelineBlockFrames: 41,
  naturalDurationFrames: 168,
  exclusiveFrame: 40,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 23, endFrame: 40, skillIds: ['chr_0005_chen_normal_skill'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findTargets_opt1' } },
    { startFrame: 17, endFrame: 27, sequence: { $sequence: 'aura_10' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_11' } },
  ],
  defaultTarget: 'owner',
  cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: chenQianyuChr_0005_chen_combo_skillActionGraph,
};

export const chenQianyuChr_0005_chen_ultimate_skillActionGraph = {
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
            features: ['canBreakWeakness'],
            stagger: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale2',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      startTimeDilation_12: {
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
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'startTimeDilation_12',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'modifyActionValue_11' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_start' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'phy_up' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential5', fallback: 0 },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_ultimate_skill: SkillDefinition = {
  key: 'chr_0005_chen_ultimate_skill',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    atk_scale2: [4.55, 5, 5.45, 5.91, 6.36, 6.82, 7.27, 7.73, 8.18, 8.75, 9.43, 10.23],
    phy_up: 0,
    poise_final: 20,
    poise_start: 15,
    potential5: 0,
  },
  timelineBlockFrames: 131,
  naturalDurationFrames: 264,
  exclusiveFrame: 130,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 112,
        endFrame: 130,
        skillIds: ['chr_0005_chen_normal_skill', 'chr_0005_chen_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 49, sequence: { $sequence: 'startUltimateTimeDilation_2' } },
    { startFrame: 0, endFrame: 55, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 58, endFrame: 58, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 63, endFrame: 63, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 68, endFrame: 68, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 72, endFrame: 72, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 80, endFrame: 80, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 103, endFrame: 132, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 0, endFrame: 130, sequence: { $sequence: 'applyBuff_15' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 70 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: chenQianyuChr_0005_chen_ultimate_skillActionGraph,
};

export const chenQianyuCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: chenQianyuCommon_character_perfect_dodgeActionGraph,
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

const chenQianyuComboCondition1ActionGraph = {
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
          kind: 'contextTargetBuffIdStackCompare',
          compareZeroWhenTargetMissing: false,
          contextKey: 'trigger',
          buffIds: ['buff_physical_no_guard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_physical_no_guard'] },
      },
      data_3: {
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

const chenQianyuComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0005_chen_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: chenQianyuComboCondition1ActionGraph,
};

const chenQianyuBuff1ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hp_remain' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'actionInputTarget',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const chenQianyuBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { extra_dmg: 0, hp_remain: 0.5 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'normal',
          addition: { blackboardKey: 'extra_dmg' },
        },
      ],
    },
  ],
  actionGraph: chenQianyuBuff1ActionGraph,
};

const chenQianyuBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0005_chen_talent_0_1',
                copiedBlackboardAssignments: { atk: 'atk', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
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
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_1',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['ultimateSkill'] },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const chenQianyuBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk: 0, duration: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
  ],
  actionGraph: chenQianyuBuff2ActionGraph,
};

const chenQianyuBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const chenQianyuBuff3: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk: 0, duration: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk' } },
  ],
  actionGraph: chenQianyuBuff3ActionGraph,
};

const chenQianyuBuff4ActionGraph = {
  main: {
    nodes: {
      dealStagger_1: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const chenQianyuBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { poise: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    {
      event: 'afterOutputWeaknessTriggered',
      priority: 0,
      sequence: { $sequence: 'dealStagger_1' },
    },
  ],
  actionGraph: chenQianyuBuff4ActionGraph,
};

export const chenQianyu: OperatorDefinition = {
  slug: 'chen-qianyu',
  gameId: 'CHENQIANYU',
  rarity: 5,
  weaponType: 'sword',
  element: 'physical',
  characterTypeId: 'Physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [10, 31, 52, 74, 95, 106],
    agility: [20, 52, 86, 120, 154, 171],
    intellect: [8, 25, 42, 59, 77, 85],
    will: [9, 27, 46, 65, 84, 93],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        chenQianyuChr_0005_chen_attack1,
        chenQianyuChr_0005_chen_attack2,
        chenQianyuChr_0005_chen_attack3,
        chenQianyuChr_0005_chen_attack4,
        chenQianyuChr_0005_chen_attack5,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: chenQianyuChr_0005_chen_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: chenQianyuChr_0005_chen_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: chenQianyuChr_0005_chen_normal_skill,
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: chenQianyuChr_0005_chen_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: chenQianyuChr_0005_chen_ultimate_skill },
  ],
  dodgeSkill: chenQianyuCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0005_chen_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0005_chen_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0005_chen_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0005_chen_attack1',
        'chr_0005_chen_attack2',
        'chr_0005_chen_attack3',
        'chr_0005_chen_attack4',
        'chr_0005_chen_attack5',
        'chr_0005_chen_plunging_attack_end',
        'chr_0005_chen_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0005_chen_attack1',
        'chr_0005_chen_attack2',
        'chr_0005_chen_attack3',
        'chr_0005_chen_attack4',
        'chr_0005_chen_attack5',
      ],
      defaultSkillKey: 'chr_0005_chen_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [chenQianyuComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0005_chen_talent_0',
          blackboardAssignments: { atk: [0.04, 0.08], duration: 10, max_stack: 5 },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0005_chen_talent_1', blackboardAssignments: { poise: [5, 10] } },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0005_chen_potential_1',
          blackboardAssignments: { extra_dmg: 0.2, hp_remain: 0.5 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
        { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.08 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0005_chen_ultimate_skill',
          blackboardKey: 'atk_scale1',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0005_chen_ultimate_skill',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0005_chen_normal_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0005_chen_combo_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0005_chen_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0005_chen_combo_skill', frames: -90 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0005_chen_ultimate_skill',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0005_chen_potential_1: chenQianyuBuff1,
    buff_chr_0005_chen_talent_0: chenQianyuBuff2,
    buff_chr_0005_chen_talent_0_1: chenQianyuBuff3,
    buff_chr_0005_chen_talent_1: chenQianyuBuff4,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default chenQianyu;
