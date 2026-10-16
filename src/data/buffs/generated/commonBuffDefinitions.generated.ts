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
            buffs: [
              {
                buffId: 'buff_common_affixes_skillimbue',
                copiedBlackboardAssignments: { imbue_scale: 'imbue_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
                column: { kind: 'valueNode', nodeId: 'data_1' },
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
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'readBuffStackCount_4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill', 'ultimate'] },
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
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    icon: 'endaxis:icons/icon_term_ba_combo',
    showInSquadIcon: true,
    nameKey: 'effects.name.link',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, imbue_scale: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff2ActionGraph,
};

const commonBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_cryst_enhance',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff3ActionGraph,
};

const commonBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff4: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_fire_enhance',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff6: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_natural_enhance',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff8: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_pulse_enhance',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff10: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff10ActionGraph,
};

const commonBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_spell_enhance',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff11ActionGraph,
};

const commonBuff12ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff12: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff12ActionGraph,
};

const commonBuff13ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff13: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_shelter',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: -0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff13ActionGraph,
};

const commonBuff14ActionGraph = {
  main: {
    nodes: {
      skillAffix_1: { action: { kind: 'skillAffix', parameters: {} }, next: null },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_skillimbue_atk',
                copiedBlackboardAssignments: { imbue_scale: 'imbue_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: 'skillAffix_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff14: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'imbue_scale', negate: true },
  maxStackCount: 4,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/Affixes/skillimbue'],
  extendTags: [],
  blackboard: { imbue_scale: 0.3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: commonBuff14ActionGraph,
};

const commonBuff15ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'real_imbue_scale',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      calculateActionValue_3: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'real_imbue_scale',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: 1.5 },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'calculateActionValue_3' },
          whenFalse: { $sequence: 'modifyActionValue_4' },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'ifElse_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_6',
      },
      skillAffix_1: { action: { kind: 'skillAffix', parameters: {} }, next: null },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'imbue_scale' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalSkill'] },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill'],
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'eventSkillCastMatchesBuffSource' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff15: SkillBuffDefinition = {
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
      condition: { $sequence: 'checkCondition_7' },
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
  lifecycleSequences: { enable: [{ $sequence: 'skillAffix_1' }] },
  actionGraph: commonBuff15ActionGraph,
};

const commonBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff16: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff16ActionGraph,
};

const commonBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff17: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_slow',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
    nameKey: 'effects.name.slow',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  actionGraph: commonBuff17ActionGraph,
};

const commonBuff18ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff18: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: false,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.speedup',
  },
  applyTags: ['Skill/Character/Common/Affixes/Speedup'],
  extendTags: [],
  blackboard: { child_buff_id: 'buff_common_affixes_speedup_default_child', duration: 0, rate: 0 },
  attributeModifiers: [
    { attribute: 'KeywordSpeedUpScalar', slot: 'baseAddition', value: { blackboardKey: 'rate' } },
  ],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff18ActionGraph,
};

const commonBuff19ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff19: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff19ActionGraph,
};

const commonBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff20: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_cryst_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff20ActionGraph,
};

const commonBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff21: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff21ActionGraph,
};

const commonBuff22ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff22: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff22ActionGraph,
};

const commonBuff23ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_physical_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
    icon: 'endaxis:icons/icon_battle_affix_pulse_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff29: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff29ActionGraph,
};

const commonBuff30ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff30: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate' },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_spell_vulnerable',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff30ActionGraph,
};

const commonBuff31ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'data_1' },
                copiedBlackboardAssignments: { rate: 'rate', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'string', expression: { blackboardKey: 'child_buff_id' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff31: SkillBuffDefinition = {
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
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff31ActionGraph,
};

const commonBuff32ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff32: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_weak',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: -0.2 },
  attributeModifiers: [],
  actionGraph: commonBuff32ActionGraph,
};

const commonBuff33ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'burning_atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff33: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 9999,
  applyTags: [],
  extendTags: [],
  blackboard: { burning_atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'dealDamage_1' }] },
  actionGraph: commonBuff33ActionGraph,
};

