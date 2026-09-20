/** Semantic equality for serializable definition drafts. Object field order is not an edit;
 * array order is. Optional undefined fields have the same meaning as absent fields. */
export function editorDefinitionsEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
    return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => editorDefinitionsEqual(value, right[index]))
    );
  }
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a).filter(key => a[key] !== undefined);
  if (keys.length !== Object.keys(b).filter(key => b[key] !== undefined).length) return false;
  return keys.every(key => Object.hasOwn(b, key) && editorDefinitionsEqual(a[key], b[key]));
}
