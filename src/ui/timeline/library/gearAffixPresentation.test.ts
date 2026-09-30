import { describe, expect, it } from 'vitest';
import { gameDataRepository } from '../../../data/gameDataRepository';
import {
  getGearDefinitionInstanceAffixRows,
  getGearDefinitionSelectionAffixRows,
} from './gearAffixPresentation';

const translate = (key: string) => key;

describe('current gear affix presentation', () => {
  it('uses the native composite display row instead of expanding runtime modifiers', () => {
    const definition = gameDataRepository.getGear('item_equip_t4_suit_atk02_body_04');
    expect(definition).toBeDefined();
    const rows = getGearDefinitionSelectionAffixRows(definition!, translate);
    expect(rows.map(row => row.modifierId)).toEqual(['will', 'strength', 'all_skill_dmg_bonus']);
    expect(rows[2]?.valueText).toBe('+13.8% / +15.2% / +16.6% / +17.9%');
    const levels = definition!.traits.map(trait => Math.max(0, trait.levelCount - 1));
    expect(getGearDefinitionInstanceAffixRows(definition!, levels, translate)[2]?.valueText).toBe(
      '+17.9%',
    );
  });
});
