/** 字典重命名不覆盖同名项；从条目构建对象，避免特殊键触发原型 setter。 */
export function renameInspectorEntry(
  value: Readonly<Record<string, unknown>>,
  oldKey: string,
  newKey: string,
): Readonly<Record<string, unknown>> {
  if (
    !Object.hasOwn(value, oldKey) ||
    oldKey === newKey ||
    !newKey.trim() ||
    Object.hasOwn(value, newKey)
  )
    return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key === oldKey ? newKey : key, item]),
  );
}

export function nextInspectorEntryKey(value: Readonly<Record<string, unknown>>): string {
  let index = 1;
  while (Object.hasOwn(value, `custom-${index}`)) index++;
  return `custom-${index}`;
}
