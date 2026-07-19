// ─── Editor hit/effect model ──────────────────────────────────────────────
// Bridges the editor's loose hit/effect objects and the optimizer engine
// shapes. The objects here originate from the (dynamically-shaped) timeline
// store, so the structural types below are intentionally permissive.

import {
  PHYSICAL_STATUS_TYPES as PHYSICAL_STATUS_TYPE_LIST,
  ARTS_ELEMENTS,
  DAMAGE_ELEMENTS as DAMAGE_ELEMENT_LIST,
  ELEMENT_SCOPED_STAT_MODIFIERS as ELEMENT_SCOPED_STAT_MODIFIER_LIST,
  ENEMY_STAT_MODIFIERS as ENEMY_STAT_MODIFIER_LIST,
  OPERATOR_STAT_MODIFIERS as OPERATOR_STAT_MODIFIER_LIST,
  REACTION_TYPES as REACTION_TYPE_LIST,
  SKILL_SCOPED_STAT_MODIFIERS as SKILL_SCOPED_STAT_MODIFIER_LIST,
  SKILL_TYPE_SCOPES as SKILL_TYPE_SCOPE_LIST,
} from '@/data/enums';
import { createEffectKindDefaults } from '@/editor/hits/effectSchema';

const LEGACY_TO_OPTIMIZER_TYPE: Record<string, string> = Object.freeze({
  attack: 'basicAttack',
  skill: 'battleSkill',
  link: 'comboSkill',
  ultimate: 'ultimate',
  execution: 'finisher',
});

const OPTIMIZER_TO_LEGACY_TYPE: Record<string, string> = Object.freeze({
  basicAttack: 'attack',
  battleSkill: 'skill',
  comboSkill: 'link',
  ultimate: 'ultimate',
  finisher: 'execution',
  dive: 'dive',
});

const PHYSICAL_STATUS_TYPES = new Set<string>(PHYSICAL_STATUS_TYPE_LIST);
const REACTION_TYPES = new Set<string>(REACTION_TYPE_LIST);
const DAMAGE_ELEMENTS = new Set<string>(DAMAGE_ELEMENT_LIST);
const SKILL_TYPE_SCOPES = new Set<string>(SKILL_TYPE_SCOPE_LIST);
const ENEMY_STAT_MODIFIERS = new Set<string>(ENEMY_STAT_MODIFIER_LIST);
const OPERATOR_STAT_MODIFIERS = new Set<string>(OPERATOR_STAT_MODIFIER_LIST);
const ELEMENT_SCOPED_STAT_MODIFIERS = new Set<string>(ELEMENT_SCOPED_STAT_MODIFIER_LIST);
const SKILL_SCOPED_STAT_MODIFIERS = new Set<string>(SKILL_SCOPED_STAT_MODIFIER_LIST);

export interface EditorStat {
  modifier?: string;
  elements?: string | string[];
  skillTypes?: string | string[];
}

export interface EditorEffect {
  _id?: string;
  kind?: string;
  type?: string;
  id?: string;
  name?: string;
  displayType?: string;
  element?: string;
  physicalType?: string;
  reactionType?: string;
  stat?: EditorStat | null;
  value?: number;
  duration?: number;
  durationExtension?: number;
  stacks?: number | string;
  maxStacks?: number;
  offset?: number;
  interval?: number;
  consumeStacks?: number;
  [key: string]: unknown;
}

export interface EditorHit {
  id?: string | number;
  offset?: number;
  stagger?: number;
  spRecovery?: number;
  spReturn?: number;
  durationExtension?: number;
  element?: string | null;
  effects?: EditorEffect[];
  spKind?: string;
  sp?: number;
  [key: string]: unknown;
}

function hitSpGain(hit: EditorHit | null | undefined): number {
  return (Number(hit?.spRecovery) || 0) + (Number(hit?.spReturn) || 0);
}

/**
 * Panel summary totals for a flattened hit list.
 * Hits that share an `id` (typical mutually-exclusive branch variants) contribute
 * only their max stagger / SP; hits without an id still sum individually.
 */
