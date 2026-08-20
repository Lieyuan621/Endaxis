import type { OperatorStatus } from '../../types';
import type {
  Attributes,
  BaseStatValues,
  SheetStatEffect,
  ResolvedStatModifier,
  ScopedDamageModifier,
  StatSourceEntry,
  AttributeSourceEntry,
} from './types';
import { ATTR_MAP } from './baseValues';
import { computeScalingBasis } from './scaling';
import { passesDmgBonusSkillFilter, passesSkillFilter } from '@/data/filter';

/** Intrinsic baseline label — StatDetailDialog translates via statDetail.baseSource. */
export const STAT_SOURCE_BASE_LABEL = '__base__';

const ATTR_KEYS = ['strength', 'agility', 'intellect', 'will'] as const;

function pushStatSource(
  list: StatSourceEntry[],
  label: string | undefined,
  value: number,
): void {
  if (!Number.isFinite(value) || value === 0) return;
  const name = typeof label === 'string' && label.trim() ? label.trim() : STAT_SOURCE_BASE_LABEL;
  list.push({ label: name, value });
}

function pushAttributeSource(
  list: AttributeSourceEntry[],
  label: string | undefined,
  value: number,
  kind: AttributeSourceEntry['kind'],
): void {
  if (!Number.isFinite(value) || value === 0) return;
  const name = typeof label === 'string' && label.trim() ? label.trim() : STAT_SOURCE_BASE_LABEL;
  list.push({ label: name, value, kind });
}

