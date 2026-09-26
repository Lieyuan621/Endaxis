/** 由危机合约原生词条、GlobalBuff 与 BuffData 闭包生成；不要手工编辑。 */
import type { ContingencyContractTagDefinition } from '../../../../packages/game-data-contract/src/index.ts';

/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';

import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs';
const commonBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_atb_down',
    iconPath: '/icons/icon_battle_atb_down.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff1ActionGraph,
};

const commonBuff2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
            reason: 'other',
          },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
            durationSeconds: { kind: 'blackboard', key: 'cd' },
            autoFinishByAction: false,
          },
        },
        next: 'finishBuffsById_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_combo_skill_cryst_inflict_stack',
            target: 'controlledOperator',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'controlledOperator',
              buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
              operator: 'greaterOrEqual',
              value: { kind: 'blackboard', key: 'd_times' },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'createTimedMarker_2' },
          whenFalse: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_times',
            operation: 'add',
            left: { kind: 'blackboard', key: 'times' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'conditional_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'not',
              condition: {
                kind: 'timedMarkerPresent',
                target: 'buffOwner',
                markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
              },
            },
          },
          whenTrue: { $sequence: 'calculateActionValue_5' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] } },
          whenTrue: { $sequence: 'conditional_6' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 3, d_times: 0, times: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'conditional_7' } },
  ],
  actionGraph: commonBuff2ActionGraph,
};

const commonBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff3ActionGraph,
};

const commonBuff4ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
          },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff4: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
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
  actionGraph: commonBuff4ActionGraph,
};

const commonBuff5ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff5: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_cryst_dmg_down',
    iconPath: '/icons/icon_battle_cryst_dmg_down.webp',
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
    showWarningBackground: true,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['cryo'] },
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
  actionGraph: commonBuff5ActionGraph,
};

const commonBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_phy_dmg_down',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_fire_dmg_down',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_pulse_dmg_down',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_cryst_dmg_down',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_natural_dmg_down',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale', duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_4' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_8' } },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_10' } },
  ],
  actionGraph: commonBuff6ActionGraph,
};

const commonBuff7ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff7: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_fire_dmg_down',
    iconPath: '/icons/icon_battle_fire_dmg_down.webp',
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
    showWarningBackground: true,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['heat'] },
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
  actionGraph: commonBuff7ActionGraph,
};

const commonBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_heal_reflect_to_eny_shield',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              chr_heal_ratio: 'chr_shield_ratio',
              eny_heal_ratio: 'eny_heal_ratio',
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_heal_reflect_to_eny_heal',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              chr_heal_ratio: 'chr_heal_ratio',
              eny_heal_ratio: 'eny_heal_ratio',
            },
          },
        },
        next: 'applyBuff_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff8: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { chr_heal_ratio: 0.1, chr_shield_ratio: 0.2, eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' } },
  actionGraph: commonBuff8ActionGraph,
};

const commonBuff9ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'blackboard', key: 'heal' },
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
            left: { kind: 'blackboard', key: 'chr_heal_ratio' },
            right: { kind: 'blackboard', key: 'heal_times' },
          },
        },
        next: 'modifyActionValue_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'can_heal', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_5' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'conditional_6' },
        },
        next: null,
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
            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal',
            target: 'buffOwner',
            source: 'buffOwner',
            count: { kind: 'blackboard', key: 'heal_times' },
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
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
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'heal_times', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: null,
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'divide',
            left: { kind: 'blackboard', key: 'heal_ratio_total' },
            right: { kind: 'blackboard', key: 'chr_heal_ratio' },
          },
        },
        next: 'conditional_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'blackboard', key: 'heal' },
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
            value: { kind: 'blackboard', key: 'max_hp' },
          },
        },
        next: 'modifyActionValue_13',
      },
      storeSourceAttributeValue_15: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
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
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'modifyActionValue_17' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff9: SkillBuffDefinition = {
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
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'conditional_7' } },
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'conditional_18' } },
  ],
  actionGraph: commonBuff9ActionGraph,
};

