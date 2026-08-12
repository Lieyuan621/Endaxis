import { describe, expect, test } from 'vitest';
import source from './HitEditorDialog.vue?raw';

// Source-text assertions can only prove a symbol is still referenced, never that the editor works.
// Keep only the two rules a reviewer would actually enforce; layout, class strings, field ordering
// and "we deleted X" archaeology are deliberately not pinned here — they broke on every redesign
// without ever catching a defect.

describe('HitEditorDialog structure', () => {
  test('uses Endaxis Element Plus selects instead of native select controls', () => {
    expect(source).not.toContain('<select');
    expect(source).toContain('class="effect-select-dark"');
  });

  test('edits effects through structured sub-editors, not a raw JSON escape hatch', () => {
    for (const editor of [
      'EffectStatEditor',
      'EffectTargetEditor',
      'EffectConditionEditor',
      'EffectScalingEditor',
      'EffectConsumeStatusesEditor',
      'ConsumedStatEffectsEditor',
      'EffectNestedHitEditor',
    ]) {
      expect(source).toContain(editor);
    }
    expect(source).not.toContain('patchSelectedEffectJson');
  });
});
