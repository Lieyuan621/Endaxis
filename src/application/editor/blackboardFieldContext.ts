/** Static evidence for blackboard fields. A known graph scope is not a closed runtime key set. */
import type { analyzeGraphBlackboard, BlackboardVariable } from './graphBlackboard';

export type BlackboardValueType = 'number' | 'string' | 'null' | 'unknown' | 'mixed';
export interface BlackboardKeyCandidate {
  readonly key: string;
  readonly valueType: BlackboardValueType;
  /** Proven type in every direct snapshot layer, excluding shared entity values. */
  readonly snapshotValueType?: BlackboardValueType;
  readonly readable: boolean;
  readonly writable: boolean;
  readonly scope: string;
  readonly source: string;
  readonly target?: { readonly owner: 'action' | 'data'; readonly id: string };
}
export interface BlackboardFieldContext {
  readonly status: 'known' | 'unknown' | 'multiple';
  /** This board has no external or inherited key source (GlobalBuff creation or non-inherited spawn assignments). */
  readonly closed?: true;
  readonly scopes: readonly { readonly id: string; readonly label: string }[];
  readonly candidates: readonly BlackboardKeyCandidate[];
  readonly parameters: readonly BlackboardKeyCandidate[];
  readonly diagnostic?: string;
}
export interface BlackboardKeyRequest {
  readonly mode: 'read' | 'write' | 'parameter';
  readonly valueType: 'number' | 'string' | 'any';
  /** Only explicit numeric read fallbacks may tolerate missing/non-numeric source values. */
  readonly fallback?: number;
}
export type BlackboardKeyState =
  | 'unset'
  | 'valid'
  | 'fallback'
  | 'external'
  | 'contextUnknown'
  | 'outOfScope'
  | 'typeMismatch'
  | 'readOnly'
  | 'missingParameter';
export function unknownBlackboardContext(diagnostic = 'contextUnknown'): BlackboardFieldContext {
  return { status: 'unknown', scopes: [], candidates: [], parameters: [], diagnostic };
}
export function blackboardValueType(value: unknown): BlackboardValueType {
  if (typeof value === 'string') return 'string';
  if (
    typeof value === 'number' ||
    (Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'number'))
  )
    return 'number';
  return 'unknown';
}
function mergeType(a: BlackboardValueType, b: BlackboardValueType): BlackboardValueType {
  if (a === 'unknown') return b;
  if (b === 'unknown') return a;
  return a === b ? a : 'mixed';
}
function variableType(variable: BlackboardVariable, closed = false): BlackboardValueType {
  const initial =
    variable.assignedType ??
    (closed && variable.initial === null ? 'null' : blackboardValueType(variable.initial));
  return variable.writes.length ? mergeType(initial, 'number') : initial;
}

