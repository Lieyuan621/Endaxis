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
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill', 'normalAttackLastCombo'],
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
  blackboard: {},
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

const commonBuff_buff_cc_chr_atb_recoverspeed_down_icon$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_atb_recoverspeed_down_icon: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_atb_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_atb_recoverspeed_down_icon$actionGraph,
};

const commonBuff_buff_cc_chr_combo_cd_up$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_cd_up: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 5 },
  attributeModifiers: [
    {
      attribute: 'ComboSkillCooldownFinalAddition',
      slot: 'finalAddition',
      value: { blackboardKey: 'cd' },
    },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_cd_up$actionGraph,
};

const commonBuff_buff_cc_chr_combo_cost_atb$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_cost_atb: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 10 },
  attributeModifiers: [
    { attribute: 'NormalSkillCooldownAddition', slot: 'addition', value: { blackboardKey: 'cd' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_cost_atb$actionGraph,
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
            target: 'buffOwner',
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
    nameKey: 'contingencyContract.preview.comboLock',
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

const commonBuff_buff_cc_chr_combo_skill_cryst_inflict$actionGraph = {
  main: {
    nodes: {
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_combo_skill_cryst_inflict_stack' }],
            targets: { kind: 'mainCharacter' },
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
            targets: { kind: 'mainCharacter' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyCharacterInfliction_3: {
        action: {
          kind: 'applyCharacterInfliction',
          parameters: {
            element: 'cryo',
            source: { kind: 'owner' },
            target: { kind: 'mainCharacter' },
            count: { kind: 'constant', value: 1 },
            directToTriggered: false,
            ignoreWeakImmune: true,
            ignoreAddingCooldown: false,
          },
        },
        next: 'finishBuffsById_2',
      },
      createTimedMarker_4: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'applyCharacterInfliction_3',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'createTimedMarker_4' },
          whenFalse: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'ifElse_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'calculateActionValue_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'd_times' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'mainCharacter' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_2' },
          buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'times' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_cryst_inflict: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 3, d_times: 0, times: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_cryst_inflict$actionGraph,
};

const commonBuff_buff_cc_chr_combo_skill_cryst_inflict_stack$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_combo_skill_cryst_inflict_stack: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_combo_skill_cryst_inflict_stack$actionGraph,
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

const commonBuff_buff_cc_chr_combo_special_cc0$actionGraph = {
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

const commonBuff_buff_cc_chr_combo_special_cc0: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd_scale: 0.4, dmg_scale: -0.6 },
  attributeModifiers: [
    {
      attribute: 'ComboSkillCooldownScalar',
      slot: 'finalMultiplier',
      value: { blackboardKey: 'cd_scale' },
    },
  ],
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
  actionGraph: commonBuff_buff_cc_chr_combo_special_cc0$actionGraph,
};

const commonBuff_buff_cc_chr_cryst_dmg_down$actionGraph = {
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

const commonBuff_buff_cc_chr_cryst_dmg_down: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_cryst_dmg_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
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
  actionGraph: commonBuff_buff_cc_chr_cryst_dmg_down$actionGraph,
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
    nameKey: 'contingencyContract.preview.battleLock',
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

const commonBuff_buff_cc_chr_dmg_down_after_inflict$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_phy_dmg_down',
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_fire_dmg_down',
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
                buffId: 'buff_cc_chr_pulse_dmg_down',
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
                buffId: 'buff_cc_chr_cryst_dmg_down',
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
                buffId: 'buff_cc_chr_natural_dmg_down',
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
          buffTags: ['Skill/Character/Common/NoGuard'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_dmg_down_after_inflict: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_10' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_dmg_down_after_inflict$actionGraph,
};

const commonBuff_buff_cc_chr_fire_dmg_down$actionGraph = {
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

const commonBuff_buff_cc_chr_fire_dmg_down: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_fire_dmg_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
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
  actionGraph: commonBuff_buff_cc_chr_fire_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_fire_skill_clear_frozenonchar$actionGraph = {
  main: {
    nodes: {
      finishBuffsByTag_1: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsByTag_1',
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
          kind: 'eventSkillTypeIn',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'skillDamageTypeIn', damageTypes: ['heat'] } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_fire_skill_clear_frozenonchar: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_fire_skill_clear_frozenonchar$actionGraph,
};

const commonBuff_buff_cc_chr_frozenonchar_extend$actionGraph = {
  main: {
    nodes: {
      setBuffRemainingDuration_1: {
        action: {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
            },
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'setBuffRemainingDuration_1',
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_frozenonchar_extend: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_frozenonchar_extend$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_heal_reflect_to_eny_heal',
                copiedBlackboardAssignments: {
                  chr_heal_ratio: 'chr_heal_ratio',
                  eny_heal_ratio: 'eny_heal_ratio',
                },
              },
              {
                buffId: 'buff_cc_chr_heal_reflect_to_eny_shield',
                copiedBlackboardAssignments: {
                  chr_heal_ratio: 'chr_shield_ratio',
                  eny_heal_ratio: 'eny_heal_ratio',
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { chr_heal_ratio: 0.1, chr_shield_ratio: 0.2, eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny_heal$actionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal',
            operation: 'multiply',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'modifyActionValue_1',
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_heal'],
            reason: 'other',
          },
        },
        next: 'calculateActionValue_3',
      },
      readBuffStackCount_5: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'heal_times',
            query: { kind: 'id', buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_heal'] },
          },
        },
        next: 'finishBuffsById_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readBuffStackCount_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_6',
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'can_heal',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
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
                buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal',
                copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'add',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'applyBuff_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'modifyActionValue_10',
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'checkCondition_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'calculateActionValue_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal',
            operation: 'divide',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'modifyActionValue_13',
      },
      storeSourceAttributeValue_15: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'owner' },
            attribute: { kind: 'specific', key: 'maxHealth' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'max_hp',
          },
        },
        next: 'modifyActionValue_14',
      },
      storeEventHealValues_16: {
        action: { kind: 'storeEventHealValues', parameters: { realHealOutputKey: 'heal' } },
        next: 'storeSourceAttributeValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'can_heal',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'storeEventHealValues_16',
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'modifyActionValue_17',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'chr_heal_ratio' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_times' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'can_heal', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'heal_times', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greater',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'heal_ratio_total' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'max_hp' } },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny_heal: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    can_heal: 0,
    chr_heal_ratio: 0.1,
    eny_heal_ratio: 0.05,
    heal: 0,
    heal_ratio_total: 0,
    heal_times: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'checkCondition_18' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny_heal$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny_shield$actionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal',
            operation: 'multiply',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'modifyActionValue_1',
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_shield'],
            reason: 'other',
          },
        },
        next: 'calculateActionValue_3',
      },
      readBuffStackCount_5: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'heal_times',
            query: { kind: 'id', buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_shield'] },
          },
        },
        next: 'finishBuffsById_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readBuffStackCount_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_6',
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'can_heal',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
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
                buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_shield',
                copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'add',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'applyBuff_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'modifyActionValue_10',
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_9' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'checkCondition_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'calculateActionValue_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal',
            operation: 'divide',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'modifyActionValue_13',
      },
      storeSourceAttributeValue_15: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'owner' },
            attribute: { kind: 'specific', key: 'maxHealth' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'max_hp',
          },
        },
        next: 'modifyActionValue_14',
      },
      storeShieldValue_16: {
        action: {
          kind: 'storeShieldValue',
          parameters: { target: { kind: 'owner' }, value: 'gained', outputKey: 'heal' },
        },
        next: 'storeSourceAttributeValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'can_heal',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'storeShieldValue_16',
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'modifyActionValue_17',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'chr_heal_ratio' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_times' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'can_heal', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'heal_times', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greater',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'heal_ratio_total' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'max_hp' } },
      data_11: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny_shield: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    can_heal: 0,
    chr_heal_ratio: 0.2,
    eny_heal_ratio: 0.05,
    heal: 0,
    heal_ratio_total: 0,
    heal_times: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterAddedShield', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
    { event: 'afterAddedShield', priority: 0, sequence: { $sequence: 'checkCondition_18' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny_shield$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
                copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 99,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'mergeContextTargets_3' }] },
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal_do$actionGraph = {
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
            attributeSource: 'target',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'eny_heal_ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal_do: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'heal_1' }] },
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal_do$actionGraph,
};

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_shield$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
                copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'fixed', target: 'enemy' } },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_shield: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 99,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'mergeContextTargets_3' }] },
  actionGraph: commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_shield$actionGraph,
};

