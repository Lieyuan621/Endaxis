/** Editor evidence for the independent board created by createGlobalBuff. No values
 * are evaluated here: creation overrides are numeric destination declarations. */
import {
  blackboardValueType,
  unknownBlackboardContext,
  type BlackboardFieldContext,
} from './blackboardFieldContext';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function isGlobalBuffDefinitionPath(
  kind: string | undefined,
  path: readonly (string | number)[],
): boolean {
  return kind === 'createGlobalBuff' && path[0] === 'parameters' && path[1] === 'definition';
}
export function globalBuffBoardEvidence(definition: unknown, overrides: unknown) {
  if (
    !record(definition) ||
    !record(definition.blackboard) ||
    (overrides !== undefined && !record(overrides))
  )
    return;
  const overrideKeys = Object.keys(overrides ?? {});
  const initial = Object.fromEntries(
    Object.entries(definition.blackboard).filter(([key]) => !overrideKeys.includes(key)),
  );
  return { initial, overrideKeys };
}
export function globalBuffBlackboardContext(
  enclosing: BlackboardFieldContext | undefined,
  definition: unknown,
  overrides: unknown,
): BlackboardFieldContext {
  const parameters = enclosing?.parameters ?? [];
  const evidence = globalBuffBoardEvidence(definition, overrides);
  if (!evidence) return { ...unknownBlackboardContext('globalBuffLocal'), parameters };
  const scope = 'globalBuff';
  return {
    status: 'known',
    closed: true,
    scopes: [{ id: scope, label: 'GlobalBuff' }],
    parameters,
    diagnostic: 'globalBuffLocal',
    candidates: [
      ...Object.entries(evidence.initial).map(([key, value]) => ({
        key,
        valueType: value === null ? ('null' as const) : blackboardValueType(value),
        readable: true,
        writable: true,
        scope,
        source: 'definition.blackboard',
      })),
      ...evidence.overrideKeys.map(key => ({
        key,
        valueType: 'number' as const,
        readable: true,
        writable: true,
        scope,
        source: 'blackboardAssignments',
      })),
    ],
  };
}

export interface GlobalBuffDraftContext {
  readonly definition: unknown;
  readonly overrides: unknown;
}
export function globalBuffDraftContext(action: unknown): GlobalBuffDraftContext | undefined {
  if (!record(action) || action.kind !== 'createGlobalBuff' || !record(action.parameters)) return;
  return {
    definition: action.parameters.definition,
    overrides: action.parameters.blackboardAssignments,
  };
}
