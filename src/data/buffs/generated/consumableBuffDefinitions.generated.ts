/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';

import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs';
const commonBuff_buff_common_atk_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_atk_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_atk_buff_potion_1$actionGraph,
};

const commonBuff_buff_common_atk_buff_potion_2$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_atk_buff_potion_2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseFinalAddition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_atk_buff_potion_2$actionGraph,
};

const commonBuff_buff_common_cdr_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_cdr_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    {
      attribute: 'ComboSkillCooldownScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
  ],
  actionGraph: commonBuff_buff_common_cdr_buff_potion_1$actionGraph,
};

const commonBuff_buff_common_ctr_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_ctr_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'criticalRate', slot: 'addition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_ctr_buff_potion_1$actionGraph,
};

const commonBuff_buff_common_def_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_def_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [{ attribute: 'Def', slot: 'multiplier', value: { blackboardKey: 'value' } }],
  actionGraph: commonBuff_buff_common_def_buff_potion_1$actionGraph,
};

const commonBuff_buff_common_def_buff_potion_2$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_def_buff_potion_2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [{ attribute: 'Def', slot: 'addition', value: { blackboardKey: 'value' } }],
  actionGraph: commonBuff_buff_common_def_buff_potion_2$actionGraph,
};

const commonBuff_buff_common_def_buff_potion_3$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_def_buff_potion_3: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_down',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [{ attribute: 'Def', slot: 'multiplier', value: { blackboardKey: 'value' } }],
  actionGraph: commonBuff_buff_common_def_buff_potion_3$actionGraph,
};

const commonBuff_buff_common_dmg_up_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_dmg_up_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    {
      attribute: 'physicalDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'value' },
    },
    { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'value' } },
    {
      attribute: 'electricDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'value' },
    },
    { attribute: 'cryoDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'value' } },
    { attribute: 'natureDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'value' } },
    { attribute: 'etherDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_dmg_up_potion_1$actionGraph,
};

const commonBuff_buff_common_healrt_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_healrt_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'healOutputIncrease', slot: 'addition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_healrt_buff_potion_1$actionGraph,
};

const commonBuff_buff_common_healrt_buff_potion_2$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_healrt_buff_potion_2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'healTakenIncrease', slot: 'addition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_healrt_buff_potion_2$actionGraph,
};

const commonBuff_buff_common_mainattri_up_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_mainattri_up_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'strength', slot: 'addition', value: { blackboardKey: 'value' } },
    { attribute: 'intellect', slot: 'addition', value: { blackboardKey: 'value' } },
    { attribute: 'will', slot: 'addition', value: { blackboardKey: 'value' } },
    { attribute: 'agility', slot: 'addition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_mainattri_up_potion_1$actionGraph,
};

const commonBuff_buff_common_phydmg_up_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_phydmg_up_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    {
      attribute: 'physicalDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'value' },
    },
  ],
  actionGraph: commonBuff_buff_common_phydmg_up_potion_1$actionGraph,
};

const commonBuff_buff_common_resis_up_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_resis_up_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_def_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    {
      attribute: 'PhysicalDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
    {
      attribute: 'FireDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
    {
      attribute: 'PulseDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
    {
      attribute: 'CrystDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
    {
      attribute: 'NaturalDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
    {
      attribute: 'EtherDamageTakenScalar',
      slot: 'baseFinalMultiplier',
      value: { blackboardKey: 'value' },
    },
  ],
  actionGraph: commonBuff_buff_common_resis_up_potion_1$actionGraph,
};

const commonBuff_buff_common_usprt_buff_potion_1$actionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const commonBuff_buff_common_usprt_buff_potion_1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [
    { attribute: 'UltimateSpGainScalar', slot: 'addition', value: { blackboardKey: 'value' } },
  ],
  actionGraph: commonBuff_buff_common_usprt_buff_potion_1$actionGraph,
};
export const consumableBuffDefinitions: OperatorBuffDefinitions = Object.freeze({
  buff_common_atk_buff_potion_1: commonBuff_buff_common_atk_buff_potion_1,
  buff_common_atk_buff_potion_2: commonBuff_buff_common_atk_buff_potion_2,
  buff_common_cdr_buff_potion_1: commonBuff_buff_common_cdr_buff_potion_1,
  buff_common_ctr_buff_potion_1: commonBuff_buff_common_ctr_buff_potion_1,
  buff_common_def_buff_potion_1: commonBuff_buff_common_def_buff_potion_1,
  buff_common_def_buff_potion_2: commonBuff_buff_common_def_buff_potion_2,
  buff_common_def_buff_potion_3: commonBuff_buff_common_def_buff_potion_3,
  buff_common_dmg_up_potion_1: commonBuff_buff_common_dmg_up_potion_1,
  buff_common_healrt_buff_potion_1: commonBuff_buff_common_healrt_buff_potion_1,
  buff_common_healrt_buff_potion_2: commonBuff_buff_common_healrt_buff_potion_2,
  buff_common_mainattri_up_potion_1: commonBuff_buff_common_mainattri_up_potion_1,
  buff_common_phydmg_up_potion_1: commonBuff_buff_common_phydmg_up_potion_1,
  buff_common_resis_up_potion_1: commonBuff_buff_common_resis_up_potion_1,
  buff_common_usprt_buff_potion_1: commonBuff_buff_common_usprt_buff_potion_1,
});
