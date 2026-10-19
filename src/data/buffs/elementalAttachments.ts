import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
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
    nameKey: 'effects.name.heat_infliction',
    icon: 'endaxis:icons/icon_energy_fusion_fire',
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
    nameKey: 'effects.name.electric_infliction',
    icon: 'endaxis:icons/icon_energy_fusion_pulse',
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
    nameKey: 'effects.name.cryo_infliction',
    icon: 'endaxis:icons/icon_energy_fusion_cryst',
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
    nameKey: 'effects.name.nature_infliction',
    icon: 'endaxis:icons/icon_energy_fusion_nature',
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
      nameKey: metadata.nameKey,
      icon: metadata.icon,
      showInHeadBarAttached: true,
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
  condition: { $sequence: damageType },
  processors: [
    {
      kind: 'damageScale',
      side: 'defender',
      zone: 'normal',
      addition: { blackboardKey: 'final_spell_resistance_decrease' },
    },
  ],
})) satisfies readonly CombatBuffDefinitionDamageModifier[];

function conductConditionGraph(): ActionGraphResourceDefinition {
  return {
    main: {
      nodes: Object.fromEntries(
        CONDUCT_DAMAGE_TYPES.map(damageType => [
          damageType,
          {
            action: {
              kind: 'conditional',
              parameters: { condition: { kind: 'conditionNode', nodeId: damageType } },
              whenTrue: { $sequence: null },
            },
            next: null,
          },
        ]),
      ),
      dataNodes: Object.fromEntries(
        CONDUCT_DAMAGE_TYPES.map(damageType => [
          damageType,
          {
            type: 'boolean',
            expression: { kind: 'eventDamageTypeIn', damageTypes: [damageType] },
          },
        ]),
      ),
    },
    macros: {},
  };
}

function conductStatus(
  id: string,
  consumedElement: 'heat' | 'cryo' | 'nature',
): CombatBuffDefinitionEntry {
  return {
    id,
    presentation: visibleCompoundPresentation('electric'),
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
    actionGraph: conductConditionGraph(),
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
  heat: {
    nameKey: 'effects.name.combustion',
    icon: 'endaxis:icons/icon_battle_burning',
    abnormalColorType: 'Fire',
  },
  electric: {
    nameKey: 'effects.name.electrification',
    icon: 'endaxis:icons/icon_battle_conduct',
    abnormalColorType: 'Pulse',
  },
  cryo: {
    nameKey: 'effects.name.solidification',
    icon: 'endaxis:icons/icon_battle_frozen',
    abnormalColorType: 'Cryst',
  },
  nature: {
    nameKey: 'effects.name.corrosion',
    icon: 'endaxis:icons/icon_battle_corrupt',
    abnormalColorType: 'Natural',
  },
} as const;

function visibleCompoundPresentation(element: keyof typeof STATUS_PRESENTATION) {
  return {
    ...STATUS_PRESENTATION[element],
    showInHeadBarCommon: true,
    iconStyleInSquad: 'SpellAbnormal',
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

/** 原生先比较再推进；已有减抗更强时不能用新上限把它截回去。 */
function corrosionGraph(): ActionGraphResourceDefinition {
  return {
    main: {
      nodes: {
        damage: {
          action: {
            kind: 'dealDamage',
            parameters: {
              damageType: 'nature',
              attackScale: { kind: 'valueNode', nodeId: 'atk_scale' },
              tags: ['natureAbnormal'],
              features: [],
            },
          },
          next: null,
        },
        start: {
          action: {
            kind: 'checkCondition',
            parameters: {
              condition: { kind: 'conditionNode', nodeId: 'aboveStart' },
            },
          },
          next: 'initialize',
        },
        initialize: {
          action: {
            kind: 'modifyActionValue',
            parameters: {
              key: 'def_decrease',
              operation: 'assign',
              value: { kind: 'valueNode', nodeId: 'start_def_decrease' },
            },
          },
          next: 'refresh',
        },
        trigger: {
          action: {
            kind: 'checkCondition',
            parameters: {
              condition: { kind: 'conditionNode', nodeId: 'aboveCap' },
            },
          },
          next: 'increment',
        },
        increment: {
          action: {
            kind: 'modifyActionValue',
            parameters: {
              key: 'def_decrease',
              operation: 'add',
              value: { kind: 'valueNode', nodeId: 'def_decrease_tick' },
            },
          },
          next: 'clamp',
        },
        clamp: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'aboveCap' },
            whenTrue: { $sequence: null },
            whenFalse: { $sequence: 'assignCap' },
          },
          next: 'refresh',
        },
        assignCap: {
          action: {
            kind: 'modifyActionValue',
            parameters: {
              key: 'def_decrease',
              operation: 'assign',
              value: { kind: 'valueNode', nodeId: 'max_def_decrease' },
            },
          },
          next: null,
        },
        refresh: {
          action: { kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} },
          next: null,
        },
      },
      dataNodes: {
        ...Object.fromEntries(
          [
            'atk_scale',
            'def_decrease',
            'start_def_decrease',
            'max_def_decrease',
            'def_decrease_tick',
          ].map(key => [
            key,
            {
              type: 'number' as const,
              expression: { kind: 'blackboard' as const, key },
            },
          ]),
        ),
        aboveStart: {
          type: 'boolean',
          expression: {
            kind: 'actionValueCompare',
            operator: 'greater',
            left: { kind: 'valueNode', nodeId: 'def_decrease' },
            right: { kind: 'valueNode', nodeId: 'start_def_decrease' },
          },
        },
        aboveCap: {
          type: 'boolean',
          expression: {
            kind: 'actionValueCompare',
            operator: 'greater',
            left: { kind: 'valueNode', nodeId: 'def_decrease' },
            right: { kind: 'valueNode', nodeId: 'max_def_decrease' },
          },
        },
      },
    },
    macros: {},
  };
}

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
    actionGraph: corrosionGraph(),
    lifecycleSequences: {
      start: [{ $sequence: 'damage' }, { $sequence: 'start' }],
      trigger: [{ $sequence: 'trigger' }],
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