/** Resolve each call site separately, then offer only keys accessible in every known site. */
export function createBlackboardFieldContext(
  analysis: ReturnType<typeof analyzeGraphBlackboard>,
  environments: ReadonlySet<string> | undefined,
): BlackboardFieldContext {
  const scopes = [...(environments ?? [])].flatMap(id => {
    const scope = analysis.scopes.get(id);
    return scope ? [{ id, label: scope.label }] : [];
  });
  const parameters = analysis.variables
    .filter(variable => variable.layer === 'parameter' && variable.scope === 'current')
    .map(variable => ({
      key: variable.key,
      valueType: 'number' as const,
      readable: true,
      writable: false,
      scope: 'parameter',
      source: analysis.scopes.get('current')?.label ?? 'parameter',
    }));
  if (!scopes.length) return { ...unknownBlackboardContext(), parameters };
  type Evidence = { type: BlackboardValueType; variables: BlackboardVariable[] };
  function layer(scopeId: string, kind: 'direct' | 'entity'): Map<string, Evidence> {
    const scope = analysis.scopes.get(scopeId)!;
    const own = analysis.variables.filter(
      variable =>
        variable.scope === scopeId &&
        variable.layer === kind &&
        (variable.initial !== undefined ||
          variable.assignedType !== undefined ||
          variable.writes.length),
    );
    const result = new Map<string, Evidence>();
    for (const variable of own)
      result.set(variable.key, {
        type: variableType(variable, analysis.globalBuffScopes.has(scopeId)),
        variables: [variable],
      });
    const inherit = kind === 'direct' ? scope.copiesParent : scope.sharesEntity;
    if (inherit && scope.parent) {
      for (const [key, evidence] of layer(scope.parent, kind)) {
        const local = result.get(key);
        // Runtime copies the parent direct values over child defaults. Child writes may follow.
        const ownWrite = local?.variables.some(variable => variable.writes.length);
        result.set(
          key,
          ownWrite && kind === 'direct'
            ? {
                type: mergeType(evidence.type, 'number'),
                variables: [...evidence.variables, ...local!.variables],
              }
            : evidence,
        );
      }
    }
    return result;
  }
  const directByScope = scopes.map(scope => layer(scope.id, 'direct'));
  const byScope = scopes.map(scope => {
    const values = layer(scope.id, 'entity');
    for (const [key, evidence] of layer(scope.id, 'direct')) values.set(key, evidence);
    return values;
  });
  const isolated = scopes.every(scope => analysis.globalBuffScopes.has(scope.id));
  const keys = new Set(
    isolated
      ? byScope.flatMap(values => [...values.keys()])
      : analysis.variables
          .filter(
            variable =>
              variable.layer !== 'parameter' &&
              (variable.initial !== undefined ||
                variable.assignedType !== undefined ||
                variable.writes.length),
          )
          .map(variable => variable.key),
  );
  const candidates = [...keys].map(key => {
    const evidence = byScope.flatMap(values => (values.has(key) ? [values.get(key)!] : []));
    const readable = evidence.length === scopes.length;
    const variables = evidence.flatMap(item => item.variables);
    const first = variables[0];
    const sourceScopes = [
      ...new Set(
        variables.map(variable => analysis.scopes.get(variable.scope)?.label ?? variable.scope),
      ),
    ];
    const write = variables.find(variable => variable.writes.length);
    return {
      key,
      valueType: evidence.reduce<BlackboardValueType>(
        (type, item) => mergeType(type, item.type),
        'unknown',
      ),
      ...(directByScope.every(values => values.has(key))
        ? {
            snapshotValueType: directByScope.reduce<BlackboardValueType>(
              (type, values) => mergeType(type, values.get(key)!.type),
              'unknown',
            ),
          }
        : {}),
      readable,
      writable: true,
      scope: first?.scope ?? '',
      source: sourceScopes.join(' / '),
      ...(write
        ? { target: { owner: 'action' as const, id: write.writes[0]! } }
        : first && analysis.scopes.get(first.scope)?.nodeId
          ? { target: { owner: 'action' as const, id: analysis.scopes.get(first.scope)!.nodeId! } }
          : {}),
    };
  });
  return {
    status: scopes.length > 1 ? 'multiple' : 'known',
    scopes,
    candidates,
    parameters,
    ...(scopes.some(scope => analysis.globalBuffScopes.has(scope.id))
      ? { closed: true as const }
      : {}),
  };
}