const commonBuff_buff_cc_chr_main_attribute_down$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_main_attribute_down: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { attr: 0.9 },
  attributeModifiers: [
    { attribute: { kind: 'main' }, slot: 'finalMultiplier', value: { blackboardKey: 'attr' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_main_attribute_down$actionGraph,
};

const commonBuff_buff_cc_chr_mute_evade$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_mute_evade: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Status/DisableDash'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_mute_evade$actionGraph,
};

const commonBuff_buff_cc_chr_natural_dmg_down$actionGraph = {
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

const commonBuff_buff_cc_chr_natural_dmg_down: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_natural_dmg_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
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
  actionGraph: commonBuff_buff_cc_chr_natural_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_natural_skill_clear_frozenonchar$actionGraph = {
  main: {
    nodes: {
      finishBuffsByTag_1: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsByTag_1',
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
          kind: 'eventSkillTypeIn',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'skillDamageTypeIn', damageTypes: ['nature'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_natural_skill_clear_frozenonchar: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_natural_skill_clear_frozenonchar$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
                copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
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
                buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
                copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
              },
            ],
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      finishGlobalBuffsById_3: {
        action: {
          kind: 'finishGlobalBuffsById',
          parameters: {
            globalBuffIds: ['global_buff_cc_chr_atb_recoverspeed_down'],
            reason: 'other',
          },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishGlobalBuffsById_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['powerAttack', 'normalAttackLastCombo'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'targetsEqual',
          first: { kind: 'owner' },
          second: { kind: 'mainCharacter' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, ratio: -1 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_countdown$actionGraph = {
  main: {
    nodes: {
      createGlobalBuff_1: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_atb_recoverspeed_down',
            definition: {
              stackingType: 'unlimited',
              blackboard: { ratio: -0.1 },
              sharedSpModifiers: [
                {
                  attribute: 'spRecovery',
                  operation: 'multiplier',
                  value: { kind: 'valueNode', nodeId: 'data_1' },
                  applyToReturnSpGain: true,
                },
              ],
              children: [
                { buffId: 'buff_cc_chr_atb_recoverspeed_down_icon', blackboardAssignments: {} },
              ],
            },
            source: 'battle',
            blackboardAssignments: { ratio: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'createGlobalBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_countdown: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_chr_no_lastcombo_stop_atb_recove',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, ratio: -1 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_countdown$actionGraph,
};

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_pre$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover',
                copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
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

const commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_pre: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, ratio: -1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'enterFight', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_pre$actionGraph,
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
          tags: ['powerAttack', 'normalAttackLastCombo'],
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

const commonBuff_buff_cc_chr_normal_skill_cd$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_normal_skill_cd: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 10 },
  attributeModifiers: [
    { attribute: 'NormalSkillCooldownAddition', slot: 'addition', value: { blackboardKey: 'cd' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_normal_skill_cd$actionGraph,
};

const commonBuff_buff_cc_chr_normal_skill_cryst_inflict$actionGraph = {
  main: {
    nodes: {
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_normal_skill_cryst_inflict_stack' }],
            targets: { kind: 'mainCharacter' },
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
            targets: { kind: 'mainCharacter' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
            reason: 'other',
          },
        },
        next: null,
      },
      createTimedMarker_3: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: 'finishBuffsById_2',
      },
      applyCharacterInfliction_4: {
        action: {
          kind: 'applyCharacterInfliction',
          parameters: {
            element: 'cryo',
            source: { kind: 'owner' },
            target: { kind: 'mainCharacter' },
            count: { kind: 'constant', value: 1 },
            directToTriggered: false,
            ignoreWeakImmune: true,
            ignoreAddingCooldown: false,
          },
        },
        next: 'createTimedMarker_3',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'applyCharacterInfliction_4' },
          whenFalse: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      calculateActionValue_7: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_times',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'ifElse_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'calculateActionValue_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'd_times' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'mainCharacter' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'valueNode', nodeId: 'data_2' },
          buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'times' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_normal_skill_cryst_inflict: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 3, d_times: 0, times: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_normal_skill_cryst_inflict$actionGraph,
};

const commonBuff_buff_cc_chr_normal_skill_cryst_inflict_stack$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_normal_skill_cryst_inflict_stack: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_normal_skill_cryst_inflict_stack$actionGraph,
};

const commonBuff_buff_cc_chr_phy_dmg_down$actionGraph = {
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

const commonBuff_buff_cc_chr_phy_dmg_down: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_physical_dmg_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
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
  actionGraph: commonBuff_buff_cc_chr_phy_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_phy_skill_clear_frozenonchar$actionGraph = {
  main: {
    nodes: {
      finishBuffsByTag_1: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsByTag_1',
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
          kind: 'eventSkillTypeIn',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'skillDamageTypeIn', damageTypes: ['physical'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_phy_skill_clear_frozenonchar: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_phy_skill_clear_frozenonchar$actionGraph,
};

const commonBuff_buff_cc_chr_physical_and_inflict_enhance_special_cc0$actionGraph = {
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
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'exceptAny',
          tags: ['normalAttack', 'normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_physical_and_inflict_enhance_special_cc0: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.6, dmg_up: 2 },
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
          addition: { blackboardKey: 'dmg_up' },
        },
      ],
    },
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_2' },
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
  actionGraph: commonBuff_buff_cc_chr_physical_and_inflict_enhance_special_cc0$actionGraph,
};

const commonBuff_buff_cc_chr_pulse_dmg_down$actionGraph = {
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

const commonBuff_buff_cc_chr_pulse_dmg_down: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_pulse_dmg_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
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
  actionGraph: commonBuff_buff_cc_chr_pulse_dmg_down$actionGraph,
};

const commonBuff_buff_cc_chr_pulse_skill_clear_frozenonchar$actionGraph = {
  main: {
    nodes: {
      finishBuffsByTag_1: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsByTag_1',
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
          kind: 'eventSkillTypeIn',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'skillDamageTypeIn', damageTypes: ['electric'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_pulse_skill_clear_frozenonchar: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_pulse_skill_clear_frozenonchar$actionGraph,
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
        expression: {
          kind: 'eventSpGainMatch',
          sources: ['skill', 'default'],
          gainKinds: ['gain'],
        },
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

const commonBuff_buff_cc_chr_ult_dmg_down_gradual$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_chr_ult_dmg_down_gradual_stack' }],
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'currentSkillTypeIn',
          target: { kind: 'owner' },
          skillTypes: ['ultimate'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_dmg_down_gradual: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_ult_dmg_down_gradual$actionGraph,
};

const commonBuff_buff_cc_chr_ult_dmg_down_gradual_instance$actionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'layer', operation: 'add', value: { kind: 'constant', value: -1 } },
        },
        next: 'calculateActionValue_1',
      },
      readBuffStackCount_3: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'layer',
            query: { kind: 'id', buffIds: ['buff_cc_chr_ult_dmg_down_gradual_stack'] },
          },
        },
        next: 'modifyActionValue_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'readBuffStackCount_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale_per_layer' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'layer' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['ultimateSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_dmg_down_gradual_instance: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: 0, dmg_scale_per_layer: -0.5, layer: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_4' },
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
  actionGraph: commonBuff_buff_cc_chr_ult_dmg_down_gradual_instance$actionGraph,
};

const commonBuff_buff_cc_chr_ult_dmg_down_gradual_stack$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_dmg_down_gradual_stack: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_chr_ult_dmg_down_gradual_stack$actionGraph,
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

const commonBuff_buff_cc_chr_ult_sp_cost_increase$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_chr_ult_sp_cost_increase_instance',
                copiedBlackboardAssignments: { usp_up: 'usp_up' },
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'currentSkillTypeIn',
          target: { kind: 'owner' },
          skillTypes: ['ultimate'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_sp_cost_increase: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { usp_up: 0.2 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_ult_sp_cost_increase$actionGraph,
};

const commonBuff_buff_cc_chr_ult_sp_cost_increase_instance$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_chr_ult_sp_cost_increase_instance: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 99,
  applyTags: [],
  extendTags: [],
  blackboard: { usp_up: 0.2 },
  attributeModifiers: [
    { attribute: 'MaxUltimateSp', slot: 'baseMultiplier', value: { blackboardKey: 'usp_up' } },
  ],
  actionGraph: commonBuff_buff_cc_chr_ult_sp_cost_increase_instance$actionGraph,
};

const commonBuff_buff_cc_enemy_common_hp_up$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_common_hp_up: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_up: 1.5 },
  attributeModifiers: [
    { attribute: 'MaxHp', slot: 'finalMultiplier', value: { blackboardKey: 'hp_up' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_common_hp_up$actionGraph,
};

const commonBuff_buff_cc_enemy_common_movespeedup$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_base',
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_common_movespeedup: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: 0.25 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_enemy_common_movespeedup$actionGraph,
};

const commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_base$actionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'one_minus_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: -1 },
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
                buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_ratio',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'checkCondition_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_ratio',
            operation: 'divide',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_5',
      },
      storeSourceAttributeValue_7: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'owner' },
            attribute: { kind: 'specific', key: 'maxHealth' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'max_hp',
          },
        },
        next: 'modifyActionValue_6',
      },
      storeEntityPropertyValue_8: {
        action: {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target: 'actionOwner',
            property: 'currentHealth',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'hp_ratio',
          },
        },
        next: 'storeSourceAttributeValue_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'hp_ratio', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'one_minus_dmg_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'max_hp' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_base: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: 0.25, hp_ratio: 0, max_hp: 0, one_minus_dmg_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'calculateActionValue_1' }] },
  abilityEventResponses: [
    {
      event: 'beforeTakeDamage',
      priority: 0,
      sequence: { $sequence: 'storeEntityPropertyValue_8' },
    },
  ],
  actionGraph: commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_base$actionGraph,
};

const commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_instance$actionGraph = {
  main: {
    nodes: {
      setHealthFloor_1: {
        action: {
          kind: 'setHealthFloor',
          parameters: {
            target: 'actionOwner',
            mode: 'maxHealthRatio',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
          afterSet: { $sequence: null },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
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
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'has_healed',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_ratio',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_heal_ratio',
            operation: 'divide',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_4',
      },
      storeSourceAttributeValue_6: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'owner' },
            attribute: { kind: 'specific', key: 'maxHealth' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'max_hp',
          },
        },
        next: 'modifyActionValue_5',
      },
      storeEventHealValues_7: {
        action: {
          kind: 'storeEventHealValues',
          parameters: { realHealOutputKey: 'hp_heal_ratio' },
        },
        next: 'storeSourceAttributeValue_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'storeEventHealValues_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hp_ratio' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'hp_heal_ratio' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'max_hp' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'has_healed', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_instance: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { has_healed: 0, hp_heal_ratio: 0, hp_ratio: 0.25, max_hp: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'setHealthFloor_1' }] },
  abilityEventResponses: [
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_instance$actionGraph,
};

const commonBuff_buff_cc_enemy_heal_under_control$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_cc_enemy_heal_under_control_stack' }],
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
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_5',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_2',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_12: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'finishBuffsById_12',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_13',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'finishBuffsById_12',
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'checkCondition_16',
      },
      checkCondition_20: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_13',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'finishBuffsById_12',
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_heal_under_control_instance',
                copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'applyBuff_23',
      },
      checkCondition_25: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
        },
        next: 'checkCondition_24',
      },
      finishBuffsById_26: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_heal_under_control_instance'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: 'finishBuffsById_26',
      },
      checkCondition_28: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'checkCondition_27',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'owner' },
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 20 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'owner' },
          operator: 'less',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/PhysicalStatus/AirborneStatus',
            'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
          ],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'owner' },
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 20 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        },
      },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'owner' },
          operator: 'less',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/PhysicalStatus/AirborneStatus',
            'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
          ],
        },
      },
      data_11: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_cc_enemy_heal_under_control_stack'],
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_cc_enemy_heal_under_control_stack'],
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_cc_enemy_heal_under_control_stack'],
        },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_cc_enemy_heal_under_control_stack'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_heal_under_control: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.05 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_11' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_14' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_17' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_20' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_22' } },
    { event: 'beforeAddedBuff', priority: 0, sequence: { $sequence: 'checkCondition_25' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_28' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_heal_under_control$actionGraph,
};

const commonBuff_buff_cc_enemy_heal_under_control_instance$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_heal_under_control_timer',
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
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_cc_enemy_heal_under_control_timer'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_heal_under_control_instance: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.01 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: commonBuff_buff_cc_enemy_heal_under_control_instance$actionGraph,
};