export function summarizeEditorHitTotals(hits: readonly EditorHit[] = []): {
  stagger: number;
  spGain: number;
} {
  let stagger = 0;
  let spGain = 0;
  const maxStaggerById = new Map<string, number>();
  const maxSpById = new Map<string, number>();

  for (const hit of hits) {
    if (!hit || typeof hit !== 'object') continue;
    const id = hit.id != null && String(hit.id).trim() !== '' ? String(hit.id) : '';
    const hitStagger = Number(hit.stagger) || 0;
    const hitSp = hitSpGain(hit);
    if (id) {
      maxStaggerById.set(id, Math.max(maxStaggerById.get(id) || 0, hitStagger));
      maxSpById.set(id, Math.max(maxSpById.get(id) || 0, hitSp));
    } else {
      stagger += hitStagger;
      spGain += hitSp;
    }
  }

  for (const value of maxStaggerById.values()) stagger += value;
  for (const value of maxSpById.values()) spGain += value;

  return { stagger, spGain };
}

export interface ActionLikeEntity {
  type?: string;
  hits?: EditorHit[];
  element?: string | null;
  [key: string]: unknown;
}

function cloneJson<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stripEditorHitMetadata(hit: EditorHit): EditorHit {
  if (!hit || typeof hit !== 'object') return hit;
  const next = { ...hit };
  delete next._editorId;
  delete next._editorSourceIndex;
  return next;
}

export function createHitModelId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function toOptimizerActionType(type: string | null | undefined): string {
  if (!type) return 'battleSkill';
  return LEGACY_TO_OPTIMIZER_TYPE[type] || type;
}

export function toLegacyDisplayType(type: string | null | undefined): string {
  if (!type) return 'unknown';
  return OPTIMIZER_TO_LEGACY_TYPE[type] || type;
}

function decorateHitCompat(hit: EditorHit): EditorHit {
  if (!hit || typeof hit !== 'object') return hit;
  if (!Object.prototype.hasOwnProperty.call(hit, 'sp')) {
    Object.defineProperty(hit, 'sp', {
      enumerable: false,
      configurable: true,
      get(this: EditorHit) {
        return this.spKind === 'refund' ? Number(this.spReturn) || 0 : Number(this.spRecovery) || 0;
      },
      set(this: EditorHit, value: unknown) {
        const num = Number(value) || 0;
        if (this.spKind === 'refund') {
          this.spReturn = num;
          this.spRecovery = 0;
        } else {
          this.spRecovery = num;
          this.spReturn = 0;
        }
      },
    });
  }
  if (!Object.prototype.hasOwnProperty.call(hit, 'spKind')) {
    Object.defineProperty(hit, 'spKind', {
      enumerable: false,
      configurable: true,
      get(this: EditorHit) {
        return (Number(this.spReturn) || 0) > 0 ? 'refund' : 'recover';
      },
      set(this: EditorHit, value: unknown) {
        const current = Number(this.sp) || 0;
        if (value === 'refund') {
          this.spReturn = current;
          this.spRecovery = 0;
        } else {
          this.spRecovery = current;
          this.spReturn = 0;
        }
      },
    });
  }
  return hit;
}

export function ensureEffectId(effect: EditorEffect): EditorEffect {
  if (!effect || typeof effect !== 'object') return effect;
  if (!effect._id) effect._id = createHitModelId();
  return effect;
}

function getHitEffectRows(hits: EditorHit[] = []): EditorEffect[][] {
  return (Array.isArray(hits) ? hits : []).map(hit => {
    if (!Array.isArray(hit?.effects)) hit.effects = [];
    hit.effects.forEach(effect => ensureEffectId(effect));
    return hit.effects;
  });
}

function setHitEffectRows(
  existingHits: EditorHit[] = [],
  rows: EditorEffect[][] = [],
): EditorHit[] {
  const nextHits = Array.isArray(existingHits) ? existingHits : [];
  while (nextHits.length < rows.length) {
    nextHits.push(createEditorHit());
  }
  nextHits.length = rows.length;
  nextHits.forEach((hit, index) => {
    const nextRow = Array.isArray(rows[index]) ? rows[index]! : [];
    hit.effects = nextRow.map(effect => ensureEffectId(effect));
  });
  return nextHits;
}