export function resolveBlackboardKey(
  context: BlackboardFieldContext | undefined,
  key: string | undefined,
  request: BlackboardKeyRequest,
) {
  const current = context ?? unknownBlackboardContext();
  const available =
    request.mode === 'parameter'
      ? current.parameters
      : request.mode === 'write'
        ? current.candidates.filter(candidate => candidate.readable)
        : current.candidates;
  const compatible = (candidate: BlackboardKeyCandidate) =>
    request.valueType === 'any' ||
    (candidate.valueType === 'unknown' && !current.closed) ||
    candidate.valueType === request.valueType;
  const hasFallback =
    request.mode === 'read' && request.valueType === 'number' && Number.isFinite(request.fallback);
  const candidates = available.map(candidate => ({
    ...candidate,
    selectable:
      request.mode === 'write'
        ? candidate.writable
        : hasFallback || (candidate.readable && compatible(candidate)),
  }));
  const selected = candidates.find(candidate => candidate.key === key);
  const sourceState: BlackboardKeyState = !key
    ? 'unset'
    : request.mode === 'parameter'
      ? !selected
        ? 'missingParameter'
        : !compatible(selected)
          ? 'typeMismatch'
          : 'valid'
      : current.status === 'unknown'
        ? 'contextUnknown'
        : request.mode === 'write'
          ? // Writing creates/overwrites the current board's target. A same-named macro parameter
            // is a separate namespace, and source visibility/type does not constrain this address.
            selected
            ? selected.writable
              ? 'valid'
              : 'readOnly'
            : 'external'
          : selected
            ? !selected.readable
              ? 'outOfScope'
              : !compatible(selected)
                ? 'typeMismatch'
                : 'valid'
            : current.closed
              ? 'outOfScope'
              : 'external';
  const state: BlackboardKeyState =
    hasFallback && ['typeMismatch', 'outOfScope'].includes(sourceState) ? 'fallback' : sourceState;
  return {
    state,
    candidates,
    selected,
    /** External keys remain legitimate because runtime callers may provide them. */
    valid: ['valid', 'fallback', 'external', 'contextUnknown'].includes(state),
  };
}

/** These fields read another runtime Buff, never the enclosing skill/action blackboard. */
export function blackboardContextForField(
  context: BlackboardFieldContext | undefined,
  actionKind: string | undefined,
  path: readonly (string | number)[],
): BlackboardFieldContext {
  const parts = path.map(String);
  if (
    ((actionKind === 'readBuffBlackboard' || actionKind === 'readEventBuffBlackboard') &&
      parts.at(-1) === 'desiredKey') ||
    (actionKind === 'buffBlackboardValueCompare' && parts.at(-1) === 'desiredKey')
  )
    return unknownBlackboardContext('externalBuff');
  return context ?? unknownBlackboardContext();
}