const commonBuff_buff_cc_enemy_heal_under_control_stack$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_heal_under_control_stack: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_heal_under_control_stack$actionGraph,
};

const commonBuff_buff_cc_enemy_heal_under_control_timer$actionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: { kind: 'owner' },
            healer: { kind: 'source' },
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_heal_under_control_timer'],
            reason: 'other',
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'heal_1' },
          whenFalse: { $sequence: 'finishBuffsById_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hp_ratio' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_cc_enemy_heal_under_control_instance'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_heal_under_control_timer: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.01 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'heal_1' }], trigger: [{ $sequence: 'ifElse_5' }] },
  actionGraph: commonBuff_buff_cc_enemy_heal_under_control_timer$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_add_listener',
                copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
              },
              { buffId: 'buff_cc_enemy_inflict_stack_resist_consume_listener' },
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

const commonBuff_buff_cc_enemy_inflict_stack_resist: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_add_listener$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_fire',
                copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
            buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
            reason: 'other',
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
            buffIds: ['buff_cc_enemy_inflict_stack_resist_fire'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_2',
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_3',
      },
      readBuffStackCount_5: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
        },
        next: 'calculateActionValue_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'readBuffStackCount_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_pulse',
                copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
            reason: 'other',
          },
        },
        next: 'applyBuff_7',
      },
      finishBuffsById_9: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_pulse'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_8',
      },
      calculateActionValue_10: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_9',
      },
      readBuffStackCount_11: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'calculateActionValue_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'readBuffStackCount_11',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_cryst',
                copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
            reason: 'other',
          },
        },
        next: 'applyBuff_13',
      },
      finishBuffsById_15: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_cryst'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_14',
      },
      calculateActionValue_16: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_15',
      },
      readBuffStackCount_17: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
        },
        next: 'calculateActionValue_16',
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readBuffStackCount_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_natural',
                copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_20: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
            reason: 'other',
          },
        },
        next: 'applyBuff_19',
      },
      finishBuffsById_21: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_natural'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_20',
      },
      calculateActionValue_22: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_21',
      },
      readBuffStackCount_23: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
        },
        next: 'calculateActionValue_22',
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'readBuffStackCount_23',
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_phy',
                copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsById_26: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
            reason: 'other',
          },
        },
        next: 'applyBuff_25',
      },
      finishBuffsById_27: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_phy'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_26',
      },
      calculateActionValue_28: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_dmg_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'finishBuffsById_27',
      },
      readBuffStackCount_29: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'stack',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
        },
        next: 'calculateActionValue_28',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'readBuffStackCount_29',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stack' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
        },
      },
      data_7: {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_add_listener: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { d_dmg_scale: 0, dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_12' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_18' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_24' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_30' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_add_listener$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_consume_delay$actionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_fire'],
            reason: 'other',
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
            buffIds: ['buff_cc_enemy_inflict_stack_resist_pulse'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_cryst'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_natural'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_enemy_inflict_stack_resist_phy'],
            reason: 'other',
          },
        },
        next: null,
      },
      switch_6: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'finishBuffsById_1' } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'finishBuffsById_2' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'finishBuffsById_3' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'finishBuffsById_4' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'finishBuffsById_5' } },
          ],
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'index' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_inflict_stack_resist_consume_delay: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { index: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'switch_6' }] },
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_consume_delay$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_consume_listener$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                blackboardAssignments: { index: { kind: 'constant', value: 0 } },
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
                buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                blackboardAssignments: { index: { kind: 'constant', value: 1 } },
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
                buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                blackboardAssignments: { index: { kind: 'constant', value: 2 } },
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
                buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                blackboardAssignments: { index: { kind: 'constant', value: 3 } },
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
                buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                blackboardAssignments: { index: { kind: 'constant', value: 4 } },
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_consume_listener: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_6' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_8' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_10' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_consume_listener$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_cryst$actionGraph = {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_cryst: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 4,
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
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_cryst$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_fire$actionGraph = {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_fire: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 4,
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
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_fire$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_natural$actionGraph = {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_natural: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 4,
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
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_natural$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_phy$actionGraph = {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_phy: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 4,
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
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_phy$actionGraph,
};

const commonBuff_buff_cc_enemy_inflict_stack_resist_pulse$actionGraph = {
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

const commonBuff_buff_cc_enemy_inflict_stack_resist_pulse: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 4,
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
  actionGraph: commonBuff_buff_cc_enemy_inflict_stack_resist_pulse$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist$actionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_periodic_inflict_resist_fire',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_periodic_inflict_resist_pulse',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_periodic_inflict_resist_cryst',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_periodic_inflict_resist_natural',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'applyBuff_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'applyBuff_6' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_9',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'applyBuff_4' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_10',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyBuff_2' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_11',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_cc_enemy_periodic_inflict_resist_phy',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'applyBuff_13',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['nature'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['electric'] },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['heat'] },
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

const commonBuff_buff_cc_enemy_periodic_inflict_resist: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterTakeInfliction', priority: 0, sequence: { $sequence: 'ifElse_12' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_14' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist_cryst$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_periodic_inflict_resist_cryst: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_eny_resist_inflict_cryst',
    showInHeadBarCommon: true,
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneCrystInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist_cryst$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist_fire$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_periodic_inflict_resist_fire: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_eny_resist_inflict_fire',
    showInHeadBarCommon: true,
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneFireInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist_fire$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist_natural$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_periodic_inflict_resist_natural: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_eny_resist_inflict_natural',
    showInHeadBarCommon: true,
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneNaturalInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist_natural$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist_phy$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_periodic_inflict_resist_phy: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_eny_resist_inflict_phy',
    showInHeadBarCommon: true,
  },
  applyTags: ['Immune/ImmuneNoGuard'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist_phy$actionGraph,
};

const commonBuff_buff_cc_enemy_periodic_inflict_resist_pulse$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_periodic_inflict_resist_pulse: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_eny_resist_inflict_pulse',
    showInHeadBarCommon: true,
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmunePulseInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_cc_enemy_periodic_inflict_resist_pulse$actionGraph,
};

