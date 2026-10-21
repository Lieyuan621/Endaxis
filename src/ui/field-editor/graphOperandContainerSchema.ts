import { hasSemanticAlias, sameFieldDeclaration } from '../../core/editor/fieldSemantics.ts';
import { actionNodeSchemas, dataNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
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
  const declared = (
    actionNodeSchemas[kind as keyof typeof actionNodeSchemas] ?? dataNodeSchemas[kind]
  )?.fields.find(field => field.path.join('.') === path.join('.'));
  if (declared?.valueSchema === schema || sameFieldDeclaration(declared?.valueSchema, schema)) {
    const operands = new Set<DefinitionFieldSchema>();
    const seen = new Set<DefinitionFieldSchema>();
    const visit = (input: DefinitionFieldSchema) => {
      const value = resolveDefinitionSchema(input, references);
      if (seen.has(value)) return;
      seen.add(value);
      if (value.kind === 'object') {
        const discriminator = value.fields.kind;
        if (
          discriminator?.kind === 'enum' &&
          discriminator.options.length === 1 &&
          discriminator.options[0] === 'distanceFilter' &&
          value.fields.threshold
        ) {
          const threshold = resolveDefinitionSchema(value.fields.threshold, references);
          if (hasSemanticAlias(threshold.semantics, 'ActionValueOperand')) operands.add(threshold);
        }
        Object.values(value.fields).forEach(visit);
      } else if (value.kind === 'union') value.variants.forEach(visit);
      else if (value.kind === 'array') visit(value.element);
      else if (value.kind === 'record') visit(value.value);
      else if (value.kind === 'tuple') value.elements.forEach(visit);
    };
    visit(schema);
    if (operands.size > 0) return operands;
  }

  const switchOptions = kind === 'switch' && path.length === 1 && path[0] === 'options';
  if (!switchOptions && (path.length !== 2 || path[0] !== 'parameters')) return;
  const slots: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
    dealDamage: { instantAttributeModifiers: ['value'], instantDamageScaleModifiers: ['addition'] },
    applyBuff: { buffs: ['blackboardAssignments', '*'] },
    aura: { buffs: ['blackboardAssignments', '*'] },
    readSkillSettingData: { items: ['column'] },
    overrideRawAttributes: { attributes: ['value'] },
  };
  const keys = switchOptions ? ['value'] : slots[kind]?.[String(path[1])];
  const global = kind === 'createGlobalBuff' && path[1] === 'definition';
  if (!keys && !global) return;
  const formal = actionNodeSchemas[kind as keyof typeof actionNodeSchemas]?.fields.find(
    value => value.path.join('.') === path.join('.'),
  );
  if (!sameFieldDeclaration(formal?.valueSchema, schema)) return;
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
  if ((kind === 'applyBuff' || kind === 'aura') && path[1] === 'buffs') {
    if (value.kind !== 'object') return;
    const assignments = value.fields.blackboardAssignments;
    const enhancements = value.fields.keywordEnhancements;
    if (assignments?.kind !== 'record' || enhancements?.kind !== 'array') return;
    const entry = resolveDefinitionSchema(enhancements.element, references);
    if (entry.kind !== 'object' || !entry.fields.value) return;
    const operands = [assignments.value, entry.fields.value].map(value =>
      resolveDefinitionSchema(value, references),
    );
    // 等级数值和图输入共用赋值槽；只开放正式 Buff 条目内的两个数值入口。
    if (operands.some(value => !hasSemanticAlias(value.semantics, 'ActionValueOperand'))) return;
    return new Set(operands);
  }
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
    sameFieldDeclaration(formal, schema)
  );
}
