/**
 * 比较“当前技能模板”与“完整自定义 SkillDefinition”的纯函数差异模块。
 *
 * 编辑器用它显示星号与差异，但它本身不生成或应用 patch，不参与模拟，
 * 也不做本地化。它只回答两个问题：哪里不同、以什么身份对应。
 *
 * 数组匹配策略（保守，不猜相似对象）：
 * - 仅当两边数组的所有元素都是带非空且各自唯一 key 的普通对象时，按稳定
 *   key 匹配；此时顺序变化产生 `moved`，同 key 内容递归比较。
 * - 否则严格按位置匹配；路径段使用 index（而不是 key），表示该匹配不稳定，
 *   重排后可能指向不同对象。
 */

import type { SkillDefinition } from './operatorDefinition';

/** 路径段：对象字段、数组位置索引、稳定 key 三种来源，供 UI 按身份定位。 */
export type SkillDiffPathSegment =
  | { readonly kind: 'field'; readonly name: string }
  | { readonly kind: 'index'; readonly index: number }
  | { readonly kind: 'key'; readonly key: string };

/** 扁平只读差异项；before/after 均为输入值的深拷贝，不与输入共享可变引用。 */
export type SkillDiffEntry =
  | {
      readonly kind: 'removed';
      readonly path: readonly SkillDiffPathSegment[];
      readonly before: unknown;
    }
  | {
      readonly kind: 'added';
      readonly path: readonly SkillDiffPathSegment[];
      readonly after: unknown;
    }
  | {
      readonly kind: 'changed';
      readonly path: readonly SkillDiffPathSegment[];
      readonly before: unknown;
      readonly after: unknown;
    }
  | {
      /** 仅按稳定 key 匹配的数组元素顺序变化时产生。 */
      readonly kind: 'moved';
      readonly path: readonly SkillDiffPathSegment[];
      readonly fromIndex: number;
      readonly toIndex: number;
    };

/**
 * 比较 template 与 custom 两个技能定义，返回确定顺序的扁平差异项：
 * 先按模板原顺序输出涉及模板的差异，再输出 custom 独有的新增项。
 */
export function diffSkillDefinition(
  template: SkillDefinition,
  custom: SkillDefinition,
): readonly SkillDiffEntry[] {
  const entries: SkillDiffEntry[] = [];
  diffValue(template, custom, [], entries);
  return entries;
}

function diffValue(
  a: unknown,
  b: unknown,
  path: readonly SkillDiffPathSegment[],
  out: SkillDiffEntry[],
): void {
  if (isRecord(a) && isRecord(b)) {
    diffRecord(a, b, path, out);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    diffArray(a, b, path, out);
    return;
  }
  if (Array.isArray(a) !== Array.isArray(b) || isRecord(a) !== isRecord(b) || a !== b) {
    out.push({ kind: 'changed', path, before: cloneValue(a), after: cloneValue(b) });
  }
}

function diffRecord(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  path: readonly SkillDiffPathSegment[],
  out: SkillDiffEntry[],
): void {
  for (const key of Object.keys(a)) {
    const segment: SkillDiffPathSegment = { kind: 'field', name: key };
    const childPath = [...path, segment];
    const av = a[key];
    const bv = b[key];
    if (av === undefined) {
      if (bv !== undefined) out.push({ kind: 'added', path: childPath, after: cloneValue(bv) });
      continue;
    }
    if (bv === undefined) {
      out.push({ kind: 'removed', path: childPath, before: cloneValue(av) });
      continue;
    }
    diffValue(av, bv, childPath, out);
  }
  for (const key of Object.keys(b)) {
    if (Object.prototype.hasOwnProperty.call(a, key)) continue;
    const bv = b[key];
    if (bv === undefined) continue;
    const segment: SkillDiffPathSegment = { kind: 'field', name: key };
    out.push({ kind: 'added', path: [...path, segment], after: cloneValue(bv) });
  }
}

function diffArray(
  a: readonly unknown[],
  b: readonly unknown[],
  path: readonly SkillDiffPathSegment[],
  out: SkillDiffEntry[],
): void {
  const keysA = arrayKeys(a);
  const keysB = arrayKeys(b);
  if (keysA !== null && keysB !== null) {
    diffArrayByKey(a, b, keysA, keysB, path, out);
    return;
  }
  diffArrayByPosition(a, b, path, out);
}

/** 返回数组内各元素的稳定 key；存在无 key、空 key 或重复 key 时返回 null（退化为位置匹配）。 */
function arrayKeys(values: readonly unknown[]): readonly string[] | null {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!isRecord(value) || typeof value.key !== 'string' || value.key.length === 0) return null;
    if (seen.has(value.key)) return null;
    seen.add(value.key);
    keys.push(value.key);
  }
  return keys;
}

function diffArrayByKey(
  a: readonly unknown[],
  b: readonly unknown[],
  keysA: readonly string[],
  keysB: readonly string[],
  path: readonly SkillDiffPathSegment[],
  out: SkillDiffEntry[],
): void {
  const indexInB = new Map<string, number>();
  keysB.forEach((key, index) => indexInB.set(key, index));
  const indexInA = new Map<string, number>();
  keysA.forEach((key, index) => indexInA.set(key, index));

  // 模板原顺序：removed / moved / 同 key 内容递归
  for (let index = 0; index < a.length; index += 1) {
    const key = keysA[index]!;
    const keySegment: SkillDiffPathSegment = { kind: 'key', key };
    const childPath = [...path, keySegment];
    const bIndex = indexInB.get(key);
    if (bIndex === undefined) {
      out.push({ kind: 'removed', path: childPath, before: cloneValue(a[index]) });
      continue;
    }
    if (index !== bIndex) {
      out.push({ kind: 'moved', path: childPath, fromIndex: index, toIndex: bIndex });
    }
    diffValue(a[index], b[bIndex], childPath, out);
  }
  // custom 独有项
  for (let index = 0; index < b.length; index += 1) {
    const key = keysB[index]!;
    if (!indexInA.has(key)) {
      const keySegment: SkillDiffPathSegment = { kind: 'key', key };
      out.push({ kind: 'added', path: [...path, keySegment], after: cloneValue(b[index]) });
    }
  }
}

function diffArrayByPosition(
  a: readonly unknown[],
  b: readonly unknown[],
  path: readonly SkillDiffPathSegment[],
  out: SkillDiffEntry[],
): void {
  const common = Math.min(a.length, b.length);
  for (let index = 0; index < common; index += 1) {
    const indexSegment: SkillDiffPathSegment = { kind: 'index', index };
    diffValue(a[index], b[index], [...path, indexSegment], out);
  }
  for (let index = common; index < a.length; index += 1) {
    const indexSegment: SkillDiffPathSegment = { kind: 'index', index };
    out.push({ kind: 'removed', path: [...path, indexSegment], before: cloneValue(a[index]) });
  }
  for (let index = common; index < b.length; index += 1) {
    const indexSegment: SkillDiffPathSegment = { kind: 'index', index };
    out.push({ kind: 'added', path: [...path, indexSegment], after: cloneValue(b[index]) });
  }
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = cloneValue(item);
    return result;
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
