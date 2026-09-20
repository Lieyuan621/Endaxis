import type {
  CombatBuffDefinitionEntry,
  CombatBuffDefinitionAction,
  CombatBuffDefinitionAttributeModifier,
  CombatBuffDefinitionDamageModifier,
  CombatBuffDefinitionsDocument,
} from '../../../packages/game-data-contract/src/buffs';
import type { InflictionElement } from '../../core/game-data/operatorDefinition';
import { compoundStatusFactories } from './compoundStatusFactories';

const ELEMENTS = {
  heat: {
    native: 'Fire',
    id: 'fire',
    iconId: 'icon_energy_fusion_fire',
    tag: 'Skill/Character/Common/SpellInflict/FireInflict',
    burstDamageType: 'heat',
    attachmentKeys: [
      'def_decrease_tick',
      'max_def_decrease',
      'shatter_dmg',
      'spell_resistance_decrease',
      'frozen_duration',
      'conduct_duration',
      'start_def_decrease',
      'corrupt_duration',
    ],
  },
  electric: {
    native: 'Pulse',
    id: 'pulse',
    iconId: 'icon_energy_fusion_pulse',
    tag: 'Skill/Character/Common/SpellInflict/PulseInflict',
    burstDamageType: 'electric',
    attachmentKeys: [
      'burning_atk_scale',
      'def_decrease_tick',
      'max_def_decrease',
      'shatter_dmg',
      'frozen_duration',
      'start_def_decrease',
      'corrupt_duration',
    ],
  },
  cryo: {
    native: 'Cryst',
    id: 'cryst',
    iconId: 'icon_energy_fusion_cryst',
    tag: 'Skill/Character/Common/SpellInflict/CrystInflict',
    burstDamageType: 'cryo',
    attachmentKeys: [
      'burning_atk_scale',
      'def_decrease_tick',
      'max_def_decrease',
      'spell_resistance_decrease',
      'conduct_duration',
      'start_def_decrease',
      'corrupt_duration',
    ],
  },
  nature: {
    native: 'Natural',
    id: 'natural',
    iconId: 'icon_infliction_nature',
    tag: 'Skill/Character/Common/SpellInflict/NaturalInflict',
    burstDamageType: 'nature',
    attachmentKeys: [
      'burning_atk_scale',
      'shatter_dmg',
      'spell_resistance_decrease',
      'frozen_duration',
      'conduct_duration',
    ],
  },
} as const;

function attachmentDefinition(element: InflictionElement): CombatBuffDefinitionEntry {
  const metadata = ELEMENTS[element];
  return {
    id: `buff_common_energy_shard_attached_${metadata.id}`,
    presentation: {
      visible: true,
      iconId: metadata.iconId,
      showInHeadBarCommon: false,
      showInHeadBarAttached: true,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      showWarningBackground: false,
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
    },
    applyTags: [metadata.tag],
    stackingType: 'enhanceAndRefresh',
    maxStackCount: 4,
    blackboard: {
      duration: 20,
      atk_scale: 0,
      count: 0,
      ...Object.fromEntries(metadata.attachmentKeys.map(key => [key, 0])),
    },
    role: { kind: 'elementalAttachment', element },
    actions: { afterEnhance: [{ kind: 'emitElementalInflictionStarted' }] },
    durationSeconds: { blackboardKey: 'duration' },
  };
}

function burstDefinition(element: InflictionElement): CombatBuffDefinitionEntry {
  const metadata = ELEMENTS[element];
  return {
    id: `buff_common_${metadata.id}_${metadata.id}_triggered`,
    stackingType: 'unlimited',
    durationSeconds: element === 'electric' ? 10 : 5,
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: 1,
    role: { kind: 'elementalBurst', element },
    actions: {
      trigger: [{ kind: 'triggerSpellBurst', burstType: metadata.native }],
    },
    spellBurst: {
      burstType: metadata.native,
      damageType: metadata.burstDamageType,
      skillSettingDataKey: '法术爆发伤害倍率',
      skillSettingColumn: 1,
      atkScaleBase: 50,
    },
  };
}

const BASE_ELEMENTAL_DEFINITIONS = (Object.keys(ELEMENTS) as InflictionElement[]).flatMap(
  element => [attachmentDefinition(element), burstDefinition(element)],
);

