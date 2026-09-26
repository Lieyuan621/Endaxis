/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';

import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs';
const commonBuff1ActionGraph = {
  main: {
    nodes: {
      finishParentGlobalBuff_1: {
        action: { kind: 'finishParentGlobalBuff', parameters: { reason: 'early' } },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_skillimbue',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { imbue_scale: 'imbue_scale' },
          },
        },
        next: 'finishParentGlobalBuff_1',
      },
      readSkillSettingData_3: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [0.2, 0.1, 0.1, 0.1],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'imbue_scale',
              },
            ],
          },
        },
        next: 'applyBuff_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_common_affixes_combo_trigger'] },
          },
        },
        next: 'readSkillSettingData_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill', 'ultimate'] },
          },
          whenTrue: { $sequence: 'readBuffStackCount_4' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'imbue_scale', negate: true },
  maxStackCount: 99,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, imbue_scale: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: commonBuff1ActionGraph,
};

const commonBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceCryst'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_enhance_crystal_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'cryoEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff2ActionGraph,
};

const commonBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceFire'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_enhance_fire_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'heatEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff3ActionGraph,
};

const commonBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceNatural'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_enhance_natural_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'natureEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff4ActionGraph,
};

const commonBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_natural_enhance',
    iconPath: '/icons/icon_battle_affix_natural_enhance.webp',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff5ActionGraph,
};

const commonBuff6ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhancePulse'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_enhance_pulse_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'electricEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff6ActionGraph,
};

const commonBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_pulse_enhance',
    iconPath: '/icons/icon_battle_affix_pulse_enhance.webp',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff7ActionGraph,
};

const commonBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff8: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Enhance',
    'Skill/Character/Common/Affixes/Enhance/EnhanceSpell',
    'Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceFire',
    'Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceCryst',
    'Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhancePulse',
    'Skill/Character/Common/Affixes/Enhance/EnhanceSpell/EnhanceNatural',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_enhance_spell_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'heatEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'electricEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'cryoEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'natureEnhancedDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff8ActionGraph,
};

const commonBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_spell_enhance',
    iconPath: '/icons/icon_battle_affix_spell_enhance.webp',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff9ActionGraph,
};

const commonBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff10: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Shelter'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_shelter_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'shelterDamageMultiplier',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff10ActionGraph,
};

const commonBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff11: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_shelter',
    iconPath: '/icons/icon_battle_affix_shelter.webp',
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: -0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff11ActionGraph,
};

const commonBuff12ActionGraph = {
  main: {
    nodes: {
      skillAffix_2: { action: { kind: 'skillAffix', parameters: {} }, next: null },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_skillimbue_atk',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { imbue_scale: 'imbue_scale' },
          },
        },
        next: 'skillAffix_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff12: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'imbue_scale', negate: true },
  maxStackCount: 4,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/Affixes/skillimbue'],
  extendTags: [],
  blackboard: { duration: 0, imbue_scale: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_3' } },
  actionGraph: commonBuff12ActionGraph,
};

const commonBuff13ActionGraph = {
  main: {
    nodes: {
      skillAffix_1: { action: { kind: 'skillAffix', parameters: {} }, next: null },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'real_imbue_scale',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'imbue_scale' },
            right: { kind: 'constant', value: 1.5 },
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'real_imbue_scale',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'imbue_scale' },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalSkill'] },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'calculateActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventDamageTagsMatch',
              match: 'hasAny',
              tags: ['normalSkill', 'ultimateSkill'],
            },
          },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'eventSkillCastMatchesBuffSource' } },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff13: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'imbue_scale', negate: true },
  maxStackCount: 4,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, imbue_scale: 0, real_imbue_scale: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      conditionProgram: { $sequence: 'conditional_6' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'combo',
          addition: { blackboardKey: 'real_imbue_scale' },
        },
      ],
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'skillAffix_1' } },
  actionGraph: commonBuff13ActionGraph,
};

const commonBuff14ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff14: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/Affixes/Slow'],
  extendTags: [],
  blackboard: { child_buff_id: 'buff_common_affixes_slow_default_child', duration: 0, rate: 0 },
  attributeModifiers: [
    { attribute: 'SlowActionSpeedScalar', slot: 'addition', value: { blackboardKey: 'rate' } },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff14ActionGraph,
};

const commonBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff15: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_slow',
    iconPath: '/icons/icon_battle_affix_slow.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  actionGraph: commonBuff15ActionGraph,
};

const commonBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/Affixes/Speedup'],
  extendTags: [],
  blackboard: { child_buff_id: 'buff_common_affixes_speedup_default_child', duration: 0, rate: 0 },
  attributeModifiers: [
    { attribute: 'KeywordSpeedUpScalar', slot: 'baseAddition', value: { blackboardKey: 'rate' } },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff16ActionGraph,
};

const commonBuff17ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff17: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableSpell',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableCryst',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_crystal_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'cryoVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff17ActionGraph,
};

const commonBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff18: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_cryst_vulnerable',
    iconPath: '/icons/icon_battle_affix_cryst_vulnerable.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff18ActionGraph,
};

const commonBuff19ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff19: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff19ActionGraph,
};

const commonBuff20ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff20: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableSpell',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableFire',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_fire_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'heatVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff20ActionGraph,
};

const commonBuff21ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff21: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableSpell',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableNatural',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_natural_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'natureVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff21ActionGraph,
};

const commonBuff22ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff22: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff22ActionGraph,
};

const commonBuff23ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff23: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_physical_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'physicalVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff23ActionGraph,
};

const commonBuff24ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff24: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_physical_vulnerable',
    iconPath: '/icons/icon_battle_affix_physical_vulnerable.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff24ActionGraph,
};