const commonBuff34ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_cryst_cryst_frozen_triggered_do',
                copiedBlackboardAssignments: { count: 'count', duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
                column: { kind: 'valueNode', nodeId: 'data_2' },
                storeKey: 'duration',
              },
            ],
          },
        },
        next: 'modifyActionValue_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'extra_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff34: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 1, duration: 0, extra_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'readSkillSettingData_3' }] },
  actionGraph: commonBuff34ActionGraph,
};

const commonBuff35ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_frozen',
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
            buffs: [{ buffId: 'buff_common_cryst_triggered_fx' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
            multiplier: { kind: 'valueNode', nodeId: 'data_2' },
            base: { kind: 'valueNode', nodeId: 'data_2' },
            targetKey: 'final_phy_dmg_up',
          },
        },
        next: 'applyBuff_3',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 20 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'phy_dmg_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff35: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'cryst_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_frozen',
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Cryst',
    nameKey: 'effects.name.solidification',
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Frozen'],
  extendTags: [],
  blackboard: { count: 1, duration: 5, final_phy_dmg_up: 0, phy_dmg_up: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'storeSourceAttributeValue_4' }],
    enable: [{ $sequence: 'checkCondition_2' }],
  },
  actionGraph: commonBuff35ActionGraph,
};

const commonBuff36ActionGraph = {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff36: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/CrystBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'triggerSpellBurst_1' }, { $sequence: 'readSkillSettingData_3' }],
  },
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
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff37ActionGraph,
};

const commonBuff38ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['cryoAbnormal'],
            features: ['shatter'],
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff38: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  applyTags: ['Skill/Character/Common/SpellStatusSpecial/Shatter'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'dealDamage_1' }] },
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
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff40: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Status/DodgeDamageImmune', 'Status/SkillDamageImmune', 'Status/NoBehitVFX'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  actionGraph: commonBuff40ActionGraph,
};

const commonBuff41ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff41: SkillBuffDefinition = {
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
  actionGraph: commonBuff41ActionGraph,
};

