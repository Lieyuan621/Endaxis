/**
 * 原生表中的 float32 被部分 JSON 导出器展开成 double 长小数。
 * 只缩写恰好等于 float32 的值，并要求读回 float32 位值相同；真正的 double 保持原值。
 * 返回读取视图，不修改来源文件或共享对象，也不处理生成阶段计算出的数值。
 */
export function normalizeNativeTableNumbers(value: unknown): unknown {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Number.isInteger(value) || Math.fround(value) !== value)
      return value;
    for (let digits = 1; digits <= 9; digits++) {
      const candidate = Number(value.toPrecision(digits));
      if (Math.fround(candidate) === value) return candidate;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeNativeTableNumbers);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeNativeTableNumbers(item)]),
    );
  }
  return value;
}
