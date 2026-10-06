import { commonBuffPresentationNameKeys } from '../../../data/buffs/generated/commonBuffPresentationNames.generated';
import { compoundStatusFactories } from '../../../data/buffs/compoundStatusFactories';
import { isCorrosionTimelineBuff } from '../../../core/projection/buffTimelineViz';
import type {
  BuffAttributeEffect,
  BuffDamageEffect,
} from '../../../core/combat/receipt/combatReceipt';

const ARTS_TYPES = ['heat', 'electric', 'cryo', 'nature'] as const;

/** 只聚合相同属性与公式槽；独立乘法相乘，其余槽相加，不改变原始回执。 */
function aggregateAttributeEffects(effects: readonly BuffAttributeEffect[]): BuffAttributeEffect[] {
  const attributes = new Map<string, Map<string, BuffAttributeEffect>>();
  for (const effect of effects) {
    if (!Number.isFinite(effect.value)) continue;
    let slots = attributes.get(effect.attribute);
    if (!slots) attributes.set(effect.attribute, (slots = new Map()));
    const previous = slots.get(effect.slot);
    const multiply = effect.slot === 'finalMultiplier' || effect.slot === 'baseFinalMultiplier';
    slots.set(effect.slot, {
      ...effect,
      value: previous
        ? multiply
          ? previous.value * effect.value
          : previous.value + effect.value
        : effect.value,
    });
  }
  return [...attributes.values()]
    .flatMap(slots => [...slots.values()])
    .sort(
      (a, b) =>
        effects.findIndex(effect => effect.attribute === a.attribute && effect.slot === a.slot) -
        effects.findIndex(effect => effect.attribute === b.attribute && effect.slot === b.slot),
    );
}

function aggregateDamageEffects(effects: readonly BuffDamageEffect[]): BuffDamageEffect[] {
  const result: BuffDamageEffect[] = [];
  for (const effect of effects) {
    // conditional 没有保存具体条件身份，不能仅因都“有条件”就合并；乘法和即时属性也单独保留。
    if (
      effect.conditional ||
      effect.multiplier !== undefined ||
      effect.attributeEffect ||
      effect.zone === 'product'
    ) {
      result.push(effect);
      continue;
    }
    const types = [...new Set(effect.damageTypes)].sort();
    const index = result.findIndex(
      other =>
        !other.conditional &&
        !other.attributeEffect &&
        other.multiplier === undefined &&
        other.side === effect.side &&
        other.zone === effect.zone &&
        JSON.stringify([...new Set(other.damageTypes)].sort()) === JSON.stringify(types),
    );
    if (index < 0) result.push({ ...effect });
    else result[index] = { ...effect, addition: result[index]!.addition + effect.addition };
  }
  const consumed = new Set<BuffDamageEffect>();
  return result.flatMap(effect => {
    if (consumed.has(effect)) return [];
    if (
      effect.conditional ||
      effect.attributeEffect ||
      effect.multiplier !== undefined ||
      effect.zone === 'product' ||
      effect.damageTypes?.length !== 1
    )
      return [effect];
    const arts = ARTS_TYPES.map(type =>
      result.find(
        other =>
          !other.conditional &&
          !other.attributeEffect &&
          other.multiplier === undefined &&
          other.side === effect.side &&
          other.zone === effect.zone &&
          other.damageTypes?.length === 1 &&
          other.damageTypes[0] === type &&
          Math.abs(other.addition - effect.addition) < 1e-10,
      ),
    );
    if (!arts.every(candidate => candidate !== undefined) || !arts.includes(effect))
      return [effect];
    for (const candidate of arts) consumed.add(candidate!);
    return [{ ...effect, damageTypes: [...ARTS_TYPES] }];
  });
}

// 反应方向来自已解析配方，而不是拆分 Buff ID 猜测。
const COMPOUND_NAME_KEYS = {
  heat: 'combustion',
  electric: 'electrification',
  cryo: 'solidification',
  nature: 'corrosion',
} as const;
const compoundNameKeys: Readonly<Record<string, string>> = Object.fromEntries(
  compoundStatusFactories.factories.flatMap(factory => [
    [factory.id, COMPOUND_NAME_KEYS[factory.incomingElement]],
    [factory.createdBuff.buffId, COMPOUND_NAME_KEYS[factory.incomingElement]],
  ]),
);