const commonBuff42ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_dash_immune',
                copiedBlackboardAssignments: { dodgeSkillId: 'dodgeSkillId' },
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: { data_1: { type: 'boolean', expression: { kind: 'casterControlled' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff42: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.33,
  applyTags: ['3C/Dash'],
  extendTags: [],
  blackboard: { dodgeSkillId: 0 },
  attributeModifiers: [{ attribute: 'TurnRateScalar', slot: 'addition', value: 2 }],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: commonBuff42ActionGraph,
};

const commonBuff43ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_3: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'DodgeSucceedMarker',
            durationSeconds: { kind: 'constant', value: 0.2 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      castSkillDuringAction_4: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { kind: 'stringNode', nodeId: 'data_1' },
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'createTimedMarker_3',
      },
      startTimeDilation_5: {
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
        next: 'castSkillDuringAction_4',
      },
      startTimeDilation_6: {
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
        next: 'startTimeDilation_5',
      },
      changeResource_7: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'owner' },
            targets: { kind: 'owner' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'startTimeDilation_6',
      },
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_1',
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_common_dash_behit_listener'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_dash_succeed_immune' }],
            targets: { kind: 'source' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_8',
      },
      recordPerfectDodge_10: {
        action: { kind: 'recordPerfectDodge', parameters: {} },
        next: 'applyBuff_9',
      },
      recoverDashEnergy_11: {
        action: {
          kind: 'recoverDashEnergy',
          parameters: { amount: { kind: 'constant', value: 0.5 }, canRecoverWhenOverdraft: true },
        },
        next: 'recordPerfectDodge_10',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'changeResource_7' },
          whenFalse: { $sequence: null },
        },
        next: 'recoverDashEnergy_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'ifElse_12',
      },
      createTimedMarker_16: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'DodgeSucceedMarker',
            durationSeconds: { kind: 'constant', value: 0.5 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      castSkillDuringAction_17: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { kind: 'stringNode', nodeId: 'data_1' },
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'createTimedMarker_16',
      },
      startTimeDilation_18: {
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
        next: 'castSkillDuringAction_17',
      },
      startTimeDilation_19: {
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
        next: 'startTimeDilation_18',
      },
      changeResource_20: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'owner' },
            targets: { kind: 'owner' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: 'startTimeDilation_19',
      },
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'changeResource_20' },
          whenFalse: { $sequence: null },
        },
        next: 'recoverDashEnergy_11',
      },
      checkCondition_26: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'ifElse_25',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'checkCondition_26',
      },
    },
    dataNodes: {
      data_1: { type: 'string', expression: { blackboardKey: 'dodgeSkillId' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          target: 'buffOwner',
          markerId: 'DodgeSucceedMarker',
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'eventProjectileIgnoreImmuneLevelCompare',
          operator: 'lessOrEqual',
          value: 0,
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'eventProjectilePerfectDodgeCooldownEquals', value: false },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff43: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atb: 7, dodgeSkillId: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_13' } },
    { event: 'beforeHitByProjectile', priority: 0, sequence: { $sequence: 'checkCondition_27' } },
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
            buffs: [{ buffId: 'buff_common_full_immune_weak' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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
            buffs: [
              {
                buffId: 'buff_common_dash_behit_listener',
                copiedBlackboardAssignments: { dodgeSkillId: 'dodgeSkillId' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_3',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
          tags: ['Status/CanNotPerfectDodge'],
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff44: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  applyTags: ['Status/DashImmune'],
  extendTags: [],
  blackboard: { dodgeSkillId: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }, { $sequence: 'checkCondition_4' }] },
  actionGraph: commonBuff44ActionGraph,
};

const commonBuff45ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_full_immune_weak' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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

const commonBuff45: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 0.33,
  applyTags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: commonBuff45ActionGraph,
};

const commonBuff46ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff46: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Status/Immobilized/Frozen', 'Status/DisableFaceToAttacker'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'startTimeDilation_1' }] },
  actionGraph: commonBuff46ActionGraph,
};

const commonBuff47ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_burning_status',
                copiedBlackboardAssignments: { burning_atk_scale: 'burning_atk_scale' },
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'burning_atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
                column: { kind: 'valueNode', nodeId: 'data_2' },
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
            buffs: [{ buffId: 'buff_common_fire_triggered_fx' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'extra_scaling' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff47: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'fire_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_burning',
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Fire',
    nameKey: 'effects.name.combustion',
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Burning'],
  extendTags: [],
  blackboard: { burning_atk_scale: 0, count: 1, duration: 10, extra_scaling: 1 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'readSkillSettingData_3' }, { $sequence: 'applyBuff_4' }],
    enable: [{ $sequence: 'applyBuff_1' }],
  },
  actionGraph: commonBuff47ActionGraph,
};

const commonBuff48ActionGraph = {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff48: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/FireBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'triggerSpellBurst_1' }, { $sequence: 'readSkillSettingData_3' }],
  },
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
  durationSeconds: 5,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: commonBuff49ActionGraph,
};

const commonBuff50ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_do_frozen',
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

const commonBuff50: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
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
  actionGraph: commonBuff51ActionGraph,
};

const commonBuff52ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff52: SkillBuffDefinition = {
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
  actionGraph: commonBuff52ActionGraph,
};

const commonBuff53ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff53: SkillBuffDefinition = {
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
  actionGraph: commonBuff53ActionGraph,
};

const commonBuff54ActionGraph = {
  main: {
    nodes: {
      refreshCurrentBuffAttributeModifiers_9: {
        action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
        next: null,
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'refreshCurrentBuffAttributeModifiers_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'modifyActionValue_10',
      },
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: 'refreshCurrentBuffAttributeModifiers_9',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'ifElse_5',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'modifyActionValue_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'start_def_decrease' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'def_decrease', fallback: 0 },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'start_def_decrease', fallback: 0 },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_3' },
        },
      },
      data_5: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['mob'] } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'max_def_decrease' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'max_def_decrease', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'def_decrease_tick' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff54: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'natural_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_corrupt',
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Natural',
    nameKey: 'effects.name.corrosion',
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
  extendTags: [],
  blackboard: {
    additional_def_decrease: 0,
    count: 1,
    def_decrease: 0,
    def_decrease_tick: 0,
    duration: 0,
    max_def_decrease: 0,
    start_def_decrease: 0,
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
    start: [{ $sequence: 'checkCondition_11' }],
    enable: [{ $sequence: 'checkCondition_1' }],
    trigger: [{ $sequence: 'checkCondition_8' }],
  },
  actionGraph: commonBuff54ActionGraph,
};