const commonBuff_buff_cc_enemy_poise_up$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_enemy_poise_up: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { poise_up: 0.15 },
  attributeModifiers: [
    { attribute: 'MaxPoise', slot: 'baseMultiplier', value: { blackboardKey: 'poise_up' } },
  ],
  actionGraph: commonBuff_buff_cc_enemy_poise_up$actionGraph,
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
    nameKey: 'contingencyContract.preview.heal',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'heal_1' }] },
  actionGraph: commonBuff_buff_cc_eny_heal_no_inflict_do_heal$actionGraph,
};

const commonBuff_buff_cc_eny_numshield_instance$actionGraph = {
  main: {
    nodes: {
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'shield_num',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      readBuffBlackboard_3: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_eny_0128_babyents_numshield'] },
            desiredKey: 'shield_num_max',
            outputKey: 'shield_num_max',
          },
        },
        next: null,
      },
      readBuffBlackboard_4: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_eny_0128_babyents_numshield'] },
            desiredKey: 'shield_num',
            outputKey: 'shield_num',
          },
        },
        next: 'readBuffBlackboard_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'readBuffBlackboard_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_cc_eny_numshield_instance'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'finishBuffsById_6',
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'shield_num',
            operation: 'add',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'checkCondition_7',
      },
      saveDamageSkillCastId_9: {
        action: { kind: 'saveDamageSkillCastId', parameters: {} },
        next: 'modifyActionValue_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'saveDamageSkillCastId_9',
      },
      invertNextResult_11: {
        action: { kind: 'invertNextResult', parameters: {} },
        next: 'checkCondition_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'invertNextResult_11',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'shield_num_max' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_eny_0128_babyents_numshield'],
        },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'shield_num', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: { type: 'boolean', expression: { kind: 'eventDamageSkillCastRecorded' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_cc_eny_numshield_instance: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { shield_num: 0, shield_num_max: 1 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_13' },
      processors: [{ kind: 'damageScale', side: 'defender', zone: 'product', addition: -9999 }],
    },
  ],
  lifecycleSequences: {
    start: [{ $sequence: 'modifyActionValue_1' }],
    finish: [{ $sequence: 'ifElse_5' }],
  },
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_12' } },
  ],
  actionGraph: commonBuff_buff_cc_eny_numshield_instance$actionGraph,
};