const scenarioBuffNameKeys: Readonly<Record<string, string>> = {
  'scenario:custom-values': 'timeline.globalModifiers.title',
};

export function collectBuffDisplayNameKeys(
  definitions: readonly Readonly<
    Record<string, { readonly presentation?: { readonly nameKey?: string } }>
  >[],
): ReadonlyMap<string, string> {
  return new Map(
    definitions.flatMap(buffs =>
      Object.entries(buffs).flatMap(([id, buff]) =>
        buff.presentation?.nameKey ? [[id, buff.presentation.nameKey] as const] : [],
      ),
    ),
  );
}

/** 用户名称保持原文，不当作翻译键解析。 */
export type BuffDisplayName = string | { readonly text: string };

export interface BuffDisplayI18n {
  readonly te: (key: string) => boolean;
  readonly t: (key: string, values?: Record<string, string>) => string;
}

export interface SimpleBuffModifierDisplayFact {
  readonly attribute?: string;
  readonly slot?: string;
  readonly value?: number;
}

/** 只展示已解析的属性事实；候选未启用时不把配置值当成生效加成。 */
export function resolveBuffEffectSummary(
  segment: {
    readonly buffId?: string;
    readonly enabled: boolean;
    readonly attributeEffects?: readonly import('../../../core/combat/receipt/combatReceipt').BuffAttributeEffect[];
    readonly damageEffects?: readonly import('../../../core/combat/receipt/combatReceipt').BuffDamageEffect[];
  },
  i18n: BuffDisplayI18n,
): string | undefined {
  if (!segment.enabled) return undefined;
  if (isCorrosionTimelineBuff(segment.buffId)) return i18n.t('buffEffects.corrosionOverTime');
  const attributes = aggregateAttributeEffects(segment.attributeEffects ?? []);
  const resistances = [
    'PhysicalResistance',
    'FireResistance',
    'PulseResistance',
    'CrystResistance',
    'NaturalResistance',
  ];
  const resistanceTypes = ['physical', 'heat', 'electric', 'cryo', 'nature'];
  const resistanceEffects = resistances.map(attribute =>
    attributes.find(effect => effect.attribute === attribute && effect.slot === 'baseAddition'),
  );
  const allResistance = resistanceEffects.every(
    effect =>
      effect !== undefined &&
      Number.isFinite(effect.value) &&
      Math.abs(effect.value - resistanceEffects[0]!.value) < 1e-10,
  );
  const artsGroups = [
    { suffix: 'DamageIncrease', nameKey: 'effects.name.dmgBonus:arts' },
    { suffix: 'EnhancedDamageIncrease', nameKey: 'effects.name.ampBonus:arts' },
    { suffix: 'VulnerabilityIncrease', nameKey: 'effects.name.susceptibility:arts' },
  ]
    .map(group => ({
      ...group,
      effects: ARTS_TYPES.map(type =>
        attributes.find(
          effect => effect.attribute === `${type}${group.suffix}` && effect.slot === 'baseAddition',
        ),
      ),
    }))
    .filter(group =>
      group.effects.every(
        effect => effect !== undefined && Math.abs(effect.value - group.effects[0]!.value) < 1e-10,
      ),
    );
  const lines = attributes.flatMap(effect => {
    const resistanceIndex = resistances.indexOf(effect.attribute);
    if (resistanceIndex >= 0 && effect.slot === 'baseAddition' && Number.isFinite(effect.value)) {
      if (allResistance && effect !== resistanceEffects[0]) return [];
      // 原生抗性已用百分点计量，不能像增伤比例那样再乘 100。
      const name = allResistance
        ? i18n.t('buffEffects.allResistance')
        : `${i18n.t(`buffEffects.types.${resistanceTypes[resistanceIndex]}`)}${i18n.t('buffEffects.resistance')}`;
      return [`${name}${formatSigned(effect.value)}%`];
    }
    const group = artsGroups.find(group => group.effects.includes(effect));
    if (group) {
      return effect === group.effects[0]
        ? [`${i18n.t(group.nameKey)}${formatSigned(effect.value * 100)}%`]
        : [];
    }
    const simple = resolveSimpleBuffModifierDisplayName(effect, i18n);
    if (simple !== undefined) return [simple];
    // 独立乘法与百分比加算必须明确区分，不能都写成“攻击力 +N%”。
    const presentation = SIMPLE_MODIFIER_PRESENTATIONS[`${effect.attribute}\u0000baseAddition`];
    const nameKey =
      effect.attribute === 'Atk'
        ? 'statDetail.atkBonus'
        : presentation
          ? `effects.name.${presentation.nameKey}`
          : undefined;
    const slotKey = `statDetail.attackSlots.${effect.slot}`;
    if (!nameKey || !i18n.te(nameKey) || !i18n.te(slotKey) || !Number.isFinite(effect.value))
      return [];
    const multiply = effect.slot === 'finalMultiplier' || effect.slot === 'baseFinalMultiplier';
    const percentage =
      effect.slot === 'multiplier' ||
      effect.slot === 'baseMultiplier' ||
      (!multiply && presentation?.format === 'percent');
    const value = multiply
      ? `×${Number(effect.value.toFixed(4))}`
      : `${formatSigned(effect.value * (percentage ? 100 : 1))}${percentage ? '%' : ''}`;
    return [`${i18n.t(nameKey)}（${i18n.t(slotKey)}）${value}`];
  });
  for (const effect of aggregateDamageEffects(segment.damageEffects ?? [])) {
    if (!Number.isFinite(effect.addition)) continue;
    const typeSet = new Set(effect.damageTypes);
    const isArts =
      typeSet.size === 4 && ['heat', 'electric', 'cryo', 'nature'].every(type => typeSet.has(type));
    const types = isArts
      ? i18n.t('buffEffects.arts')
      : effect.damageTypes?.map(type => i18n.t(`buffEffects.types.${type}`)).join(' / ');
    const side = i18n.t(`buffEffects.${effect.side}`, { type: types ?? '' }).trim();
    const zone = i18n.t(`hitDetail.damageZones.${effect.zone}`);
    const plainDamage = effect.zone === 'normal' || effect.zone === 'product';
    const value = effect.attributeEffect
      ? resolveBuffEffectSummary(
          { enabled: true, attributeEffects: [effect.attributeEffect] },
          i18n,
        )
      : effect.multiplier !== undefined
        ? `${formatSigned((effect.multiplier - 1) * 100)}%`
        : `${plainDamage ? '' : `${zone} `}${formatSigned(effect.addition * 100)}%`;
    if (value)
      lines.push(
        `${side}${effect.attributeEffect || (!plainDamage && effect.multiplier === undefined) ? ' · ' : ' '}${value}${effect.conditional ? `（${i18n.t('buffEffects.conditional')}）` : ''}`,
      );
  }
  return lines.length ? lines.join('\n') : undefined;
}

