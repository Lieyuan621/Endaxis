import { describe, expect, it } from 'vitest';
import type { TimelineSkillLibraryEntryViewModel } from './timelineEditorViewModel';
import {
  skillLibraryNameEntry,
  skillLibrarySegmentLabel,
  timelineSkillBlockLabel,
  timelineSkillBlockLabelForKey,
  timelineSkillSegmentLabel,
  type TimelineSkillSegmentLabels,
} from './timelineSkillLabels';

const labels: TimelineSkillSegmentLabels = {
  heavyAttack: '重击',
  battleSkill: '战技',
  comboSkill: '连携',
};

function skillLibraryEntry(
  skillType: TimelineSkillLibraryEntryViewModel['skillType'],
  skillKeys: readonly string[],
  nameQualifier?: TimelineSkillLibraryEntryViewModel['nameQualifier'],
): TimelineSkillLibraryEntryViewModel {
  return {
    entryKey: 'test:fixture',
    skillGroupKey: 'test',
    skillType,
    level: 1,
    ...(nameQualifier === undefined ? {} : { nameQualifier }),
    groupPlacementSkillKeys: skillKeys,
    skills: skillKeys.map(skillKey => ({
      skillKey,
      timelineBlockFrames: 30,
      source: { kind: 'operatorSkill', skillGroupKey: 'test', skillKey },
    })),
  };
}

describe('skill sequence labels', () => {
  it('shows the original basic-attack name for a separately grouped enhanced attack', () => {
    const basic = {
      ...skillLibraryEntry('basicAttack', ['basic']),
      entryKey: 'basic',
      skillGroupKey: 'basicAttack',
    };
    const enhanced = {
      ...skillLibraryEntry('basicAttack', ['enhanced'], 'enhanced'),
      entryKey: 'enhanced',
      skillGroupKey: 'enhancedBasicAttack',
    };
    expect(skillLibraryNameEntry(enhanced, [basic, enhanced])).toBe(basic);
    expect(skillLibraryNameEntry(basic, [basic, enhanced])).toBe(basic);
  });
  it('uses operation notation in the skill library', () => {
    const entry = skillLibraryEntry('basicAttack', ['attack-1', 'attack-2', 'attack-3']);

    expect(skillLibrarySegmentLabel(entry, 'attack-1', labels)).toBe('A1');
    expect(skillLibrarySegmentLabel(entry, 'attack-2', labels)).toBe('A2');
    expect(skillLibrarySegmentLabel(entry, 'attack-3', labels)).toBe('重击');
    expect(
      skillLibrarySegmentLabel(
        skillLibraryEntry('battleSkill', ['skill-1', 'skill-2']),
        'skill-2',
        labels,
      ),
    ).toBe('C2');
    expect(
      skillLibrarySegmentLabel(
        skillLibraryEntry('comboSkill', ['combo-1', 'combo-2']),
        'combo-1',
        labels,
      ),
    ).toBe('E1');
  });

  it('uses semantic numbered names on timeline blocks', () => {
    expect(
      timelineSkillSegmentLabel(
        skillLibraryEntry('battleSkill', ['skill-1', 'skill-2']),
        'skill-1',
        labels,
      ),
    ).toBe('战技 1');
    expect(
      timelineSkillSegmentLabel(
        skillLibraryEntry('comboSkill', ['combo-1', 'combo-2']),
        'combo-2',
        labels,
      ),
    ).toBe('连携 2');
  });

  it('does not invent sequence labels for single or unknown skills', () => {
    expect(
      skillLibrarySegmentLabel(skillLibraryEntry('battleSkill', ['skill']), 'skill', labels),
    ).toBe(null);
    expect(
      timelineSkillSegmentLabel(
        skillLibraryEntry('basicAttack', ['attack-1', 'attack-2']),
        'missing',
        labels,
      ),
    ).toBe(null);
  });

  it('marks enhanced timeline blocks with an asterisk', () => {
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('battleSkill', ['enhanced-skill'], 'enhanced'),
        'enhanced-skill',
        labels,
        '战技',
      ),
    ).toBe('战技*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('comboSkill', ['enhanced-combo'], 'enhanced'),
        'enhanced-combo',
        labels,
        '连携',
      ),
    ).toBe('连携*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('basicAttack', ['attack-1', 'heavy-attack'], 'enhanced'),
        'attack-1',
        labels,
        '普攻',
      ),
    ).toBe('A1*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('basicAttack', ['attack-1', 'heavy-attack'], 'enhanced'),
        'heavy-attack',
        labels,
        '普攻',
      ),
    ).toBe('重击*');
  });

  it('marks floating attacks and combos on the timeline without changing library segment names', () => {
    const keys = ['attack-1', 'attack-2', 'attack-3', 'attack-4', 'heavy-attack'];
    const attacks = skillLibraryEntry('basicAttack', keys, 'floating');
    expect(keys.map(key => timelineSkillBlockLabel(attacks, key, labels, '普攻'))).toEqual([
      'A1*',
      'A2*',
      'A3*',
      'A4*',
      '重击*',
    ]);
    expect(skillLibrarySegmentLabel(attacks, keys[0]!, labels)).toBe('A1');
    const combo = skillLibraryEntry('comboSkill', ['combo'], 'floating');
    expect(timelineSkillBlockLabel(combo, 'combo', labels, '连携')).toBe('连携*');
    expect(timelineSkillBlockLabelForKey([combo], 'combo', labels, () => '连携')).toBe('连携*');
  });

  it('names an unplaced routed skill like its timeline block, without guessing ambiguous groups', () => {
    const enhanced = skillLibraryEntry(
      'basicAttack',
      ['attack-1', 'attack-2', 'heavy-attack'],
      'enhanced',
    );
    expect(timelineSkillBlockLabelForKey([enhanced], 'attack-2', labels, () => '普攻')).toBe('A2*');
    expect(
      timelineSkillBlockLabelForKey([enhanced, enhanced], 'attack-2', labels, () => '普攻'),
    ).toBeNull();
  });
});
