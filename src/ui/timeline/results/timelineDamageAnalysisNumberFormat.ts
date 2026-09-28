/** 图表数据保留原始精度，仅在屏幕文本中取整伤害。 */
export function createTimelineDamageAnalysisNumberFormat(locale: string) {
  const damage = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percentage = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const formatDamage = (value: number): string => damage.format(Math.round(value));
  return {
    damage: formatDamage,
    tooltip: (label: string, value: number, percent: number): string =>
      `${label}: ${formatDamage(value)} (${percentage.format(percent)}%)`,
  };
}
