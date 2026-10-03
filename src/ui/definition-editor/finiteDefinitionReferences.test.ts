import { expect, it } from 'vitest';
import type { DefinitionFieldSchema } from './fieldSchema';
import {
  resolveDefinitionSchema,
  assertFiniteFieldValue,
  FIELD_VALUE_VISIT_LIMIT,
} from '../../core/editor/resolveDefinitionSchema';
import { auditDefinitionSchema } from '../../core/editor/auditDefinitionSchema';
import { selectDefinitionSchema } from '../../core/editor/selectDefinitionSchema';
import {
  assertEditableValue,
  assertEditableDefinitionField,
  createDefinitionValueDraft,
  editableDefault,
  fieldSchemaForValue,
  isCompleteDefinitionValue,
} from './definitionFieldRuntime';
import { sameStructuredValue, validateStructuredValue } from '../field-editor/structuredValue';
import { validReferenceDraft } from '../field-editor/referenceDraftValidation';
import { supportsStructuredValue } from '../field-editor/structuredValueSchema';
import { definitionSchemas } from './definitionSchemas.generated';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';

const leaf: DefinitionFieldSchema = {
  kind: 'object',
  fields: { kind: { kind: 'enum', options: ['leaf'] }, value: { kind: 'number' } },
};
const branch: DefinitionFieldSchema = {
  kind: 'object',
  fields: { kind: { kind: 'enum', options: ['branch'] }, child: { kind: 'ref', ref: 'tree' } },
};
const tree: DefinitionFieldSchema = { kind: 'union', variants: [leaf, branch] };
const schema: DefinitionFieldSchema = { ...tree, references: { tree } };
function nested(depth: number, value: unknown = { kind: 'leaf', value: 1 }): unknown {
  while (depth--) value = { child: value, kind: 'branch' };
  return value;
}

it('resolves finite bodies with stable variant identity and rejects missing/ref-only loops', () => {
  const reference: DefinitionFieldSchema = { kind: 'ref', ref: 'tree' };
  expect(resolveDefinitionSchema(reference, schema.references)).toBe(
    resolveDefinitionSchema(reference, schema.references),
  );
  expect(fieldSchemaForValue(schema, nested(30))).toBe(branch);
  expect(fieldSchemaForValue(schema, nested(30))).toBe(branch);
  expect(() => resolveDefinitionSchema(reference, {})).toThrow(/missing schema/);
  expect(() => resolveDefinitionSchema(reference, { tree: { kind: 'ref', ref: 'tree' } })).toThrow(
    /cyclic schema/,
  );
  expect(() => auditDefinitionSchema({ ...reference, references: {} })).toThrow(/missing schema/);
  expect(
    resolveDefinitionSchema(
      { kind: 'ref', ref: 'maybe' },
      { maybe: { kind: 'number', optional: true } },
    ).optional,
  ).toBe(false);
  expect(
    resolveDefinitionSchema(
      { kind: 'ref', ref: 'maybe', optional: true },
      { maybe: { kind: 'number' } },
    ).optional,
  ).toBe(true);
  expect(auditDefinitionSchema(schema).referenceBodies).toBe(1);
});

