import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import zh from '../../i18n/locales/zh-CN.json';
import { operationName } from './operationNames';
import type { TimelineSkillLibraryEntryViewModel } from './timelineEditorViewModel';
import {
  skillLibraryNameEntry,
  indexSkillLibrarySegments,
  skillLibrarySegmentLabel,
  timelineSkillBlockLabel,
  timelineSkillSegmentLabel,
  type TimelineSkillSegmentLabels,
} from './timelineSkillLabels';

const i18n = createI18n({ legacy: false, locale: 'zh', messages: { zh } }).global;
const labels: TimelineSkillSegmentLabels = {
  heavyAttack: '重击',
  battleSkill: '战技',
  comboSkill: '连携',
  ultimate: '终结技',
  formatName: (key, baseName, short) => operationName(key, baseName, short, i18n),
};

function skillLibraryEntry(
  operationType: TimelineSkillLibraryEntryViewModel['operationType'],
  skillKeys: readonly string[],
  nameKey?: TimelineSkillLibraryEntryViewModel['nameKey'],
): TimelineSkillLibraryEntryViewModel {
  return {
    entryKey: 'test:fixture',
    skillGroupKey: 'test',
    operationType,
    ...(nameKey === undefined ? {} : { nameKey }),
    groupPlacementSkillKeys: skillKeys,
    skills: skillKeys.map(skillKey => ({
      skillKey,
      timelineBlockFrames: 30,
      source: { kind: 'operatorSkill', skillGroupKey: 'test', skillKey },
    })),
  };
}

describe('skill sequence labels', () => {
  it('反向索引只收录可见段，保留多入口并使用入口自己的名称和段号', () => {
    const first = skillLibraryEntry('basicAttack', ['one', 'two', 'end'], 'skillNames.floating');
    const second = skillLibraryEntry('battleSkill', ['two'], 'skillNames.replacement');
    const index = indexSkillLibrarySegments([first, second]);
    expect(index.get('two')).toEqual([first, second]);
    expect(index.get('internal')).toBeUndefined();
    expect(timelineSkillBlockLabel(index.get('two')![0]!, 'two', labels, '普攻')).toBe('A2*');
    expect(timelineSkillBlockLabel(index.get('two')![1]!, 'two', labels, '战技')).toBe('战技*');
  });

  it('uses the same template for library names and compact timeline names', () => {
    expect(operationName('skillNames.floating', '连携', false, i18n)).toBe('浮空连携');
    expect(operationName('skillNames.replacement', '战技', false, i18n)).toBe('替换战技');
    const replacement = skillLibraryEntry('battleSkill', ['replacement'], 'skillNames.replacement');
    expect(timelineSkillBlockLabel(replacement, 'replacement', labels, '战技')).toBe('战技*');
    const end = skillLibraryEntry('battleSkill', ['end'], 'skillNames.stanceTermination');
    expect(operationName(end.nameKey, '战技', false, i18n)).toBe('姿态中止');
    expect(timelineSkillBlockLabel(end, 'end', labels, '战技')).toBe('姿态中止');
  });

  it('supports arbitrary templates and falls back to the base name for missing translations', () => {
    const custom = createI18n({
      legacy: false,
      locale: 'test',
      messages: {
        test: {
          custom: { name: '自定义{baseName}', shortName: '[{baseName}]' },
        },
      },
    }).global;
    expect(operationName('custom', '终结技 2', true, custom)).toBe('[终结技 2]');
    expect(operationName(undefined, '战技', false, custom)).toBe('战技');
    expect(operationName('missing', '战技', true, custom)).toBe('战技');
  });

  it('labels the two ultimate stages in one group', () => {
    const entry = skillLibraryEntry('ultimate', ['ultimate-1', 'ultimate-2']);
    expect(skillLibrarySegmentLabel(entry, 'ultimate-1', labels)).toBe('U1');
    expect(skillLibrarySegmentLabel(entry, 'ultimate-2', labels)).toBe('U2');
    expect(timelineSkillSegmentLabel(entry, 'ultimate-2', labels)).toBe('终结技 2');
  });
  it('shows the original basic-attack name for a separately grouped enhanced attack', () => {
    const basic = {
      ...skillLibraryEntry('basicAttack', ['basic']),
      entryKey: 'basic',
      skillGroupKey: 'basicAttack',
    };
    const enhanced = {
      ...skillLibraryEntry('basicAttack', ['enhanced'], 'skillNames.enhanced'),
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
        skillLibraryEntry('battleSkill', ['enhanced-skill'], 'skillNames.enhanced'),
        'enhanced-skill',
        labels,
        '战技',
      ),
    ).toBe('战技*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('comboSkill', ['enhanced-combo'], 'skillNames.enhanced'),
        'enhanced-combo',
        labels,
        '连携',
      ),
    ).toBe('连携*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('basicAttack', ['attack-1', 'heavy-attack'], 'skillNames.enhanced'),
        'attack-1',
        labels,
        '普攻',
      ),
    ).toBe('A1*');
    expect(
      timelineSkillBlockLabel(
        skillLibraryEntry('basicAttack', ['attack-1', 'heavy-attack'], 'skillNames.enhanced'),
        'heavy-attack',
        labels,
        '普攻',
      ),
    ).toBe('重击*');
  });

  it('marks floating attacks and combos on the timeline without changing library segment names', () => {
    const keys = ['attack-1', 'attack-2', 'attack-3', 'attack-4', 'heavy-attack'];
    const attacks = skillLibraryEntry('basicAttack', keys, 'skillNames.floating');
    expect(keys.map(key => timelineSkillBlockLabel(attacks, key, labels, '普攻'))).toEqual([
      'A1*',
      'A2*',
      'A3*',
      'A4*',
      '重击*',
    ]);
    expect(skillLibrarySegmentLabel(attacks, keys[0]!, labels)).toBe('A1');
    const combo = skillLibraryEntry('comboSkill', ['combo'], 'skillNames.floating');
    expect(timelineSkillBlockLabel(combo, 'combo', labels, '连携')).toBe('连携*');
  });
});
