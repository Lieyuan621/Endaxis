import { resolveLeveledValue } from '@/data/timeline';
import { resolveScalingDef } from '@/data/collect';
import { snapTimeToFrame } from '@/utils/time';
import { resolveEffectDisplayKey } from '@/utils/effectDisplay';
import type { Hit as SheetHit, HitGroup, Segment } from '@/data/types';
import type { Hit as ResolvedHit } from '@/simulation/compiler/types';

const uid = () => Math.random().toString(36).substring(2, 9);

// The resolver reads/writes many transient fields on hit/effect objects that are
// not part of the strict domain interfaces. It works internally on this loose
// dictionary shape, but exposes the domain types at its public boundary: raw
// sheet types (SheetHit / Segment / HitGroup) as input, resolved compiler Hits
// (leveled values collapsed to numbers) as output.
type Dict = Record<string, unknown>;

interface RawEntry {
  hit?: SheetHit;
  element?: HitGroup['element'];
  condition?: HitGroup['condition'];
  multiplier?: HitGroup['multiplier'];
  multiplierMode?: HitGroup['multiplierMode'];
  multiplierScaling?: HitGroup['multiplierScaling'];
  treatAsSkillType?: HitGroup['treatAsSkillType'];
  hitFraction?: number;
}

/**
 * Anything with a `segments` array — a CombatSkillEntry, FlatSkillEntry, or an
 * ad-hoc `{ segments }`. Segments may be sparse; every access below is guarded.
 */
interface SkillInput {
  segments?: (Segment | undefined)[];
  element?: string;
}

// resolveLeveledValue / resolveScalingDef expect concrete argument types; these
// wrappers cast at the dynamic-data boundary once instead of at every call.
const rlv = (value: unknown, level: number): number =>
  resolveLeveledValue(value as number | number[] | undefined, level);
const rsd = (scaling: unknown, level: number) =>
  resolveScalingDef(scaling as Parameters<typeof resolveScalingDef>[0], level);

function resolveEffectAtLevel(
  rawEffect: Dict | null | undefined,
  existingEffect: Dict | undefined,
  level: number,
): Dict | null {
  if (!rawEffect || typeof rawEffect !== 'object') return null;

  const resolved: Dict = {
    ...rawEffect,
  };

  const leveledValueKeys = [
    'duration',
    'value',
    'multiplier',
    'stacks',
    'maxStacks',
    'effectiveness',
    'offset',
    'interval',
    'consumeStacks',
    'icd',
  ];

  leveledValueKeys.forEach(key => {
    if (resolved[key] === undefined || resolved[key] === 'fromConsume') return;
    resolved[key] = rlv(resolved[key], level);
  });

  if (rawEffect.scaling) {
    resolved.scaling = rsd(rawEffect.scaling, level);
  }
  if (rawEffect.multiplierScaling) {
    resolved.multiplierScaling = rsd(rawEffect.multiplierScaling, level);
  }
  if (rawEffect.staggerScaling) {
    resolved.staggerScaling = rsd(rawEffect.staggerScaling, level);
  }

  if (resolved.hit && typeof resolved.hit === 'object') {
    const hit = resolved.hit as Dict;
    resolved.hit = {
      ...hit,
      spRecovery: Number(rlv(hit.spRecovery, level)) || 0,
      spReturn: Number(rlv(hit.spReturn, level)) || 0,
      stagger: Number(rlv(hit.stagger, level)) || 0,
      durationExtension: Number(rlv(hit.durationExtension, level)) || 0,
    };
  }

  if (Array.isArray(resolved.consumedStatEffects)) {
    resolved.consumedStatEffects = resolved.consumedStatEffects.map((item: Dict) => ({
      ...item,
      value: Number(rlv(item?.value, level)) || 0,
    }));
  }

  // Drop id-as-displayType stamps, then derive the locale display key (name beats
  // mechanical stat keys for branded statuses such as Antal focus).
  if (resolved.displayType && resolved.displayType === resolved.id) {
    delete resolved.displayType;
  }
  resolved.displayType = resolveEffectDisplayKey(
    resolved as unknown as Parameters<typeof resolveEffectDisplayKey>[0],
  );
  resolved.displayDuration = Math.max(0, Number(resolved.duration) || 0);
  resolved.displayStacks =
    resolved.stacks === 'fromConsume' ? 1 : Math.max(1, Number(resolved.stacks) || 1);
  resolved._id = existingEffect?._id || resolved._id || uid();
  return resolved;
}

interface ResolvedMultiplier {
  multiplier: number;
  _noDamage?: boolean;
  _multiplierScaling?: unknown;
}

