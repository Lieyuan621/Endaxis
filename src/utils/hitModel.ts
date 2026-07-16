// ─── Editor hit/effect model ──────────────────────────────────────────────
// Bridges the editor's loose hit/effect objects and the optimizer engine
// shapes. The objects here originate from the (dynamically-shaped) timeline
// store, so the structural types below are intentionally permissive.

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

const PHYSICAL_STATUS_TYPES = new Set([
  'vulnerability',
  'breach',
  'crush',
  'lift',
  'break',
  'armor_break',
  'stagger',
  'knockdown',
  'knockup',
  'ice_shatter',
]);

const REACTION_TYPES = new Set(['combustion', 'electrification', 'solidification', 'corrosion']);

const ARTS_ELEMENTS = Object.freeze(['heat', 'cryo', 'electric', 'nature']);

const DAMAGE_ELEMENTS = new Set(['physical', ...ARTS_ELEMENTS]);

const SKILL_TYPE_SCOPES = new Set([
  'basicAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
  'finalStrike',
  'finisher',
  'dive',
  'nonSkill',
]);

const ENEMY_STAT_MODIFIERS = new Set([
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'slowed',
  'weaken',
  'inflictionBarrier',
]);

const OPERATOR_STAT_MODIFIERS = new Set([
  'atkPercent',
  'attributeAtkPercent',
  'atkFlat',
  'hpPercent',
  'flatHp',
  'defPercent',
  'flatDef',
  'artsIntensity',
  'ultimateGainEfficiency',
  'ultimateEnergyCostReduction',
  'shield',
  'protection',
  'link',
  'heal',
  'critRate',
  'critDmg',
  'directMultiplier',
  'spRecoveryFlat',
  'spRecoveryPercent',
  'battleSkillSPCostReduction',
  'staggerFlat',
  'staggerPercent',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
  'ampBonus',
  'resistanceIgnore',
  'dmgBonus',
  'susceptibilityAmplify',
]);

const ELEMENT_SCOPED_STAT_MODIFIERS = new Set([
  'ampBonus',
  'resistanceIgnore',
  'dmgBonus',
  'susceptibilityAmplify',
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'inflictionBarrier',
]);

const SKILL_SCOPED_STAT_MODIFIERS = new Set([
  'critRate',
  'critDmg',
  'directMultiplier',
  'spRecoveryFlat',
  'spRecoveryPercent',
  'staggerFlat',
  'staggerPercent',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
  'dmgBonus',
  'susceptibilityAmplify',
]);

const COMMON_EFFECT_FIELDS = Object.freeze([
  'id',
  'name',
  'displayType',
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
]);

const EFFECT_KIND_FIELDS: Record<string, string[]> = Object.freeze({
  status: ['target', 'stat', 'value', 'scaling', 'silent', 'external'],
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
  ultEnergyGain: ['target', 'value', 'scaling'],
  consume: ['operatorStatus', 'enemyStatus', 'consumeStacks', 'consumeScope'],
  oneTime: ['stat', 'value', 'target', 'skillTypes', 'skillId'],
  cooldownReductionFlat: ['value', 'target', 'skillTypes', 'skillId'],
  cooldownReductionPercent: ['value', 'target', 'skillTypes', 'skillId'],
});

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
  hideInEditor?: boolean;
  hiddenInEditor?: boolean;
  spKind?: string;
  sp?: number;
  [key: string]: unknown;
}

