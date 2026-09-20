/**
 * 在最终定义树上给伤害步骤分配身份。投射物回调可能被多处展开，不能只拿原始动作路径作 key。
 * 使用技能身份和最终结构路径可区分每次展开；不含机器路径、随机数，也不修改输入对象。
 */
export function assignGeneratedDamageStepKeys<T>(definition: T, scope: string): T {
  const seen = new Set<string>();
  function visit(value: unknown, path: string): unknown {
    if (Array.isArray(value)) return value.map((item, index) => visit(item, `${path}/${index}`));
    if (value === null || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    const result = Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, visit(item, `${path}/${key}`)]),
    );
    if (record.kind === 'dealDamage' || record.kind === 'dealFixedDamage') {
      const key =
        typeof record.key === 'string' && record.key.length ? record.key : `${scope}:${path}`;
      if (seen.has(key)) throw new Error(`duplicate damage step key ${key}`);
      seen.add(key);
      result.key = key;
    }
    return result;
  }
  return visit(definition, '') as T;
}
