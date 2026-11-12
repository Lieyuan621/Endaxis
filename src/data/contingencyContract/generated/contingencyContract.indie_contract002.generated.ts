/** 由危机合约原生词条、GlobalBuff 与 BuffData 闭包生成；不要手工编辑。 */
import type { ContingencyContractTagDefinition } from '../../../../packages/game-data-contract/src/index.ts';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph';

/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';

import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs';
const commonBuff_buff_cc02_eny_numshield$actionGraph = {
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
          kind: 'eventDamageTagsMatch',
          match: 'exceptAny',
          tags: ['normalAttackLastCombo', 'normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc02_eny_numshield: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: -1,
  applyTags: ['Visual/ShowHPBar/ShowWhenFullHp', 'Visual/ShowHPBar/HideLevel', 'Immune/Damage'],
  extendTags: [],
  blackboard: { behit: 0, shield_num: 1, shield_num_max: 2 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [{ kind: 'damageScale', side: 'defender', zone: 'product', addition: -9999 }],
    },
  ],
  poiseModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'modifyPoiseScalar',
          timing: 'beforeCalculation',
          side: 'defender',
          values: { slot: 'finalMultiplier', value: 0 },
        },
      ],
    },
  ],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: commonBuff_buff_cc02_eny_numshield$actionGraph,
};

const commonBuff_buff_cc_chr_combo_lock$actionGraph = {
  main: {
    nodes: {
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_combo_lock_stack' }],
            targets: { kind: 'context', key: 'team' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      queueComboLock_2: {
        action: {
          kind: 'queueComboLock',
          parameters: { durationSeconds: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_combo_lock_instance',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'context', key: 'team' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'queueComboLock_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'team' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_combo_lock_stack'],
            reason: 'other',
          },
        },
        next: 'applyBuff_3',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'finishBuffsById_4' },
          whenFalse: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'ifElse_6',
      },
      findTargets_8: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'checkCondition_7',
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'findTargets_8',
      },
      readBuffStackCount_10: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: { kind: 'id', buffIds: ['buff_cc_chr_combo_lock_stack'] },
          },
        },
        next: 'modifyActionValue_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'readBuffStackCount_10',
      },
      invertNextResult_12: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'invertNextResult_12',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'context', key: 'team' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_cc_chr_combo_lock_instance'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_combo_2_skill'] },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_lock: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10, max_stack: 2, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_13' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_lock$actionGraph,
};

const commonBuff_buff_cc_chr_combo_lock_instance$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_lock_instance: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    icon: 'endaxis:contingency_contract/2/lockdown',
    showInSquadIcon: true,
    nameKey: 'contingencyContract.buffs.comboLock',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_combo_lock_instance$actionGraph,
};

