/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const catcherChr_0020_meurs_attack1ActionGraph = {
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
      repeatEachTick_8: {
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
          body: { $sequence: 'dealDamage_7' },
        },
        next: null,
      },
      reachSkillOperableBoundary_9: {
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
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_attack1: SkillDefinition = {
  key: 'chr_0020_meurs_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
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
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'repeatEachTick_8' } },
    { startFrame: 21, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0020_meurs_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: catcherChr_0020_meurs_attack1ActionGraph,
};

export const catcherChr_0020_meurs_attack2ActionGraph = {
  main: {
    nodes: {
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
      startTimeDilation_6: {
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
        next: 'changeResource_5',
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      repeatEachTick_11: {
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
          body: { $sequence: 'dealDamage_10' },
        },
        next: null,
      },
      reachSkillOperableBoundary_12: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0020_meurs_attack3'] },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_attack2: SkillDefinition = {
  key: 'chr_0020_meurs_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.39, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.65, 0.69, 0.74, 0.8, 0.87],
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
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'repeatEachTick_11' } },
    { startFrame: 21, endFrame: 35, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0020_meurs_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: catcherChr_0020_meurs_attack2ActionGraph,
};

export const catcherChr_0020_meurs_attack3ActionGraph = {
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
        next: 'changeResource_2',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_5' },
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
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0020_meurs_attack4'] },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_attack3: SkillDefinition = {
  key: 'chr_0020_meurs_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.54, 0.59, 0.65, 0.7, 0.76, 0.81, 0.86, 0.92, 0.97, 1.04, 1.12, 1.22],
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
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 28, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0020_meurs_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: catcherChr_0020_meurs_attack3ActionGraph,
};

export const catcherChr_0020_meurs_attack4ActionGraph = {
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
      once_5: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_3' } },
        next: null,
      },
      startTimeDilation_6: {
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
        next: 'once_5',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_7',
      },
      repeatEachTick_9: {
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
          body: { $sequence: 'dealDamage_8' },
        },
        next: null,
      },
      reachSkillOperableBoundary_10: {
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
  key: 'chr_0020_meurs_attack4',
  element: 'physical',
  blackboard: {
    atb: 25,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
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
    { startFrame: 23, endFrame: 25, sequence: { $sequence: 'repeatEachTick_9' } },
    { startFrame: 45, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0020_meurs_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: catcherChr_0020_meurs_attack4ActionGraph,
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
      startTimeDilation_4: {
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
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.6,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_7',
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
      applyBuff_10: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_power_attack: SkillDefinition = {
  key: 'chr_0020_meurs_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 76,
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
    { startFrame: 35, endFrame: 37, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 0, endFrame: 35, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_10' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: catcherChr_0020_meurs_power_attackActionGraph,
};

export const catcherChr_0020_meurs_plunging_attack_endActionGraph = {
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

export const catcherChr_0020_meurs_plunging_attack_end: SkillDefinition = {
  key: 'chr_0020_meurs_plunging_attack_end',
  element: 'physical',
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
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: catcherChr_0020_meurs_plunging_attack_endActionGraph,
};

export const catcherChr_0020_meurs_normal_skillActionGraph = {
  main: {
    nodes: {
      findTargets_opt1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
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
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_obtain_ultimate_sp',
                blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_9',
      },
      jumpTimeline_13: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 255 },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_14: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      interruptCurrentSkill_15: {
        action: { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      copyContextTargets_23: {
        action: {
          kind: 'copyContextTargets',
          parameters: { source: { kind: 'context', key: 'Attacker' }, saveToContextKey: 'HitTar' },
        },
        next: null,
      },
      aura_30: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: false,
            buffs: [
              {
                buffId: 'buff_chr_0020_meurs_reduce_damage',
                blackboardAssignments: { taken_dmg: { kind: 'valueNode', nodeId: 'data_3' } },
                stringBlackboardAssignments: {},
              },
            ],
          },
          onEnter: { $sequence: null },
          onExit: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_34: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 60 },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
        },
        next: null,
      },
      copyContextTargets_35: {
        action: {
          kind: 'copyContextTargets',
          parameters: { source: { kind: 'inputTarget' }, saveToContextKey: 'Attacker' },
        },
        next: 'jumpTimeline_34',
      },
      checkCondition_36: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'copyContextTargets_35',
      },
      checkCondition_37: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_36',
      },
      copyContextTargets_32: {
        action: {
          kind: 'copyContextTargets',
          parameters: { source: { kind: 'fixed', target: 'enemy' }, saveToContextKey: 'Attacker' },
        },
        next: 'jumpTimeline_34',
      },
      checkCondition_33: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'copyContextTargets_32',
      },
      listenForCombatEvents_38: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'checkCondition_33' },
              },
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'checkCondition_37' },
              },
            ],
          },
        },
        next: null,
      },
      changeResource_41: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      checkCondition_42: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'changeResource_41',
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_42',
      },
      startTimeDilation_45: {
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
      ifElse_46: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'startTimeDilation_45' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_47: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_13' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'ifElse_46',
      },
      once_48: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'checkCondition_43' } },
        next: 'dealDamage_47',
      },
      applyBuff_49: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_no_guard' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'once_48',
      },
      repeatEachTick_50: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'applyBuff_49' },
        },
        next: null,
      },
      startTimeDilation_51: {
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
      copyContextTargets_opt1: {
        action: {
          kind: 'copyContextTargets',
          parameters: { source: { kind: 'fixed', target: 'enemy' }, saveToContextKey: 'HitTar' },
        },
        next: null,
      },
      findTargets_opt2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'MainTar',
          },
        },
        next: 'copyContextTargets_opt1',
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
          whenTrue: { $sequence: 'copyContextTargets_23' },
          whenFalse: { $sequence: 'copyContextTargets_23' },
        },
        next: null,
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'findTargets_opt2' },
          whenFalse: { $sequence: 'ifElse_opt3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_base' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'taken_dmg' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 3,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageFeaturesMatch',
          match: 'exceptAny',
          features: ['dot', 'remainArea'],
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'potential5_atb' } },
      data_9: {
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
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential5_atb', fallback: 0 },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_12: {
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
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_15: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'Attacker' },
          distance: 3.5,
          lessThan: false,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const catcherChr_0020_meurs_normal_skill: SkillDefinition = {
  key: 'chr_0020_meurs_normal_skill',
  element: 'physical',
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
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findTargets_opt1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'changeResource_8' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_10' } },
    { startFrame: 60, endFrame: 62, sequence: { $sequence: 'checkCondition_10' } },
    { startFrame: 45, endFrame: 46, sequence: { $sequence: 'jumpTimeline_13' } },
    { startFrame: 129, endFrame: 132, sequence: { $sequence: 'markCurrentSkillCanInterrupt_14' } },
    { startFrame: 194, endFrame: 195, sequence: { $sequence: 'interruptCurrentSkill_15' } },
    { startFrame: 60, endFrame: 63, sequence: { $sequence: 'ifElse_opt4' } },
    { startFrame: 0, endFrame: 83, sequence: { $sequence: 'aura_30' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'listenForCombatEvents_38' } },
    { startFrame: 83, endFrame: 85, sequence: { $sequence: 'repeatEachTick_50' } },
    { startFrame: 60, endFrame: 63, sequence: { $sequence: 'startTimeDilation_51' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: catcherChr_0020_meurs_normal_skillActionGraph,
};

export const catcherChr_0020_meurs_combo_skillActionGraph = {
  main: {
    nodes: {
      changeResource_2: {
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
        next: 'changeResource_2',
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_3',
      },
      startTimeDilation_5: {
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
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'startTimeDilation_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'checkCondition_6',
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0020_meurs_combo_skill_shield',
                copiedBlackboardAssignments: {
                  shield_def_rate: 'shield_def_rate',
                  shield_base: 'shield_base',
                  duration: 'shield_duration',
                },
              },
            ],
            targets: { kind: 'context', key: 'shieldTar' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      mergeContextTargets_13: {
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
        next: 'applyBuff_12',
      },
      findCharacterTeamTargets_14: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainChar', selection: { kind: 'controlledOperator' } },
        },
        next: 'mergeContextTargets_13',
      },
      mergeContextTargets_10: {
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
        next: 'applyBuff_12',
      },
      findCharacterTeamTargets_11: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: {
            saveToContextKey: 'aMate',
            selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
          },
        },
        next: 'mergeContextTargets_10',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'findCharacterTeamTargets_11' },
          whenFalse: { $sequence: 'findCharacterTeamTargets_14' },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'shield_duration',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'ifElse_15',
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'modifyActionValue_16',
      },
      startTimeDilation_18: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: {
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
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'potential3_duration' } },
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