/** Exact contract slots, never a blanket suffix/name heuristic. */
export function blackboardRequestForField(
  kind: string | undefined,
  path: readonly (string | number)[],
  source?: readonly string[],
): BlackboardKeyRequest | undefined {
  if (
    kind === 'spawnAbilityEntity' &&
    source?.some(item => /^packages\/game-data-contract\/src\/skills\.ts:/.test(item)) &&
    ((path.length === 5 &&
      path[0] === 'parameters' &&
      path[1] === 'definition' &&
      path[2] === 'lifetime' &&
      path[3] === 'durationSeconds' &&
      path[4] === 'blackboardKey') ||
      (path.length === 4 &&
        path[0] === 'parameters' &&
        path[1] === 'definition' &&
        path[2] === 'maxStackingCount' &&
        path[3] === 'blackboardKey'))
  )
    return { mode: 'read', valueType: 'number' };
  if (
    kind === 'createGlobalBuff' &&
    path.join('.') === 'parameters.definition.durationSeconds.blackboardKey' &&
    source?.some(item => /^packages\/game-data-contract\/src\/buffs\.ts:/.test(item))
  )
    return { mode: 'read', valueType: 'number' };
  if (
    source &&
    !source.some(item =>
      /^packages\/game-data-contract\/src\/(actions|conditions|primitives)\.ts:/.test(item),
    )
  )
    return undefined;
  const slot = path.join('.');
  if (
    kind === 'readSkillSettingData' &&
    path.length === 4 &&
    path[0] === 'parameters' &&
    path[1] === 'items' &&
    typeof path[2] === 'number' &&
    Number.isInteger(path[2]) &&
    path[2] >= 0 &&
    path[3] === 'storeKey'
  )
    return { mode: 'write', valueType: 'number' };
  if (kind === 'blackboard' && slot === 'key') return { mode: 'read', valueType: 'number' };
  if (kind === 'parameter' && slot === 'parameter')
    return { mode: 'parameter', valueType: 'number' };
  if (
    ['readBuffBlackboard', 'readEventBuffBlackboard'].includes(kind ?? '') &&
    slot === 'parameters.desiredKey'
  )
    return { mode: 'read', valueType: 'number' };
  if (kind === 'buffBlackboardValueCompare' && slot === 'desiredKey')
    return { mode: 'read', valueType: 'number' };
  const writes: Readonly<Record<string, readonly string[]>> = {
    findOwnerSpawnedAbilityEntities: [
      'parameters.circularOrder.indexBlackboardKey',
      'parameters.saveCountToBlackboardKey',
    ],
    modifyActionValue: ['parameters.key'],
    calculateActionValue: ['parameters.key'],
    readAbilityEntityRemainingDuration: ['parameters.outputKey'],
    storeCurrentTimelineFrame: ['parameters.outputKey'],
    storeShieldValue: ['parameters.outputKey'],
    readBuffStackCount: ['parameters.outputKey'],
    readBuffBlackboard: ['parameters.outputKey'],
    readEventBuffBlackboard: ['parameters.outputKey'],
    readCurrentBuffRemainingDuration: ['parameters.outputKey'],
    readBuffRemainingDuration: ['parameters.outputKey'],
    storeSourceAttributeValue: ['parameters.targetKey'],
    storeEntityPropertyValue: ['parameters.targetKey'],
    storeEventSpGainAmount: ['parameters.outputKey', 'parameters.realDeltaOutputKey'],
    storeEventHealValues: ['parameters.finalHealOutputKey', 'parameters.realHealOutputKey'],
    buffBlackboardValueCompare: ['outputKey'],
  };
  return writes[kind ?? '']?.includes(slot) ? { mode: 'write', valueType: 'number' } : undefined;
}

/** Only an earlier, unconditional constant-column item proves a numeric overwrite.
 * Dynamic/out-of-range/enhanced items do not erase incompatible outer evidence. */
export function skillSettingItemBlackboardContext(
  context: BlackboardFieldContext | undefined,
  kind: string | undefined,
  path: readonly (string | number)[],
  items: unknown,
): BlackboardFieldContext {
  const current = context ?? unknownBlackboardContext();
  if (
    kind !== 'readSkillSettingData' ||
    path[0] !== 'parameters' ||
    path[1] !== 'items' ||
    typeof path[2] !== 'number' ||
    !Number.isInteger(path[2]) ||
    path[2] < 0 ||
    !Array.isArray(items) ||
    path[2] > items.length
  )
    return current;
  const writes = new Map<string, BlackboardKeyCandidate>();
  for (const [index, item] of items.slice(0, path[2]).entries()) {
    if (
      !item ||
      typeof item !== 'object' ||
      !Array.isArray(item.values) ||
      item.values.length !== 4 ||
      !item.values.every((value: unknown) => typeof value === 'number' && Number.isFinite(value)) ||
      item.enhance !== undefined ||
      typeof item.storeKey !== 'string' ||
      !item.storeKey ||
      item.column?.kind !== 'constant' ||
      !Number.isFinite(item.column.value)
    )
      continue;
    const lower = Math.floor(item.column.value);
    const fraction = item.column.value - lower;
    const column =
      fraction < 0.5 ? lower : fraction > 0.5 ? lower + 1 : lower % 2 === 0 ? lower : lower + 1;
    if (column < 1 || column > 4) continue;
    writes.set(item.storeKey, {
      key: item.storeKey,
      valueType: 'number',
      readable: true,
      writable: true,
      scope: current.scopes[0]?.id ?? 'current',
      source: `items[${index}].storeKey`,
    });
  }
  if (!writes.size) return current;
  return {
    ...current,
    candidates: [...current.candidates.filter(value => !writes.has(value.key)), ...writes.values()],
  };
}