function convertLegacyRowToEffects(row: EditorEffect[] = []): EditorEffect[] {
  return row
    .filter(effect => effect && typeof effect === 'object')
    .map(effect => {
      const next = cloneJson(effect) || ({} as EditorEffect);
      ensureEffectId(next);
      // Prefer locale keys (type/name/kind). Never seed displayType from runtime `id`
      // (e.g. lastrite-hypothermic-perfusion) — that shadows `name` in resolveEffectDisplayKey.
      if (next.displayType === undefined)
        next.displayType = next.type || next.name || next.kind || 'default';
      if (next.type && PHYSICAL_STATUS_TYPES.has(next.type)) {
        next.kind = next.kind || 'physicalStatus';
        next.physicalType = next.physicalType || next.type;
      } else if (typeof next.type === 'string' && next.type.endsWith('_attach')) {
        next.kind = next.kind || 'infliction';
        next.element = next.element || next.type.replace(/_attach$/, '');
      } else if (typeof next.type === 'string' && next.type.endsWith('_burst')) {
        next.kind = next.kind || 'burst';
        next.element = next.element || next.type.replace(/_burst$/, '');
      } else {
        next.kind = next.kind || 'status';
        next.id = next.id || next.type || next.name || ensureEffectId(next)._id;
        next.name = next.name || next.type || next.id;
      }
      next.duration = Number(next.duration) || 0;
      next.stacks = Math.max(1, Number(next.stacks) || 1);
      return next;
    });
}

export function createEditorEffect(defaultType = 'default'): EditorEffect {
  return retypeEditorEffect(
    {
      _id: createHitModelId(),
      stacks: 1,
      duration: 0,
    },
    defaultType,
  );
}

function getElementFromDisplayType(type: string, suffix: string): string {
  return String(type || '').slice(0, -suffix.length);
}

function parseStatPresetKey(displayType: string): EditorEffect | null {
  const [modifier, scope] = String(displayType || '').split(':');
  if (!modifier) return null;
  if (!ENEMY_STAT_MODIFIERS.has(modifier) && !OPERATOR_STAT_MODIFIERS.has(modifier)) return null;

  const stat: EditorStat = { modifier };
  if (scope === 'arts' && ELEMENT_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.elements = [...ARTS_ELEMENTS];
  } else if (scope && DAMAGE_ELEMENTS.has(scope) && ELEMENT_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.elements = scope;
  } else if (scope && SKILL_TYPE_SCOPES.has(scope) && SKILL_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.skillTypes = scope === 'finisher' ? 'finalStrike' : scope;
  }

  return {
    kind: 'status',
    stat,
    target: ENEMY_STAT_MODIFIERS.has(modifier) ? 'enemy' : 'self',
  };
}

function buildEffectRoute(type: string): EditorEffect {
  const displayType = type || 'default';
  if (String(displayType).endsWith('_infliction')) {
    return {
      kind: 'infliction',
      element: getElementFromDisplayType(displayType, '_infliction'),
    };
  }
  if (String(displayType).endsWith('_attach')) {
    return {
      kind: 'infliction',
      element: getElementFromDisplayType(displayType, '_attach'),
    };
  }
  if (String(displayType).endsWith('_burst')) {
    return {
      kind: 'burst',
      element: getElementFromDisplayType(displayType, '_burst'),
    };
  }
  if (PHYSICAL_STATUS_TYPES.has(displayType)) {
    return {
      kind: 'physicalStatus',
      physicalType: displayType,
    };
  }
  if (REACTION_TYPES.has(displayType)) {
    return {
      kind: 'reaction',
      reactionType: displayType,
    };
  }
  const statRoute = parseStatPresetKey(displayType);
  if (statRoute) return statRoute;
  return {
    kind: 'status',
    id: displayType,
    name: displayType,
  };
}

