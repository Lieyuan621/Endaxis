import { describe, expect, test } from 'vitest';
import source from './PropertiesPanel.vue?raw';

// Trimmed to the one rule worth enforcing. The removed tests were "we deleted X" negatives
// (obsolete i18n keys, dropped helpers, a mojibake byte sequence) — they pinned past refactors
// rather than current behaviour.

describe('PropertiesPanel', () => {
  test('hides aggregate library damage points so segmented skills are edited per segment', () => {
    expect(source).toContain('const isLibraryAggregateSkill = computed');
    expect(source).toContain('Array.isArray(value?.segments)');
    expect(source).toContain('Array.isArray(value?.attackSegments)');
    expect(source).toContain('v-if="!isLibraryAggregateSkill"');
  });
});