function resolveMultiplierFromEntry(
  entry: RawEntry | null | undefined,
  level: number,
): ResolvedMultiplier {
  if (!entry || entry.multiplier == null) return { multiplier: 0, _noDamage: true };

  const baseMultiplier = rlv(entry.multiplier, level);
  const hitMultiplier =
    entry.multiplierMode === 'split' ? baseMultiplier * (entry.hitFraction ?? 1) : baseMultiplier;

  const resolved: ResolvedMultiplier = {
    multiplier: Number(hitMultiplier) || 0,
  };

  if (entry.multiplierScaling) {
    resolved._multiplierScaling = rsd(entry.multiplierScaling, level);
  }

  if (!(resolved.multiplier > 0)) {
    resolved._noDamage = true;
  }

  return resolved;
}

interface ResolveHitsOptions {
  preserveCondition?: boolean;
  preserveDurationExtension?: boolean;
}

export function resolveHitsFromSheet(
  storedHits: ResolvedHit[] = [],
  rawEntries: RawEntry[] = [],
  level = 0,
  opts: ResolveHitsOptions = {},
): ResolvedHit[] {
  const preserveCondition = opts.preserveCondition !== false;
  const preserveDurationExtension = opts.preserveDurationExtension === true;
  const resolved: Dict[] = [];
  const overlapCount = Math.min(storedHits.length, rawEntries.length);

  for (let index = 0; index < overlapCount; index++) {
    const stored = (storedHits[index] || {}) as Dict;
    const rawEntry = rawEntries[index];
    const rawHit = rawEntry?.hit as Dict | undefined;
    if (!rawHit) {
      resolved.push(stored);
      continue;
    }

    const nextHit: Dict = {
      ...stored,
      id: rawHit.id ?? stored.id,
      offset: Number(rawHit.offset) || 0,
      spRecovery: Number(rlv(rawHit.spRecovery, level)) || 0,
      spReturn: Number(rlv(rawHit.spReturn, level)) || 0,
      stagger: Number(rlv(rawHit.stagger, level)) || 0,
      element: rawHit.element ?? rawEntry?.element ?? stored.element,
      ...resolveMultiplierFromEntry(rawEntry, level),
    };

    if (preserveDurationExtension) {
      if (rawHit.durationExtension != null) {
        nextHit.durationExtension = Number(rlv(rawHit.durationExtension, level)) || 0;
      }
    } else {
      nextHit.durationExtension =
        rawHit.durationExtension != null
          ? Number(rlv(rawHit.durationExtension, level)) || 0
          : undefined;
    }

    if (preserveCondition && rawEntry?.condition !== undefined) {
      nextHit._condition = rawEntry.condition;
    } else if (!preserveCondition) {
      delete nextHit._condition;
    }

    if (rawHit.treatAsReaction) {
      nextHit.treatAsReaction = rawHit.treatAsReaction;
    } else {
      delete nextHit.treatAsReaction;
    }

    if (rawEntry?.treatAsSkillType) {
      nextHit.treatAsSkillType = rawEntry.treatAsSkillType;
    } else {
      delete nextHit.treatAsSkillType;
    }

    if (nextHit._noDamage) {
      delete nextHit.multiplier;
      delete nextHit._multiplierScaling;
    } else {
      delete nextHit._noDamage;
    }

    if (!Array.isArray(rawHit.effects) || rawHit.effects.length === 0) {
      nextHit.effects = undefined;
    } else {
      const existingEffects: Dict[] = Array.isArray(stored.effects) ? stored.effects : [];
      nextHit.effects = rawHit.effects
        .map((rawEffect: Dict, effectIndex: number) =>
          resolveEffectAtLevel(rawEffect, existingEffects[effectIndex], level),
        )
        .filter(Boolean);
    }

    resolved.push(nextHit);
  }

  for (let index = storedHits.length; index < rawEntries.length; index++) {
    const rawEntry = rawEntries[index];
    const rawHit = rawEntry?.hit as Dict | undefined;
    if (!rawHit) continue;

    const nextHit: Dict = {
      ...(rawHit.id ? { id: rawHit.id } : {}),
      offset: Number(rawHit.offset) || 0,
      spRecovery: Number(rlv(rawHit.spRecovery, level)) || 0,
      spReturn: Number(rlv(rawHit.spReturn, level)) || 0,
      stagger: Number(rlv(rawHit.stagger, level)) || 0,
      element: rawHit.element ?? rawEntry?.element,
      ...resolveMultiplierFromEntry(rawEntry, level),
    };

    if (rawHit.durationExtension != null) {
      nextHit.durationExtension = Number(rlv(rawHit.durationExtension, level)) || 0;
    }

    if (preserveCondition && rawEntry?.condition !== undefined) {
      nextHit._condition = rawEntry.condition;
    }

    if (rawHit.treatAsReaction) {
      nextHit.treatAsReaction = rawHit.treatAsReaction;
    }

    if (rawEntry?.treatAsSkillType) {
      nextHit.treatAsSkillType = rawEntry.treatAsSkillType;
    }

    if (Array.isArray(rawHit.effects) && rawHit.effects.length > 0) {
      nextHit.effects = rawHit.effects
        .map((rawEffect: Dict) => resolveEffectAtLevel(rawEffect, undefined, level))
        .filter(Boolean);
    }

    if (nextHit._noDamage) {
      delete nextHit.multiplier;
      delete nextHit._multiplierScaling;
    }

    resolved.push(nextHit);
  }

  // Resolved hits carry transient display/runtime fields on top of the Hit shape.
  return resolved as unknown as ResolvedHit[];
}

