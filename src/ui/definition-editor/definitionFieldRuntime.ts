import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { hasSemanticAlias } from '../../core/editor/fieldSemantics.ts';
import {
  isEmptyGraphSequence,
  type GraphContainerBoundaries,
} from '../field-editor/graphSequenceContainerSchema';
import { selectDefinitionSchema } from '../../core/editor/selectDefinitionSchema.ts';
import {
  assertTimeScaleCurveValue,
  timeScaleCurveBoundaryValues,
} from '../field-editor/timeScaleCurveValue.ts';
import {
  isReadonlyDefinitionSlot,
  isProtectedDefinitionIdentity,
} from '../field-editor/structuredValueSchema.ts';
import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema';
import {
  assertFiniteFieldValue,
  createFieldTraversalWork,
  type FieldTraversalWork,
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
  FIELD_VALUE_DEPTH_LIMIT,
} from '../../core/editor/resolveDefinitionSchema.ts';

export { isProtectedDefinitionIdentity } from '../field-editor/structuredValueSchema.ts';

/** 空图只建立资源边界；执行节点和连线由图编辑器添加。 */
export function emptyDefinitionActionGraph() {
  return { main: { nodes: {} }, macros: {} };
}

function isEmptyDefinitionActionGraph(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const graph = value as Record<string, unknown>;
  if (
    Object.keys(graph).length !== 2 ||
    !graph.main ||
    !graph.macros ||
    typeof graph.main !== 'object'
  )
    return false;
  const main = graph.main as Record<string, unknown>;
  return (
    Object.keys(main).length === 1 &&
    main.nodes !== null &&
    typeof main.nodes === 'object' &&
    !Array.isArray(main.nodes) &&
    Object.keys(main.nodes).length === 0 &&
    typeof graph.macros === 'object' &&
    !Array.isArray(graph.macros) &&
    Object.keys(graph.macros).length === 0
  );
}

/** 只允许契约描述过的字段编辑；未知形状保持只读，不能靠样本值猜类型。 */
export function fieldSchemaForValue(
  declared: DefinitionFieldSchema | undefined,
  value: unknown,
  _key?: string,
  references: DefinitionSchemaReferences = declared?.references ?? EMPTY_SCHEMA_REFERENCES,
): DefinitionFieldSchema {
  assertFiniteFieldValue(value);
  return selectDefinitionSchema(declared, value, references);
}

/** A branch switch removes incompatible declared slots but preserves undeclared extensions. */
export function preserveDefinitionExtensions(
  schema: DefinitionFieldSchema,
  previous: unknown,
  next: unknown,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): unknown {
  assertFiniteFieldValue(previous);
  assertFiniteFieldValue(next);
  schema = resolveDefinitionSchema(schema, references);
  if (
    schema.kind !== 'union' ||
    !previous ||
    typeof previous !== 'object' ||
    Array.isArray(previous) ||
    !next ||
    typeof next !== 'object' ||
    Array.isArray(next)
  )
    return next;
  const known = new Set(
    schema.variants
      .map(variant => resolveDefinitionSchema(variant, references))
      .flatMap(variant => (variant.kind === 'object' ? Object.keys(variant.fields) : [])),
  );
  return {
    ...Object.fromEntries(Object.entries(previous).filter(([key]) => !known.has(key))),
    ...next,
  };
}

export type DefinitionEditingContext = 'definition' | 'value';

const RECURSIVE_DEFAULT = Symbol('recursive default');

export function editableDefault(
  schema: DefinitionFieldSchema,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): unknown {
  const value = defaultValue(schema, references, new Set(), false);
  return value === RECURSIVE_DEFAULT ? undefined : value;
}