export function retypeEditorEffect(effect: EditorEffect, nextType = 'default'): EditorEffect {
  const displayType = nextType || 'default';
  const next = cloneJson(effect) || ({} as EditorEffect);
  ensureEffectId(next);
  const value = Number(next.value);

  delete next.id;
  delete next.name;
  delete next.stat;
  delete next.value;
  delete next.element;
  delete next.physicalType;
  delete next.reactionType;

  return {
    ...next,
    type: displayType,
    displayType,
    ...buildEffectRoute(displayType),
    ...(parseStatPresetKey(displayType) ? { value: Number.isFinite(value) ? value : 0 } : {}),
  };
}

export function cloneEditorHit(
  hit: EditorHit = {},
  defaultElement: string | null = null,
): EditorHit {
  const cloned = cloneJson(hit) || ({} as EditorHit);
  if (!Array.isArray(cloned.effects)) cloned.effects = [];
  cloned.effects = cloned.effects.map(effect => ensureEffectId(effect));
  return decorateHitCompat(
    normalizeHits([cloned], defaultElement)[0] || createEditorHit({ element: defaultElement }),
  );
}

export function toPersistedEditorHits(
  hits: EditorHit[] = [],
  defaultElement: string | null = null,
): EditorHit[] {
  return normalizeHits(
    (Array.isArray(hits) ? hits : []).map(stripEditorHitMetadata),
    defaultElement,
  );
}

export function retypeEditorEffectKind(effect: EditorEffect, nextKind: string): EditorEffect {
  const next = cloneJson(effect) || ({} as EditorEffect);
  ensureEffectId(next);
  const keep = {
    _id: next._id,
    duration: next.duration,
    durationExtension: next.durationExtension,
    stacks: next.stacks,
    maxStacks: next.maxStacks,
    stackStrategy: next.stackStrategy,
    icd: next.icd,
    icdGroup: next.icdGroup,
    hide: next.hide,
    ignoreTimeShift: next.ignoreTimeShift,
    applyTiming: next.applyTiming,
    condition: next.condition,
  };
  return {
    ...keep,
    ...createEffectKindDefaults(nextKind, next as Record<string, unknown>),
  } as EditorEffect;
}

export interface CreateEditorHitOptions {
  offset?: number;
  stagger?: number;
  spRecovery?: number;
  spReturn?: number;
  element?: string | null;
  effects?: EditorEffect[];
}

export function createEditorHit({
  offset = 0,
  stagger = 0,
  spRecovery = 0,
  spReturn = 0,
  element = null,
  effects = [],
}: CreateEditorHitOptions = {}): EditorHit {
  const hit: EditorHit = {
    offset: Number(offset) || 0,
    stagger: Number(stagger) || 0,
    spRecovery: Number(spRecovery) || 0,
    spReturn: Number(spReturn) || 0,
    effects: Array.isArray(effects) ? effects.map(effect => ensureEffectId(effect)) : [],
  };
  if (element) hit.element = element;
  return decorateHitCompat(hit);
}

export function normalizeHits(
  rawHits: EditorHit[] = [],
  defaultElement: string | null = null,
): EditorHit[] {
  if (!Array.isArray(rawHits)) return [];
  return rawHits
    .filter(hit => hit && typeof hit === 'object')
    .map(hit => {
      const next: EditorHit = {
        ...hit,
        offset: Number(hit.offset) || 0,
        stagger: Number(hit.stagger) || 0,
        spRecovery: Number(hit.spRecovery) || 0,
        spReturn: Number(hit.spReturn) || 0,
        durationExtension: Number(hit.durationExtension) || 0,
      };
      if (!next.element && defaultElement) next.element = defaultElement;
      next.effects = Array.isArray(hit.effects)
        ? hit.effects.map(effect => ensureEffectId(effect))
        : [];
      return decorateHitCompat(next);
    })
    .sort((a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0));
}

export interface LegacyActionInput {
  hits?: EditorHit[];
  damageTicks?: unknown;
  physicalAnomaly?: unknown;
  allowedTypes?: unknown;
  effectRows?: unknown;
  element?: string | null;
}

