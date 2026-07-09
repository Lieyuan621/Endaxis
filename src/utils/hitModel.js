const LEGACY_TO_OPTIMIZER_TYPE = Object.freeze({
  attack: 'basicAttack',
  skill: 'battleSkill',
  link: 'comboSkill',
  ultimate: 'ultimate',
  execution: 'finisher',
})

const OPTIMIZER_TO_LEGACY_TYPE = Object.freeze({
  basicAttack: 'attack',
  battleSkill: 'skill',
  comboSkill: 'link',
  ultimate: 'ultimate',
  finisher: 'execution',
  dive: 'dive',
})

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
])

const REACTION_TYPES = new Set([
  'combustion',
  'electrification',
  'solidification',
  'corrosion',
])

const ARTS_ELEMENTS = Object.freeze(['heat', 'cryo', 'electric', 'nature'])

const DAMAGE_ELEMENTS = new Set([
  'physical',
  ...ARTS_ELEMENTS,
])

const SKILL_TYPE_SCOPES = new Set([
  'basicAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
  'finalStrike',
  'finisher',
  'dive',
  'nonSkill',
])

const ENEMY_STAT_MODIFIERS = new Set([
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'slowed',
  'weaken',
  'inflictionBarrier',
])

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
])

const ELEMENT_SCOPED_STAT_MODIFIERS = new Set([
  'ampBonus',
  'resistanceIgnore',
  'dmgBonus',
  'susceptibilityAmplify',
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'inflictionBarrier',
])

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
])

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
])

const EFFECT_KIND_FIELDS = Object.freeze({
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
})

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function stripEditorHitMetadata(hit) {
  if (!hit || typeof hit !== 'object') return hit
  const next = { ...hit }
  delete next._editorId
  delete next._editorSourceIndex
  return next
}

export function createHitModelId() {
  return Math.random().toString(36).substring(2, 9)
}

export function toOptimizerActionType(type) {
  if (!type) return 'battleSkill'
  return LEGACY_TO_OPTIMIZER_TYPE[type] || type
}

export function toLegacyDisplayType(type) {
  if (!type) return 'unknown'
  return OPTIMIZER_TO_LEGACY_TYPE[type] || type
}

function decorateHitCompat(hit) {
  if (!hit || typeof hit !== 'object') return hit
  if (!Object.prototype.hasOwnProperty.call(hit, 'sp')) {
    Object.defineProperty(hit, 'sp', {
      enumerable: false,
      configurable: true,
      get() {
        return (this.spKind === 'refund')
          ? (Number(this.spReturn) || 0)
          : (Number(this.spRecovery) || 0)
      },
      set(value) {
        const num = Number(value) || 0
        if (this.spKind === 'refund') {
          this.spReturn = num
          this.spRecovery = 0
        } else {
          this.spRecovery = num
          this.spReturn = 0
        }
      },
    })
  }
  if (!Object.prototype.hasOwnProperty.call(hit, 'spKind')) {
    Object.defineProperty(hit, 'spKind', {
      enumerable: false,
      configurable: true,
      get() {
        return (Number(this.spReturn) || 0) > 0 ? 'refund' : 'recover'
      },
      set(value) {
        const current = Number(this.sp) || 0
        if (value === 'refund') {
          this.spReturn = current
          this.spRecovery = 0
        } else {
          this.spRecovery = current
          this.spReturn = 0
        }
      },
    })
  }
  return hit
}

export function ensureEffectId(effect) {
  if (!effect || typeof effect !== 'object') return effect
  if (!effect._id) effect._id = createHitModelId()
  return effect
}

export function ensureEffectIds(rows) {
  if (!Array.isArray(rows)) return rows
  rows.forEach((row) => {
    if (!Array.isArray(row)) return
    row.forEach((effect) => ensureEffectId(effect))
  })
  return rows
}

function inferAllowedEffectTypesFromHits(hits = []) {
  const collected = new Set()
  hits.forEach((hit) => {
    const effects = Array.isArray(hit?.effects) ? hit.effects : []
    effects.forEach((effect) => {
      const type = effect?.displayType || effect?.type || effect?.id || effect?.kind
      if (type) collected.add(type)
    })
  })
  return [...collected]
}

export function getHitEffectRows(hits = []) {
  return (Array.isArray(hits) ? hits : []).map((hit) => {
    if (!Array.isArray(hit?.effects)) hit.effects = []
    hit.effects.forEach((effect) => ensureEffectId(effect))
    return hit.effects
  })
}