const commonBuff10ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'blackboard', key: 'heal' },
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
            left: { kind: 'blackboard', key: 'chr_heal_ratio' },
            right: { kind: 'blackboard', key: 'heal_times' },
          },
        },
        next: 'modifyActionValue_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'can_heal', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_5' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'conditional_6' },
        },
        next: null,
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
            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_shield',
            target: 'buffOwner',
            source: 'buffOwner',
            count: { kind: 'blackboard', key: 'heal_times' },
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
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
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'heal_times', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'modifyActionValue_10' },
        },
        next: null,
      },
      calculateActionValue_12: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'heal_times',
            operation: 'divide',
            left: { kind: 'blackboard', key: 'heal_ratio_total' },
            right: { kind: 'blackboard', key: 'chr_heal_ratio' },
          },
        },
        next: 'conditional_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'heal_ratio_total',
            operation: 'add',
            value: { kind: 'blackboard', key: 'heal' },
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
            value: { kind: 'blackboard', key: 'max_hp' },
          },
        },
        next: 'modifyActionValue_13',
      },
      storeSourceAttributeValue_15: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
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
          parameters: { target: 'actionOwner', value: 'gained', outputKey: 'heal' },
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
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'modifyActionValue_17' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff10: SkillBuffDefinition = {
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
    { event: 'afterAddedShield', priority: 0, sequence: { $sequence: 'conditional_7' } },
    { event: 'afterAddedShield', priority: 0, sequence: { $sequence: 'conditional_18' } },
  ],
  actionGraph: commonBuff10ActionGraph,
};

const commonBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 99,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'forEachContextTarget_2' } },
  actionGraph: commonBuff11ActionGraph,
};

const commonBuff12ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'enemy',
            source: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'blackboard', key: 'eny_heal_ratio' },
            addition: { kind: 'constant', value: 0 },
            attributeSource: 'target',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff12: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'heal_1' } },
  actionGraph: commonBuff12ActionGraph,
};

const commonBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { eny_heal_ratio: 'eny_heal_ratio' },
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { target: 'enemy' },
          body: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff13: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 99,
  applyTags: [],
  extendTags: [],
  blackboard: { eny_heal_ratio: 0.05 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'forEachContextTarget_2' } },
  actionGraph: commonBuff13ActionGraph,
};

const commonBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff14: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { attr: 0.9 },
  attributeModifiers: [
    { attribute: { kind: 'main' }, slot: 'finalMultiplier', value: { blackboardKey: 'attr' } },
  ],
  actionGraph: commonBuff14ActionGraph,
};

const commonBuff15ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['nature'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff15: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_natural_dmg_down',
    iconPath: '/icons/icon_battle_natural_dmg_down.webp',
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
    showWarningBackground: true,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['nature'] },
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
  actionGraph: commonBuff15ActionGraph,
};

const commonBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
            target: 'party',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventDamageTagsMatch',
              match: 'hasAny',
              tags: ['powerAttack', 'normalAttackLastCombo'],
            },
          },
          whenTrue: { $sequence: 'finishGlobalBuffsById_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'constant', value: 1 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, ratio: -1 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: commonBuff16ActionGraph,
};

const commonBuff17ActionGraph = {
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
                  value: { kind: 'blackboard', key: 'ratio' },
                  applyToReturnSpGain: true,
                },
              ],
              children: [
                { buffId: 'buff_cc_chr_atb_recoverspeed_down_icon', blackboardAssignments: {} },
              ],
            },
            source: 'battle',
            blackboardAssignments: { ratio: { kind: 'blackboard', key: 'ratio' } },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'createGlobalBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff17: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_chr_no_lastcombo_stop_atb_recove',
    iconPath: '/icons/icon_battle_buff_chr_no_lastcombo_stop_atb_recove.webp',
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
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 12, ratio: -1 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'conditional_2' } },
  actionGraph: commonBuff17ActionGraph,
};

