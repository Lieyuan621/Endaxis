/**
 * 原生 SkillSetting 中已确认子集进入元素反应计算的静态契约。
 * 完整原生目录只存在于转换运行目录，生产代码只消费生成器类型检查后的子集。
 */
export const SKILL_SETTINGS_SCHEMA_VERSION = 1;

export type InflictionEnhanceFormula =
  | { readonly kind: 'none' }
  | { readonly kind: 'linear'; readonly paramA: number }
  | { readonly kind: 'saturating'; readonly paramA: number; readonly paramB: number };

export interface CompoundStatusSkillSetting {
  readonly values: readonly number[];
  readonly enhanceFormulaKey: string;
}

export interface CompoundStatusSkillSettingSource {
  getSetting(dataKey: string): CompoundStatusSkillSetting | undefined;
  getEnhanceFormula(formulaKey: string): InflictionEnhanceFormula | undefined;
}

export interface SkillSettingsDocument {
  readonly schemaVersion: typeof SKILL_SETTINGS_SCHEMA_VERSION;
  readonly revision: string;
  readonly data: readonly ({ readonly key: string } & CompoundStatusSkillSetting)[];
  readonly enhanceFormulas: readonly ({ readonly key: string } & InflictionEnhanceFormula)[];
}

export function createSkillSettingSource(
  index: SkillSettingsDocument,
): CompoundStatusSkillSettingSource {
  const settings = new Map(index.data.map(entry => [entry.key, entry]));
  const formulas = new Map(index.enhanceFormulas.map(entry => [entry.key, entry]));
  return {
    getSetting: dataKey => settings.get(dataKey),
    getEnhanceFormula: formulaKey => formulas.get(formulaKey),
  };
}
