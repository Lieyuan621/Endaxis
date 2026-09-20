import { equipmentFixture } from './sourceFixtures.ts';

import { describe, expect, it } from 'vitest';

import { parseEquipmentItemSources, resolveEquipmentAttributeModifiers } from '../src/index.ts';

interface EquipmentFixture {
  equipmentId: string;
  equipTableEntry: unknown;
  itemTableEntry: unknown;
}

const fixture = equipmentFixture() as EquipmentFixture;

describe('单件装备属性修正', () => {
  it('联合读取 ItemTable 身份与 EquipTable 战斗修正，并保留原生枚举证据', () => {
    const [equipment] = parseEquipmentItemSources(
      { [fixture.equipmentId]: fixture.equipTableEntry },
      { [fixture.equipmentId]: fixture.itemTableEntry },
      [fixture.equipmentId],
    );

    expect(equipment).toMatchObject({
      equipmentId: fixture.equipmentId,
      domainId: 'domain_1',
      suitId: '',
      minimumWearLevel: 10,
      partType: 'Body',
      nativePartType: 0,
      identity: {
        itemId: fixture.equipmentId,
        iconId: fixture.equipmentId,
        rarity: 1,
        itemType: 6,
      },
    });
    expect(equipment!.attributeModifiers).toHaveLength(4);
    expect(equipment!.displayAttributeModifiers).toEqual([
      expect.objectContaining({
        displayIndex: 1,
        enhancedAttributeIndex: 1,
        compositeAttribute: '',
        attributeType: 'Str',
        attributeValues: [15],
      }),
      expect.objectContaining({
        displayIndex: 2,
        enhancedAttributeIndex: 2,
        compositeAttribute: '',
        attributeType: 'Agi',
        attributeValues: [10],
      }),
      expect.objectContaining({
        displayIndex: 3,
        enhancedAttributeIndex: 3,
        compositeAttribute: '',
        attributeType: 'MaxHp',
        attributeValues: [46.3273721859878],
      }),
    ]);
    expect(equipment!.attributeModifiers[3]).toEqual({
      sourcePath: `EquipTable.${fixture.equipmentId}.equipAttrModifiers[3]`,
      attributeIndex: 3,
      modifyAttributeType: 'Specific',
      attributeType: 'MaxHp',
      formulaItem: 'BaseFinalAddition',
      attributeValues: [46.3273721859878, 46.3273721859878, 46.3273721859878, 46.3273721859878],
      nativeModifyAttributeType: 0,
      nativeAttributeType: 1,
      nativeModifierType: 7,
    });
  });

  it('按 attrIndex 精确选择档位，缺省为 0 且越界失败', () => {
    const [equipment] = parseFixture();
    const resolved = resolveEquipmentAttributeModifiers(equipment!, new Map([[3, 2]]));
    expect(resolved[0]).toMatchObject({ attributeIndex: 0, enhancementLevel: 0, value: 8 });
    expect(resolved[3]).toMatchObject({
      attributeIndex: 3,
      enhancementLevel: 2,
      value: 46.3273721859878,
    });

    expect(() => resolveEquipmentAttributeModifiers(equipment!, new Map([[3, 4]]))).toThrow(
      'attrValues: no value for enhancement level 4',
    );
  });

  it('拒绝身份错配、未知枚举和源字段漂移', () => {
    const mismatched = structuredClone(fixture.equipTableEntry) as Record<string, unknown>;
    mismatched.itemId = 'other';
    expect(() => parseFixture(mismatched)).toThrow('.itemId: expected');

    const unknownEnum = structuredClone(fixture.equipTableEntry) as {
      equipAttrModifiers: Record<string, unknown>[];
    };
    unknownEnum.equipAttrModifiers[0]!.modifierType = 2;
    expect(() => parseFixture(unknownEnum)).toThrow('unknown ModifierType value 2');

    const unknownPartType = structuredClone(fixture.equipTableEntry) as Record<string, unknown>;
    unknownPartType.partType = 6;
    expect(() => parseFixture(unknownPartType)).toThrow('unknown Beyond.GEnums.PartType value 6');

    const drifted = structuredClone(fixture.equipTableEntry) as Record<string, unknown>;
    drifted.futureField = true;
    expect(() => parseFixture(drifted)).toThrow('unexpected fields');

    const missingDisplay = structuredClone(fixture.equipTableEntry) as Record<string, unknown>;
    missingDisplay.displayAttrModifiers = [];
    expect(() => parseFixture(missingDisplay)).toThrow(
      '.displayAttrModifiers: expected at least one display modifier',
    );
  });
});

function parseFixture(equipTableEntry: unknown = fixture.equipTableEntry) {
  return parseEquipmentItemSources(
    { [fixture.equipmentId]: equipTableEntry },
    { [fixture.equipmentId]: fixture.itemTableEntry },
    [fixture.equipmentId],
  );
}