const commonBuff18ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { ratio: 'ratio', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff18: SkillBuffDefinition = {
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
  actionGraph: commonBuff18ActionGraph,
};

const commonBuff19ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttack'] },
          },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff19: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttack'] },
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
  actionGraph: commonBuff19ActionGraph,
};

const commonBuff20ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
            reason: 'other',
          },
        },
        next: null,
      },
      createTimedMarker_2: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
            durationSeconds: { kind: 'blackboard', key: 'cd' },
            autoFinishByAction: false,
          },
        },
        next: 'finishBuffsById_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_normal_skill_cryst_inflict_stack',
            target: 'controlledOperator',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'controlledOperator',
              buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
              operator: 'greaterOrEqual',
              value: { kind: 'blackboard', key: 'd_times' },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'createTimedMarker_2' },
          whenFalse: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      calculateActionValue_5: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'd_times',
            operation: 'add',
            left: { kind: 'blackboard', key: 'times' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'conditional_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'not',
              condition: {
                kind: 'timedMarkerPresent',
                target: 'buffOwner',
                markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
              },
            },
          },
          whenTrue: { $sequence: 'calculateActionValue_5' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] } },
          whenTrue: { $sequence: 'conditional_6' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff20: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 3, d_times: 0, times: 1 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'conditional_7' } },
  ],
  actionGraph: commonBuff20ActionGraph,
};

const commonBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff21: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff21ActionGraph,
};

const commonBuff22ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff22: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_physical_dmg_down',
    iconPath: '/icons/icon_battle_physical_dmg_down.webp',
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
    showWarningBackground: true,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
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
  actionGraph: commonBuff22ActionGraph,
};

const commonBuff23ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventDamageTagsMatch',
              match: 'exceptAny',
              tags: ['normalAttack', 'normalSkill', 'ultimateSkill', 'comboSkill'],
            },
          },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
          },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff23: SkillBuffDefinition = {
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
      condition: {
        kind: 'eventDamageTagsMatch',
        match: 'exceptAny',
        tags: ['normalAttack', 'normalSkill', 'ultimateSkill', 'comboSkill'],
      },
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
      condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
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
  actionGraph: commonBuff23ActionGraph,
};

const commonBuff24ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['electric'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff24: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_pulse_dmg_down',
    iconPath: '/icons/icon_battle_pulse_dmg_down.webp',
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
    showWarningBackground: true,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1, duration: 10 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['electric'] },
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
  actionGraph: commonBuff24ActionGraph,
};

const commonBuff25ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_chr_ult_dmg_down_gradual_stack',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'currentSkillTypeIn',
              target: 'buffOwner',
              skillTypes: ['ultimate'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff25: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: commonBuff25ActionGraph,
};

const commonBuff26ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'dmg_scale',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'dmg_scale_per_layer' },
            right: { kind: 'blackboard', key: 'layer' },
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
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['ultimateSkill'] },
          },
          whenTrue: { $sequence: 'readBuffStackCount_3' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff26: SkillBuffDefinition = {
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
      conditionProgram: { $sequence: 'conditional_4' },
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
  actionGraph: commonBuff26ActionGraph,
};

const commonBuff27ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff27: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff27ActionGraph,
};

const commonBuff28ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_base',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff28: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: 0.25, speedup_scale: 2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff28ActionGraph,
};

