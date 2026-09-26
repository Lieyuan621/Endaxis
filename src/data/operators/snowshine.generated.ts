/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const snowshineChr_0014_aurora_attack1ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.2 },
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
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0014_aurora_attack2'] },
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

export const snowshineChr_0014_aurora_attack1: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_attack1ActionGraph,
  key: 'chr_0014_aurora_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    env_dmg: 20,
  },
  timelineBlockFrames: 32,
  naturalDurationFrames: 111,
  exclusiveFrame: 35,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 47,
        input: 'basicAttack',
        targetSkillId: 'chr_0014_aurora_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 32, endFrame: 47, skillIds: ['chr_0014_aurora_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 32, endFrame: 47, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0014_aurora_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const snowshineChr_0014_aurora_attack2ActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.2 },
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
          parameters: { skillIds: ['chr_0014_aurora_attack3'] },
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

export const snowshineChr_0014_aurora_attack2: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_attack2ActionGraph,
  key: 'chr_0014_aurora_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.59, 0.64, 0.7, 0.76, 0.82, 0.88, 0.94, 0.99, 1.05, 1.13, 1.21, 1.32],
    env_dmg: 25,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 110,
  exclusiveFrame: 30,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 43,
        input: 'basicAttack',
        targetSkillId: 'chr_0014_aurora_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 28, endFrame: 43, skillIds: ['chr_0014_aurora_attack3'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 28, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0014_aurora_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const snowshineChr_0014_aurora_attack3ActionGraph = {
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
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale1',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_3' },
            right: { kind: 'constant', value: 0.4 },
          },
        },
        next: 'dealDamage_3',
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
          body: { $sequence: 'calculateActionValue_4' },
        },
        next: null,
      },
      changeResourceByActionValue_6: {
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
      once_7: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'changeResourceByActionValue_6' },
        },
        next: null,
      },
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'once_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_8' },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_9',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale2',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'constant', value: 0.6 },
          },
        },
        next: 'dealDamage_10',
      },
      repeatEachTick_12: {
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
          body: { $sequence: 'calculateActionValue_11' },
        },
        next: null,
      },
      reachSkillOperableBoundary_13: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0014_aurora_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineChr_0014_aurora_attack3: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_attack3ActionGraph,
  key: 'chr_0014_aurora_attack3',
  blackboard: {
    atb: 25,
    atk_scale: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    atk_scale1: 0,
    atk_scale2: 0.8,
    env_dmg: 25,
    env_dmg2: 30,
    poise: 23,
  },
  timelineBlockFrames: 61,
  naturalDurationFrames: 131,
  exclusiveFrame: 65,
  offsetRecordFrame: 39,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 75,
        input: 'basicAttack',
        targetSkillId: 'chr_0014_aurora_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 61, endFrame: 75, skillIds: ['chr_0014_aurora_attack1'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 21, endFrame: 27, sequence: { $sequence: 'repeatEachTick_5' } },
    { startFrame: 39, endFrame: 43, sequence: { $sequence: 'repeatEachTick_12' } },
    { startFrame: 61, endFrame: 75, sequence: { $sequence: 'reachSkillOperableBoundary_13' } },
  ],
  timelineContinuationSkillId: 'chr_0014_aurora_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const snowshineChr_0014_aurora_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'auro_power_attack' },
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
      gainFinisherSp_3: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'conditional_2',
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
        next: 'gainFinisherSp_3',
      },
      applyBuff_5: {
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
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineChr_0014_aurora_power_attack: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_power_attackActionGraph,
  key: 'chr_0014_aurora_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 41,
  naturalDurationFrames: 133,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 41,
        endFrame: 75,
        skillIds: ['chr_0014_aurora_normal_skill', 'chr_0014_aurora_combo_skill'],
      },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 41, endFrame: 43, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_6' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const snowshineChr_0014_aurora_plunging_attack_endActionGraph = {
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