interface SimpleModifierPresentation {
  readonly nameKey: string;
  readonly format: 'percent' | 'flat';
}

const SIMPLE_MODIFIER_PRESENTATIONS: Readonly<Record<string, SimpleModifierPresentation>> = {
  'PhysicalAndSpellInflictionEnhance\u0000baseAddition': {
    nameKey: 'artsIntensity',
    format: 'flat',
  },
  'Hp\u0000baseMultiplier': { nameKey: 'hpPercent', format: 'percent' },
  'Hp\u0000baseAddition': { nameKey: 'flatHp', format: 'flat' },
  'Def\u0000baseMultiplier': { nameKey: 'defPercent', format: 'percent' },
  'Def\u0000baseAddition': { nameKey: 'flatDef', format: 'flat' },
  'Atk\u0000baseMultiplier': { nameKey: 'atkPercent', format: 'percent' },
  'Atk\u0000baseAddition': { nameKey: 'flatAtk', format: 'flat' },
  'criticalRate\u0000baseAddition': { nameKey: 'critRate', format: 'percent' },
  'criticalDamageIncrease\u0000baseAddition': { nameKey: 'critDmg', format: 'percent' },
  'physicalDamageIncrease\u0000baseAddition': {
    nameKey: 'dmgBonus:physical',
    format: 'percent',
  },
  'heatDamageIncrease\u0000baseAddition': { nameKey: 'dmgBonus:heat', format: 'percent' },
  'electricDamageIncrease\u0000baseAddition': {
    nameKey: 'dmgBonus:electric',
    format: 'percent',
  },
  'cryoDamageIncrease\u0000baseAddition': { nameKey: 'dmgBonus:cryo', format: 'percent' },
  'natureDamageIncrease\u0000baseAddition': { nameKey: 'dmgBonus:nature', format: 'percent' },
  'physicalEnhancedDamageIncrease\u0000baseAddition': {
    nameKey: 'ampBonus:physical',
    format: 'percent',
  },
  'heatEnhancedDamageIncrease\u0000baseAddition': { nameKey: 'ampBonus:heat', format: 'percent' },
  'electricEnhancedDamageIncrease\u0000baseAddition': {
    nameKey: 'ampBonus:electric',
    format: 'percent',
  },
  'cryoEnhancedDamageIncrease\u0000baseAddition': { nameKey: 'ampBonus:cryo', format: 'percent' },
  'natureEnhancedDamageIncrease\u0000baseAddition': {
    nameKey: 'ampBonus:nature',
    format: 'percent',
  },
  'physicalVulnerabilityIncrease\u0000baseAddition': {
    nameKey: 'susceptibility:physical',
    format: 'percent',
  },
  'heatVulnerabilityIncrease\u0000baseAddition': {
    nameKey: 'susceptibility:heat',
    format: 'percent',
  },
  'electricVulnerabilityIncrease\u0000baseAddition': {
    nameKey: 'susceptibility:electric',
    format: 'percent',
  },
  'cryoVulnerabilityIncrease\u0000baseAddition': {
    nameKey: 'susceptibility:cryo',
    format: 'percent',
  },
  'natureVulnerabilityIncrease\u0000baseAddition': {
    nameKey: 'susceptibility:nature',
    format: 'percent',
  },
};

