// @ts-nocheck
import type {
  Attribute,
  Effect,
  TriggerEffect,
  ScalingDef,
  WeaponSheet,
  PatchEffect,
  PatchHit,
  PatchTick,
  Patch,
  Hit,
  HitGroup,
  TickGroup,
  CombatSkillEntry,
  FlatSkillEntry,
  ResolvedEffect,
  ResolvedTriggerEffect,
  ResolvedScalingDef,
  DerivedEffect,
  Leveled,
  PatchableEffectFields,
  Segment,
  OperatorSheet,
  DamageElement,
} from './types';
import { resolveLeveled, isTickGroup, createFinisherEntry, createDiveEntry } from './types';
import type { TeamInstance, OperatorInstance, WeaponInstance, GearInstance } from '../types';
import { getOperator, getWeapon, getGearPiece, getGearSet } from './index';
import { resolveEffectDefaults } from './effectPresets';
import { uid } from '@/utils/uid';
import { i18n } from '@/i18n';
import {
  getGearSetGameName,
  getOperatorPotentialName,
  getOperatorTalentName,
} from './gameText';

export interface CollectedEffect {
  effect: ResolvedEffect;
  /** Index of the team slot this effect originates from (0-3). */
  sourceSlotIndex: number;
  /** Slug of the operator in the source slot. */
  sourceOperatorSlug: string;
}

interface CollectedTriggerEffect {
  triggerEffect: ResolvedTriggerEffect;
  sourceSlotIndex: number;
  sourceOperatorSlug: string;
  /** Skill type this trigger originates from, if defined under a combatSkill section. */
  sourceSkillType?: string;
}

/** Count gear pieces per set slug for the four gear slots in a team slot. */
function computeSetCounts(
  slot: {
    gear: { armor: string | null; gloves: string | null; kit1: string | null; kit2: string | null };
  },
  gearInstances: GearInstance[],
): Map<string, number> {
  const setCounts = new Map<string, number>();
  for (const gearId of [slot.gear.armor, slot.gear.gloves, slot.gear.kit1, slot.gear.kit2]) {
    if (!gearId) continue;
    const gInst = gearInstances.find(g => g.id === gearId);
    if (!gInst) continue;
    const piece = getGearPiece(gInst.gearPieceId);
    if (!piece) continue;
    const setKey = piece.setSlug ?? '';
    setCounts.set(setKey, (setCounts.get(setKey) ?? 0) + 1);
  }
  return setCounts;
}

/**
 * Flatten combatSkills into a unified list that includes sub-skills as top-level entries.
 * Each entry carries its own `skillKey` (for id generation) and `levelKey` (parent skill,
 * for level resolution — sub-skills share their parent's level).
 */
function flatSkills(
  combatSkills: Record<string, CombatSkillEntry>,
  finisherElement?: DamageElement,
  diveElement?: DamageElement,
): { skillKey: string; skill: CombatSkillEntry; levelKey: string }[] {
  const result: { skillKey: string; skill: CombatSkillEntry; levelKey: string }[] = [];
  for (const [skillKey, skill] of Object.entries(combatSkills)) {
    result.push({ skillKey, skill, levelKey: skillKey });
    for (const sub of skill.subSkills ?? []) {
      result.push({
        skillKey: sub.id ?? sub.name,
        skill: sub as CombatSkillEntry,
        levelKey: skillKey,
      });
    }
  }
  // Inject synthetic finisher/dive entries (share basicAttack's level)
  result.push({
    skillKey: 'finisher',
    skill: createFinisherEntry(finisherElement),
    levelKey: 'basicAttack',
  });
  result.push({
    skillKey: 'dive',
    skill: createDiveEntry(diveElement),
    levelKey: 'basicAttack',
  });
  return result;
}

/**
 * Collect all damage-relevant effects from a team composition.
 * Looks up effect sheets for each slot's operator, weapon, and gear set,
 * then annotates each effect with its source slot index.
 */