const commonBuff25ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff25: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableSpell',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_pulse_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'electricVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff25ActionGraph,
};

const commonBuff26ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff26: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_pulse_vulnerable',
    iconPath: '/icons/icon_battle_affix_pulse_vulnerable.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff26ActionGraph,
};

const commonBuff27ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff27: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Skill/Character/Common/Affixes/Vulnerable',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableSpell',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableFire',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableCryst',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse',
    'Skill/Character/Common/Affixes/Vulnerable/VulnerableNatural',
  ],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_vulnerable_spell_default_child',
    duration: 0.8,
    rate: 0.2,
  },
  attributeModifiers: [
    {
      attribute: 'heatVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'electricVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'cryoVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
    {
      attribute: 'natureVulnerabilityIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff27ActionGraph,
};

const commonBuff28ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff28: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_spell_vulnerable',
    iconPath: '/icons/icon_battle_affix_spell_vulnerable.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff28ActionGraph,
};

const commonBuff29ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: { blackboardKey: 'child_buff_id' },
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff29: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/Affixes/Weak'],
  extendTags: [],
  blackboard: {
    child_buff_id: 'buff_common_affixes_weak_default_child',
    duration: 0.8,
    rate: -0.2,
  },
  attributeModifiers: [
    {
      attribute: 'weaknessDamageMultiplier',
      slot: 'finalMultiplier',
      value: { blackboardKey: 'rate' },
    },
  ],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff29ActionGraph,
};

const commonBuff30ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff30: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_weak',
    iconPath: '/icons/icon_battle_affix_weak.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: -0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff30ActionGraph,
};

const commonBuff31ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'blackboard', key: 'burning_atk_scale' },
            takeAttackSnapshot: true,
            tags: ['fireAbnormal'],
            features: ['dot'],
            instantAttributeModifiers: [
              {
                targetSide: 'attacker',
                attribute: 'criticalRate',
                slot: 'finalMultiplier',
                value: { kind: 'constant', value: 0 },
                attributeTiming: 'runtime',
              },
            ],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff31: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 9999,
  applyTags: [],
  extendTags: [],
  blackboard: { burning_atk_scale: 0, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'dealDamage_1' } },
  actionGraph: commonBuff31ActionGraph,
};

const commonBuff32ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_cryst_cryst_frozen_triggered_do',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              count: 'count',
              duration: 'duration',
              consumed_type: 'consumed_type',
              consumed_layer: 'consumed_layer',
            },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration',
            operation: 'add',
            value: { kind: 'blackboard', key: 'extra_duration' },
          },
        },
        next: 'applyBuff_1',
      },
      readSkillSettingData_3: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [6, 7, 8, 9],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'duration',
              },
            ],
          },
        },
        next: 'modifyActionValue_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff32: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { consumed_layer: 0, consumed_type: 2, count: 1, duration: 0, extra_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'readSkillSettingData_3' } },
  actionGraph: commonBuff32ActionGraph,
};

const commonBuff33ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_frozen',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { duration: 'duration' },
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_cryst_triggered_fx',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      storeSourceAttributeValue_4: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'cryoAbnormalDamageIncrease' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'phy_dmg_up' },
            base: { kind: 'blackboard', key: 'phy_dmg_up' },
            targetKey: 'final_phy_dmg_up',
          },
        },
        next: 'applyBuff_3',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff33: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'cryst_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_frozen',
    iconPath: '/icons/icon_battle_frozen.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Cryst',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttachedAndAbnormal' },
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Frozen'],
  extendTags: [],
  blackboard: { count: 1, duration: 5, final_phy_dmg_up: 0, phy_dmg_up: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'storeSourceAttributeValue_4' },
    enable: { $sequence: 'conditional_2' },
  },
  actionGraph: commonBuff33ActionGraph,
};

const commonBuff34ActionGraph = {
  main: {
    nodes: {
      triggerSpellBurst_1: {
        action: { kind: 'triggerSpellBurst', parameters: { burstType: 'Cryst' } },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'cryo',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['cryoBurst'],
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
                values: [1.6, 1.6, 1.6, 1.6],
                column: { kind: 'constant', value: 1 },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'dealDamage_2',
      },
      withActionBlackboardScope_4: {
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
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'triggerSpellBurst_1' },
        },
        next: 'withActionBlackboardScope_4',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff34: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/CrystBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_5' } },
  actionGraph: commonBuff34ActionGraph,
};

const commonBuff35ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff35: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff35ActionGraph,
};

const commonBuff36ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['cryoAbnormal'],
            features: ['shatter'],
          },
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
  maxStackCount: 0,
  durationSeconds: 5,
  applyTags: ['Skill/Character/Common/SpellStatusSpecial/Shatter'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'dealDamage_1' } },
  actionGraph: commonBuff36ActionGraph,
};

const commonBuff37ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff37: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Status/DodgeDamageImmune',
    'Status/SkillDamageImmune',
    'Immune/SpellInflictOnChar/All',
  ],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff37ActionGraph,
};

const commonBuff38ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff38: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Status/DodgeDamageImmune', 'Status/SkillDamageImmune', 'Status/NoBehitVFX'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff38ActionGraph,
};

const commonBuff39ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff39: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Status/DodgeDamageImmune',
    'Status/SkillDamageImmune',
    'Immune/SpellInflictOnChar/All',
  ],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff39ActionGraph,
};

