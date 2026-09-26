/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const daPanChr_0018_dapan_attack1ActionGraph = {
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
      startTimeDilation_3: {
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
        next: 'conditional_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
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
          body: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0018_dapan_attack2'] },
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

export const daPanChr_0018_dapan_attack1: SkillDefinition = {
  actionGraph: daPanChr_0018_dapan_attack1ActionGraph,
  key: 'chr_0018_dapan_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.31, 0.34, 0.37, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.63],
    env_dmg: 20,
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 176,
  exclusiveFrame: 20,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0018_dapan_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 30, skillIds: ['chr_0018_dapan_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 15, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0018_dapan_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const daPanChr_0018_dapan_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.08 },
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
          parameters: { skillIds: ['chr_0018_dapan_attack3'] },
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

export const daPanChr_0018_dapan_attack2: SkillDefinition = {
  actionGraph: daPanChr_0018_dapan_attack2ActionGraph,
  key: 'chr_0018_dapan_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
    env_dmg: 20,
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 171,
  exclusiveFrame: 30,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0018_dapan_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 25, skillIds: ['chr_0018_dapan_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 20, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0018_dapan_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const daPanChr_0018_dapan_attack3ActionGraph = {
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
      startTimeDilation_3: {
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
        next: 'conditional_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_4',
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
          body: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_zero' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'conditional_2',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_9' },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_10',
      },
      reachSkillOperableBoundary_12: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0018_dapan_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const daPanChr_0018_dapan_attack3: SkillDefinition = {
  key: 'chr_0018_dapan_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.38],
    atk_scale_2: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
    env_dmg: 5,
    env_dmg2: 15,
    display_atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.97, 1.04, 1.13],
  },
  timelineBlockFrames: 25,
  naturalDurationFrames: 193,
  exclusiveFrame: 38,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0018_dapan_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 25, endFrame: 40, skillIds: ['chr_0018_dapan_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 25, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  timelineContinuationSkillId: 'chr_0018_dapan_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: daPanChr_0018_dapan_attack3ActionGraph,
};

export const daPanChr_0018_dapan_attack4ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.1 },
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
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_3',
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0018_dapan_attack1'] },
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

export const daPanChr_0018_dapan_attack4: SkillDefinition = {
  actionGraph: daPanChr_0018_dapan_attack4ActionGraph,
  key: 'chr_0018_dapan_attack4',
  blackboard: {
    atb: 21,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.03, 1.09, 1.16, 1.25, 1.36],
    env_dmg: 50,
    poise: 20,
    talent_heal: 0,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 236,
  exclusiveFrame: 60,
  offsetRecordFrame: 32,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 70,
        input: 'basicAttack',
        targetSkillId: 'chr_0018_dapan_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 45, endFrame: 70, skillIds: ['chr_0018_dapan_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 45, endFrame: 70, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0018_dapan_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const daPanChr_0018_dapan_power_attackActionGraph = {
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
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.4,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_1',
      },
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_4: {
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
        next: 'gainFinisherSp_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.6,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_4',
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

export const daPanChr_0018_dapan_power_attack: SkillDefinition = {
  actionGraph: daPanChr_0018_dapan_power_attackActionGraph,
  key: 'chr_0018_dapan_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 35,
  naturalDurationFrames: 215,
  exclusiveFrame: 46,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 35,
        endFrame: 56,
        skillIds: ['chr_0018_dapan_normal_skill', 'chr_0018_dapan_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 16, endFrame: 19, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 35, sequence: { $sequence: 'applyBuff_7' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const daPanChr_0018_dapan_plunging_attack_endActionGraph = {
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

export const daPanChr_0018_dapan_plunging_attack_end: SkillDefinition = {
  actionGraph: daPanChr_0018_dapan_plunging_attack_endActionGraph,
  key: 'chr_0018_dapan_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 188,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_4' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const daPanChr_0018_dapan_normal_skillActionGraph = {
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
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_3',
      },
      createTimedMarker_5: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'caster',
            markerId: 'potential_5_interval',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_3' },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_physical_no_guard',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createTimedMarker_5',
      },
      gainSquadUltimateEnergyFromSkillCost_9: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      startTimeDilation_10: {
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
        next: 'gainSquadUltimateEnergyFromSkillCost_9',
      },
      dealDamage_11: {
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
        next: 'startTimeDilation_10',
      },
      conditional_opt1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' }, alwaysNext: true },
          whenTrue: { $sequence: 'conditional_opt1' },
        },
        next: 'dealDamage_11',
      },
      applyPhysicalInfliction_opt3: {
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
            duration: { kind: 'valueNode', nodeId: 'data_10' },
            height: { kind: 'constant', value: 2.1 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'conditional_opt2',
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_pre' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_interval' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'caster',
          markerId: 'potential_5_interval',
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_6' } },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5_interval', fallback: 0 },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'airborne_duration' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const daPanChr_0018_dapan_normal_skill: SkillDefinition = {
  key: 'chr_0018_dapan_normal_skill',
  blackboard: {
    airborne_duration: 1.8,
    atk_scale: [1.15, 1.27, 1.38, 1.5, 1.61, 1.73, 1.84, 1.96, 2.07, 2.22, 2.39, 2.59],
    atk_scale_pre: [0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.29, 0.31, 0.32, 0.35, 0.37, 0.41],
    poise: 10,
    potential_5_interval: 0,
  },
  timelineBlockFrames: 66,
  naturalDurationFrames: 210,
  exclusiveFrame: 65,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 65, endFrame: 89, skillIds: ['chr_0018_dapan_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 11, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 8, endFrame: 11, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 43, endFrame: 46, sequence: { $sequence: 'applyPhysicalInfliction_opt3' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: daPanChr_0018_dapan_normal_skillActionGraph,
};

export const daPanChr_0018_dapan_ultimate_skillActionGraph = {
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
            duration: { kind: 'constant', value: 2 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 4,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.034 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: true,
            targets: ['caster'],
          },
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
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_3',
      },
      repeatEachTick_5: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 8,
              targetTriggerIntervalSeconds: 0.13,
            },
          },
          body: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0018_dapan_talent_1_preparation',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'talent_1_duration',
              max_stack: 'talent_1_stack',
              talent_1_cd_reduce: 'talent_1_cd_reduce',
            },
          },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'applyBuff_6' },
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
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_8',
      },
      applyKnockDown_10: {
        action: {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'constant', value: 2 },
            force: true,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_9',
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'forEachContextTarget_7' },
        },
        next: 'applyKnockDown_10',
      },
      startTimeDilation_12: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 1.2 },
            slot: 'unassigned',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            ignoredTargets: ['caster'],
          },
        },
        next: null,
      },
      hideUi_13: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_loop' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_end' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const daPanChr_0018_dapan_ultimate_skill: SkillDefinition = {
  key: 'chr_0018_dapan_ultimate_skill',
  blackboard: {
    atk_scale_end: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale_loop: [0.22, 0.24, 0.26, 0.29, 0.31, 0.33, 0.35, 0.37, 0.4, 0.42, 0.46, 0.5],
    potential_1_dmg_up: 0,
    potential_1_duration: 0,
    talent_1: 0,
    talent_1_cd_reduce: 0,
    talent_1_duration: 0,
    talent_1_stack: 0,
  },
  timelineBlockFrames: 101,
  naturalDurationFrames: 235,
  exclusiveFrame: 100,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 86,
        endFrame: 120,
        skillIds: ['chr_0018_dapan_normal_skill', 'chr_0018_dapan_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'applyPhysicalInfliction_2' } },
    { startFrame: 42, endFrame: 64, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 80, endFrame: 81, sequence: { $sequence: 'conditional_11' } },
    { startFrame: 0, endFrame: 36, sequence: { $sequence: 'startTimeDilation_12' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'hideUi_13' } },
    { startFrame: 0, endFrame: 100, sequence: { $sequence: 'applyBuff_14' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: daPanChr_0018_dapan_ultimate_skillActionGraph,
};

export const daPanChr_0018_dapan_combo_skillActionGraph = {
  main: {
    nodes: {
      changeResourceByActionValue_1: {
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
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResourceByActionValue_1',
      },
      dealDamage_3: {
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
        next: 'startTimeDilation_2',
      },
      applyPhysicalInfliction_4: {
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
            damageMultiplier: { kind: 'valueNode', nodeId: 'data_4' },
            ignoreHitEffect: false,
          },
        },
        next: 'dealDamage_3',
      },
      startTimeDilation_6: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'crush_multi' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const daPanChr_0018_dapan_combo_skill: SkillDefinition = {
  key: 'chr_0018_dapan_combo_skill',
  blackboard: {
    atk_scale: [2.89, 3.18, 3.47, 3.75, 4.04, 4.33, 4.62, 4.91, 5.2, 5.56, 5.99, 6.5],
    crush_multi: [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2],
    poise: 15,
    usp: 10,
  },
  timelineBlockFrames: 53,
  naturalDurationFrames: 146,
  exclusiveFrame: 52,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 59, skillIds: ['chr_0018_dapan_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'applyPhysicalInfliction_4' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_6' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: daPanChr_0018_dapan_combo_skillActionGraph,
};

export const daPanCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const daPanCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: daPanCommon_character_perfect_dodgeActionGraph,
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

const daPanComboCondition1ActionGraph = {
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
          value: { kind: 'constant', value: 4 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const daPanComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0018_dapan_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: daPanComboCondition1ActionGraph,
};

const daPanBuff1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0018_dapan_talent_0_dmg_up',
            target: 'buffSource',
            source: 'buffSource',
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_up: 'dmg_up', duration: 'duration', stack: 'stack' },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'consumedLayer' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventConsumedBuffLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          outputKey: 'consumedLayer',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_physical_no_guard'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const daPanBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { consumedLayer: 0, dmg_up: 0, duration: 0, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'buffConsumed', priority: 0, sequence: { $sequence: 'conditional_3' } },
  ],
  actionGraph: daPanBuff1ActionGraph,
};

const daPanBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const daPanBuff2: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: { blackboardKey: 'stack' },
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_physical_dmg_up',
    iconPath: '/icons/icon_battle_physical_dmg_up.webp',
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
  blackboard: { consumedLayer: 0, dmg_up: 0, duration: 0, stack: 0 },
  attributeModifiers: [
    {
      attribute: 'physicalDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'dmg_up' },
    },
  ],
  actionGraph: daPanBuff2ActionGraph,
};

const daPanBuff3ActionGraph = {
  main: {
    nodes: {
      skillAffix_1: { action: { kind: 'skillAffix', parameters: {} }, next: null },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0018_dapan_talent_1_cd_reduce'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0018_dapan_talent_1_preparation'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'finishBuffsById_2',
      },
      adjustSkillCooldown_4: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'comboSkill' },
            operation: 'reduce',
            basis: 'baseDurationRatio',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd_reduce' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const daPanBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { cd_reduce: 0.5, duration: 15 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'skillAffix_1' } },
  abilityEventResponses: [
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'adjustSkillCooldown_4' } },
  ],
  actionGraph: daPanBuff3ActionGraph,
};

const daPanBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0018_dapan_talent_1_cd_reduce',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { cd_reduce: 'talent_1_cd_reduce' },
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
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const daPanBuff4: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_dapan_buff',
    iconPath: '/icons/icon_battle_dapan_buff.webp',
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
  blackboard: { duration: 15, max_stack: 2, talent_1_cd_reduce: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: daPanBuff4ActionGraph,
};

export const daPan: OperatorDefinition = {
  slug: 'da-pan',
  gameId: 'DAPAN',
  rarity: 5,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'striker',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [24, 56, 90, 124, 158, 175],
    agility: [9, 28, 47, 67, 87, 96],
    intellect: [10, 28, 47, 66, 85, 94],
    will: [10, 30, 50, 71, 91, 102],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        daPanChr_0018_dapan_attack1,
        daPanChr_0018_dapan_attack2,
        daPanChr_0018_dapan_attack3,
        daPanChr_0018_dapan_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: daPanChr_0018_dapan_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: daPanChr_0018_dapan_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: daPanChr_0018_dapan_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: daPanChr_0018_dapan_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: daPanChr_0018_dapan_combo_skill,
    },
  ],
  dodgeSkill: daPanCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0018_dapan_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0018_dapan_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0018_dapan_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0018_dapan_plunging_attack_end',
        'chr_0018_dapan_attack1',
        'chr_0018_dapan_attack2',
        'chr_0018_dapan_attack3',
        'chr_0018_dapan_attack4',
        'chr_0018_dapan_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0018_dapan_attack1',
        'chr_0018_dapan_attack2',
        'chr_0018_dapan_attack3',
        'chr_0018_dapan_attack4',
      ],
      defaultSkillKey: 'chr_0018_dapan_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [daPanComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0018_dapan_talent_0',
          blackboardAssignments: { dmg_up: [0.04, 0.06], duration: 10, stack: 4 },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_stack',
          operation: 'assign',
          value: [1, 2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_duration',
          operation: 'assign',
          value: [20, 20],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_cd_reduce',
          operation: 'assign',
          value: [0.4, 0.4],
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_1_dmg_up',
          operation: 'assign',
          value: 0.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_1_duration',
          operation: 'assign',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_stack',
          operation: 'add',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_duration',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.08 },
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
          blackboardKey: 'potential_5_interval',
          operation: 'assign',
          value: 45,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0018_dapan_talent_0: daPanBuff1,
    buff_chr_0018_dapan_talent_0_dmg_up: daPanBuff2,
    buff_chr_0018_dapan_talent_1_cd_reduce: daPanBuff3,
    buff_chr_0018_dapan_talent_1_preparation: daPanBuff4,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default daPan;