const commonBuff_buff_cc_chr_combo_lock_stack$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_lock_stack: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_combo_lock_stack$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_cost_atb$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_combo_skill_cost_atb_effect',
                copiedBlackboardAssignments: { atb: 'atb' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      changeOriginSkillToEventContextSkill_3: {
        action: { kind: 'changeOriginSkillToEventContextSkill', parameters: {} },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'changeOriginSkillToEventContextSkill_3',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_combo_skill_cost_atb_effect'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'finishBuffsById_5',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'finishBuffsById_5',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_10',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_cc_chr_combo_skill_reset_cd_extra_state'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_cc_chr_combo_skill_reset_cd_extra_state'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'less',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_cc_chr_combo_skill_reset_cd_extra_state'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_combo_2_skill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_cost_atb: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 25, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_11' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_cost_atb$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_cost_atb_effect$actionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishCurrentBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_cc_chr_combo_skill_reset_cd_extra_state'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_cost_atb_effect: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 25 },
  attributeModifiers: [
    { attribute: 'ComboSkillAtbCostAddition', slot: 'addition', value: { blackboardKey: 'atb' } },
  ],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_cost_atb_effect$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_dmg_up$actionGraph = {
  main: {
    nodes: {
      anyCondition_3: {
        action: {
          kind: 'anyCondition',
          parameters: {},
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_1' },
            { kind: 'conditionNode', nodeId: 'data_2' },
          ],
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'currentSkillTypeIn',
          target: { kind: 'owner' },
          skillTypes: ['comboSkill'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_dmg_up: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_add: 1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'anyCondition_3' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'product',
          addition: { blackboardKey: 'dmg_add' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_dmg_up$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_reset_cd$actionGraph = {
  main: {
    nodes: {
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_combo_skill_reset_cd_delay_trigger' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_combo_skill_reset_cd_extra_state' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_4',
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_combo_skill_reset_cd_extra_state'],
            reason: 'other',
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'finishBuffsById_2',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'modifyActionValue_7',
      },
      invertNextResult_9: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'invertNextResult_9',
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_combo_skill_reset_cd_delay_trigger',
                blackboardAssignments: { delay: { kind: 'constant', value: 0.06666 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_combo_skill_reset_cd_extra_state',
                blackboardAssignments: { mark: { kind: 'constant', value: 1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_15',
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'modifyActionValue_16' },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'ifElse_17',
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_18',
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'applyBuff_15' },
        },
        next: null,
      },
      modifyActionValue_26: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_25',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'modifyActionValue_26',
      },
      checkCondition_28: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_27',
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_combo_skill_reset_cd_extra_state' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_31: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_30',
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'modifyActionValue_31' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_4',
      },
      checkCondition_34: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'ifElse_33',
      },
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_combo_skill_reset_cd_extra_state',
                blackboardAssignments: { mark: { kind: 'constant', value: 1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: 'applyBuff_38' },
        },
        next: null,
      },
      modifyActionValue_40: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'extra_cast',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_39',
      },
      checkCondition_41: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'modifyActionValue_40',
      },
      checkCondition_42: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'checkCondition_41',
      },
      checkCondition_49: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_17' } },
        },
        next: 'modifyActionValue_40',
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'checkCondition_49',
      },
      checkCondition_51: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_19' } },
        },
        next: 'checkCondition_50',
      },
      checkCondition_58: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: 'modifyActionValue_40',
      },
      checkCondition_59: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_21' } },
        },
        next: 'checkCondition_58',
      },
      checkCondition_60: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_22' } },
        },
        next: 'checkCondition_59',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'extra_cast', fallback: 0 },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'max_cast', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: [
            'chr_0028_wulfa_combo_1_skill',
            'chr_0028_wulfa_combo_2_skill',
            'chr_0028_wulfa_combo_3_skill',
            'chr_0033_camille_combo_skill_2',
            'chr_0034_typhoea_combo_skill',
            'chr_0034_typhoea_combo_skillfloating',
          ],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_combo_3_skill'] },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillIdIn',
          skillIds: ['chr_0034_typhoea_combo_skillfloating', 'chr_0034_typhoea_combo_skill'],
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0033_camille_combo_skill_2'] },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'valueNode', nodeId: 'data_2' },
        },
      },
      data_15: {
        type: 'boolean',
        expression: { kind: 'eventBuffFinishReasonIn', reasons: ['lifetime'] },
      },
      data_16: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0028_wulfa_combo_usetimer'] },
      },
      data_17: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0028_wulfa_combo_usetimer'],
        },
      },
      data_18: {
        type: 'boolean',
        expression: { kind: 'eventBuffFinishReasonIn', reasons: ['other'] },
      },
      data_19: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0028_wulfa_combo_usecount'] },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0028_wulfa_combo_usecount'],
        },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0028_wulfa_combo_usetimer'],
        },
      },
      data_22: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0028_wulfa_combo_2_skill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_reset_cd: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { extra_cast: 0, max_cast: 2 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_10' } },
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_19' } },
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_28' } },
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_34' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_42' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_51' } },
    { event: 'skillEnd', priority: 0, sequence: { $sequence: 'checkCondition_60' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_reset_cd$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_reset_cd_delay_trigger$actionGraph = {
  main: {
    nodes: {
      openComboWindow_1: {
        action: {
          kind: 'openComboWindow',
          parameters: {
            nextSkillKeyFromSlot: 'comboSkill',
            owner: { kind: 'owner' },
            target: { kind: 'battleMainTarget' },
            trigger: { kind: 'battleMainTarget' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_reset_cd_delay_trigger: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'delay' },
  applyTags: [],
  extendTags: [],
  blackboard: { delay: 0.033333 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'openComboWindow_1' }] },
  actionGraph: commonBuff_buff_cc_chr_combo_skill_reset_cd_delay_trigger$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_reset_cd_extra_state$actionGraph = {
  main: {
    nodes: {
      adjustSkillCooldown_1: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: { kind: 'owner' },
            skill: { kind: 'type', skillType: 'comboSkill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'adjustSkillCooldown_1',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'adjustSkillCooldown_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'mark', fallback: 0 } },
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
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_reset_cd_extra_state: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0.03333,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { mark: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'checkCondition_2' }],
    trigger: [{ $sequence: 'checkCondition_4' }],
  },
  actionGraph: commonBuff_buff_cc_chr_combo_skill_reset_cd_extra_state$actionGraph,
};

const commonBuff_buff_cc_chr_disable_normal_skill$actionGraph = {
  main: {
    nodes: {
      disableNormalSkill_1: {
        action: { kind: 'disableNormalSkill', parameters: { normalOnly: true } },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_disable_normal_skill: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    icon: 'endaxis:contingency_contract/2/silence',
    showInSquadIcon: true,
    nameKey: 'contingencyContract.buffs.battleLock',
  },
  applyTags: ['Status/DisableNormalSkillExceptForAdditional'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'disableNormalSkill_1' }] },
  actionGraph: commonBuff_buff_cc_chr_disable_normal_skill$actionGraph,
};

const commonBuff_buff_cc_chr_disable_same_normal_skill$actionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stack', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'modifyActionValue_1',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_disable_normal_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'tar' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_disable_normal_skill'],
            reason: 'other',
          },
        },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'finishBuffsById_4' },
          whenFalse: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      forEachContextTarget_7: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'tar' } },
          body: { $sequence: 'checkCondition_2' },
        },
        next: 'ifElse_6',
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stack', operation: 'assign', value: { kind: 'constant', value: 0 } },
        },
        next: 'forEachContextTarget_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'modifyActionValue_8',
      },
      findTargets_10: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: true, owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: 'checkCondition_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'findTargets_10',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'inputTarget' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_cc_chr_disable_normal_skill'],
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'squad_cnt', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'tar' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
          outputKey: 'squad_cnt',
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillTypeIn',
          skillTypes: ['battleSkill'],
          normalSkillSubType: 'normal',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_disable_same_normal_skill: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { squad_cnt: 0, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_11' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_disable_same_normal_skill$actionGraph,
};

const commonBuff_buff_cc_chr_dmg_down_after_consume$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_dmg_down_after_consume_instance',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventConsumedBuffLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/NoGuard',
            'Skill/Character/Common/SpellInflict',
            'Skill/Character/Common/SpellStatus',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_dmg_down_after_consume: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.9, duration: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'buffConsumed', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'buffAbsorbed', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_dmg_down_after_consume$actionGraph,
};

const commonBuff_buff_cc_chr_dmg_down_after_consume_inflict$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_dmg_down_after_consume_inflict_delay',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventConsumedBuffLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard', 'Skill/Character/Common/SpellInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_dmg_down_after_consume_inflict: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.9, duration: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'buffConsumed', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_dmg_down_after_consume_inflict$actionGraph,
};

const commonBuff_buff_cc_chr_dmg_down_after_consume_inflict_delay$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_dmg_down_after_consume_instance',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_dmg_down_after_consume_inflict_delay: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.9, duration: 10 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_chr_dmg_down_after_consume_inflict_delay$actionGraph,
};