const commonBuff40ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_dash_immune',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: {
              dodgeSkillId: 'dodgeSkillId',
              vfx_buff_name: 'vfx_buff_name',
            },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff40: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.33,
  applyTags: ['3C/Dash'],
  extendTags: [],
  blackboard: { dodgeSkillId: 0, vfx_buff_name: 'buff_common_dash_perfect_vfx_common' },
  attributeModifiers: [{ attribute: 'TurnRateScalar', slot: 'addition', value: 2 }],
  lifecycleSequences: { enable: { $sequence: 'conditional_2' } },
  actionGraph: commonBuff40ActionGraph,
};

const commonBuff41ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'DodgeSucceedMarker',
            durationSeconds: { kind: 'constant', value: 0.2 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      castSkillDuringAction_2: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'dodgeSkillId' },
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'createTimedMarker_1',
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/DashSucceed',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -72.53975,
                  outTangent: -72.53975,
                  weightedMode: 2,
                  inWeight: 0.333333343,
                  outWeight: 0.178571433,
                },
                {
                  time: 0.05,
                  value: 0.06,
                  inTangent: -0.5260364,
                  outTangent: 0,
                  weightedMode: 3,
                  inWeight: 0.702380955,
                  outWeight: 0.5454897,
                },
                {
                  time: 0.9,
                  value: 0.06,
                  inTangent: 0,
                  outTangent: 1.00010693,
                  weightedMode: 3,
                  inWeight: 0.333333343,
                  outWeight: 0.575891,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 79.09226,
                  outTangent: 79.09226,
                  weightedMode: 1,
                  inWeight: 0.09672759,
                  outWeight: 0.333333343,
                },
              ],
            },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: 'castSkillDuringAction_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -70.83176,
                  outTangent: -70.83176,
                  weightedMode: 3,
                  inWeight: 0,
                  outWeight: 0.0166944731,
                },
                {
                  time: 0.05,
                  value: 0.052905634,
                  inTangent: 0.02399042,
                  outTangent: 0.02399042,
                  weightedMode: 3,
                  inWeight: 0.319141746,
                  outWeight: 0.5768854,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.976826,
                  outTangent: 4.976826,
                  weightedMode: 1,
                  inWeight: 0.209324434,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: ['caster'],
          },
        },
        next: 'startTimeDilation_3',
      },
      changeResourceByActionValue_5: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'startTimeDilation_4',
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_common_dash_behit_listener'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_dash_succeed_immune',
            target: 'buffSource',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_6',
      },
      recordPerfectDodge_8: {
        action: { kind: 'recordPerfectDodge', parameters: {} },
        next: 'applyBuff_7',
      },
      recoverDashEnergy_9: {
        action: {
          kind: 'recoverDashEnergy',
          parameters: { amount: { kind: 'constant', value: 0.5 }, canRecoverWhenOverdraft: true },
        },
        next: 'recordPerfectDodge_8',
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'all',
              conditions: [
                { kind: 'casterControlled' },
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'buffOwner',
                    markerId: 'DodgeSucceedMarker',
                  },
                },
              ],
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'changeResourceByActionValue_5' },
        },
        next: 'recoverDashEnergy_9',
      },
      createTimedMarker_11: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'DodgeSucceedMarker',
            durationSeconds: { kind: 'constant', value: 0.5 },
            autoFinishByAction: false,
          },
        },
        next: null,
      },
      castSkillDuringAction_12: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'dodgeSkillId' },
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'createTimedMarker_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/DashSucceed',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.3,
                  inTangent: -5.76221943,
                  outTangent: -5.76221943,
                  weightedMode: 2,
                  inWeight: 0.333333343,
                  outWeight: 0.173611075,
                },
                {
                  time: 0.15,
                  value: 0.1,
                  inTangent: 0.008440543,
                  outTangent: 0.008440543,
                  weightedMode: 3,
                  inWeight: 0.333333343,
                  outWeight: 0.765405953,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 6.63499832,
                  outTangent: 6.63499832,
                  weightedMode: 1,
                  inWeight: 0.176820889,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: 'castSkillDuringAction_12',
      },
      startTimeDilation_14: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.05,
                  inTangent: 0.0307726,
                  outTangent: 0.0307726,
                  weightedMode: 3,
                  inWeight: 0,
                  outWeight: 0.5975794,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.976826,
                  outTangent: 4.976826,
                  weightedMode: 1,
                  inWeight: 0.198941588,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            ignoredTargets: ['caster'],
          },
        },
        next: 'startTimeDilation_13',
      },
      changeResourceByActionValue_15: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'startTimeDilation_14',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'all',
              conditions: [
                { kind: 'casterControlled' },
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'buffOwner',
                    markerId: 'DodgeSucceedMarker',
                  },
                },
              ],
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'changeResourceByActionValue_15' },
        },
        next: 'recoverDashEnergy_9',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'eventProjectileIgnoreImmuneLevelCompare',
              operator: 'lessOrEqual',
              value: 0,
            },
          },
          whenTrue: { $sequence: 'conditional_20' },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'eventProjectilePerfectDodgeCooldownEquals', value: false },
          },
          whenTrue: { $sequence: 'conditional_21' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff41: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 7, dodgeSkillId: 0, vfx_buff_name: 'buff_common_dash_perfect_vfx_common' },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_10' } },
    { event: 'beforeHitByProjectile', priority: 0, sequence: { $sequence: 'conditional_22' } },
  ],
  actionGraph: commonBuff41ActionGraph,
};

const commonBuff42ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_full_immune_weak',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_dash_behit_listener',
            target: 'buffOwner',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: {
              dodgeSkillId: 'dodgeSkillId',
              vfx_buff_name: 'vfx_buff_name',
            },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'entityTagMatch',
              target: 'buffOwner',
              tagQueryType: 'exceptAny',
              tags: ['Status/CanNotPerfectDodge'],
            },
          },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'casterControlled' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'conditional_4' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
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
        next: 'withActionBlackboardScope_5',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff42: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  applyTags: ['Status/DashImmune'],
  extendTags: [],
  blackboard: { dodgeSkillId: 0, vfx_buff_name: 'buff_common_dash_perfect_vfx_common' },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'withActionBlackboardScope_6' } },
  actionGraph: commonBuff42ActionGraph,
};