function defaultValue(
  declared: DefinitionFieldSchema,
  references: DefinitionSchemaReferences,
  ancestors: ReadonlySet<DefinitionFieldSchema>,
  draft: boolean,
  graphBoundaries?: GraphContainerBoundaries,
): unknown {
  const schema = resolveDefinitionSchema(declared, references);
  if (ancestors.has(schema) || ancestors.size >= FIELD_VALUE_DEPTH_LIMIT) return RECURSIVE_DEFAULT;
  const nested = new Set(ancestors).add(schema);
  if (graphBoundaries?.sequences.has(schema)) return { $sequence: null };
  switch (schema.kind) {
    case 'null':
      return null;
    case 'enum':
      return schema.options.length === 1 ? schema.options[0] : undefined;
    case 'array':
      return [];
    case 'record':
      return {};
    case 'tuple': {
      const values = schema.elements
        .slice(0, schema.minLength)
        .map(child => defaultValue(child, references, nested, draft, graphBoundaries));
      if (values.includes(RECURSIVE_DEFAULT)) return RECURSIVE_DEFAULT;
      return !draft && values.some(value => value === undefined) ? undefined : values;
    }
    case 'object': {
      const values: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(schema.fields)) {
        if (child.optional) continue;
        const initial = defaultValue(child, references, nested, draft, graphBoundaries);
        if (initial === RECURSIVE_DEFAULT) return RECURSIVE_DEFAULT;
        if (initial === undefined) {
          if (!draft) return undefined;
        } else values[key] = initial;
      }
      return values;
    }
    default:
      return undefined;
  }
}

/** Required recursive children stay unselected; optional/empty containers terminate. */
export function createDefinitionValueDraft(
  schema: DefinitionFieldSchema,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
  graphBoundaries?: GraphContainerBoundaries,
): unknown {
  const value = defaultValue(schema, references, new Set(), true, graphBoundaries);
  return value === RECURSIVE_DEFAULT ? undefined : value;
}

/** 使用正式字段写入边界检查临时表单，未完成或不允许创建的结构不会进入资产历史。 */
export function isCompleteDefinitionValue(
  schema: DefinitionFieldSchema,
  value: unknown,
  context: DefinitionEditingContext = 'definition',
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): boolean {
  try {
    assertEditableDefinitionField(
      { kind: 'object', fields: { value: schema } },
      {},
      ['value'],
      value,
      context,
      references,
    );
    return value !== undefined;
  } catch {
    return false;
  }
}

export function fieldValueAt(root: unknown, path: readonly (string | number)[]): unknown {
  if (path.length > FIELD_VALUE_DEPTH_LIMIT)
    throw new Error('field path traversal budget exceeded');
  return path.reduce<unknown>(
    (value, key) =>
      value && typeof value === 'object'
        ? (value as Record<string | number, unknown>)[key]
        : undefined,
    root,
  );
}

