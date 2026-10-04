import { expect, it } from 'vitest';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import {
  assertEditableValue,
  assertEditableDefinitionField,
  fieldSchemaForValue,
  preserveDefinitionExtensions,
} from '../definition-editor/definitionFieldRuntime';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { supportsStructuredValue } from './structuredValueSchema';
import { validateStructuredValue } from './structuredValue';
import { referenceCatalog } from './referenceTestFixtures';
import { validReferenceDraft } from './referenceDraftValidation';

const query = actionNodeSchemas.storeSourceAttributeValue.fields.find(
  field => field.path.at(-1) === 'attribute',
)!.valueSchema!;
it('edits a legitimate query key, keeps unknown extensions, and refuses ambiguous or cross-branch values', () => {
  const extension = { imported: 'keep' };
  const before = { kind: 'specific', key: 'attack', extension };
  expect(fieldSchemaForValue(query, before).kind).toBe('object');
  expect(() => validateStructuredValue(query, before, { ...before, key: 'health' })).not.toThrow();
  expect(() =>
    assertEditableDefinitionField(
      { kind: 'object', fields: { key: { kind: 'string' } } },
      { key: 'asset' },
      ['key'],
      'other',
    ),
  ).toThrow(/identity/);
  expect(() => validateStructuredValue(query, before, { kind: 'specific', key: 'health' })).toThrow(
    /preserved/,
  );
  const switched = preserveDefinitionExtensions(query, before, { kind: 'main' });
  expect(switched).toEqual({ kind: 'main', extension });
  expect(() => validateStructuredValue(query, before, switched)).not.toThrow();
  expect(fieldSchemaForValue(query, { kind: 'main', key: 'attack' }).kind).toBe('opaque');
  const ambiguous: DefinitionFieldSchema = {
    kind: 'union',
    variants: [
      { kind: 'object', fields: { x: { kind: 'number', optional: true } } },
      { kind: 'object', fields: { y: { kind: 'number', optional: true } } },
    ],
  };
  expect(fieldSchemaForValue(ambiguous, {}).kind).toBe('opaque');
  expect(() => validateStructuredValue(ambiguous, {}, { x: 1 })).toThrow(/ambiguous/);
});
it('preserves protected graph occurrence counts, intra-row paths, and optional boundaries', () => {
  const graphA = { nodes: {} },
    graphB = { nodes: {} };
  const row: DefinitionFieldSchema = {
    kind: 'object',
    fields: { label: { kind: 'string' }, graph: { kind: 'graph' } },
  };
  const array: DefinitionFieldSchema = { kind: 'array', element: row };
  const first = { label: 'a', graph: graphA },
    second = { label: 'b', graph: graphB };
  expect(() => assertEditableValue(array, [first, second], [second], 'value')).toThrow(
    /cannot be changed/,
  );
  expect(() =>
    assertEditableValue(array, [first, second], [{ ...second, label: 'changed' }, first], 'value'),
  ).not.toThrow();
  expect(() => assertEditableValue(array, [first], [first, first], 'value')).toThrow(
    /cannot be changed/,
  );
  const pair: DefinitionFieldSchema = {
    kind: 'array',
    element: { kind: 'object', fields: { left: { kind: 'graph' }, right: { kind: 'graph' } } },
  };
  expect(() =>
    assertEditableValue(
      pair,
      [{ left: graphA, right: graphB }],
      [{ left: graphB, right: graphA }],
      'value',
    ),
  ).toThrow(/cannot be changed/);
  const optional: DefinitionFieldSchema = { ...row, optional: true };
  expect(() => assertEditableValue(optional, first, undefined, 'value')).toThrow(
    /cannot be changed/,
  );
  const extension: DefinitionFieldSchema = {
    kind: 'object',
    optional: true,
    fields: { label: { kind: 'string' } },
  };
  for (const hidden of [
    { actionGraph: graphA },
    { $sequence: 'next' },
    { kind: 'valueNode', nodeId: 'read' },
    { kind: 'stringNode', nodeId: 'read' },
  ])
    expect(() =>
      assertEditableValue(extension, { label: 'a', extension: hidden }, undefined, 'value'),
    ).toThrow(/cannot be changed/);
  const tuple: DefinitionFieldSchema = {
    kind: 'tuple',
    minLength: 1,
    elements: [{ kind: 'number' }, { kind: 'graph', optional: true }],
  };
  expect(() => assertEditableValue(tuple, [1, graphA], [1], 'value')).toThrow(/cannot be changed/);
  expect(supportsStructuredValue(array)).toBe(false);
});
it('validates exact tuple slots and boolean literals without promoting array or boolean forms', () => {
  const tuple: DefinitionFieldSchema = {
    kind: 'tuple',
    minLength: 2,
    elements: [{ kind: 'string' }, { kind: 'number' }],
  };
  expect(() => validateStructuredValue(tuple, ['key', 1], ['key', 2])).not.toThrow();
  for (const next of [['key'], [1, 'key'], ['key', 1, 2]])
    expect(() => validateStructuredValue(tuple, ['key', 1], next)).toThrow();
  expect(() =>
    validateStructuredValue({ kind: 'enum', options: [true] }, undefined, false),
  ).toThrow(/choice/);
});
it('preserves stale reference occurrences once, rechecks added references, and enforces the current owner catalog', () => {
  const schema: DefinitionFieldSchema = {
    kind: 'array',
    element: {
      kind: 'object',
      fields: {
        buffId: { kind: 'string', referenceKind: 'buff' },
      },
    },
  };
  const row = { buffId: 'stale' };
  const choices = { buff: referenceCatalog() };
  expect(validReferenceDraft(schema, [row], choices, undefined, undefined, [row])).toBe(true);
  expect(validReferenceDraft(schema, [row, row], choices, undefined, undefined, [row])).toBe(false);
  expect(
    validReferenceDraft(schema, [{ ...row }, { ...row }], choices, undefined, undefined, [row]),
  ).toBe(false);
  expect(
    validReferenceDraft(schema, [row, { buffId: 'known' }], choices, undefined, undefined, [row]),
  ).toBe(true);
  const entity = actionNodeSchemas.setIgnoreGlobalTimeScale.fields.find(
    field => field.path.at(-1) === 'abilityEntityTargets',
  )!.valueSchema!;
  expect(() =>
    validateStructuredValue(entity, [], [{ kind: 'ownerSpawned', abilityEntityIds: ['known'] }], {
      choices: { abilityEntity: referenceCatalog('abilityEntity') },
    }),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(entity, [], [{ kind: 'ownerSpawned', abilityEntityIds: ['known'] }], {
      choices: { abilityEntity: referenceCatalog('abilityEntity', []) },
    }),
  ).toThrow(/fieldReference/);
  expect(() =>
    validateStructuredValue(entity, [], [{ kind: 'context', contextKey: 'targets' }]),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(entity, [], [{ kind: 'current', contextKey: 'wrong-branch' }]),
  ).toThrow();
});

it('required slots disambiguate structural unions without accepting an object invalid in every branch', () => {
  const schema: DefinitionFieldSchema = {
    kind: 'union',
    variants: [
      { kind: 'object', fields: { x: { kind: 'number' }, y: { kind: 'number', optional: true } } },
      { kind: 'object', fields: { x: { kind: 'number', optional: true }, y: { kind: 'number' } } },
    ],
  };
  expect(() => validateStructuredValue(schema, undefined, {})).toThrow();
  expect(() => validateStructuredValue(schema, undefined, { x: 1 })).not.toThrow();
  expect(() => validateStructuredValue(schema, undefined, { y: 2 })).not.toThrow();
  expect(fieldSchemaForValue(schema, { x: 1, y: 2 }).kind).toBe('opaque');
});
