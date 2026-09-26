/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const catcherChr_0020_meurs_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
          parameters: { skillIds: ['chr_0020_meurs_attack2'] },
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

export const catcherChr_0020_meurs_attack1: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_attack1ActionGraph,
  key: 'chr_0020_meurs_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
    env_dmg: 20,
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 114,
  exclusiveFrame: 25,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 39,
        input: 'basicAttack',
        targetSkillId: 'chr_0020_meurs_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 39, skillIds: ['chr_0020_meurs_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 21, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0020_meurs_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const catcherChr_0020_meurs_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.25 },
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
          body: { $sequence: 'dealDamage_4' },
        },
        next: null,
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0020_meurs_attack3'] },
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

export const catcherChr_0020_meurs_attack2: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_attack2ActionGraph,
  key: 'chr_0020_meurs_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.39, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.65, 0.69, 0.74, 0.8, 0.87],
    env_dmg: 20,
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 126,
  exclusiveFrame: 25,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 35,
        input: 'basicAttack',
        targetSkillId: 'chr_0020_meurs_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 21, endFrame: 35, skillIds: ['chr_0020_meurs_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 21, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0020_meurs_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const catcherChr_0020_meurs_attack3ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
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
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0020_meurs_attack4'] },
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

export const catcherChr_0020_meurs_attack3: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_attack3ActionGraph,
  key: 'chr_0020_meurs_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.54, 0.59, 0.65, 0.7, 0.76, 0.81, 0.86, 0.92, 0.97, 1.04, 1.12, 1.22],
    env_dmg: 20,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 126,
  exclusiveFrame: 32,
  offsetRecordFrame: 16,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0020_meurs_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 28, endFrame: 44, skillIds: ['chr_0020_meurs_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 28, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0020_meurs_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const catcherChr_0020_meurs_attack4ActionGraph = {
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
      once_2: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      startTimeDilation_3: {
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
        next: 'once_2',
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
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
          parameters: { skillIds: ['chr_0020_meurs_attack1'] },
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

export const catcherChr_0020_meurs_attack4: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_attack4ActionGraph,
  key: 'chr_0020_meurs_attack4',
  blackboard: {
    atb: 25,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale2: 0.5,
    env_dmg: 40,
    poise: 22,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 114,
  exclusiveFrame: 47,
  offsetRecordFrame: 23,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 60,
        input: 'basicAttack',
        targetSkillId: 'chr_0020_meurs_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 45, endFrame: 60, skillIds: ['chr_0020_meurs_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 23, endFrame: 25, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 45, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0020_meurs_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const catcherChr_0020_meurs_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_1: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
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
        next: 'gainFinisherSp_1',
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_3' },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.6,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_4',
      },
      applyBuff_6: {
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
      applyBuff_7: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_power_attack: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_power_attackActionGraph,
  key: 'chr_0020_meurs_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 35,
  naturalDurationFrames: 135,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 35,
        endFrame: 75,
        skillIds: ['chr_0020_meurs_normal_skill', 'chr_0020_meurs_combo_skill'],
      },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 15, endFrame: 17, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 35, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_7' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const catcherChr_0020_meurs_plunging_attack_endActionGraph = {
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

export const catcherChr_0020_meurs_plunging_attack_end: SkillDefinition = {
  actionGraph: catcherChr_0020_meurs_plunging_attack_endActionGraph,
  key: 'chr_0020_meurs_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 108,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 9,
  scheduledSequences: [{ startFrame: 1, endFrame: 2, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const catcherChr_0020_meurs_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'MainChar', selection: { kind: 'controlledOperator' } },
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
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
          },
        },
        next: null,
      },
      jumpTimeline_5: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 255 } },
        next: null,
      },
      markCurrentSkillCanInterrupt_6: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      finishTimeline_7: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { taken_dmg: { kind: 'valueNode', nodeId: 'data_2' } },
          },
        },
        next: null,
      },
      jumpTimeline_opt1: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 60 } },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'jumpTimeline_opt1' },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'jumpTimeline_opt1' },
        },
        next: null,
      },
      listenForCombatEvents_opt3: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_10' },
              },
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_opt2' },
              },
            ],
          },
        },
        next: null,
      },
      changeResourceByActionValue_15: {
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
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_15' },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      startTimeDilation_18: {
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
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'startTimeDilation_18',
      },
      once_20: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'conditional_17' } },
        next: 'dealDamage_19',
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_physical_no_guard',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'once_20',
      },
      repeatEachTick_22: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      startTimeDilation_23: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.7 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.3,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.5,
                  value: 0.3,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.596606,
                  outTangent: 4.596606,
                  weightedMode: 0,
                  inWeight: 0.0243593454,
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_base' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'potential5_atb' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'caster',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/HpShield'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential5_atb', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_normal_skill: SkillDefinition = {
  key: 'chr_0020_meurs_normal_skill',
  blackboard: {
    atb_return_base: 30,
    atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.85, 3.02, 3.2, 3.42, 3.69, 4],
    poise: 20,
    potential5_atb: 0,
    taken_dmg: 0.9,
  },
  timelineBlockFrames: 129,
  naturalDurationFrames: 373,
  exclusiveFrame: 285,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 95, endFrame: 129, skillIds: ['chr_0020_meurs_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeResourceByActionValue_2' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 60, endFrame: 62, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 45, endFrame: 46, sequence: { $sequence: 'jumpTimeline_5' } },
    { startFrame: 129, endFrame: 132, sequence: { $sequence: 'markCurrentSkillCanInterrupt_6' } },
    { startFrame: 194, endFrame: 195, sequence: { $sequence: 'finishTimeline_7' } },
    { startFrame: 0, endFrame: 83, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'listenForCombatEvents_opt3' } },
    { startFrame: 83, endFrame: 85, sequence: { $sequence: 'repeatEachTick_22' } },
    { startFrame: 60, endFrame: 63, sequence: { $sequence: 'startTimeDilation_23' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: catcherChr_0020_meurs_normal_skillActionGraph,
};

export const catcherChr_0020_meurs_combo_skillActionGraph = {
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
            priority: 10,
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
          },
        },
        next: 'startTimeDilation_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'meurs_comboskill2' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_combo_skill_shield',
            target: 'casterAndLowestHealthRatioOperatorExceptCaster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              shield_def_rate: 'shield_def_rate',
              shield_base: 'shield_base',
              duration: 'shield_duration',
            },
          },
        },
        next: null,
      },
      mergeContextTargets_8: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'shieldTar',
            sources: [
              { kind: 'context', contextKey: 'aMate' },
              { kind: 'target', target: 'caster' },
            ],
          },
        },
        next: 'applyBuff_7',
      },
      findCharacterTeamTargets_9: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'aMate',
            selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
          },
        },
        next: 'mergeContextTargets_8',
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_combo_skill_shield',
            target: 'casterAndControlledOperator',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              shield_def_rate: 'shield_def_rate',
              shield_base: 'shield_base',
              duration: 'shield_duration',
            },
          },
        },
        next: null,
      },
      mergeContextTargets_11: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'shieldTar',
            sources: [
              { kind: 'context', contextKey: 'mainChar' },
              { kind: 'target', target: 'caster' },
            ],
          },
        },
        next: 'applyBuff_10',
      },
      findCharacterTeamTargets_12: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainChar', selection: { kind: 'controlledOperator' } },
        },
        next: 'mergeContextTargets_11',
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'findCharacterTeamTargets_9' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_12' },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'shield_duration',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'conditional_13',
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.567000031 },
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
      dealDamage_opt1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'startTimeDilation_4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'potential3_duration' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_combo_skill: SkillDefinition = {
  key: 'chr_0020_meurs_combo_skill',
  blackboard: {
    atk_scale: [0.25, 0.27, 0.3, 0.32, 0.34, 0.37, 0.39, 0.42, 0.44, 0.47, 0.51, 0.55],
    atk_scale_1: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    poise: 10,
    potential3_duration: 0,
    shield_base: [360, 432, 504, 576, 612, 648, 684, 720, 756, 774, 792, 810],
    shield_def_rate: [2.25, 2.7, 3.15, 3.6, 3.825, 4.05, 4.275, 4.5, 4.725, 4.84, 4.95, 5.06],
    shield_duration: 10,
    usp: 10,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 98,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 60, skillIds: ['chr_0020_meurs_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'dealDamage_opt1' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'modifyActionValue_14' } },
    { startFrame: 0, endFrame: 14, sequence: { $sequence: 'startTimeDilation_16' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 990],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: catcherChr_0020_meurs_combo_skillActionGraph,
};

export const catcherChr_0020_meurs_ultimate_skillActionGraph = {
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_ult_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              weak_scale: 'weak_scale',
              weak_duration: 'weak_duration',
            },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'startTimeDilation_3',
      },
      dealDamage_6: {
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
        next: 'startTimeDilation_3',
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
      dealDamage_8: {
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
        next: 'startTimeDilation_7',
      },
      applyKnockDown_9: {
        action: {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'valueNode', nodeId: 'data_7' },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_8',
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0020_meurs_talent_shockwave',
            childSkillId: 'chr_0020_meurs_talent_shockwave',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'spawnAbilityEntity_10' },
        },
        next: null,
      },
      hideUi_12: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_13: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'knockdown_time' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_ultimate_skill: SkillDefinition = {
  key: 'chr_0020_meurs_ultimate_skill',
  blackboard: {
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2],
    atk_scale_1: [1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7],
    atk_scale_2: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale_shockwave: 0.45,
    knockdown_time: 2,
    poise: 5,
    poise1: 10,
    talent_1: 0,
    weak_duration: 8,
    weak_scale: [0.2, 0.2, 0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3],
    poise_display: 20,
  },
  timelineBlockFrames: 121,
  naturalDurationFrames: 193,
  exclusiveFrame: 120,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 103,
        endFrame: 120,
        skillIds: ['chr_0020_meurs_combo_skill', 'chr_0020_meurs_normal_skill'],
      },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 46, endFrame: 49, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 46, endFrame: 49, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 64, endFrame: 67, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 85, endFrame: 88, sequence: { $sequence: 'applyKnockDown_9' } },
    { startFrame: 102, endFrame: 105, sequence: { $sequence: 'conditional_11' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'hideUi_12' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'startUltimateTimeDilation_13' } },
    { startFrame: 0, endFrame: 120, sequence: { $sequence: 'applyBuff_14' } },
  ],
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: catcherChr_0020_meurs_ultimate_skillActionGraph,
};