export function extractRawEntries(
  skill: SkillInput | null | undefined,
  segmentIndex = 0,
): RawEntry[] {
  const segment = skill?.segments?.[segmentIndex];
  if (!segment) return [];

  return (segment.damageGroups || []).flatMap(group => {
    const hits = 'hits' in group && Array.isArray(group.hits) ? group.hits : [];
    const totalWeight = hits.reduce((sum, hit) => sum + (Number(hit?.weight) || 1), 0) || 1;

    return hits.map(hit => ({
      hit,
      element: group.element,
      condition: group.condition,
      multiplier: group.multiplier,
      multiplierMode: group.multiplierMode,
      multiplierScaling: group.multiplierScaling,
      treatAsSkillType: 'treatAsSkillType' in group ? group.treatAsSkillType : undefined,
      hitFraction: (Number(hit?.weight) || 1) / totalWeight,
    }));
  });
}

export function extractAggregateRawEntries(skill: SkillInput | null | undefined): RawEntry[] {
  const rawSegments = Array.isArray(skill?.segments) ? skill.segments : [];
  const entries: RawEntry[] = [];
  let cursor = 0;

  rawSegments.forEach((segment, segmentIndex) => {
    const segmentEntries = extractRawEntries(skill, segmentIndex).map(entry => ({
      ...entry,
      hit: {
        ...entry.hit,
        offset: (Number(entry?.hit?.offset) || 0) + cursor,
      },
    }));

    entries.push(...segmentEntries);
    cursor += Number(segment?.duration) || 0;

    if (segmentIndex < rawSegments.length - 1) {
      cursor += snapTimeToFrame(Math.max(0, Number(segment?.gap) || 0));
    }
  });

  return entries;
}

export function buildResolvedSegmentPayload(
  skillIdBase: string,
  skill: SkillInput | null | undefined,
  levelIndex = 0,
) {
  const rawSegments = Array.isArray(skill?.segments) ? skill.segments : [];
  let cursor = 0;
  let aggregateElement: string | null = null;
  const aggregateHits: Dict[] = [];
  const segmentPayloads: Dict[] = [];

  rawSegments.forEach((segment, index) => {
    const rawEntries = extractRawEntries(skill, index);
    const hits = resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true });
    const segmentSkillId = segment?.skillId;
    const followupDelay =
      index < rawSegments.length - 1 ? snapTimeToFrame(Math.max(0, Number(segment?.gap) || 0)) : 0;
    const segmentElement =
      segment?.damageGroups?.find(group => group?.element)?.element || aggregateElement;

    if (!aggregateElement && segmentElement) aggregateElement = segmentElement;
    aggregateHits.push(
      ...hits.map(hit => ({
        ...hit,
        ...(segmentSkillId ? { skillId: segmentSkillId } : {}),
        offset: (Number(hit.offset) || 0) + cursor,
      })),
    );

    segmentPayloads.push({
      id: `${skillIdBase}_seg${index + 1}`,
      duration: Number(segment?.duration) || 0,
      followupDelay,
      ...(segmentSkillId ? { skillId: segmentSkillId } : {}),
      ...(segment?.spCost != null ? { spCost: Number(segment.spCost) || 0 } : {}),
      payload: {
        hits: segmentSkillId ? hits.map(hit => ({ ...hit, skillId: segmentSkillId })) : hits,
      },
      element: segmentElement || aggregateElement || skill?.element || 'physical',
    });

    cursor += (Number(segment?.duration) || 0) + followupDelay;
  });

  return {
    totalDuration: cursor,
    element: aggregateElement || skill?.element || 'physical',
    aggregatePayload: {
      hits: aggregateHits,
    },
    segmentPayloads,
  };
}
