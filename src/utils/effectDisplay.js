function addCandidate(out, seen, value) {
  const key = String(value || '').trim()
  if (!key || seen.has(key)) return
  seen.add(key)
  out.push(key)
}

export function toCanonicalUiKey(value) {
  const key = String(value || '').trim()
  return key || null
}

export function resolveEffectDisplayKey(effectOrKey) {
  if (!effectOrKey) return 'default'
  if (typeof effectOrKey === 'string') return toCanonicalUiKey(effectOrKey) || 'default'

  const effect = effectOrKey
  if (effect.displayType) return toCanonicalUiKey(effect.displayType) || 'default'

  switch (effect.kind) {
    case 'physicalStatus':
      return toCanonicalUiKey(effect.physicalType) || 'default'
    case 'infliction':
      return toCanonicalUiKey(effect.element ? `${effect.element}_infliction` : null) || 'default'
    case 'burst':
      return toCanonicalUiKey(effect.element ? `${effect.element}_burst` : null) || 'default'
    case 'reaction':
      return toCanonicalUiKey(effect.reactionType) || 'default'
    case 'status':
      return toCanonicalUiKey(effect.id || effect.name || effect.type || effect.kind) || 'default'
    default:
      return toCanonicalUiKey(effect.type || effect.id || effect.name || effect.kind) || 'default'
  }
}

export function getDisplayKeyCandidates(effectOrKey) {
  const out = []
  const seen = new Set()
  addCandidate(out, seen, resolveEffectDisplayKey(effectOrKey) || 'default')

  if (typeof effectOrKey === 'string') {
    addCandidate(out, seen, effectOrKey)
    return out
  }

  const effect = effectOrKey || {}
  ;[
    effect.displayType,
    effect.physicalType,
    effect.reactionType,
    effect.type,
    effect.id,
    effect.name,
    effect.kind,
    effect.element ? `${effect.element}_infliction` : null,
    effect.element ? `${effect.element}_burst` : null,
  ].forEach((value) => addCandidate(out, seen, value))

  return out
}
