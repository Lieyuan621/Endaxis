import { describe, expect, it } from 'vitest';
import {
  findLibrarySkillByType,
  findLibrarySkillForPlaceRematch,
  getLibrarySkillTypeFromHotkeyCode,
  getTrackIndexFromHotkeyCode,
  getTrackIndexFromHotkeyEvent,
  getTrackIndexFromHotkeyKey,
  LIBRARY_SKILL_HOTKEY_TYPES,
} from './librarySkillHotkeys';

describe('librarySkillHotkeys', () => {
  it('maps Digit1–6 to the six skill types in order', () => {
    expect(getLibrarySkillTypeFromHotkeyCode('Digit1')).toBe('basicAttack');
    expect(getLibrarySkillTypeFromHotkeyCode('Digit2')).toBe('battleSkill');
    expect(getLibrarySkillTypeFromHotkeyCode('Digit3')).toBe('comboSkill');
    expect(getLibrarySkillTypeFromHotkeyCode('Digit4')).toBe('ultimate');
    expect(getLibrarySkillTypeFromHotkeyCode('Digit5')).toBe('dive');
    expect(getLibrarySkillTypeFromHotkeyCode('Digit6')).toBe('finisher');
    expect(LIBRARY_SKILL_HOTKEY_TYPES).toHaveLength(6);
  });

  it('returns null for unrelated key codes', () => {
    expect(getLibrarySkillTypeFromHotkeyCode('Digit7')).toBeNull();
    expect(getLibrarySkillTypeFromHotkeyCode('KeyA')).toBeNull();
  });

  it('maps F1–F4 to track indices 0–3', () => {
    expect(getTrackIndexFromHotkeyKey('F1')).toBe(0);
    expect(getTrackIndexFromHotkeyKey('F4')).toBe(3);
    expect(getTrackIndexFromHotkeyKey('f2')).toBe(1);
    expect(getTrackIndexFromHotkeyKey('F5')).toBeNull();
    expect(getTrackIndexFromHotkeyCode('F3')).toBe(2);
    expect(getTrackIndexFromHotkeyEvent({ code: 'F1', key: 'F1' })).toBe(0);
    expect(getTrackIndexFromHotkeyEvent({ code: '', key: 'F2' })).toBe(1);
  });

  it('finds the first visible library skill of a type', () => {
    const library = [
      { id: 'seg', type: 'basicAttack', hiddenInLibraryGrid: true },
      { id: 'group', type: 'basicAttack', kind: 'attack_group' },
      { id: 'variant', type: 'basicAttack' },
      { id: 'ult', type: 'ultimate' },
    ];
    expect(findLibrarySkillByType(library, 'basicAttack')?.id).toBe('group');
    expect(findLibrarySkillByType(library, 'ultimate')?.id).toBe('ult');
    expect(findLibrarySkillByType(library, 'dive')).toBeNull();
  });

  it('rematches place-mode skills by id, then skill identity, then type', () => {
    const library = [
      { id: 'a-ba', type: 'basicAttack', skillKey: 'basicAttack' },
      { id: 'a-bs', type: 'battleSkill', skillKey: 'battleSkill' },
      { id: 'a-var', type: 'battleSkill', skillKey: 'enhancedBattle' },
      {
        id: 'a-enhanced-ba',
        type: 'basicAttack',
        skillKey: 'laevatain-basic-attack-during-ultimate',
        skillId: 'laevatain-basic-attack-during-ultimate',
      },
    ];
    expect(
      findLibrarySkillForPlaceRematch(library, {
        id: 'a-enhanced-ba',
        type: 'basicAttack',
        // Missing skillKey must not fall back to the first basicAttack.
      })?.id,
    ).toBe('a-enhanced-ba');
    expect(
      findLibrarySkillForPlaceRematch(library, {
        id: 'other-enhanced-ba',
        type: 'basicAttack',
        skillId: 'laevatain-basic-attack-during-ultimate',
      })?.id,
    ).toBe('a-enhanced-ba');
    expect(
      findLibrarySkillForPlaceRematch(library, {
        id: 'other-var',
        type: 'battleSkill',
        skillKey: 'enhancedBattle',
      })?.id,
    ).toBe('a-var');
    expect(
      findLibrarySkillForPlaceRematch(library, {
        id: 'other-bs',
        type: 'battleSkill',
        skillKey: 'missingKey',
      })?.id,
    ).toBe('a-bs');
    expect(
      findLibrarySkillForPlaceRematch(library, { id: 'x', type: 'dive', skillKey: 'dive' }),
    ).toBeNull();
  });
});
