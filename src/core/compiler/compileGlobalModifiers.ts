import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import type { CombatBuffDefinitionAttributeModifier } from '../../../packages/game-data-contract/src/buffs';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { GlobalConfigDocument, GlobalOperatorStatModifier } from '../project/schema';
import { compileIndependentBuffResource } from './compileSkill';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { GLOBAL_CONFIG_PRESETS } from '../project/globalConfigPresets';

const BUFF_ID = 'scenario:global-attribute-modifiers';
const ATTRIBUTE_SLOTS = {
  attackPercent: { attribute: 'Atk', slot: 'baseMultiplier' },
  criticalRate: { attribute: 'criticalRate', slot: 'baseAddition' },
  criticalDamage: { attribute: 'criticalDamageIncrease', slot: 'baseAddition' },
  artsIntensity: { attribute: 'PhysicalAndSpellInflictionEnhance', slot: 'baseAddition' },
  ultimateEnergyGainEfficiency: { attribute: 'UltimateSpGainScalar', slot: 'baseAddition' },
  skillCooldownReduction: { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier' },
} as const satisfies Record<
  GlobalOperatorStatModifier,
  Pick<CombatBuffDefinitionAttributeModifier, 'attribute' | 'slot'>
>;

/** 用户配置只在此翻译为普通 GlobalBuff；执行、属性叠加与切面恢复均走公共路径。 */
export function compileGlobalModifiers(
  config: GlobalConfigDocument,
  programs = new ActionGraphDefinitionRepository(),
) {
  const presetModifiers = (config.enabledPresetIds ?? []).flatMap(id => {
    const preset = GLOBAL_CONFIG_PRESETS.find(item => item.id === id);
    if (!preset) throw new Error(`unknown global preset '${id}'`);
    return preset.modifiers;
  });
  const attributeModifiers = [...presetModifiers, ...config.modifiers].map(modifier => {
    if (!Number.isFinite(modifier.value)) {
      throw new TypeError(`global modifier '${modifier.id}' value must be finite`);
    }
    if (modifier.modifier === 'skillCooldownReduction') {
      if (modifier.skillType !== 'comboSkill' || modifier.value >= 1) {
        throw new RangeError(
          `global cooldown reduction '${modifier.id}' requires comboSkill and a value less than 1`,
        );
      }
    } else if (modifier.skillType !== undefined) {
      throw new Error(`global modifier '${modifier.id}' does not support a skill-type scope`);
    }
    return {
      ...ATTRIBUTE_SLOTS[modifier.modifier],
      value: modifier.modifier === 'skillCooldownReduction' ? 1 - modifier.value : modifier.value,
    };
  });
  const definitions: Record<string, SkillBuffDefinition> =
    attributeModifiers.length === 0
      ? {}
      : {
          [BUFF_ID]: {
            stackingType: 'unlimited',
            presentation: { visible: false },
            attributeModifiers,
            actionGraph: { main: { nodes: {} }, macros: {} },
          },
        };
  const activeIds = attributeModifiers.length ? [BUFF_ID] : [];
  for (const buff of config.customBuffs ?? []) {
    definitions[buff.id] = buff.definition;
    if (buff.enabled) activeIds.push(buff.id);
  }
  return {
    buffDefinitions: Object.fromEntries(
      Object.entries(definitions).map(([id, definition]) => [
        id,
        compileIndependentBuffResource(definition, id, programs),
      ]),
    ),
    initializationPrograms: activeIds.map(buffId => {
      const graph: ActionGraphDefinition = {
        nodes: {
          initialize: {
            action: {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: buffId,
                source: 'battle',
                blackboardAssignments: {},
                definition: {
                  stackingType: 'unlimited',
                  blackboard: {},
                  children: [{ buffId, blackboardAssignments: {} }],
                },
              },
            },
            next: null,
          },
        },
      };
      return {
        key: buffId,
        initialBlackboard: {},
        sequence: programs
          .compile(graph, 0)
          .compileEntry({ $sequence: 'initialize' }, `GlobalModifiers.${buffId}.initialization`),
      };
    }),
  };
}