const commonBuff_buff_cc_chr_dmg_down_after_consume_instance$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_dmg_down_after_consume_instance: SkillBuffDefinition = {
  stackingType: 'overwriteDuration',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.9, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_chr_dmg_down_after_consume_instance$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_weak$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_no_lastcombo_weak_countdown',
                copiedBlackboardAssignments: {
                  weak_rate: 'weak_rate',
                  countdown: 'countdown',
                  max_stack: 'max_stack',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setBuffRemainingDuration_2: {
        action: {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: { kind: 'inputTarget' },
            query: { kind: 'id', buffIds: ['buff_cc_chr_no_lastcombo_weak_countdown'] },
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'characterTeam', excludeOwner: false } },
          body: { $sequence: 'setBuffRemainingDuration_2' },
        },
        next: null,
      },
      setBuffRemainingDuration_4: {
        action: {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: { kind: 'characterTeam', excludeOwner: false },
            query: { kind: 'id', buffIds: ['buff_cc_chr_no_lastcombo_weak_countdown'] },
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'forEachContextTarget_3',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_no_lastcombo_weak_stack'],
            reason: 'other',
          },
        },
        next: 'setBuffRemainingDuration_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'finishBuffsById_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_6',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'countdown' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo', 'powerAttack'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_no_lastcombo_weak: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { countdown: 8, max_stack: 3, weak_rate: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_weak$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_weak_countdown$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_no_lastcombo_weak_stack',
                copiedBlackboardAssignments: { weak_rate: 'weak_rate', max_stack: 'max_stack' },
              },
            ],
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_no_lastcombo_weak_countdown',
                copiedBlackboardAssignments: {
                  countdown: 'countdown',
                  weak_rate: 'weak_rate',
                  max_stack: 'max_stack',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_no_lastcombo_weak_countdown: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'countdown' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_chr_no_lastcombo_weak',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    visible: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { countdown: 8, max_stack: 3, weak_rate: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'applyBuff_3' }] },
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_weak_countdown$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_weak_stack$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_vfx_eny_atk_down' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_common_vfx_eny_atk_down'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_no_lastcombo_weak_stack: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_weak',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { max_stack: 3, weak_rate: 0.2 },
  attributeModifiers: [
    {
      attribute: 'weaknessDamageMultiplier',
      slot: 'finalMultiplier',
      value: { blackboardKey: 'weak_rate' },
    },
  ],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_weak_stack$actionGraph,
};

const commonBuff_buff_cc_chr_normal_attack_dmg_down$actionGraph = {
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
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttack'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_normal_attack_dmg_down: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.6 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_chr_normal_attack_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_normal_skill_dmg_down$actionGraph = {
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
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_normal_skill_dmg_down: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.9 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_chr_normal_skill_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_set_skill_atb_recover_ratio$actionGraph = {
  main: {
    nodes: {
      changeResource_1: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'owner' },
            targets: { kind: 'mainCharacter' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atb_value',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'changeResource_1',
      },
      storeEventSpGainAmount_3: {
        action: { kind: 'storeEventSpGainAmount', parameters: { outputKey: 'atb_value' } },
        next: 'calculateActionValue_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'storeEventSpGainAmount_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_value' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'skill_ratio' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_set_skill_atb_recover_ratio: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb_value: 0, skill_ratio: 0.5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'skillSpGained', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_set_skill_atb_recover_ratio$actionGraph,
};

const commonBuff_buff_cc_chr_ult_skill_usp_clear$actionGraph = {
  main: {
    nodes: {
      restrictUltimateEnergyRecovery_1: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: { kind: 'inputTarget' },
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'restrictUltimateEnergyRecovery_1',
      },
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'team' } },
          body: { $sequence: 'checkCondition_2' },
        },
        next: null,
      },
      findTargets_4: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: true, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'forEachContextTarget_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'findTargets_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'inputTarget' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_cc_chr_ult_skill_usp_clear'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['ultimate'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_skill_usp_clear: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_ult_skill_usp_clear$actionGraph,
};