const CONDUCT_DAMAGE_TYPES = ['heat', 'electric', 'cryo', 'nature'] as const;
const CONDUCT_DAMAGE_MODIFIERS = CONDUCT_DAMAGE_TYPES.map(damageType => ({
  enabledSide: 'defender',
  condition: { kind: 'eventDamageTypesMatch', damageTypes: [damageType] },
  processors: [
    {
      kind: 'damageScale',
      side: 'defender',
      zone: 'normal',
      addition: { blackboardKey: 'final_spell_resistance_decrease' },
    },
  ],
})) satisfies readonly CombatBuffDefinitionDamageModifier[];

function conductStatus(
  id: string,
  consumedElement: 'heat' | 'cryo' | 'nature',
): CombatBuffDefinitionEntry {
  return {
    id,
    presentation: {
      visible: true,
      iconId: 'icon_battle_conduct',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      iconStyleInSquad: 'SpellAbnormal',
      abnormalColorType: 'Pulse',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttachedAndAbnormal',
      },
    },
    stackingType: 'stack',
    stackingKey: 'pulse_triggered',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: { blackboardKey: 'duration' },
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: 1,
    applyTags: ['Skill/Character/Common/SpellStatus/Conduct'],
    blackboard: {
      atk_scale: 0,
      consumed_layer: 0,
      count: 0,
      duration: 15,
      final_spell_resistance_decrease: 0,
      spell_resistance_decrease: 0,
    },
    damageModifiers: CONDUCT_DAMAGE_MODIFIERS,
    role: { kind: 'compoundStatus', consumedElement, incomingElement: 'electric' },
    actions: {
      start: [
        {
          kind: 'storeAttributeValue',
          target: 'source',
          attribute: { kind: 'specific', key: 'electricAbnormalDamageIncrease' },
          stage: 'finalNonConverted',
          useFloor: false,
          divisor: 1,
          multiplier: { blackboardKey: 'spell_resistance_decrease' },
          base: { blackboardKey: 'spell_resistance_decrease' },
          targetKey: 'final_spell_resistance_decrease',
        },
        compoundDamage('electric', 'electricAbnormal'),
      ],
    },
  };
}

function compoundDamage(
  damageType: 'heat' | 'electric' | 'cryo' | 'nature',
  tag: 'fireAbnormal' | 'electricAbnormal' | 'cryoAbnormal' | 'natureAbnormal',
  attackScaleKey = 'atk_scale',
  canCritical = true,
): CombatBuffDefinitionAction {
  return {
    kind: 'dealAttackScaledDamage',
    damageType,
    attackScale: { blackboardKey: attackScaleKey },
    tags: [tag],
    features: attackScaleKey === 'burning_atk_scale' ? ['dot'] : [],
    canCritical,
  };
}

const STATUS_PRESENTATION = {
  heat: { iconId: 'icon_battle_burning', abnormalColorType: 'Fire' },
  cryo: { iconId: 'icon_battle_frozen', abnormalColorType: 'Cryst' },
  nature: { iconId: 'icon_battle_corrupt', abnormalColorType: 'Natural' },
} as const;

function visibleCompoundPresentation(element: keyof typeof STATUS_PRESENTATION) {
  return {
    visible: true,
    ...STATUS_PRESENTATION[element],
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    iconStyleInSquad: 'SpellAbnormal',
    orderPriority: {
      useDirectoryValue: false,
      value: 0,
      category: 'AttachedAndAbnormal',
    },
  };
}

function frozenStatus(
  id: string,
  consumedElement: 'heat' | 'electric' | 'nature',
): CombatBuffDefinitionEntry {
  return {
    id,
    presentation: visibleCompoundPresentation('cryo'),
    stackingType: 'stack',
    stackingKey: 'cryst_triggered',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: { blackboardKey: 'duration' },
    applyTags: ['Skill/Character/Common/SpellStatus/Frozen'],
    blackboard: {
      atk_scale: 0,
      consumed_layer: 0,
      count: 0,
      duration: 5,
      final_phy_dmg_up: 0,
      phy_dmg_up: 0,
      shatter_dmg: 0,
    },
    role: { kind: 'compoundStatus', consumedElement, incomingElement: 'cryo' },
    actions: {
      start: [
        compoundDamage('cryo', 'cryoAbnormal'),
        {
          kind: 'simulationNoEffect',
          reason: 'enemyWeaknessWindowRequiresEnemyActiveBehavior',
          nativeActionType: 'ForceTriggerWeakness',
        },
      ],
    },
  };
}