export const snowshineChr_0014_aurora_plunging_attack_end: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_plunging_attack_endActionGraph,
  key: 'chr_0014_aurora_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 90,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 9,
  scheduledSequences: [{ startFrame: 1, endFrame: 2, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const snowshineChr_0014_aurora_normal_skillActionGraph = {
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
      markCurrentSkillCanInterrupt_4: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      changeResourceByActionValue_5: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'changeResourceByActionValue_5' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
          },
        },
        next: 'conditional_6',
      },
      finishTimeline_8: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0014_aurora_potential_1_listener',
            target: 'party',
            finishByAction: true,
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: {
              taken_dmg: { kind: 'valueNode', nodeId: 'data_7' },
              potential_1: { kind: 'valueNode', nodeId: 'data_8' },
            },
          },
        },
        next: 'conditional_10',
      },
      jumpTimeline_opt1: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 107 } },
        next: null,
      },
      conditional_opt2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'jumpTimeline_opt1' },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
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
                key: 'SkillData.chr_0014_aurora_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_13' },
              },
              {
                key: 'SkillData.chr_0014_aurora_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
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
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 1 } },
            copiedBlackboardAssignments: { taken_dmg: 'taken_dmg' },
          },
        },
        next: null,
      },
      changeResourceByActionValue_19: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_11' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_20: {
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
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_12' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'startTimeDilation_20',
      },
      once_22: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'changeResourceByActionValue_19' },
        },
        next: 'dealDamage_21',
      },
      applyElementalInfliction_23: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'once_22',
      },
      repeatEachTick_24: {
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
          body: { $sequence: 'applyElementalInfliction_23' },
        },
        next: null,
      },
      startTimeDilation_25: {
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
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { taken_dmg: { kind: 'valueNode', nodeId: 'data_14' } },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_base' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'talent_2_sup' } },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'talent_2_sup', fallback: 0 },
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
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
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
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1' } },
      data_9: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_atb' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineChr_0014_aurora_normal_skill: SkillDefinition = {
  key: 'chr_0014_aurora_normal_skill',
  blackboard: {
    atb_return_base: 30,
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    poise: 20,
    potential_1: 0,
    potential_5_atb: 0,
    taken_dmg: 0.9,
    talent_2_sup: 0,
  },
  timelineBlockFrames: 67,
  naturalDurationFrames: 208,
  exclusiveFrame: 145,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 135, endFrame: 145, skillIds: ['chr_0014_aurora_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeResourceByActionValue_2' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 67, endFrame: 70, sequence: { $sequence: 'markCurrentSkillCanInterrupt_4' } },
    { startFrame: 107, endFrame: 109, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 106, endFrame: 107, sequence: { $sequence: 'finishTimeline_8' } },
    { startFrame: 0, endFrame: 51, sequence: { $sequence: 'applyBuff_11' } },
    { startFrame: 0, endFrame: 51, sequence: { $sequence: 'listenForCombatEvents_opt3' } },
    { startFrame: 107, endFrame: 108, sequence: { $sequence: 'applyBuff_18' } },
    { startFrame: 125, endFrame: 127, sequence: { $sequence: 'repeatEachTick_24' } },
    { startFrame: 107, endFrame: 110, sequence: { $sequence: 'startTimeDilation_25' } },
    { startFrame: 107, endFrame: 125, sequence: { $sequence: 'applyBuff_26' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: snowshineChr_0014_aurora_normal_skillActionGraph,
};

export const snowshineChr_0014_aurora_combo_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'MainChar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_1' },
        },
        next: null,
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 2 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0014_aurora_combo_skill_bear_gene',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 60,
                castResource: {
                  costFrame: 9,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 0.42,
                  duration: 0,
                  heal_scale: 0,
                  heal_scale_loop: 0,
                  heal_static_value: 0,
                  heal_static_value_loop: 0,
                  interval: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 2, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0014_aurora_combo_skill',
                            childSkillId: 'chr_0014_aurora_combo_skill_abilityrange',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
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
      withActionBlackboardScope_7: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_5' },
        },
        next: null,
      },
      findCharacterTeamTargets_8: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'BearPos', selection: { kind: 'controlledOperator' } },
        },
        next: 'withActionBlackboardScope_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_7' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_8' },
        },
        next: null,
      },
      changeResourceByActionValue_10: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: 'conditional_9',
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.533 },
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
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineChr_0014_aurora_combo_skill: SkillDefinition = {
  key: 'chr_0014_aurora_combo_skill',
  blackboard: {
    atk_scale: 0.42,
    cam_angle: 0,
    cam_duration: 0,
    duration: 3,
    heal_scale: [0.22, 0.27, 0.31, 0.36, 0.38, 0.4, 0.43, 0.45, 0.47, 0.48, 0.49, 0.5],
    heal_scale_loop: [0.06, 0.07, 0.08, 0.09, 0.1, 0.1, 0.11, 0.11, 0.12, 0.12, 0.12, 0.13],
    heal_static_value: [
      96, 115.2, 134.4, 153.6, 163.2, 172.8, 182.4, 192, 201.6, 206.4, 211.2, 216,
    ],
    heal_static_value_loop: [24, 28.8, 33.6, 38.4, 40.8, 43.2, 45.6, 48, 50.4, 51.6, 52.8, 54],
    input_angle: 0,
    interval: 0.5,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    usp: 10,
    trigger_hp_ratio: 0.6,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 123,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 15, endFrame: 60, skillIds: ['chr_0014_aurora_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 0, endFrame: 123, sequence: { $sequence: 'conditional_3' } },
    { startFrame: 12, endFrame: 15, sequence: { $sequence: 'changeResourceByActionValue_10' } },
    { startFrame: 0, endFrame: 13, sequence: { $sequence: 'startTimeDilation_11' } },
  ],
  cooldownFrames: [750, 750, 750, 750, 750, 750, 750, 750, 720, 720, 720, 690],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: snowshineChr_0014_aurora_combo_skillActionGraph,
};

export const snowshineChr_0014_aurora_ultimate_skillActionGraph = {
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
      dealDamage_2: {
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
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0014_aurora_ultimate_skill',
            childSkillId: 'chr_0014_aurora_ultimate_skill_abilityrange_potential2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0014_aurora_ultimate_skill',
            childSkillId: 'chr_0014_aurora_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'spawnAbilityEntity_3' },
          whenFalse: { $sequence: 'spawnAbilityEntity_4' },
        },
        next: null,
      },
      hideUi_6: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_7: {
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
      applyBuff_8: {
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
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineChr_0014_aurora_ultimate_skill: SkillDefinition = {
  actionGraph: snowshineChr_0014_aurora_ultimate_skillActionGraph,
  key: 'chr_0014_aurora_ultimate_skill',
  blackboard: {
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    extra_duration: 0,
    frozen_level: 1,
    poise: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
    potential_2: 0,
    potential_2_range: 0,
    atk_scale_loop: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    duration: 5,
    forst_allow_count: 2,
    interval: 0.5,
  },
  timelineBlockFrames: 91,
  naturalDurationFrames: 142,
  exclusiveFrame: 90,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 71,
        endFrame: 90,
        skillIds: ['chr_0014_aurora_normal_skill', 'chr_0014_aurora_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 62, endFrame: 65, sequence: { $sequence: 'dealDamage_2' } },
    { startFrame: 62, endFrame: 65, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'hideUi_6' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'startUltimateTimeDilation_7' } },
    { startFrame: 0, endFrame: 90, sequence: { $sequence: 'applyBuff_8' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const snowshineCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const snowshineCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: snowshineCommon_character_perfect_dodgeActionGraph,
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

const snowshineComboCondition1ActionGraph = {
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
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'trigger',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.6 },
        },
      },
      data_2: {
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

const snowshineComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0014_aurora_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: snowshineComboCondition1ActionGraph,
};

const snowshineBuff1ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'will',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_static_value' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { heal_scale: 1, heal_static_value: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'heal_1' } },
  actionGraph: snowshineBuff1ActionGraph,
};

const snowshineBuff2ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'will',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale_loop' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_static_value_loop' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'interval' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 999,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, heal_scale_loop: 0, heal_static_value_loop: 0, interval: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'heal_1' } },
  actionGraph: snowshineBuff2ActionGraph,
};

const snowshineBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.05 },
  attributeModifiers: [],
  actionGraph: snowshineBuff3ActionGraph,
};

const snowshineBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: snowshineBuff4ActionGraph,
};

const snowshineBuff5ActionGraph = {
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
            buffId: 'buff_chr_0014_aurora_reduce_damage_remain',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.5 } },
            copiedBlackboardAssignments: { potential_1: 'potential_1', taken_dmg: 'taken_dmg' },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Shielded'],
  extendTags: [],
  blackboard: { duration: 9999, potential_1: 0, taken_dmg: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'applyBuff_1' },
    finish: { $sequence: 'applyBuff_2' },
  },
  actionGraph: snowshineBuff5ActionGraph,
};

const snowshineBuff6ActionGraph = {
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff6: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0.5, potential_1: 0, taken_dmg: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: snowshineBuff6ActionGraph,
};

const snowshineBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { heal_up: 0.1, rate: 0.5 },
  attributeModifiers: [],
  healModifiers: [
    {
      enabledSide: 'healer',
      condition: {
        kind: 'targetHealthCompare',
        valueType: 'ratio',
        operator: 'lessOrEqual',
        value: { blackboardKey: 'rate' },
      },
      processors: [
        {
          kind: 'modifyCalculationResult',
          timing: 'afterCalculation',
          baseMultiplier: { blackboardKey: 'heal_up' },
          multiplierCount: 1,
        },
      ],
    },
  ],
  actionGraph: snowshineBuff7ActionGraph,
};