/** UI 和命令共用的字段边界；事件伪造也不能修改身份或未知结构。 */
export function assertEditableDefinitionField(
  declared: DefinitionFieldSchema,
  root: unknown,
  path: readonly (string | number)[],
  next: unknown,
  context: DefinitionEditingContext = 'definition',
  references: DefinitionSchemaReferences = declared.references ?? EMPTY_SCHEMA_REFERENCES,
  resourceGraph?: ActionGraphDefinition,
): void {
  const work = createFieldTraversalWork();
  assertFiniteFieldValue(root);
  assertFiniteFieldValue(next);
  if (path.length > FIELD_VALUE_DEPTH_LIMIT)
    throw new Error('field path traversal budget exceeded');
  if (!path.length) throw new Error('cannot replace an entire definition from a field control');
  let schema = declared;
  let value = root;
  for (const [index, key] of path.entries()) {
    const declaredScope = resolveDefinitionSchema(schema, references);
    if (hasSemanticAlias(declaredScope.semantics, 'ActionValueOperand'))
      throw new Error('numeric operands require their graph input controls');
    if (isGraphInputReference(value))
      throw new Error('graph input references require their graph connection controls');
    schema = selectDefinitionSchema(schema, value, references, work);
    if (schema.kind === 'object') {
      if (typeof key !== 'string' || !Object.hasOwn(schema.fields, key))
        throw new Error(`unknown definition field '${String(key)}'`);
      if (context === 'definition' && isProtectedDefinitionIdentity(key, index === 0))
        throw new Error(`definition identity '${key}' is read-only`);
      if (
        context === 'definition' &&
        isReadonlyDefinitionSlot(schema.fields[key]!) &&
        !Object.is(fieldValueAt(root, path), next)
      )
        throw new Error('this field cannot be changed in a field control');
      const child = schema.fields[key]!;
      schema = child;
      value =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    } else if (schema.kind === 'record') {
      if (typeof key !== 'string' || !key.trim()) throw new Error('record key must not be empty');
      schema = schema.value;
      value =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    } else if (schema.kind === 'tuple') {
      if (
        typeof key !== 'number' ||
        !Array.isArray(value) ||
        key < 0 ||
        key >= value.length ||
        !schema.elements[key]
      )
        throw new Error('tuple slot does not exist');
      schema = schema.elements[key]!;
      value = value[key];
    } else if (schema.kind === 'array') {
      if (typeof key !== 'number' || !Array.isArray(value) || key < 0 || key >= value.length)
        throw new Error('array item does not exist');
      schema = schema.element;
      value = value[key];
    } else throw new Error(`field path crosses unsupported value at ${index}`);
  }
  const targetSchema = resolveDefinitionSchema(schema, references);
  if (targetSchema.kind === 'condition' && resourceGraph) {
    if (next === undefined && targetSchema.optional) return;
    if (!next || typeof next !== 'object' || !('kind' in next))
      throw new Error('expected a condition input');
    if (next.kind === 'constant' && 'value' in next && typeof next.value === 'boolean') return;
    if (
      next.kind === 'conditionNode' &&
      'nodeId' in next &&
      typeof next.nodeId === 'string' &&
      resourceGraph.dataNodes?.[next.nodeId]?.type === 'boolean'
    )
      return;
    throw new Error('condition input must reference a boolean node in its resource main graph');
  }
  assertValue(schema, value, next, context, references, work);
}

export function assertEditableValue(
  schema: DefinitionFieldSchema,
  previous: unknown,
  next: unknown,
  context: DefinitionEditingContext = 'definition',
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
  graphOperands?: ReadonlySet<DefinitionFieldSchema>,
  graphBoundaries?: GraphContainerBoundaries,
): void {
  assertFiniteFieldValue(previous);
  assertFiniteFieldValue(next);
  assertValue(
    schema,
    previous,
    next,
    context,
    references,
    createFieldTraversalWork(),
    graphOperands,
    graphBoundaries,
  );
}