export function setHitEffectRows(existingHits = [], rows = []) {
  const nextHits = Array.isArray(existingHits) ? existingHits : []
  while (nextHits.length < rows.length) {
    nextHits.push(createEditorHit())
  }
  nextHits.length = rows.length
  nextHits.forEach((hit, index) => {
    const nextRow = Array.isArray(rows[index]) ? rows[index] : []
    hit.effects = nextRow.map((effect) => ensureEffectId(effect))
  })
  return nextHits
}

function convertLegacyRowToEffects(row = []) {
  return row
    .filter((effect) => effect && typeof effect === 'object')
    .map((effect) => {
      const next = cloneJson(effect) || {}
      ensureEffectId(next)
      if (next.displayType === undefined) next.displayType = next.type || next.id || next.kind || 'default'
      if (PHYSICAL_STATUS_TYPES.has(next.type)) {
        next.kind = next.kind || 'physicalStatus'
        next.physicalType = next.physicalType || next.type
      } else if (typeof next.type === 'string' && next.type.endsWith('_attach')) {
        next.kind = next.kind || 'infliction'
        next.element = next.element || next.type.replace(/_attach$/, '')
      } else if (typeof next.type === 'string' && next.type.endsWith('_burst')) {
        next.kind = next.kind || 'burst'
        next.element = next.element || next.type.replace(/_burst$/, '')
      } else {
        next.kind = next.kind || 'status'
        next.id = next.id || next.type || next.name || ensureEffectId(next)._id
        next.name = next.name || next.type || next.id
      }
      next.duration = Number(next.duration) || 0
      next.stacks = Math.max(1, Number(next.stacks) || 1)
      return next
    })
}

export function createEditorEffect(defaultType = 'default') {
  return retypeEditorEffect({
    _id: createHitModelId(),
    stacks: 1,
    duration: 0,
  }, defaultType)
}

function getElementFromDisplayType(type, suffix) {
  return String(type || '').slice(0, -suffix.length)
}

function parseStatPresetKey(displayType) {
  const [modifier, scope] = String(displayType || '').split(':')
  if (!modifier) return null
  if (!ENEMY_STAT_MODIFIERS.has(modifier) && !OPERATOR_STAT_MODIFIERS.has(modifier)) return null

  const stat = { modifier }
  if (scope === 'arts' && ELEMENT_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.elements = [...ARTS_ELEMENTS]
  } else if (DAMAGE_ELEMENTS.has(scope) && ELEMENT_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.elements = scope
  } else if (SKILL_TYPE_SCOPES.has(scope) && SKILL_SCOPED_STAT_MODIFIERS.has(modifier)) {
    stat.skillTypes = scope === 'finisher' ? 'finalStrike' : scope
  }

  return {
    kind: 'status',
    stat,
    target: ENEMY_STAT_MODIFIERS.has(modifier) ? 'enemy' : 'self',
  }
}

function buildEffectRoute(type) {
  const displayType = type || 'default'
  if (String(displayType).endsWith('_infliction')) {
    return {
      kind: 'infliction',
      element: getElementFromDisplayType(displayType, '_infliction'),
    }
  }
  if (String(displayType).endsWith('_attach')) {
    return {
      kind: 'infliction',
      element: getElementFromDisplayType(displayType, '_attach'),
    }
  }
  if (String(displayType).endsWith('_burst')) {
    return {
      kind: 'burst',
      element: getElementFromDisplayType(displayType, '_burst'),
    }
  }
  if (PHYSICAL_STATUS_TYPES.has(displayType)) {
    return {
      kind: 'physicalStatus',
      physicalType: displayType,
    }
  }
  if (REACTION_TYPES.has(displayType)) {
    return {
      kind: 'reaction',
      reactionType: displayType,
    }
  }
  const statRoute = parseStatPresetKey(displayType)
  if (statRoute) return statRoute
  return {
    kind: 'status',
    id: displayType,
    name: displayType,
  }
}

export function retypeEditorEffect(effect, nextType = 'default') {
  const displayType = nextType || 'default'
  const next = cloneJson(effect) || {}
  ensureEffectId(next)
  const value = Number(next.value)

  delete next.id
  delete next.name
  delete next.stat
  delete next.value
  delete next.element
  delete next.physicalType
  delete next.reactionType

  return {
    ...next,
    type: displayType,
    displayType,
    ...buildEffectRoute(displayType),
    ...(parseStatPresetKey(displayType) ? { value: Number.isFinite(value) ? value : 0 } : {}),
  }
}

