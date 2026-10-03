import { canSelectReference, type ReferenceChoices } from '@/application/editor/referenceResolver';
import {
  resolveBlackboardKey,
  unknownBlackboardContext,
  type BlackboardFieldContext,
} from '@/application/editor/blackboardFieldContext';

/** Graph connections are edited by their owning graph, never by the inline field. */
export function isStringNodeReference(value: unknown): boolean {
  return !!value && typeof value === 'object' && 'kind' in value && value.kind === 'stringNode';
}

/** Validate only the two inline branches; graph sources require the graph connection controls. */
export function validStringOperandDraft(
  value: unknown,
  family?: string,
  choices?: ReferenceChoices,
  context: BlackboardFieldContext = unknownBlackboardContext(),
): boolean {
  if (isStringNodeReference(value)) return false;
  if (typeof value === 'string')
    return value.length > 0 && (!family || canSelectReference(family, value, choices?.[family]));
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('blackboardKey' in value) ||
    typeof value.blackboardKey !== 'string' ||
    !value.blackboardKey.length
  )
    return false;
  const resolution = resolveBlackboardKey(context, value.blackboardKey, {
    mode: 'read',
    valueType: 'string',
  });
  // Runtime-provided values remain expressible, but known incompatible or invisible keys do not.
  return resolution.valid;
}
