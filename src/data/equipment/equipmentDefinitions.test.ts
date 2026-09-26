import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
} from '../../core/game-data/equipmentDefinitionValidation';
import {
  getEquipmentSupport,
  gearDefinitions,
  gearSetDefinitions,
  weaponDefinitions,
} from './equipmentDefinitions';

describe('equipmentDefinitions', () => {
  it('keeps the current native gear and gear-set catalogs self-contained', () => {
    expect(gearDefinitions).toHaveLength(258);
    expect(gearSetDefinitions).toHaveLength(24);
    expect(gearDefinitions.every(definition => definition.slug.startsWith('item_equip_'))).toBe(
      true,
    );
    expect(gearDefinitions.every(definition => Boolean(definition.assetSlug))).toBe(true);
    expect(gearDefinitions.every(definition => definition.iconPath?.endsWith('.webp'))).toBe(true);
    expect(gearSetDefinitions.every(definition => definition.iconPath?.endsWith('.webp'))).toBe(
      true,
    );
    for (const set of gearSetDefinitions) {
      expect(existsSync(join('public', set.iconPath!.slice(1))), set.slug).toBe(true);
    }
    expect(
      gearDefinitions.find(definition => definition.slug === 'item_equip_t4_suit_atk02_hand_02'),
    ).toMatchObject({
      slug: 'item_equip_t4_suit_atk02_hand_02',
      assetSlug: 'item_equip_t4_suit_atk02_hand_01',
      iconPath: '/equipment/atk02/item_equip_t4_suit_atk02_hand_01.webp',
    });
  });

  it('uses native ids as all current weapon and gear slugs', () => {
    expect(weaponDefinitions.length).toBeGreaterThan(0);
    expect(weaponDefinitions.every(definition => definition.slug.startsWith('wpn_'))).toBe(true);
    expect(gearDefinitions.every(definition => definition.slug.startsWith('item_equip_'))).toBe(
      true,
    );
    expect(
      weaponDefinitions.find(definition => definition.slug === 'wpn_funnel_0019'),
    ).toMatchObject({
      slug: 'wpn_funnel_0019',
      assetSlug: 'wpn_artsunit_0019',
    });
  });

  it('registers only structurally valid Next definitions', () => {
    const issues = [
      ...weaponDefinitions.flatMap((definition, index) =>
        validateWeaponDefinition(definition, `$.weapons[${index}]`),
      ),
      ...gearDefinitions.flatMap((definition, index) =>
        validateGearDefinition(definition, `$.gears[${index}]`),
      ),
      ...gearSetDefinitions.flatMap((definition, index) =>
        validateGearSetDefinition(definition, `$.gearSets[${index}]`),
      ),
    ];
    expect(issues).toEqual([]);
  });

  it('keeps every native set reference closed inside the generated set catalog', () => {
    const registered = new Set<string>(gearSetDefinitions.map(definition => definition.slug));
    const referenced = new Set(
      gearDefinitions
        .map(definition => definition.gearSetSlug)
        .filter((slug): slug is string => slug !== undefined),
    );
    for (const slug of referenced) {
      expect(registered.has(slug)).toBe(true);
      expect(getEquipmentSupport('gearSet', slug)).toMatchObject({
        completeness: 'complete',
        issues: [],
      });
    }
  });

  it('keeps generated gear support independent of retired templates', () => {
    for (const definition of gearDefinitions) {
      expect(getEquipmentSupport('gear', definition.slug)).toMatchObject({
        completeness: 'complete',
        issues: [],
      });
    }
    expect(getEquipmentSupport('gear', 'xiranflow-light-armor')).toBeNull();
    const setSlugs: readonly string[] = gearSetDefinitions.map(definition => definition.slug);
    expect(setSlugs.includes('no-set-bonuses')).toBe(false);
  });
});
