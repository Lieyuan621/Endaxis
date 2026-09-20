import { describe, expect, it } from 'vitest';
import { skillSettings } from './skillSettings';

describe('skillSettings', () => {
  it('publishes the native settings consumed by the combat runtime', () => {
    expect(skillSettings.revision).toBe('1.5.3@10024360-6');
    expect(skillSettings.data).toHaveLength(11);
    expect(skillSettings.enhanceFormulas).toHaveLength(2);
    expect(skillSettings.data.find(item => item.key === '法术爆发伤害倍率')).toEqual({
      key: '法术爆发伤害倍率',
      values: [1.6, 1.6, 1.6, 1.6],
      enhanceFormulaKey: 'Damage',
    });
    expect(skillSettings.data.find(item => item.key === '连击增伤')).toBeUndefined();
    expect(skillSettings.enhanceFormulas.map(formula => formula.key)).toEqual(['Damage', 'Debuff']);
  });
});