function resolveAttrKey(
  raw: string,
  mainAttributeName: string,
  secondaryAttributeName: string,
): keyof Attributes | null {
  const mapped =
    raw === 'main'
      ? ATTR_MAP[mainAttributeName]
      : raw === 'sub'
        ? ATTR_MAP[secondaryAttributeName]
        : ATTR_MAP[raw];
  return mapped ?? null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract the base numeric value from a sheet effect (already level-resolved). */
function getEffectValue(effect: SheetStatEffect): number {
  if (effect.value !== undefined) {
    if (Array.isArray(effect.value)) {
      return effect.value[effect.value.length - 1] ?? 0;
    }
    return effect.value;
  }
  return 0;
}

// ─── Core stat computation ─────────────────────────────────────────────────

/**
 * Compute full operator stats from base values, sheet effects, and dynamic modifiers.
 *
 * Runs the full pipeline from scratch each call:
 *   Phase 1: Attribute resolution (both sheet + dynamic attribute modifiers)
 *   Phase 2: Scaling resolution (sheet effects with ScalingDef)
 *   Phase 4: Fixed value resolution (remaining sheet effects)
 *   Accumulation: all resolved sheet effects + all dynamic modifiers
 *   Derivation: ATK, HP, DEF formulas
 */
export function computeStats(
  base: BaseStatValues,
  sheetEffects: SheetStatEffect[],
  dynamicModifiers: ResolvedStatModifier[],
  targetSkillType?: string,
  targetSkillId?: string,
): OperatorStatus {
  const { baseAtk, baseHp, weaponAtk, mainAttributeName, secondaryAttributeName } = base;

  // ── Phase 1: Resolve attribute bonuses ──────────────────────────────────

  const attrs: Attributes = { ...base.baseAttrs };
  const attrPercent: Attributes = { strength: 0, agility: 0, intellect: 0, will: 0 };
  const attrExternalMult: Attributes = { strength: 1, agility: 1, intellect: 1, will: 1 };
  const resolvedValues = new Map<string, number>();
  const attributeSources: Record<(typeof ATTR_KEYS)[number], AttributeSourceEntry[]> = {
    strength: [],
    agility: [],
    intellect: [],
    will: [],
  };

  for (const key of ATTR_KEYS) {
    pushAttributeSource(attributeSources[key], STAT_SOURCE_BASE_LABEL, base.baseAttrs[key], 'base');
  }

  const applyAttributeModifier = (
    modifier: string,
    val: number,
    attributeField: string | string[],
    external: boolean | undefined,
    sourceLabel: string | undefined,
  ) => {
    const attributes = Array.isArray(attributeField) ? attributeField : [attributeField];
    for (const raw of attributes) {
      const key = resolveAttrKey(String(raw), mainAttributeName, secondaryAttributeName);
      if (!key) continue;
      if (modifier === 'attributePercent') {
        if (external) {
          const factor = 1 + val / 100;
          attrExternalMult[key] *= factor;
          pushAttributeSource(attributeSources[key], sourceLabel, factor, 'external');
        } else {
          const pct = val / 100;
          attrPercent[key] += pct;
          pushAttributeSource(attributeSources[key], sourceLabel, pct, 'percent');
        }
      } else {
        attrs[key] += val;
        pushAttributeSource(attributeSources[key], sourceLabel, val, 'flat');
      }
    }
  };

  // Sheet attribute effects
  for (const effect of sheetEffects) {
    const { modifier } = effect.stat;
    if (modifier === 'attributeFlat' || modifier === 'attributePercent') {
      const val = getEffectValue(effect);
      const attrStat = effect.stat as { modifier: typeof modifier; attribute: string | string[] };
      applyAttributeModifier(
        modifier,
        val,
        attrStat.attribute,
        effect.external,
        effect.name || effect.id,
      );
      if (effect.id) resolvedValues.set(effect.id, val);
    }
  }

  // Dynamic attribute modifiers (from simulation)
  for (const mod of dynamicModifiers) {
    const { modifier } = mod.stat;
    if (modifier === 'attributeFlat' || modifier === 'attributePercent') {
      const attrStat = mod.stat as { modifier: typeof modifier; attribute: string | string[] };
      applyAttributeModifier(
        modifier,
        mod.value,
        attrStat.attribute,
        mod.external,
        mod.sourceLabel || mod.effectId,
      );
    }
  }

  // Apply attribute bonuses: final = total * (1 + Σpct) * Π external, then floor.
  // External multipliers are applied last so they act as a final multiplier on the attribute.
  for (const key of ATTR_KEYS) {
    if (attrPercent[key] !== 0) {
      attrs[key] = attrs[key] * (1 + attrPercent[key]);
    }
    if (attrExternalMult[key] !== 1) {
      attrs[key] = attrs[key] * attrExternalMult[key];
    }
    attrs[key] = Math.floor(attrs[key]);
  }

  // ── Per-attribute ATK coefficients ──────────────────────────────────────

  const attrAtkCoeff: Attributes = { strength: 0, agility: 0, intellect: 0, will: 0 };
  const mainAttrKey = ATTR_MAP[mainAttributeName] ?? 'agility';
  const subAttrKey = ATTR_MAP[secondaryAttributeName] ?? 'intellect';
  attrAtkCoeff[mainAttrKey] = 0.005;
  attrAtkCoeff[subAttrKey] += 0.002;

  // Track effects converted to attribute coefficients (skip in accumulation)
  const attrCoeffEffects = new Set<string>();

  // ── Phase 2: Resolve scaling effects (sheet only) ───────────────────────

  for (const effect of sheetEffects) {
    if (!effect.scaling) continue;

    // Sum additive terms (already level-resolved by collect.ts)
    let additiveSum = 0;
    for (const term of effect.scaling.additive ?? []) {
      if (typeof term === 'number') {
        additiveSum += term;
      } else if ('value' in term) {
        additiveSum += term.value;
      } else if ('basis' in term) {
        additiveSum += computeScalingBasis(term.basis, attrs) * term.coefficient;
      }
    }

    // attributeAtkPercent: convert attribute additive contributions to per-attribute ATK coefficients
    if (effect.stat.modifier === 'attributeAtkPercent') {
      for (const term of effect.scaling.additive ?? []) {
        if (typeof term !== 'number' && 'basis' in term) {
          const coeff = term.coefficient / 100;
          for (const b of Array.isArray(term.basis) ? term.basis : [term.basis]) {
            attrAtkCoeff[b as keyof Attributes] += coeff;
          }
        }
      }
      if (effect.id) attrCoeffEffects.add(effect.id);
    }

    const cap = effect.scaling.cap;
    if (cap !== undefined) additiveSum = Math.min(additiveSum, cap);

    let resolved = getEffectValue(effect) + additiveSum;

    for (const m of effect.scaling.multiplier ?? []) {
      resolved *= m;
    }

    if (effect.id) resolvedValues.set(effect.id, resolved);
  }

  // ── Phase 4: Resolve remaining sheet effects (fixed/leveled) ────────────

  for (const effect of sheetEffects) {
    if (effect.id && !resolvedValues.has(effect.id)) {
      resolvedValues.set(effect.id, getEffectValue(effect));
    }
  }

  // ── Accumulation ────────────────────────────────────────────────────────

  let atkPercent = 0;
  let flatAtk = 0;
  let attrAtkBonusDelta = 0;
  let hpPercent = 0;
  let flatHp = 0;
  let defPercent = 0;
  let flatDef = 0;
  const intrinsic = base.intrinsicOverrides;
  let critRate = intrinsic?.critRate != null ? Number(intrinsic.critRate) || 0 : 0.05;
  let critDmg = intrinsic?.critDmg != null ? Number(intrinsic.critDmg) || 0 : 0.5;
  let artsIntensity = intrinsic?.artsIntensity != null ? Number(intrinsic.artsIntensity) || 0 : 0;
  let ultimateGainEfficiency =
    intrinsic?.ultimateGainEfficiency != null ? Number(intrinsic.ultimateGainEfficiency) || 0 : 0;
  let spRecoveryFlat = 0;
  let spRecoveryPercent = 0;
  let ultimateEnergyCostReduction = 0;
  let gearDefense = 0;
  let comboCdReductionFlat = 0;
  let ultCdReductionFlat = 0;
  let comboCdReductionPercent = 0;
  let ultCdReductionPercent = 0;
  let comboCdExternalMult = 1;
  let ultCdExternalMult = 1;
  const damageModifiers: ScopedDamageModifier[] = [];
  const atkPercentSources: StatSourceEntry[] = [];
  const critRateSources: StatSourceEntry[] = [];
  const critDmgSources: StatSourceEntry[] = [];
  const artsIntensitySources: StatSourceEntry[] = [];
  const ultimateGainEfficiencySources: StatSourceEntry[] = [];
  const comboCdReductionPercentSources: StatSourceEntry[] = [];
  const comboCdReductionFlatSources: StatSourceEntry[] = [];

  if (intrinsic?.defense != null) {
    flatDef += Number(intrinsic.defense) || 0;
  }
  if (intrinsic?.comboCdReductionPercent != null) {
    const pct = Number(intrinsic.comboCdReductionPercent) || 0;
    comboCdExternalMult *= Math.max(0, 1 - pct / 100);
    pushStatSource(comboCdReductionPercentSources, STAT_SOURCE_BASE_LABEL, pct);
  }

  // Intrinsic baselines (shown as "基础" in the attribute panel).
  pushStatSource(critRateSources, STAT_SOURCE_BASE_LABEL, critRate);
  pushStatSource(critDmgSources, STAT_SOURCE_BASE_LABEL, critDmg);
  if (artsIntensity !== 0) {
    pushStatSource(artsIntensitySources, STAT_SOURCE_BASE_LABEL, artsIntensity);
  }
  if (ultimateGainEfficiency !== 0) {
    pushStatSource(ultimateGainEfficiencySources, STAT_SOURCE_BASE_LABEL, ultimateGainEfficiency);
  }
  // `stat.skillTypes` matches the action's TYPE (generic group — sub-variants share it).
  // `stat.skillId` matches the specific skillId (targets a particular variant).
  const passesSkillScope = (stat: Record<string, unknown>): boolean => {
    if ('skillTypes' in stat && stat.skillTypes != null) {
      if (stat.skillTypes === 'nonSkill') {
        if (targetSkillType != null) return false;
      } else {
        const types = stat.skillTypes;
        const arr = (Array.isArray(types) ? types : [types]) as string[];
        if (!targetSkillType) return false;
        const matches =
          stat.modifier === 'dmgBonus'
            ? passesDmgBonusSkillFilter(arr, targetSkillType)
            : passesSkillFilter(arr, targetSkillType);
        if (!matches) return false;
      }
    }
    if ('skillId' in stat && stat.skillId != null) {
      const ids = stat.skillId;
      const arr = Array.isArray(ids) ? ids : [ids];
      if (!targetSkillId || !arr.includes(targetSkillId as never)) return false;
    }
    return true;
  };

  const isCooldownReductionModifier = (modifier: string): boolean =>
    modifier === 'cooldownReductionFlat' || modifier === 'cooldownReductionPercent';

  // Accumulate sheet effects
  for (const effect of sheetEffects) {
    if (effect.id && attrCoeffEffects.has(effect.id)) continue;

    const modifier = effect.stat.modifier;

    if (
      !isCooldownReductionModifier(modifier) &&
      !passesSkillScope(effect.stat as Record<string, unknown>)
    ) {
      continue;
    }

    const val = (effect.id ? resolvedValues.get(effect.id) : undefined) ?? getEffectValue(effect);
    accumulateStat(modifier, val, effect.stat, effect.id, effect.external, effect.name);
  }

  // Accumulate dynamic modifiers
  for (const mod of dynamicModifiers) {
    const { modifier } = mod.stat;

    // Attributes already handled in Phase 1
    if (modifier === 'attributeFlat' || modifier === 'attributePercent') continue;

    if (
      !isCooldownReductionModifier(modifier) &&
      !passesSkillScope(mod.stat as Record<string, unknown>)
    ) {
      continue;
    }

    accumulateStat(modifier, mod.value, mod.stat, mod.effectId, mod.external, mod.sourceLabel);
  }

  function accumulateStat(
    modifier: string,
    val: number,
    stat: Record<string, unknown>,
    effectId?: string,
    external?: boolean,
    sourceLabel?: string,
  ): void {
    const pct = val / 100;

    switch (modifier) {
      case 'atkPercent':
        atkPercent += pct;
        pushStatSource(atkPercentSources, sourceLabel, pct);
        break;
      case 'attributeAtkPercent':
        // Dynamic (runtime) mods arrive pre-resolved here; sheet effects were converted in Phase 2.
        attrAtkBonusDelta += pct;
        break;
      case 'atkFlat':
        flatAtk += val;
        break;
      case 'hpPercent':
        hpPercent += pct;
        break;
      case 'flatHp':
        flatHp += val;
        break;
      case 'defPercent':
        defPercent += pct;
        break;
      case 'flatDef':
        // Gear defense implicit effects contribute to gearDefense
        if (effectId?.endsWith(':defense')) {
          gearDefense += val;
        } else {
          flatDef += val;
        }
        break;
      case 'critRate':
        critRate += pct;
        pushStatSource(critRateSources, sourceLabel, pct);
        break;
      case 'critDmg':
        critDmg += pct;
        pushStatSource(critDmgSources, sourceLabel, pct);
        break;
      case 'artsIntensity':
        artsIntensity += val;
        pushStatSource(artsIntensitySources, sourceLabel, val);
        break;
      case 'ultimateGainEfficiency':
        ultimateGainEfficiency += val;
        pushStatSource(ultimateGainEfficiencySources, sourceLabel, val);
        break;
      case 'spRecoveryFlat':
        spRecoveryFlat += val;
        break;
      case 'spRecoveryPercent':
        spRecoveryPercent += pct;
        break;
      case 'ultimateEnergyCostReduction':
        ultimateEnergyCostReduction += pct;
        break;

      // Damage modifiers — collect with full scope
      case 'dmgBonus':
        damageModifiers.push({
          modifier: 'dmgBonus',
          value: pct,
          elements: stat.elements as ScopedDamageModifier['elements'],
          skillTypes: stat.skillTypes as ScopedDamageModifier['skillTypes'],
          skillId: stat.skillId as ScopedDamageModifier['skillId'],
          external,
          effectId,
          sourceLabel,
        });
        break;
      case 'ampBonus':
        damageModifiers.push({
          modifier: 'ampBonus',
          value: pct,
          elements: stat.elements as ScopedDamageModifier['elements'],
          effectId,
          sourceLabel,
        });
        break;
      case 'directMultiplier':
        damageModifiers.push({
          modifier: 'directMultiplier',
          value: val,
          skillTypes: stat.skillTypes as ScopedDamageModifier['skillTypes'],
          skillId: stat.skillId as ScopedDamageModifier['skillId'],
          effectId,
          sourceLabel,
        });
        break;
      case 'resistanceIgnore':
        damageModifiers.push({
          modifier: 'resistanceIgnore',
          value: pct,
          elements: stat.elements as ScopedDamageModifier['elements'],
        });
        break;
      case 'susceptibilityAmplify':
        damageModifiers.push({
          modifier: 'susceptibilityAmplify',
          value: pct,
          elements: stat.elements as ScopedDamageModifier['elements'],
          skillTypes: stat.skillTypes as ScopedDamageModifier['skillTypes'],
          skillId: stat.skillId as ScopedDamageModifier['skillId'],
        });
        break;

      // Attributes already handled in Phase 1
      case 'attributeFlat':
      case 'attributePercent':
        break;

      // Enemy stats — shouldn't appear here, skip gracefully
      case 'susceptibility':
      case 'increasedDmgTaken':
      case 'resistanceShred':
        break;

      // Cooldown reduction — accumulated per skill scope (combo vs ultimate)
      case 'cooldownReductionFlat': {
        const skillTypes = stat.skillTypes;
        const arr: string[] = skillTypes
          ? Array.isArray(skillTypes)
            ? skillTypes
            : [skillTypes as string]
          : [];
        if (arr.length === 0 || arr.includes('comboSkill')) {
          comboCdReductionFlat += val;
          pushStatSource(comboCdReductionFlatSources, sourceLabel, val);
        }
        if (arr.length === 0 || arr.includes('ultimate')) ultCdReductionFlat += val;
        break;
      }
      case 'cooldownReductionPercent': {
        const skillTypes = stat.skillTypes;
        const arr: string[] = skillTypes
          ? Array.isArray(skillTypes)
            ? skillTypes
            : [skillTypes as string]
          : [];
        const combo = arr.length === 0 || arr.includes('comboSkill');
        const ult = arr.length === 0 || arr.includes('ultimate');
        // Always Π(1 - pct/100); never additive.
        const f = Math.max(0, 1 - val / 100);
        if (combo) {
          comboCdExternalMult *= f;
          // Store percent-points (50 = 50%) for display.
          pushStatSource(comboCdReductionPercentSources, sourceLabel, val);
        }
        if (ult) ultCdExternalMult *= f;
        break;
      }

      // Link stacks are handled by the simulation (consumed at ACTION_START)
      case 'link':
        break;
    }
  }

  // ── Derivation ──────────────────────────────────────────────────────────

  const mainAttribute = attrs[ATTR_MAP[mainAttributeName] ?? 'agility'];
  const secondaryAttribute = attrs[ATTR_MAP[secondaryAttributeName] ?? 'intellect'];

  const attributeBonus =
    1 +
    attrAtkCoeff.strength * attrs.strength +
    attrAtkCoeff.agility * attrs.agility +
    attrAtkCoeff.intellect * attrs.intellect +
    attrAtkCoeff.will * attrs.will +
    attrAtkBonusDelta;
  const baseAtkTotal = baseAtk + weaponAtk;
  const attack = Math.floor((baseAtkTotal * (1 + atkPercent) + flatAtk) * attributeBonus);

  const health = Math.floor((baseHp + attrs.strength * 5) * (1 + hpPercent) + flatHp);
  const defense = Math.floor(gearDefense * (1 + defPercent) + flatDef);
  artsIntensity = Math.round(artsIntensity * 100) / 100;

  // Round percentage stats
  critRate = Math.floor(critRate * 1000) / 1000;
  critDmg = Math.floor(critDmg * 1000) / 1000;
  ultimateGainEfficiency = Math.floor(ultimateGainEfficiency * 10) / 10;

  return {
    attack,
    health,
    defense,
    critRate,
    critDmg,
    artsIntensity,
    ultimateGainEfficiency,
    attributes: attrs,
    attributeSources,
    mainAttributeName,
    secondaryAttributeName,
    mainAttribute,
    secondaryAttribute,
    baseAtk: { operator: baseAtk, weapon: weaponAtk },
    atkPercent,
    flatAtk,
    atkPercentSources,
    attrAtkCoeff,
    baseHp,
    hpPercent,
    flatHp,
    baseDef: 0, // operators have no base DEF stat
    gearDefense,
    defPercent,
    flatDef,
    spRecoveryFlat,
    spRecoveryPercent,
    ultimateEnergyCostReduction,
    comboCdReductionFlat,
    ultCdReductionFlat,
    comboCdReductionPercent,
    ultCdReductionPercent,
    comboCdExternalMult,
    ultCdExternalMult,
    critRateSources,
    critDmgSources,
    artsIntensitySources,
    ultimateGainEfficiencySources,
    comboCdReductionPercentSources,
    comboCdReductionFlatSources,
    damageModifiers,
  };
}