export function collectEffects(
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
  weaponInstances: WeaponInstance[],
  gearInstances: GearInstance[],
): CollectedEffect[] {
  const collected: CollectedEffect[] = [];
  const collectedPatches: Patch[] = [];

  for (let slotIndex = 0; slotIndex < team.slots.length; slotIndex++) {
    const slot = team.slots[slotIndex];
    if (!slot.operatorId) continue;

    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) continue;

    const operatorSlug = opInst.operatorSlug;

    // --- Operator effects (talents + potentials + skillEffects) ---
    const op = getOperator(operatorSlug);
    if (op) {
      // Pre-scan AppendEffect patches targeting passive effect arrays (talents, potentials, skill effects).
      // Key: target effect id → list of { effect: raw Effect, idx: level index to resolve at }
      const appendPassiveByTarget = new Map<string, { effect: Effect; idx: number }[]>();
      for (let groupIdx = 0; groupIdx < op.talents.length; groupIdx++) {
        const state = opInst.talentStates[String(groupIdx)];
        if (!state || state <= 0) continue;
        const idx = state - 1;
        for (const patch of op.talents[groupIdx].patches ?? []) {
          if (patch.kind === 'appendEffect') {
            const list = appendPassiveByTarget.get(patch.targetEffect) ?? [];
            list.push({ effect: patch.effect, idx });
            appendPassiveByTarget.set(patch.targetEffect, list);
          }
        }
      }
      for (let i = 0; i < op.potentials.length; i++) {
        if (i + 1 > opInst.potential) continue;
        for (const patch of op.potentials[i].patches ?? []) {
          if (patch.kind === 'appendEffect') {
            const list = appendPassiveByTarget.get(patch.targetEffect) ?? [];
            list.push({ effect: patch.effect, idx: 0 });
            appendPassiveByTarget.set(patch.targetEffect, list);
          }
        }
      }

      // Helper: push appended effects for a just-collected effect
      const pushAppends = (
        effectId: string | undefined,
        sourceGroup: 'operator' | 'weapon' | 'gearSet',
      ) => {
        if (!effectId || appendPassiveByTarget.size === 0) return;
        const appends = appendPassiveByTarget.get(effectId);
        if (!appends) return;
        for (const { effect, idx } of appends) {
          collected.push({
            effect: resolveEffect(hydrateEffect(effect, sourceGroup, ''), idx),
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
        }
      };

      // Talents: iterate groups, check state, walk nested effects
      let talentFlatIndex = 0;
      for (let groupIdx = 0; groupIdx < op.talents.length; groupIdx++) {
        const group = op.talents[groupIdx];
        const state = opInst.talentStates[String(groupIdx)];
        if (!state || state <= 0) {
          talentFlatIndex += group.levels ?? 0;
          continue;
        }
        const idx = state - 1;
        const talentName = getOperatorTalentName(operatorSlug, talentFlatIndex, idx);
        for (const patch of group.patches ?? []) collectedPatches.push(patch);
        for (let effIdx = 0; effIdx < (group.effects?.length ?? 0); effIdx++) {
          const nested = group.effects![effIdx];
          const stamped = resolveEffect(
            ensureEffectId(
              hydrateEffect(nested, 'operator', talentName),
              makeEffectId(operatorSlug, `talent${groupIdx}`, `effect${effIdx}`),
            ),
            idx,
          );
          collected.push({
            effect: stamped,
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
          pushAppends(stamped.id, 'operator');
        }
        talentFlatIndex += group.levels ?? 0;
      }

      // Potentials: check level gate per entry (potentials[0] = game P1)
      for (let i = 0; i < op.potentials.length; i++) {
        if (i + 1 > opInst.potential) continue;
        const potentialName = getOperatorPotentialName(operatorSlug, i);
        for (const patch of op.potentials[i].patches ?? []) collectedPatches.push(patch);
        for (let effIdx = 0; effIdx < (op.potentials[i].effects?.length ?? 0); effIdx++) {
          const nested = op.potentials[i].effects![effIdx];
          const effect = ensureEffectId(
            hydrateEffect(nested, 'operator', potentialName),
            makeEffectId(operatorSlug, `potential${i}`, `effect${effIdx}`),
          );
          collected.push({ effect, sourceSlotIndex: slotIndex, sourceOperatorSlug: operatorSlug });
          pushAppends(effect.id, 'operator');
        }
      }

      // Combat skill passive effects: resolved by skill level (1-12)
      for (const { skillKey, skill, levelKey } of flatSkills(
        op.combatSkills,
        op.finisherElement,
        op.diveElement,
      )) {
        const lvlIdx = Math.min((opInst.skillLevels[levelKey] ?? 1) - 1, 11);
        for (let effIdx = 0; effIdx < (skill.effects?.length ?? 0); effIdx++) {
          const nested = skill.effects![effIdx];
          const stamped = resolveEffect(
            ensureEffectId(
              hydrateEffect(nested, 'operator', ''),
              makeEffectId(operatorSlug, skillKey, `effect${effIdx}`),
            ),
            lvlIdx,
          );
          collected.push({
            effect: stamped,
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
          pushAppends(stamped.id, 'operator');
        }
      }
    }

    // --- Weapon effects ---
    const wInst = slot.weaponId ? weaponInstances.find(w => w.id === slot.weaponId) : null;
    if (wInst) {
      const wSheet = getWeapon(wInst.weaponSlug);
      if (wSheet) {
        addWeaponSheetEffects(collected, wSheet, wInst, slotIndex, operatorSlug);
      }
    }

    // --- Gear set effects (need 3+ pieces for set bonus) ---
    const setCounts = computeSetCounts(slot, gearInstances);
    for (const [setSlug, count] of setCounts) {
      if (count < 3) continue;
      const gsSheet = getGearSet(setSlug);
      if (gsSheet) {
        const setDisplayName = getGearSetGameName(setSlug);
        for (let effIdx = 0; effIdx < gsSheet.effects.length; effIdx++) {
          const nested = gsSheet.effects[effIdx];
          const effect = ensureEffectId(
            hydrateEffect(nested, 'gearSet', setDisplayName),
            makeEffectId(setSlug, `effect${effIdx}`),
          );
          collected.push({ effect, sourceSlotIndex: slotIndex, sourceOperatorSlug: operatorSlug });
        }
      }
    }

    // --- Implicit effects: gear substats + defense ---
    const opData = getOperator(operatorSlug);
    let gearEffIdx = 0;
    for (const gearSlotKey of ['armor', 'gloves', 'kit1', 'kit2'] as const) {
      const gearId = slot.gear[gearSlotKey];
      if (!gearId) continue;
      const gInst = gearInstances.find(g => g.id === gearId);
      if (!gInst) continue;
      const piece = getGearPiece(gInst.gearPieceId);
      if (!piece) continue;

      if (piece.defense > 0) {
        const translatedSlot = i18n.global.t(`game.slotType.${gearSlotKey}`, gearSlotKey);
        const translatedDef = i18n.global.t('game.stat.defense', 'Defense');
        const defEffect = resolveEffect(
          {
            kind: 'status',
            id: `implicit:gear:${gearSlotKey}:defense`,
            name: `${translatedSlot} ${translatedDef}`,
            stat: { modifier: 'flatDef' },
            target: 'self',
            value: piece.defense,
            sourceGroup: 'gearSet',
          },
          0,
        );
        gearEffIdx++;
        collected.push({
          effect: defEffect,
          sourceSlotIndex: slotIndex,
          sourceOperatorSlug: operatorSlug,
        });
      }

      const skillSlots = [piece.skill1, piece.skill2, piece.skill3];
      for (let slotIdx = 0; slotIdx < skillSlots.length; slotIdx++) {
        const slot = skillSlots[slotIdx];
        if (!slot) continue;
        const artificingLevel = gInst.artificingLevels[slotIdx] ?? 0;
        for (const raw of slot.effects ?? []) {
          if (raw.kind !== 'status') continue;
          const resolved = resolveContextualAttributes(
            resolveEffect(
              ensureEffectId(
                { ...raw, sourceGroup: 'gearSet' },
                makeEffectId(operatorSlug, 'gear-implicit', `effect${gearEffIdx++}`),
              ),
              artificingLevel,
            ),
            opData?.mainAttribute,
            opData?.subAttribute,
          );
          if (resolved.kind === 'status' && !resolved.stat) continue;
          collected.push({
            effect: resolved,
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
        }
      }
    }
  }

  return resolvePatches(collected, collectedPatches).map(ce => ({
    ...ce,
    effect: resolveEffectDefaults(ce.effect),
  }));
}

/**
 * Resolve 'main'/'sub' attribute placeholders on a stat to concrete attributes for a given
 * operator. Returns the same stat reference when there is nothing to resolve.
 *
 * `'main'`/`'sub'` is a target-relative placeholder: it must be resolved against the operator
 * the effect lands on. For self-scoped effects that happens at collection (source == target);
 * for team-scoped effects it is deferred to each target-binding point (partition / sim
 * initial-effects / triggered dispatch), which call this with the target operator's attributes.
 */
export function resolveStatAttributes(stat, mainAttribute, subAttribute) {
  if (!stat || !('attribute' in stat)) return stat;
  const map = (a) =>
    a === 'main' ? (mainAttribute ?? a) : a === 'sub' ? (subAttribute ?? a) : a;
  const attr = stat.attribute;
  const resolved = Array.isArray(attr) ? attr.map(map) : map(attr);
  if (resolved === attr) return stat;
  return { ...stat, attribute: resolved };
}

/** Replace 'main'/'sub' attribute placeholders on an effect with the operator's actual attributes. */
function resolveContextualAttributes(
  effect: ResolvedEffect,
  mainAttribute?: Attribute,
  subAttribute?: Attribute,
): ResolvedEffect {
  if (!('stat' in effect)) return effect;
  const stat = effect.stat;
  const resolved = resolveStatAttributes(stat, mainAttribute, subAttribute);
  if (resolved === stat) return effect;
  return { ...effect, stat: resolved } as ResolvedEffect;
}

/** Add weapon sheet effects, resolving array value to the correct skill level. */
function addWeaponSheetEffects(
  collected: CollectedEffect[],
  sheet: WeaponSheet,
  wInst: WeaponInstance,
  slotIndex: number,
  operatorSlug: string,
): void {
  const opData = getOperator(operatorSlug);
  const skills = [
    { effects: sheet.skill1.effects, level: wInst.skill1Level },
    { effects: sheet.skill2.effects, level: wInst.skill2Level },
    { effects: sheet.skill3.effects, level: wInst.skill3Level },
  ];

  const skillKeys = ['skill1', 'skill2', 'skill3'];
  for (let skillNum = 0; skillNum < skills.length; skillNum++) {
    const { effects, level } = skills[skillNum];
    if (!effects) continue;
    const skillKey = skillKeys[skillNum];
    for (let effIdx = 0; effIdx < effects.length; effIdx++) {
      const raw = effects[effIdx];
      const lvlIdx = Math.min(level - 1, 11);
      const resolved = resolveContextualAttributes(
        resolveEffect(
          ensureEffectId(
            { ...raw, sourceGroup: 'weapon', icon: raw.icon ?? sheet.icon },
            makeEffectId(wInst.weaponSlug, skillKey, `effect${effIdx}`),
          ),
          lvlIdx,
        ),
        opData?.mainAttribute,
        opData?.subAttribute,
      );
      collected.push({
        effect: resolved,
        sourceSlotIndex: slotIndex,
        sourceOperatorSlug: operatorSlug,
      });
    }
  }
}

/** Hydrate an effect by injecting sourceGroup and default name. Preserves the input type. */
function hydrateEffect<T extends Effect | ResolvedEffect>(
  effect: T,
  sourceGroup: 'operator' | 'weapon' | 'gearSet',
  defaultName: string,
): T {
  return {
    ...effect,
    sourceGroup,
    name: effect.name ?? defaultName,
  } as T;
}

/** Resolve a ScalingDef's leveled values to scalars at the given level index. */
export function resolveScalingDef(scaling: ScalingDef, idx: number): ResolvedScalingDef {
  return {
    additive: scaling.additive?.map(term => {
      if (typeof term === 'number') return term;
      if (Array.isArray(term)) return resolveLeveled(term, idx);
      if ('key' in term)
        return {
          key: term.key,
          target: term.target,
          coefficient: resolveLeveled(term.coefficient, idx),
        };
      return { basis: term.basis, coefficient: resolveLeveled(term.coefficient, idx) };
    }),
    multiplier: scaling.multiplier?.map(m => resolveLeveled(m, idx)),
    ...(scaling.cap !== undefined ? { cap: resolveLeveled(scaling.cap, idx) } : {}),
    ...(scaling.conditionalScaling !== undefined
      ? {
          conditionalScaling: {
            condition: scaling.conditionalScaling.condition,
            scaling: resolveScalingDef(scaling.conditionalScaling.scaling, idx),
          },
        }
      : {}),
  };
}

/** Resolve all leveled fields in an Effect to scalars at the given level index. */
export function resolveEffect(effect: Effect, idx: number): ResolvedEffect {
  const base = {
    ...effect,
    id: effect.id ?? uid(),
    ...(effect.duration !== undefined ? { duration: resolveLeveled(effect.duration, idx) } : {}),
    stacks:
      effect.stacks === undefined || effect.stacks === 'fromConsume'
        ? effect.stacks
        : resolveLeveled(effect.stacks as Leveled<number>, idx),
    ...(effect.maxStacks !== undefined ? { maxStacks: resolveLeveled(effect.maxStacks, idx) } : {}),
  };
  if (effect.kind === 'damageHit') {
    const h = effect.hit;
    return {
      ...base,
      multiplier: resolveLeveled(effect.multiplier, idx),
      ...(effect.multiplierScaling
        ? { multiplierScaling: resolveScalingDef(effect.multiplierScaling, idx) }
        : {}),
      ...(effect.staggerScaling
        ? { staggerScaling: resolveScalingDef(effect.staggerScaling, idx) }
        : {}),
      ...(h
        ? {
            hit: {
              ...(h.spRecovery !== undefined
                ? { spRecovery: resolveLeveled(h.spRecovery, idx) }
                : {}),
              ...(h.spReturn !== undefined ? { spReturn: resolveLeveled(h.spReturn, idx) } : {}),
              ...(h.stagger !== undefined ? { stagger: resolveLeveled(h.stagger, idx) } : {}),
              ...(h.effects !== undefined
                ? {
                    effects: h.effects.map(e => resolveEffect(e.id ? e : { ...e, id: uid() }, idx)),
                  }
                : {}),
            },
          }
        : {}),
    } as ResolvedEffect;
  }
  if (effect.kind === 'damageOverTime') {
    return {
      ...base,
      multiplier: resolveLeveled(effect.multiplier, idx),
      ...(effect.multiplierScaling
        ? { multiplierScaling: resolveScalingDef(effect.multiplierScaling, idx) }
        : {}),
      ...(effect.consumedStatEffects
        ? {
            consumedStatEffects: effect.consumedStatEffects.map(ce => ({
              stat: ce.stat,
              value: resolveLeveled(ce.value, idx),
            })),
          }
        : {}),
    } as ResolvedEffect;
  }
  if (
    effect.kind === 'spRecovery' ||
    effect.kind === 'spReturn' ||
    effect.kind === 'ultEnergyGain'
  ) {
    return {
      ...base,
      value: resolveLeveled(effect.value, idx),
      scaling: effect.scaling ? resolveScalingDef(effect.scaling, idx) : undefined,
    } as ResolvedEffect;
  }
  if (effect.kind === 'derived') {
    const d = effect as DerivedEffect;
    if (d.effect) {
      const e = d.effect as Record<string, any>;
      // Resolve leveled values inside the override so resolveDerivedEffect
      // merges scalars (not arrays) into the expanded effect.
      (base as any).effect = {
        ...e,
        ...(e.duration !== undefined ? { duration: resolveLeveled(e.duration, idx) } : {}),
        ...(e.value !== undefined ? { value: resolveLeveled(e.value, idx) } : {}),
        ...(e.stacks !== undefined && e.stacks !== 'fromConsume'
          ? { stacks: resolveLeveled(e.stacks as Leveled<number>, idx) }
          : {}),
        ...(e.maxStacks !== undefined ? { maxStacks: resolveLeveled(e.maxStacks, idx) } : {}),
        ...(e.durationExtension !== undefined
          ? { durationExtension: resolveLeveled(e.durationExtension, idx) }
          : {}),
        ...(e.icd !== undefined ? { icd: resolveLeveled(e.icd, idx) } : {}),
        ...(e.multiplier !== undefined ? { multiplier: resolveLeveled(e.multiplier, idx) } : {}),
        ...(e.multiplierScaling !== undefined
          ? { multiplierScaling: resolveScalingDef(e.multiplierScaling, idx) }
          : {}),
      };
      return base as ResolvedEffect;
    }
    return base as ResolvedEffect;
  }
  if (effect.kind === 'oneTime') {
    return {
      ...base,
      value: resolveLeveled(effect.value, idx),
    } as ResolvedEffect;
  }
  if (effect.kind === 'cooldownReductionFlat' || effect.kind === 'cooldownReductionPercent') {
    return {
      ...base,
      value: resolveLeveled(effect.value, idx),
    } as ResolvedEffect;
  }
  if (effect.kind === 'physicalStatus' && effect.effectiveness !== undefined) {
    return {
      ...base,
      effectiveness: resolveLeveled(effect.effectiveness, idx),
    } as ResolvedEffect;
  }
  if (effect.kind !== 'status') return base as ResolvedEffect;
  return {
    ...base,
    value: effect.value !== undefined ? resolveLeveled(effect.value, idx) : undefined,
    scaling: effect.scaling ? resolveScalingDef(effect.scaling, idx) : undefined,
  } as ResolvedEffect;
}

/**
 * Merge two ScalingDefs: additive and multiplier arrays are concatenated
 * (each side contributes its own terms); cap is replaced by the patch if present.
 */
function mergeScaling(
  base: ResolvedScalingDef | ScalingDef | undefined,
  patch: ScalingDef,
): ResolvedScalingDef {
  const additive = [...(base?.additive ?? []), ...(patch.additive ?? [])];
  const multiplier = [...(base?.multiplier ?? []), ...(patch.multiplier ?? [])];
  const result: ResolvedScalingDef = {};
  if (additive.length) result.additive = additive as ResolvedScalingDef['additive'];
  if (multiplier.length) result.multiplier = multiplier as number[];
  const cap = patch.cap !== undefined ? patch.cap : base?.cap;
  if (cap !== undefined) result.cap = cap as number;
  const condScaling = patch.conditionalScaling ?? base?.conditionalScaling;
  if (condScaling)
    result.conditionalScaling = condScaling as ResolvedScalingDef['conditionalScaling'];
  return result;
}

/** Merge patch fields into a target effect, deep-merging ScalingDef. */
function applyEffectPatch(
  target: ResolvedEffect,
  patchFields: Partial<PatchableEffectFields>,
): ResolvedEffect;
function applyEffectPatch(target: Effect, patchFields: Partial<PatchableEffectFields>): Effect;
function applyEffectPatch(
  target: Effect | ResolvedEffect,
  patchFields: Partial<PatchableEffectFields>,
): Effect | ResolvedEffect {
  const fields = patchFields as Record<string, unknown>;
  const {
    scaling: patchScaling,
    consumedStatEffects: patchConsumed,
    multiplierScaling: patchMultiplierScaling,
    ...rest
  } = fields;
  const merged = { ...target, ...rest };
  if (
    patchScaling !== undefined &&
    (target.kind === 'status' ||
      target.kind === 'spRecovery' ||
      target.kind === 'spReturn' ||
      target.kind === 'ultEnergyGain')
  ) {
    (merged as any).scaling = mergeScaling((target as any).scaling, patchScaling as ScalingDef);
  }
  if (patchConsumed !== undefined && target.kind === 'damageOverTime') {
    const existing = (target as any).consumedStatEffects ?? [];
    (merged as any).consumedStatEffects = [...existing, ...(patchConsumed as any[])];
  }
  if (
    patchMultiplierScaling !== undefined &&
    (target.kind === 'damageHit' || target.kind === 'damageOverTime')
  ) {
    (merged as any).multiplierScaling = mergeScaling(
      (target as any).multiplierScaling,
      patchMultiplierScaling as ScalingDef,
    );
  }
  return merged as Effect | ResolvedEffect;
}

/**
 * Expand a DerivedEffect into a ResolvedEffect by copying the source and merging overrides.
 * Returns null if the source effect is not present (e.g. talent inactive).
 */
function resolveDerivedEffect(
  derived: DerivedEffect,
  effectById: Map<string, CollectedEffect>,
): ResolvedEffect | null {
  const sourceCe = effectById.get(derived.sourceEffect);
  if (!sourceCe) return null;
  const source = sourceCe.effect as ResolvedEffect;
  const base: ResolvedEffect = {
    ...source,
    ...(derived.id !== undefined ? { id: derived.id } : {}),
    ...(derived.condition !== undefined ? { condition: derived.condition } : {}),
    ...(derived.name !== undefined ? { name: derived.name } : {}),
    ...(derived.icon !== undefined ? { icon: derived.icon } : {}),
    ...(derived.icd !== undefined ? { icd: derived.icd } : {}),
  };
  return derived.effect ? applyEffectPatch(base, derived.effect) : base;
}

/**
 * Build a lookup map from effect id to CollectedEffect.
 * Used to pass into patchCombatSkills for DerivedEffect resolution.
 */
export function buildEffectById(collected: CollectedEffect[]): Map<string, CollectedEffect> {
  const map = new Map<string, CollectedEffect>();
  for (const ce of collected) {
    if (ce.effect.id) map.set(ce.effect.id, ce);
  }
  return map;
}

/**
 * Resolve PatchEffects by merging them into their target effects.
 * Also expands DerivedEffect entries into ResolvedStatusEffects.
 * Patches are provided separately and never present in `collected`.
 */
function resolvePatches(collected: CollectedEffect[], patches: Patch[]): CollectedEffect[] {
  if (patches.length === 0) return collected;

  // Multiple effects may share the same id (intentional — e.g. same effect across two triggers).
  const effectsById = new Map<string, CollectedEffect[]>();
  for (const ce of collected) {
    if (!ce.effect.id) continue;
    const list = effectsById.get(ce.effect.id) ?? [];
    list.push(ce);
    effectsById.set(ce.effect.id, list);
  }

  for (const patch of patches) {
    if (patch.kind !== 'patchEffect') continue;
    const targets = effectsById.get(patch.targetEffect);
    if (!targets) continue;
    for (const targetCe of targets) {
      targetCe.effect = applyEffectPatch(targetCe.effect, patch.effect);
    }
  }

  // Expand DerivedEffects — must run after patchEffect so source values are final.
  // For derived source lookup, the first match with a given id is sufficient.
  const effectById = new Map([...effectsById.entries()].map(([id, list]) => [id, list[0]]));
  const expanded: CollectedEffect[] = [];
  for (const ce of collected) {
    const effectAny = ce.effect as unknown as Effect;
    if (effectAny.kind !== 'derived') {
      expanded.push(ce);
      continue;
    }
    const resolved = resolveDerivedEffect(effectAny as DerivedEffect, effectById);
    if (resolved) expanded.push({ ...ce, effect: resolved });
    // else: source inactive — silently drop
  }

  return expanded;
}

/**
 * Collect all TriggerEffect entries from a team composition.
 * Returns one CollectedTriggerEffect per TriggerEffect across all active talents,
 * potentials, weapon skills, and gear sets.
 */
export function collectTriggerEffects(
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
  weaponInstances: WeaponInstance[],
  gearInstances: GearInstance[],
  effectById?: Map<string, CollectedEffect>,
): CollectedTriggerEffect[] {
  const collected: CollectedTriggerEffect[] = [];
  const collectedPatches: Patch[] = [];

  for (let slotIndex = 0; slotIndex < team.slots.length; slotIndex++) {
    const slot = team.slots[slotIndex];
    if (!slot.operatorId) continue;

    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) continue;

    const operatorSlug = opInst.operatorSlug;
    const op = getOperator(operatorSlug);

    if (op) {
      // Pre-scan: collect AppendEffect patches from active talents + unlocked potentials.
      // Must happen before talent trigger processing so the level idx is available when appending.
      const appendEffectByTarget = new Map<string, Effect[]>();
      for (let groupIdx = 0; groupIdx < op.talents.length; groupIdx++) {
        const state = opInst.talentStates[String(groupIdx)];
        if (!state || state <= 0) continue;
        for (const patch of op.talents[groupIdx].patches ?? []) {
          if (patch.kind === 'appendEffect') {
            const list = appendEffectByTarget.get(patch.targetEffect) ?? [];
            list.push(patch.effect);
            appendEffectByTarget.set(patch.targetEffect, list);
          }
        }
      }
      for (let i = 0; i < op.potentials.length; i++) {
        if (i + 1 > opInst.potential) continue;
        for (const patch of op.potentials[i].patches ?? []) {
          if (patch.kind === 'appendEffect') {
            const list = appendEffectByTarget.get(patch.targetEffect) ?? [];
            list.push(patch.effect);
            appendEffectByTarget.set(patch.targetEffect, list);
          }
        }
      }

      // Talents
      for (let groupIdx = 0; groupIdx < op.talents.length; groupIdx++) {
        const group = op.talents[groupIdx];
        const state = opInst.talentStates[String(groupIdx)];
        if (!state || state <= 0) continue;
        const idx = state - 1;
        for (const patch of group.patches ?? []) collectedPatches.push(patch);
        for (let teIdx = 0; teIdx < (group.triggers?.length ?? 0); teIdx++) {
          const te = group.triggers![teIdx];
          const teLvlIdx = te.skillLevelKey
            ? Math.min((opInst.skillLevels[te.skillLevelKey] ?? 1) - 1, 11)
            : idx;
          const basePath = makeEffectId(operatorSlug, `talent${groupIdx}`, `trigger${teIdx}`);
          const stampedTe = {
            ...te,
            effects: te.effects.map((eff, effIdx) =>
              stampTriggerEffect(hydrateTriggerEffect(eff, 'operator'), basePath, effIdx),
            ),
          };
          const resolved = resolveTriggerEffectLevel(stampedTe, teLvlIdx);
          const resolvedEffects = applyAppendEffects(resolved.effects, appendEffectByTarget, idx);
          collected.push({
            triggerEffect: { ...resolved, effects: resolvedEffects },
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
            sourceSkillType: te.damageEffectSkillType,
          });
        }
      }

      // Potentials
      for (let i = 0; i < op.potentials.length; i++) {
        if (i + 1 > opInst.potential) continue;
        for (const patch of op.potentials[i].patches ?? []) collectedPatches.push(patch);
        for (let teIdx = 0; teIdx < (op.potentials[i].triggers?.length ?? 0); teIdx++) {
          const te = op.potentials[i].triggers![teIdx];
          const basePath = makeEffectId(operatorSlug, `potential${i}`, `trigger${teIdx}`);
          const stampedTe = {
            ...te,
            effects: te.effects.map((eff, effIdx) =>
              stampTriggerEffect(hydrateTriggerEffect(eff, 'operator'), basePath, effIdx),
            ),
          };
          const resolved = resolveTriggerEffectLevel(stampedTe, 0);
          const resolvedEffects = applyAppendEffects(resolved.effects, appendEffectByTarget, 0);
          collected.push({
            triggerEffect: { ...resolved, effects: resolvedEffects },
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
        }
      }

      // Combat skill triggers
      for (const { skillKey, skill, levelKey } of flatSkills(
        op.combatSkills,
        op.finisherElement,
        op.diveElement,
      )) {
        if (!skill.triggers) continue;
        const lvlIdx = Math.min((opInst.skillLevels[levelKey] ?? 1) - 1, 11);
        for (let teIdx = 0; teIdx < skill.triggers.length; teIdx++) {
          const te = applyPatchHitsToTrigger(skill.triggers[teIdx], collectedPatches);
          const teLvlIdx = te.skillLevelKey
            ? Math.min((opInst.skillLevels[te.skillLevelKey] ?? 1) - 1, 11)
            : lvlIdx;
          const basePath = makeEffectId(operatorSlug, skillKey, `trigger${teIdx}`);
          const stampedTe = {
            ...te,
            effects: te.effects.map((eff, effIdx) =>
              stampTriggerEffect(hydrateTriggerEffect(eff, 'operator'), basePath, effIdx),
            ),
          };
          const resolved = resolveTriggerEffectLevel(stampedTe, teLvlIdx);
          const resolvedEffects = applyAppendEffects(
            resolved.effects,
            appendEffectByTarget,
            lvlIdx,
          );
          collected.push({
            triggerEffect: { ...resolved, effects: resolvedEffects },
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
            sourceSkillType: skillKey,
          });
        }
      }
    }

    // Weapon skill triggers
    if (slot.weaponId) {
      const wInst = weaponInstances.find(w => w.id === slot.weaponId);
      if (wInst) {
        const wSheet = getWeapon(wInst.weaponSlug);
        if (wSheet) {
          const skills = [
            { triggers: wSheet.skill1.triggers, level: wInst.skill1Level, skillKey: 'skill1' },
            { triggers: wSheet.skill2.triggers, level: wInst.skill2Level, skillKey: 'skill2' },
            { triggers: wSheet.skill3.triggers, level: wInst.skill3Level, skillKey: 'skill3' },
          ];
          for (const { triggers, level, skillKey } of skills) {
            if (!triggers) continue;
            const lvlIdx = Math.min(level - 1, 11);
            for (let teIdx = 0; teIdx < triggers.length; teIdx++) {
              const te = triggers[teIdx];
              const basePath = makeEffectId(wInst.weaponSlug, skillKey, `trigger${teIdx}`);
              const stampedTe = {
                ...te,
                effects: te.effects.map((eff, effIdx) =>
                  stampTriggerEffect(
                    hydrateTriggerEffect(eff, 'weapon', '', wSheet.icon),
                    basePath,
                    effIdx,
                  ),
                ),
              };
              const resolved = resolveTriggerEffectLevel(stampedTe, lvlIdx);
              collected.push({
                triggerEffect: resolved,
                sourceSlotIndex: slotIndex,
                sourceOperatorSlug: operatorSlug,
              });
            }
          }
        }
      }
    }

    // Gear set triggers
    const setCounts = computeSetCounts(slot, gearInstances);
    for (const [setSlug, count] of setCounts) {
      if (count < 3) continue;
      const gsSheet = getGearSet(setSlug);
      if (gsSheet) {
        for (let teIdx = 0; teIdx < (gsSheet.triggers?.length ?? 0); teIdx++) {
          const te = gsSheet.triggers![teIdx];
          const stampedEffects = te.effects.map((eff, effIdx) =>
            stampTriggerEffect(
              hydrateTriggerEffect(eff, 'gearSet'),
              makeEffectId(setSlug, `trigger${teIdx}`),
              effIdx,
            ),
          );
          collected.push({
            triggerEffect: { ...te, effects: stampedEffects },
            sourceSlotIndex: slotIndex,
            sourceOperatorSlug: operatorSlug,
          });
        }
      }
    }
  }

  applyPatchesToTriggerEffects(collected, collectedPatches);

  // Expand DerivedEffects in trigger effects (e.g. Pogranichnik T2).
  // Build a combined lookup from passive effects, trigger effects, and hit-level
  // effects from combat skills, since derived sources may live in any of these.
  const combinedById = new Map<string, CollectedEffect>(effectById);
  for (const cte of collected) {
    for (const eff of cte.triggerEffect.effects) {
      if (eff.id && (eff as any).kind !== 'derived') {
        combinedById.set(eff.id, {
          effect: eff,
          sourceOperatorSlug: cte.sourceOperatorSlug,
        } as CollectedEffect);
      }
    }
  }
  // Include hit-level effects with IDs from combat skills so derived effects
  // in triggers can reference them (e.g. Antal P5 derives from a battle skill hit effect).
  for (let slotIndex = 0; slotIndex < team.slots.length; slotIndex++) {
    const slot = team.slots[slotIndex];
    if (!slot.operatorId) continue;
    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) continue;
    const op = getOperator(opInst.operatorSlug);
    if (!op?.combatSkills) continue;
    for (const skill of Object.values(op.combatSkills)) {
      for (const seg of skill.segments) {
        for (const group of seg.damageGroups) {
          if (isTickGroup(group)) continue;
          for (const hit of group.hits) {
            if (!hit.effects) continue;
            for (const eff of hit.effects) {
              if (!eff.id) continue;
              const skillKey = Object.entries(op.combatSkills).find(([, v]) => v === skill)?.[0];
              const levelIdx = skillKey ? (opInst.skillLevels?.[skillKey] ?? 1) - 1 : 0;
              combinedById.set(eff.id, {
                effect: resolveEffect(eff, levelIdx),
                sourceOperatorSlug: opInst.operatorSlug,
                sourceSlotIndex: slotIndex,
              } as CollectedEffect);
            }
          }
        }
      }
    }
  }
  if (combinedById.size > 0) {
    for (let ci = 0; ci < collected.length; ci++) {
      const te = collected[ci].triggerEffect;
      let modified = false;
      const expanded = te.effects.flatMap(eff => {
        if ((eff as any).kind !== 'derived') return [eff];
        const resolved = resolveDerivedEffect(eff as any, combinedById);
        modified = true;
        return resolved ? [resolved] : [];
      });
      if (modified) {
        collected[ci] = {
          ...collected[ci],
          triggerEffect: { ...te, effects: expanded },
        };
      }
    }
  }

  return collected;
}

/** Apply patchHit patches targeting DamageHitEffect.hit.id to a raw TriggerEffect before resolution. */
function applyPatchHitsToTrigger(te: TriggerEffect, patches: Patch[]): TriggerEffect {
  let modified = false;
  const effects = te.effects.map(eff => {
    if (eff.kind !== 'damageHit' || !eff.hit?.id) return eff;
    const applicable = patches.filter(
      (p): p is PatchHit => p.kind === 'patchHit' && p.targetHit === eff.hit!.id,
    );
    if (!applicable.length) return eff;
    modified = true;
    let hit = eff.hit;
    for (const p of applicable) {
      const { effects: injected, ...fields } = p.hit;
      hit = { ...hit, ...fields };
      if (injected?.length) hit = { ...hit, effects: [...(hit.effects ?? []), ...injected] };
    }
    return { ...eff, hit };
  });
  return modified ? { ...te, effects } : te;
}

/** Apply patchEffect patches to effects nested inside collected TriggerEffects. */
function applyPatchesToTriggerEffects(collected: CollectedTriggerEffect[], patches: Patch[]): void {
  const patchEffects = patches.filter((p): p is PatchEffect => p.kind === 'patchEffect');
  if (patchEffects.length === 0) return;

  const byId = new Map<string, { cteIdx: number; effIdx: number }[]>();
  for (let ci = 0; ci < collected.length; ci++) {
    const effects = collected[ci].triggerEffect.effects;
    for (let ei = 0; ei < effects.length; ei++) {
      const id = effects[ei].id;
      if (!id) continue;
      const list = byId.get(id) ?? [];
      list.push({ cteIdx: ci, effIdx: ei });
      byId.set(id, list);
    }
  }

  for (const patch of patchEffects) {
    const locs = byId.get(patch.targetEffect);
    if (!locs) continue;
    for (const loc of locs) {
      const te = collected[loc.cteIdx].triggerEffect;
      const patched = applyEffectPatch(te.effects[loc.effIdx], patch.effect);
      collected[loc.cteIdx] = {
        ...collected[loc.cteIdx],
        triggerEffect: {
          ...te,
          effects: te.effects.map((e, i) => (i === loc.effIdx ? patched : e)),
        },
      };
    }
  }
}

// ─── Effect id helpers ──────────────────────────────────────────────────────

/** Build a source-path id from ordered segments: e.g. makeEffectId('fluorite', 'talent3', 'trigger0', 'effect0'). */
function makeEffectId(...parts: (string | number)[]): string {
  return parts.join('-');
}

/** Ensure the effect has an id. Returns a new object if an id was added, same object if already present. */
function ensureEffectId<T extends { id?: string }>(effect: T, fallback: string): T {
  if (!effect.id) return { ...effect, id: fallback };
  return effect;
}

/** Stamp IDs on a trigger effect and any inner damageHit.hit.effects. */
function stampTriggerEffect<
  T extends { id?: string; kind?: string; hit?: { effects?: { id?: string }[] } },
>(eff: T, basePath: string, effIdx: number): T {
  const stamped = ensureEffectId(eff, makeEffectId(basePath, `effect${effIdx}`));
  if (stamped.kind === 'damageHit' && stamped.hit?.effects) {
    return {
      ...stamped,
      hit: {
        ...stamped.hit,
        effects: stamped.hit.effects.map((inner, innerIdx) =>
          ensureEffectId(inner, makeEffectId(basePath, `effect${effIdx}`, `hit${innerIdx}`)),
        ),
      },
    } as T;
  }
  return stamped;
}

function hydrateTriggerEffect<T extends Effect>(
  effect: T,
  sourceGroup: 'operator' | 'weapon' | 'gearSet',
  defaultName = '',
  iconOverride?: string,
): T {
  const hydrated = {
    ...effect,
    sourceGroup,
    name: effect.name ?? defaultName,
    ...(iconOverride && !effect.icon ? { icon: iconOverride } : {}),
  } as T;

  if (hydrated.kind === 'damageHit' && hydrated.hit?.effects) {
    return {
      ...hydrated,
      hit: {
        ...hydrated.hit,
        effects: hydrated.hit.effects.map(inner =>
          hydrateEffect(
            iconOverride && !inner.icon ? { ...inner, icon: iconOverride } : inner,
            sourceGroup,
            defaultName,
          ),
        ),
      },
    } as T;
  }

  return hydrated;
}

/**
 * Resolve array values in TriggerEffect.effects at the given level index.
 * Returns a new ResolvedTriggerEffect with all effects resolved to scalar values.
 */
export function resolveTriggerEffectLevel(te: TriggerEffect, idx: number): ResolvedTriggerEffect {
  return {
    ...te,
    effects: te.effects.map(effect => resolveEffect(effect, idx)),
  };
}

/**
 * Append effects from AppendEffect patches to a resolved effects array.
 * Appended effects are resolved at the same level index as the trigger.
 */
function applyAppendEffects(
  effects: ResolvedEffect[],
  appendByTarget: Map<string, Effect[]>,
  idx: number,
): ResolvedEffect[] {
  if (appendByTarget.size === 0) return effects;
  const toAppend: ResolvedEffect[] = [];
  for (const eff of effects) {
    if (!eff.id) continue;
    const list = appendByTarget.get(eff.id);
    if (list) for (const e of list) toAppend.push(resolveEffect(e, idx));
  }
  return toAppend.length > 0 ? [...effects, ...toAppend] : effects;
}

/** Expand a TickGroup into a HitGroup by generating evenly-spaced hits from the Tick definition. */
function expandTickGroup(group: TickGroup): HitGroup {
  const { tick } = group;
  const interval =
    tick.hitCount > 1 ? Math.round((tick.duration / (tick.hitCount - 1)) * 60) / 60 : 0;
  const hits: Hit[] = Array.from({ length: tick.hitCount }, (_, i) => ({
    ...(tick.id ? { id: tick.id(i) } : {}),
    offset: tick.offset + i * interval,
    ...(tick.stagger ? { stagger: tick.stagger(i) } : {}),
    ...(tick.spRecovery ? { spRecovery: tick.spRecovery(i) } : {}),
    ...(tick.spReturn ? { spReturn: tick.spReturn(i) } : {}),
    ...(tick.durationExtension ? { durationExtension: tick.durationExtension(i) } : {}),
    ...(tick.effects ? { effects: tick.effects(i) } : {}),
  }));
  return {
    ...(group.id ? { id: group.id } : {}),
    element: group.element,
    multiplier: group.multiplier,
    multiplierMode: group.multiplierMode,
    multiplierScaling: group.multiplierScaling,
    condition: group.condition,
    hits,
  };
}

/** Expand all TickGroups in a segments array, applying PatchTick overrides first. */
export function expandSegments(
  segments: Segment[],
  patchTicksByTarget?: Map<string, PatchTick[]>,
): Segment[] {
  return segments.map(seg => ({
    ...seg,
    damageGroups: seg.damageGroups.map(group => {
      if (!isTickGroup(group)) return group;
      if (patchTicksByTarget && group.id && patchTicksByTarget.has(group.id)) {
        const tickPatches = patchTicksByTarget.get(group.id)!;
        let tick = group.tick;
        for (const p of tickPatches) {
          tick = { ...tick, ...p.tick };
        }
        return expandTickGroup({ ...group, tick });
      }
      return expandTickGroup(group);
    }),
  }));
}

/**
 * Expand TickGroups across every skill — and hoist subSkills to top-level entries.
 *
 * Output is a flat dict where each entry carries its own `skillKey`, `levelKey`,
 * and `type`. SubSkills adopt their parent's `type` (e.g. `'comboSkill'`) and
 * `levelKey` so every skill is iterable uniformly without nested traversal —
 * generic trigger filters like `skillTypes: ['comboSkill']` match them directly.
 */
function expandCombatSkills(
  combatSkills: Record<string, CombatSkillEntry>,
  patchTicksByTarget?: Map<string, PatchTick[]>,
  finisherElement?: DamageElement,
  diveElement?: DamageElement,
): Record<string, FlatSkillEntry> {
  const result: Record<string, FlatSkillEntry> = {};
  for (const [key, skill] of Object.entries(combatSkills)) {
    const { subSkills, ...rest } = skill;
    result[key] = {
      ...rest,
      segments: expandSegments(skill.segments, patchTicksByTarget),
      skillKey: key,
      levelKey: key,
      type: key,
    };
    for (const sub of subSkills ?? []) {
      const subKey = sub.id ?? sub.name;
      if (result[subKey]) {
        console.warn(
          `[expandCombatSkills] duplicate skillKey '${subKey}' — subSkills need unique id/name per operator`,
        );
      }
      result[subKey] = {
        ...sub,
        segments: sub.segments ? expandSegments(sub.segments, patchTicksByTarget) : sub.segments,
        skillKey: subKey,
        levelKey: key,
        type: sub.group,
      };
    }
  }
  // Inject synthetic finisher/dive entries — share basicAttack's level.
  result.finisher = {
    ...createFinisherEntry(finisherElement),
    skillKey: 'finisher',
    levelKey: 'basicAttack',
    type: 'finisher',
  };
  result.dive = {
    ...createDiveEntry(diveElement),
    skillKey: 'dive',
    levelKey: 'basicAttack',
    type: 'dive',
  };
  return result;
}

/**
 * Return a (possibly patched) copy of the operator's combatSkills.
 * Patches from active talents and unlocked potentials are merged into
 * any Hit effect whose `id` matches the patch's `targetEffect`.
 * Returns the original object unchanged if no patches are applicable.
 */
export function patchCombatSkills(
  op: {
    talents: OperatorSheet['talents'];
    potentials: OperatorSheet['potentials'];
    combatSkills: Record<string, CombatSkillEntry>;
    finisherElement?: DamageElement;
    diveElement?: DamageElement;
  },
  opInst: Pick<OperatorInstance, 'talentStates' | 'potential'>,
  collectedById?: Map<string, CollectedEffect>,
): Record<string, FlatSkillEntry> {
  const patches: { patch: Patch; idx: number }[] = [];
  for (let groupIdx = 0; groupIdx < op.talents.length; groupIdx++) {
    const state = opInst.talentStates[String(groupIdx)];
    if (!state || state <= 0) continue;
    const idx = state - 1;
    for (const patch of op.talents[groupIdx].patches ?? []) patches.push({ patch, idx });
  }
  for (let i = 0; i < op.potentials.length; i++) {
    if (i + 1 > opInst.potential) continue;
    for (const patch of op.potentials[i].patches ?? []) patches.push({ patch, idx: 0 });
  }

  if (patches.length === 0)
    return expandCombatSkills(op.combatSkills, undefined, op.finisherElement, op.diveElement);

  const patchEffectsByTarget = new Map<string, PatchEffect[]>();
  const patchHitsByTarget = new Map<string, { patch: PatchHit; idx: number }[]>();
  const patchTicksByTarget = new Map<string, PatchTick[]>();
  const appendEffectsByTarget = new Map<string, Effect[]>();
  for (const { patch: p, idx } of patches) {
    if (p.kind === 'patchEffect') {
      const list = patchEffectsByTarget.get(p.targetEffect) ?? [];
      list.push(p);
      patchEffectsByTarget.set(p.targetEffect, list);
    } else if (p.kind === 'patchHit') {
      const list = patchHitsByTarget.get(p.targetHit) ?? [];
      list.push({ patch: p, idx });
      patchHitsByTarget.set(p.targetHit, list);
    } else if (p.kind === 'patchTick') {
      const list = patchTicksByTarget.get(p.targetTick) ?? [];
      list.push(p);
      patchTicksByTarget.set(p.targetTick, list);
    } else if (p.kind === 'appendEffect') {
      const list = appendEffectsByTarget.get(p.targetEffect) ?? [];
      list.push(p.effect);
      appendEffectsByTarget.set(p.targetEffect, list);
    }
  }

  // Pre-pass: apply PatchTick overrides then expand TickGroups → HitGroups.
  // Done before JSON clone since Tick lambdas are not serializable.
  const preExpanded = expandCombatSkills(
    op.combatSkills,
    patchTicksByTarget,
    op.finisherElement,
    op.diveElement,
  );
  const cloned: Record<string, FlatSkillEntry> = JSON.parse(JSON.stringify(preExpanded));

  // All skills (including hoisted subSkills) are top-level entries — one iteration covers them.
  const allSegmentHolders = function* (): Generator<{
    segments: Segment[];
    triggers?: FlatSkillEntry['triggers'];
  }> {
    for (const skill of Object.values(cloned)) {
      if (skill.segments) yield { segments: skill.segments, triggers: skill.triggers };
    }
  };

  // Pass 1: apply patchHits — may inject effects into hits; multiple patches per hit are applied in order
  for (const { segments } of allSegmentHolders()) {
    for (const segment of segments) {
      for (const group of segment.damageGroups as HitGroup[]) {
        for (let i = 0; i < group.hits.length; i++) {
          let hit = group.hits[i];
          if (hit.id) {
            const hitPatches = patchHitsByTarget.get(hit.id);
            if (hitPatches) {
              for (const { patch: hitPatch, idx } of hitPatches) {
                const { effects: injectedEffects, ...otherHitFields } = hitPatch.hit;
                hit = { ...hit, ...otherHitFields };
                if (injectedEffects?.length) {
                  const resolved = injectedEffects.map(e =>
                    resolveEffect(e, idx),
                  ) as unknown as Effect[];
                  hit = { ...hit, effects: [...(hit.effects ?? []), ...resolved] };
                }
              }
            }
          }
          group.hits[i] = hit;
        }
      }
    }
  }

  // Pass 1b: apply patchHits to damageHit.hit inside trigger effects
  if (patchHitsByTarget.size > 0) {
    for (const { triggers } of allSegmentHolders()) {
      for (const trigger of triggers ?? []) {
        for (let i = 0; i < trigger.effects.length; i++) {
          const effect = trigger.effects[i];
          if (effect.kind !== 'damageHit' || !effect.hit?.id) continue;
          const hitPatches = patchHitsByTarget.get(effect.hit.id);
          if (!hitPatches) continue;
          let hit = effect.hit;
          for (const { patch: hitPatch, idx } of hitPatches) {
            const { effects: injectedEffects, ...otherHitFields } = hitPatch.hit;
            hit = { ...hit, ...otherHitFields };
            if (injectedEffects?.length) {
              const resolved = injectedEffects.map(e =>
                resolveEffect(e, idx),
              ) as unknown as Effect[];
              hit = { ...hit, effects: [...(hit.effects ?? []), ...resolved] };
            }
          }
          trigger.effects[i] = { ...effect, hit };
        }
      }
    }
  }

  // Pass 2: appendEffect into hit.effects[] and trigger hit effects
  if (appendEffectsByTarget.size > 0) {
    for (const { segments, triggers } of allSegmentHolders()) {
      for (const segment of segments) {
        for (const group of segment.damageGroups as HitGroup[]) {
          for (const hit of group.hits) {
            if (!hit.effects) continue;
            const toAppend: Effect[] = [];
            for (const eff of hit.effects) {
              if (!eff.id) continue;
              const list = appendEffectsByTarget.get(eff.id);
              if (list) toAppend.push(...list);
            }
            if (toAppend.length > 0) hit.effects = [...hit.effects, ...toAppend];
          }
        }
      }
      for (const trigger of triggers ?? []) {
        for (let i = 0; i < trigger.effects.length; i++) {
          const eff = trigger.effects[i];
          if (eff.kind !== 'damageHit' || !eff.hit?.effects) continue;
          const toAppend: Effect[] = [];
          for (const hitEff of eff.hit.effects) {
            if (!hitEff.id) continue;
            const list = appendEffectsByTarget.get(hitEff.id);
            if (list) toAppend.push(...list);
          }
          if (toAppend.length > 0)
            trigger.effects[i] = {
              ...eff,
              hit: { ...eff.hit, effects: [...eff.hit.effects, ...toAppend] },
            };
        }
      }
    }
  }

  // Pass 3: apply patchEffects to effects inside hits (including those injected in passes 1/2)
  if (patchEffectsByTarget.size > 0) {
    for (const { segments } of allSegmentHolders()) {
      for (const segment of segments) {
        for (const group of segment.damageGroups as HitGroup[]) {
          for (const hit of group.hits) {
            if (hit.effects) {
              hit.effects = hit.effects.map(eff => {
                if (!eff.id) return eff;
                const effectPatches = patchEffectsByTarget.get(eff.id);
                if (!effectPatches) return eff;
                return effectPatches.reduce((acc, p) => applyEffectPatch(acc, p.effect), eff);
              });
            }
          }
        }
      }
    }
  }

  // Pass 4: expand DerivedEffects inside hit effects using the collected effect lookup.
  // Produces an inline StatusEffect with the source's resolved (scalar) value.
  if (collectedById && collectedById.size > 0) {
    const expandHitEffects = (effects: Effect[] | undefined): Effect[] | undefined => {
      if (!effects) return undefined;
      const result: Effect[] = [];
      for (const eff of effects) {
        if ((eff as unknown as { kind: string }).kind !== 'derived') {
          result.push(eff);
          continue;
        }
        const derived = eff as unknown as DerivedEffect;
        const resolved = resolveDerivedEffect(derived, collectedById);
        if (resolved) result.push(resolved as unknown as Effect);
        // else: source inactive — drop silently
      }
      return result.length > 0 ? result : undefined;
    };

    for (const { segments } of allSegmentHolders()) {
      for (const segment of segments) {
        for (const group of segment.damageGroups as HitGroup[]) {
          for (const hit of group.hits) {
            const expanded = expandHitEffects(hit.effects);
            if (expanded !== undefined) hit.effects = expanded;
          }
        }
      }
    }
  }

  // Extend segment duration for unconditional hits with durationExtension.
  // Conditional hits are handled at simulation runtime in HitHandler.
  for (const { segments } of allSegmentHolders()) {
    for (const segment of segments) {
      for (const group of segment.damageGroups as HitGroup[]) {
        if (group.condition) continue;
        for (const hit of group.hits) {
          segment.duration += hit.durationExtension ?? 0;
          delete hit.durationExtension;
        }
      }
    }
  }

  return cloned;
}
