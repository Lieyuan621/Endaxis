import { describe, expect, it } from 'vitest';
import { parseSkillCastResourceMetadataSource } from '../src/source/activeSkill.ts';
import {
  parseSkillCostSource,
  projectSkillCastResourceDefinitionSource,
} from '../src/source/skillCost.ts';

const costData = { costType: 'UltimateSp', costValue: 0, atbValueThreshold: 0 };
const castData = { startCdFrame: 9, cooldownTime: -1, maxChargeTime: 1, costData };

describe('native skill cast resource metadata', () => {
  it('preserves confirmation timing and negative cooldown without projecting their meaning', () => {
    expect(parseSkillCastResourceMetadataSource({ castData }, 'callback')).toEqual(castData);
  });
  it('uses the same CostData reader as damage costs', () => {
    const result = parseSkillCastResourceMetadataSource({ castData }, 'callback');
    expect(result.costData).toEqual(parseSkillCostSource(costData, 'damage.costDataList[0]'));
  });
  it('maps VFS CostType integers to resource names', () => {
    expect(parseSkillCostSource({ ...costData, costType: 0 }, 'cost').costType).toBe('UltimateSp');
    expect(parseSkillCostSource({ ...costData, costType: 1 }, 'cost').costType).toBe('Atb');
  });
  it('projects readable resources while preserving threshold and uninterpreted native values', () => {
    expect(
      projectSkillCastResourceDefinitionSource(
        parseSkillCastResourceMetadataSource({ castData }, 'callback'),
        'callback.castData',
      ),
    ).toEqual({
      costFrame: 9,
      cooldownSeconds: -1,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
    });
  });
  it('rejects unknown resource names instead of passing native strings into the contract', () => {
    expect(() =>
      projectSkillCastResourceDefinitionSource(
        { ...castData, costData: { ...costData, costType: 'Unknown' } },
        'callback.castData',
      ),
    ).toThrow("unsupported value 'Unknown'");
  });
  it.each(['startCdFrame', 'cooldownTime', 'maxChargeTime', 'costData'])(
    'rejects missing %s',
    key => {
      const incomplete = { ...castData };
      Reflect.deleteProperty(incomplete, key);
      expect(() =>
        parseSkillCastResourceMetadataSource({ castData: incomplete }, 'callback'),
      ).toThrow(key);
    },
  );
  it('rejects unknown CostData fields rather than silently discarding them', () => {
    expect(() => parseSkillCostSource({ ...costData, extra: 1 }, 'cost')).toThrow(
      'unexpected fields',
    );
  });
});
