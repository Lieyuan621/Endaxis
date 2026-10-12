/**
 * 生成定义只保留被显式引用的步骤名称。
 * 全定义扫描一次，避免逐序列删 key 时遗漏天赋/潜能引用。
 */
export function prepareActionGraphIdentities<T>(definition: T): T {
  const referenced = new Set<string>();
  const occupied = new Set<string>();
  function inspect(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(inspect);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const r = value as Record<string, unknown>;
    if (typeof r.stepKey === 'string') referenced.add(r.stepKey);
    if (typeof r.key === 'string') occupied.add(r.key);
    Object.values(r).forEach(inspect);
  }
  inspect(definition);
  const names = new Map<string, string>();
  function name(key: string, kind: string): string {
    if (names.has(key)) return names.get(key)!;
    let index = names.size + 1,
      candidate = `@${kind}${index}`;
    while (occupied.has(candidate)) candidate = `@${kind}${++index}`;
    occupied.add(candidate);
    names.set(key, candidate);
    return candidate;
  }
  function visit(value: unknown): unknown {
    if (Array.isArray(value)) {
      let changed = false;
      const items = value.map(item => {
        const next = visit(item);
        if (next !== item) changed = true;
        return next;
      });
      return changed ? items : value;
    }
    if (!value || typeof value !== 'object') return value;
    let changed = false;
    const r: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const next = visit(item);
      if (next !== item) changed = true;
      r[key] = next;
    }
    if (typeof r.stepKey === 'string' && generated(r.stepKey)) {
      r.stepKey = name(r.stepKey, 'step');
      changed = true;
    }
    if (typeof r.kind === 'string' && r.parameters && typeof r.parameters === 'object') {
      if (typeof r.key === 'string' && generated(r.key)) {
        if (referenced.has(r.key)) r.key = name(r.key, 'step');
        else delete r.key;
        changed = true;
      }
    }
    return changed ? r : value;
  }
  return visit(definition) as T;
}
function generated(value: string): boolean {
  return (
    value.startsWith('SkillData.') ||
    value.includes(':/actionGraph/') ||
    value.includes(':/scheduledSequences/') ||
    value.includes(':/eventListeners/') ||
    value.includes(':/lifecycleSequences/') ||
    /\/call\d+\/(?:dealDamage|once)_\d+$/.test(value)
  );
}