const commonBuff43ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_full_immune_weak',
            target: 'buffOwner',
            source: 'buffOwner',
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

const commonBuff43: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 0.33,
  applyTags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff43ActionGraph,
};

const commonBuff44ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'blackboard', key: 'duration' },
            slot: 'TimeDilation/Layer/Entity/Frozen',
            priority: 50,
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
            targets: ['enemy'],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff44: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Status/Immobilized/Frozen', 'Status/DisableFaceToAttacker'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'startTimeDilation_1' } },
  actionGraph: commonBuff44ActionGraph,
};

const commonBuff45ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_burning_status',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { burning_atk_scale: 'burning_atk_scale' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'burning_atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
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
                values: [0.24, 0.36, 0.48, 0.6],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'burning_atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'modifyActionValue_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_fire_triggered_fx',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
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
          body: { $sequence: 'readSkillSettingData_3' },
        },
        next: 'withActionBlackboardScope_5',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff45: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'fire_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_burning',
    iconPath: '/icons/icon_battle_burning.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Fire',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttachedAndAbnormal' },
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Burning'],
  extendTags: [],
  blackboard: { burning_atk_scale: 0, count: 1, duration: 10, extra_scaling: 1 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'withActionBlackboardScope_6' },
    enable: { $sequence: 'applyBuff_1' },
  },
  actionGraph: commonBuff45ActionGraph,
};

const commonBuff46ActionGraph = {
  main: {
    nodes: {
      triggerSpellBurst_1: {
        action: { kind: 'triggerSpellBurst', parameters: { burstType: 'Fire' } },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['fireBurst'],
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
                values: [1.6, 1.6, 1.6, 1.6],
                column: { kind: 'constant', value: 1 },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'dealDamage_2',
      },
      withActionBlackboardScope_4: {
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
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'triggerSpellBurst_1' },
        },
        next: 'withActionBlackboardScope_4',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff46: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/FireBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_5' } },
  actionGraph: commonBuff46ActionGraph,
};

const commonBuff47ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff47: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff47ActionGraph,
};

const commonBuff48ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_do_frozen',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff48: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: commonBuff48ActionGraph,
};

const commonBuff49ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff49: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Immune/Damage',
    'Immune/Stunned',
    'Immune/Frozen',
    'Immune/Airborne',
    'Immune/KnockDown',
    'Immune/KnockBack',
    'Immune/Pull',
    'Immune/Poise',
    'Status/DodgeDamageImmune',
    'Status/SkillDamageImmune',
    'Immune/SpellInflictOnChar/All',
  ],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff49ActionGraph,
};

const commonBuff50ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff50: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Immune/Stunned',
    'Immune/Frozen',
    'Immune/Airborne',
    'Immune/KnockDown',
    'Immune/KnockBack',
    'Immune/Pull',
    'Immune/Poise',
    'Status/DodgeDamageImmune',
    'Status/SkillDamageImmune',
    'Immune/SpellInflictOnChar/All',
  ],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff50ActionGraph,
};

const commonBuff51ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff51: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [
    'Immune/Stunned',
    'Immune/Airborne',
    'Immune/KnockDown',
    'Immune/KnockBack',
    'Immune/Pull',
    'Immune/Poise',
    'Status/DodgeDamageImmune',
    'Immune/SpellInflictOnChar/PulseInflictOnChar/Weak',
    'Immune/SpellInflictOnChar/FireInflictOnChar/Weak',
    'Immune/SpellInflictOnChar/CrystInflictOnChar/Weak',
    'Immune/SpellInflictOnChar/NaturalInflictOnChar/Weak',
  ],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff51ActionGraph,
};

const commonBuff52ActionGraph = {
  main: {
    nodes: {
      refreshCurrentBuffAttributeModifiers_7: {
        action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'start_def_decrease' },
          },
        },
        next: 'refreshCurrentBuffAttributeModifiers_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'def_decrease', fallback: 0 },
              operator: 'greater',
              right: { kind: 'blackboard', key: 'start_def_decrease', fallback: 0 },
            },
          },
          whenTrue: { $sequence: 'modifyActionValue_8' },
        },
        next: null,
      },
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'max_def_decrease' },
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
              left: { kind: 'blackboard', key: 'def_decrease', fallback: 0 },
              operator: 'greater',
              right: { kind: 'blackboard', key: 'max_def_decrease', fallback: 0 },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_1' },
        },
        next: 'refreshCurrentBuffAttributeModifiers_7',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'tick', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'conditional_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'add',
            value: { kind: 'blackboard', key: 'def_decrease_tick' },
          },
        },
        next: 'modifyActionValue_4',
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'def_decrease', fallback: 0 },
              operator: 'greater',
              right: { kind: 'blackboard', key: 'max_def_decrease', fallback: 0 },
            },
          },
          whenTrue: { $sequence: 'modifyActionValue_5' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff52: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'natural_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_corrupt',
    iconPath: '/icons/icon_battle_corrupt.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Natural',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttachedAndAbnormal' },
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
  extendTags: [],
  blackboard: {
    additional_def_decrease: 0,
    count: 1,
    def_decrease: 0,
    def_decrease_tick: 0,
    duration: 0,
    extra_scaling: 1,
    max_def_decrease: 0,
    start_def_decrease: 0,
    tick: 0,
  },
  attributeModifiers: [
    {
      attribute: 'PhysicalResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'def_decrease' },
    },
    {
      attribute: 'PhysicalResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'additional_def_decrease' },
    },
    { attribute: 'FireResistance', slot: 'baseAddition', value: { blackboardKey: 'def_decrease' } },
    {
      attribute: 'FireResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'additional_def_decrease' },
    },
    {
      attribute: 'PulseResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'def_decrease' },
    },
    {
      attribute: 'PulseResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'additional_def_decrease' },
    },
    {
      attribute: 'CrystResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'def_decrease' },
    },
    {
      attribute: 'CrystResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'additional_def_decrease' },
    },
    {
      attribute: 'NaturalResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'def_decrease' },
    },
    {
      attribute: 'NaturalResistance',
      slot: 'baseAddition',
      value: { blackboardKey: 'additional_def_decrease' },
    },
  ],
  lifecycleSequences: {
    start: { $sequence: 'conditional_9' },
    trigger: { $sequence: 'conditional_6' },
  },
  actionGraph: commonBuff52ActionGraph,
};

