import { describe, expect, it } from 'vitest';
import { gearDefinitions } from '../../../data/equipment/equipmentDefinitions';
import { gameDataRepository } from '../../../data/gameDataRepository';
import {
  gearMatchesAffixFilter,
  gearMatchesOperatorAttributes,
  getGearAffixModifierIds,
} from './gearSelectionFilters';

const t = (key: string) => key;

describe('gearSelectionFilters', () => {
  it('matches current definitions by projected affix identity without legacy templates', () => {
    const definitionsWithAttack = gearDefinitions.filter(definition =>
      gearMatchesAffixFilter(definition, 'attack', t),
    );

    expect(definitionsWithAttack.length).toBeGreaterThan(0);
    expect(
      definitionsWithAttack.every(definition => definition.slug.startsWith('item_equip_')),
    ).toBe(true);
    expect(
      definitionsWithAttack.every(definition =>
        getGearAffixModifierIds(definition, t).has('attack'),
      ),
    ).toBe(true);
  });

  it('keeps ALL as a presentation-only pass-through filter', () => {
    expect(gearDefinitions.every(definition => gearMatchesAffixFilter(definition, 'ALL', t))).toBe(
      true,
    );
  });

  it('projects the legacy-compatible attribute highlight from current definitions', () => {
    const perlica = gameDataRepository.getOperator('perlica')!;
    const matching = gearDefinitions.filter(definition =>
      gearMatchesOperatorAttributes(definition, perlica),
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(
      matching.every(definition =>
        definition.traits.some(trait =>
          (trait.modifiers ?? []).some(modifier => modifier.kind === 'attribute'),
        ),
      ),
    ).toBe(true);
  });
});