function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded >= 0 ? '+' : ''}${rounded}`;
}

/** 仅格式化运行时已证明为单属性、单槽位的 Buff；未知组合返回 undefined。 */
export function resolveSimpleBuffModifierDisplayName(
  fact: SimpleBuffModifierDisplayFact | undefined,
  i18n: BuffDisplayI18n,
): string | undefined {
  if (
    fact?.attribute === undefined ||
    fact.slot === undefined ||
    fact.value === undefined ||
    !Number.isFinite(fact.value)
  ) {
    return undefined;
  }
  const presentation = SIMPLE_MODIFIER_PRESENTATIONS[`${fact.attribute}\u0000${fact.slot}`];
  if (presentation === undefined) return undefined;
  const effectKey = `effects.name.${presentation.nameKey}`;
  if (!i18n.te(effectKey)) return undefined;
  const rawValue =
    fact.slot === 'finalMultiplier' || fact.slot === 'baseFinalMultiplier'
      ? fact.value - 1
      : fact.value;
  const displayValue = presentation.format === 'percent' ? rawValue * 100 : rawValue;
  const label = i18n
    .t(effectKey)
    .replace(/[%％]$/, '')
    .trimEnd();
  return `${label}${formatSigned(displayValue)}${presentation.format === 'percent' ? '%' : ''}`;
}

/**
 * 展示配置只在应用层按 Buff ID 查询，不随定义穿过编译、运行时和回执。
 * 未配置的 Buff 使用来源名和可证明的单属性摘要，Buff ID 是透明的最后回退。
 */
export function resolveBuffDisplayName(
  buffId: string,
  i18n: BuffDisplayI18n,
  simpleModifier?: SimpleBuffModifierDisplayFact,
  sourceName?: string,
  operatorNameKeys: ReadonlyMap<string, BuffDisplayName> = new Map(),
): string {
  const customName = operatorNameKeys.get(buffId);
  if (typeof customName === 'object') return customName.text;
  // 公共 Buff 的产品配置是展示名的权威入口；运行时和投影只需提供稳定 Buff ID。
  const configuredNameKey =
    scenarioBuffNameKeys[buffId] ??
    customName ??
    commonBuffPresentationNameKeys[buffId as keyof typeof commonBuffPresentationNameKeys] ??
    compoundNameKeys[buffId];
  const key = configuredNameKey?.trim();
  if (key) {
    const effectKey = `effects.name.${key}`;
    if (i18n.te(effectKey)) return i18n.t(effectKey);
    if (i18n.te(key)) return i18n.t(key);
    return key;
  }
  const modifierSummary = resolveSimpleBuffModifierDisplayName(simpleModifier, i18n);
  const source = sourceName?.trim();
  if (source) return modifierSummary === undefined ? source : `${source} · ${modifierSummary}`;
  return modifierSummary ?? buffId;
}
