import { describe, expect, it } from 'vitest';
import { convertLegacyGlobalConfig } from './globalConfigConversion';
import { validateGlobalConfig } from '../../core/project/scenarioValidation';

describe('旧全局配置转换为 Buff', () => {
  it('将六类数值直接转换为 Buff 属性，百分比只在导入时换算', () => {
    const warnings: string[] = [];
    const config = convertLegacyGlobalConfig(
      {
        presetId: 'combo-cdr-50',
        customModifiers: [
          {
            kind: 'operatorStat',
            modifier: 'cooldownReductionPercent',
            skillTypes: 'comboSkill',
            value: 20,
          },
          { kind: 'operatorStat', modifier: 'ultimateGainEfficiency', value: 25 },
          { kind: 'operatorStat', modifier: 'artsIntensity', value: 50 },
          { kind: 'operatorStat', modifier: 'atkPercent', value: 30 },
          { kind: 'operatorStat', modifier: 'critRate', value: 10 },
          { kind: 'operatorStat', modifier: 'critDmg', value: 40 },
        ],
      },
      message => warnings.push(message),
    );
    expect(warnings).toEqual([]);
    expect(config.effects).toEqual([{ effectId: 'combo-cdr-50', enabled: true }]);
    expect(config.customBuff?.attributeModifiers).toEqual([
      { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier', value: 0.8 },
      { attribute: 'UltimateSpGainScalar', slot: 'baseAddition', value: 0.25 },
      { attribute: 'PhysicalAndSpellInflictionEnhance', slot: 'baseAddition', value: 50 },
      { attribute: 'Atk', slot: 'baseMultiplier', value: 0.3 },
      { attribute: 'criticalRate', slot: 'baseAddition', value: 0.1 },
      { attribute: 'criticalDamageIncrease', slot: 'baseAddition', value: 0.4 },
    ]);
    const issues: { path: string; message: string }[] = [];
    validateGlobalConfig(config, 'globalConfig', issues);
    expect(issues).toEqual([]);
  });

  it('不把未支持的技能范围扩大为全局，保留明确的导入警告', () => {
    const warnings: string[] = [];
    const config = convertLegacyGlobalConfig(
      {
        presetId: 'unknown',
        customModifiers: [
          {
            kind: 'operatorStat',
            modifier: 'cooldownReductionPercent',
            skillTypes: 'ultimateSkill',
            value: 20,
          },
          { kind: 'effect', effect: {} },
        ],
      },
      message => warnings.push(message),
    );
    expect(config).toEqual({});
    expect(warnings).toHaveLength(3);
  });
});
