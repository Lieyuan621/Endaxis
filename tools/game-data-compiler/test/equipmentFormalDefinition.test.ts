import { equipmentFixture } from './sourceFixtures.ts';

import { describe, expect, it } from 'vitest';

import {
  compileEquipmentDefinitionSource,
  parseEquipmentItemSources,
  type EquipmentAttributeModifierSource,
  type EquipmentDisplayAttributeModifierSource,
  type EquipmentItemSource,
} from '../src/index.ts';

interface EquipmentFixture {
  equipmentId: string;
  equipTableEntry: unknown;
  itemTableEntry: unknown;
}

const fixture = equipmentFixture() as EquipmentFixture;

describe('单件装备正式定义组装', () => {
  it('提升基础防御并按原生 attrIndex 保留四档词条', () => {
    const equipment = parseFixture();
    const result = compileEquipmentDefinitionSource(equipment);
    expect(result.definition?.traits[0]?.modifiers[0]?.value).toBe(
      equipment.attributeModifiers[1]?.attributeValues,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.definition).toEqual({
      slug: fixture.equipmentId,
      assetSlug: fixture.equipmentId,
      iconPath: `/equipment/tundra01/${fixture.equipmentId}.webp`,
      slotType: 'armor',
      levelRequirement: 10,
      baseDefense: 8,
      traits: [
        {
          key: 'attribute-1',
          levelCount: 4,
          display: {
            kind: 'modifier',
            modifier: {
              kind: 'attribute',
              attribute: 'strength',
              operation: 'flat',
              value: [15],
            },
          },
          modifiers: [
            {
              kind: 'attribute',
              attribute: 'strength',
              operation: 'flat',
              value: [15, 15, 15, 15],
            },
          ],
        },
        {
          key: 'attribute-2',
          levelCount: 4,
          display: {
            kind: 'modifier',
            modifier: {
              kind: 'attribute',
              attribute: 'agility',
              operation: 'flat',
              value: [10],
            },
          },
          modifiers: [
            {
              kind: 'attribute',
              attribute: 'agility',
              operation: 'flat',
              value: [10, 10, 10, 10],
            },
          ],
        },
        {
          key: 'attribute-3',
          levelCount: 4,
          display: {
            kind: 'modifier',
            modifier: {
              kind: 'panelStat',
              stat: 'healthFlat',
              value: [46.3273721859878],
            },
          },
          modifiers: [
            {
              kind: 'panelStat',
              stat: 'healthFlat',
              value: [46.3273721859878, 46.3273721859878, 46.3273721859878, 46.3273721859878],
            },
          ],
        },
      ],
    });
  });

  it('保留失衡目标增伤身份，并显式审计木桩模型省略项', () => {
    const equipment = parseFixture();
    const damageScale = replaceModifier(equipment.attributeModifiers[1]!, {
      attributeType: 'DamageToBrokenUnitIncrease',
      attributeValues: [0.1, 0.2, 0.3, 0.4],
    });
    const omitted = replaceModifier(equipment.attributeModifiers[2]!, {
      attributeType: 'FireDamageTakenScalar',
      formulaItem: 'BaseFinalMultiplier',
      attributeValues: [0.05, 0.06, 0.07, 0.08],
    });

    const result = compileEquipmentDefinitionSource({
      ...equipment,
      attributeModifiers: [equipment.attributeModifiers[0]!, damageScale, omitted],
      displayAttributeModifiers: [
        replaceDisplayModifier(equipment.displayAttributeModifiers[0]!, {
          attributeType: 'DamageToBrokenUnitIncrease',
          attributeValues: [0.1, 0.2, 0.3, 0.4],
        }),
        replaceDisplayModifier(equipment.displayAttributeModifiers[1]!, {
          compositeAttribute: 'AllDamageTakenScalar',
          attributeValues: [0.95],
        }),
      ],
    });

    expect(result.definition?.traits).toEqual([
      {
        key: 'attribute-1',
        levelCount: 4,
        display: {
          kind: 'modifier',
          modifier: {
            kind: 'damageScale',
            target: 'staggeredEnemy',
            slot: 'baseAddition',
            value: [0.1, 0.2, 0.3, 0.4],
          },
        },
        modifiers: [
          {
            kind: 'damageScale',
            target: 'staggeredEnemy',
            slot: 'baseAddition',
            value: [0.1, 0.2, 0.3, 0.4],
          },
        ],
      },
      {
        key: 'attribute-2',
        levelCount: 4,
        display: {
          kind: 'composite',
          composite: 'allDamageReduction',
          value: [0.95],
        },
        modifiers: [],
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        status: 'scenario-omitted',
        sourcePath: omitted.sourcePath,
        reason: 'playerDamageTakenRequiresEnemyActiveDamage',
      },
    ]);
  });

  it('拒绝产品层未支持的原生槽位和会随精锻变化的基础防御', () => {
    const equipment = parseFixture();
    const changingDefense = replaceModifier(equipment.attributeModifiers[0]!, {
      attributeValues: [8, 9, 10, 11],
    });
    const result = compileEquipmentDefinitionSource({
      ...equipment,
      partType: 'Head',
      nativePartType: 4,
      attributeModifiers: [changingDefense, ...equipment.attributeModifiers.slice(1)],
    });

    expect(result.definition).toBeUndefined();
    expect(result.diagnostics.map(diagnostic => diagnostic.reason)).toEqual([
      'native equipment part Head is not a formal Endaxis gear slot',
      'GearDefinition.baseDefense cannot represent enhancement-dependent values',
    ]);
  });
});

function parseFixture(): EquipmentItemSource {
  return parseEquipmentItemSources(
    { [fixture.equipmentId]: fixture.equipTableEntry },
    { [fixture.equipmentId]: fixture.itemTableEntry },
    [fixture.equipmentId],
  )[0]!;
}

function replaceModifier(
  source: EquipmentAttributeModifierSource,
  patch: Partial<EquipmentAttributeModifierSource>,
): EquipmentAttributeModifierSource {
  return { ...source, ...patch };
}

function replaceDisplayModifier(
  source: EquipmentDisplayAttributeModifierSource,
  patch: Partial<EquipmentDisplayAttributeModifierSource>,
): EquipmentDisplayAttributeModifierSource {
  return { ...source, ...patch };
}
