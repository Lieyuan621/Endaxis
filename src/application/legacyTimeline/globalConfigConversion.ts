import type { GlobalConfigDocument } from '../../core/project/schema';
import type { CombatBuffDefinitionAttributeModifier } from '../../../packages/game-data-contract/src/buffs';

/** 旧版数值配置只在导入边界换成普通 Buff，不向模拟层传播旧修正类型。 */
export function convertLegacyGlobalConfig(
  input: unknown,
  warn: (message: string) => void,
): GlobalConfigDocument {
  if (!input || typeof input !== 'object') return {};
  const config = input as Record<string, unknown>;
  const result: GlobalConfigDocument = {};
  if (config.presetId === 'combo-cdr-50') {
    result.effects = [{ effectId: 'combo-cdr-50', enabled: true }];
  } else if (config.presetId) {
    warn(`未支持的全局配置：${String(config.presetId)}`);
  }
  const slots: Record<
    string,
    { attribute: string; slot: CombatBuffDefinitionAttributeModifier['slot']; percent: boolean }
  > = {
    cooldownReductionPercent: {
      attribute: 'ComboSkillCooldownScalar',
      slot: 'finalMultiplier',
      percent: true,
    },
    ultimateGainEfficiency: {
      attribute: 'UltimateSpGainScalar',
      slot: 'baseAddition',
      percent: true,
    },
    artsIntensity: {
      attribute: 'PhysicalAndSpellInflictionEnhance',
      slot: 'baseAddition',
      percent: false,
    },
    atkPercent: { attribute: 'Atk', slot: 'baseMultiplier', percent: true },
    critRate: { attribute: 'criticalRate', slot: 'baseAddition', percent: true },
    critDmg: { attribute: 'criticalDamageIncrease', slot: 'baseAddition', percent: true },
  };
  const attributes: CombatBuffDefinitionAttributeModifier[] = [];
  for (const raw of Array.isArray(config.customModifiers) ? config.customModifiers : []) {
    const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const rule = typeof item.modifier === 'string' ? slots[item.modifier] : undefined;
    const scopes = Array.isArray(item.skillTypes)
      ? item.skillTypes
      : item.skillTypes
        ? [item.skillTypes]
        : [];
    const cooldown = item.modifier === 'cooldownReductionPercent';
    if (
      item.kind !== 'operatorStat' ||
      !rule ||
      typeof item.value !== 'number' ||
      !Number.isFinite(item.value) ||
      (cooldown ? scopes.length !== 1 || scopes[0] !== 'comboSkill' : scopes.length > 0)
    ) {
      warn(`未支持的自定义数值：${String(item.modifier ?? item.kind)}`);
      continue;
    }
    const value = item.value / (rule.percent ? 100 : 1);
    attributes.push({
      attribute: rule.attribute,
      slot: rule.slot,
      value: cooldown ? 1 - value : value,
    });
  }
  if (attributes.length)
    result.customBuff = {
      stackingType: 'unlimited',
      presentation: { visible: false },
      attributeModifiers: attributes,
      actionGraph: { main: { nodes: {} }, macros: {} },
    };
  return result;
}
