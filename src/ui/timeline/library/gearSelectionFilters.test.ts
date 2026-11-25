import { expect, it } from 'vitest';
import { gearDefinitions } from '../../../data/equipment/equipmentDefinitions';
import { perlica } from '../../../data/operators/perlica.generated';
import {
  gearMatchesAffixFilter,
  gearMatchesAttributeFilter,
  gearMatchesOperatorAttributes,
} from './gearSelectionFilters';

function gearWithAttributes(...attributes: ('main' | 'secondary' | 'strength')[]) {
  const gear = gearDefinitions[0]!;
  return {
    ...gear,
    traits: [
      {
        ...gear.traits[0]!,
        modifiers: attributes.map(attribute => ({
          kind: 'attribute' as const,
          attribute,
          operation: 'flat' as const,
          value: 1,
        })),
      },
    ],
  };
}

it('matches only primary or primary-plus-secondary attributes', () => {
  expect(gearMatchesOperatorAttributes(gearWithAttributes('main'), perlica)).toBe(true);
  expect(gearMatchesOperatorAttributes(gearWithAttributes('secondary'), perlica)).toBe(false);
  expect(gearMatchesOperatorAttributes(gearWithAttributes('main', 'secondary'), perlica)).toBe(
    true,
  );
  expect(gearMatchesOperatorAttributes(gearWithAttributes('main', 'strength'), perlica)).toBe(
    false,
  );
  expect(gearMatchesOperatorAttributes(gearWithAttributes('main'), null)).toBe(false);
});

it('separates flat attributes from percentage affixes with the same name', () => {
  const flatOnly = gearDefinitions.find(
    gear => gear.slug === 'item_equip_t4_parts_wuling00_body_02',
  )!;
  const flatAndPercent = gearDefinitions.find(
    gear => gear.slug === 'item_equip_t4_parts_wuling00_body_03',
  )!;
  const fixedAttributes = gearDefinitions.find(
    gear => gear.slug === 'item_equip_t4_suit_criti01_body_01',
  )!;
  const translate = (key: string) => key;

  expect(gearMatchesAttributeFilter(flatOnly, ['primary_ability'])).toBe(true);
  expect(gearMatchesAttributeFilter(flatOnly, ['secondary_ability'])).toBe(true);
  expect(gearMatchesAttributeFilter(flatOnly, ['primary_ability', 'secondary_ability'])).toBe(true);
  expect(gearMatchesAttributeFilter(flatOnly, ['primary_ability', 'strength'])).toBe(false);
  expect(gearMatchesAffixFilter(flatOnly, 'primary_ability', translate)).toBe(false);
  expect(gearMatchesAffixFilter(flatOnly, 'secondary_ability', translate)).toBe(false);

  expect(gearMatchesAttributeFilter(flatAndPercent, ['secondary_ability'])).toBe(true);
  expect(gearMatchesAffixFilter(flatAndPercent, 'secondary_ability', translate)).toBe(true);
  expect(gearMatchesAffixFilter(flatAndPercent, 'primary_ability', translate)).toBe(false);

  expect(gearMatchesAttributeFilter(fixedAttributes, ['strength'])).toBe(true);
  expect(gearMatchesAttributeFilter(fixedAttributes, ['agility'])).toBe(true);
  expect(gearMatchesAttributeFilter(fixedAttributes, ['strength', 'agility'])).toBe(true);
  expect(gearMatchesAttributeFilter(fixedAttributes, ['strength', 'primary_ability'])).toBe(false);
  expect(gearMatchesAttributeFilter(fixedAttributes, [])).toBe(true);
});