const commonBuff55ActionGraph = {
  main: {
    nodes: {
      readBuffBlackboard_2: {
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
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_natural_natural_corrupt_do',
                copiedBlackboardAssignments: {
                  def_decrease: 'def_decrease',
                  max_def_decrease: 'max_def_decrease',
                  def_decrease_tick: 'def_decrease_tick',
                  start_def_decrease: 'start_def_decrease',
                  duration: 'duration',
                  count: 'count',
                },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'readBuffBlackboard_2' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'start_def_decrease',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'ifElse_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'max_def_decrease',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'def_decrease_tick',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_6',
      },
      readSkillSettingData_8: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [-0.84, -1.12, -1.4, -1.68],
                column: { kind: 'valueNode', nodeId: 'data_3' },
                storeKey: 'def_decrease_tick',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [-12, -16, -20, -24],
                column: { kind: 'valueNode', nodeId: 'data_3' },
                storeKey: 'max_def_decrease',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [-3.6, -4.8, -6, -7.2],
                column: { kind: 'valueNode', nodeId: 'data_3' },
                storeKey: 'start_def_decrease',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
            ],
          },
        },
        next: 'modifyActionValue_7',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'extra_scaling' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff55: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {
    count: 1,
    def_decrease: 0,
    def_decrease_tick: 0,
    duration: 0,
    extra_scaling: 1,
    max_def_decrease: 0,
    start_def_decrease: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'readSkillSettingData_8' }] },
  actionGraph: commonBuff55ActionGraph,
};

const commonBuff56ActionGraph = {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff56: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/NaturalBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'triggerSpellBurst_1' }, { $sequence: 'readSkillSettingData_3' }],
  },
  actionGraph: commonBuff56ActionGraph,
};

const commonBuff57ActionGraph = {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'valueNode', nodeId: 'data_2' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'damage_enhence' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff57: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 5,
  triggerIntervalSeconds: 0.35,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/NaturalBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0, damage_enhence: 1 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'triggerSpellBurst_1' }, { $sequence: 'readSkillSettingData_4' }],
  },
  actionGraph: commonBuff57ActionGraph,
};

const commonBuff58ActionGraph = {
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

const commonBuff58: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'gainSquadUltimateEnergyFromSkillCost_1' }] },
  actionGraph: commonBuff58ActionGraph,
};

