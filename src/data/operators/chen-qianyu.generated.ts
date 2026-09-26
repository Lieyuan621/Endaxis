/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const chenQianyuChr_0005_chen_attack1ActionGraph = {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack1: SkillDefinition = {
  key: 'chr_0005_chen_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    display_atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
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
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 14, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0005_chen_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack1ActionGraph,
};

export const chenQianyuChr_0005_chen_attack2ActionGraph = {
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
  actionGraph: chenQianyuChr_0005_chen_attack2ActionGraph,
  key: 'chr_0005_chen_attack2',
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
    { startFrame: 7, endFrame: 9, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 10, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  timelineContinuationSkillId: 'chr_0005_chen_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const chenQianyuChr_0005_chen_attack3ActionGraph = {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack3: SkillDefinition = {
  key: 'chr_0005_chen_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28, 0.3],
    display_atk_scale: [0.27, 0.29, 0.32, 0.35, 0.38, 0.4, 0.43, 0.46, 0.48, 0.52, 0.56, 0.6],
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
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 18, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0005_chen_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack3ActionGraph,
};

export const chenQianyuChr_0005_chen_attack4ActionGraph = {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_5' },
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_attack4: SkillDefinition = {
  key: 'chr_0005_chen_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
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
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 21, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0005_chen_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: chenQianyuChr_0005_chen_attack4ActionGraph,
};

export const chenQianyuChr_0005_chen_attack5ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'hit', operation: 'assign', value: { kind: 'constant', value: 1 } },
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
        next: 'modifyActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
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
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_6: {
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
        next: 'conditional_5',
      },
      repeatEachTick_7: {
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
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
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
  actionGraph: chenQianyuChr_0005_chen_attack5ActionGraph,
  key: 'chr_0005_chen_attack5',
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
    { startFrame: 16, endFrame: 21, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 32, endFrame: 42, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  timelineContinuationSkillId: 'chr_0005_chen_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const chenQianyuChr_0005_chen_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_1: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_1' },
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
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_2',
      },
      startTimeDilation_4: {
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
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
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
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_7: {
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
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_7' },
        },
        next: null,
      },
      applyBuff_9: {
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
      applyBuff_10: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const chenQianyuChr_0005_chen_power_attack: SkillDefinition = {
  actionGraph: chenQianyuChr_0005_chen_power_attackActionGraph,
  key: 'chr_0005_chen_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 30,
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
    { startFrame: 29, endFrame: 38, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 31, endFrame: 34, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 5, endFrame: 7, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'conditional_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_10' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const chenQianyuChr_0005_chen_plunging_attack_endActionGraph = {
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

export const chenQianyuChr_0005_chen_plunging_attack_end: SkillDefinition = {
  actionGraph: chenQianyuChr_0005_chen_plunging_attack_endActionGraph,
  key: 'chr_0005_chen_plunging_attack_end',
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
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const chenQianyuChr_0005_chen_normal_skillActionGraph = {
  main: {
    nodes: {
      gainSquadUltimateEnergyFromSkillCost_1: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      applyPhysicalInfliction_2: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
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
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
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
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
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
                    igniteBuffs_5: {
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
                    withActionBlackboardScope_6: {
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
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
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
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
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
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
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
                        body: { $sequence: 'applyBuff_1' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'skipAll',
            returnWhen: 'always',
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_1',
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
        next: 'applyPhysicalInfliction_2',
      },
      dealDamage_4: {
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
        next: 'startTimeDilation_3',
      },
      applyPhysicalInfliction_5: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
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
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
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
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
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
                    igniteBuffs_5: {
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
                    withActionBlackboardScope_6: {
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
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
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
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
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
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
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
                        body: { $sequence: 'applyBuff_1' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'valueNode', nodeId: 'data_3' },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_4',
      },
      storeSourceAttributeValue_6: {
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
        next: 'applyPhysicalInfliction_5',
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
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'storeSourceAttributeValue_6' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: chenQianyuChr_0005_chen_normal_skillActionGraph,
};

export const chenQianyuChr_0005_chen_combo_skillActionGraph = {
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
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'changeResourceByActionValue_2',
      },
      startTimeDilation_4: {
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
        next: 'modifyActionValue_3',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'conditional_8',
      },
      applyPhysicalInfliction_10: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
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
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
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
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
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
                    igniteBuffs_5: {
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
                    withActionBlackboardScope_6: {
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
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
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
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
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
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
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
                        body: { $sequence: 'applyBuff_1' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'constant', value: 0 },
            height: { kind: 'constant', value: 0 },
            speedFactorMultiplier: 1,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_9',
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
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 17, endFrame: 27, sequence: { $sequence: 'applyPhysicalInfliction_10' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_11' } },
  ],
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale2',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_4' },
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
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'startTimeDilation_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: 'dealDamage_12',
      },
      applyBuff_14: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise_start' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'phy_up' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise_final' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential5', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
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
    { startFrame: 103, endFrame: 132, sequence: { $sequence: 'conditional_13' } },
    { startFrame: 0, endFrame: 130, sequence: { $sequence: 'applyBuff_14' } },
  ],
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
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const chenQianyuComboCondition1ActionGraph = {
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
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
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
  sequence: { $sequence: 'conditional_3' },
  actionGraph: chenQianyuComboCondition1ActionGraph,
};

const chenQianyuBuff1ActionGraph = {
  main: { nodes: {} },
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
      condition: {
        kind: 'targetHealthCompare',
        target: 'enemy',
        valueType: 'ratio',
        operator: 'less',
        value: { blackboardKey: 'hp_remain' },
      },
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
            buffId: 'buff_chr_0005_chen_talent_0_1',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { atk: 'atk', duration: 'duration' },
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
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
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'conditional_2' } },
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'conditional_4' } },
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'conditional_6' } },
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
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        chenQianyuChr_0005_chen_attack1,
        chenQianyuChr_0005_chen_attack2,
        chenQianyuChr_0005_chen_attack3,
        chenQianyuChr_0005_chen_attack4,
        chenQianyuChr_0005_chen_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: chenQianyuChr_0005_chen_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: chenQianyuChr_0005_chen_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: chenQianyuChr_0005_chen_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: chenQianyuChr_0005_chen_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: chenQianyuChr_0005_chen_ultimate_skill,
    },
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale1',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
          skillGroupKey: 'ultimate',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -90 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
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