export function legacyActionToHits({
  hits,
  damageTicks,
  physicalAnomaly,
  allowedTypes,
  effectRows,
  element,
}: LegacyActionInput = {}): EditorHit[] {
  if (Array.isArray(hits) && hits.length > 0) {
    return normalizeHits(hits, element);
  }

  const normalizedHits: EditorHit[] = Array.isArray(damageTicks)
    ? damageTicks.map(tick =>
        createEditorHit({
          offset: tick?.offset,
          stagger: tick?.stagger,
          spRecovery: tick?.spKind === 'refund' ? 0 : Number(tick?.sp) || 0,
          spReturn: tick?.spKind === 'refund' ? Number(tick?.sp) || 0 : 0,
          element,
        }),
      )
    : [];

  const rowsSource = effectRows ?? physicalAnomaly;
  const rows: EditorEffect[][] = Array.isArray(rowsSource)
    ? Array.isArray(rowsSource[0])
      ? (rowsSource as EditorEffect[][])
      : [rowsSource as EditorEffect[]]
    : [];

  rows.forEach((row, rowIndex) => {
    const effects = convertLegacyRowToEffects(row);
    if (effects.length === 0) return;

    const firstOffset = Number(effects[0]?.offset) || 0;
    const boundHitIndex = normalizedHits.findIndex((hit, hitIndex) => {
      if (hitIndex === rowIndex && rowIndex < normalizedHits.length) return true;
      return Math.abs((Number(hit.offset) || 0) - firstOffset) < 0.0001;
    });

    const targetIndex = boundHitIndex >= 0 ? boundHitIndex : normalizedHits.length;
    if (!normalizedHits[targetIndex]) {
      normalizedHits[targetIndex] = createEditorHit({
        offset: firstOffset,
        element,
      });
    }
    normalizedHits[targetIndex]!.effects!.push(...effects);
  });

  if (normalizedHits.length === 0 && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
    // Legacy actions sometimes only stored allowedTypes; keep a placeholder hit.
    normalizedHits.push(createEditorHit({ element }));
  }

  return normalizeHits(normalizedHits, element);
}

function defineAlias(
  entity: ActionLikeEntity,
  aliasKey: string,
  descriptor: PropertyDescriptor,
): void {
  if (!entity || typeof entity !== 'object') return;
  const current = Object.getOwnPropertyDescriptor(entity, aliasKey);
  if (current?.get || current?.set) return;
  Object.defineProperty(entity, aliasKey, {
    enumerable: false,
    configurable: true,
    ...descriptor,
  });
}

export interface EnsureActionLikeModelOptions {
  deleteLegacy?: boolean;
  /** Compat aliases for old panel code that still reads damageTicks / physicalAnomaly. */
  aliasStyle?: 'camel' | null;
  defaultElement?: string | null;
}

export function ensureActionLikeModel(
  entity: ActionLikeEntity,
  {
    deleteLegacy = true,
    aliasStyle = null,
    defaultElement = null,
  }: EnsureActionLikeModelOptions = {},
): ActionLikeEntity {
  if (!entity || typeof entity !== 'object') return entity;

  entity.type = toOptimizerActionType(entity.type);
  entity.hits = legacyActionToHits({
    hits: entity.hits,
    damageTicks: entity.damageTicks || entity.damage_ticks,
    physicalAnomaly: entity.physicalAnomaly || entity.anomalies,
    allowedTypes: entity.allowedTypes || entity.allowed_types,
    element: entity.element || defaultElement,
  });

  if (deleteLegacy) {
    delete entity.damageTicks;
    delete entity.damage_ticks;
    delete entity.physicalAnomaly;
    delete entity.anomalies;
    delete entity.allowedTypes;
    delete entity.allowed_types;
    delete entity.allowedEffectTypes;
  }

  if (aliasStyle === 'camel') {
    defineAlias(entity, 'damageTicks', {
      get(this: ActionLikeEntity) {
        return this.hits;
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.hits = normalizeHits(value as EditorHit[], this.element || defaultElement);
      },
    });
    defineAlias(entity, 'physicalAnomaly', {
      get(this: ActionLikeEntity) {
        return getHitEffectRows(this.hits);
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.hits = setHitEffectRows(this.hits, value as EditorEffect[][]);
      },
    });
  }

  return entity;
}