export const catcherCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: catcherCommon_character_perfect_dodgeActionGraph,
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

const catcherComboCondition1ActionGraph = {
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'conditional_3' },
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
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'trigger',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.4 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0020_meurs_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_4' },
  actionGraph: catcherComboCondition1ActionGraph,
};

const catcherComboCondition2ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: false } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_signal_weakness_trigger_combo',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'conditional_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0020_meurs_combo_skill',
  event: 'weaknessSet',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'applyBuff_2' },
  actionGraph: catcherComboCondition2ActionGraph,
};

const catcherBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_def_up',
    iconPath: '/icons/icon_battle_buff_def_up.webp',
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
  applyTags: ['Skill/Character/Common/HpShield'],
  extendTags: [],
  blackboard: { duration: 10, shield_base: 100, shield_def_rate: 0.5 },
  attributeModifiers: [],
  shields: [
    {
      infinityValue: false,
      value: {
        attributeSource: 'buffSource',
        attribute: 'Def',
        multiplier: { blackboardKey: 'shield_def_rate' },
        addition: { blackboardKey: 'shield_base' },
      },
      damageAbsorptions: [],
      absorbCount: -1,
      absorbAllDamageWhenConsumed: false,
      removeBuffWhenConsumed: true,
      priority: 'normal',
      replaceHitEffect: true,
    },
  ],
  actionGraph: catcherBuff1ActionGraph,
};