const commonBuff53ActionGraph = {
  main: {
    nodes: {
      readBuffBlackboard_1: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
            },
            desiredKey: 'def_decrease',
            outputKey: 'def_decrease',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_natural_natural_corrupt_do',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              def_decrease: 'def_decrease',
              max_def_decrease: 'max_def_decrease',
              def_decrease_tick: 'def_decrease_tick',
              start_def_decrease: 'start_def_decrease',
              duration: 'duration',
              consumed_type: 'consumed_type',
              consumed_layer: 'consumed_layer',
              count: 'count',
            },
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffStackCompare',
              target: 'buffOwner',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'readBuffBlackboard_1' },
        },
        next: 'applyBuff_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'start_def_decrease',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
          },
        },
        next: 'conditional_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'max_def_decrease',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
          },
        },
        next: 'modifyActionValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease_tick',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
          },
        },
        next: 'modifyActionValue_5',
      },
      readSkillSettingData_7: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [-0.84, -1.12, -1.4, -1.68],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'def_decrease_tick',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [-12, -16, -20, -24],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'max_def_decrease',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [-3.6, -4.8, -6, -7.2],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'start_def_decrease',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
            ],
          },
        },
        next: 'modifyActionValue_6',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff53: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {
    additional_def_decrease: 0,
    consumed_layer: 0,
    consumed_type: 3,
    count: 1,
    def_decrease: 0,
    def_decrease_tick: 0,
    def_decrease_tick_final: 0,
    duration: 0,
    extra_scaling: 1,
    max_def_decrease: 0,
    max_def_decrease_final: 0,
    start_def_decrease: 0,
    tick: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'readSkillSettingData_7' } },
  actionGraph: commonBuff53ActionGraph,
};

const commonBuff54ActionGraph = {
  main: {
    nodes: {
      triggerSpellBurst_1: {
        action: { kind: 'triggerSpellBurst', parameters: { burstType: 'Natural' } },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['natureBurst'],
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
                values: [1.6, 1.6, 1.6, 1.6],
                column: { kind: 'constant', value: 1 },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'dealDamage_2',
      },
      withActionBlackboardScope_4: {
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
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'triggerSpellBurst_1' },
        },
        next: 'withActionBlackboardScope_4',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff54: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/NaturalBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_5' } },
  actionGraph: commonBuff54ActionGraph,
};

const commonBuff55ActionGraph = {
  main: {
    nodes: {
      triggerSpellBurst_1: {
        action: { kind: 'triggerSpellBurst', parameters: { burstType: 'Natural' } },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'nature',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['natureBurst'],
          },
        },
        next: null,
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atk_scale' },
            right: { kind: 'blackboard', key: 'damage_enhence' },
          },
        },
        next: 'dealDamage_2',
      },
      readSkillSettingData_4: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [1.6, 1.6, 1.6, 1.6],
                column: { kind: 'constant', value: 1 },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'calculateActionValue_3',
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'readSkillSettingData_4' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
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
          body: { $sequence: 'triggerSpellBurst_1' },
        },
        next: 'withActionBlackboardScope_5',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff55: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 0.35,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/NaturalBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, consume_natural: 0, damage_enhence: 1, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_6' } },
  actionGraph: commonBuff55ActionGraph,
};

const commonBuff56ActionGraph = {
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

const commonBuff56: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ratio: 1, usp_everyone: 6.5, usp_self: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_1' } },
  actionGraph: commonBuff56ActionGraph,
};

