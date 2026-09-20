/** 选择器只按当前语言实际展示的名称搜索，不把稳定 ID 或其他语言别名暴露为搜索词。 */
export function normalizeLocalizedNameSearchText(value: unknown): string {
  return String(value ?? '')
    .toLocaleLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function matchesLocalizedNameSearch(localizedName: string, query: string): boolean {
  const needle = normalizeLocalizedNameSearchText(query);
  return needle.length === 0 || normalizeLocalizedNameSearchText(localizedName).includes(needle);
}
