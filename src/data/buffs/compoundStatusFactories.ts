import {
  INFLICTION_ELEMENTS,
  type InflictionElement,
} from '../../core/game-data/operatorDefinition';
import {
  COMPOUND_STATUS_FACTORIES_SCHEMA_VERSION,
  type CompoundStatusFactoriesDocument,
  type CompoundStatusFactoryEntry,
  type CompoundStatusSkillSettingLookup,
} from '../../core/combat/infliction/compoundStatusFactories';
import { NATIVE_ELEMENT_VALUES } from '../../core/combat/infliction/elementalInfliction';

const NATIVE_ELEMENT_NAMES = {
  heat: 'fire',
  electric: 'pulse',
  cryo: 'cryst',
  nature: 'natural',
} as const satisfies Readonly<Record<InflictionElement, string>>;

const REACTION_RECIPES = {
  cryo: {
    blackboardKeys: ['atk_scale', 'shatter_dmg', 'frozen_duration'],
    settings: [
      ['异常初始伤害倍率', 'atk_scale'],
      ['碎冰倍率', 'shatter_dmg'],
      ['冰冻持续时间', 'frozen_duration'],
    ],
    assignments: [
      ['atk_scale', 'atk_scale'],
      ['shatter_dmg', 'shatter_dmg'],
      ['duration', 'frozen_duration'],
    ],
  },
  heat: {
    blackboardKeys: ['atk_scale', 'burning_atk_scale'],
    settings: [
      ['异常初始伤害倍率', 'atk_scale'],
      ['燃烧每跳伤害', 'burning_atk_scale'],
    ],
    assignments: [
      ['atk_scale', 'atk_scale'],
      ['burning_atk_scale', 'burning_atk_scale'],
    ],
  },
  nature: {
    blackboardKeys: [
      'atk_scale',
      'def_decrease_tick',
      'max_def_decrease',
      'start_def_decrease',
      'corrupt_duration',
    ],
    settings: [
      ['异常初始伤害倍率', 'atk_scale'],
      ['腐蚀每跳减抗', 'def_decrease_tick'],
      ['腐蚀减抗上限', 'max_def_decrease'],
      ['腐蚀初始减抗', 'start_def_decrease'],
      ['腐蚀持续时间', 'corrupt_duration'],
    ],
    assignments: [
      ['atk_scale', 'atk_scale'],
      ['def_decrease_tick', 'def_decrease_tick'],
      ['max_def_decrease', 'max_def_decrease'],
      ['start_def_decrease', 'start_def_decrease'],
      ['duration', 'corrupt_duration'],
    ],
  },
  electric: {
    blackboardKeys: ['atk_scale', 'spell_resistance_decrease', 'conduct_duration'],
    settings: [
      ['异常初始伤害倍率', 'atk_scale'],
      ['导电法术伤害提高', 'spell_resistance_decrease'],
      ['导电持续时间', 'conduct_duration'],
    ],
    assignments: [
      ['atk_scale', 'atk_scale'],
      ['spell_resistance_decrease', 'spell_resistance_decrease'],
      ['duration', 'conduct_duration'],
    ],
  },
} as const;

const COMMON_ASSIGNMENTS = [
  ['consumed_layer', 'consumed_layer'],
  ['count', 'count'],
  ['consumed_type', 'consumed_type'],
] as const;

function createFactory(
  consumedElement: InflictionElement,
  incomingElement: InflictionElement,
): CompoundStatusFactoryEntry {
  const consumed = NATIVE_ELEMENT_NAMES[consumedElement];
  const incoming = NATIVE_ELEMENT_NAMES[incomingElement];
  const recipe = REACTION_RECIPES[incomingElement];
  const skillSettingLookups: readonly CompoundStatusSkillSettingLookup[] = recipe.settings.map(
    ([dataKey, storeKey]) => ({
      dataKey,
      column: { blackboardKey: 'count' },
      enhanceAttributeSource: 'source',
      storeKey,
    }),
  );
  return {
    id: `buff_common_try_${incoming}_${consumed}_triggered`,
    consumedElement,
    incomingElement,
    durationSeconds: 0.1,
    blackboard: {
      count: 0,
      consumed_layer: 0,
      ...Object.fromEntries(recipe.blackboardKeys.map(key => [key, 0])),
      consumed_type: NATIVE_ELEMENT_VALUES[consumedElement],
    },
    skillSettingLookups,
    createdBuff: {
      buffId: `buff_common_${incoming}_${consumed}_triggered${incomingElement === 'nature' ? '_wrapper' : ''}`,
      blackboardAssignments: [...recipe.assignments, ...COMMON_ASSIGNMENTS].map(
        ([targetKey, inputKey]) => ({ targetKey, inputKey }),
      ),
    },
  };
}

const INCOMING_ORDER = ['cryo', 'heat', 'nature', 'electric'] as const;

/**
 * 四元素的 12 个有向异色组合属于底层战斗规则；每个方向只选择对应反应配方，
 * 实际倍率和持续时间仍从当前版本 SkillSetting 读取。
 */
export const compoundStatusFactories: CompoundStatusFactoriesDocument = {
  schemaVersion: COMPOUND_STATUS_FACTORIES_SCHEMA_VERSION,
  revision: 'elemental-rules-v1',
  factories: INCOMING_ORDER.flatMap(incomingElement =>
    INFLICTION_ELEMENTS.filter(consumedElement => consumedElement !== incomingElement).map(
      consumedElement => createFactory(consumedElement, incomingElement),
    ),
  ),
};