function assertValue(
  schema: DefinitionFieldSchema,
  previous: unknown,
  next: unknown,
  context: DefinitionEditingContext,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork,
  graphOperands?: ReadonlySet<DefinitionFieldSchema>,
  graphBoundaries?: GraphContainerBoundaries,
): void {
  work.visit();
  schema = resolveDefinitionSchema(schema, references);
  if (previous !== undefined && Object.is(previous, next)) return;
  if (graphBoundaries?.sequences.has(schema)) {
    if ((previous === undefined || isEmptyGraphSequence(previous)) && isEmptyGraphSequence(next))
      return;
    throw new Error('execution references require their graph connection controls');
  }
  if (graphBoundaries?.conditions.has(schema)) {
    if (previous === undefined && next === undefined && schema.optional) return;
    throw new Error('graph conditions require their graph input controls');
  }
  if (hasSemanticAlias(schema.semantics, 'ActionValueOperand') && !graphOperands?.has(schema))
    throw new Error('numeric operands require their graph input controls');
  if ([previous, next].some(isGraphInputReference))
    throw new Error('graph input references require their graph connection controls');
  if (
    previous !== undefined &&
    schema.kind === 'union' &&
    selectDefinitionSchema(schema, previous, references, work).kind === 'opaque'
  )
    throw new Error('unmatched or ambiguous value cannot be changed in a field control');
  if (next === undefined && schema.optional) {
    assertNoBoundaryRemoval(schema, previous, references, work, graphBoundaries);
    return;
  }
  const shape = selectDefinitionSchema(schema, next, references, work);
  switch (shape.kind) {
    case 'timeScaleCurve':
      assertTimeScaleCurveValue(previous, next);
      return;
    case 'null':
      if (next !== null) throw new Error('expected null');
      return;
    case 'number':
      if (typeof next !== 'number' || !Number.isFinite(next))
        throw new Error('expected a finite number');
      return;
    case 'string':
      if (typeof next !== 'string') throw new Error('expected text');
      return;
    case 'boolean':
      if (typeof next !== 'boolean') throw new Error('expected true or false');
      return;
    case 'enum':
      if (!shape.options.includes(next as string | number | boolean))
        throw new Error('expected a listed choice');
      return;
    case 'tuple':
      if (
        !Array.isArray(next) ||
        next.length < shape.minLength ||
        next.length > shape.elements.length
      )
        throw new Error('expected fixed tuple slots');
      if (Array.isArray(previous))
        previous
          .slice(next.length)
          .forEach((entry, offset) =>
            assertNoBoundaryRemoval(
              shape.elements[next.length + offset]!,
              entry,
              references,
              work,
              graphBoundaries,
            ),
          );
      next.forEach((entry, index) =>
        assertValue(
          shape.elements[index]!,
          Array.isArray(previous) ? previous[index] : undefined,
          entry,
          context,
          references,
          work,
          graphOperands,
          graphBoundaries,
        ),
      );
      return;
    case 'array': {
      if (!Array.isArray(next)) throw new Error('expected a list');
      const before = Array.isArray(previous) ? previous : [];
      const beforeTokens = before.flatMap(value =>
        boundaryValues(shape.element, value, references, work, graphBoundaries),
      );
      const afterTokens = next.flatMap(value =>
        boundaryValues(shape.element, value, references, work, graphBoundaries),
      );
      if (!sameIdentityMultiset(beforeTokens, afterTokens, work))
        throw new Error('this field cannot be changed in a field control');
      const used = new Set<number>();
      for (const [index, entry] of next.entries()) {
        let original = before.findIndex((value, i) => {
          work.visit();
          return !used.has(i) && Object.is(value, entry);
        });
        if (original < 0) {
          const tokens = boundaryValues(shape.element, entry, references, work, graphBoundaries);
          if (tokens.length) {
            const candidates = before.flatMap((value, i) =>
              !used.has(i) &&
              sameIdentityMultiset(
                tokens,
                boundaryValues(shape.element, value, references, work, graphBoundaries),
                work,
              )
                ? [i]
                : [],
            );
            if (candidates.length !== 1) throw new Error('ambiguous protected list item');
            original = candidates[0]!;
          } else if (graphBoundaries) {
            const conditions = graphRowValues(
              shape.element,
              entry,
              references,
              work,
              graphBoundaries,
            );
            const candidates = before.flatMap((value, i) =>
              !used.has(i) &&
              boundaryValues(shape.element, value, references, work, graphBoundaries).length ===
                0 &&
              sameIdentityMultiset(
                conditions,
                graphRowValues(shape.element, value, references, work, graphBoundaries),
                work,
              )
                ? [i]
                : [],
            );
            if (candidates.length === 1) original = candidates[0]!;
            else if (candidates.includes(index)) original = index;
          } else if (!used.has(index)) original = index;
        }
        if (original >= 0) used.add(original);
        assertValue(
          shape.element,
          original >= 0 ? before[original] : undefined,
          entry,
          context,
          references,
          work,
          graphOperands,
          graphBoundaries,
        );
      }
      return;
    }
    case 'record':
    case 'object': {
      if (next === null || typeof next !== 'object' || Array.isArray(next))
        throw new Error(shape.kind === 'record' ? 'expected keyed entries' : 'expected an object');
      const entries = Object.entries(next);
      const before =
        previous && typeof previous === 'object' && !Array.isArray(previous)
          ? (previous as Record<string, unknown>)
          : {};
      if (shape.kind === 'object') {
        for (const [key, child] of Object.entries(shape.fields)) {
          if (!child.optional && !Object.hasOwn(next, key))
            throw new Error(`missing required field '${key}'`);
        }
      }
      const previousShape = selectDefinitionSchema(schema, previous, references, work);
      for (const [key, old] of Object.entries(before)) {
        if (Object.hasOwn(next, key)) continue;
        const child =
          previousShape.kind === 'object'
            ? previousShape.fields[key]
            : previousShape.kind === 'record'
              ? previousShape.value
              : undefined;
        if (!child) throw new Error(`unknown definition field '${key}' must be preserved`);
        assertNoBoundaryRemoval(child, old, references, work, graphBoundaries);
      }
      for (const [key, entry] of entries) {
        if (shape.kind === 'object' && !Object.hasOwn(shape.fields, key)) {
          if (!Object.hasOwn(before, key) || !Object.is(before[key], entry))
            throw new Error(`unknown definition field '${key}' must be preserved`);
          continue;
        }
        // 技能定义的 skillId 是身份；其他结构上的同名字段仍可能是可更换的技能引用。
        const skillIdentity =
          key === 'skillId' &&
          Object.hasOwn(next, 'actionGraph') &&
          Object.hasOwn(before, 'actionGraph');
        if (
          shape.kind === 'object' &&
          context === 'definition' &&
          (['slug', 'key', 'gameId'].includes(key) || skillIdentity)
        ) {
          if (!Object.hasOwn(before, key) || !Object.is(before[key], entry))
            throw new Error(`definition identity '${key}' is read-only`);
          continue;
        }
        if (
          shape.kind === 'object' &&
          context === 'definition' &&
          isReadonlyDefinitionSlot(shape.fields[key]!) &&
          !Object.is(before[key], entry)
        )
          throw new Error('this field cannot be changed in a field control');
        const prior = before[key];
        assertValue(
          shape.kind === 'object' ? shape.fields[key]! : shape.value,
          prior,
          entry,
          context,
          references,
          work,
          graphOperands,
          graphBoundaries,
        );
      }
      return;
    }
    case 'graph':
      if (
        context === 'definition' &&
        previous === undefined &&
        schema.optional &&
        isEmptyDefinitionActionGraph(next)
      )
        return;
      if (Object.is(previous, next)) return;
      throw new Error('this field cannot be changed in a field control');
    case 'condition':
    case 'opaque':
    case 'union':
      if (Object.is(previous, next)) return;
      throw new Error('this field cannot be changed in a field control');
  }
}

