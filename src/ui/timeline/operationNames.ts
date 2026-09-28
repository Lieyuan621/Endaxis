/** 放置入口的名称模板；无模板时沿用基础操作名，缺失翻译时不显示原始键。 */
export function operationName(
  nameKey: string | undefined,
  baseName: string,
  short: boolean,
  i18n: {
    te: (key: string) => boolean;
    t: (key: string, values: { baseName: string }) => string;
  },
): string {
  if (nameKey === undefined) return baseName;
  const key = `${nameKey}.${short ? 'shortName' : 'name'}`;
  return i18n.te(key) ? i18n.t(key, { baseName }) : baseName;
}