const commonBuff57ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'blackboard', key: 'duration' },
            slot: 'TimeDilation/Layer/Entity/Frozen',
            priority: 50,
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
            targets: ['enemy'],
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
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_talent_1_tirgger',
            target: 'partyExceptCaster',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration_dynamic', atk_up: 'atk_up_dynamic' },
          },
        },
        next: null,
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration_dynamic',
            operation: 'multiply',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_up_dynamic',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'teammate_ratio' },
          },
        },
        next: 'modifyActionValue_5',
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential2'] },
            desiredKey: 'ratio',
            outputKey: 'teammate_ratio',
          },
        },
        next: 'modifyActionValue_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0003_endminf_potential2'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'readBuffBlackboard_7' },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0003_endminf_talent_1_tirgger',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration_dynamic', atk_up: 'atk_up_dynamic' },
          },
        },
        next: 'conditional_8',
      },
      readBuffBlackboard_10: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_talent_1'] },
            desiredKey: 'duration',
            outputKey: 'duration_dynamic',
          },
        },
        next: 'applyBuff_9',
      },
      readBuffBlackboard_11: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_talent_1'] },
            desiredKey: 'atk_up',
            outputKey: 'atk_up_dynamic',
          },
        },
        next: 'readBuffBlackboard_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0003_endminf_talent_1'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'readBuffBlackboard_11' },
        },
        next: null,
      },
      changeResourceByActionValue_13: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'endmin_usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
            ignoreUltimateEnergyGainMultiplier: true,
          },
        },
        next: null,
      },
      readBuffBlackboard_14: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'actionInputTarget',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential3'] },
            desiredKey: 'usp',
            outputKey: 'endmin_usp',
          },
        },
        next: 'changeResourceByActionValue_13',
      },
      conditional_15: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0003_endminf_potential3'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          },
          whenTrue: { $sequence: 'readBuffBlackboard_14' },
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
          body: { $sequence: 'conditional_15' },
        },
        next: null,
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
          body: { $sequence: 'conditional_12' },
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
          body: { $sequence: 'dealDamage_3' },
        },
        next: 'withActionBlackboardScope_17',
      },
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      withActionBlackboardScope_29: {
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
          body: { $sequence: 'conditional_12' },
        },
        next: null,
      },
      withActionBlackboardScope_30: {
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
          body: { $sequence: 'dealDamage_19' },
        },
        next: 'withActionBlackboardScope_29',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff57: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_skill_endmin_debuff',
    iconPath: '/icons/icon_skill_endmin_debuff.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: ['Status/DisableFaceToAttacker'],
  extendTags: [],
  blackboard: {
    atk_scale_trigger: 0,
    atk_up_dynamic: 0,
    duration: 9999,
    duration_dynamic: 0,
    endmin_usp: 0,
    teammate_ratio: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'conditional_2' } },
  igniteEventResponses: [
    {
      igniteType: 'EndminUlt',
      finishAfterIgnited: true,
      sequence: { $sequence: 'withActionBlackboardScope_18' },
    },
    {
      igniteType: 'PhysicalStatus',
      finishAfterIgnited: true,
      sequence: { $sequence: 'withActionBlackboardScope_30' },
    },
    {
      igniteType: 'NoGuard',
      finishAfterIgnited: true,
      sequence: { $sequence: 'withActionBlackboardScope_30' },
    },
  ],
  actionGraph: commonBuff57ActionGraph,
};

const commonBuff58ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff58: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { dmg_up: 0.3 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'dmg_up' },
        },
      ],
    },
  ],
  actionGraph: commonBuff58ActionGraph,
};

const commonBuff59ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff59: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  applyTags: [
    'Status/DisableDash',
    'Status/CantSwitchOutCenter',
    'Status/DisableNormalSkill',
    'Status/DisableCastComboSkill',
    'Status/Unjumpable',
  ],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff59ActionGraph,
};

const commonBuff60ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'real_duration',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'duration' },
          },
        },
        next: null,
      },
      readSkillSettingData_2: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [12, 18, 24, 30],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'real_duration',
              },
            ],
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_pulse_pulse_conduct_triggered_do',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'real_duration',
              count: 'count',
              consumed_type: 'consumed_type',
              consumed_layer: 'consumed_layer',
              extra_scaling: 'extra_scaling',
            },
          },
        },
        next: null,
      },
      applyElementalReaction_4: {
        action: {
          kind: 'applyElementalReaction',
          parameters: {
            reaction: 'electrification',
            target: 'enemy',
            durationSeconds: { kind: 'blackboard', key: 'real_duration' },
            effectiveness: 1,
          },
        },
        next: 'applyBuff_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'duration', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            alwaysNext: true,
          },
          whenTrue: { $sequence: 'modifyActionValue_1' },
          whenFalse: { $sequence: 'readSkillSettingData_2' },
        },
        next: 'applyElementalReaction_4',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff60: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {
    consumed_layer: 0,
    consumed_type: 1,
    count: 1,
    duration: 0,
    extra_scaling: 1,
    real_duration: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'conditional_5' } },
  actionGraph: commonBuff60ActionGraph,
};

const commonBuff61ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_pulse_triggered_fx',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_spell_resistance_decrease',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
          },
        },
        next: 'applyBuff_1',
      },
      storeSourceAttributeValue_3: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'electricAbnormalDamageIncrease' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'spell_resistance_decrease' },
            base: { kind: 'blackboard', key: 'spell_resistance_decrease' },
            targetKey: 'final_spell_resistance_decrease',
          },
        },
        next: 'modifyActionValue_2',
      },
      readSkillSettingData_4: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [0.12, 0.16, 0.2, 0.24],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'spell_resistance_decrease',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
            ],
          },
        },
        next: 'storeSourceAttributeValue_3',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff61: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'pulse_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_conduct',
    iconPath: '/icons/icon_battle_conduct.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Pulse',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttachedAndAbnormal' },
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Conduct'],
  extendTags: [],
  blackboard: {
    count: 1,
    duration: 5,
    extra_scaling: 1,
    final_spell_resistance_decrease: 0,
    spell_resistance_decrease: 0.2,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['heat'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'final_spell_resistance_decrease' },
        },
      ],
    },
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['electric'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'final_spell_resistance_decrease' },
        },
      ],
    },
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['cryo'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'final_spell_resistance_decrease' },
        },
      ],
    },
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['nature'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'final_spell_resistance_decrease' },
        },
      ],
    },
  ],
  lifecycleSequences: { start: { $sequence: 'readSkillSettingData_4' } },
  actionGraph: commonBuff61ActionGraph,
};