/** Omitting an optional container cannot remove a graph/resource/unsupported subtree. */
function assertNoBoundaryRemoval(
  schema: DefinitionFieldSchema,
  previous: unknown,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork,
  graphBoundaries?: GraphContainerBoundaries,
): void {
  work.visit();
  if (previous === undefined) return;
  schema = resolveDefinitionSchema(schema, references);
  if (graphBoundaries?.sequences.has(schema) && isEmptyGraphSequence(previous)) return;
  if (graphBoundaries?.conditions.has(schema) && !containsOpaqueGraphBoundary(previous, work))
    return;
  if (containsOpaqueGraphBoundary(previous, work))
    throw new Error('this field cannot be changed in a field control');
  const shape = selectDefinitionSchema(schema, previous, references, work);
  if (['graph', 'opaque', 'condition'].includes(shape.kind))
    throw new Error('this field cannot be changed in a field control');
  if (shape.kind === 'object' && previous && typeof previous === 'object')
    for (const [key, child] of Object.entries(shape.fields))
      assertNoBoundaryRemoval(
        child,
        (previous as Record<string, unknown>)[key],
        references,
        work,
        graphBoundaries,
      );
  if (shape.kind === 'record' && previous && typeof previous === 'object')
    for (const value of Object.values(previous))
      assertNoBoundaryRemoval(shape.value, value, references, work, graphBoundaries);
  if (shape.kind === 'array' && Array.isArray(previous))
    for (const value of previous)
      assertNoBoundaryRemoval(shape.element, value, references, work, graphBoundaries);
  if (shape.kind === 'tuple' && Array.isArray(previous))
    previous.forEach((value, index) =>
      assertNoBoundaryRemoval(shape.elements[index]!, value, references, work, graphBoundaries),
    );
}

