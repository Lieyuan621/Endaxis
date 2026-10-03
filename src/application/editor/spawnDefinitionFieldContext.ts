import {
  unknownBlackboardContext,
  type BlackboardFieldContext,
  type BlackboardKeyCandidate,
} from './blackboardFieldContext';

/** Template numbers read spawn assignments, before the entity board is constructed.
 * Defaults in definition.blackboard are deliberately absent. No expressions are evaluated. */
export function spawnDefinitionBlackboardContext(
  enclosing: BlackboardFieldContext | undefined,
  action: unknown,
): BlackboardFieldContext {
  if (
    !action ||
    typeof action !== 'object' ||
    !('kind' in action) ||
    action.kind !== 'spawnAbilityEntity' ||
    !('parameters' in action) ||
    !action.parameters ||
    typeof action.parameters !== 'object'
  )
    return unknownBlackboardContext('spawnAssignments');
  const p = action.parameters as Record<string, unknown>;
  const inherited =
    p.inheritActionBlackboard === true ? (enclosing ?? unknownBlackboardContext()) : undefined;
  const candidates = new Map<string, BlackboardKeyCandidate>(
    (inherited?.candidates ?? [])
      .filter(value => value.snapshotValueType !== undefined)
      .map(value => [
        value.key,
        { ...value, valueType: value.snapshotValueType!, writable: false },
      ]),
  );
  for (const [slot, valueType] of [
    ['blackboardAssignments', 'number'],
    ['stringBlackboardAssignments', 'string'],
  ] as const) {
    const values = p[slot];
    if (values === undefined) continue;
    if (!values || typeof values !== 'object' || Array.isArray(values))
      return unknownBlackboardContext('spawnAssignments');
    for (const key of Object.keys(values))
      candidates.set(key, {
        key,
        valueType,
        readable: true,
        writable: false,
        scope: 'spawnAssignments',
        source: slot,
      });
  }
  return {
    ...(p.inheritActionBlackboard === true ? {} : { closed: true as const }),
    status: inherited?.status ?? 'known',
    scopes: [{ id: 'spawnAssignments', label: 'Spawn assignments' }],
    candidates: [...candidates.values()],
    parameters: [],
    diagnostic: 'spawnAssignments',
  };
}