export const catcherChr_0020_meurs_combo_skill: SkillDefinition = {
  key: 'chr_0020_meurs_combo_skill',
  element: 'physical',
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
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'checkCondition_17' } },
    { startFrame: 0, endFrame: 14, sequence: { $sequence: 'startTimeDilation_18' } },
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0020_meurs_ult_weak',
                copiedBlackboardAssignments: {
                  weak_scale: 'weak_scale',
                  weak_duration: 'weak_duration',
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
      startTimeDilation_6: {
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
      dealDamage_7: {
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
        next: 'startTimeDilation_6',
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'dealDamage_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'startTimeDilation_6',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'dealDamage_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_12: {
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
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'startTimeDilation_12',
      },
      applyPhysicalInfliction_14: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'knockDown',
            target: 'enemy',
            duration: { kind: 'valueNode', nodeId: 'data_8' },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_13',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'applyPhysicalInfliction_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      spawnAbilityEntity_16: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0020_meurs_talent_shockwave',
            childSkillId: 'chr_0020_meurs_talent_shockwave',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'spawnAbilityEntity_16',
      },
      hideUi_18: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_19: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'knockdown_time' } },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
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
  element: 'physical',
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
    { startFrame: 46, endFrame: 49, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 46, endFrame: 49, sequence: { $sequence: 'ifElse_8' } },
    { startFrame: 64, endFrame: 67, sequence: { $sequence: 'ifElse_11' } },
    { startFrame: 85, endFrame: 88, sequence: { $sequence: 'ifElse_15' } },
    { startFrame: 102, endFrame: 105, sequence: { $sequence: 'checkCondition_17' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'hideUi_18' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'startUltimateTimeDilation_19' } },
    { startFrame: 0, endFrame: 120, sequence: { $sequence: 'applyBuff_20' } },
  ],
  defaultTarget: 'enemy',
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const catcherComboCondition1ActionGraph = {
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
          selection: 'first',
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
  sequence: { $sequence: 'checkCondition_4' },
  actionGraph: catcherComboCondition1ActionGraph,
};