const catcherBuff2ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'attribute',
            calculationAttribute: 'Def',
            calculationAddition: { kind: 'valueNode', nodeId: 'data_2' },
            tags: [],
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'dealDamage_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'def_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_base' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  applyTags: [],
  extendTags: [],
  blackboard: { def_scale: 1, dmg_base: 100 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: catcherBuff2ActionGraph,
};

const catcherBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 9999999 },
              rate: { kind: 'valueNode', nodeId: 'data_1' },
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0020_meurs_reduce_damage_remain',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.5 } },
            copiedBlackboardAssignments: { taken_dmg: 'taken_dmg' },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { duration: 9999, taken_dmg: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'applyBuff_1' },
    finish: { $sequence: 'applyBuff_2' },
  },
  actionGraph: catcherBuff3ActionGraph,
};

const catcherBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff4: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.5, taken_dmg: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: catcherBuff4ActionGraph,
};

const catcherBuff5ActionGraph = {
  main: {
    nodes: {
      openComboWindow_1: {
        action: { kind: 'openComboWindow', parameters: { nextSkillKeyFromSlot: 'comboSkill' } },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.4,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'openComboWindow_1' } },
  actionGraph: catcherBuff5ActionGraph,
};

const catcherBuff6ActionGraph = {
  main: {
    nodes: {
      storeSourceAttributeValue_1: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: true,
            divisor: { kind: 'constant', value: 10 },
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'def_up',
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 99999,
  applyTags: [],
  extendTags: [],
  blackboard: { def_up: 0, rate: 1 },
  attributeModifiers: [
    { attribute: 'Def', slot: 'baseAddition', value: { blackboardKey: 'def_up' } },
  ],
  lifecycleSequences: { trigger: { $sequence: 'storeSourceAttributeValue_1' } },
  actionGraph: catcherBuff6ActionGraph,
};

const catcherBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'weak_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'weak_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const catcherBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'weak_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { weak_duration: 0, weak_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: catcherBuff7ActionGraph,
};

export const catcher: OperatorDefinition = {
  slug: 'catcher',
  gameId: 'CATCHER',
  rarity: 4,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [21, 54, 89, 124, 159, 176],
    agility: [9, 28, 47, 67, 87, 96],
    intellect: [8, 25, 42, 60, 77, 86],
    will: [11, 31, 53, 74, 96, 106],
    baseAttack: [30, 88, 148, 209, 270, 300],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        catcherChr_0020_meurs_attack1,
        catcherChr_0020_meurs_attack2,
        catcherChr_0020_meurs_attack3,
        catcherChr_0020_meurs_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: catcherChr_0020_meurs_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: catcherChr_0020_meurs_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: catcherChr_0020_meurs_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: catcherChr_0020_meurs_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: catcherChr_0020_meurs_ultimate_skill,
    },
  ],
  dodgeSkill: catcherCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0020_meurs_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0020_meurs_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0020_meurs_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0020_meurs_attack1',
        'chr_0020_meurs_attack2',
        'chr_0020_meurs_attack3',
        'chr_0020_meurs_attack4',
        'chr_0020_meurs_plunging_attack_end',
        'chr_0020_meurs_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0020_meurs_attack1',
        'chr_0020_meurs_attack2',
        'chr_0020_meurs_attack3',
        'chr_0020_meurs_attack4',
      ],
      defaultSkillKey: 'chr_0020_meurs_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [catcherComboCondition1, catcherComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0020_meurs_talent_0', blackboardAssignments: { rate: [1, 1.2] } },
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
          value: [1, 2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_shockwave',
          operation: 'assign',
          value: [0.3, 0.45],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0020_meurs_potential_1',
          blackboardAssignments: { def_scale: 5, dmg_base: 300 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential3_duration',
          operation: 'assign',
          value: 5,
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
          multiplier: 0.9,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential5_atb',
          operation: 'assign',
          value: 10,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0020_meurs_combo_skill_shield: catcherBuff1,
    buff_chr_0020_meurs_potential_1: catcherBuff2,
    buff_chr_0020_meurs_reduce_damage: catcherBuff3,
    buff_chr_0020_meurs_reduce_damage_remain: catcherBuff4,
    buff_chr_0020_meurs_signal_weakness_trigger_combo: catcherBuff5,
    buff_chr_0020_meurs_talent_0: catcherBuff6,
    buff_chr_0020_meurs_ult_weak: catcherBuff7,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0020_meurs_talent_shockwave: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              dealDamage_1: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                  },
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              dealDamage_2: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    tags: ['ultimateSkill'],
                  },
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_2/action',
                },
                next: null,
              },
              dealDamage_3: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: ['ultimateSkill'],
                  },
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_3/action',
                },
                next: null,
              },
              finishTimeline_4: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
              conditional_5: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                  whenTrue: { $sequence: 'finishTimeline_4' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_shockwave' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_shockwave' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_shockwave' },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
              },
              data_5: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_4' },
                  operator: 'less',
                  right: { kind: 'constant', value: 2 },
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0020_meurs_talent_shockwave',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 60,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale_shockwave: 0.42, env_dmg: 20, spawn_count: 0, talent_1: 0 },
        scheduledSequences: [
          { startFrame: 3, endFrame: 5, sequence: { $sequence: 'dealDamage_1' } },
          { startFrame: 18, endFrame: 20, sequence: { $sequence: 'dealDamage_2' } },
          { startFrame: 33, endFrame: 35, sequence: { $sequence: 'dealDamage_3' } },
          { startFrame: 29, endFrame: 32, sequence: { $sequence: 'conditional_5' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default catcher;
