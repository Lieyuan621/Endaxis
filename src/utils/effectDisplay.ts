interface StatLike {
  modifier?: string | null;
  elements?: string | string[] | null;
  skillTypes?: string | string[] | null;
}

interface EffectLike {
  kind?: string;
  displayType?: string | null;
  physicalType?: string | null;
  element?: string | null;
  reactionType?: string | null;
  stat?: StatLike | null;
  id?: string | null;
  name?: string | null;
  type?: string | null;
  [key: string]: unknown;
}

type EffectOrKey = string | EffectLike | null | undefined;

function addCandidate(out: string[], seen: Set<string>, value: unknown): void {
  const key = String(value || '').trim();
  if (!key || seen.has(key)) return;
  seen.add(key);
  out.push(key);
}

function addRuntimeProjectionCandidates(out: string[], seen: Set<string>, value: unknown): void {
  const key = toCanonicalUiKey(value);
  if (!key) return;
  if (key.startsWith('state:')) {
    const body = key.slice('state:'.length);
    const idSeparator = body.lastIndexOf(':');
    if (idSeparator > 0) {
      addCandidate(out, seen, body.slice(0, idSeparator));
      addCandidate(out, seen, body.slice(idSeparator + 1));
      return;
    }
    addCandidate(out, seen, body);
    return;
  }
  if (key.startsWith('stat:')) {
    const body = key.slice('stat:'.length);
    const idSeparator = body.lastIndexOf(':');
    if (idSeparator > 0) {
      addCandidate(out, seen, body.slice(0, idSeparator));
      addCandidate(out, seen, body.slice(idSeparator + 1));
      return;
    }
    addCandidate(out, seen, body);
  }
}

const ARTS_ELEMENTS = new Set(['heat', 'cryo', 'electric', 'nature']);

function resolveElementScope(elements: string | string[] | null | undefined): string | null {
  if (!elements) return null;
  const arr = Array.isArray(elements) ? elements : [elements];
  if (arr.length === 0) return null;
  if (arr.length > 1 && arr.every(element => ARTS_ELEMENTS.has(element))) return 'arts';
  return arr[0] || null;
}

function resolveStatDisplayKey(stat: StatLike | null | undefined): string | null {
  if (!stat?.modifier) return null;
  if (stat.elements) {
    const elementScope = resolveElementScope(stat.elements);
    if (elementScope) return `${stat.modifier}:${elementScope}`;
  }
  if (stat.skillTypes) {
    const skillTypes = stat.skillTypes;
    if (typeof skillTypes === 'string') return `${stat.modifier}:${skillTypes}`;
    if (Array.isArray(skillTypes) && skillTypes.length === 1)
      return `${stat.modifier}:${skillTypes[0]}`;
  }
  return stat.modifier;
}

function toCanonicalUiKey(value: unknown): string | null {
  const key = String(value || '').trim();
  return key || null;
}

export function resolveEffectDisplayKey(effectOrKey: EffectOrKey): string {
  if (!effectOrKey) return 'default';
  if (typeof effectOrKey === 'string') return toCanonicalUiKey(effectOrKey) || 'default';

  const effect = effectOrKey;
  const runtimeId = toCanonicalUiKey(effect.id);
  const displayType = toCanonicalUiKey(effect.displayType);
  const statKey = effect.kind === 'status' ? resolveStatDisplayKey(effect.stat) : null;
  const nameKey = toCanonicalUiKey(effect.name);

  // Prefer an explicit displayType, but ignore stale auto-stamps:
  // - copies of the runtime id
  // - copies of the derived stat key when a branded `name` exists (e.g. focus vs susceptibility:arts)
  if (displayType && displayType !== runtimeId) {
    const isAutoStatStamp = !!(nameKey && statKey && displayType === statKey);
    if (!isAutoStatStamp) return displayType;
  }

  switch (effect.kind) {
    case 'physicalStatus':
      return toCanonicalUiKey(effect.physicalType) || 'default';
    case 'infliction':
      return toCanonicalUiKey(effect.element ? `${effect.element}_infliction` : null) || 'default';
    case 'burst':
      return toCanonicalUiKey(effect.element ? `${effect.element}_burst` : null) || 'default';
    case 'reaction':
      return toCanonicalUiKey(effect.reactionType) || 'default';
    case 'status':
      // Branded statuses (focus, whirlpools, …) prefer `name` over mechanical stat keys.
      return toCanonicalUiKey(nameKey || statKey || effect.type || effect.kind) || 'default';
    default:
      // Prefer locale-friendly name/kind over runtime ids (e.g. tangtang-waterspouts-sp-return).
      return toCanonicalUiKey(effect.name || effect.type || effect.kind || effect.id) || 'default';
  }
}

export function getDisplayKeyCandidates(effectOrKey: EffectOrKey): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  addCandidate(out, seen, resolveEffectDisplayKey(effectOrKey) || 'default');

  if (typeof effectOrKey === 'string') {
    addCandidate(out, seen, effectOrKey);
    addRuntimeProjectionCandidates(out, seen, effectOrKey);
    return out;
  }

  const effect: EffectLike = effectOrKey || {};
  [
    effect.displayType,
    resolveStatDisplayKey(effect.stat),
    effect.physicalType,
    effect.reactionType,
    effect.type,
    effect.id,
    effect.name,
    effect.kind,
    effect.element ? `${effect.element}_infliction` : null,
    effect.element ? `${effect.element}_burst` : null,
  ].forEach(value => addCandidate(out, seen, value));

  return out;
}