const commonBuff29ActionGraph = {
  main: {
    nodes: {
      calculateActionValue_1: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'one_minus_dmg_scale',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hp_ratio', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hp_ratio', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_ratio',
            operation: 'add',
            value: { kind: 'blackboard', key: 'one_minus_dmg_scale' },
          },
        },
        next: 'conditional_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hp_ratio',
            operation: 'divide',
            value: { kind: 'blackboard', key: 'max_hp' },
          },
        },
        next: 'modifyActionValue_5',
      },
      storeEntityPropertyValue_7: {
        action: {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target: 'actionOwner',
            property: 'maxHealth',
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
        next: 'storeEntityPropertyValue_7',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff29: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: 0.25, hp_ratio: 0, max_hp: 0, one_minus_dmg_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'calculateActionValue_1' } },
  abilityEventResponses: [
    {
      event: 'beforeTakeDamage',
      priority: 0,
      sequence: { $sequence: 'storeEntityPropertyValue_8' },
    },
  ],
  actionGraph: commonBuff29ActionGraph,
};

const commonBuff30ActionGraph = {
  main: {
    nodes: {
      setHealthFloor_1: {
        action: {
          kind: 'setHealthFloor',
          parameters: {
            target: 'actionOwner',
            mode: 'maxHealthRatio',
            value: { kind: 'blackboard', key: 'hp_ratio' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
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
            value: { kind: 'blackboard', key: 'hp_heal_ratio' },
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
            value: { kind: 'blackboard', key: 'max_hp' },
          },
        },
        next: 'modifyActionValue_4',
      },
      storeEntityPropertyValue_6: {
        action: {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target: 'actionOwner',
            property: 'maxHealth',
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
        next: 'storeEntityPropertyValue_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'has_healed', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'storeEventHealValues_7' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff30: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { has_healed: 0, hp_heal_ratio: 0, hp_ratio: 0.25, max_hp: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'setHealthFloor_1' } },
  abilityEventResponses: [
    { event: 'receiveHeal', priority: 0, sequence: { $sequence: 'conditional_8' } },
  ],
  actionGraph: commonBuff30ActionGraph,
};

const commonBuff31ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_stack',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 20 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
            },
          },
          whenTrue: { $sequence: 'conditional_2' },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_stack',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'less',
              value: { kind: 'constant', value: 30 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: [
                'Skill/Character/Common/PhysicalStatus/AirborneStatus',
                'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
              ],
            },
          },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_stack',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 20 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
          },
          whenTrue: { $sequence: 'conditional_8' },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_stack',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_11: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffIdMatch',
              buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_10' },
        },
        next: null,
      },
      finishBuffsById_12: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 20 },
            },
          },
          whenTrue: { $sequence: 'finishBuffsById_12' },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
            },
          },
          whenTrue: { $sequence: 'conditional_13' },
        },
        next: null,
      },
      finishBuffsById_15: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'less',
              value: { kind: 'constant', value: 30 },
            },
          },
          whenTrue: { $sequence: 'finishBuffsById_15' },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: [
                'Skill/Character/Common/PhysicalStatus/AirborneStatus',
                'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
              ],
            },
          },
          whenTrue: { $sequence: 'conditional_16' },
        },
        next: null,
      },
      finishBuffsById_18: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'enemySuperArmorCompare',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 20 },
            },
          },
          whenTrue: { $sequence: 'finishBuffsById_18' },
        },
        next: null,
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
          },
          whenTrue: { $sequence: 'conditional_19' },
        },
        next: null,
      },
      finishBuffsById_21: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            reason: 'other',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffIdMatch',
              buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
            },
          },
          whenTrue: { $sequence: 'finishBuffsById_21' },
        },
        next: null,
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_instance',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
          },
        },
        next: null,
      },
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_cc_enemy_heal_under_control_stack'],
              operator: 'equal',
              value: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_23' },
        },
        next: null,
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffIdMatch',
              buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            },
          },
          whenTrue: { $sequence: 'conditional_24' },
        },
        next: null,
      },
      finishBuffsById_26: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_instance'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_cc_enemy_heal_under_control_stack'],
              operator: 'equal',
              value: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'finishBuffsById_26' },
        },
        next: null,
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffIdMatch',
              buffIds: ['buff_cc_enemy_heal_under_control_stack'],
            },
          },
          whenTrue: { $sequence: 'conditional_27' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff31: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.05, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_3' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_9' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_11' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_14' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_17' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_20' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_22' } },
    { event: 'beforeAddedBuff', priority: 0, sequence: { $sequence: 'conditional_25' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_28' } },
  ],
  actionGraph: commonBuff31ActionGraph,
};

const commonBuff32ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control_timer',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { hp_ratio: 'hp_ratio' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_cc_enemy_heal_under_control_timer'],
              operator: 'equal',
              value: { kind: 'constant', value: 0 },
            },
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff32: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { hp_ratio: 0.01 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'conditional_2' } },
  actionGraph: commonBuff32ActionGraph,
};

