/** 条件与数值的数据节点编辑。只处理当前资源，不沿控制连线展开或合并不同调用。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph.ts';
import { selectDefinitionSchema } from '../editor/selectDefinitionSchema.ts';
import type { DefinitionFieldSchema, DefinitionSchemaReferences } from '../editor/fieldSchema.ts';
import {
  assertFiniteFieldValue,
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../editor/resolveDefinitionSchema.ts';
import { graphDataNode, visitGraphDataReferences } from './actionGraphData.ts';

export function expressionType(value: unknown): ActionGraphDataNode['type'] | null {
  if (!value || typeof value !== 'object' || !('kind' in value)) return null;
  if (value.kind === 'stringNode') return 'string';
  if (value.kind === 'constant')
    return 'value' in value && typeof value.value === 'boolean' ? 'boolean' : 'number';
  if (value.kind === 'valueNode') return 'number';
  if (value.kind === 'conditionNode') return 'boolean';
  return null;
}

export interface DataInput {
  readonly path: readonly string[];
  readonly type: ActionGraphDataNode['type'];
  readonly source: string | null;
  readonly value: unknown;
}
/** Minimal structural schema accepted by core; generated UI schemas supply these aliases. */
export interface DataInputSemantics {
  readonly aliases?: readonly string[];
  readonly unionVariants?: readonly DataInputSemantics[];
  readonly arrayElement?: DataInputSemantics;
  readonly recordValue?: DataInputSemantics;
  readonly tuple?: { readonly elements: readonly { readonly semantics: DataInputSemantics }[] };
}
export interface DataInputField {
  readonly valueSchema?: DefinitionFieldSchema;
  readonly path: readonly string[];
  readonly semantics?: DataInputSemantics;
  readonly fallback?: { readonly reason: string };
}
/** Only contract aliases confer connectivity; a primitive number/string never does. */
export function dataInputType(semantics?: DataInputSemantics): DataInput['type'] | null {
  const aliases = semantics?.aliases ?? [];
  if (aliases.includes('ActionValueOperand')) return 'number';
  if (aliases.includes('CombatCondition')) return 'boolean';
  if (aliases.includes('ActionStringOperand')) return 'string';
  const types = new Set(
    semantics?.unionVariants?.flatMap(variant => {
      const type = dataInputType(variant);
      return type ? [type] : [];
    }),
  );
  return types.size === 1 ? [...types][0]! : null;
}
export function dataNodeInputs(
  node: ActionGraphDataNode,
  fields?: readonly DataInputField[],
): readonly DataInput[] {
  // String definitions retain the original operand shape; plain strings and key reads
  // are values, never inferred from arbitrary string fields in the enclosing graph.
  if (node.type === 'string') {
    const value = node.expression;
    return [
      {
        path: [],
        type: 'string',
        source:
          value !== null &&
          typeof value === 'object' &&
          'kind' in value &&
          value.kind === 'stringNode'
            ? value.nodeId
            : null,
        value,
      },
    ];
  }
  return listDataInputs(
    Object.fromEntries(Object.entries(node.expression).filter(([key]) => key !== 'kind')),
    fields,
  );
}
export function listDataInputs(
  value: unknown,
  fields?: readonly DataInputField[],
): readonly DataInput[] {
  assertFiniteFieldValue(value);
  const inputs: DataInput[] = [];
  function visit(value: unknown, path: readonly string[]) {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
    const type = expressionType(value);
    if (type) {
      inputs.push({ path, type, source: 'nodeId' in value ? String(value.nodeId) : null, value });
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  if (fields === undefined) {
    visit(value, []);
    return inputs;
  }
  // A declared optional slot exists even when no current expression can be inspected.
  // Container slots only project existing entries; projection never invents a key or item.
  function declared(current: unknown, path: readonly string[], semantics?: DataInputSemantics) {
    const type = dataInputType(semantics);
    if (type) {
      inputs.push({
        path,
        type,
        source:
          current &&
          typeof current === 'object' &&
          'kind' in current &&
          (current.kind === 'valueNode' ||
            current.kind === 'conditionNode' ||
            current.kind === 'stringNode') &&
          'nodeId' in current
            ? String(current.nodeId)
            : null,
        value: current,
      });
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) =>
        declared(
          item,
          [...path, String(index)],
          semantics?.tuple?.elements[index]?.semantics ?? semantics?.arrayElement,
        ),
      );
    } else if (current && typeof current === 'object' && semantics?.recordValue) {
      for (const [key, item] of Object.entries(current))
        declared(item, [...path, key], semantics.recordValue);
    }
  }
  function declaredSchema(
    current: unknown,
    path: readonly string[],
    schema: DefinitionFieldSchema,
    references: DefinitionSchemaReferences,
  ): void {
    const shape = resolveDefinitionSchema(schema, references);
    if (
      shape.kind === 'graph' ||
      ['no-present-type', 'graph-reference-boundary', 'owned-resource-boundary'].includes(
        shape.fallback?.reason ?? '',
      )
    )
      return;
    const type = dataInputType(shape.semantics);
    if (type) {
      declared(current, path, shape.semantics);
      return;
    }
    // Non-connectable formal semantic values are atomic (notably BuildCondition).
    if (shape.semantics?.aliases?.length) return;
    if (shape.kind === 'union') {
      const selected = selectDefinitionSchema(shape, current, references);
      if (selected.kind !== 'opaque') declaredSchema(current, path, selected, references);
      return;
    }
    if (
      shape.kind === 'object' &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      for (const [key, child] of Object.entries(shape.fields))
        declaredSchema(
          (current as Record<string, unknown>)[key],
          [...path, key],
          child,
          references,
        );
    } else if (shape.kind === 'array' && Array.isArray(current)) {
      current.forEach((child, index) =>
        declaredSchema(child, [...path, String(index)], shape.element, references),
      );
    } else if (shape.kind === 'tuple' && Array.isArray(current)) {
      current.forEach((child, index) => {
        if (shape.elements[index])
          declaredSchema(child, [...path, String(index)], shape.elements[index]!, references);
      });
    } else if (
      shape.kind === 'record' &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      for (const [key, child] of Object.entries(current))
        declaredSchema(child, [...path, key], shape.value, references);
    }
  }
  for (const field of fields) {
    let current = value;
    for (const key of field.path)
      current =
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined;
    if (field.valueSchema)
      declaredSchema(
        current,
        field.path,
        field.valueSchema,
        field.valueSchema.references ?? EMPTY_SCHEMA_REFERENCES,
      );
    else declared(current, field.path, field.semantics);
  }
  // Shape discovery is only a compatibility fallback for unmodeled descendants.
  // An explicit non-connectable declaration wins even when malformed data happens
  // to look like a numeric/condition expression (e.g. BuildCondition or string maps).
  function unmodeled(field: DataInputField, path: readonly string[]): boolean {
    if (field.valueSchema) return false;
    let semantics = field.semantics;
    let remaining = path.slice(field.path.length);
    while (semantics) {
      if (semantics.aliases?.length) return false;
      if (!remaining.length) return false;
      const [key, ...rest] = remaining;
      const child =
        semantics.recordValue ??
        (/^(0|[1-9]\d*)$/.test(key!)
          ? (semantics.tuple?.elements[Number(key)]?.semantics ?? semantics.arrayElement)
          : undefined);
      if (!child) {
        // Only an explicit incomplete-schema boundary permits shape discovery.
        // Object properties are described by valueSchema, never by type display text.
        return (
          field.fallback?.reason === 'depth-limit' || field.fallback?.reason === 'recursive-type'
        );
      }
      semantics = child;
      remaining = rest;
    }
    return field.fallback?.reason === 'depth-limit' || field.fallback?.reason === 'recursive-type';
  }
  const discovered: DataInput[] = [];
  for (const input of listDataInputs(value)) {
    if (inputs.some(declared => declared.path.every((key, i) => key === input.path[i]))) continue;
    const enclosing = fields.filter(field => field.path.every((key, i) => key === input.path[i]));
    // The most specific generated declaration controls its entire subtree.
    const field = enclosing.sort((a, b) => b.path.length - a.path.length)[0];
    if (!field || unmodeled(field, input.path)) discovered.push(input);
  }
  return [...inputs, ...discovered];
}

export function dataNodeHasEffects(graph: ActionGraphDefinition, id: string): boolean {
  const visited = new Set<string>();
  function visit(id: string): boolean {
    if (visited.has(id)) return false;
    visited.add(id);
    const node = graphDataNode(graph, id, 'boolean');
    const expression = node.expression;
    if (
      typeof expression === 'object' &&
      'kind' in expression &&
      (expression.kind === 'probability' || expression.kind === 'buffBlackboardValueCompare')
    )
      return true;
    let effects = false;
    visitGraphDataReferences(expression, reference => {
      if (reference.kind === 'conditionNode' && visit(reference.nodeId)) effects = true;
    });
    return effects;
  }
  return graph.dataNodes?.[id]?.type === 'boolean' && visit(id);
}
