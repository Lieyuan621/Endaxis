import { toRaw } from 'vue';

/** Game definitions are plain records/arrays; immutable edits may embed Vue proxies at any depth. */
export function cloneEditorDefinition<T>(value: T): T {
  const seen = new WeakMap<object, object>();
  function unwrap(input: unknown): unknown {
    if (input === null || typeof input !== 'object') return input;
    const raw = toRaw(input);
    if (seen.has(raw)) return seen.get(raw);
    if (Array.isArray(raw)) {
      const result: unknown[] = [];
      seen.set(raw, result);
      for (const item of raw) result.push(unwrap(item));
      return result;
    }
    const result: Record<string, unknown> = {};
    seen.set(raw, result);
    for (const [key, item] of Object.entries(raw)) {
      Object.defineProperty(result, key, {
        value: unwrap(item),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return result;
  }
  return structuredClone(unwrap(value)) as T;
}
