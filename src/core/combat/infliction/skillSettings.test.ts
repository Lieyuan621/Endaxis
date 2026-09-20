import { describe, expect, it } from 'vitest';
import {
  createSkillSettingSource,
  SKILL_SETTINGS_SCHEMA_VERSION,
  type SkillSettingsDocument,
} from './skillSettings';

describe('skillSettings', () => {
  it('builds lookup indexes from the statically checked generated subset', () => {
    const index = {
      schemaVersion: SKILL_SETTINGS_SCHEMA_VERSION,
      revision: 'fixture',
      data: [{ key: 'compound', values: [1, 2, 3, 4], enhanceFormulaKey: 'linear' }],
      enhanceFormulas: [{ key: 'linear', kind: 'linear', paramA: 0.25 }],
    } as const satisfies SkillSettingsDocument;
    const source = createSkillSettingSource(index);

    expect(source.getSetting('compound')).toEqual({
      key: 'compound',
      values: [1, 2, 3, 4],
      enhanceFormulaKey: 'linear',
    });
    expect(source.getEnhanceFormula('linear')).toEqual({
      key: 'linear',
      kind: 'linear',
      paramA: 0.25,
    });
  });
});
