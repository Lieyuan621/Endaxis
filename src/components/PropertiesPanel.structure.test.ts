import { describe, expect, test } from 'vitest';
import source from './PropertiesPanel.vue?raw';

describe('PropertiesPanel effect display type options', () => {
  test('builds editor display type options without obsolete allowedEffectTypes filtering', () => {
    expect(source).not.toContain('allowedEffectTypes');
    expect(source).toContain('effectNameMessages');
    expect(source).toContain('allEffectDisplayKeys');
  });

  test('does not render mojibake prefixes for exclusive effect options', () => {
    expect(source).not.toContain('鈽');
    expect(source).not.toContain('鈹');
  });

  test('persists all skill hits without an editor-visibility filter', () => {
    expect(source).toContain('toPersistedEditorHits');
    expect(source).not.toContain('filterEditorVisibleHits');
    expect(source).not.toContain('mergeEditorVisibleHits');
  });

  test('uses square right-panel container styling', () => {
    expect(source).toContain('--right-panel-container-radius: 0');
    expect(source).toContain('border-radius: var(--right-panel-container-radius)');
  });

  test('does not render redundant system decoration labels', () => {
    expect(source).not.toContain('propertiesPanel.damage.system');
    expect(source).not.toContain('propertiesPanel.bars.system');
    expect(source).not.toContain('propertiesPanel.bars.activeItems');
    expect(source).not.toContain('propertiesPanel.connections.system');
    expect(source).not.toContain('module-deco');
    expect(source).not.toContain('link-ctrl-deco');
  });

  test('keeps useful panel summary metrics visible', () => {
    expect(source).toContain('propertiesPanel.damage.stagger');
    expect(source).toContain('propertiesPanel.damage.sp');
    expect(source).toContain('totalStagger');
    expect(source).toContain('totalSpGain');
    expect(source).toContain('propertiesPanel.connections.currentCount');
    expect(source).toContain('relevantConnections.length');
  });

  test('does not render obsolete extra charge fields in basic info', () => {
    expect(source).not.toContain('propertiesPanel.labels.gaugeGain');
    expect(source).not.toContain('propertiesPanel.labels.teamGaugeGain');
    expect(source).not.toContain("updateActionProp('gaugeGain'");
    expect(source).not.toContain("updateActionProp('teamGaugeGain'");
  });

  test('hides aggregate library damage points so segmented skills are edited per segment', () => {
    expect(source).toContain('const isLibraryAggregateSkill = computed');
    expect(source).toContain('Array.isArray(value?.segments)');
    expect(source).toContain('Array.isArray(value?.attackSegments)');
    expect(source).toContain('v-if="!isLibraryAggregateSkill"');
    expect(source).toContain('class="section-container tech-style border-red"');
  });
});