const commonBuff_buff_cc_enemy_common_hp_up_mult$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_common_hp_up_mult: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_up: 0.5 },
  attributeModifiers: [
    { attribute: 'MaxHp', slot: 'multiplier', value: { blackboardKey: 'hp_up' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_common_hp_up_mult$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_cryst$actionGraph = {
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
      data_1: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_cryst: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  presentation: { icon: 'endaxis:icons/icon_battle_cryst_dmg_down', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_cryst$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_fire$actionGraph = {
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
      data_1: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_fire: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  presentation: { icon: 'endaxis:icons/icon_battle_fire_dmg_down', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_fire$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_natural$actionGraph = {
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
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['nature'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_natural: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  presentation: { icon: 'endaxis:icons/icon_battle_natural_dmg_down', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_natural$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_phy$actionGraph = {
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
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_phy: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  presentation: { icon: 'endaxis:icons/icon_battle_physical_dmg_down', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_phy$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_pulse$actionGraph = {
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
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['electric'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_pulse: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 4,
  presentation: { icon: 'endaxis:icons/icon_battle_pulse_dmg_down', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_scale' },
        },
      ],
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_pulse$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'applyBuff_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'applyBuff_9',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
        },
      },
      data_5: {
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

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener: SkillBuffDefinition =
  {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: { dmg_scale: -0.1 },
    attributeModifiers: [],
    abilityEventResponses: [
      { event: 'buffEnhanceChanged', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
      { event: 'buffEnhanceChanged', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
      { event: 'buffEnhanceChanged', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
      { event: 'buffEnhanceChanged', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
      { event: 'buffEnhanceChanged', priority: 0, sequence: { $sequence: 'checkCondition_10' } },
    ],
    actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener$actionGraph,
  };

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_cryst',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_dmg_down_cryst'],
            reason: 'other',
          },
        },
        next: 'checkCondition_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'readBuffStackCount_4' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_fire',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_dmg_down_fire'],
            reason: 'other',
          },
        },
        next: 'checkCondition_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'readBuffStackCount_4' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_natural',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_dmg_down_natural'],
            reason: 'other',
          },
        },
        next: 'checkCondition_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'readBuffStackCount_4' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_phy',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_dmg_down_phy'],
            reason: 'other',
          },
        },
        next: 'checkCondition_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'readBuffStackCount_4' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_dmg_down_pulse',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_dmg_down_pulse'],
            reason: 'other',
          },
        },
        next: 'checkCondition_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'finishBuffsById_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'readBuffStackCount_4' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse$actionGraph,
};

const commonBuff_buff_cc_eny_control_immune_abnormal$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_control_immune_abnormal: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Immune/Frozen', 'Immune/Airborne', 'Immune/KnockDown', 'Immune/Static'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_eny_control_immune_abnormal$actionGraph,
};

const commonBuff_buff_cc_eny_damage_resist$actionGraph = {
  main: {
    nodes: {
      overrideRawAttributes_1: {
        action: {
          kind: 'overrideRawAttributes',
          parameters: {
            targets: { kind: 'owner' },
            attributes: [
              { attribute: 'PhysicalResistance', value: { kind: 'valueNode', nodeId: 'data_1' } },
              { attribute: 'FireResistance', value: { kind: 'valueNode', nodeId: 'data_1' } },
              { attribute: 'CrystResistance', value: { kind: 'valueNode', nodeId: 'data_1' } },
              { attribute: 'PulseResistance', value: { kind: 'valueNode', nodeId: 'data_1' } },
              { attribute: 'NaturalResistance', value: { kind: 'valueNode', nodeId: 'data_1' } },
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'resist' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_damage_resist: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { resist: 20 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'overrideRawAttributes_1' }] },
  actionGraph: commonBuff_buff_cc_eny_damage_resist$actionGraph,
};

const commonBuff_buff_cc_eny_half_hp_clear_inflict_and_abnormal$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_half_hp_clear_inflict_and_abnormal: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_eny_half_hp_clear_inflict_and_abnormal$actionGraph,
};

const commonBuff_buff_cc_eny_heal_no_inflict$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_eny_heal_no_inflict_countdown',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio', countdown: 'countdown' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_cc_eny_heal_no_inflict_countdown',
              'buff_cc_eny_heal_no_inflict_do_heal',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsById_2',
      },
      finishCurrentBuff_4: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_cc_eny_heal_no_inflict_countdown',
              'buff_cc_eny_heal_no_inflict_do_heal',
            ],
            reason: 'other',
          },
        },
        next: 'finishCurrentBuff_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'finishBuffsById_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_eny_heal_no_inflict_countdown',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard', 'Skill/Character/Common/SpellInflict'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_eny_0112_jzmonk_cc_wudi'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard', 'Skill/Character/Common/SpellInflict'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard', 'Skill/Character/Common/SpellInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_heal_no_inflict: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { countdown: 5, hp_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: commonBuff_buff_cc_eny_heal_no_inflict$actionGraph,
};

const commonBuff_buff_cc_eny_heal_no_inflict_countdown$actionGraph = {
  main: {
    nodes: {
      finishCurrentBuff_1: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'none' },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_eny_heal_no_inflict_do_heal',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishCurrentBuff_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_heal_no_inflict_countdown: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'countdown' },
  triggerIntervalSeconds: { blackboardKey: 'countdown' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  timeClock: 'global',
  presentation: {
    icon: 'endaxis:icons/icon_battle_heal_no_infliction_or_noguard',
    showInHeadBarCommon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { countdown: 5, hp_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: commonBuff_buff_cc_eny_heal_no_inflict_countdown$actionGraph,
};

const commonBuff_buff_cc_eny_heal_no_inflict_do_heal$actionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: { kind: 'owner' },
            healer: { kind: 'owner' },
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hp_ratio' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_heal_no_inflict_do_heal: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_continuous_healing',
    showInHeadBarCommon: true,
    nameKey: 'contingencyContract.buffs.heal',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'heal_1' }] },
  actionGraph: commonBuff_buff_cc_eny_heal_no_inflict_do_heal$actionGraph,
};

const commonBuff_buff_cc_eny_numshield_on_dead$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_eny_numshield_on_dead_delay',
                copiedBlackboardAssignments: { add_layers: 'add_layers' },
              },
            ],
            targets: {
              kind: 'exclude',
              targets: {
                kind: 'enemyByTags',
                scope: 'global',
                reverse: true,
                tagQueryType: 'hasAll',
                tags: [],
              },
              excludeTargets: { kind: 'owner' },
            },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_numshield_on_dead: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { add_layers: 3 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'ownerDead', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: commonBuff_buff_cc_eny_numshield_on_dead$actionGraph,
};

const commonBuff_buff_cc_eny_numshield_on_dead_delay$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_eny_numshield_on_dead_inst',
                copiedBlackboardAssignments: { add_layers: 'add_layers' },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_numshield_on_dead_delay: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.05,
  applyTags: [],
  extendTags: [],
  blackboard: { add_layers: 3 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_eny_numshield_on_dead_delay$actionGraph,
};