const commonBuff_buff_common_enemy_spell_cryst_attached$actionGraph = {
  main: {
    nodes: {
      triggerCharacterInflictionEvent_6: {
        action: {
          kind: 'triggerCharacterInflictionEvent',
          parameters: { event: 'afterTakeSpellInfliction', element: 'cryo', eventSource: 'caster' },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_common_enemy_spell_cryst_attached'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_enemy_spell_cryst_triggered_frozen' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_2',
      },
      triggerCharacterInflictionEvent_4: {
        action: {
          kind: 'triggerCharacterInflictionEvent',
          parameters: { event: 'beforeTakeSpellAbnormal', element: 'cryo', eventSource: 'caster' },
        },
        next: 'applyBuff_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'triggerCharacterInflictionEvent_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 3 },
          buffIds: ['buff_common_enemy_spell_cryst_attached'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_enemy_spell_cryst_attached: SkillBuffDefinition = {
  stackingType: 'enhanceAndOverwriteDuration',
  priority: 0,
  maxStackCount: 4,
  addingCooldownSeconds: { blackboardKey: 'cd' },
  ignoreAddingCooldown: true,
  dispelLevel: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_energy_fusion_cryst',
    showInHeadBarAttached: true,
    showInSquadIcon: true,
    nameKey: 'effects.name.cryo_infliction',
  },
  applyTags: ['Skill/Enemy/Common/SpellInflictOnChar/CrystInflictOnChar'],
  extendTags: [],
  blackboard: { cd: 1, count: 0, duration: 10 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'triggerCharacterInflictionEvent_6' }],
    beforeEnhance: [{ $sequence: 'ifElse_5' }],
  },
  actionGraph: commonBuff_buff_common_enemy_spell_cryst_attached$actionGraph,
};

const commonBuff_buff_common_enemy_spell_cryst_triggered_frozen$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_enemy_spell_status_frozen' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      triggerCharacterInflictionEvent_2: {
        action: {
          kind: 'triggerCharacterInflictionEvent',
          parameters: { event: 'afterTakeSpellAbnormal', element: 'cryo', eventSource: 'caster' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_enemy_spell_cryst_triggered_frozen: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'cryst_triggered',
  priority: 0,
  maxStackCount: 1,
  dispelLevel: 0,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_frozen',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
    nameKey: 'effects.name.solidification',
  },
  applyTags: [
    'Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar',
    'Immune/SpellInflictOnChar/CrystInflictOnChar',
  ],
  extendTags: [],
  blackboard: { duration: 3.5 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'applyBuff_1' }, { $sequence: 'triggerCharacterInflictionEvent_2' }],
  },
  actionGraph: commonBuff_buff_common_enemy_spell_cryst_triggered_frozen$actionGraph,
};

const commonBuff_buff_common_enemy_spell_status_do_frozen$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_enemy_spell_status_do_frozen: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: false,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.solidification',
  },
  applyTags: ['Status/Immobilized/Frozen', 'Status/DisableFaceToAttacker'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff_buff_common_enemy_spell_status_do_frozen$actionGraph,
};

const commonBuff_buff_common_enemy_spell_status_frozen$actionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_enemy_spell_status_do_frozen',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_enemy_spell_status_frozen: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: false,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.solidification',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff_buff_common_enemy_spell_status_frozen$actionGraph,
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
  buff_cc_chr_atb_recoverspeed_down_icon: commonBuff_buff_cc_chr_atb_recoverspeed_down_icon,
  buff_cc_chr_combo_cd_up: commonBuff_buff_cc_chr_combo_cd_up,
  buff_cc_chr_combo_cost_atb: commonBuff_buff_cc_chr_combo_cost_atb,
  buff_cc_chr_combo_lock: commonBuff_buff_cc_chr_combo_lock,
  buff_cc_chr_combo_lock_instance: commonBuff_buff_cc_chr_combo_lock_instance,
  buff_cc_chr_combo_lock_stack: commonBuff_buff_cc_chr_combo_lock_stack,
  buff_cc_chr_combo_skill_cryst_inflict: commonBuff_buff_cc_chr_combo_skill_cryst_inflict,
  buff_cc_chr_combo_skill_cryst_inflict_stack:
    commonBuff_buff_cc_chr_combo_skill_cryst_inflict_stack,
  buff_cc_chr_combo_skill_dmg_up: commonBuff_buff_cc_chr_combo_skill_dmg_up,
  buff_cc_chr_combo_special_cc0: commonBuff_buff_cc_chr_combo_special_cc0,
  buff_cc_chr_cryst_dmg_down: commonBuff_buff_cc_chr_cryst_dmg_down,
  buff_cc_chr_disable_normal_skill: commonBuff_buff_cc_chr_disable_normal_skill,
  buff_cc_chr_disable_same_normal_skill: commonBuff_buff_cc_chr_disable_same_normal_skill,
  buff_cc_chr_dmg_down_after_consume: commonBuff_buff_cc_chr_dmg_down_after_consume,
  buff_cc_chr_dmg_down_after_consume_inflict: commonBuff_buff_cc_chr_dmg_down_after_consume_inflict,
  buff_cc_chr_dmg_down_after_consume_inflict_delay:
    commonBuff_buff_cc_chr_dmg_down_after_consume_inflict_delay,
  buff_cc_chr_dmg_down_after_consume_instance:
    commonBuff_buff_cc_chr_dmg_down_after_consume_instance,
  buff_cc_chr_dmg_down_after_inflict: commonBuff_buff_cc_chr_dmg_down_after_inflict,
  buff_cc_chr_fire_dmg_down: commonBuff_buff_cc_chr_fire_dmg_down,
  buff_cc_chr_fire_skill_clear_frozenonchar: commonBuff_buff_cc_chr_fire_skill_clear_frozenonchar,
  buff_cc_chr_frozenonchar_extend: commonBuff_buff_cc_chr_frozenonchar_extend,
  buff_cc_chr_heal_reflect_to_eny: commonBuff_buff_cc_chr_heal_reflect_to_eny,
  buff_cc_chr_heal_reflect_to_eny_heal: commonBuff_buff_cc_chr_heal_reflect_to_eny_heal,
  buff_cc_chr_heal_reflect_to_eny_shield: commonBuff_buff_cc_chr_heal_reflect_to_eny_shield,
  buff_cc_chr_heal_reflect_to_eny_stack_heal: commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal,
  buff_cc_chr_heal_reflect_to_eny_stack_heal_do:
    commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_heal_do,
  buff_cc_chr_heal_reflect_to_eny_stack_shield:
    commonBuff_buff_cc_chr_heal_reflect_to_eny_stack_shield,
  buff_cc_chr_main_attribute_down: commonBuff_buff_cc_chr_main_attribute_down,
  buff_cc_chr_mute_evade: commonBuff_buff_cc_chr_mute_evade,
  buff_cc_chr_natural_dmg_down: commonBuff_buff_cc_chr_natural_dmg_down,
  buff_cc_chr_natural_skill_clear_frozenonchar:
    commonBuff_buff_cc_chr_natural_skill_clear_frozenonchar,
  buff_cc_chr_no_lastcombo_stop_atb_recover: commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover,
  buff_cc_chr_no_lastcombo_stop_atb_recover_countdown:
    commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_countdown,
  buff_cc_chr_no_lastcombo_stop_atb_recover_pre:
    commonBuff_buff_cc_chr_no_lastcombo_stop_atb_recover_pre,
  buff_cc_chr_no_lastcombo_weak: commonBuff_buff_cc_chr_no_lastcombo_weak,
  buff_cc_chr_no_lastcombo_weak_countdown: commonBuff_buff_cc_chr_no_lastcombo_weak_countdown,
  buff_cc_chr_no_lastcombo_weak_stack: commonBuff_buff_cc_chr_no_lastcombo_weak_stack,
  buff_cc_chr_normal_attack_dmg_down: commonBuff_buff_cc_chr_normal_attack_dmg_down,
  buff_cc_chr_normal_skill_cd: commonBuff_buff_cc_chr_normal_skill_cd,
  buff_cc_chr_normal_skill_cryst_inflict: commonBuff_buff_cc_chr_normal_skill_cryst_inflict,
  buff_cc_chr_normal_skill_cryst_inflict_stack:
    commonBuff_buff_cc_chr_normal_skill_cryst_inflict_stack,
  buff_cc_chr_phy_dmg_down: commonBuff_buff_cc_chr_phy_dmg_down,
  buff_cc_chr_phy_skill_clear_frozenonchar: commonBuff_buff_cc_chr_phy_skill_clear_frozenonchar,
  buff_cc_chr_physical_and_inflict_enhance_special_cc0:
    commonBuff_buff_cc_chr_physical_and_inflict_enhance_special_cc0,
  buff_cc_chr_pulse_dmg_down: commonBuff_buff_cc_chr_pulse_dmg_down,
  buff_cc_chr_pulse_skill_clear_frozenonchar: commonBuff_buff_cc_chr_pulse_skill_clear_frozenonchar,
  buff_cc_chr_set_skill_atb_recover_ratio: commonBuff_buff_cc_chr_set_skill_atb_recover_ratio,
  buff_cc_chr_ult_dmg_down_gradual: commonBuff_buff_cc_chr_ult_dmg_down_gradual,
  buff_cc_chr_ult_dmg_down_gradual_instance: commonBuff_buff_cc_chr_ult_dmg_down_gradual_instance,
  buff_cc_chr_ult_dmg_down_gradual_stack: commonBuff_buff_cc_chr_ult_dmg_down_gradual_stack,
  buff_cc_chr_ult_skill_usp_clear: commonBuff_buff_cc_chr_ult_skill_usp_clear,
  buff_cc_chr_ult_sp_cost_increase: commonBuff_buff_cc_chr_ult_sp_cost_increase,
  buff_cc_chr_ult_sp_cost_increase_instance: commonBuff_buff_cc_chr_ult_sp_cost_increase_instance,
  buff_cc_enemy_common_hp_up: commonBuff_buff_cc_enemy_common_hp_up,
  buff_cc_enemy_common_movespeedup: commonBuff_buff_cc_enemy_common_movespeedup,
  buff_cc_enemy_common_movespeedup_dmg_limit_base:
    commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_base,
  buff_cc_enemy_common_movespeedup_dmg_limit_instance:
    commonBuff_buff_cc_enemy_common_movespeedup_dmg_limit_instance,
  buff_cc_enemy_heal_under_control: commonBuff_buff_cc_enemy_heal_under_control,
  buff_cc_enemy_heal_under_control_instance: commonBuff_buff_cc_enemy_heal_under_control_instance,
  buff_cc_enemy_heal_under_control_stack: commonBuff_buff_cc_enemy_heal_under_control_stack,
  buff_cc_enemy_heal_under_control_timer: commonBuff_buff_cc_enemy_heal_under_control_timer,
  buff_cc_enemy_inflict_stack_resist: commonBuff_buff_cc_enemy_inflict_stack_resist,
  buff_cc_enemy_inflict_stack_resist_add_listener:
    commonBuff_buff_cc_enemy_inflict_stack_resist_add_listener,
  buff_cc_enemy_inflict_stack_resist_consume_delay:
    commonBuff_buff_cc_enemy_inflict_stack_resist_consume_delay,
  buff_cc_enemy_inflict_stack_resist_consume_listener:
    commonBuff_buff_cc_enemy_inflict_stack_resist_consume_listener,
  buff_cc_enemy_inflict_stack_resist_cryst: commonBuff_buff_cc_enemy_inflict_stack_resist_cryst,
  buff_cc_enemy_inflict_stack_resist_fire: commonBuff_buff_cc_enemy_inflict_stack_resist_fire,
  buff_cc_enemy_inflict_stack_resist_natural: commonBuff_buff_cc_enemy_inflict_stack_resist_natural,
  buff_cc_enemy_inflict_stack_resist_phy: commonBuff_buff_cc_enemy_inflict_stack_resist_phy,
  buff_cc_enemy_inflict_stack_resist_pulse: commonBuff_buff_cc_enemy_inflict_stack_resist_pulse,
  buff_cc_enemy_periodic_inflict_resist: commonBuff_buff_cc_enemy_periodic_inflict_resist,
  buff_cc_enemy_periodic_inflict_resist_cryst:
    commonBuff_buff_cc_enemy_periodic_inflict_resist_cryst,
  buff_cc_enemy_periodic_inflict_resist_fire: commonBuff_buff_cc_enemy_periodic_inflict_resist_fire,
  buff_cc_enemy_periodic_inflict_resist_natural:
    commonBuff_buff_cc_enemy_periodic_inflict_resist_natural,
  buff_cc_enemy_periodic_inflict_resist_phy: commonBuff_buff_cc_enemy_periodic_inflict_resist_phy,
  buff_cc_enemy_periodic_inflict_resist_pulse:
    commonBuff_buff_cc_enemy_periodic_inflict_resist_pulse,
  buff_cc_enemy_poise_up: commonBuff_buff_cc_enemy_poise_up,
  buff_cc_eny_heal_no_inflict: commonBuff_buff_cc_eny_heal_no_inflict,
  buff_cc_eny_heal_no_inflict_countdown: commonBuff_buff_cc_eny_heal_no_inflict_countdown,
  buff_cc_eny_heal_no_inflict_do_heal: commonBuff_buff_cc_eny_heal_no_inflict_do_heal,
  buff_cc_eny_numshield_instance: commonBuff_buff_cc_eny_numshield_instance,
  buff_common_enemy_spell_cryst_attached: commonBuff_buff_common_enemy_spell_cryst_attached,
  buff_common_enemy_spell_cryst_triggered_frozen:
    commonBuff_buff_common_enemy_spell_cryst_triggered_frozen,
  buff_common_enemy_spell_status_do_frozen: commonBuff_buff_common_enemy_spell_status_do_frozen,
  buff_common_enemy_spell_status_frozen: commonBuff_buff_common_enemy_spell_status_frozen,
  buff_common_vfx_eny_atk_down: commonBuff_buff_common_vfx_eny_atk_down,
});

