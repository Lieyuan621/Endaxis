import type { DefinitionFieldSchema } from './fieldSchema';

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
  key?: string,
): DefinitionFieldSchema {
  if (key === 'actionGraph') return { kind: 'graph' };
  if (declared?.kind === 'union') {
    const match = declared.variants.find(variant => {
      if (variant.kind === 'object') {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
        const discriminator = variant.fields.kind;
        if (
          discriminator?.kind === 'enum' &&
          !discriminator.options.includes((value as { kind?: string }).kind ?? '')
        )
          return false;
        // 联合类型也可能按 skillType 等字段区分，不能只识别名为 kind 的字段。
        for (const [name, child] of Object.entries(variant.fields)) {
          const actual = (value as Record<string, unknown>)[name];
          if (
            child.kind === 'enum' &&
            actual !== undefined &&
            !child.options.includes(actual as string | number)
          )
            return false;
        }
        return Object.keys(value).every(name => name in variant.fields);
      }
      if (variant.kind === 'null') return value === null;
      if (variant.kind === 'array') return Array.isArray(value);
      if (variant.kind === 'enum') return variant.options.includes(value as string);
      return variant.kind === typeof value;
    });
    return (
      match ?? { kind: 'opaque', optional: declared.optional, description: declared.description }
    );
  }
  return declared ?? { kind: 'opaque' };
}

export function editableDefault(schema: DefinitionFieldSchema): unknown {
  switch (schema.kind) {
    case 'null':
      return null;
    case 'enum':
      return schema.options.length === 1 ? schema.options[0] : undefined;
    case 'array':
      return [];
    case 'record':
      return {};
    case 'object': {
      const values: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(schema.fields)) {
        if (child.optional) continue;
        const initial = editableDefault(child);
        if (initial === undefined) return undefined;
        values[key] = initial;
      }
      return values;
    }
    case 'union':
      return undefined;
    default:
      return undefined;
  }
}

/** 新条目的临时表单只预填确定的常量与容器；必填数值和多选项必须由用户提供。 */
export function createDefinitionValueDraft(schema: DefinitionFieldSchema): unknown {
  if (schema.kind !== 'object') return editableDefault(schema);
  return Object.fromEntries(
    Object.entries(schema.fields).flatMap(([key, child]) => {
      if (child.optional) return [];
      const value = createDefinitionValueDraft(child);
      return value === undefined ? [] : [[key, value]];
    }),
  );
}

/** 使用正式字段写入边界检查临时表单，未完成或不允许创建的结构不会进入资产历史。 */
export function isCompleteDefinitionValue(schema: DefinitionFieldSchema, value: unknown): boolean {
  try {
    assertEditableDefinitionField(
      { kind: 'object', fields: { value: schema } },
      {},
      ['value'],
      value,
    );
    return value !== undefined;
  } catch {
    return false;
  }
}

export function fieldValueAt(root: unknown, path: readonly (string | number)[]): unknown {
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
): void {
  if (!path.length) throw new Error('cannot replace an entire definition from a field control');
  let schema = declared;
  let value = root;
  for (const [index, key] of path.entries()) {
    schema = fieldSchemaForValue(schema, value);
    if (schema.kind === 'object') {
      if (typeof key !== 'string' || !Object.hasOwn(schema.fields, key))
        throw new Error(`unknown definition field '${String(key)}'`);
      if (key === 'key' || (index === 0 && ['slug', 'gameId', 'skillId'].includes(key)))
        throw new Error(`definition identity '${key}' is read-only`);
      schema = schema.fields[key]!;
      value =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    } else if (schema.kind === 'record') {
      if (typeof key !== 'string' || !key.trim()) throw new Error('record key must not be empty');
      schema = schema.value;
      value =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    } else if (schema.kind === 'array') {
      if (typeof key !== 'number' || !Array.isArray(value) || key < 0 || key >= value.length)
        throw new Error('array item does not exist');
      schema = schema.element;
      value = value[key];
    } else throw new Error(`field path crosses unsupported value at ${index}`);
  }
  if (next === undefined && schema.optional) return;
  assertEditableValue(schema, value, next);
}

function assertEditableValue(
  schema: DefinitionFieldSchema,
  previous: unknown,
  next: unknown,
): void {
  if (next === undefined && schema.optional) return;
  const shape = fieldSchemaForValue(schema, next);
  switch (shape.kind) {
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
      if (!shape.options.includes(next as string | number))
        throw new Error('expected a listed choice');
      return;
    case 'array':
      if (!Array.isArray(next)) throw new Error('expected a list');
      for (const [index, entry] of next.entries())
        assertEditableValue(
          shape.element,
          Array.isArray(previous)
            ? previous.includes(entry)
              ? entry
              : previous[index]
            : undefined,
          entry,
        );
      return;
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
      for (const [key, entry] of entries) {
        if (shape.kind === 'object' && !Object.hasOwn(shape.fields, key))
          throw new Error(`unknown definition field '${key}'`);
        // 技能定义的 skillId 是身份；其他结构上的同名字段仍可能是可更换的技能引用。
        const skillIdentity =
          key === 'skillId' &&
          Object.hasOwn(next, 'actionGraph') &&
          Object.hasOwn(before, 'actionGraph');
        if (shape.kind === 'object' && (['slug', 'key', 'gameId'].includes(key) || skillIdentity)) {
          if (!Object.hasOwn(before, key) || !Object.is(before[key], entry))
            throw new Error(`definition identity '${key}' is read-only`);
          continue;
        }
        assertEditableValue(
          shape.kind === 'object' ? shape.fields[key]! : shape.value,
          before[key],
          entry,
        );
      }
      return;
    }
    case 'graph':
      if (previous === undefined && schema.optional && isEmptyDefinitionActionGraph(next)) return;
      if (Object.is(previous, next)) return;
      throw new Error('this field cannot be changed in a field control');
    case 'condition':
    case 'opaque':
    case 'union':
      if (Object.is(previous, next)) return;
      throw new Error('this field cannot be changed in a field control');
  }
}