const commonBuff_buff_cc_eny_numshield_on_dead_inst$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc02_eny_numshield' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      setCountShieldUi_2: {
        action: {
          kind: 'setCountShieldUi',
          parameters: {
            target: { kind: 'owner' },
            remove: false,
            maximum: { kind: 'valueNode', nodeId: 'data_1' },
            current: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_common_enemy_numshield_zero'],
            reason: 'other',
          },
        },
        next: 'setCountShieldUi_2',
      },
      setCountShieldUi_4: {
        action: {
          kind: 'setCountShieldUi',
          parameters: {
            target: { kind: 'owner' },
            remove: false,
            maximum: { kind: 'valueNode', nodeId: 'data_1' },
            current: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'shield_num_max',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0 },
          },
        },
        next: 'setCountShieldUi_4',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'shield_num',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'calculateActionValue_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_mini_poise_break_babyents' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'applyBuff_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_enemy_numshield_zero' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_8',
      },
      setCountShieldUi_10: {
        action: {
          kind: 'setCountShieldUi',
          parameters: {
            target: { kind: 'owner' },
            remove: true,
            maximum: { kind: 'constant', value: 1 },
            current: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_9',
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'shield_num_max',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishCurrentBuff_13: {
        action: {
          kind: 'finishCurrentBuff',
          parameters: { reason: 'other', finishSource: 'actionSource' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_enemy_numshield_zero' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishCurrentBuff_13',
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'applyBuff_14',
      },
      setCountShieldUi_16: {
        action: {
          kind: 'setCountShieldUi',
          parameters: {
            target: { kind: 'owner' },
            remove: false,
            maximum: { kind: 'valueNode', nodeId: 'data_1' },
            current: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'checkCondition_15',
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'calculateActionValue_12' },
          whenFalse: { $sequence: null },
        },
        next: 'setCountShieldUi_16',
      },
      calculateActionValue_18: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'shield_num',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'ifElse_17',
      },
      saveDamageSkillCastId_19: {
        action: { kind: 'saveDamageSkillCastId', parameters: {} },
        next: 'calculateActionValue_18',
      },
      checkCondition_20: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'saveDamageSkillCastId_19',
      },
      invertNextResult_21: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_20',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'invertNextResult_21',
      },
      checkCondition_34: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'invertNextResult_21',
      },
      checkCondition_35: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_34',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'shield_num_max' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'shield_num' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'add_layers' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_cc_eny_0128_babyents_born'],
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'shield_num', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_8: { type: 'boolean', expression: { kind: 'eventDamageSkillCastRecorded' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_numshield_on_dead_inst: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 0,
  applyTags: [],
  extendTags: [],
  blackboard: { add_layers: 3, shield_num: 3, shield_num_max: 3 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'finishBuffsById_3' }],
    enhanceChanged: [{ $sequence: 'calculateActionValue_6' }],
    finish: [{ $sequence: 'setCountShieldUi_10' }],
  },
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_22' } },
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_35' } },
  ],
  actionGraph: commonBuff_buff_cc_eny_numshield_on_dead_inst$actionGraph,
};

const commonBuff_buff_common_enemy_numshield_zero$actionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_common_eny_numshield'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      createSpatialPointTargets_10: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'pos',
            count: { kind: 'constant', value: 1 },
            origin: { kind: 'owner' },
          },
        },
        next: 'ifElse_9',
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_eny_0128_babyents_numshield',
              'buff_eny_0127_bigents_numshield',
              'buff_eny_0129_slwood_numshield',
              'buff_eny_0129_slwood_numshield_first',
              'buff_eny_0128_babyents_numshield_hdg032',
              'buff_eny_0127_bigents_numshield_hdg032',
              'buff_cc_eny_numshield_on_dead_inst',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      changeResource_15: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 20 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'owner' },
            targets: { kind: 'mainCharacter' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'finishBuffsById_14',
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_common_enemy_numshield_zero'],
            reason: 'other',
          },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'createSpatialPointTargets_10' },
          whenFalse: { $sequence: 'createSpatialPointTargets_10' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'finishBuffsById_17',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_5' } },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_enemy_numshield_zero: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 0,
  applyTags: [],
  extendTags: [],
  blackboard: { offset_x: 0, offset_y: 0 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'changeResource_15' } },
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'ifElse_opt2' } },
  ],
  actionGraph: commonBuff_buff_common_enemy_numshield_zero$actionGraph,
};

const commonBuff_buff_common_mini_poise_break_babyents$actionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -14.1428576,
                  outTangent: -14.1428576,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.07,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0.1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: [{ kind: 'owner' }, { kind: 'source' }],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_mini_poise_break_babyents: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 2.5,
  triggerIntervalSeconds: 0.033,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { poise_value: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'startTimeDilation_1' }] },
  actionGraph: commonBuff_buff_common_mini_poise_break_babyents$actionGraph,
};

const commonBuff_buff_common_obtain_ultimate_sp$actionGraph = {
  main: {
    nodes: {
      gainSquadUltimateEnergyFromSkillCost_1: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_obtain_ultimate_sp: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ratio: 1, usp_everyone: 6.5, usp_self: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'gainSquadUltimateEnergyFromSkillCost_1' }] },
  actionGraph: commonBuff_buff_common_obtain_ultimate_sp$actionGraph,
};

