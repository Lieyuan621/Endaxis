import { validMappingValue, validMappingSources } from './blackboardMapping';
import { schemaHasAlias } from '../../core/editor/inlineCombatCondition';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';
import { timeScaleCurveDefinitions } from '../../data/combat/timeDilationConfig';
import { assertTimeScaleCurveSelection, type TimeScaleCurveCatalog } from './timeScaleCurveValue';
import { stringCollectionDescriptor } from './stringCollectionSchema';
import { validCollectionEntry, validStringCollection } from './stringCollection';
import { canSelectReference, type ReferenceChoices } from '@/application/editor/referenceResolver';
import { fieldSchemaForValue } from '../definition-editor/definitionFieldRuntime';
import {
  assertFiniteFieldValue,
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../core/editor/resolveDefinitionSchema';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema';
import { validStringOperandDraft } from './stringOperandDraft';
import type { BlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
import { resolveFieldEditor } from './fieldEditorDispatch';

/** Submit-time validation for new values; catalogs can change while a draft is open. */
function checkReferenceDraft(
  schema: DefinitionFieldSchema,
  value: unknown,
  choices: ReferenceChoices | undefined,
  referenceKind?: string,
  name?: string,
  previous?: unknown,
  blackboard?: BlackboardFieldContext,
  curveCatalog: TimeScaleCurveCatalog = timeScaleCurveDefinitions,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): boolean {
  schema = resolveDefinitionSchema(schema, references);
  if (stringCollectionDescriptor(schema, name, referenceKind)?.kind === 'nativeId')
    return validStringCollection(value, previous, 'nativeId');
  if (Object.is(value, previous) && value !== undefined) return true;
  if (value === undefined && schema.optional) return true;
  if (schema.kind === 'timeScaleCurve') {
    try {
      assertTimeScaleCurveSelection(previous, value, curveCatalog);
      return true;
    } catch {
      return false;
    }
  }
  const editor = resolveFieldEditor(schema, { referenceKind, name, references });
  if (editor.control === 'inlineOperand') {
    const mode = schemaHasAlias(schema, 'LevelValues') ? 'levelsOrOperand' : 'operand';
    return (
      validMappingValue(value, mode) &&
      validMappingSources(
        [{ key: 'value', value }],
        undefined,
        mode,
        blackboard ?? unknownBlackboardContext(),
        false,
      )
    );
  }
  const family = editor.referenceKind;
  const collection = stringCollectionDescriptor(schema, name, family);
  if (collection) return validStringCollection(value, previous, collection.kind, family, choices);
  if (editor.control === 'gameplayTag') return validCollectionEntry(value, 'gameplayTag');
  const shape = fieldSchemaForValue(schema, value, name, references);
  if (editor.control === 'stringOperand')
    return validStringOperandDraft(value, family, choices, blackboard);
  if (schema.kind === 'union')
    return checkReferenceDraft(
      shape,
      value,
      choices,
      family,
      name,
      previous,
      blackboard,
      curveCatalog,
      references,
    );
  if (shape.kind === 'graph') return true;
  if (editor.control === 'reference')
    return (
      typeof value === 'string' && canSelectReference(family ?? '', value, choices?.[family ?? ''])
    );
  if (schema.kind === 'array' && Array.isArray(value)) {
    const before = Array.isArray(previous) ? previous : [];
    const used = new Set<number>();
    return value.every((item, index) => {
      let original = before.findIndex((entry, i) => !used.has(i) && Object.is(entry, item));
      if (original < 0 && index < before.length && !used.has(index)) original = index;
      if (original >= 0) used.add(original);
      return checkReferenceDraft(
        schema.element,
        item,
        choices,
        family,
        undefined,
        original >= 0 ? before[original] : undefined,
        blackboard,
        curveCatalog,
        references,
      );
    });
  }
  if (schema.kind === 'tuple' && Array.isArray(value))
    return value.every((item, index) =>
      checkReferenceDraft(
        schema.elements[index]!,
        item,
        choices,
        undefined,
        undefined,
        Array.isArray(previous) ? previous[index] : undefined,
        blackboard,
        curveCatalog,
        references,
      ),
    );
  if (schema.kind === 'record' && value && typeof value === 'object')
    return Object.entries(value).every(([key, item]) =>
      checkReferenceDraft(
        schema.value,
        item,
        choices,
        family,
        undefined,
        previous && typeof previous === 'object'
          ? (previous as Record<string, unknown>)[key]
          : undefined,
        blackboard,
        curveCatalog,
        references,
      ),
    );
  if (schema.kind === 'object' && value && typeof value === 'object')
    return Object.entries(schema.fields).every(([key, child]) =>
      checkReferenceDraft(
        child,
        (value as Record<string, unknown>)[key],
        choices,
        undefined,
        key,
        previous && typeof previous === 'object'
          ? (previous as Record<string, unknown>)[key]
          : undefined,
        blackboard,
        curveCatalog,
        references,
      ),
    );
  return true;
}

export function validReferenceDraft(
  schema: DefinitionFieldSchema,
  value: unknown,
  choices: ReferenceChoices | undefined,
  referenceKind?: string,
  name?: string,
  previous?: unknown,
  blackboard?: BlackboardFieldContext,
  curveCatalog: TimeScaleCurveCatalog = timeScaleCurveDefinitions,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): boolean {
  try {
    assertFiniteFieldValue(value);
    assertFiniteFieldValue(previous);
    return checkReferenceDraft(
      schema,
      value,
      choices,
      referenceKind,
      name,
      previous,
      blackboard,
      curveCatalog,
      references,
    );
  } catch {
    return false;
  }
}