const commonBuff59ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_originum_frozen_inner',
                copiedBlackboardAssignments: { duration: 'duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
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
                buffId: 'buff_chr_0003_endminf_talent_1_tirgger',
                copiedBlackboardAssignments: {
                  duration: 'duration_dynamic',
                  atk_up: 'atk_up_dynamic',
                },
              },
            ],
            targets: { kind: 'context', key: 'teammate' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration_dynamic',
            operation: 'multiply',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_5',
      },
      modifyActionValue_7: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_up_dynamic',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_6',
      },
      readBuffBlackboard_8: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential2'] },
            desiredKey: 'ratio',
            outputKey: 'teammate_ratio',
          },
        },
        next: 'modifyActionValue_7',
      },
      findTargets_9: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'source' },
            query: { kind: 'characterTeam', excludeOwner: true, owner: { kind: 'source' } },
            saveToContextKey: 'teammate',
          },
        },
        next: 'readBuffBlackboard_8',
      },
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'findTargets_9',
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0003_endminf_talent_1_tirgger',
                copiedBlackboardAssignments: {
                  duration: 'duration_dynamic',
                  atk_up: 'atk_up_dynamic',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_10',
      },
      readBuffBlackboard_12: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_talent_1'] },
            desiredKey: 'duration',
            outputKey: 'duration_dynamic',
          },
        },
        next: 'applyBuff_11',
      },
      readBuffBlackboard_13: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_talent_1'] },
            desiredKey: 'atk_up',
            outputKey: 'atk_up_dynamic',
          },
        },
        next: 'readBuffBlackboard_12',
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'readBuffBlackboard_13',
      },
      changeResource_15: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_7' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            ignoreUltimateEnergyGainMultiplier: true,
          },
        },
        next: null,
      },
      readBuffBlackboard_16: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'actionInputTarget',
            query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential3'] },
            desiredKey: 'usp',
            outputKey: 'endmin_usp',
          },
        },
        next: 'changeResource_15',
      },
      checkCondition_17: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'readBuffBlackboard_16',
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
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
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 20 },
        },
      },
      data_2: { type: 'boolean', expression: { kind: 'enemyRankIn', ranks: ['mob'] } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_trigger' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'teammate_ratio' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential2'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_talent_1'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'endmin_usp' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0003_endminf_potential3'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff59: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_skill_endmin_debuff',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.originiumCrystals',
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
  lifecycleSequences: {
    enable: [{ $sequence: 'checkCondition_2' }],
    finish: [{ $sequence: 'checkCondition_3' }],
  },
  igniteEventResponses: [
    {
      igniteType: 'EndminUlt',
      finishAfterIgnited: true,
      sequences: [
        { $sequence: 'dealDamage_4' },
        { $sequence: 'checkCondition_14' },
        { $sequence: 'checkCondition_17' },
      ],
    },
    {
      igniteType: 'PhysicalStatus',
      finishAfterIgnited: true,
      sequences: [{ $sequence: 'dealDamage_18' }, { $sequence: 'checkCondition_14' }],
    },
    {
      igniteType: 'NoGuard',
      finishAfterIgnited: true,
      sequences: [{ $sequence: 'dealDamage_18' }, { $sequence: 'checkCondition_14' }],
    },
  ],
  actionGraph: commonBuff59ActionGraph,
};

const commonBuff60ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff60: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Status/Immobilized/OriginumFrozen'],
  extendTags: [],
  blackboard: { duration: 9999 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'startTimeDilation_1' }] },
  actionGraph: commonBuff60ActionGraph,
};

const commonBuff61ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff61: SkillBuffDefinition = {
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
  actionGraph: commonBuff61ActionGraph,
};

const commonBuff62ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff62: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Status/CanBeBreakingAttacked'],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
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
  actionGraph: commonBuff63ActionGraph,
};

const commonBuff64ActionGraph = {
  main: {
    nodes: {
      readSkillSettingData_3: {
        action: {
          kind: 'readSkillSettingData',
          parameters: {
            items: [
              {
                values: [12, 18, 24, 30],
                column: { kind: 'valueNode', nodeId: 'data_1' },
                storeKey: 'real_duration',
              },
            ],
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'real_duration',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
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
                buffId: 'buff_common_pulse_pulse_conduct_triggered_do',
                copiedBlackboardAssignments: {
                  duration: 'real_duration',
                  count: 'count',
                  extra_scaling: 'extra_scaling',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'readSkillSettingData_3' },
        },
        next: 'applyBuff_4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff64: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  applyTags: ['Skill/Character/Common/TrySpellStatus/PulsePulse'],
  extendTags: [],
  blackboard: { count: 1, duration: 0, extra_scaling: 1, real_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'ifElse_5' }] },
  actionGraph: commonBuff64ActionGraph,
};

const commonBuff65ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_pulse_triggered_fx' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
            multiplier: { kind: 'valueNode', nodeId: 'data_2' },
            base: { kind: 'valueNode', nodeId: 'data_2' },
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
                column: { kind: 'valueNode', nodeId: 'data_3' },
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
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: null,
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: null,
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_6',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'extra_scaling' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'spell_resistance_decrease' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTypeIn',
          damageTypes: ['heat', 'electric', 'cryo', 'nature'],
        },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'if_contain_physicdamage', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical', 'ether'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff65: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'pulse_triggered',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_conduct',
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Pulse',
    nameKey: 'effects.name.electrification',
  },
  applyTags: ['Skill/Character/Common/SpellStatus/Conduct'],
  extendTags: [],
  blackboard: {
    count: 1,
    duration: 5,
    extra_scaling: 1,
    final_spell_resistance_decrease: 0,
    if_contain_physicdamage: 0,
    spell_resistance_decrease: 0.2,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_5' },
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
      condition: { $sequence: 'checkCondition_7' },
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
  lifecycleSequences: { start: [{ $sequence: 'readSkillSettingData_4' }] },
  actionGraph: commonBuff65ActionGraph,
};

