import { resolveLeveledValue } from '@/data/timeline'
import { resolveScalingDef } from '@/data/collect'
import { snapTimeToFrame } from '@/utils/time'
import { resolveEffectDisplayKey } from '@/utils/effectDisplay.js'

const uid = () => Math.random().toString(36).substring(2, 9)

function resolveEffectAtLevel(rawEffect, existingEffect, level) {
  if (!rawEffect || typeof rawEffect !== 'object') return null

  const resolved = {
    ...rawEffect,
  }

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
  ]

  leveledValueKeys.forEach((key) => {
    if (resolved[key] === undefined || resolved[key] === 'fromConsume') return
    resolved[key] = resolveLeveledValue(resolved[key], level)
  })

  if (rawEffect.scaling) {
    resolved.scaling = resolveScalingDef(rawEffect.scaling, level)
  }
  if (rawEffect.multiplierScaling) {
    resolved.multiplierScaling = resolveScalingDef(rawEffect.multiplierScaling, level)
  }
  if (rawEffect.staggerScaling) {
    resolved.staggerScaling = resolveScalingDef(rawEffect.staggerScaling, level)
  }

  if (resolved.hit && typeof resolved.hit === 'object') {
    resolved.hit = {
      ...resolved.hit,
      spRecovery: Number(resolveLeveledValue(resolved.hit.spRecovery, level)) || 0,
      spReturn: Number(resolveLeveledValue(resolved.hit.spReturn, level)) || 0,
      stagger: Number(resolveLeveledValue(resolved.hit.stagger, level)) || 0,
      durationExtension: Number(resolveLeveledValue(resolved.hit.durationExtension, level)) || 0,
    }
  }

  if (Array.isArray(resolved.consumedStatEffects)) {
    resolved.consumedStatEffects = resolved.consumedStatEffects.map((item) => ({
      ...item,
      value: Number(resolveLeveledValue(item?.value, level)) || 0,
    }))
  }

  resolved.displayType = resolved.displayType || resolveEffectDisplayKey(rawEffect)
  resolved.displayDuration = Math.max(0, Number(resolved.duration) || 0)
  resolved.displayStacks = resolved.stacks === 'fromConsume'
    ? 1
    : Math.max(1, Number(resolved.stacks) || 1)
  resolved._id = existingEffect?._id || resolved._id || uid()
  return resolved
}

function resolveMultiplierFromEntry(entry, level) {
  if (!entry || entry.multiplier == null) return { multiplier: 0, _noDamage: true }

  const baseMultiplier = resolveLeveledValue(entry.multiplier, level)
  const hitMultiplier = entry.multiplierMode === 'split'
    ? baseMultiplier * (entry.hitFraction ?? 1)
    : baseMultiplier

  const resolved = {
    multiplier: Number(hitMultiplier) || 0,
  }

  if (entry.multiplierScaling) {
    resolved._multiplierScaling = resolveScalingDef(entry.multiplierScaling, level)
  }

  if (!(resolved.multiplier > 0)) {
    resolved._noDamage = true
  }

  return resolved
}

export function resolveHitsFromSheet(storedHits = [], rawEntries = [], level = 0, opts = {}) {
  const preserveCondition = opts.preserveCondition !== false
  const preserveDurationExtension = opts.preserveDurationExtension === true
  const resolved = []
  const overlapCount = Math.min(storedHits.length, rawEntries.length)

  for (let index = 0; index < overlapCount; index++) {
    const stored = storedHits[index] || {}
    const rawEntry = rawEntries[index]
    const rawHit = rawEntry?.hit
    if (!rawHit) {
      resolved.push(stored)
      continue
    }

    const nextHit = {
      ...stored,
      id: rawHit.id ?? stored.id,
      offset: Number(rawHit.offset) || 0,
      spRecovery: Number(resolveLeveledValue(rawHit.spRecovery, level)) || 0,
      spReturn: Number(resolveLeveledValue(rawHit.spReturn, level)) || 0,
      stagger: Number(resolveLeveledValue(rawHit.stagger, level)) || 0,
      element: rawHit.element ?? rawEntry.element ?? stored.element,
      ...(rawHit.hideInEditor ? { hideInEditor: true } : {}),
      ...(rawHit.hiddenInEditor ? { hiddenInEditor: true } : {}),
      ...resolveMultiplierFromEntry(rawEntry, level),
    }

    if (preserveDurationExtension) {
      if (rawHit.durationExtension != null) {
        nextHit.durationExtension = Number(resolveLeveledValue(rawHit.durationExtension, level)) || 0
      }
    } else {
      nextHit.durationExtension = rawHit.durationExtension != null
        ? Number(resolveLeveledValue(rawHit.durationExtension, level)) || 0
        : undefined
    }

    if (preserveCondition && rawEntry?.condition !== undefined) {
      nextHit._condition = rawEntry.condition
    } else if (!preserveCondition) {
      delete nextHit._condition
    }

    if (rawHit.treatAsReaction) {
      nextHit.treatAsReaction = rawHit.treatAsReaction
    } else {
      delete nextHit.treatAsReaction
    }

    if (rawEntry.treatAsSkillType) {
      nextHit.treatAsSkillType = rawEntry.treatAsSkillType
    } else {
      delete nextHit.treatAsSkillType
    }

    if (nextHit._noDamage) {
      delete nextHit.multiplier
      delete nextHit._multiplierScaling
    } else {
      delete nextHit._noDamage
    }

    if (!Array.isArray(rawHit.effects) || rawHit.effects.length === 0) {
      nextHit.effects = undefined
    } else {
      const existingEffects = Array.isArray(stored.effects) ? stored.effects : []
      nextHit.effects = rawHit.effects
        .map((rawEffect, effectIndex) => resolveEffectAtLevel(rawEffect, existingEffects[effectIndex], level))
        .filter(Boolean)
    }

    resolved.push(nextHit)
  }

  for (let index = storedHits.length; index < rawEntries.length; index++) {
    const rawEntry = rawEntries[index]
    const rawHit = rawEntry?.hit
    if (!rawHit) continue

    const nextHit = {
      ...(rawHit.id ? { id: rawHit.id } : {}),
      offset: Number(rawHit.offset) || 0,
      spRecovery: Number(resolveLeveledValue(rawHit.spRecovery, level)) || 0,
      spReturn: Number(resolveLeveledValue(rawHit.spReturn, level)) || 0,
      stagger: Number(resolveLeveledValue(rawHit.stagger, level)) || 0,
      element: rawHit.element ?? rawEntry.element,
      ...(rawHit.hideInEditor ? { hideInEditor: true } : {}),
      ...(rawHit.hiddenInEditor ? { hiddenInEditor: true } : {}),
      ...resolveMultiplierFromEntry(rawEntry, level),
    }

    if (rawHit.durationExtension != null) {
      nextHit.durationExtension = Number(resolveLeveledValue(rawHit.durationExtension, level)) || 0
    }

    if (preserveCondition && rawEntry?.condition !== undefined) {
      nextHit._condition = rawEntry.condition
    }

    if (rawHit.treatAsReaction) {
      nextHit.treatAsReaction = rawHit.treatAsReaction
    }

    if (rawEntry.treatAsSkillType) {
      nextHit.treatAsSkillType = rawEntry.treatAsSkillType
    }

    if (Array.isArray(rawHit.effects) && rawHit.effects.length > 0) {
      nextHit.effects = rawHit.effects
        .map((rawEffect) => resolveEffectAtLevel(rawEffect, undefined, level))
        .filter(Boolean)
    }

    if (nextHit._noDamage) {
      delete nextHit.multiplier
      delete nextHit._multiplierScaling
    }

    resolved.push(nextHit)
  }

  return resolved
}

