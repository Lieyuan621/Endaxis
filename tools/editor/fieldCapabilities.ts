import { spawnDefinitionResources } from '../../src/ui/field-editor/spawnDefinitionSchema.ts';
import { graphSequenceBoundaries } from '../../src/ui/field-editor/graphSequenceContainerSchema.ts';
import { graphOperandSchemas } from '../../src/ui/field-editor/graphOperandContainerSchema.ts';
import { auditDefinitionSchema } from '../../src/core/editor/auditDefinitionSchema.ts';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../src/core/editor/resolveDefinitionSchema.ts';
import type { DefinitionSchemaReferences } from '../../src/core/editor/fieldSchema.ts';
import {
  supportsStructuredValue,
  isReadonlyDefinitionSlot,
  isProtectedDefinitionIdentity,
} from '../../src/ui/field-editor/structuredValueSchema.ts';
import { stringCollectionDescriptor } from '../../src/ui/field-editor/stringCollectionSchema.ts';
import { isConditionListField } from '../../src/ui/field-editor/conditionListSchema.ts';
import { resolveBlackboardMapping } from '../../src/ui/field-editor/blackboardMappingSchema.ts';
import type { FieldSemantics } from '../../src/ui/field-editor/fieldSemantics.ts';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaCatalog,
} from '../../src/ui/definition-editor/fieldSchema.ts';
import type { DataNodeSchema, NodeFieldSchema } from '../../src/ui/action-graph/nodeSchema.ts';

export interface FieldCapability {
  readonly key: string;
  readonly surface: 'definition' | 'action' | 'data';
  readonly root: string;
  readonly path: string;
  readonly control: string;
  readonly source: readonly string[];
  readonly aliases: readonly string[];
  readonly semantics?: FieldSemantics;
  readonly view: 'value' | 'structure' | 'navigation' | 'readonly' | 'context-dependent';
  readonly edit: 'field' | 'recursive' | 'none' | 'json' | 'context-dependent';
  /** 描述契约入口资格，不表示当前值已有连接，也不绕过图上下文校验。 */
  readonly connection:
    'none' | 'execution' | 'number-context' | 'condition-context' | 'string-context';
  readonly fallback?: string;
  readonly schemaReference?: string;
  readonly restriction?: 'identity-readonly' | 'host-readonly';
  readonly contextualChoice?: 'number-blackboard-read' | 'macro-parameter-read';
}

export interface FieldCapabilityException {
  readonly reason: string;
  readonly phase: 'P1' | 'P2' | 'P3' | 'P4' | 'boundary';
  readonly category: string;
  /** 历史审计中实际有值并走 JSON 的位置；不是当前运行实例计数。 */
  readonly observedJsonAtAudit?: true;
  readonly keys: readonly string[];
}

/** 只合并当前值的联合选择，不把容器的叶子误当容器本身的引脚资格。 */
function valueAliases(semantics: FieldSemantics | undefined): string[] {
  return [
    ...new Set([
      ...(semantics?.aliases ?? []),
      ...(semantics?.unionVariants ?? []).flatMap(valueAliases),
    ]),
  ];
}

