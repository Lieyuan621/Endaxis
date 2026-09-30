import { expect, it } from 'vitest';
import { gearDefinitions } from '../../../data/equipment/equipmentDefinitions';
import { perlica } from '../../../data/operators/perlica.generated';
import { gearMatchesOperatorAttributes } from './gearSelectionFilters';

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