export function extractRawEntries(skill, segmentIndex = 0) {
  const segment = skill?.segments?.[segmentIndex]
  if (!segment) return []

  return (segment.damageGroups || []).flatMap((group) => {
    const hits = Array.isArray(group?.hits) ? group.hits : []
    const totalWeight = hits.reduce((sum, hit) => sum + (Number(hit?.weight) || 1), 0) || 1

    return hits.map((hit) => ({
      hit,
      element: group?.element,
      condition: group?.condition,
      multiplier: group?.multiplier,
      multiplierMode: group?.multiplierMode,
      multiplierScaling: group?.multiplierScaling,
      treatAsSkillType: group?.treatAsSkillType,
      hitFraction: (Number(hit?.weight) || 1) / totalWeight,
    }))
  })
}

export function extractAggregateRawEntries(skill) {
  const rawSegments = Array.isArray(skill?.segments) ? skill.segments : []
  const entries = []
  let cursor = 0

  rawSegments.forEach((segment, segmentIndex) => {
    const segmentEntries = extractRawEntries(skill, segmentIndex).map((entry) => ({
      ...entry,
      hit: {
        ...entry.hit,
        offset: (Number(entry?.hit?.offset) || 0) + cursor,
      },
    }))

    entries.push(...segmentEntries)
    cursor += (Number(segment?.duration) || 0)

    if (segmentIndex < rawSegments.length - 1) {
      cursor += snapTimeToFrame(Math.max(0, Number(segment?.gap) || 0))
    }
  })

  return entries
}

export function buildResolvedSegmentPayload(skillIdBase, skill, levelIndex = 0) {
  const rawSegments = Array.isArray(skill?.segments) ? skill.segments : []
  let cursor = 0
  let aggregateElement = null
  const aggregateHits = []
  const segmentPayloads = []

  rawSegments.forEach((segment, index) => {
    const rawEntries = extractRawEntries(skill, index)
    const hits = resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true })
    const segmentSkillId = segment?.skillId
    const followupDelay = index < rawSegments.length - 1
      ? snapTimeToFrame(Math.max(0, Number(segment?.gap) || 0))
      : 0
    const segmentElement = segment?.damageGroups?.find((group) => group?.element)?.element || aggregateElement

    if (!aggregateElement && segmentElement) aggregateElement = segmentElement
    aggregateHits.push(...hits.map((hit) => ({
      ...hit,
      ...(segmentSkillId ? { skillId: segmentSkillId } : {}),
      offset: (Number(hit.offset) || 0) + cursor,
    })))

    segmentPayloads.push({
      id: `${skillIdBase}_seg${index + 1}`,
      duration: Number(segment?.duration) || 0,
      followupDelay,
      ...(segmentSkillId ? { skillId: segmentSkillId } : {}),
      ...(segment?.spCost != null ? { spCost: Number(segment.spCost) || 0 } : {}),
      payload: { hits: segmentSkillId ? hits.map((hit) => ({ ...hit, skillId: segmentSkillId })) : hits },
      element: segmentElement || aggregateElement || skill?.element || 'physical',
    })

    cursor += (Number(segment?.duration) || 0) + followupDelay
  })

  return {
    totalDuration: cursor,
    element: aggregateElement || skill?.element || 'physical',
    aggregatePayload: {
      hits: aggregateHits,
    },
    segmentPayloads,
  }
}
