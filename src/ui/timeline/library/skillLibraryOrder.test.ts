import { describe, expect, it } from 'vitest';
import type { OperationType } from '../../../core/game-data/operatorDefinition';
import type { TimelineSkillLibraryEntryViewModel } from '../timelineEditorViewModel';
import { orderTimelineSkillLibrary } from './skillLibraryOrder';

function entry(
  key: string,
  operationType: OperationType,
  nameKey?: TimelineSkillLibraryEntryViewModel['nameKey'],
): TimelineSkillLibraryEntryViewModel {
  return {
    entryKey: key,
    skillGroupKey: key,
    operationType,
    ...(nameKey === undefined ? {} : { nameKey }),
    groupPlacementSkillKeys: [key],
    skills: [
      {
        skillKey: key,
        timelineBlockFrames: 1,
        source: { kind: 'operatorSkill', skillGroupKey: key, skillKey: key },
      },
    ],
  };
}

describe('skill library presentation order', () => {
  it('orders semantic actions without changing identity or same-slot declaration order', () => {
    const source = [
      entry('ultimate', 'ultimate'),
      entry('combo-enhanced', 'comboSkill', 'skillNames.enhanced'),
      entry('basic-2', 'basicAttack'),
      entry('finisher', 'finisher'),
      entry('battle-enhanced', 'battleSkill', 'skillNames.enhanced'),
      entry('plunge', 'plungingAttack'),
      entry('combo', 'comboSkill'),
      entry('basic-1', 'basicAttack'),
      entry('battle', 'battleSkill'),
      entry('basic-enhanced', 'basicAttack', 'skillNames.enhanced'),
    ];

    expect(orderTimelineSkillLibrary(source).map(value => value.entryKey)).toEqual([
      'basic-2',
      'basic-1',
      'basic-enhanced',
      'plunge',
      'finisher',
      'battle-enhanced',
      'battle',
      'combo-enhanced',
      'combo',
      'ultimate',
    ]);
  });
});
