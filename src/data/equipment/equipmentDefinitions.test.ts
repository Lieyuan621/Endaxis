import { describe, expect, it } from 'vitest';
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
});