const commonBuff33ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff33: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff33ActionGraph,
};

const commonBuff34ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'blackboard', key: 'hp_ratio' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      heal_2: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'blackboard', key: 'hp_ratio' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_heal_under_control_timer'],
            reason: 'other',
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_cc_enemy_heal_under_control_instance'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'heal_2' },
          whenFalse: { $sequence: 'finishBuffsById_3' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff34: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: { $sequence: 'heal_1' }, trigger: { $sequence: 'conditional_4' } },
  actionGraph: commonBuff34ActionGraph,
};

const commonBuff35ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_listener',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_add_listener',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'dmg_scale' },
          },
        },
        next: 'applyBuff_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff35: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_scale: -0.1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' } },
  actionGraph: commonBuff35ActionGraph,
};

const commonBuff36ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_fire',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'blackboard', key: 'stack' },
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
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_5' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_pulse',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
          },
        },
        next: null,
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'blackboard', key: 'stack' },
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
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_11' },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_cryst',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
          },
        },
        next: null,
      },
      finishBuffsById_14: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'blackboard', key: 'stack' },
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
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_17' },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_natural',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
          },
        },
        next: null,
      },
      finishBuffsById_20: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'blackboard', key: 'stack' },
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
      conditional_24: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_23' },
        },
        next: null,
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_phy',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { dmg_scale: 'd_dmg_scale' },
          },
        },
        next: null,
      },
      finishBuffsById_26: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            left: { kind: 'blackboard', key: 'dmg_scale' },
            right: { kind: 'blackboard', key: 'stack' },
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
      conditional_30: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
          whenTrue: { $sequence: 'readBuffStackCount_29' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff36: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { d_dmg_scale: 0, dmg_scale: -0.1, stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_12' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_18' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_24' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_30' } },
  ],
  actionGraph: commonBuff36ActionGraph,
};

const commonBuff37ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            target: 'buffOwner',
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
            target: 'buffOwner',
            buffIds: ['buff_cc_enemy_inflict_stack_resist_phy'],
            reason: 'other',
          },
        },
        next: null,
      },
      switch_6: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'index' }, alwaysNext: true },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff37: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: { index: 0 },
  attributeModifiers: [],
  lifecycleSequences: { finish: { $sequence: 'switch_6' } },
  actionGraph: commonBuff37ActionGraph,
};

const commonBuff38ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { index: { kind: 'constant', value: 0 } },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { index: { kind: 'constant', value: 1 } },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { index: { kind: 'constant', value: 2 } },
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { index: { kind: 'constant', value: 3 } },
          },
        },
        next: null,
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { index: { kind: 'constant', value: 4 } },
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff38: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_4' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_6' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_8' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'conditional_10' } },
  ],
  actionGraph: commonBuff38ActionGraph,
};

const commonBuff39ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff39: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['cryo'] },
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
  actionGraph: commonBuff39ActionGraph,
};

const commonBuff40ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff40: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['heat'] },
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
  actionGraph: commonBuff40ActionGraph,
};

const commonBuff41ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['nature'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff41: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['nature'] },
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
  actionGraph: commonBuff41ActionGraph,
};

const commonBuff42ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff42: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
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
  actionGraph: commonBuff42ActionGraph,
};