function boundaryValues(
  schema: DefinitionFieldSchema,
  value: unknown,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork,
  graphBoundaries?: GraphContainerBoundaries,
): unknown[] {
  work.visit();
  if (value === undefined) return [];
  schema = resolveDefinitionSchema(schema, references);
  if (graphBoundaries?.sequences.has(schema)) return isEmptyGraphSequence(value) ? [] : [value];
  if (graphBoundaries?.conditions.has(schema)) return graphConditionBoundaries(value, work);
  if (isGraphInputReference(value)) return [value];
  const shape = selectDefinitionSchema(schema, value, references, work);
  if (shape.kind === 'timeScaleCurve') return timeScaleCurveBoundaryValues(value);
  if (['graph', 'opaque', 'condition'].includes(shape.kind)) return [value];
  if (!value || typeof value !== 'object') return [];
  if (shape.kind === 'object')
    return [
      ...Object.entries(shape.fields).flatMap(([key, child]) =>
        boundaryValues(
          child,
          (value as Record<string, unknown>)[key],
          references,
          work,
          graphBoundaries,
        ),
      ),
      ...Object.entries(value).flatMap(([key, child]) =>
        !Object.hasOwn(shape.fields, key) && containsOpaqueGraphBoundary(child, work)
          ? [child]
          : [],
      ),
    ];
  if (shape.kind === 'record')
    return Object.values(value).flatMap(entry =>
      boundaryValues(shape.value, entry, references, work, graphBoundaries),
    );
  if (shape.kind === 'array' && Array.isArray(value))
    return value.flatMap(entry =>
      boundaryValues(shape.element, entry, references, work, graphBoundaries),
    );
  if (shape.kind === 'tuple' && Array.isArray(value))
    return value.flatMap((entry, index) =>
      boundaryValues(shape.elements[index]!, entry, references, work, graphBoundaries),
    );
  return [];
}
function graphRowValues(
  schema: DefinitionFieldSchema,
  value: unknown,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork,
  boundaries: GraphContainerBoundaries,
): unknown[] {
  work.visit();
  schema = resolveDefinitionSchema(schema, references);
  if (boundaries.conditions.has(schema) || boundaries.sequences.has(schema))
    return value === undefined ? [] : [value];
  if (schema.kind === 'object' && value && typeof value === 'object')
    return Object.entries(schema.fields).flatMap(([key, child]) =>
      graphRowValues(child, (value as Record<string, unknown>)[key], references, work, boundaries),
    );
  return [];
}

/** 行表单不展开条件节点；删除或重排行时保留已连接的输入，常量不占用连线。 */
function graphConditionBoundaries(value: unknown, work: FieldTraversalWork): unknown[] {
  work.visit();
  if (!value || typeof value !== 'object') return [];
  if (
    isGraphInputReference(value) ||
    Object.hasOwn(value, '$sequence') ||
    Object.hasOwn(value, 'actionGraph')
  )
    return [value];
  return Object.values(value).flatMap(child => graphConditionBoundaries(child, work));
}

function sameIdentityMultiset(
  before: readonly unknown[],
  after: readonly unknown[],
  work: FieldTraversalWork,
): boolean {
  const remaining = [...before];
  for (const value of after) {
    const index = remaining.findIndex(entry => {
      work.visit();
      return Object.is(entry, value);
    });
    if (index < 0) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

function containsOpaqueGraphBoundary(value: unknown, work: FieldTraversalWork): boolean {
  work.visit();
  if (!value || typeof value !== 'object') return false;
  const object = value as Record<string, unknown>;
  return (
    Object.hasOwn(object, 'actionGraph') ||
    Object.hasOwn(object, '$sequence') ||
    (['valueNode', 'conditionNode', 'stringNode'].includes(String(object.kind)) &&
      Object.hasOwn(object, 'nodeId')) ||
    Object.values(object).some(child => containsOpaqueGraphBoundary(child, work))
  );
}

function isGraphInputReference(value: unknown): boolean {
  return (
    !!value &&
    typeof value === 'object' &&
    ['valueNode', 'conditionNode', 'stringNode'].includes(
      String((value as Record<string, unknown>).kind),
    ) &&
    Object.hasOwn(value, 'nodeId')
  );
}
