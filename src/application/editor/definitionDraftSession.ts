import { copyCustomGraphDocument, freezeGraphDocument } from './immutableGraphDocument';

/** 一个自定义对象及其附属资源共用的草稿历史。提交时才进入项目。 */
export class DefinitionDraftSession<T extends object> {
  readonly #source: T;
  #current: T;
  #editable: boolean;
  readonly #past: T[] = [];
  readonly #future: T[] = [];

  constructor(
    source: T,
    editable = false,
    readonly historyLimit = 30,
  ) {
    if (!Number.isInteger(historyLimit) || historyLimit < 1)
      throw new RangeError('historyLimit must be positive');
    this.#source = freezeGraphDocument(source);
    this.#current = this.#source;
    this.#editable = editable;
    if (editable) this.#current = copyCustomGraphDocument(this.#source);
  }

  get source(): T {
    return this.#source;
  }

  get current(): T {
    return this.#current;
  }

  get editable(): boolean {
    return this.#editable;
  }

  customize(): void {
    if (this.#editable) return;
    this.#current = copyCustomGraphDocument(this.#source);
    this.#editable = true;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  /** 一次字段修改、一次图保存或一次列表操作只产生一条历史。 */
  update(change: (current: T) => T): boolean {
    if (!this.#editable) throw new Error('built-in definition is read-only');
    const next = change(this.#current);
    if (next === this.#current) return false;
    if (next === this.#source)
      throw new Error('definition draft cannot restore the built-in source by reference');
    this.#past.push(this.#current);
    if (this.#past.length > this.historyLimit) this.#past.shift();
    this.#future.length = 0;
    this.#current = freezeGraphDocument(next);
    return true;
  }

  undo(): boolean {
    const previous = this.#past.pop();
    if (!previous) return false;
    this.#future.push(this.#current);
    this.#current = previous;
    return true;
  }

  redo(): boolean {
    const next = this.#future.pop();
    if (!next) return false;
    this.#past.push(this.#current);
    this.#current = next;
    return true;
  }

  /** 保存边界再次复制，弹窗关闭后保留的草稿引用不能改项目存档。 */
  exportDefinition(): T {
    if (!this.#editable) throw new Error('built-in definition is read-only');
    return copyCustomGraphDocument(this.#current);
  }
}

/** 更新草稿中的一个已有字段；经过的每一层都不可变替换，不创建缺失父对象。 */
export function updateDefinitionField<T extends object>(
  current: T,
  path: readonly (string | number)[],
  value: unknown,
  allowNewField = false,
): T {
  if (path.length === 0) throw new Error('definition field path must not be empty');
  function replace(container: unknown, index: number): unknown {
    if (container === null || typeof container !== 'object')
      throw new Error(`definition field parent is missing at ${path.slice(0, index).join('.')}`);
    const key = path[index]!;
    if (!Object.hasOwn(container, key) && !(allowNewField && index === path.length - 1))
      throw new Error(`definition field is missing at ${path.slice(0, index + 1).join('.')}`);
    const oldValue = (container as Record<string | number, unknown>)[key];
    const nextValue = index === path.length - 1 ? value : replace(oldValue, index + 1);
    if (Object.is(oldValue, nextValue)) return container;
    const copy = Array.isArray(container) ? [...container] : { ...container };
    (copy as Record<string | number, unknown>)[key] = nextValue;
    return copy;
  }
  return replace(current, 0) as T;
}

/** 从当前对象已拥有的完整资源复制一份；新资源不共享原图或变量数据。 */
export function duplicateDefinitionRecordResource<T extends object>(
  current: T,
  directory: 'buffDefinitions' | 'abilityEntityDefinitions',
  sourceId: string,
  newId: string,
): T {
  const id = newId.trim();
  if (!id || id !== newId) throw new Error('new resource ID must not be empty or padded');
  const resources = (current as Record<string, unknown>)[directory];
  if (resources === undefined && directory === 'abilityEntityDefinitions')
    throw new Error('this object has no ability entity directory');
  if (
    resources !== undefined &&
    (resources === null || typeof resources !== 'object' || Array.isArray(resources))
  )
    throw new Error('resource directory is invalid');
  const record = (resources ?? {}) as Record<string, unknown>;
  if (!Object.hasOwn(record, sourceId)) throw new Error(`source resource '${sourceId}' is missing`);
  if (Object.hasOwn(record, id)) throw new Error(`resource '${id}' already exists`);
  return updateDefinitionField(
    current,
    [directory],
    {
      ...record,
      [id]: structuredClone(record[sourceId]),
    },
    true,
  );
}

/** 删除前保守查找同对象内对 ID 的直接引用；发现引用就拒绝并指出位置。 */
export function removeUnreferencedDefinitionRecordResource<T extends object>(
  current: T,
  directory: 'buffDefinitions' | 'abilityEntityDefinitions',
  id: string,
): T {
  const record = (current as Record<string, unknown>)[directory];
  if (!record || typeof record !== 'object' || Array.isArray(record) || !Object.hasOwn(record, id))
    throw new Error(`resource '${id}' is missing`);
  const references: string[] = [];
  const seen = new WeakSet<object>();
  function visit(value: unknown, path: readonly (string | number)[]): void {
    if (typeof value === 'string') {
      if (value === id) references.push(path.join('.'));
      return;
    }
    if (value === null || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (path.length === 0 && key === directory) {
        for (const [otherId, other] of Object.entries(child as Record<string, unknown>))
          if (otherId !== id) visit(other, [directory, otherId]);
      } else {
        if (key === id) references.push([...path, key].join('.'));
        visit(child, [...path, Array.isArray(value) ? Number(key) : key]);
      }
    }
  }
  visit(current, []);
  if (references.length)
    throw new Error(`resource '${id}' is still referenced at ${references.slice(0, 5).join(', ')}`);
  const copy = { ...(record as Record<string, unknown>) };
  delete copy[id];
  return updateDefinitionField(current, [directory], copy);
}