const commonBuff43ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['electric'] } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff43: SkillBuffDefinition = {
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
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['electric'] },
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
  actionGraph: commonBuff43ActionGraph,
};

const commonBuff44ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist_fire',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist_pulse',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist_cryst',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist_natural',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventInflictionElementIn', elements: ['nature'] },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: 'conditional_5',
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventInflictionElementIn', elements: ['electric'] },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: 'conditional_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventInflictionElementIn', elements: ['heat'] },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: 'conditional_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist_phy',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventBuffTagsMatch',
              match: 'hasAny',
              buffTags: ['Skill/Character/Common/NoGuard'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff44: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterTakeInfliction', priority: 0, sequence: { $sequence: 'conditional_8' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_10' } },
  ],
  actionGraph: commonBuff44ActionGraph,
};

const commonBuff45ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff45: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_eny_resist_inflict_cryst',
    iconPath: '/icons/icon_battle_eny_resist_inflict_cryst.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: true,
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneCrystInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff45ActionGraph,
};

const commonBuff46ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff46: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_eny_resist_inflict_fire',
    iconPath: '/icons/icon_battle_eny_resist_inflict_fire.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: true,
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneFireInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff46ActionGraph,
};

const commonBuff47ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff47: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_eny_resist_inflict_natural',
    iconPath: '/icons/icon_battle_eny_resist_inflict_natural.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: true,
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmuneNaturalInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff47ActionGraph,
};

const commonBuff48ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff48: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_eny_resist_inflict_phy',
    iconPath: '/icons/icon_battle_eny_resist_inflict_phy.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: true,
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: ['Immune/ImmuneNoGuard'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff48ActionGraph,
};