const snowshineBuff8ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_loop' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff8: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 5,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale_loop: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'dealDamage_1' } },
  actionGraph: snowshineBuff8ActionGraph,
};

const snowshineBuff9ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 2 },
            slot: 'TimeDilation/Layer/Entity/Frozen',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -1,
                  outTangent: -1,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: -1,
                  outTangent: -1,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: ['enemy'],
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_cryst_cryst_frozen_triggered',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { extra_duration: 'extra_duration' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'less',
          value: { kind: 'constant', value: 30 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const snowshineBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 2,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5, extra_duration: 0, frozen_level: 1 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'conditional_2' },
    trigger: { $sequence: 'applyBuff_3' },
  },
  actionGraph: snowshineBuff9ActionGraph,
};

export const snowshine: OperatorDefinition = {
  slug: 'snowshine',
  gameId: 'SNOWSHINE',
  rarity: 5,
  weaponType: 'greatsword',
  element: 'cryo',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [18, 47, 78, 108, 139, 154],
    agility: [12, 32, 52, 73, 94, 104],
    intellect: [9, 27, 46, 65, 84, 93],
    will: [10, 31, 53, 75, 97, 108],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        snowshineChr_0014_aurora_attack1,
        snowshineChr_0014_aurora_attack2,
        snowshineChr_0014_aurora_attack3,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: snowshineChr_0014_aurora_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: snowshineChr_0014_aurora_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: snowshineChr_0014_aurora_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: snowshineChr_0014_aurora_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: snowshineChr_0014_aurora_ultimate_skill,
    },
  ],
  dodgeSkill: snowshineCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0014_aurora_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0014_aurora_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0014_aurora_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0014_aurora_attack1',
        'chr_0014_aurora_attack2',
        'chr_0014_aurora_attack3',
        'chr_0014_aurora_plunging_attack_end',
        'chr_0014_aurora_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0014_aurora_attack1',
        'chr_0014_aurora_attack2',
        'chr_0014_aurora_attack3',
      ],
      defaultSkillKey: 'chr_0014_aurora_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [snowshineComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0014_aurora_talent_0',
          blackboardAssignments: { heal_up: [0.15, 0.25], rate: [0.45, 0.55] },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_2_sup',
          operation: 'assign',
          value: [6, 10],
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
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_2_range',
          operation: 'assign',
          value: 0.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'extra_duration',
          operation: 'add',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5_atb',
          operation: 'assign',
          value: 10,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0014_aurora_combo_skill_heal: snowshineBuff1,
    buff_chr_0014_aurora_combo_skill_heal_loop: snowshineBuff2,
    buff_chr_0014_aurora_potential_1: snowshineBuff3,
    buff_chr_0014_aurora_potential_1_listener: snowshineBuff4,
    buff_chr_0014_aurora_reduce_damage: snowshineBuff5,
    buff_chr_0014_aurora_reduce_damage_remain: snowshineBuff6,
    buff_chr_0014_aurora_talent_0: snowshineBuff7,
    buff_chr_0014_aurora_ultimate_skill_dmg: snowshineBuff8,
    buff_chr_0014_aurora_ultimate_skill_frost: snowshineBuff9,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0014_aurora_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              findCharacterTeamTargets_1: {
                action: {
                  kind: 'findCharacterTeamTargets',
                  parameters: {
                    saveToContextKey: 'MainChar',
                    selection: { kind: 'controlledOperator' },
                  },
                },
                next: null,
              },
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0014_aurora_combo_skill_heal',
                    target: 'partyExceptCaster',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      heal_scale: { kind: 'valueNode', nodeId: 'data_1' },
                      heal_static_value: { kind: 'valueNode', nodeId: 'data_2' },
                    },
                  },
                },
                next: null,
              },
              applyBuff_3: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_chr_0014_aurora_combo_skill_heal_loop',
                    target: 'partyExceptCaster',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      heal_scale_loop: { kind: 'valueNode', nodeId: 'data_3' },
                      heal_static_value_loop: { kind: 'valueNode', nodeId: 'data_4' },
                      duration: { kind: 'valueNode', nodeId: 'data_5' },
                      interval: { kind: 'valueNode', nodeId: 'data_6' },
                    },
                  },
                },
                next: null,
              },
              finishActionOwnerAbilityEntity_4: {
                action: { kind: 'finishActionOwnerAbilityEntity', parameters: {} },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_static_value' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_scale_loop' },
              },
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'heal_static_value_loop' },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'interval' } },
            },
          },
          macros: {},
        },
        skillId: 'chr_0014_aurora_combo_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          duration: 0,
          heal_scale: 1,
          heal_scale_loop: 1,
          heal_static_value: 0,
          heal_static_value_loop: 0,
          interval: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'applyBuff_2' } },
          { startFrame: 0, endFrame: 900, sequence: { $sequence: 'applyBuff_3' } },
          {
            startFrame: 90,
            endFrame: 93,
            sequence: { $sequence: 'finishActionOwnerAbilityEntity_4' },
          },
        ],
      },
    },
    abilityentity_chr_0014_aurora_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 8 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkills: {
        chr_0014_aurora_ultimate_skill_abilityrange_potential2: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0014_aurora_ultimate_skill_dmg',
                      target: 'enemy',
                      finishByAction: true,
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        atk_scale_loop: { kind: 'valueNode', nodeId: 'data_1' },
                      },
                    },
                  },
                  next: null,
                },
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0014_aurora_ultimate_skill_frost',
                      target: 'enemy',
                      finishByAction: true,
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        extra_duration: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  },
                  next: 'applyBuff_1',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_loop' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'extra_duration' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0014_aurora_ultimate_skill_abilityrange_potential2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 4, atk_scale_loop: 1, extra_duration: 0, frozen_level: 1 },
          scheduledSequences: [
            { startFrame: 4, endFrame: 156, sequence: { $sequence: 'applyBuff_2' } },
          ],
        },
        chr_0014_aurora_ultimate_skill_abilityrange: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0014_aurora_ultimate_skill_dmg',
                      target: 'enemy',
                      finishByAction: true,
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        atk_scale_loop: { kind: 'valueNode', nodeId: 'data_1' },
                      },
                    },
                  },
                  next: null,
                },
                applyBuff_2: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_chr_0014_aurora_ultimate_skill_frost',
                      target: 'enemy',
                      finishByAction: true,
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        extra_duration: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  },
                  next: 'applyBuff_1',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'atk_scale_loop' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'extra_duration' },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0014_aurora_ultimate_skill_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 4, atk_scale_loop: 1, extra_duration: 0, frozen_level: 1 },
          scheduledSequences: [
            { startFrame: 4, endFrame: 157, sequence: { $sequence: 'applyBuff_2' } },
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default snowshine;