const commonBuff_buff_common_vfx_eny_atk_down$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_vfx_eny_atk_down: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 9999,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_common_vfx_eny_atk_down$actionGraph,
};
export const contingencyContractBuffDefinitions: OperatorBuffDefinitions = Object.freeze({
  buff_cc02_eny_numshield: commonBuff_buff_cc02_eny_numshield,
  buff_cc_chr_combo_lock: commonBuff_buff_cc_chr_combo_lock,
  buff_cc_chr_combo_lock_instance: commonBuff_buff_cc_chr_combo_lock_instance,
  buff_cc_chr_combo_lock_stack: commonBuff_buff_cc_chr_combo_lock_stack,
  buff_cc_chr_combo_skill_cost_atb: commonBuff_buff_cc_chr_combo_skill_cost_atb,
  buff_cc_chr_combo_skill_cost_atb_effect: commonBuff_buff_cc_chr_combo_skill_cost_atb_effect,
  buff_cc_chr_combo_skill_dmg_up: commonBuff_buff_cc_chr_combo_skill_dmg_up,
  buff_cc_chr_combo_skill_reset_cd: commonBuff_buff_cc_chr_combo_skill_reset_cd,
  buff_cc_chr_combo_skill_reset_cd_delay_trigger:
    commonBuff_buff_cc_chr_combo_skill_reset_cd_delay_trigger,
  buff_cc_chr_combo_skill_reset_cd_extra_state:
    commonBuff_buff_cc_chr_combo_skill_reset_cd_extra_state,
  buff_cc_chr_disable_normal_skill: commonBuff_buff_cc_chr_disable_normal_skill,
  buff_cc_chr_disable_same_normal_skill: commonBuff_buff_cc_chr_disable_same_normal_skill,
  buff_cc_chr_dmg_down_after_consume: commonBuff_buff_cc_chr_dmg_down_after_consume,
  buff_cc_chr_dmg_down_after_consume_inflict: commonBuff_buff_cc_chr_dmg_down_after_consume_inflict,
  buff_cc_chr_dmg_down_after_consume_inflict_delay:
    commonBuff_buff_cc_chr_dmg_down_after_consume_inflict_delay,
  buff_cc_chr_dmg_down_after_consume_instance:
    commonBuff_buff_cc_chr_dmg_down_after_consume_instance,
  buff_cc_chr_no_lastcombo_weak: commonBuff_buff_cc_chr_no_lastcombo_weak,
  buff_cc_chr_no_lastcombo_weak_countdown: commonBuff_buff_cc_chr_no_lastcombo_weak_countdown,
  buff_cc_chr_no_lastcombo_weak_stack: commonBuff_buff_cc_chr_no_lastcombo_weak_stack,
  buff_cc_chr_normal_attack_dmg_down: commonBuff_buff_cc_chr_normal_attack_dmg_down,
  buff_cc_chr_normal_skill_dmg_down: commonBuff_buff_cc_chr_normal_skill_dmg_down,
  buff_cc_chr_set_skill_atb_recover_ratio: commonBuff_buff_cc_chr_set_skill_atb_recover_ratio,
  buff_cc_chr_ult_skill_usp_clear: commonBuff_buff_cc_chr_ult_skill_usp_clear,
  buff_cc_enemy_common_hp_up_mult: commonBuff_buff_cc_enemy_common_hp_up_mult,
  buff_cc_enemy_inflict_stack_dmg_down: commonBuff_buff_cc_enemy_inflict_stack_dmg_down,
  buff_cc_enemy_inflict_stack_dmg_down_cryst: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_cryst,
  buff_cc_enemy_inflict_stack_dmg_down_fire: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_fire,
  buff_cc_enemy_inflict_stack_dmg_down_natural:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_natural,
  buff_cc_enemy_inflict_stack_dmg_down_phy: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_phy,
  buff_cc_enemy_inflict_stack_dmg_down_pulse: commonBuff_buff_cc_enemy_inflict_stack_dmg_down_pulse,
  buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_stack_changed_listener,
  buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_cryst,
  buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_fire,
  buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_natural,
  buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_phy,
  buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse:
    commonBuff_buff_cc_enemy_inflict_stack_dmg_down_sync_delay_pulse,
  buff_cc_eny_control_immune_abnormal: commonBuff_buff_cc_eny_control_immune_abnormal,
  buff_cc_eny_damage_resist: commonBuff_buff_cc_eny_damage_resist,
  buff_cc_eny_half_hp_clear_inflict_and_abnormal:
    commonBuff_buff_cc_eny_half_hp_clear_inflict_and_abnormal,
  buff_cc_eny_heal_no_inflict: commonBuff_buff_cc_eny_heal_no_inflict,
  buff_cc_eny_heal_no_inflict_countdown: commonBuff_buff_cc_eny_heal_no_inflict_countdown,
  buff_cc_eny_heal_no_inflict_do_heal: commonBuff_buff_cc_eny_heal_no_inflict_do_heal,
  buff_cc_eny_numshield_on_dead: commonBuff_buff_cc_eny_numshield_on_dead,
  buff_cc_eny_numshield_on_dead_delay: commonBuff_buff_cc_eny_numshield_on_dead_delay,
  buff_cc_eny_numshield_on_dead_inst: commonBuff_buff_cc_eny_numshield_on_dead_inst,
  buff_common_enemy_numshield_zero: commonBuff_buff_common_enemy_numshield_zero,
  buff_common_mini_poise_break_babyents: commonBuff_buff_common_mini_poise_break_babyents,
  buff_common_obtain_ultimate_sp: commonBuff_buff_common_obtain_ultimate_sp,
  buff_common_vfx_eny_atk_down: commonBuff_buff_common_vfx_eny_atk_down,
});

export const contingencyContractTagDefinitions = Object.freeze<
  readonly ContingencyContractTagDefinition[]