const commonBuff66ActionGraph = {
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
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
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
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff66: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  durationSeconds: 10,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: ['Skill/Character/Common/SpellBurst/PulseBurst'],
  extendTags: [],
  blackboard: { atk_scale: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'triggerSpellBurst_1' }, { $sequence: 'readSkillSettingData_3' }],
  },
  actionGraph: commonBuff66ActionGraph,
};

const commonBuff67ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff67: SkillBuffDefinition = {
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
  actionGraph: commonBuff67ActionGraph,
};

const commonBuff68ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_physical_no_guard',
                blackboardAssignments: { skip_handle_cryst_break: { kind: 'constant', value: 1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
            buffs: [{ buffId: 'buff_physical_handle_cryst_break' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff68: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'physical',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/airborne',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.lift',
  },
  applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 3, poise: 10 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [
      { $sequence: 'applyBuff_1' },
      { $sequence: 'readSkillSettingData_3' },
      { $sequence: 'applyBuff_4' },
      { $sequence: 'igniteBuffs_5' },
    ],
  },
  actionGraph: commonBuff68ActionGraph,
};

const commonBuff69ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_physical_do_crushed',
                copiedBlackboardAssignments: {
                  count: 'count',
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  dmg_multiplier: 'dmg_multiplier',
                  ignore_hit_effect: 'ignore_hit_effect',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      readBuffStackCount_2: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
          },
        },
        next: 'applyBuff_1',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff69: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'physical',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/knockback',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.crush',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 1, count: 0, dmg_multiplier: 1, duration: 3, ignore_hit_effect: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'readBuffStackCount_2' }] },
  actionGraph: commonBuff69ActionGraph,
};

const commonBuff70ActionGraph = {
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
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
                enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
              },
            ],
          },
        },
        next: 'modifyActionValue_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_handle_cryst_break' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
      startTimeDilation_7: {
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
      startTimeDilation_8: {
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
      switch_12: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_3' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'startTimeDilation_7' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'startTimeDilation_8' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'startTimeDilation_9' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'startTimeDilation_10' },
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: { $sequence: 'startTimeDilation_11' },
            },
          ],
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'switch_12',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'dmg_multiplier' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'less',
          right: { kind: 'constant', value: 0.5 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff70: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'physical',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/knockback',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
  extendTags: [],
  blackboard: { atk_scale: 1, count: 0, dmg_multiplier: 1, duration: 3, ignore_hit_effect: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [
      { $sequence: 'readSkillSettingData_4' },
      { $sequence: 'applyBuff_5' },
      { $sequence: 'igniteBuffs_6' },
      { $sequence: 'checkCondition_13' },
    ],
  },
  actionGraph: commonBuff70ActionGraph,
};

const commonBuff71ActionGraph = {
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
            value: { kind: 'valueNode', nodeId: 'data_1' },
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
                column: { kind: 'valueNode', nodeId: 'data_2' },
                storeKey: 'physical_res_down',
                enhance: {
                  target: 'caster',
                  formula: { kind: 'saturating', paramA: 2, paramB: 300 },
                },
              },
              {
                values: [1, 1.5, 2, 2.5],
                column: { kind: 'valueNode', nodeId: 'data_2' },
                storeKey: 'atk_scale',
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
            buffs: [{ buffId: 'buff_physical_handle_cryst_break' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: [],
            features: ['physicalInfliction'],
          },
        },
        next: null,
      },
      finishBuffsById_7: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_physical_no_guard'],
            reason: 'early',
          },
        },
        next: 'dealDamage_6',
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
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_2' }, alwaysNext: true },
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
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'extra_scaling' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff71: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'fracture',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_fracture',
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
    nameKey: 'effects.name.breach',
  },
  applyTags: ['Skill/Character/Common/PhysicalStatus/FractureStatus'],
  extendTags: [],
  blackboard: { atk_scale: 0, count: 0, duration: 15, extra_scaling: 1, physical_res_down: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_14' },
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
  lifecycleSequences: {
    start: [
      { $sequence: 'readSkillSettingData_3' },
      { $sequence: 'applyBuff_4' },
      { $sequence: 'igniteBuffs_5' },
      { $sequence: 'finishBuffsById_7' },
      { $sequence: 'switch_13' },
    ],
  },
  actionGraph: commonBuff71ActionGraph,
};

