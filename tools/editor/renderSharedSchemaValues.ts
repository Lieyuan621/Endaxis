/** 相同的字段、元数据、来源数组及长文本只声明一次，保留完整取值和属性顺序。 */
import { createHash } from 'node:crypto';

interface Part {
  readonly kind: 'leaf' | 'array' | 'object';
  readonly propertyNames: readonly string[];
  readonly depth: number;
  readonly key: string;
  readonly name: string;
  readonly children: readonly Part[];
  count: number;
  shared: boolean;
}

export function renderSharedSchemaValues(values: readonly unknown[]): {
  declarations: string;
  expressions: readonly string[];
} {
  const parts = new Map<string, Part>();
  const names = new Map<string, string>();
  const objects = new WeakMap<object, Part>();
  const visiting = new WeakSet<object>();
  const omitted = (value: unknown) =>
    value === undefined || typeof value === 'function' || typeof value === 'symbol';
  function collect(value: unknown): Part {
    const isObject = value !== null && typeof value === 'object';
    if (isObject) {
      const cached = objects.get(value);
      if (cached) return cached;
      if (visiting.has(value)) throw new Error('schema contains a cyclic value');
      visiting.add(value);
    }
    const kind = !isObject ? 'leaf' : Array.isArray(value) ? 'array' : 'object';
    const entries =
      isObject && !Array.isArray(value)
        ? Object.entries(value).filter(([, child]) => !omitted(child))
        : [];
    const propertyNames = entries.map(([name]) => name);
    const children = Array.isArray(value)
      ? Array.from(value, child => collect(omitted(child) ? null : child))
      : entries.map(([, child]) => collect(child));
    // 用子值身份构成结构键，不将递归查询的共享子树先展开成巨型 JSON。
    const key =
      kind === 'leaf'
        ? JSON.stringify(value)
        : JSON.stringify([kind, propertyNames, children.map(child => child.name)]);
    if (key === undefined) throw new Error('schema contains a non-JSON value');
    const existing = parts.get(key);
    if (existing) {
      if (isObject) {
        objects.set(value, existing);
        visiting.delete(value);
      }
      return existing;
    }
    const name = `schema_${createHash('sha256').update(key).digest('hex').slice(0, 12)}`;
    if (names.has(name) && names.get(name) !== key) throw new Error('schema value hash collision');
    names.set(name, key);
    const part: Part = {
      kind,
      propertyNames,
      depth: children.length === 0 ? 0 : 1 + Math.max(...children.map(child => child.depth)),
      key,
      children,
      name,
      count: 0,
      shared: false,
    };
    parts.set(key, part);
    if (isObject) {
      objects.set(value, part);
      visiting.delete(value);
    }
    return part;
  }
  // 沿用生成器的 JSON 边界，省略对象中尚未赋值的可选属性。
  const roots = values.map(collect);
  const ordered = [...parts.values()].sort(
    (left, right) => right.depth - left.depth || (left.key < right.key ? -1 : 1),
  );
  function countUses(): void {
    for (const part of ordered) part.count = 0;
    for (const part of roots) part.count++;
    for (const part of ordered) {
      const copies = part.shared ? Math.min(part.count, 1) : part.count;
      for (const child of part.children) child.count += copies;
    }
  }
  function render(part: Part, declaration = false): string {
    if (part.shared && !declaration) return part.name;
    if (part.kind === 'leaf') return part.key;
    if (part.kind === 'array') return `[${part.children.map(child => render(child)).join(',')}]`;
    return `{${part.propertyNames
      .map((name, index) => `${JSON.stringify(name)}:${render(part.children[index]!)}`)
      .join(',')}}`;
  }
  function worthwhile(part: Part): boolean {
    if (part.count < 2) return false;
    const size = render(part, true).length;
    // 计入声明本身的开销，不为每个重复的小值增加常量。
    return (size - part.name.length) * part.count > size + part.name.length + 22;
  }
  countUses();
  for (const part of [...ordered].reverse()) part.shared = worthwhile(part);
  // 父对象共享后，子值实际出现次数会减少；移除已不再节省体积的声明。
  let changed: boolean;
  do {
    countUses();
    changed = false;
    for (const part of ordered) {
      if (part.shared && !worthwhile(part)) {
        part.shared = false;
        changed = true;
        // 展开父值会增加子值的使用次数；必须重新计数后再决定是否展开子值。
        break;
      }
    }
  } while (changed);
  const declarations = [...ordered]
    .reverse()
    .filter(part => part.shared)
    .map(
      part =>
        `const ${part.name} = ${render(part, true)}${part.kind !== 'leaf' ? ' as const' : ''};`,
    )
    .join('\n');
  return { declarations, expressions: roots.map(part => render(part)) };
}