const commonBuff62ActionGraph = {
  main: {
    nodes: {
      triggerSpellBurst_1: {
        action: { kind: 'triggerSpellBurst', parameters: { burstType: 'Pulse' } },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: ['electricBurst'],
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
                values: [1.6, 1.6, 1.6, 1.6],
                column: { kind: 'constant', value: 1 },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'dealDamage_2',
      },
      withActionBlackboardScope_4: {
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
        next: null,
      },
      withActionBlackboardScope_5: {
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
          body: { $sequence: 'triggerSpellBurst_1' },
        },
        next: 'withActionBlackboardScope_4',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff62: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 10,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/PulseBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 20 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_5' } },
  actionGraph: commonBuff62ActionGraph,
};

const commonBuff63ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff63: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff63ActionGraph,
};

const commonBuff64ActionGraph = {
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
            blackboardAssignments: { skip_handle_cryst_break: { kind: 'constant', value: 1 } },
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: [],
            features: ['physicalInfliction'],
            stagger: { kind: 'blackboard', key: 'poise' },
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
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
              {
                values: [10, 10, 10, 10],
                column: { kind: 'constant', value: 1 },
                storeKey: 'poise',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.005 } },
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
          parameters: { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff64: SkillBuffDefinition = {
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
  actionGraph: commonBuff64ActionGraph,
};

const commonBuff65ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: [],
            features: ['physicalInfliction'],
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: { target: 'buffOwner', buffIds: ['buff_physical_no_guard'], reason: 'early' },
        },
        next: 'dealDamage_1',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'dmg_multiplier' },
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
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
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
          parameters: { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' },
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
          parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
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
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
              operator: 'less',
              right: { kind: 'constant', value: 0.5 },
            },
          },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff65: SkillBuffDefinition = {
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
  blackboard: { atk_scale: 1, count: 0, dmg_multiplier: 1, duration: 3, ignore_hit_effect: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_18' } },
  actionGraph: commonBuff65ActionGraph,
};

const commonBuff66ActionGraph = {
  main: {
    nodes: {
      refreshCurrentBuffAttributeModifiers_1: {
        action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'physical_res_down',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'extra_scaling' },
          },
        },
        next: 'refreshCurrentBuffAttributeModifiers_1',
      },
      readSkillSettingData_3: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [0.12, 0.16, 0.2, 0.24],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'physical_res_down',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [1, 1.5, 2, 2.5],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'modifyActionValue_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
          },
        },
        next: 'readSkillSettingData_3',
      },
      applyBuff_5: {
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
      igniteBuffs_6: {
        action: {
          kind: 'igniteBuffs',
          parameters: { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: [],
            features: ['physicalInfliction'],
          },
        },
        next: null,
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: { target: 'buffOwner', buffIds: ['buff_physical_no_guard'], reason: 'early' },
        },
        next: 'dealDamage_7',
      },
      startTimeDilation_13: {
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
      startTimeDilation_12: {
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
      startTimeDilation_11: {
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
      startTimeDilation_10: {
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
      startTimeDilation_9: {
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
      switch_14: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_10' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_11' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_12' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_13' },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_16: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey: 'native-buff-callback:4',
            lifetime: 'execution',
            alwaysNext: true,
            shareParentBlackboard: true,
            initialValues: {},
            inheritParent: true,
          },
          body: { $sequence: 'switch_14' },
        },
        next: null,
      },
      withActionBlackboardScope_17: {
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
          body: { $sequence: 'finishBuffsById_8' },
        },
        next: 'withActionBlackboardScope_16',
      },
      withActionBlackboardScope_18: {
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
          body: { $sequence: 'igniteBuffs_6' },
        },
        next: 'withActionBlackboardScope_17',
      },
      withActionBlackboardScope_19: {
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
          body: { $sequence: 'applyBuff_5' },
        },
        next: 'withActionBlackboardScope_18',
      },
      withActionBlackboardScope_20: {
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
          body: { $sequence: 'readBuffStackCount_4' },
        },
        next: 'withActionBlackboardScope_19',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff66: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'fracture',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 0,
  presentation: {
    visible: true,
    iconId: 'icon_battle_fracture',
    iconPath: '/icons/icon_battle_fracture.webp',
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
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttachedAndAbnormal' },
  },
  applyTags: ['Skill/Character/Common/PhysicalStatus/FractureStatus'],
  extendTags: [],
  blackboard: { atk_scale: 0, count: 0, duration: 15, extra_scaling: 1, physical_res_down: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'physical_res_down' },
        },
      ],
    },
  ],
  lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_20' } },
  actionGraph: commonBuff66ActionGraph,
};

const commonBuff67ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_physical_do_fracture',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          },
        },
        next: null,
      },
      readSkillSettingData_2: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [12, 18, 24, 30],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'duration',
              },
            ],
          },
        },
        next: 'applyBuff_1',
      },
      readBuffStackCount_3: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
          },
        },
        next: 'readSkillSettingData_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff67: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 0,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, duration: 15 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'readBuffStackCount_3' } },
  actionGraph: commonBuff67ActionGraph,
};

const commonBuff68ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      startTimeDilation_2: {
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
      startTimeDilation_3: {
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
      startTimeDilation_4: {
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
      startTimeDilation_5: {
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
      switch_6: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_1' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_2' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_3' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_4' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_5' },
            },
          ],
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_cryst_triggered_physical_break',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { atk_scale: 'atk_scale' },
          },
        },
        next: 'switch_6',
      },
      finishBuffsByTag_8: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            target: 'buffOwner',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
            reason: 'early',
          },
        },
        next: 'applyBuff_7',
      },
      readSkillSettingData_9: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [2.4, 3.6, 4.8, 6],
                column: { kind: 'blackboard', key: 'count' },
                storeKey: 'atk_scale',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'finishBuffsByTag_8',
      },
      readBuffBlackboard_10: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
            },
            desiredKey: 'count',
            outputKey: 'count',
          },
        },
        next: 'readSkillSettingData_9',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff68: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 10,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, count: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'readBuffBlackboard_10' } },
  actionGraph: commonBuff68ActionGraph,
};