export interface ActionLikeEntity {
  type?: string;
  hits?: EditorHit[];
  element?: string | null;
  allowedEffectTypes?: string[];
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

export function ensureEffectIds(rows: EditorEffect[][]): EditorEffect[][] {
  if (!Array.isArray(rows)) return rows;
  rows.forEach(row => {
    if (!Array.isArray(row)) return;
    row.forEach(effect => ensureEffectId(effect));
  });
  return rows;
}

function inferAllowedEffectTypesFromHits(hits: EditorHit[] = []): string[] {
  const collected = new Set<string>();
  hits.forEach(hit => {
    const effects = Array.isArray(hit?.effects) ? hit.effects : [];
    effects.forEach(effect => {
      const type = effect?.displayType || effect?.type || effect?.id || effect?.kind;
      if (type) collected.add(type);
    });
  });
  return [...collected];
}

export function getHitEffectRows(hits: EditorHit[] = []): EditorEffect[][] {
  return (Array.isArray(hits) ? hits : []).map(hit => {
    if (!Array.isArray(hit?.effects)) hit.effects = [];
    hit.effects.forEach(effect => ensureEffectId(effect));
    return hit.effects;
  });
}

export function setHitEffectRows(
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
      if (next.displayType === undefined)
        next.displayType = next.type || next.id || next.kind || 'default';
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

export function canEditEditorEffectValue(effect: EditorEffect): boolean {
  if (!effect || typeof effect !== 'object') return false;
  if (effect.kind === 'status' && effect.stat) return true;
  return ['damageHit', 'spRecovery', 'spReturn', 'ultEnergyGain'].includes(effect.kind ?? '');
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

export function isEditorVisibleHit(hit: EditorHit): boolean {
  return hit?.hideInEditor !== true && hit?.hiddenInEditor !== true;
}

export function filterEditorVisibleHits(hits: EditorHit[] = []): EditorHit[] {
  return (Array.isArray(hits) ? hits : []).filter(isEditorVisibleHit);
}

export function mergeEditorVisibleHits(
  existingHits: EditorHit[] = [],
  visibleHits: EditorHit[] = [],
  defaultElement: string | null = null,
): EditorHit[] {
  const hiddenHits = (Array.isArray(existingHits) ? existingHits : [])
    .filter(hit => !isEditorVisibleHit(hit))
    .map(stripEditorHitMetadata);
  const nextVisibleHits = (Array.isArray(visibleHits) ? visibleHits : []).map(
    stripEditorHitMetadata,
  );
  return normalizeHits([...nextVisibleHits, ...hiddenHits], defaultElement);
}

export function patchEditorHitAt(
  hits: EditorHit[] = [],
  index: number,
  patch: EditorHit = {},
  defaultElement: string | null = null,
): EditorHit[] {
  const next = Array.isArray(hits) ? hits.map(hit => cloneEditorHit(hit, defaultElement)) : [];
  if (!next[index]) return next;
  next[index] = cloneEditorHit({ ...next[index], ...cloneJson(patch) }, defaultElement);
  return normalizeHits(next, defaultElement);
}

export function parseEditorJsonField(
  raw: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const text = String(raw ?? '').trim();
  if (!text) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function getEditorEffectEditableFields(effect: EditorEffect): string[] {
  return [...COMMON_EFFECT_FIELDS, ...(EFFECT_KIND_FIELDS[effect?.kind ?? ''] || [])];
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
  const defaults: Record<string, EditorEffect> = {
    status: { kind: 'status', id: next.id || 'default', name: next.name || next.id || 'default' },
    infliction: { kind: 'infliction', element: next.element || 'heat' },
    burst: { kind: 'burst', element: next.element || 'heat' },
    reaction: { kind: 'reaction', reactionType: next.reactionType || 'combustion' },
    physicalStatus: { kind: 'physicalStatus', physicalType: next.physicalType || 'breach' },
    damageHit: {
      kind: 'damageHit',
      element: next.element || 'physical',
      multiplier: Number(next.multiplier) || 0,
    },
    damageOverTime: {
      kind: 'damageOverTime',
      element: next.element || 'physical',
      multiplier: Number(next.multiplier) || 0,
      interval: Number(next.interval) || 1,
    },
    spRecovery: { kind: 'spRecovery', value: Number(next.value) || 0 },
    spReturn: { kind: 'spReturn', value: Number(next.value) || 0 },
    ultEnergyGain: { kind: 'ultEnergyGain', value: Number(next.value) || 0 },
    consume: {
      kind: 'consume',
      ...(Number(next.consumeStacks) ? { consumeStacks: Number(next.consumeStacks) } : {}),
    },
    oneTime: {
      kind: 'oneTime',
      stat: next.stat || { modifier: 'dmgBonus' },
      value: Number(next.value) || 0,
    },
    cooldownReductionFlat: { kind: 'cooldownReductionFlat', value: Number(next.value) || 0 },
    cooldownReductionPercent: { kind: 'cooldownReductionPercent', value: Number(next.value) || 0 },
  };
  return { ...keep, ...(defaults[nextKind] || defaults.status) };
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
  aliasStyle?: 'camel' | 'snake' | 'both' | null;
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

  const allowedList = Array.isArray(entity.allowedEffectTypes)
    ? entity.allowedEffectTypes
    : entity.allowedTypes || entity.allowed_types || inferAllowedEffectTypesFromHits(entity.hits);
  entity.allowedEffectTypes = Array.isArray(allowedList) ? [...allowedList] : [];

  if (deleteLegacy) {
    delete entity.damageTicks;
    delete entity.damage_ticks;
    delete entity.physicalAnomaly;
    delete entity.anomalies;
    delete entity.allowedTypes;
    delete entity.allowed_types;
  }

  if (aliasStyle === 'camel' || aliasStyle === 'both') {
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
    defineAlias(entity, 'allowedTypes', {
      get(this: ActionLikeEntity) {
        return this.allowedEffectTypes;
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.allowedEffectTypes = Array.isArray(value) ? value : [];
      },
    });
  }

  if (aliasStyle === 'snake' || aliasStyle === 'both') {
    defineAlias(entity, 'damage_ticks', {
      get(this: ActionLikeEntity) {
        return this.hits;
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.hits = normalizeHits(value as EditorHit[], this.element || defaultElement);
      },
    });
    defineAlias(entity, 'anomalies', {
      get(this: ActionLikeEntity) {
        return getHitEffectRows(this.hits);
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.hits = setHitEffectRows(this.hits, value as EditorEffect[][]);
      },
    });
    defineAlias(entity, 'allowed_types', {
      get(this: ActionLikeEntity) {
        return this.allowedEffectTypes;
      },
      set(this: ActionLikeEntity, value: unknown) {
        this.allowedEffectTypes = Array.isArray(value) ? value : [];
      },
    });
  }

  return entity;
}