const commonBuff49ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff49: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_eny_resist_inflict_pulse',
    iconPath: '/icons/icon_battle_eny_resist_inflict_pulse.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: true,
    playStrongInAnimation: true,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionBuff' },
  },
  applyTags: ['Immune/ImmuneSpellInflict/ImmunePulseInflict'],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  actionGraph: commonBuff49ActionGraph,
};
export const contingencyContractBuffDefinitions: OperatorBuffDefinitions = Object.freeze({
  buff_cc_chr_atb_recoverspeed_down_icon: commonBuff1,
  buff_cc_chr_combo_skill_cryst_inflict: commonBuff2,
  buff_cc_chr_combo_skill_cryst_inflict_stack: commonBuff3,
  buff_cc_chr_combo_special_cc0: commonBuff4,
  buff_cc_chr_cryst_dmg_down: commonBuff5,
  buff_cc_chr_dmg_down_after_inflict: commonBuff6,
  buff_cc_chr_fire_dmg_down: commonBuff7,
  buff_cc_chr_heal_reflect_to_eny: commonBuff8,
  buff_cc_chr_heal_reflect_to_eny_heal: commonBuff9,
  buff_cc_chr_heal_reflect_to_eny_shield: commonBuff10,
  buff_cc_chr_heal_reflect_to_eny_stack_heal: commonBuff11,
  buff_cc_chr_heal_reflect_to_eny_stack_heal_do: commonBuff12,
  buff_cc_chr_heal_reflect_to_eny_stack_shield: commonBuff13,
  buff_cc_chr_main_attribute_down: commonBuff14,
  buff_cc_chr_natural_dmg_down: commonBuff15,
  buff_cc_chr_no_lastcombo_stop_atb_recover: commonBuff16,
  buff_cc_chr_no_lastcombo_stop_atb_recover_countdown: commonBuff17,
  buff_cc_chr_no_lastcombo_stop_atb_recover_pre: commonBuff18,
  buff_cc_chr_normal_attack_dmg_down: commonBuff19,
  buff_cc_chr_normal_skill_cryst_inflict: commonBuff20,
  buff_cc_chr_normal_skill_cryst_inflict_stack: commonBuff21,
  buff_cc_chr_phy_dmg_down: commonBuff22,
  buff_cc_chr_physical_and_inflict_enhance_special_cc0: commonBuff23,
  buff_cc_chr_pulse_dmg_down: commonBuff24,
  buff_cc_chr_ult_dmg_down_gradual: commonBuff25,
  buff_cc_chr_ult_dmg_down_gradual_instance: commonBuff26,
  buff_cc_chr_ult_dmg_down_gradual_stack: commonBuff27,
  buff_cc_enemy_common_movespeedup: commonBuff28,
  buff_cc_enemy_common_movespeedup_dmg_limit_base: commonBuff29,
  buff_cc_enemy_common_movespeedup_dmg_limit_instance: commonBuff30,
  buff_cc_enemy_heal_under_control: commonBuff31,
  buff_cc_enemy_heal_under_control_instance: commonBuff32,
  buff_cc_enemy_heal_under_control_stack: commonBuff33,
  buff_cc_enemy_heal_under_control_timer: commonBuff34,
  buff_cc_enemy_inflict_stack_resist: commonBuff35,
  buff_cc_enemy_inflict_stack_resist_add_listener: commonBuff36,
  buff_cc_enemy_inflict_stack_resist_consume_delay: commonBuff37,
  buff_cc_enemy_inflict_stack_resist_consume_listener: commonBuff38,
  buff_cc_enemy_inflict_stack_resist_cryst: commonBuff39,
  buff_cc_enemy_inflict_stack_resist_fire: commonBuff40,
  buff_cc_enemy_inflict_stack_resist_natural: commonBuff41,
  buff_cc_enemy_inflict_stack_resist_phy: commonBuff42,
  buff_cc_enemy_inflict_stack_resist_pulse: commonBuff43,
  buff_cc_enemy_periodic_inflict_resist: commonBuff44,
  buff_cc_enemy_periodic_inflict_resist_cryst: commonBuff45,
  buff_cc_enemy_periodic_inflict_resist_fire: commonBuff46,
  buff_cc_enemy_periodic_inflict_resist_natural: commonBuff47,
  buff_cc_enemy_periodic_inflict_resist_phy: commonBuff48,
  buff_cc_enemy_periodic_inflict_resist_pulse: commonBuff49,
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_302.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_303.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_304.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_101.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_102.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_111_2.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_112_2.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_301.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_114.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_115.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_116.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_122.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_123.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_117.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_118.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_103.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_104.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_107.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_108.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_207.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_208.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_124.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_136.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_209.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_312.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_307.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_127.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_201.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_306.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_308.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_125.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_129.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_130.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_203.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_204.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_205.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_206.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_132.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_135.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_133.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_134.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_210.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_119.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_120.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_310.webp',
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
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_311.webp',
    blackboard: {},
  },
]);
export const contingencyContractInitializationPlans = Object.freeze<
  readonly {
    readonly tagId: number;
    readonly sequence: import('../../../../packages/game-data-contract/src/actionGraph').ActionGraphReference;
    readonly actionGraph: import('../../../../packages/game-data-contract/src/actionGraph').ActionGraphResourceDefinition;
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
                      blackboardAssignments: { cd_scale: { kind: 'blackboard', key: 'cd_scale' } },
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
                      blackboardAssignments: { times: { kind: 'blackboard', key: 'times' } },
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
                      blackboardAssignments: { times: { kind: 'blackboard', key: 'times' } },
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
                      blackboardAssignments: { times: { kind: 'blackboard', key: 'times' } },
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
                      blackboardAssignments: { times: { kind: 'blackboard', key: 'times' } },
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
                        dmg_scale_per_layer: { kind: 'blackboard', key: 'dmg_scale_per_layer' },
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
                        dmg_scale_per_layer: { kind: 'blackboard', key: 'dmg_scale_per_layer' },
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
                      blackboardAssignments: {
                        dmg_scale: { kind: 'blackboard', key: 'dmg_scale' },
                      },
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
                        dmg_scale: { kind: 'blackboard', key: 'dmg_scale' },
                        duration: { kind: 'blackboard', key: 'duration' },
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
                        dmg_scale: { kind: 'blackboard', key: 'dmg_scale' },
                        duration: { kind: 'blackboard', key: 'duration' },
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
                buffId: 'buff_cc_enemy_periodic_inflict_resist',
                target: 'enemy',
                blackboardAssignments: { duration: { kind: 'constant', value: 5 } },
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
                buffId: 'buff_cc_enemy_heal_under_control',
                target: 'enemy',
                blackboardAssignments: { hp_ratio: { kind: 'constant', value: 0.05 } },
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
                buffId: 'buff_cc_enemy_heal_under_control',
                target: 'enemy',
                blackboardAssignments: { hp_ratio: { kind: 'constant', value: 0.15 } },
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
    tagId: 102302,
    sequence: { $sequence: 'applyBuff_1' },
    actionGraph: {
      main: {
        nodes: {
          applyBuff_1: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff_cc_enemy_common_movespeedup',
                target: 'enemy',
                blackboardAssignments: {
                  speedup_scale: { kind: 'constant', value: 2 },
                  dmg_scale: { kind: 'constant', value: 0.25 },
                },
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
                      blackboardAssignments: { attr: { kind: 'blackboard', key: 'attr' } },
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
                      blackboardAssignments: { attr: { kind: 'blackboard', key: 'attr' } },
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
                      blackboardAssignments: { attr: { kind: 'blackboard', key: 'attr' } },
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
                buffId: 'buff_cc_enemy_inflict_stack_resist',
                target: 'enemy',
                blackboardAssignments: { dmg_scale: { kind: 'constant', value: -0.1 } },
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
                        dmg_up: { kind: 'blackboard', key: 'dmg_up' },
                        dmg_scale: { kind: 'blackboard', key: 'dmg_scale' },
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
                        chr_heal_ratio: { kind: 'blackboard', key: 'chr_heal_ratio' },
                        eny_heal_ratio: { kind: 'blackboard', key: 'eny_heal_ratio' },
                        chr_shield_ratio: { kind: 'blackboard', key: 'chr_shield_ratio' },
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
                        ratio: { kind: 'blackboard', key: 'ratio' },
                        duration: { kind: 'blackboard', key: 'duration' },
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
      },
      macros: {},
    },
  },
]);
export const contingencyContractEnemyMaxHealthPlans = Object.freeze([
  {
    tagId: 900101,
    multiplier: 1.5,
  },
  {
    tagId: 900102,
    multiplier: 2,
  },
  {
    tagId: 900103,
    multiplier: 3,
  },
]) as readonly { readonly tagId: number; readonly multiplier: number }[];
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
  '101303': 'stamina and evasion are outside the authored skill timeline',
  '101402': 'depends on operators receiving enemy damage',
  '101501': 'runs after the unique fixed target has been defeated',
  '101502': 'runs after the unique fixed target has been defeated',
  '101603': 'depends on the passive enemy applying an infliction to an operator',
  '101701': 'only changes operator freeze and input behavior',
  '101801': 'only changes operator freeze and input behavior',
  '101901': 'only changes operator freeze and input behavior',
  '102001': 'wave healing pickups do not exist in the fixed-target scenario',
  '102002': 'wave healing pickups do not exist in the fixed-target scenario',
  '102101': 'challenge countdown is not a combat result',
  '102102': 'challenge countdown is not a combat result',
  '102103': 'challenge countdown is not a combat result',
  '102201': 'changes stage wave enemy composition rather than the selected fixed target',
  '102202': 'changes stage wave enemy composition rather than the selected fixed target',
  '102401': 'only changes operator freeze and input behavior',
}) as Readonly<Record<number, string>>;
export const contingencyContractDefinitionRevision = '1.5.3@10506507-7';