const commonBuff69ActionGraph = {
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
            blackboardAssignments: { skip_handle_cryst_break: { kind: 'constant', value: 1 } },
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'blackboard', key: 'atk_scale' },
            tags: [],
            features: ['knockDown', 'physicalInfliction'],
            stagger: { kind: 'blackboard', key: 'poise' },
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
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
              {
                values: [10, 10, 10, 10],
                column: { kind: 'constant', value: 1 },
                storeKey: 'poise',
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.005 } },
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
          parameters: { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff69: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/PhysicalStatus/KnockdownStatus'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 3, poise: 10 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
  actionGraph: commonBuff69ActionGraph,
};

const commonBuff70ActionGraph = {
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
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
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
          parameters: { target: 'buffOwner', source: 'buffOwner', igniteType: 'NoGuard' },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'currentBuffStackCompare',
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 2 },
            },
          },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff70: SkillBuffDefinition = {
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
  actionGraph: commonBuff70ActionGraph,
};

const commonBuff71ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff71: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 100,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/NoGuardFake'],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: commonBuff71ActionGraph,
};
export const commonBuffDefinitions: OperatorBuffDefinitions = Object.freeze({
  buff_common_affixes_combo_trigger: commonBuff1,
  buff_common_affixes_enhance_crystal: commonBuff2,
  buff_common_affixes_enhance_fire: commonBuff3,
  buff_common_affixes_enhance_natural: commonBuff4,
  buff_common_affixes_enhance_natural_default_child: commonBuff5,
  buff_common_affixes_enhance_pulse: commonBuff6,
  buff_common_affixes_enhance_pulse_default_child: commonBuff7,
  buff_common_affixes_enhance_spell: commonBuff8,
  buff_common_affixes_enhance_spell_default_child: commonBuff9,
  buff_common_affixes_shelter: commonBuff10,
  buff_common_affixes_shelter_default_child: commonBuff11,
  buff_common_affixes_skillimbue: commonBuff12,
  buff_common_affixes_skillimbue_atk: commonBuff13,
  buff_common_affixes_slow: commonBuff14,
  buff_common_affixes_slow_default_child: commonBuff15,
  buff_common_affixes_speedup: commonBuff16,
  buff_common_affixes_vulnerable_crystal: commonBuff17,
  buff_common_affixes_vulnerable_crystal_default_child: commonBuff18,
  buff_common_affixes_vulnerable_crystal_lizhiyan_child: commonBuff19,
  buff_common_affixes_vulnerable_fire: commonBuff20,
  buff_common_affixes_vulnerable_natural: commonBuff21,
  buff_common_affixes_vulnerable_natural_lizhiyan_child: commonBuff22,
  buff_common_affixes_vulnerable_physical: commonBuff23,
  buff_common_affixes_vulnerable_physical_default_child: commonBuff24,
  buff_common_affixes_vulnerable_pulse: commonBuff25,
  buff_common_affixes_vulnerable_pulse_default_child: commonBuff26,
  buff_common_affixes_vulnerable_spell: commonBuff27,
  buff_common_affixes_vulnerable_spell_default_child: commonBuff28,
  buff_common_affixes_weak: commonBuff29,
  buff_common_affixes_weak_default_child: commonBuff30,
  buff_common_burning_status: commonBuff31,
  buff_common_cryst_cryst_frozen_triggered: commonBuff32,
  buff_common_cryst_cryst_frozen_triggered_do: commonBuff33,
  buff_common_cryst_cryst_triggered: commonBuff34,
  buff_common_cryst_triggered_fx: commonBuff35,
  buff_common_cryst_triggered_physical_break: commonBuff36,
  buff_common_damage_immune_medium: commonBuff37,
  buff_common_damage_immune_talent: commonBuff38,
  buff_common_damage_immune_ult_skill: commonBuff39,
  buff_common_dash: commonBuff40,
  buff_common_dash_behit_listener: commonBuff41,
  buff_common_dash_immune: commonBuff42,
  buff_common_dash_succeed_immune: commonBuff43,
  buff_common_do_frozen: commonBuff44,
  buff_common_fire_fire_burning_triggered: commonBuff45,
  buff_common_fire_fire_triggered: commonBuff46,
  buff_common_fire_triggered_fx: commonBuff47,
  buff_common_frozen: commonBuff48,
  buff_common_full_immune: commonBuff49,
  buff_common_full_immune_medium: commonBuff50,
  buff_common_full_immune_weak: commonBuff51,
  buff_common_natural_natural_corrupt_do: commonBuff52,
  buff_common_natural_natural_corrupt_triggered: commonBuff53,
  buff_common_natural_natural_triggered: commonBuff54,
  buff_common_natural_natural_triggered_typhoea: commonBuff55,
  buff_common_obtain_ultimate_sp: commonBuff56,
  buff_common_originum_frozen: commonBuff57,
  buff_common_poise_break_damage_taken_scale: commonBuff58,
  buff_common_power_attack_disable_cast_skill: commonBuff59,
  buff_common_pulse_pulse_conduct_triggered: commonBuff60,
  buff_common_pulse_pulse_conduct_triggered_do: commonBuff61,
  buff_common_pulse_pulse_triggered: commonBuff62,
  buff_common_pulse_triggered_fx: commonBuff63,
  buff_physical_airborne: commonBuff64,
  buff_physical_crushed: commonBuff65,
  buff_physical_do_fracture: commonBuff66,
  buff_physical_fracture: commonBuff67,
  buff_physical_handle_cryst_break: commonBuff68,
  buff_physical_knockdown: commonBuff69,
  buff_physical_no_guard: commonBuff70,
  buff_physical_no_guard_fake: commonBuff71,
});
