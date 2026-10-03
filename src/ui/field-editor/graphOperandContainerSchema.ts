import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema.ts';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../core/editor/resolveDefinitionSchema.ts';

/** Exact graph-owned declarations with implemented nested controls. This grants no
 * permission to edit references, other containers, or definition-side operands. */
export function graphOperandSchemas(
  schema: DefinitionFieldSchema | undefined,
  kind: string | undefined,
  path: readonly (string | number)[] | undefined,
  references: DefinitionSchemaReferences = schema?.references ?? EMPTY_SCHEMA_REFERENCES,
): ReadonlySet<DefinitionFieldSchema> | undefined {
  if (!schema || !kind || !path) return;
  const switchOptions = kind === 'switch' && path.length === 1 && path[0] === 'options';
  if (!switchOptions && (path.length !== 2 || path[0] !== 'parameters')) return;
  const slots: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
    dealDamage: { instantAttributeModifiers: ['value'], instantDamageScaleModifiers: ['addition'] },
    applyBuff: { keywordEnhancements: ['value'], onActionEndBuffs: ['blackboardAssignments', '*'] },
    readSkillSettingData: { items: ['column'] },
  };
  const keys = switchOptions ? ['value'] : slots[kind]?.[String(path[1])];
  const global = kind === 'createGlobalBuff' && path[1] === 'definition';
  if (!keys && !global) return;
  const formal = actionNodeSchemas[kind as keyof typeof actionNodeSchemas]?.fields.find(
    value => value.path.join('.') === path.join('.'),
  );
  if (!formal?.source?.some(source => schema.source?.includes(source))) return;
  let value = resolveDefinitionSchema(schema, references);
  if (global) {
    if (value.kind !== 'object') return;
    const modifier = value.fields.sharedSpModifiers;
    const children = value.fields.children;
    if (
      modifier?.kind !== 'array' ||
      modifier.element.kind !== 'object' ||
      children?.kind !== 'array' ||
      children.element.kind !== 'object'
    )
      return;
    const assignments = children.element.fields.blackboardAssignments;
    if (assignments?.kind !== 'record' || !modifier.element.fields.value) return;
    const values = [modifier.element.fields.value, assignments.value].map(value =>
      resolveDefinitionSchema(value, references),
    );
    if (values.some(value => !value.semantics?.aliases?.includes('ActionValueOperand'))) return;
    return new Set(values);
  }
  if (value.kind !== 'array') return;
  value = resolveDefinitionSchema(value.element, references);
  for (const key of keys!) {
    const child =
      key === '*' && value.kind === 'record'
        ? value.value
        : value.kind === 'object'
          ? value.fields[key]
          : undefined;
    if (!child) return;
    value = resolveDefinitionSchema(child, references);
  }
  if (!value.semantics?.aliases?.includes('ActionValueOperand')) return;
  return new Set([value]);
}

/** The contract spells these as number[], while its existing validator requires four
 * finite columns. This is editor configuration for that declaration, not a new type. */
export function isSkillSettingValuesSchema(schema: DefinitionFieldSchema): boolean {
  const root = actionNodeSchemas.readSkillSettingData.fields.find(
    field => field.path.at(-1) === 'items',
  )?.valueSchema;
  if (root?.kind !== 'array' || root.element.kind !== 'object') return false;
  const formal = root.element.fields.values;
  return (
    schema.kind === 'array' &&
    schema.element.kind === 'number' &&
    !!formal?.source?.some(source => schema.source?.includes(source))
  );
}