/** 分母是生成 schema 的展开位置；联合和容器槽分别列出，不读取私有数据或当前值。 */
export function collectFieldCapabilities(
  definitions: DefinitionSchemaCatalog,
  actions: Readonly<Record<string, DataNodeSchema>>,
  data: Readonly<Record<string, DataNodeSchema>>,
): FieldCapability[] {
  const rows: FieldCapability[] = [];
  function definition(
    schema: DefinitionFieldSchema,
    root: string,
    path: readonly string[],
    source: readonly string[] = [],
    inheritedRestriction?: FieldCapability['restriction'],
    references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
    pendingReferences = new Set<string>(),
    inheritedInline = false,
  ) {
    const reference = schema.kind === 'ref' ? schema.ref : undefined;
    if (reference) pendingReferences.add(reference);
    schema = resolveDefinitionSchema(schema, references);
    const origin = schema.source ?? source;
    const aliases = valueAliases(schema.semantics);
    const boundary =
      schema.kind === 'graph' ||
      ['graph-reference-boundary', 'owned-resource-boundary', 'no-present-type'].includes(
        schema.fallback?.reason ?? '',
      );
    const valuePath = path.filter(part => !/^<\d+>$/.test(part));
    const inline = inheritedInline || !!schema.inlineCondition;
    const protectedIdentity =
      !inline && isProtectedDefinitionIdentity(valuePath.at(-1) ?? '', valuePath.length === 1);
    const restriction =
      inheritedRestriction ??
      (isReadonlyDefinitionSlot(valuePath.at(-1) ?? '', schema.source)
        ? 'host-readonly'
        : protectedIdentity
          ? 'identity-readonly'
          : undefined);
    rows.push({
      key: ['definition', root, ...path].join('/'),
      surface: 'definition',
      root,
      path: path.join('.'),
      control: reference
        ? 'ref'
        : schema.inlineCondition && aliases.includes('CombatCondition')
          ? 'inlineCondition'
          : schema.inlineCondition && aliases.includes('ActionValueOperand')
            ? 'inlineOperand'
            : schema.kind,
      ...(reference ? { schemaReference: reference } : {}),
      source: origin,
      aliases,
      semantics: schema.semantics,
      view:
        schema.kind === 'graph'
          ? 'navigation'
          : schema.kind === 'opaque' || schema.kind === 'condition'
            ? 'readonly'
            : ['object', 'array', 'tuple', 'record', 'union', 'timeScaleCurve'].includes(
                  schema.kind,
                )
              ? 'structure'
              : 'value',
      edit:
        restriction || boundary || schema.kind === 'opaque' || schema.kind === 'condition'
          ? 'none'
          : schema.inlineCondition
            ? 'field'
            : ['object', 'array', 'tuple', 'record', 'union'].includes(schema.kind)
              ? 'recursive'
              : 'field',
      connection: 'none',
      ...(restriction ? { restriction } : {}),
      ...(schema.fallback ? { fallback: schema.fallback.reason } : {}),
    });
    if (reference) return;
    if (schema.kind === 'object')
      for (const [name, child] of Object.entries(schema.fields))
        definition(
          child,
          root,
          [...path, name],
          origin,
          restriction,
          references,
          pendingReferences,
          inline,
        );
    if (schema.kind === 'array')
      definition(
        schema.element,
        root,
        [...path, '[]'],
        origin,
        restriction,
        references,
        pendingReferences,
        inline,
      );
    if (schema.kind === 'record')
      definition(
        schema.value,
        root,
        [...path, '{}'],
        origin,
        restriction,
        references,
        pendingReferences,
        inline,
      );
    if (schema.kind === 'tuple')
      schema.elements.forEach((child, index) =>
        definition(
          child,
          root,
          [...path, `[${index}]`],
          origin,
          restriction,
          references,
          pendingReferences,
          inline,
        ),
      );
    if (schema.kind === 'union')
      schema.variants.forEach((child, index) =>
        definition(
          child,
          root,
          [...path, `<${index}>`],
          origin,
          restriction,
          references,
          pendingReferences,
          inline,
        ),
      );
  }
  for (const [root, schema] of Object.entries(definitions)) {
    auditDefinitionSchema(schema);
    const references = schema.references ?? EMPTY_SCHEMA_REFERENCES;
    const pending = new Set<string>();
    const visited = new Set<string>();
    definition(schema, root, [], [], undefined, references, pending);
    for (const id of pending) {
      if (visited.has(id)) continue;
      visited.add(id);
      const body = references[id];
      if (!body) throw new Error(`missing schema reference '${id}'`);
      definition(body, root, [`<ref:${id}>`], [], undefined, references, pending);
    }
  }
  for (const [surface, catalog] of [
    ['action', actions],
    ['data', data],
  ] as const) {
    for (const [root, schema] of Object.entries(catalog))
      for (const field of schema.fields) {
        if (field.valueSchema) auditDefinitionSchema(field.valueSchema);
        const aliases = valueAliases(field.semantics);
        // DataNodeInspector 已有的两个作用域选择入口，不计为普通文本分派。
        const contextualChoice =
          surface === 'data' && root === 'number:blackboard' && field.path.join('.') === 'key'
            ? ('number-blackboard-read' as const)
            : surface === 'data' &&
                root === 'number:parameter' &&
                field.path.join('.') === 'parameter'
              ? ('macro-parameter-read' as const)
              : undefined;
        const expressionInput =
          field.control === 'operand' ||
          aliases.includes('ActionValueOperand') ||
          aliases.includes('CombatCondition');
        const mapping = resolveBlackboardMapping(field);
        const stringOperand = aliases.includes('ActionStringOperand');
        const conditionList = isConditionListField(field);
        const collection = stringCollectionDescriptor(field);
        const tag = field.control === 'string' && aliases.includes('GameplayTag');
        const curve = field.control === 'json' && field.valueSchema?.kind === 'timeScaleCurve';
        const availableControl = curve
          ? 'timeScaleCurve'
          : collection
            ? 'stringCollection'
            : tag
              ? 'gameplayTag'
              : conditionList
                ? 'conditionList'
                : mapping
                  ? 'blackboardMapping'
                  : stringOperand
                    ? 'stringOperand'
                    : expressionInput
                      ? 'typedInput'
                      : undefined;
        const structured =
          !availableControl &&
          field.control === 'json' &&
          field.valueSchema &&
          supportsStructuredValue(
            field.valueSchema,
            field.path.at(-1),
            field.valueSchema.references,
            surface === 'action'
              ? graphOperandSchemas(field.valueSchema, root, field.path)
              : undefined,
            surface === 'action'
              ? graphSequenceBoundaries(field.valueSchema, root, field.path)
              : undefined,
            surface === 'action'
              ? spawnDefinitionResources(field.valueSchema, root, field.path)
              : undefined,
          );
        const actualControl = availableControl ?? (structured ? 'structuredValue' : undefined);
        const complex = !actualControl && (field.control === 'json' || expressionInput);
        const fallback = actualControl
          ? undefined
          : (field.fallback?.reason ??
            (expressionInput ? 'unassigned-input-editor-pending' : undefined));
        rows.push({
          key: [surface, root, ...field.path].join('/'),
          surface,
          root,
          path: field.path.join('.'),
          control: actualControl ?? field.control,
          source: field.source ?? [],
          aliases,
          semantics: field.semantics,
          ...(contextualChoice ? { contextualChoice } : {}),
          view: ['resource', 'sequence'].includes(field.control)
            ? 'navigation'
            : curve || conditionList || structured
              ? 'structure'
              : complex
                ? 'context-dependent'
                : 'value',
          edit: ['resource', 'sequence'].includes(field.control)
            ? 'none'
            : complex
              ? 'context-dependent'
              : structured
                ? 'recursive'
                : 'field',
          connection: nodeConnection(field),
          ...(fallback ? { fallback } : {}),
        });
      }
  }
  return rows.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

function nodeConnection(field: NodeFieldSchema): FieldCapability['connection'] {
  if (field.control === 'sequence') return 'execution';
  if (field.control === 'operand' || valueAliases(field.semantics).includes('ActionValueOperand'))
    return 'number-context';
  if (valueAliases(field.semantics).includes('CombatCondition')) return 'condition-context';
  if (valueAliases(field.semantics).includes('ActionStringOperand')) return 'string-context';
  return 'none';
}

/** 不能用总数不变掩盖新后备；每条新增、理由变化和已移除的旧豁免均须审查。 */
export function checkFieldCapabilityCoverage(
  rows: readonly FieldCapability[],
  exceptions: readonly FieldCapabilityException[],
): string[] {
  const failures: string[] = [];
  const expected = new Map<string, FieldCapabilityException>();
  for (const group of exceptions) {
    if (
      !group.reason ||
      !group.category ||
      !['P1', 'P2', 'P3', 'P4', 'boundary'].includes(group.phase)
    )
      failures.push('exception lacks a reason, category or responsible phase');
    for (const key of group.keys) {
      if (expected.has(key)) failures.push(`duplicate exception: ${key}`);
      expected.set(key, group);
    }
  }
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.key)) failures.push(`duplicate schema position: ${row.key}`);
    seen.add(row.key);
    if (row.path && !row.source.length) failures.push(`missing source declaration: ${row.key}`);
    if (['json', 'opaque', 'condition'].includes(row.control) && !row.fallback)
      failures.push(`unexplained fallback: ${row.key}`);
    const exception = expected.get(row.key);
    if (row.fallback && !exception)
      failures.push(`unreviewed fallback (${row.fallback}): ${row.key}`);
    if (exception && row.fallback !== exception.reason)
      failures.push(
        `stale fallback (${exception.reason} -> ${row.fallback ?? 'none'}): ${row.key}`,
      );
  }
  for (const key of expected.keys())
    if (!seen.has(key)) failures.push(`removed schema position still exempted: ${key}`);
  return failures;
}