export const contingencyContractTagDefinitions = Object.freeze<
  readonly ContingencyContractTagDefinition[]
>([
  {
    tagId: 102801,
    columnId: '1',
    conflictId: 'c1028',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_302',
    blackboard: {
      attr: 0.9,
    },
  },
  {
    tagId: 102802,
    columnId: '1',
    conflictId: 'c1028',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_303',
    blackboard: {
      attr: 0.8,
    },
  },
  {
    tagId: 102803,
    columnId: '1',
    conflictId: 'c1028',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_304',
    blackboard: {
      attr: 0.6,
    },
  },
  {
    tagId: 100201,
    columnId: '2',
    conflictId: 'c1002',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_101',
    blackboard: {
      dmg_up: 0.3,
    },
  },
  {
    tagId: 100202,
    columnId: '2',
    conflictId: 'c1002',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_102',
    blackboard: {
      dmg_up: 0.8,
    },
  },
  {
    tagId: 102101,
    columnId: '3',
    conflictId: 'c1021',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_111_2',
    blackboard: {
      time: -100,
    },
  },
  {
    tagId: 102102,
    columnId: '3',
    conflictId: 'c1021',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_112_2',
    blackboard: {
      time: -200,
    },
  },
  {
    tagId: 102103,
    columnId: '3',
    conflictId: 'c1021',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_301',
    blackboard: {
      time: -300,
    },
  },
  {
    tagId: 900101,
    columnId: '4',
    conflictId: 'c9001',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_114',
    blackboard: {
      hp_up: 1.5,
    },
  },
  {
    tagId: 900102,
    columnId: '4',
    conflictId: 'c9001',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_115',
    blackboard: {
      hp_up: 2,
    },
  },
  {
    tagId: 900103,
    columnId: '4',
    conflictId: 'c9001',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_116',
    blackboard: {
      hp_up: 3,
    },
  },
  {
    tagId: 100901,
    columnId: '5',
    conflictId: 'c1009',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_122',
    blackboard: {
      dmg_scale: -0.45,
    },
  },
  {
    tagId: 100902,
    columnId: '5',
    conflictId: 'c1009',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_123',
    blackboard: {
      dmg_scale: -0.9,
    },
  },
  {
    tagId: 100601,
    columnId: '6',
    conflictId: 'c1006',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_117',
    blackboard: {
      dmg_scale: 0.5,
    },
  },
  {
    tagId: 100602,
    columnId: '6',
    conflictId: 'c1006',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_118',
    blackboard: {
      dmg_scale: 1,
    },
  },
  {
    tagId: 101301,
    columnId: '7',
    conflictId: 'c1013',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_103',
    blackboard: {
      ratio: -0.5,
    },
  },
  {
    tagId: 101303,
    columnId: '7',
    conflictId: 'c1013',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_104',
    blackboard: {},
  },
  {
    tagId: 102001,
    columnId: '8',
    conflictId: 'c1020',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_107',
    blackboard: {
      num: -2,
    },
  },
  {
    tagId: 102002,
    columnId: '8',
    conflictId: 'c1020',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_108',
    blackboard: {
      num: -3,
    },
  },
  {
    tagId: 100501,
    columnId: '9',
    conflictId: 'c1005',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_207',
    blackboard: {
      dmg_scale_per_layer: -0.5,
    },
  },
  {
    tagId: 100502,
    columnId: '9',
    conflictId: 'c1005',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_208',
    blackboard: {
      dmg_scale_per_layer: -1,
    },
  },
  {
    tagId: 101001,
    columnId: '10',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_124',
    blackboard: {
      duration: 5,
    },
  },
  {
    tagId: 102302,
    columnId: '10',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_136',
    blackboard: {
      speedup_scale: 2,
      dmg_scale: 0.25,
    },
  },
  {
    tagId: 100803,
    columnId: '10',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_209',
    blackboard: {
      dmg_scale: -0.7,
    },
  },
  {
    tagId: 103401,
    columnId: '11',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_312',
    blackboard: {
      ratio: -1,
      duration: 12,
    },
  },
  {
    tagId: 103302,
    columnId: '11',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_307',
    blackboard: {
      chr_heal_ratio: 0.1,
      eny_heal_ratio: 0.08,
      chr_shield_ratio: 0.2,
    },
  },
  {
    tagId: 101402,
    columnId: '11',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_127',
    blackboard: {
      hp_down_ratio: 0.5,
      hp_down_ratio_melee: 0.3,
    },
  },
  {
    tagId: 100003,
    columnId: '12',
    conflictId: 'c1000c1001',
    score: 3,
    keyId: 'key2',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_201',
    blackboard: {
      cd_scale: 0.4,
      dmg_scale: -0.6,
    },
  },
  {
    tagId: 103203,
    columnId: '13',
    conflictId: 'c1000c1001',
    score: 3,
    keyId: 'key2',
    lockIds: [],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_306',
    blackboard: {
      dmg_up: 1,
      dmg_scale: -0.6,
    },
  },
  {
    tagId: 103102,
    columnId: '14',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_308',
    blackboard: {
      dmg_scale: -0.1,
    },
  },
  {
    tagId: 101201,
    columnId: '14',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_125',
    blackboard: {},
  },
  {
    tagId: 101501,
    columnId: '15',
    conflictId: 'c1015',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_129',
    blackboard: {
      atk_scale: 0.02,
    },
  },
  {
    tagId: 101502,
    columnId: '15',
    conflictId: 'c1015',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_130',
    blackboard: {
      atk_scale: 0.05,
    },
  },
  {
    tagId: 100301,
    columnId: '16',
    conflictId: 'c1003',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_203',
    blackboard: {
      times: 2,
    },
  },
  {
    tagId: 100302,
    columnId: '16',
    conflictId: 'c1003',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_204',
    blackboard: {
      times: 1,
    },
  },
  {
    tagId: 100401,
    columnId: '17',
    conflictId: 'c1004',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_205',
    blackboard: {
      times: 2,
    },
  },
  {
    tagId: 100402,
    columnId: '17',
    conflictId: 'c1004',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_206',
    blackboard: {
      times: 1,
    },
  },
  {
    tagId: 101701,
    columnId: '18',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_132',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101603,
    columnId: '18',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_135',
    blackboard: {},
  },
  {
    tagId: 101801,
    columnId: '19',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_133',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101901,
    columnId: '20',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_134',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 102401,
    columnId: '21',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_210',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101101,
    columnId: '22',
    conflictId: 'c1011',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_119',
    blackboard: {
      hp_ratio: 0.05,
    },
  },
  {
    tagId: 101102,
    columnId: '22',
    conflictId: 'c1011',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_120',
    blackboard: {
      hp_ratio: 0.15,
    },
  },
  {
    tagId: 102201,
    columnId: '23',
    conflictId: 'c1022',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_310',
    blackboard: {},
  },
  {
    tagId: 102202,
    columnId: '23',
    conflictId: 'c1022',
    score: 3,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    icon: 'endaxis:contingency_contract/1/icon_activity_contract_tag_311',
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
    tagId: 100003,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_combo_special_cc0',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { cd_scale: 0.2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_combo_special_cc0',
                      blackboardAssignments: { cd_scale: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {
                  cd_scale: { kind: 'constant', value: 0.4 },
                  dmg_scale: { kind: 'constant', value: -0.6 },
                },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd_scale' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 100301,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_normal_skill_cryst_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { times: 2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_normal_skill_cryst_inflict',
                      blackboardAssignments: { times: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { times: { kind: 'constant', value: 2 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'times' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 100302,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_normal_skill_cryst_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { times: 2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_normal_skill_cryst_inflict',
                      blackboardAssignments: { times: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { times: { kind: 'constant', value: 1 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'times' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 100401,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_combo_skill_cryst_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { times: 2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_combo_skill_cryst_inflict',
                      blackboardAssignments: { times: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { times: { kind: 'constant', value: 2 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'times' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 100402,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_combo_skill_cryst_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { times: 2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_combo_skill_cryst_inflict',
                      blackboardAssignments: { times: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { times: { kind: 'constant', value: 1 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'times' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 100501,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_ult_dmg_down_gradual',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.5, dmg_scale_per_layer: -0.5 },
                  children: [
                    { buffId: 'buff_cc_chr_ult_dmg_down_gradual', blackboardAssignments: {} },
                    {
                      buffId: 'buff_cc_chr_ult_dmg_down_gradual_instance',
                      blackboardAssignments: {
                        dmg_scale_per_layer: { kind: 'valueNode', nodeId: 'data_1' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { dmg_scale_per_layer: { kind: 'constant', value: -0.5 } },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: {
            type: 'number',
            expression: { kind: 'blackboard', key: 'dmg_scale_per_layer' },
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 100502,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_ult_dmg_down_gradual',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.5, dmg_scale_per_layer: -0.5 },
                  children: [
                    { buffId: 'buff_cc_chr_ult_dmg_down_gradual', blackboardAssignments: {} },
                    {
                      buffId: 'buff_cc_chr_ult_dmg_down_gradual_instance',
                      blackboardAssignments: {
                        dmg_scale_per_layer: { kind: 'valueNode', nodeId: 'data_1' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { dmg_scale_per_layer: { kind: 'constant', value: -1 } },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: {
            type: 'number',
            expression: { kind: 'blackboard', key: 'dmg_scale_per_layer' },
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 100803,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_normal_attack_dmg_down',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.6 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_normal_attack_dmg_down',
                      blackboardAssignments: { dmg_scale: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.7 } },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 100901,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_dmg_down_after_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.1, duration: 10 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_dmg_down_after_inflict',
                      blackboardAssignments: {
                        dmg_scale: { kind: 'valueNode', nodeId: 'data_1' },
                        duration: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.45 } },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
          data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 100902,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_dmg_down_after_inflict',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.1, duration: 10 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_dmg_down_after_inflict',
                      blackboardAssignments: {
                        dmg_scale: { kind: 'valueNode', nodeId: 'data_1' },
                        duration: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.9 } },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
          data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 101001,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_periodic_inflict_resist',
                    blackboardAssignments: { duration: { kind: 'constant', value: 5 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 101101,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_heal_under_control',
                    blackboardAssignments: { hp_ratio: { kind: 'constant', value: 0.05 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 101102,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_heal_under_control',
                    blackboardAssignments: { hp_ratio: { kind: 'constant', value: 0.15 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 101303,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_level_mute_evade',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [{ buffId: 'buff_cc_chr_mute_evade', blackboardAssignments: {} }],
                },
                source: 'battle',
                blackboardAssignments: {},
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
    tagId: 101701,
    sequence: { $sequence: 'createGlobalBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_fire_skill_clear_frozenonchar',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [
                    {
                      buffId: 'buff_cc_chr_fire_skill_clear_frozenonchar',
                      blackboardAssignments: {},
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {},
              },
            },
            next: null,
          },
          createGlobalBuff_2: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_frozenonchar_extend',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { duration: 15 },
                  children: [
                    { buffId: 'buff_cc_chr_frozenonchar_extend', blackboardAssignments: {} },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { duration: { kind: 'constant', value: 15 } },
              },
            },
            next: 'createGlobalBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 101801,
    sequence: { $sequence: 'createGlobalBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_natural_skill_clear_frozenonchar',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [
                    {
                      buffId: 'buff_cc_chr_natural_skill_clear_frozenonchar',
                      blackboardAssignments: {},
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {},
              },
            },
            next: null,
          },
          createGlobalBuff_2: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_frozenonchar_extend',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { duration: 15 },
                  children: [
                    { buffId: 'buff_cc_chr_frozenonchar_extend', blackboardAssignments: {} },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { duration: { kind: 'constant', value: 15 } },
              },
            },
            next: 'createGlobalBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 101901,
    sequence: { $sequence: 'createGlobalBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_pulse_skill_clear_frozenonchar',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [
                    {
                      buffId: 'buff_cc_chr_pulse_skill_clear_frozenonchar',
                      blackboardAssignments: {},
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {},
              },
            },
            next: null,
          },
          createGlobalBuff_2: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_frozenonchar_extend',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { duration: 15 },
                  children: [
                    { buffId: 'buff_cc_chr_frozenonchar_extend', blackboardAssignments: {} },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { duration: { kind: 'constant', value: 15 } },
              },
            },
            next: 'createGlobalBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 102302,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_movespeedup',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: 0.25 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 102401,
    sequence: { $sequence: 'createGlobalBuff_2' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_phy_skill_clear_frozenonchar',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [
                    {
                      buffId: 'buff_cc_chr_phy_skill_clear_frozenonchar',
                      blackboardAssignments: {},
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {},
              },
            },
            next: null,
          },
          createGlobalBuff_2: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_frozenonchar_extend',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { duration: 15 },
                  children: [
                    { buffId: 'buff_cc_chr_frozenonchar_extend', blackboardAssignments: {} },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { duration: { kind: 'constant', value: 15 } },
              },
            },
            next: 'createGlobalBuff_1',
          },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 102801,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_main_attribute_down',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { attr: -200 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_main_attribute_down',
                      blackboardAssignments: { attr: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { attr: { kind: 'constant', value: 0.9 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'attr' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 102802,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_main_attribute_down',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { attr: -200 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_main_attribute_down',
                      blackboardAssignments: { attr: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { attr: { kind: 'constant', value: 0.8 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'attr' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 102803,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_main_attribute_down',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { attr: -200 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_main_attribute_down',
                      blackboardAssignments: { attr: { kind: 'valueNode', nodeId: 'data_1' } },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: { attr: { kind: 'constant', value: 0.6 } },
              },
            },
            next: null,
          },
        },
        dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'attr' } } },
      },
      macros: {},
    },
  },
  {
    tagId: 103102,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_inflict_stack_resist',
                    blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.1 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 103203,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_physical_and_inflict_enhance_special_cc0',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { dmg_scale: -0.6, dmg_up: 2 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_physical_and_inflict_enhance_special_cc0',
                      blackboardAssignments: {
                        dmg_up: { kind: 'valueNode', nodeId: 'data_1' },
                        dmg_scale: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {
                  dmg_up: { kind: 'constant', value: 1 },
                  dmg_scale: { kind: 'constant', value: -0.6 },
                },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_up' } },
          data_2: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_scale' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 103302,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_heal_reflect_to_eny',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { chr_heal_ratio: 0.1, chr_shield_ratio: 0.2, eny_heal_ratio: 0.05 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_heal_reflect_to_eny',
                      blackboardAssignments: {
                        chr_heal_ratio: { kind: 'valueNode', nodeId: 'data_1' },
                        eny_heal_ratio: { kind: 'valueNode', nodeId: 'data_2' },
                        chr_shield_ratio: { kind: 'valueNode', nodeId: 'data_3' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {
                  chr_heal_ratio: { kind: 'constant', value: 0.1 },
                  eny_heal_ratio: { kind: 'constant', value: 0.08 },
                  chr_shield_ratio: { kind: 'constant', value: 0.2 },
                },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'chr_heal_ratio' } },
          data_2: { type: 'number', expression: { kind: 'blackboard', key: 'eny_heal_ratio' } },
          data_3: { type: 'number', expression: { kind: 'blackboard', key: 'chr_shield_ratio' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 103401,
    sequence: { $sequence: 'createGlobalBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          createGlobalBuff_1: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_buff_cc_chr_no_lastcombo_stop_atb_recover',
                definition: {
                  stackingType: 'unlimited',
                  blackboard: { duration: 12, ratio: -1 },
                  children: [
                    {
                      buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_pre',
                      blackboardAssignments: {
                        ratio: { kind: 'valueNode', nodeId: 'data_1' },
                        duration: { kind: 'valueNode', nodeId: 'data_2' },
                      },
                    },
                  ],
                },
                source: 'battle',
                blackboardAssignments: {
                  ratio: { kind: 'constant', value: -1 },
                  duration: { kind: 'constant', value: 12 },
                },
              },
            },
            next: null,
          },
        },
        dataNodes: {
          data_1: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
          data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
        },
      },
      macros: {},
    },
  },
  {
    tagId: 900101,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_hp_up',
                    blackboardAssignments: { hp_up: { kind: 'constant', value: 1.5 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 900102,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_hp_up',
                    blackboardAssignments: { hp_up: { kind: 'constant', value: 2 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
    tagId: 900103,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [
                  {
                    buffId: 'buff_cc_enemy_common_hp_up',
                    blackboardAssignments: { hp_up: { kind: 'constant', value: 3 } },
                  },
                ],
                targets: { kind: 'fixed', target: 'enemy' },
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
  '100201': 'only changes damage dealt by the passive enemy',
  '100202': 'only changes damage dealt by the passive enemy',
  '100601': 'only changes damage received by operators',
  '100602': 'only changes damage received by operators',
  '101201': 'operator switching is forced by the authored timeline',
  '101301': 'stamina and evasion are outside the authored skill timeline',
  '101402': 'depends on operators receiving enemy damage',
  '101501': 'runs after the unique fixed target has been defeated',
  '101502': 'runs after the unique fixed target has been defeated',
  '101603': 'depends on the passive enemy applying an infliction to an operator',
  '102001': 'wave healing pickups do not exist in the fixed-target scenario',
  '102002': 'wave healing pickups do not exist in the fixed-target scenario',
  '102101': 'challenge countdown is not a combat result',
  '102102': 'challenge countdown is not a combat result',
  '102103': 'challenge countdown is not a combat result',
  '102201': 'changes stage wave enemy composition rather than the selected fixed target',
  '102202': 'changes stage wave enemy composition rather than the selected fixed target',
}) as Readonly<Record<number, string>>;
export const contingencyContractDefinitionRevision = 'local-vfs-20261021';
