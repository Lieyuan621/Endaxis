/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const aleshChr_0024_deepfin_combo_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0024_deepfin_combo_camera' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'combo_tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_4',
      },
      dealDamage_6: {
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
      mergeContextTargets_7: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'combo_tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_6',
      },
      changeResource_8: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'mergeContextTargets_7',
      },
      startTimeDilation_11: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_combo2' },
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
            durationSeconds: { kind: 'constant', value: 0.95 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_combo2' },
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
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: 'startTimeDilation_11' },
        },
        next: null,
      },
      changeResource_13: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
          },
        },
        next: 'ifElse_12',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'changeResource_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['comboSkill'],
          },
        },
        next: null,
      },
      mergeContextTargets_22: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'combo_tar_1',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_21',
      },
      changeResource_23: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'mergeContextTargets_22',
      },
      jumpTimeline_24: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 120 },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
        },
        next: null,
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['comboSkill'],
          },
        },
        next: null,
      },
      mergeContextTargets_26: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'combo_tar_1',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_25',
      },
      changeResource_27: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'mergeContextTargets_26',
      },
      jumpTimeline_31: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 65 },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
        },
        next: null,
      },
      checkCondition_32: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'jumpTimeline_31',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'jumpTimeline_31',
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: 'checkCondition_30' },
          whenFalse: { $sequence: 'checkCondition_32' },
        },
        next: null,
      },
      storeSourceAttributeValue_34: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_20' },
            base: { kind: 'valueNode', nodeId: 'data_15' },
            targetKey: 'prob',
          },
        },
        next: 'ifElse_33',
      },
      calculateActionValue_35: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'prob_add',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_20' },
            right: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: 'storeSourceAttributeValue_34',
      },
      calculateActionValue_36: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'prob_max',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_15' },
            right: { kind: 'valueNode', nodeId: 'data_13' },
          },
        },
        next: 'calculateActionValue_35',
      },
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0024_deepfin_potential_3',
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'Duration' },
              },
            ],
            targets: { kind: 'context', key: 'team' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findTargets_39: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'applyBuff_38',
      },
      ifElse_40: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_23' },
          whenTrue: { $sequence: 'findTargets_39' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      checkCondition_41: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_24' } },
        },
        next: null,
      },
      ifElse_42: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_25' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2ex' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb_sp' } },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'usp_normal' } },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1ex' } },
      data_12: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'prob_max' } },
      data_14: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_13' } },
      },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'prob' } },
      data_16: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_15' } },
      },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'prob', fallback: 0 } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'prob_max', fallback: 0 } },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_18' },
        },
      },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'prob_add' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_22: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
      },
      data_23: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_22' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_24: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_25: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_41' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_combo_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_combo_skill',
  element: 'physical',
  blackboard: {
    atb: [10, 10, 10, 10, 10, 12, 12, 12, 12, 13, 13, 15],
    atb_sp: 10,
    atk_scale_1: [0.33, 0.37, 0.4, 0.43, 0.47, 0.5, 0.53, 0.57, 0.6, 0.64, 0.69, 0.75],
    atk_scale_1ex: [0.53, 0.59, 0.64, 0.69, 0.75, 0.8, 0.85, 0.91, 0.96, 1.03, 1.11, 1.2],
    atk_scale_2: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    atk_scale_2ex: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    atk_up: 0.15,
    Duration: 10,
    poise: 10,
    potential_3: 0,
    prob: 0.1,
    prob_add: 0,
    prob_max: 0,
    rate: 10,
    usp_normal: 10,
  },
  timelineBlockFrames: 131,
  naturalDurationFrames: 213,
  exclusiveFrame: 130,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 39, endFrame: 65, skillIds: ['chr_0024_deepfin_normal_skill'] },
      { startFrame: 94, endFrame: 120, skillIds: ['chr_0024_deepfin_normal_skill'] },
      { startFrame: 120, endFrame: 130, skillIds: ['chr_0024_deepfin_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 38, endFrame: 41, sequence: { $sequence: 'mergeContextTargets_5' } },
    { startFrame: 93, endFrame: 96, sequence: { $sequence: 'changeResource_8' } },
    { startFrame: 38, endFrame: 43, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 93, endFrame: 98, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 22, endFrame: 24, sequence: { $sequence: 'changeResource_23' } },
    { startFrame: 64, endFrame: 66, sequence: { $sequence: 'jumpTimeline_24' } },
    { startFrame: 77, endFrame: 79, sequence: { $sequence: 'changeResource_27' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'calculateActionValue_36' } },
    { startFrame: 93, endFrame: 96, sequence: { $sequence: 'ifElse_40' } },
    { startFrame: 34, endFrame: 75, sequence: { $sequence: 'ifElse_42' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: aleshChr_0024_deepfin_combo_skillActionGraph,
};

export const aleshChr_0024_deepfin_attack1ActionGraph = {
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
      startTimeDilation_4: {
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
          parameters: { skillIds: ['chr_0024_deepfin_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack1: SkillDefinition = {
  key: 'chr_0024_deepfin_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 130,
  exclusiveFrame: 25,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 7,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 25, skillIds: ['chr_0024_deepfin_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0024_deepfin_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack1ActionGraph,
};

export const aleshChr_0024_deepfin_attack2ActionGraph = {
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
      startTimeDilation_4: {
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
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'startTimeDilation_7',
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack2: SkillDefinition = {
  key: 'chr_0024_deepfin_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 128,
  exclusiveFrame: 25,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 6,
        endFrame: 25,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 25, skillIds: ['chr_0024_deepfin_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'checkCondition_8' } },
    { startFrame: 10, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0024_deepfin_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack2ActionGraph,
};

export const aleshChr_0024_deepfin_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'startTimeDilation_2',
      },
      changeResource_5: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
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
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
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
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'fixed', target: 'enemy' },
          containsHittableTarget: true,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack3: SkillDefinition = {
  key: 'chr_0024_deepfin_attack3',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 145,
  exclusiveFrame: 29,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 13,
        endFrame: 31,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 31, skillIds: ['chr_0024_deepfin_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'checkCondition_3' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 16, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0024_deepfin_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack3ActionGraph,
};

export const aleshChr_0024_deepfin_attack4ActionGraph = {
  main: {
    nodes: {
      changeResource_2: {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
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
          parameters: { skillIds: ['chr_0024_deepfin_attack5'] },
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack4: SkillDefinition = {
  key: 'chr_0024_deepfin_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 90,
  exclusiveFrame: 30,
  offsetRecordFrame: 15,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 15,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 33, skillIds: ['chr_0024_deepfin_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 22, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0024_deepfin_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack4ActionGraph,
};

export const aleshChr_0024_deepfin_attack5ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_zero' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'ifElse_4' },
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
      changeResource_8: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_9: {
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
        next: 'changeResource_8',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_11' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
            stagger: { kind: 'constant', value: 0 },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_12',
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0024_deepfin_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_attack5: SkillDefinition = {
  key: 'chr_0024_deepfin_attack5',
  element: 'physical',
  blackboard: {
    atb: 19,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
    poise: 17,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 104,
  exclusiveFrame: 40,
  offsetRecordFrame: 18,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 14,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 31, endFrame: 40, skillIds: ['chr_0024_deepfin_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 19, endFrame: 20, sequence: { $sequence: 'dealDamage_13' } },
    { startFrame: 31, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0024_deepfin_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_attack5ActionGraph,
};

export const aleshChr_0024_deepfin_power_attackActionGraph = {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_zero' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
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
        next: 'ifElse_4',
      },
      gainFinisherSp_7: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_9: {
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
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'gainFinisherSp_7' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_10',
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'startTimeDilation_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_14',
      },
      applyBuff_16: {
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
      applyBuff_17: {
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
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
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
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
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
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_power_attack: SkillDefinition = {
  key: 'chr_0024_deepfin_power_attack',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale2: [3.2, 3.52, 3.84, 4.16, 4.48, 4.8, 5.12, 5.44, 5.76, 6.16, 6.64, 7.2],
  },
  timelineBlockFrames: 76,
  naturalDurationFrames: 113,
  exclusiveFrame: 75,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 47,
        endFrame: 75,
        skillIds: ['chr_0024_deepfin_normal_skill', 'chr_0024_deepfin_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 47, endFrame: 49, sequence: { $sequence: 'dealDamage_12' } },
    { startFrame: 13, endFrame: 15, sequence: { $sequence: 'checkCondition_15' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_16' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_17' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: aleshChr_0024_deepfin_power_attackActionGraph,
};

export const aleshChr_0024_deepfin_plunging_attack_endActionGraph = {
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
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_plunging_attack_end: SkillDefinition = {
  key: 'chr_0024_deepfin_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 92,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: aleshChr_0024_deepfin_plunging_attack_endActionGraph,
};

export const aleshChr_0024_deepfin_normal_skillActionGraph = {
  main: {
    nodes: {
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'num',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'modifyActionValue_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      readBuffStackCount_10: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'num_1',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
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
          body: { $sequence: 'readBuffStackCount_10' },
        },
        next: null,
      },
      changeResource_19: {
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
        next: null,
      },
      changeResource_18: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_17: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_16: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_8' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      switch_26: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_9' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'changeResource_16' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'changeResource_17' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'changeResource_18' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'changeResource_19' } },
          ],
        },
        next: null,
      },
      calculateActionValue_22: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_4',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'switch_26',
      },
      calculateActionValue_23: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_3',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'calculateActionValue_22',
      },
      calculateActionValue_24: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_2',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_7' },
            right: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'calculateActionValue_23',
      },
      calculateActionValue_25: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_1',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'calculateActionValue_24',
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'calculateActionValue_25' },
          whenFalse: { $sequence: 'switch_26' },
        },
        next: null,
      },
      startTimeDilation_29: {
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
        next: null,
      },
      ifElse_30: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'startTimeDilation_29' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_31: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_14' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'ifElse_30',
      },
      repeatEachTick_32: {
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
          body: { $sequence: 'dealDamage_31' },
        },
        next: null,
      },
      applyBuff_33: {
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
      ifElse_34: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'applyBuff_33' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forceSpellStatus_36: {
        action: {
          kind: 'forceSpellStatus',
          parameters: {
            target: 'enemy',
            element: 'cryo',
            consumedElement: 'cryo',
            consumedLayers: { kind: 'valueNode', nodeId: 'data_17' },
            count: { kind: 'valueNode', nodeId: 'data_17' },
            isExtra: false,
          },
        },
        next: null,
      },
      readBuffStackCount_37: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'count',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'forceSpellStatus_36',
      },
      ifElse_38: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'readBuffStackCount_37' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      repeatEachTick_39: {
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
          body: { $sequence: 'ifElse_38' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'num_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'num_1', fallback: 0 } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'num', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb_4' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb_3' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atb_2' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb_1' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'num' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'potential_1_atb' } },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_13: {
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
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_16: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: { kind: 'fixed', target: 'enemy' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_normal_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_normal_skill',
  element: 'physical',
  blackboard: {
    atb_1: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
    atb_2: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_3: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
    atb_4: [40, 40, 40, 40, 40, 40, 40, 40, 40, 45, 45, 45],
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    count: 0,
    num: 0,
    num_1: 0,
    poise: 10,
    potential_1: 0,
    potential_1_atb: 0,
  },
  timelineBlockFrames: 51,
  naturalDurationFrames: 126,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_11' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'ifElse_27' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_32' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'ifElse_34' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'repeatEachTick_39' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: aleshChr_0024_deepfin_normal_skillActionGraph,
};

export const aleshChr_0024_deepfin_ultimate_skillActionGraph = {
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
            targets: [{ kind: 'owner' }],
          },
        },
        next: null,
      },
      dealDamage_10: {
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
      calculateActionValue_8: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'dealDamage_10',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_4',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'calculateActionValue_8' },
          whenFalse: { $sequence: 'dealDamage_10' },
        },
        next: null,
      },
      repeatEachTick_12: {
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
          body: { $sequence: 'ifElse_11' },
        },
        next: null,
      },
      applyElementalInfliction_13: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: 'repeatEachTick_12',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'applyElementalInfliction_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_17: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_10' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_16: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_11' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'changeResource_16' },
          whenFalse: { $sequence: 'changeResource_17' },
        },
        next: null,
      },
      modifyActionValue_19: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_up',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_14' },
          },
        },
        next: 'ifElse_18',
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atb_up',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_15' },
          },
        },
        next: 'modifyActionValue_19',
      },
      ifElse_21: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
          whenTrue: { $sequence: 'modifyActionValue_20' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_22: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'deepfin_ult' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_17' },
          whenTrue: { $sequence: 'startTimeDilation_22' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'ifElse_23',
      },
      applyBuff_25: {
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
      hideUi_26: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_27: {
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'hp_tar' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: { kind: 'fixed', target: 'enemy' },
          valueType: 'ratio',
          operator: 'lessOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_4' },
        },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
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
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_5' } },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_max' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atb_up', fallback: 0 } },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_12' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 100 },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'kill_num' } },
      data_16: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_17: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_ultimate_skill: SkillDefinition = {
  key: 'chr_0024_deepfin_ultimate_skill',
  element: 'cryo',
  blackboard: {
    atb: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_max: 100,
    atb_up: [12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 15, 15],
    atk_scale: [4.36, 4.79, 5.23, 5.66, 6.1, 6.53, 6.97, 7.41, 7.84, 8.39, 9.04, 9.8],
    atk_up: 1.5,
    hp_tar: 0.5,
    kill_num: 0,
    poise: 20,
    potential_5: 0,
  },
  timelineBlockFrames: 96,
  naturalDurationFrames: 180,
  exclusiveFrame: 110,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 87,
        endFrame: 113,
        input: 'basicAttack',
        targetSkillId: 'chr_0024_deepfin_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 96,
        endFrame: 113,
        skillIds: [
          'chr_0024_deepfin_attack1',
          'chr_0024_deepfin_normal_skill',
          'chr_0024_deepfin_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 90, endFrame: 93, sequence: { $sequence: 'ifElse_14' } },
    { startFrame: 91, endFrame: 94, sequence: { $sequence: 'ifElse_21' } },
    { startFrame: 90, endFrame: 93, sequence: { $sequence: 'checkCondition_24' } },
    { startFrame: 0, endFrame: 110, sequence: { $sequence: 'applyBuff_25' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'hideUi_26' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'startUltimateTimeDilation_27' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: aleshChr_0024_deepfin_ultimate_skillActionGraph,
};

export const aleshCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: aleshCommon_character_perfect_dodgeActionGraph,
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

export const aleshChr_0024_deepfin_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const aleshChr_0024_deepfin_plunging_attack_start: SkillDefinition = {
  actionGraph: aleshChr_0024_deepfin_plunging_attack_startActionGraph,
  key: 'chr_0024_deepfin_plunging_attack_start',
  element: 'physical',
  blackboard: {},
  timelineBlockFrames: 1501,
  naturalDurationFrames: 1513,
  exclusiveFrame: 1500,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  nativeSkillType: 'attack',
  levelSource: 'basicAttack',
};

const aleshComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'targetObjectTypeMatch',
          target: { kind: 'inputTarget' },
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0024_deepfin_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: aleshComboCondition1ActionGraph,
};

const aleshComboCondition2ActionGraph = {
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
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'targetObjectTypeMatch',
          target: { kind: 'inputTarget' },
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0024_deepfin_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: aleshComboCondition2ActionGraph,
};

const aleshBuff1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.63 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.3 },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'startTimeDilation_1' } },
  ],
  actionGraph: aleshBuff1ActionGraph,
};

const aleshBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff2: SkillBuffDefinition = {
  stackingType: 'refresh',
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
  blackboard: { atk_up: 0.15, duration: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: aleshBuff2ActionGraph,
};

const aleshBuff3ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'talent',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      changeResource_2: {
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
        next: 'createTimedMarker_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'changeResource_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'changeResource_2',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'source' },
          returnTrueIfNotExists: true,
          markerId: 'talent',
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'source' },
          returnTrueIfNotExists: true,
          markerId: 'talent',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 0, count: 0, usp: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
  ],
  actionGraph: aleshBuff3ActionGraph,
};

const aleshBuff4ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: true },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: false,
            buffs: [
              {
                buffId: 'buff_chr_0024_deepfin_talent_1',
                blackboardAssignments: {
                  usp: { kind: 'valueNode', nodeId: 'data_1' },
                  CD: { kind: 'valueNode', nodeId: 'data_2' },
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
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'source' },
            markerId: 'talent',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_2' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      changeResource_3: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: 'createTimedMarker_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'usp_final',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'changeResource_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'calculateActionValue_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_5',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'CD' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp_final' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp_self' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'source' },
          returnTrueIfNotExists: true,
          markerId: 'talent',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const aleshBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { CD: 3, count: 0, usp: 10, usp_final: 0, usp_self: 12 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
  ],
  actionGraph: aleshBuff4ActionGraph,
};

export const alesh: OperatorDefinition = {
  slug: 'alesh',
  gameId: 'ALESH',
  rarity: 5,
  weaponType: 'sword',
  element: 'cryo',
  characterTypeId: 'Cryst',
  role: 'vanguard',
  mainAttribute: 'strength',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [20, 49, 80, 111, 142, 158],
    agility: [9, 27, 47, 66, 86, 95],
    intellect: [13, 37, 62, 87, 113, 125],
    will: [10, 27, 45, 63, 81, 89],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skills: [
    aleshChr_0024_deepfin_combo_skill,
    aleshChr_0024_deepfin_attack1,
    aleshChr_0024_deepfin_attack2,
    aleshChr_0024_deepfin_attack3,
    aleshChr_0024_deepfin_attack4,
    aleshChr_0024_deepfin_attack5,
    aleshChr_0024_deepfin_power_attack,
    aleshChr_0024_deepfin_plunging_attack_end,
    aleshChr_0024_deepfin_normal_skill,
    aleshChr_0024_deepfin_ultimate_skill,
    aleshCommon_character_perfect_dodge,
    aleshChr_0024_deepfin_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0024_deepfin_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0024_deepfin_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0024_deepfin_normal_skill'],
    },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0024_deepfin_combo_skill'] },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0024_deepfin_ultimate_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0024_deepfin_plunging_attack_start',
    endSkillId: 'chr_0024_deepfin_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 2,
  },
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0024_deepfin_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0024_deepfin_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0024_deepfin_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
        'chr_0024_deepfin_plunging_attack_end',
        'chr_0024_deepfin_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
      ],
      defaultSkillKey: 'chr_0024_deepfin_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [aleshComboCondition1, aleshComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0024_deepfin_talent_1_auro',
          blackboardAssignments: { usp: [3, 4], usp_self: [6, 8] },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'prob_add',
          operation: 'assign',
          value: [0.002, 0.005],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'prob_max',
          operation: 'assign',
          value: [0.3, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'rate',
          operation: 'assign',
          value: [10, 10],
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
          skillKey: 'chr_0024_deepfin_normal_skill',
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_normal_skill',
          blackboardKey: 'potential_1_atb',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_combo_skill',
          blackboardKey: 'Duration',
          operation: 'assign',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0024_deepfin_ultimate_skill',
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
          skillKey: 'chr_0024_deepfin_ultimate_skill',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_ultimate_skill',
          blackboardKey: 'hp_tar',
          operation: 'assign',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0024_deepfin_ultimate_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 1.5,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0024_deepfin_combo_camera: aleshBuff1,
    buff_chr_0024_deepfin_potential_3: aleshBuff2,
    buff_chr_0024_deepfin_talent_1: aleshBuff3,
    buff_chr_0024_deepfin_talent_1_auro: aleshBuff4,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default alesh;
