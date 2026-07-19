import { describe, expect, it } from 'vitest';
import {
  effectKindHasDisplayTypePicker,
  filterEffectOptionGroups,
} from './effectDisplayOptions';

const groups = [
  {
    label: 'attach',
    options: [
      { label: 'heat', value: 'heat_infliction' },
      { label: 'cryo', value: 'cryo_infliction' },
      { label: 'electric', value: 'electric_infliction' },
      { label: 'nature', value: 'nature_infliction' },
    ],
  },
  {
    label: 'burst',
    options: [
      { label: 'heat burst', value: 'heat_burst' },
      { label: 'cryo burst', value: 'cryo_burst' },
      { label: 'electric burst', value: 'electric_burst' },
      { label: 'nature burst', value: 'nature_burst' },
    ],
  },
  {
    label: 'amp',
    options: [
      { label: 'amp arts', value: 'ampBonus:arts' },
      { label: 'amp cryo', value: 'ampBonus:cryo' },
      { label: 'amp heat', value: 'ampBonus:heat' },
    ],
  },
  {
    label: 'other',
    options: [
      { label: 'default', value: 'default' },
      { label: 'damage bonus', value: 'dmgBonus:heat' },
      { label: 'physical damage bonus', value: 'dmgBonus:physical' },
      { label: 'arts damage bonus', value: 'dmgBonus:arts' },
      { label: 'ult', value: 'ultEnergyGain' },
      { label: 'reaction', value: 'combustion' },
      { label: 'physical', value: 'breach' },
      { label: 'physical vulnerability', value: 'vulnerability' },
      { label: 'physical crush', value: 'crush' },
      { label: 'physical lift', value: 'lift' },
      { label: 'physical knockdown', value: 'knockdown' },
      { label: 'custom', value: 'waterspouts' },
      { label: 'crit', value: 'critRate' },
    ],
  },
];

function optionValues(filteredGroups: Array<{ options: Array<{ value: string }> }>) {
  return filteredGroups.flatMap(group => group.options.map(option => option.value));
}

describe('effect display option filtering', () => {
  it('shows only canonical arts infliction display types for infliction effects', () => {
    const values = optionValues(filterEffectOptionGroups(groups, 'infliction'));

    expect(values).toEqual([
      'heat_infliction',
      'cryo_infliction',
      'electric_infliction',
      'nature_infliction',
    ]);
  });

  it('keeps amp presets under the amp editor kind, not status/other', () => {
    expect(optionValues(filterEffectOptionGroups(groups, 'status'))).toEqual([
      'dmgBonus:physical',
      'dmgBonus:arts',
      'waterspouts',
    ]);

    expect(optionValues(filterEffectOptionGroups(groups, 'amp'))).toEqual([
      'ampBonus:arts',
      'ampBonus:heat',
      'ampBonus:cryo',
    ]);

    expect(optionValues(filterEffectOptionGroups(groups, 'ultEnergyGain'))).toEqual([
      'ultEnergyGain',
    ]);
  });

  it('uses four canonical physical anomaly display types', () => {
    expect(optionValues(filterEffectOptionGroups(groups, 'physicalStatus'))).toEqual([
      'breach',
      'crush',
      'lift',
      'knockdown',
    ]);
  });

  it('keeps the current legacy physical vulnerability value displayable without adding it by default', () => {
    expect(
      optionValues(filterEffectOptionGroups(groups, 'physicalStatus', 'vulnerability')),
    ).toEqual(['breach', 'crush', 'lift', 'knockdown', 'vulnerability']);
  });

  it('hides the display-type picker for direct runtime kinds with no variants', () => {
    expect(effectKindHasDisplayTypePicker('consume')).toBe(false);
    expect(effectKindHasDisplayTypePicker('ultEnergyGain')).toBe(false);
    expect(effectKindHasDisplayTypePicker('status')).toBe(true);
    expect(effectKindHasDisplayTypePicker('amp')).toBe(true);
    expect(effectKindHasDisplayTypePicker('reaction')).toBe(true);
  });
});
