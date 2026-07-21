/**
 * Declarative effect schema — field lists, defaults, and JSON escape-hatch keys.
 * Domain shapes live in `data/types.ts`.
 */

import { ARTS_ELEMENTS } from '@/data/enums';

/** Effect kinds users can pick in the hit editor. */
export const EDITOR_EFFECT_KINDS = Object.freeze([
  'status',
  'amp',
  'infliction',
  'burst',
  'reaction',
  'physicalStatus',
  'damageHit',
  'damageOverTime',
  'spRecovery',
  'spReturn',
  'ultEnergyGain',
  'consume',
  'oneTime',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
] as const);

/**
 * Sheet / domain effect kinds including `derived`.
 * `amp` is editor-only (persists as `status` + ampBonus display); `derived` is authoring-only.
 */
export const EFFECT_KINDS = Object.freeze([
  ...EDITOR_EFFECT_KINDS.filter(kind => kind !== 'amp'),
  'derived',
] as const);

export type EffectKindKey = (typeof EFFECT_KINDS)[number];

export const COMMON_EFFECT_FIELDS = Object.freeze([
  'id',
  'name',
  'displayType',
  'icon',
  'duration',
  'durationExtension',
  'stacks',
  'maxStacks',
  'stackStrategy',
  'icd',
  'icdGroup',
  'hide',
  'ignoreTimeShift',
  'applyTiming',
  'condition',
] as const);

/** Kind-specific editable field keys (legacy `EFFECT_KIND_FIELDS` shape). */
export const EFFECT_KIND_FIELDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  status: ['target', 'stat', 'value', 'scaling', 'silent', 'external'],
  amp: ['target', 'stat', 'value', 'scaling', 'silent', 'external'],
  infliction: ['element'],
  burst: ['element'],
  reaction: ['reactionType', 'requiresInfliction', 'effectiveness', 'defaultLevel'],
  physicalStatus: ['physicalType', 'forced', 'effectiveness'],
  damageHit: [
    'element',
    'multiplier',
    'multiplierScaling',
    'staggerScaling',
    'offset',
    'hit',
    'readConsumedStacks',
    'scaleByCrit',
  ],
  damageOverTime: [
    'element',
    'multiplier',
    'multiplierMode',
    'multiplierScaling',
    'offset',
    'interval',
    'snapshot',
    'canCrit',
    'skipFirstTick',
    'cancelOnRefresh',
    'consumedStatEffects',
  ],
  spRecovery: ['value', 'scaling'],
  spReturn: ['value', 'scaling'],
  ultEnergyGain: ['target', 'value', 'scaling', 'ignoreEfficiency'],
  consume: ['operatorStatus', 'enemyStatus', 'consumeStacks', 'consumeScope', 'consumeTarget'],
  oneTime: ['stat', 'value', 'target', 'skillTypes'],
  cooldownReductionFlat: ['value', 'target', 'skillTypes'],
  cooldownReductionPercent: ['value', 'target', 'skillTypes'],
  derived: ['sourceEffect', 'effect'],
});

export function getEffectEditableFieldKeys(kind: string | null | undefined): string[] {
  return [...COMMON_EFFECT_FIELDS, ...(EFFECT_KIND_FIELDS[kind ?? ''] || [])];
}

export function effectKindHasField(kind: string | null | undefined, field: string): boolean {
  return !!(kind && EFFECT_KIND_FIELDS[kind]?.includes(field));
}

export function createEffectKindDefaults(
  kind: EffectKindKey | string,
  seed: Record<string, unknown> = {},
): Record<string, unknown> {
  const next = seed;
  switch (kind) {
    case 'status':
      return {
        kind: 'status',
        id: next.id || 'default',
        name: next.name || next.id || 'default',
      };
    case 'amp':
      // `ampBonus:arts` is a display preset; runtime elements are the four arts
      // elements (not the literal string "arts", which is not a DamageElement).
      return {
        kind: 'status',
        type: 'ampBonus:arts',
        displayType: 'ampBonus:arts',
        id: next.id || 'ampBonus:arts',
        name: next.name || 'ampBonus:arts',
        stat: { modifier: 'ampBonus', elements: [...ARTS_ELEMENTS] },
        target: next.target || 'self',
        value: Number(next.value) || 0,
      };
    case 'infliction':
      return { kind: 'infliction', element: next.element || 'heat' };
    case 'burst':
      return { kind: 'burst', element: next.element || 'heat' };
    case 'reaction':
      return { kind: 'reaction', reactionType: next.reactionType || 'combustion' };
    case 'physicalStatus':
      return { kind: 'physicalStatus', physicalType: next.physicalType || 'breach' };
    case 'damageHit':
      return {
        kind: 'damageHit',
        element: next.element || 'physical',
        multiplier: Number(next.multiplier) || 0,
      };
    case 'damageOverTime':
      return {
        kind: 'damageOverTime',
        element: next.element || 'physical',
        multiplier: Number(next.multiplier) || 0,
        interval: Number(next.interval) || 1,
      };
    case 'spRecovery':
      return { kind: 'spRecovery', value: Number(next.value) || 0 };
    case 'spReturn':
      return { kind: 'spReturn', value: Number(next.value) || 0 };
    case 'ultEnergyGain':
      return { kind: 'ultEnergyGain', value: Number(next.value) || 0 };
    case 'consume':
      return {
        kind: 'consume',
        ...(Number(next.consumeStacks) ? { consumeStacks: Number(next.consumeStacks) } : {}),
      };
    case 'oneTime':
      return {
        kind: 'oneTime',
        stat: next.stat || { modifier: 'dmgBonus' },
        value: Number(next.value) || 0,
      };
    case 'cooldownReductionFlat':
      return { kind: 'cooldownReductionFlat', value: Number(next.value) || 0 };
    case 'cooldownReductionPercent':
      return { kind: 'cooldownReductionPercent', value: Number(next.value) || 0 };
    case 'derived':
      return {
        kind: 'derived',
        sourceEffect: typeof next.sourceEffect === 'string' ? next.sourceEffect : '',
      };
    default:
      return { kind: 'status', id: 'default', name: 'default' };
  }
}
