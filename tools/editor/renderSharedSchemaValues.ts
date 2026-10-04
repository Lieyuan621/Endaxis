/** 相同的字段、元数据、来源数组及长文本只声明一次，保留完整取值和属性顺序。 */
import { createHash } from 'node:crypto';

type Value =
  null | boolean | number | string | readonly Value[] | { readonly [key: string]: Value };
interface Part {
  readonly value: Value;
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
  function collect(value: Value): Part {
    const key = JSON.stringify(value);
    if (key === undefined) throw new Error('schema contains a non-JSON value');
    const existing = parts.get(key);
    if (existing) return existing;
    const children = value && typeof value === 'object' ? Object.values(value).map(collect) : [];
    const name = `schema_${createHash('sha256').update(key).digest('hex').slice(0, 12)}`;
    if (names.has(name) && names.get(name) !== key) throw new Error('schema value hash collision');
    names.set(name, key);
    const part: Part = {
      value,
      key,
      children,
      name,
      count: 0,
      shared: false,
    };
    parts.set(key, part);
    return part;
  }
  // 沿用生成器的 JSON 边界，省略对象中尚未赋值的可选属性。
  const roots = values.map(value => collect(JSON.parse(JSON.stringify(value)) as Value));
  const ordered = [...parts.values()].sort(
    (left, right) => right.key.length - left.key.length || (left.key < right.key ? -1 : 1),
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
    const { value } = part;
    if (value === null || typeof value !== 'object') return part.key;
    const renderChild = (child: Value) => render(parts.get(JSON.stringify(child))!);
    if (Array.isArray(value)) return `[${value.map(renderChild).join(',')}]`;
    return `{${Object.entries(value)
      .map(([name, child]) => `${JSON.stringify(name)}:${renderChild(child)}`)
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
      }
    }
  } while (changed);
  const declarations = [...ordered]
    .reverse()
    .filter(part => part.shared)
    .map(
      part =>
        `const ${part.name} = ${render(part, true)}${typeof part.value === 'object' ? ' as const' : ''};`,
    )
    .join('\n');
  return { declarations, expressions: roots.map(part => render(part)) };
}