const commonBuff72ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_physical_do_fracture',
                copiedBlackboardAssignments: { duration: 'duration', count: 'count' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
                column: { kind: 'valueNode', nodeId: 'data_1' },
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff72: SkillBuffDefinition = {
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
  lifecycleSequences: { start: [{ $sequence: 'readBuffStackCount_3' }] },
  actionGraph: commonBuff72ActionGraph,
};

const commonBuff73ActionGraph = {
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
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
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
            buffs: [
              {
                buffId: 'buff_common_cryst_triggered_physical_break',
                copiedBlackboardAssignments: { atk_scale: 'atk_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'switch_6',
      },
      finishBuffsByTag_8: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
                column: { kind: 'valueNode', nodeId: 'data_1' },
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
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff73: SkillBuffDefinition = {
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
  lifecycleSequences: { start: [{ $sequence: 'readBuffBlackboard_10' }] },
  actionGraph: commonBuff73ActionGraph,
};

const commonBuff74ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_physical_no_guard',
                blackboardAssignments: { skip_handle_cryst_break: { kind: 'constant', value: 1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
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
            features: ['knockDown', 'physicalInfliction'],
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
            buffs: [{ buffId: 'buff_physical_handle_cryst_break' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff74: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: false,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    nameKey: 'effects.name.knockdown',
  },
  applyTags: ['Skill/Character/Common/PhysicalStatus/KnockdownStatus'],
  extendTags: [],
  blackboard: { atk_scale: 0, duration: 3, poise: 10 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [
      { $sequence: 'applyBuff_1' },
      { $sequence: 'readSkillSettingData_3' },
      { $sequence: 'applyBuff_4' },
      { $sequence: 'igniteBuffs_5' },
    ],
  },
  actionGraph: commonBuff74ActionGraph,
};

const commonBuff75ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_handle_cryst_break' }],
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_no_guard_fake' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
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
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
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
} as const satisfies ActionGraphResourceDefinition;

const commonBuff75: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 100,
  maxStackCount: 4,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_shadow_attribute_penetrate',
    showInHeadBarAttached: true,
    nameKey: 'effects.name.vulnerability',
  },
  applyTags: ['Skill/Character/Common/NoGuard'],
  extendTags: [],
  blackboard: { count: 0, duration: 20, skip_handle_cryst_break: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'checkCondition_2' }],
    finish: [{ $sequence: 'applyBuff_3' }],
    afterEnhance: [{ $sequence: 'igniteBuffs_4' }, { $sequence: 'checkCondition_7' }],
  },
  actionGraph: commonBuff75ActionGraph,
};

const commonBuff76ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff76: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 100,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: ['Skill/Character/Common/NoGuardFake'],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: commonBuff76ActionGraph,
};
export const commonBuffDefinitions: OperatorBuffDefinitions = Object.freeze({
  buff_common_affixes_combo_trigger: commonBuff1,
  buff_common_affixes_enhance_crystal: commonBuff2,
  buff_common_affixes_enhance_crystal_default_child: commonBuff3,
  buff_common_affixes_enhance_fire: commonBuff4,
  buff_common_affixes_enhance_fire_default_child: commonBuff5,
  buff_common_affixes_enhance_natural: commonBuff6,
  buff_common_affixes_enhance_natural_default_child: commonBuff7,
  buff_common_affixes_enhance_pulse: commonBuff8,
  buff_common_affixes_enhance_pulse_default_child: commonBuff9,
  buff_common_affixes_enhance_spell: commonBuff10,
  buff_common_affixes_enhance_spell_default_child: commonBuff11,
  buff_common_affixes_shelter: commonBuff12,
  buff_common_affixes_shelter_default_child: commonBuff13,
  buff_common_affixes_skillimbue: commonBuff14,
  buff_common_affixes_skillimbue_atk: commonBuff15,
  buff_common_affixes_slow: commonBuff16,
  buff_common_affixes_slow_default_child: commonBuff17,
  buff_common_affixes_speedup: commonBuff18,
  buff_common_affixes_vulnerable_crystal: commonBuff19,
  buff_common_affixes_vulnerable_crystal_default_child: commonBuff20,
  buff_common_affixes_vulnerable_crystal_lizhiyan_child: commonBuff21,
  buff_common_affixes_vulnerable_fire: commonBuff22,
  buff_common_affixes_vulnerable_natural: commonBuff23,
  buff_common_affixes_vulnerable_natural_lizhiyan_child: commonBuff24,
  buff_common_affixes_vulnerable_physical: commonBuff25,
  buff_common_affixes_vulnerable_physical_default_child: commonBuff26,
  buff_common_affixes_vulnerable_pulse: commonBuff27,
  buff_common_affixes_vulnerable_pulse_default_child: commonBuff28,
  buff_common_affixes_vulnerable_spell: commonBuff29,
  buff_common_affixes_vulnerable_spell_default_child: commonBuff30,
  buff_common_affixes_weak: commonBuff31,
  buff_common_affixes_weak_default_child: commonBuff32,
  buff_common_burning_status: commonBuff33,
  buff_common_cryst_cryst_frozen_triggered: commonBuff34,
  buff_common_cryst_cryst_frozen_triggered_do: commonBuff35,
  buff_common_cryst_cryst_triggered: commonBuff36,
  buff_common_cryst_triggered_fx: commonBuff37,
  buff_common_cryst_triggered_physical_break: commonBuff38,
  buff_common_damage_immune_medium: commonBuff39,
  buff_common_damage_immune_talent: commonBuff40,
  buff_common_damage_immune_ult_skill: commonBuff41,
  buff_common_dash: commonBuff42,
  buff_common_dash_behit_listener: commonBuff43,
  buff_common_dash_immune: commonBuff44,
  buff_common_dash_succeed_immune: commonBuff45,
  buff_common_do_frozen: commonBuff46,
  buff_common_fire_fire_burning_triggered: commonBuff47,
  buff_common_fire_fire_triggered: commonBuff48,
  buff_common_fire_triggered_fx: commonBuff49,
  buff_common_frozen: commonBuff50,
  buff_common_full_immune: commonBuff51,
  buff_common_full_immune_medium: commonBuff52,
  buff_common_full_immune_weak: commonBuff53,
  buff_common_natural_natural_corrupt_do: commonBuff54,
  buff_common_natural_natural_corrupt_triggered: commonBuff55,
  buff_common_natural_natural_triggered: commonBuff56,
  buff_common_natural_natural_triggered_typhoea: commonBuff57,
  buff_common_obtain_ultimate_sp: commonBuff58,
  buff_common_originum_frozen: commonBuff59,
  buff_common_originum_frozen_inner: commonBuff60,
  buff_common_poise_break_damage_taken_scale: commonBuff61,
  buff_common_poise_can_be_breaking_attacked: commonBuff62,
  buff_common_power_attack_disable_cast_skill: commonBuff63,
  buff_common_pulse_pulse_conduct_triggered: commonBuff64,
  buff_common_pulse_pulse_conduct_triggered_do: commonBuff65,
  buff_common_pulse_pulse_triggered: commonBuff66,
  buff_common_pulse_triggered_fx: commonBuff67,
  buff_physical_airborne: commonBuff68,
  buff_physical_crushed: commonBuff69,
  buff_physical_do_crushed: commonBuff70,
  buff_physical_do_fracture: commonBuff71,
  buff_physical_fracture: commonBuff72,
  buff_physical_handle_cryst_break: commonBuff73,
  buff_physical_knockdown: commonBuff74,
  buff_physical_no_guard: commonBuff75,
  buff_physical_no_guard_fake: commonBuff76,
});