>([
  {
    tagId: 110001,
    columnId: '1',
    conflictId: 'c_cc002_c1',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_101',
    blackboard: {
      dmg_up: 0.3,
    },
  },
  {
    tagId: 110002,
    columnId: '1',
    conflictId: 'c_cc002_c1',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_102',
    blackboard: {
      dmg_up: 0.8,
    },
  },
  {
    tagId: 110101,
    columnId: '2',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_201',
    blackboard: {
      num: -3,
    },
  },
  {
    tagId: 110601,
    columnId: '3',
    conflictId: 'c_cc002_c4',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_301',
    blackboard: {
      dmg_scale: 0.5,
    },
  },
  {
    tagId: 110602,
    columnId: '3',
    conflictId: 'c_cc002_c4',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_302',
    blackboard: {
      dmg_scale: 1,
    },
  },
  {
    tagId: 113201,
    columnId: '4',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_401',
    blackboard: {},
  },
  {
    tagId: 110703,
    columnId: '4',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_403',
    blackboard: {},
  },
  {
    tagId: 110801,
    columnId: '5',
    conflictId: 'c_cc002_c5',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_501',
    blackboard: {
      dmg_scale: -0.3,
      duration: 10,
    },
  },
  {
    tagId: 110802,
    columnId: '5',
    conflictId: 'c_cc002_c5',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_502',
    blackboard: {
      duration: 10,
      dmg_scale: -0.8,
    },
  },
  {
    tagId: 111201,
    columnId: '6',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_602',
    blackboard: {},
  },
  {
    tagId: 112801,
    columnId: '7',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_601',
    blackboard: {},
  },
  {
    tagId: 111301,
    columnId: '8',
    conflictId: 'c_cc002_c8',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_3001',
    blackboard: {
      hp_down_ratio_melee: 0.2,
      hp_down_ratio: 0.2,
      countdown: 4,
      heal_scale: -0.4,
    },
  },
  {
    tagId: 111303,
    columnId: '8',
    conflictId: 'c_cc002_c8',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_603',
    blackboard: {
      hp_down_ratio: 0.5,
      hp_down_ratio_melee: 0.5,
      countdown: 6,
      heal_scale: -0.9,
    },
  },
  {
    tagId: 111001,
    columnId: '9',
    conflictId: 'c_cc002_c9',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_701',
    blackboard: {
      dash_count: 5,
      interval: 8,
      recover_count: 1,
    },
  },
  {
    tagId: 111003,
    columnId: '9',
    conflictId: 'c_cc002_c9',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_703',
    blackboard: {},
  },
  {
    tagId: 112701,
    columnId: '10',
    conflictId: 'c_cc002_hate',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_801',
    blackboard: {},
  },
  {
    tagId: 110403,
    columnId: '10',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_803',
    blackboard: {
      dmg_scale: -0.6,
      hp_up: 1.2,
    },
  },
  {
    tagId: 113801,
    columnId: '11',
    conflictId: 'c_cc002_time1',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1901',
    blackboard: {
      time: -45,
    },
  },
  {
    tagId: 113802,
    columnId: '11',
    conflictId: 'c_cc002_time1',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1902',
    blackboard: {
      time: -90,
    },
  },
  {
    tagId: 113803,
    columnId: '11',
    conflictId: 'c_cc002_time1',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1903',
    blackboard: {
      time: -180,
    },
  },
  {
    tagId: 110302,
    columnId: '12',
    conflictId: 'c_cc002_key1',
    score: 2,
    keyId: 'key1_v1d6',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_key1',
    blackboard: {
      skill_ratio: 1,
      recover_ratio: 0.3,
    },
  },
  {
    tagId: 113502,
    columnId: '13',
    conflictId: 'c_cc002_key1',
    score: 2,
    keyId: 'key1_v1d6',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_key3',
    blackboard: {
      duration: 10,
      max_stack: 2,
      dmg_add: 0.5,
    },
  },
  {
    tagId: 110502,
    columnId: '14',
    conflictId: 'c_cc002_key1',
    score: 2,
    keyId: 'key1_v1d6',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_key2',
    blackboard: {
      atb: 50,
    },
  },
  {
    tagId: 112901,
    columnId: '15',
    conflictId: 'c_cc002_c13',
    score: 1,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1002',
    blackboard: {
      resist: 25,
    },
  },
  {
    tagId: 112903,
    columnId: '15',
    conflictId: 'c_cc002_c13',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1003',
    blackboard: {
      resist: 60,
    },
  },
  {
    tagId: 110901,
    columnId: '16',
    conflictId: 'c_cc002_c14',
    score: 1,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1101',
    blackboard: {
      countdown: 5,
      hp_ratio: 0.03,
    },
  },
  {
    tagId: 110903,
    columnId: '16',
    conflictId: 'c_cc002_c14',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1103',
    blackboard: {
      countdown: 5,
      hp_ratio: 0.1,
    },
  },
  {
    tagId: 111602,
    columnId: '17',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1202',
    blackboard: {
      interrupt_times: 2,
    },
  },
  {
    tagId: 113603,
    columnId: '17',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1203',
    blackboard: {
      add_layers: 3,
    },
  },
  {
    tagId: 113302,
    columnId: '18',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1302',
    blackboard: {
      max_stack: 3,
      countdown: 10,
      weak_rate: 0.3,
    },
  },
  {
    tagId: 113402,
    columnId: '19',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1402',
    blackboard: {
      dmg_taken_down: -0.9,
    },
  },
  {
    tagId: 111703,
    columnId: '19',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1403',
    blackboard: {
      dmg_scale: -0.7,
      hp_up: 1.2,
    },
  },
  {
    tagId: 113701,
    columnId: '20',
    conflictId: 'c_cc002_c18',
    score: 1,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_2901',
    blackboard: {
      dmg_scale: -0.1,
    },
  },
  {
    tagId: 113702,
    columnId: '20',
    conflictId: 'c_cc002_c18',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_2902',
    blackboard: {
      dmg_scale: -0.2,
    },
  },
  {
    tagId: 112302,
    columnId: '21',
    conflictId: 'c_cc002_c19',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1602',
    blackboard: {},
  },
  {
    tagId: 112303,
    columnId: '21',
    conflictId: 'c_cc002_c19',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1603',
    blackboard: {},
  },
  {
    tagId: 112402,
    columnId: '22',
    conflictId: 'c_cc002_c20',
    score: 2,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1702',
    blackboard: {},
  },
  {
    tagId: 112403,
    columnId: '22',
    conflictId: 'c_cc002_c20',
    score: 3,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_1703',
    blackboard: {},
  },
  {
    tagId: 112501,
    columnId: '23',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: ['key1_v1d6'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/2/icon_activity_contract_1_tag_2201',
    blackboard: {},
  },
]);
export const contingencyContractInitializationPlans = Object.freeze<
  readonly {
    readonly tagId: number;
    readonly sequence: ActionGraphReference;
    readonly actionGraph: ActionGraphResourceDefinition;
  }[]
>([
  {
    tagId: 110302,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'endaxis_contract_110302_sp_recovery',
                source: 'battle',
                blackboardAssignments: {
                  recover_ratio: { kind: 'constant', value: 0.3 },
                  skill_ratio: { kind: 'constant', value: 1 },
                },
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { recover_ratio: 0.3, skill_ratio: 1 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_disable_same_normal_skill',
                      blackboardAssignments: {
                        skill_ratio: { kind: 'valueNode', nodeId: 'skill_ratio' },
                        recover_ratio: { kind: 'valueNode', nodeId: 'recover_ratio' },
                      },
                    },
                    {
                      buffId: 'buff_cc_chr_set_skill_atb_recover_ratio',
                      blackboardAssignments: {
                        skill_ratio: { kind: 'valueNode', nodeId: 'skill_ratio' },
                        recover_ratio: { kind: 'valueNode', nodeId: 'recover_ratio' },
                      },
                    },
                  ],
                  sharedSpModifiers: [
                    {
                      attribute: 'spRecovery',
                      operation: 'multiplier',
                      value: { kind: 'valueNode', nodeId: 'recover_ratio' },
                      applyToReturnSpGain: true,
                    },
                  ],
                },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          recover_ratio: {
            type: 'number',
            expression: { kind: 'blackboard', key: 'recover_ratio' },
          },
          skill_ratio: { type: 'number', expression: { kind: 'blackboard', key: 'skill_ratio' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110403,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_hp_up_mult',
                    blackboardAssignments: { hp_up: { kind: 'constant', value: 1.2 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_normal_skill_dmg_down',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.6 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110502,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_combo_skill_reset_cd',
                    blackboardAssignments: {},
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_combo_skill_cost_atb',
                    blackboardAssignments: { atb: { kind: 'constant', value: 50 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110703,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_ult_skill_usp_clear',
                    blackboardAssignments: {},
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110801,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_dmg_down_after_consume_inflict',
                    blackboardAssignments: {
                      dmg_scale: { kind: 'constant', value: -0.3 },
                      duration: { kind: 'constant', value: 10 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_dmg_down_after_consume',
                    blackboardAssignments: {
                      dmg_scale: { kind: 'constant', value: -0.3 },
                      duration: { kind: 'constant', value: 10 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110802,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_dmg_down_after_consume_inflict',
                    blackboardAssignments: {
                      duration: { kind: 'constant', value: 10 },
                      dmg_scale: { kind: 'constant', value: -0.8 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_dmg_down_after_consume',
                    blackboardAssignments: {
                      duration: { kind: 'constant', value: 10 },
                      dmg_scale: { kind: 'constant', value: -0.8 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110901,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_heal_no_inflict',
                    blackboardAssignments: {
                      countdown: { kind: 'constant', value: 5 },
                      hp_ratio: { kind: 'constant', value: 0.03 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 110903,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_heal_no_inflict',
                    blackboardAssignments: {
                      countdown: { kind: 'constant', value: 5 },
                      hp_ratio: { kind: 'constant', value: 0.1 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 111703,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_hp_up_mult',
                    blackboardAssignments: { hp_up: { kind: 'constant', value: 1.2 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_normal_attack_dmg_down',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.7 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 112403,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_half_hp_clear_inflict_and_abnormal',
                    blackboardAssignments: {},
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 112901,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_damage_resist',
                    blackboardAssignments: { resist: { kind: 'constant', value: 25 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 112903,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_damage_resist',
                    blackboardAssignments: { resist: { kind: 'constant', value: 60 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113201,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_control_immune_abnormal',
                    blackboardAssignments: {},
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113302,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_no_lastcombo_weak',
                    blackboardAssignments: {
                      max_stack: { kind: 'constant', value: 3 },
                      countdown: { kind: 'constant', value: 10 },
                      weak_rate: { kind: 'constant', value: 0.3 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113502,
    sequence: { $sequence: 'applyBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_combo_skill_dmg_up',
                    blackboardAssignments: { dmg_add: { kind: 'constant', value: 0.5 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
          applyBuff_2: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'characterTeam', excludeOwner: false },
                buffs: [
                  {
                    buffId: 'buff_cc_chr_combo_lock',
                    blackboardAssignments: {
                      duration: { kind: 'constant', value: 10 },
                      max_stack: { kind: 'constant', value: 2 },
                    },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: 'applyBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113603,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_eny_numshield_on_dead',
                    blackboardAssignments: { add_layers: { kind: 'constant', value: 3 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113701,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_inflict_stack_dmg_down',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.1 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 113702,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                targets: {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_inflict_stack_dmg_down',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.2 } },
                    stringBlackboardAssignments: {},
                  },
                ],
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
]);
export const contingencyContractBlockedTagReasons = Object.freeze({}) as Readonly<
  Record<number, string>
>;
export const contingencyContractOmittedTagReasons = Object.freeze({
  '110001': '仅修改敌人输出',
  '110002': '仅修改敌人输出',
  '110101': '波次治疗拾取物不进入模拟',
  '110601': '依赖敌人对干员造成伤害',
  '110602': '依赖敌人对干员造成伤害',
  '111001': '闪避与体力不进入模拟',
  '111003': '闪避与体力不进入模拟',
  '111201': '主控切换由时间轴输入',
  '111301': '依赖敌人对干员造成伤害',
  '111303': '依赖敌人对干员造成伤害',
  '111602': '依赖敌人主动技能或攻击目标选择',
  '112302': '依赖敌人主动技能或攻击目标选择',
  '112303': '依赖敌人主动技能与关卡刷怪，不进入被动敌人模拟',
  '112402': '依赖敌人主动技能或攻击目标选择',
  '112501': '可避免的地面区域不进入模拟',
  '112701': '依赖敌人主动技能或攻击目标选择',
  '112801': '可避免的地面区域不进入模拟',
  '113402': '按对玩家最有利的站位，主控处于光环内，不触发光环外减伤',
  '113801': '关卡挑战倒计时不参与伤害模拟',
  '113802': '关卡挑战倒计时不参与伤害模拟',
  '113803': '关卡挑战倒计时不参与伤害模拟',
}) as Readonly<Record<number, string>>;
export const contingencyContractDefinitionRevision = 'indie_contract002';
