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
  });

  it('selection rows retain progression while instance rows select persisted levels', () => {
    const definition = gameDataRepository
      .getGears()
      .find(gear =>
        getGearDefinitionSelectionAffixRows(gear, translate).some(row =>
          row.valueText.includes(' / '),
        ),
      );
    expect(definition).toBeDefined();
    const levels = definition!.traits.map(trait => Math.max(0, trait.levelCount - 1));
    const selectionRows = getGearDefinitionSelectionAffixRows(definition!, translate);
    const instanceRows = getGearDefinitionInstanceAffixRows(definition!, levels, translate);

    expect(selectionRows.length).toBeGreaterThan(0);
    expect(selectionRows.some(row => row.valueText.includes(' / '))).toBe(true);
    expect(instanceRows).toHaveLength(selectionRows.length);
    expect(instanceRows.every(row => !row.valueText.includes(' / '))).toBe(true);
    expect(instanceRows.every(row => Number.isInteger(row.traitIndex))).toBe(true);
  });

  it('all current instance rows have a semantic icon or an explicit hollow marker', () => {
    const failures = gameDataRepository.getGears().flatMap(definition =>
      getGearDefinitionInstanceAffixRows(
        definition,
        definition.traits.map(() => 0),
        translate,
      ).flatMap(row =>
        row.src !== '' || row.marker === 'hollow-dot'
          ? []
          : [`${definition.slug}:${row.modifierId}`],
      ),
    );
    expect(failures).toEqual([]);
  });
});