export function canEditEditorEffectValue(effect) {
  if (!effect || typeof effect !== 'object') return false
  if (effect.kind === 'status' && effect.stat) return true
  return ['damageHit', 'spRecovery', 'spReturn', 'ultEnergyGain'].includes(effect.kind)
}

export function cloneEditorHit(hit = {}, defaultElement = null) {
  const cloned = cloneJson(hit) || {}
  if (!Array.isArray(cloned.effects)) cloned.effects = []
  cloned.effects = cloned.effects.map((effect) => ensureEffectId(effect))
  return decorateHitCompat(
    normalizeHits([cloned], defaultElement)[0] || createEditorHit({ element: defaultElement }),
  )
}

export function isEditorVisibleHit(hit) {
  return hit?.hideInEditor !== true && hit?.hiddenInEditor !== true
}

export function filterEditorVisibleHits(hits = []) {
  return (Array.isArray(hits) ? hits : []).filter(isEditorVisibleHit)
}

export function mergeEditorVisibleHits(existingHits = [], visibleHits = [], defaultElement = null) {
  const hiddenHits = (Array.isArray(existingHits) ? existingHits : [])
    .filter(hit => !isEditorVisibleHit(hit))
    .map(stripEditorHitMetadata)
  const nextVisibleHits = (Array.isArray(visibleHits) ? visibleHits : [])
    .map(stripEditorHitMetadata)
  return normalizeHits([...nextVisibleHits, ...hiddenHits], defaultElement)
}

export function patchEditorHitAt(hits = [], index, patch = {}, defaultElement = null) {
  const next = Array.isArray(hits) ? hits.map((hit) => cloneEditorHit(hit, defaultElement)) : []
  if (!next[index]) return next
  next[index] = cloneEditorHit({ ...next[index], ...cloneJson(patch) }, defaultElement)
  return normalizeHits(next, defaultElement)
}

export function parseEditorJsonField(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { ok: true, value: undefined }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function getEditorEffectEditableFields(effect) {
  return [...COMMON_EFFECT_FIELDS, ...(EFFECT_KIND_FIELDS[effect?.kind] || [])]
}

export function retypeEditorEffectKind(effect, nextKind) {
  const next = cloneJson(effect) || {}
  ensureEffectId(next)
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
  }
  const defaults = {
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
    consume: { kind: 'consume', ...(Number(next.consumeStacks) ? { consumeStacks: Number(next.consumeStacks) } : {}) },
    oneTime: {
      kind: 'oneTime',
      stat: next.stat || { modifier: 'dmgBonus' },
      value: Number(next.value) || 0,
    },
    cooldownReductionFlat: { kind: 'cooldownReductionFlat', value: Number(next.value) || 0 },
    cooldownReductionPercent: { kind: 'cooldownReductionPercent', value: Number(next.value) || 0 },
  }
  return { ...keep, ...(defaults[nextKind] || defaults.status) }
}

export function createEditorHit({ offset = 0, stagger = 0, spRecovery = 0, spReturn = 0, element = null, effects = [] } = {}) {
  const hit = {
    offset: Number(offset) || 0,
    stagger: Number(stagger) || 0,
    spRecovery: Number(spRecovery) || 0,
    spReturn: Number(spReturn) || 0,
    effects: Array.isArray(effects) ? effects.map((effect) => ensureEffectId(effect)) : [],
  }
  if (element) hit.element = element
  return decorateHitCompat(hit)
}

export function normalizeHits(rawHits = [], defaultElement = null) {
  if (!Array.isArray(rawHits)) return []
  return rawHits
    .filter((hit) => hit && typeof hit === 'object')
    .map((hit) => {
      const next = {
        ...hit,
        offset: Number(hit.offset) || 0,
        stagger: Number(hit.stagger) || 0,
        spRecovery: Number(hit.spRecovery) || 0,
        spReturn: Number(hit.spReturn) || 0,
        durationExtension: Number(hit.durationExtension) || 0,
      }
      if (!next.element && defaultElement) next.element = defaultElement
      next.effects = Array.isArray(hit.effects)
        ? hit.effects.map((effect) => ensureEffectId(effect))
        : []
      return decorateHitCompat(next)
    })
    .sort((a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0))
}