function burningStatus(
  id: string,
  consumedElement: 'electric' | 'cryo' | 'nature',
): CombatBuffDefinitionEntry {
  return {
    id,
    presentation: visibleCompoundPresentation('heat'),
    stackingType: 'stack',
    stackingKey: 'fire_triggered',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: { blackboardKey: 'duration' },
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: 9999,
    applyTags: ['Skill/Character/Common/SpellStatus/Burning'],
    blackboard: {
      atk_scale: 0,
      burning_atk_scale: 0,
      consumed_layer: 0,
      count: 0,
      duration: 10,
    },
    role: { kind: 'compoundStatus', consumedElement, incomingElement: 'heat' },
    actions: {
      start: [compoundDamage('heat', 'fireAbnormal')],
      trigger: [compoundDamage('heat', 'fireAbnormal', 'burning_atk_scale', false)],
    },
  };
}

const CORROSION_ATTRIBUTE_MODIFIERS = [
  'PhysicalResistance',
  'FireResistance',
  'PulseResistance',
  'CrystResistance',
  'NaturalResistance',
].flatMap(attribute => [
  { attribute, slot: 'baseAddition', value: { blackboardKey: 'def_decrease' } },
  { attribute, slot: 'baseAddition', value: { blackboardKey: 'additional_def_decrease' } },
]) satisfies readonly CombatBuffDefinitionAttributeModifier[];

function corrosionStatus(
  id: string,
  consumedElement: 'heat' | 'electric' | 'cryo',
): CombatBuffDefinitionEntry {
  return {
    id,
    presentation: visibleCompoundPresentation('nature'),
    stackingType: 'stack',
    stackingKey: 'natural_triggered',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: { blackboardKey: 'duration' },
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: -1,
    applyTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
    blackboard: {
      additional_def_decrease: 0,
      atk_scale: 0,
      consumed_layer: 0,
      consumed_type: 0,
      count: 0,
      def_decrease: 0,
      def_decrease_tick: 0,
      duration: 15,
      max_def_decrease: 0,
      start_def_decrease: 0,
      tick: 0,
    },
    attributeModifiers: CORROSION_ATTRIBUTE_MODIFIERS,
    role: { kind: 'compoundStatus', consumedElement, incomingElement: 'nature' },
    actions: {
      start: [
        compoundDamage('nature', 'natureAbnormal'),
        {
          kind: 'modifyBlackboard',
          operation: 'assign',
          targetKey: 'def_decrease',
          value: { blackboardKey: 'start_def_decrease' },
        },
        { kind: 'refreshAttributeModifierValues' },
      ],
      trigger: [
        {
          kind: 'modifyBlackboard',
          operation: 'add',
          targetKey: 'def_decrease',
          value: { blackboardKey: 'def_decrease_tick' },
        },
        // 原始链在递减后再次 CompareFloat，越过下限时 Assign max_def_decrease。
        {
          kind: 'clampBlackboard',
          targetKey: 'def_decrease',
          minimum: { blackboardKey: 'max_def_decrease' },
        },
        { kind: 'refreshAttributeModifierValues' },
      ],
    },
  };
}

function allCompoundStatuses(): readonly CombatBuffDefinitionEntry[] {
  return compoundStatusFactories.factories.map(factory => {
    const id = factory.createdBuff.buffId;
    const consumed = factory.consumedElement;
    switch (factory.incomingElement) {
      case 'electric':
        return conductStatus(id, consumed as 'heat' | 'cryo' | 'nature');
      case 'cryo':
        return frozenStatus(id, consumed as 'heat' | 'electric' | 'nature');
      case 'heat':
        return burningStatus(id, consumed as 'electric' | 'cryo' | 'nature');
      case 'nature':
        return corrosionStatus(id, consumed as 'heat' | 'electric' | 'cryo');
    }
  });
}

const definitionsWithConduct = {
  schemaVersion: 1,
  revision: 'elemental-rules-v1',
  buffs: [...BASE_ELEMENTAL_DEFINITIONS, ...allCompoundStatuses()],
} satisfies CombatBuffDefinitionsDocument;

/** 底层元素规则由 TypeScript 静态契约校验，运行时直接消费。 */
export const elementalAttachments: CombatBuffDefinitionsDocument = definitionsWithConduct;
