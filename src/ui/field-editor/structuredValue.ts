import { spawnDefinitionBlackboardContext } from '../../application/editor/spawnDefinitionFieldContext';
import { spawnDefinitionResources, assertSpawnResourceIdentity } from './spawnDefinitionSchema';
import {
  graphSequenceBoundaries,
  type GraphContainerBoundaries,
} from './graphSequenceContainerSchema';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { createGraphDataResolver } from '../../core/action-graph/actionGraphData';
import {
  globalBuffBlackboardContext,
  isGlobalBuffDefinitionPath,
  type GlobalBuffDraftContext,
} from '../../application/editor/globalBuffFieldContext';
import { graphOperandSchemas, isSkillSettingValuesSchema } from './graphOperandContainerSchema';
import { validMappingValue, validMappingSources } from './blackboardMapping';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';
import {
  assertEditableValue,
  fieldValueAt,
  fieldSchemaForValue,
} from '../definition-editor/definitionFieldRuntime';
import {
  assertFiniteFieldValue,
  EMPTY_SCHEMA_REFERENCES,
  resolveDefinitionSchema,
} from '../../core/editor/resolveDefinitionSchema';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import { validReferenceDraft } from './referenceDraftValidation';
import {
  blackboardContextForField,
  skillSettingItemBlackboardContext,
  blackboardRequestForField,
  resolveBlackboardKey,
  type BlackboardFieldContext,
} from '../../application/editor/blackboardFieldContext';

/** Typed comparison keeps Infinity, undefined and object structure out of JSON serialization. */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    !a ||
    !b ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      key =>
        Object.hasOwn(b, key) &&
        sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

export function sameStructuredValue(a: unknown, b: unknown): boolean {
  assertFiniteFieldValue(a);
  assertFiniteFieldValue(b);
  return sameValue(a, b);
}

/** Validate the complete proposal again against the current catalog and blackboard context. */
export function validateStructuredValue(
  schema: DefinitionFieldSchema,
  previous: unknown,
  next: unknown,
  options: {
    actionValue?: unknown;
    choices?: ReferenceChoices;
    blackboard?: BlackboardFieldContext;
    items?: unknown;
    globalBuff?: GlobalBuffDraftContext;
    graph?: ActionGraphDefinition;
    kind?: string;
    path?: readonly (string | number)[];
    graphOperands?: ReadonlySet<DefinitionFieldSchema>;
    graphBoundaries?: GraphContainerBoundaries;
  } = {},
): void {
  const references = schema.references ?? EMPTY_SCHEMA_REFERENCES;
  const graphOperands =
    options.graphOperands ?? graphOperandSchemas(schema, options.kind, options.path, references);
  const graphBoundaries =
    options.graphBoundaries ??
    graphSequenceBoundaries(schema, options.kind, options.path, references);
  if (spawnDefinitionResources(schema, options.kind, options.path))
    assertSpawnResourceIdentity(previous, next);
  assertEditableValue(schema, previous, next, 'value', references, graphOperands, graphBoundaries);
  if (
    !validReferenceDraft(
      schema,
      next,
      options.choices,
      undefined,
      options.path?.at(-1)?.toString(),
      previous,
      options.blackboard,
      undefined,
      references,
    )
  )
    throw new Error('fieldReference.invalid');
  function check(
    declared: DefinitionFieldSchema,
    value: unknown,
    path: readonly (string | number)[],
  ) {
    declared = resolveDefinitionSchema(declared, references);
    const context = isGlobalBuffDefinitionPath(options.kind, path)
      ? globalBuffBlackboardContext(
          options.blackboard,
          options.globalBuff?.definition,
          options.globalBuff?.overrides,
        )
      : options.kind === 'spawnAbilityEntity' && options.actionValue !== undefined
        ? spawnDefinitionBlackboardContext(options.blackboard, options.actionValue)
        : options.blackboard;
    if (value === undefined && declared.optional) return;
    if (graphBoundaries?.sequences.has(declared)) {
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !('$sequence' in value) ||
        !(
          value.$sequence === null ||
          (typeof value.$sequence === 'string' && options.graph?.nodes[value.$sequence])
        )
      )
        throw new Error('graphSequenceField.invalid');
      return;
    }
    if (graphBoundaries?.conditions.has(declared)) return;
    if (
      isSkillSettingValuesSchema(declared) &&
      (!Array.isArray(value) ||
        value.length !== 4 ||
        !value.every(entry => typeof entry === 'number' && Number.isFinite(entry)))
    )
      throw new Error('skillSettingValues.invalid');
    if (graphOperands?.has(declared)) {
      let source = value;
      if (
        isGlobalBuffDefinitionPath(options.kind, path) &&
        value &&
        typeof value === 'object' &&
        'kind' in value &&
        value.kind === 'valueNode'
      ) {
        if (!options.graph) throw new Error('globalBuffField.graphRequired');
        assertFiniteFieldValue(options.graph);
        source = createGraphDataResolver(options.graph).bind(value);
        assertFiniteFieldValue(source);
      }
      if (
        !validMappingValue(source, 'operand') ||
        !validMappingSources(
          [{ key: 'value', value: source }],
          undefined,
          'operand',
          skillSettingItemBlackboardContext(
            context ?? unknownBlackboardContext(),
            options.kind,
            path,
            options.items ?? (options.path?.join('.') === 'parameters.items' ? next : undefined),
          ),
        )
      )
        throw new Error('actionGraphEditor.invalid');
      return;
    }
    let request = blackboardRequestForField(options.kind, path, declared.source);
    if (request && options.kind === 'spawnAbilityEntity') {
      const parent = fieldValueAt(next, path.slice(options.path?.length ?? 0, -1));
      request = {
        ...request,
        fallback:
          parent &&
          typeof parent === 'object' &&
          'fallback' in parent &&
          typeof parent.fallback === 'number'
            ? parent.fallback
            : undefined,
      };
    }
    if (
      request &&
      (typeof value !== 'string' ||
        !resolveBlackboardKey(
          blackboardContextForField(context, options.kind, path),
          value,
          request,
        ).valid)
    )
      throw new Error('actionGraphEditor.invalid');
    const shape = fieldSchemaForValue(declared, value, undefined, references);
    if (shape.kind === 'object' && value && typeof value === 'object')
      for (const [key, child] of Object.entries(shape.fields))
        check(child, (value as Record<string, unknown>)[key], [...path, key]);
    if (shape.kind === 'array' && Array.isArray(value))
      value.forEach((entry, index) => check(shape.element, entry, [...path, index]));
    if (shape.kind === 'tuple' && Array.isArray(value))
      value.forEach((entry, index) => check(shape.elements[index]!, entry, [...path, index]));
    if (shape.kind === 'record' && value && typeof value === 'object')
      for (const [key, entry] of Object.entries(value)) check(shape.value, entry, [...path, key]);
  }
  check(schema, next, options.path ?? []);
}
