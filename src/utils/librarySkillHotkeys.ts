/** Hotkey digit → library skill `type` (1…6). */
export const LIBRARY_SKILL_HOTKEY_TYPES = [
  'basicAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
  'dive',
  'finisher',
] as const;

type LibrarySkillHotkeyType = (typeof LIBRARY_SKILL_HOTKEY_TYPES)[number];

const DIGIT_CODE_TO_INDEX: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
};

/** Resolve 1…6 from `KeyboardEvent.code`. */
export function getLibrarySkillTypeFromHotkeyCode(code: string): LibrarySkillHotkeyType | null {
  const index = DIGIT_CODE_TO_INDEX[code];
  if (index === undefined) return null;
  return LIBRARY_SKILL_HOTKEY_TYPES[index] ?? null;
}

/** Resolve F1…F4 track index (0–3) from `KeyboardEvent.key`. */
export function getTrackIndexFromHotkeyKey(key: string): number | null {
  const match = /^F([1-4])$/i.exec(key);
  if (!match) return null;
  return Number(match[1]) - 1;
}

/** Resolve F1…F4 from `KeyboardEvent.code`. */
export function getTrackIndexFromHotkeyCode(code: string): number | null {
  const match = /^F([1-4])$/.exec(code);
  if (!match) return null;
  return Number(match[1]) - 1;
}

/** Prefer `code`, fall back to `key`. */
export function getTrackIndexFromHotkeyEvent(event: {
  code?: string;
  key?: string;
}): number | null {
  return (
    getTrackIndexFromHotkeyCode(event.code || '') ?? getTrackIndexFromHotkeyKey(event.key || '')
  );
}

/** Resolve the next/previous track index; `isTrackSelectable` lets callers skip empty tracks. */
export function getCycledTrackIndex(
  currentIndex: number | null | undefined,
  trackCount: number,
  direction: 1 | -1,
  isTrackSelectable: (index: number) => boolean = () => true,
): number | null {
  if (!Number.isFinite(trackCount) || trackCount <= 0) return null;

  let nextIndex =
    typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < trackCount
      ? currentIndex
      : direction > 0
        ? -1
        : 0;

  for (let i = 0; i < trackCount; i++) {
    nextIndex = (nextIndex + direction + trackCount) % trackCount;
    if (isTrackSelectable(nextIndex)) return nextIndex;
  }

  return null;
}

/** First visible library card for a skill type (skips hidden segment children). */
export function findLibrarySkillByType(
  library: ReadonlyArray<Record<string, unknown>>,
  type: string,
): Record<string, unknown> | null {
  for (const skill of library) {
    if (!skill || skill.type !== type) continue;
    if (skill.hiddenInLibraryGrid) continue;
    return skill;
  }
  return null;
}

function readSkillIdentityKey(skill: Record<string, unknown> | null | undefined): string {
  if (!skill) return '';
  for (const key of ['skillKey', 'sourceSkillKey', 'skillId'] as const) {
    const value = skill[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Rematch a sticky place-mode skill onto another operator's library.
 * Prefer the same library `id` (same operator / variant), then the same skill
 * identity key (variants), then fall back to the same `type`.
 */
export function findLibrarySkillForPlaceRematch(
  library: ReadonlyArray<Record<string, unknown>>,
  previous: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!previous) return null;

  const previousId = typeof previous.id === 'string' ? previous.id.trim() : '';
  if (previousId) {
    for (const skill of library) {
      if (!skill || skill.hiddenInLibraryGrid) continue;
      if (skill.id === previousId) return skill;
    }
  }

  const skillKey = readSkillIdentityKey(previous);
  if (skillKey) {
    for (const skill of library) {
      if (!skill || skill.hiddenInLibraryGrid) continue;
      if (readSkillIdentityKey(skill) === skillKey) return skill;
    }
  }

  const type = typeof previous.type === 'string' ? previous.type.trim() : '';
  if (!type) return null;
  return findLibrarySkillByType(library, type);
}