export function summarizeFieldCapabilities(rows: readonly FieldCapability[]) {
  const count = (items: readonly FieldCapability[], property: 'control' | 'fallback') =>
    Object.fromEntries(
      [...new Set(items.map(row => row[property] ?? 'none'))]
        .sort()
        .map(key => [key, items.filter(row => (row[property] ?? 'none') === key).length]),
    );
  const strings = rows.filter(row => row.control === 'string');
  const textStrings = strings.filter(row => !row.contextualChoice);
  return {
    definitionRoots: rows.filter(row => row.surface === 'definition' && !row.path).length,
    definitionNonRootNodes: rows.filter(row => row.surface === 'definition' && row.path).length,
    definitionKinds: count(
      rows.filter(row => row.surface === 'definition' && row.path),
      'control',
    ),
    actionFields: rows.filter(row => row.surface === 'action').length,
    dataFields: rows.filter(row => row.surface === 'data').length,
    actionControls: count(
      rows.filter(row => row.surface === 'action'),
      'control',
    ),
    dataControls: count(
      rows.filter(row => row.surface === 'data'),
      'control',
    ),
    stringSchemaPositions: strings.length,
    stringSchemaSourceDeclarations: new Set(strings.flatMap(row => row.source)).size,
    stringTextOrLegacyReferencePositions: textStrings.length,
    stringTextOrLegacyReferenceSourceDeclarations: new Set(textStrings.flatMap(row => row.source))
      .size,
    fallbackReasons: count(
      rows.filter(row => row.fallback),
      'fallback',
    ),
  };
}