export function legacyActionToHits({
  hits,
  damageTicks,
  physicalAnomaly,
  allowedTypes,
  effectRows,
  element,
} = {}) {
  if (Array.isArray(hits) && hits.length > 0) {
    return normalizeHits(hits, element)
  }

  const normalizedHits = Array.isArray(damageTicks)
    ? damageTicks.map((tick) => createEditorHit({
        offset: tick?.offset,
        stagger: tick?.stagger,
        spRecovery: (tick?.spKind === 'refund') ? 0 : Number(tick?.sp) || 0,
        spReturn: tick?.spKind === 'refund' ? Number(tick?.sp) || 0 : 0,
        element,
      }))
    : []

  const rowsSource = effectRows ?? physicalAnomaly
  const rows = Array.isArray(rowsSource)
    ? (Array.isArray(rowsSource[0]) ? rowsSource : [rowsSource])
    : []

  rows.forEach((row, rowIndex) => {
    const effects = convertLegacyRowToEffects(row)
    if (effects.length === 0) return

    const firstOffset = Number(effects[0]?.offset) || 0
    const boundHitIndex = normalizedHits.findIndex((hit, hitIndex) => {
      if (hitIndex === rowIndex && rowIndex < normalizedHits.length) return true
      return Math.abs((Number(hit.offset) || 0) - firstOffset) < 0.0001
    })

    const targetIndex = boundHitIndex >= 0 ? boundHitIndex : normalizedHits.length
    if (!normalizedHits[targetIndex]) {
      normalizedHits[targetIndex] = createEditorHit({
        offset: firstOffset,
        element,
      })
    }
    normalizedHits[targetIndex].effects.push(...effects)
  })

  if (normalizedHits.length === 0 && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
    normalizedHits.push(createEditorHit({ element }))
  }

  return normalizeHits(normalizedHits, element)
}

function defineAlias(entity, aliasKey, descriptor) {
  if (!entity || typeof entity !== 'object') return
  const current = Object.getOwnPropertyDescriptor(entity, aliasKey)
  if (current?.get || current?.set) return
  Object.defineProperty(entity, aliasKey, {
    enumerable: false,
    configurable: true,
    ...descriptor,
  })
}

export function ensureActionLikeModel(entity, { deleteLegacy = true, aliasStyle = null, defaultElement = null } = {}) {
  if (!entity || typeof entity !== 'object') return entity

  entity.type = toOptimizerActionType(entity.type)
  entity.hits = legacyActionToHits({
    hits: entity.hits,
    damageTicks: entity.damageTicks || entity.damage_ticks,
    physicalAnomaly: entity.physicalAnomaly || entity.anomalies,
    allowedTypes: entity.allowedTypes || entity.allowed_types,
    element: entity.element || defaultElement,
  })

  const allowedList = Array.isArray(entity.allowedEffectTypes)
    ? entity.allowedEffectTypes
    : (entity.allowedTypes || entity.allowed_types || inferAllowedEffectTypesFromHits(entity.hits))
  entity.allowedEffectTypes = Array.isArray(allowedList) ? [...allowedList] : []

  if (deleteLegacy) {
    delete entity.damageTicks
    delete entity.damage_ticks
    delete entity.physicalAnomaly
    delete entity.anomalies
    delete entity.allowedTypes
    delete entity.allowed_types
  }

  if (aliasStyle === 'camel' || aliasStyle === 'both') {
    defineAlias(entity, 'damageTicks', {
      get() { return this.hits },
      set(value) { this.hits = normalizeHits(value, this.element || defaultElement) },
    })
    defineAlias(entity, 'physicalAnomaly', {
      get() { return getHitEffectRows(this.hits) },
      set(value) { this.hits = setHitEffectRows(this.hits, value) },
    })
    defineAlias(entity, 'allowedTypes', {
      get() { return this.allowedEffectTypes },
      set(value) { this.allowedEffectTypes = Array.isArray(value) ? value : [] },
    })
  }

  if (aliasStyle === 'snake' || aliasStyle === 'both') {
    defineAlias(entity, 'damage_ticks', {
      get() { return this.hits },
      set(value) { this.hits = normalizeHits(value, this.element || defaultElement) },
    })
    defineAlias(entity, 'anomalies', {
      get() { return getHitEffectRows(this.hits) },
      set(value) { this.hits = setHitEffectRows(this.hits, value) },
    })
    defineAlias(entity, 'allowed_types', {
      get() { return this.allowedEffectTypes },
      set(value) { this.allowedEffectTypes = Array.isArray(value) ? value : [] },
    })
  }

  return entity
}