it('edits deep leaves, preserves unknown extensions, and terminates recursive defaults', () => {
  const before = nested(30);
  const path = [...Array.from({ length: 30 }, () => 'child'), 'value'];
  expect(() => assertEditableDefinitionField(schema, before, path, 2, 'value')).not.toThrow();
  expect(() =>
    assertEditableValue(schema, before, nested(30, { kind: 'leaf', value: NaN }), 'value'),
  ).toThrow();
  expect(() =>
    validateStructuredValue(schema, before, nested(30, { kind: 'leaf', value: 2 })),
  ).not.toThrow();
  expect(supportsStructuredValue(schema)).toBe(true);
  const extension = { preserved: true };
  expect(() =>
    assertEditableValue(
      schema,
      { kind: 'leaf', value: 1, extension },
      { kind: 'leaf', value: 2, extension },
      'value',
    ),
  ).not.toThrow();
  expect(() =>
    assertEditableValue(
      schema,
      { kind: 'leaf', value: 1, extension },
      { kind: 'leaf', value: 2 },
      'value',
    ),
  ).toThrow(/preserved/);
  const recursive: DefinitionFieldSchema = {
    kind: 'object',
    fields: { child: { kind: 'ref', ref: 'self' } },
  };
  const required: DefinitionFieldSchema = { ...recursive, references: { self: recursive } };
  expect(editableDefault(required)).toBeUndefined();
  expect(createDefinitionValueDraft(required)).toBeUndefined();
  expect(isCompleteDefinitionValue(required, {})).toBe(false);
  expect(
    editableDefault({
      kind: 'array',
      element: { kind: 'ref', ref: 'self' },
      references: { self: recursive },
    }),
  ).toEqual([]);
  expect(
    editableDefault({
      kind: 'object',
      fields: { child: { kind: 'ref', ref: 'self', optional: true } },
      references: { self: recursive },
    }),
  ).toEqual({});
});

it('rejects cyclic and over-budget values before no-op, reference, equality or boundary scans approve', () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.loop = cyclic;
  for (const value of [cyclic, Array(FIELD_VALUE_VISIT_LIMIT + 1).fill(0), nested(300)]) {
    expect(() => assertFiniteFieldValue(value)).toThrow(/cyclic|budget/);
    expect(() => assertEditableValue(schema, value, value)).toThrow(/cyclic|budget/);
    expect(() => sameStructuredValue(value, value)).toThrow(/cyclic|budget/);
    expect(validReferenceDraft(schema, value, undefined, undefined, undefined, value)).toBe(false);
  }
  const shared = { kind: 'leaf', value: 1 };
  expect(() => assertFiniteFieldValue([shared, shared])).not.toThrow();
  let visits = 0;
  expect(() =>
    selectDefinitionSchema(schema, nested(30), schema.references!, {
      visit() {
        if (++visits > 4) throw new Error('test budget');
      },
    }),
  ).toThrow('test budget');
});

it.each(['valueNode', 'conditionNode', 'stringNode'])(
  'keeps deep %s references, empty graph creation and never slots protected',
  kind => {
    const pin = { kind, nodeId: 'shared' };
    const operand = actionNodeSchemas.modifyActionValue.fields.find(
      field => field.path.join('.') === 'parameters.value',
    )?.valueSchema;
    if (operand)
      expect(() => assertEditableValue(operand, pin, { ...pin, nodeId: 'other' }, 'value')).toThrow(
        /graph/,
      );
    const referenceSchema: DefinitionFieldSchema = {
      kind: 'object',
      fields: { kind: { kind: 'enum', options: [kind] }, nodeId: { kind: 'string' } },
    };
    expect(() =>
      assertEditableValue(referenceSchema, pin, { ...pin, nodeId: 'other' }, 'value'),
    ).toThrow(/graph/);
    expect(() =>
      assertEditableDefinitionField(referenceSchema, pin, ['nodeId'], 'other', 'value'),
    ).toThrow(/graph/);
    const list: DefinitionFieldSchema = {
      kind: 'array',
      element: { kind: 'ref', ref: 'pin' },
      references: { pin: referenceSchema },
    };
    expect(() => assertEditableValue(list, [pin], [], 'value')).toThrow();
    expect(() => assertEditableValue(list, [pin], [pin, pin], 'value')).toThrow();
    const other = { kind, nodeId: 'other' };
    expect(() =>
      assertEditableValue(list, [pin, other, pin], [pin, pin, other], 'value'),
    ).not.toThrow();
    expect(() =>
      assertEditableDefinitionField(
        definitionSchemas.buff,
        { stackingType: 'unlimited' },
        ['actionGraph'],
        { main: { nodes: {} }, macros: {} },
      ),
    ).toThrow();
  },
);
