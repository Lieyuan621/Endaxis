import type { CombatReceiptValue } from '../../../core/combat/receipt/combatReceipt';

/** 只格式化展示值；战斗回执和统计仍保留原始精度。 */
export function createTimelineBattleLogNumberFormat(locale: string) {
  const valueFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const damageFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return {
    value: (value: CombatReceiptValue): string =>
      typeof value === 'number' && Number.isFinite(value)
        ? valueFormatter.format(value)
        : String(value),
    damage: (value: number): string => damageFormatter.format(value),
  };
}
