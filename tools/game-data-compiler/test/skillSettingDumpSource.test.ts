import { describe, expect, it } from 'vitest';
import { parseSkillSettingResources } from '../../../src/core/game-data/definitionGuards.ts';
import {
  parseSkillSettingDumpSource,
  parseSkillSettingResourceSource,
  renderSkillSettingDocument,
} from '../src/source/skillSettingDumpSource.ts';

const dump = `MonoBehaviour Base
\tfloat atbRecoverInterval = 0.5
\tfloat atbGainEfficiency = 1
\tfloat atbConsumedDefaultUspGainSelf = 0.065
\tfloat atbConsumedDefaultUspGainOther = 0.065
\tSpellInflictionData spellInflictionDataList
\t\tArray Array
\t\tint size = 1
\t\t\t[0]
\t\t\tSpellInflictionData data
\t\t\t\tstring key = "倍率"
\t\t\t\tstring desc = ""
\t\t\t\tvector values
\t\t\t\t\tArray Array
\t\t\t\t\tint size = 4
\t\t\t\t\t\t[0]
\t\t\t\t\t\tfloat data = 1
\t\t\t\t\t\t[1]
\t\t\t\t\t\tfloat data = 1.5
\t\t\t\t\t\t[2]
\t\t\t\t\t\tfloat data = 2
\t\t\t\t\t\t[3]
\t\t\t\t\t\tfloat data = 2.5
\t\t\t\tstring enhanceFormulaKey = "Damage"
\tPhysicalAndSpellInflictionEnhanceFormula physicalAndSpellInflictionEnhanceFormulaList
\t\tArray Array
\t\tint size = 1
\t\t\t[0]
\t\t\tPhysicalAndSpellInflictionEnhanceFormula data
\t\t\t\tstring key = "Damage"
\t\t\t\tint formulaType = 1
\t\t\t\tdouble paramA = 0.01
\t\t\t\tdouble paramB = 1
\tPoiseGuardConfig unrelatedTail
`;

describe('SkillSetting TypeTree source', () => {
  const resources = [
    '\tfloat atbRecoverInterval = 0.5',
    '\tfloat atbGainEfficiency = 1',
    '\tfloat atbConsumedDefaultUspGainSelf = 0.065',
    '\tfloat atbConsumedDefaultUspGainOther = 0.065',
  ].join('\n');

  it('reads native resource scalars without replacing them with constructor defaults', () => {
    expect(parseSkillSettingResourceSource(resources, 'resources')).toEqual({
      atbRecoverInterval: 0.5,
      atbGainEfficiency: 1,
      atbConsumedDefaultUspGainSelf: 0.065,
      atbConsumedDefaultUspGainOther: 0.065,
    });
    expect(
      parseSkillSettingResourceSource(resources.replace('0.5', '0'), 'zero').atbRecoverInterval,
    ).toBe(0);
  });

  it('generated resource JSON requires all finite fields and rejects extras', () => {
    const valid = parseSkillSettingResourceSource(resources, 'fixture');
    expect(parseSkillSettingResources(valid)).toEqual(valid);
    expect(() => parseSkillSettingResources(undefined)).toThrow();
    expect(() => parseSkillSettingResources({ ...valid, atbRecoverInterval: undefined })).toThrow();
    expect(() => parseSkillSettingResources({ ...valid, atbRecoverInterval: '0.5' })).toThrow();
    expect(() => parseSkillSettingResources({ ...valid, unknown: 1 })).toThrow();
  });

  it.each(['NaN', 'Infinity', '-1', '', ' '])('rejects invalid resource values %j', value => {
    expect(() =>
      parseSkillSettingResourceSource(resources.replace('0.5', value), 'invalid'),
    ).toThrow();
  });

  it('rejects missing, nested-only or duplicate resource fields', () => {
    expect(() => parseSkillSettingResourceSource('', 'missing')).toThrow('atbRecoverInterval');
    expect(() =>
      parseSkillSettingResourceSource(
        resources.replace('\tfloat atbRecoverInterval', '\t\tfloat atbRecoverInterval'),
        'nested',
      ),
    ).toThrow();
    expect(() =>
      parseSkillSettingResourceSource(
        `${resources}\n\tfloat atbRecoverInterval = 1.5`,
        'duplicate',
      ),
    ).toThrow();
  });

  it('extracts the exact infliction subset and renders the runtime document', () => {
    const source = parseSkillSettingDumpSource(dump, 'SkillSetting.fixture');
    expect(source).toMatchObject({
      data: [{ key: '倍率', values: [1, 1.5, 2, 2.5], enhanceFormulaKey: 'Damage' }],
      enhanceFormulas: [{ key: 'Damage', formulaType: 'linear', paramA: 0.01, paramB: 1 }],
    });
    expect(JSON.parse(renderSkillSettingDocument(source, 'game@1'))).toMatchObject({
      schemaVersion: 1,
      revision: 'game@1',
      data: source.data,
      enhanceFormulas: source.enhanceFormulas,
    });
  });

  it('rejects truncated columns, missing formulas and non-contiguous rows', () => {
    expect(() =>
      parseSkillSettingDumpSource(
        dump.replace('\t\t\t\t\tint size = 4', '\t\t\t\t\tint size = 3'),
        'columns',
      ),
    ).toThrow('expected four SkillSetting columns');
    expect(() =>
      parseSkillSettingDumpSource(
        dump.replace('enhanceFormulaKey = "Damage"', 'enhanceFormulaKey = "Missing"'),
        'formula',
      ),
    ).toThrow('missing formula Missing');
    expect(() =>
      parseSkillSettingDumpSource(
        dump.replace(
          '\t\t\t[0]\n\t\t\tSpellInflictionData',
          '\t\t\t[1]\n\t\t\tSpellInflictionData',
        ),
        'index',
      ),
    ).toThrow('non-contiguous SkillSetting data index');
  });
});