const catcherComboCondition2ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: false } },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0020_meurs_signal_weakness_trigger_combo' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_1',
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
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
      mergeContextTargets_2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'dealDamage_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'mergeContextTargets_2',
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
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
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
            buffs: [
              {
                buffId: 'buff_common_affixes_shelter',
                blackboardAssignments: {
                  duration: { kind: 'constant', value: 9999999 },
                  rate: { kind: 'valueNode', nodeId: 'data_1' },
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
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0020_meurs_reduce_damage_remain',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.5 } },
                copiedBlackboardAssignments: { taken_dmg: 'taken_dmg' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
    enable: [{ $sequence: 'applyBuff_1' }],
    finish: [{ $sequence: 'applyBuff_2' }],
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
            buffs: [
              {
                buffId: 'buff_common_affixes_shelter',
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
  lifecycleSequences: { finish: [{ $sequence: 'openComboWindow_1' }] },
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
  lifecycleSequences: { trigger: [{ $sequence: 'storeSourceAttributeValue_1' }] },
  actionGraph: catcherBuff6ActionGraph,
};

const catcherBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_weak',
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: catcherBuff7ActionGraph,
};

export const catcher: OperatorDefinition = {
  slug: 'catcher',
  gameId: 'CATCHER',
  rarity: 4,
  weaponType: 'claym',
  element: 'physical',
  characterTypeId: 'Physical',
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
      operationType: 'basicAttack',
      skills: [
        catcherChr_0020_meurs_attack1,
        catcherChr_0020_meurs_attack2,
        catcherChr_0020_meurs_attack3,
        catcherChr_0020_meurs_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: catcherChr_0020_meurs_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: catcherChr_0020_meurs_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: catcherChr_0020_meurs_normal_skill,
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: catcherChr_0020_meurs_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: catcherChr_0020_meurs_ultimate_skill },
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
          skillKey: 'chr_0020_meurs_ultimate_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0020_meurs_ultimate_skill',
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
          skillKey: 'chr_0020_meurs_combo_skill',
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
          skillKey: 'chr_0020_meurs_ultimate_skill',
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
          skillKey: 'chr_0020_meurs_normal_skill',
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
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      deathReleaseDelaySeconds: 0.1,
      childSkill: {
        skillId: 'chr_0020_meurs_talent_shockwave',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 60,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_shockwave: 0.42, talent_1: 0 },
        scheduledSequences: [
          { startFrame: 3, endFrame: 5, sequence: { $sequence: 'dealDamage_4' } },
          { startFrame: 18, endFrame: 20, sequence: { $sequence: 'dealDamage_5' } },
          { startFrame: 33, endFrame: 35, sequence: { $sequence: 'dealDamage_6' } },
          { startFrame: 29, endFrame: 32, sequence: { $sequence: 'checkCondition_8' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              dealDamage_4: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                  },
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_4/action',
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
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                  },
                  key: 'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: null,
              },
              interruptCurrentSkill_7: {
                action: {
                  kind: 'interruptCurrentSkill',
                  parameters: { targets: { kind: 'owner' } },
                },
                next: null,
              },
              checkCondition_8: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'interruptCurrentSkill_7',
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_shockwave' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_2' },
                  operator: 'less',
                  right: { kind: 'constant', value: 2 },
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

export default catcher;
