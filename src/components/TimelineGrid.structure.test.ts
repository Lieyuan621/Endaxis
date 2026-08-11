import { describe, expect, test } from 'vitest';
import source from './TimelineGrid.vue?raw';

describe('TimelineGrid cursor guide', () => {
  test('shows returned SP next to current SP', () => {
    expect(source).toContain('const currentReturnedSpValue = computed');
    expect(source).toContain('const points = cachedSpData.value');
    expect(source).toContain('sampleSpSeriesAtTime(points, store.cursorCurrentTime)');
    expect(source).toContain('const currentSpReturnText = computed');
    expect(source).toContain("t('timelineGrid.cursor.spReturn')");
    expect(source).toContain('{{ currentSpValue }}{{ currentSpReturnText }}');
  });

  test('shows stagger current and max like gauge rows', () => {
    expect(source).toContain('const currentStaggerMax = computed');
    expect(source).toContain('const currentStaggerText = computed');
    expect(source).toContain('store.systemConstants.maxStagger');
    expect(source).toContain('{{ currentStaggerText }}');
  });

  test('keeps guide information visible while the tracks scroll vertically', () => {
    expect(source).toContain('const cursorGuideInfoStyle = computed');
    expect(source).toContain('store.timelineScrollTop');
    expect(source).toContain('class="cursor-guide__info" :style="cursorGuideInfoStyle"');
  });
});

describe('TimelineGrid track stacking', () => {
  test('does not put the selected lane above action decoration layers', () => {
    const selectedLaneRule = source.match(
      /\.track-row\.is-active-drop \.track-lane\s*\{([^}]*)\}/,
    )?.[1];

    expect(selectedLaneRule).toBeDefined();
    expect(selectedLaneRule).not.toContain('z-index');
  });
});

describe('TimelineGrid combo cooldown controls', () => {
  test('includes control markers in keyboard deletion and renders runtime cooldown bars', () => {
    expect(source).toContain('store.selectedComboCooldownEventId');
    expect(source).toContain('comboCooldownIntervalsByTrack');
    expect(source).toContain('combo-cooldown-bar');
  });

  test('places control icons at the top of their guide lines', () => {
    const markerRule = source.match(/\.combo-cooldown-marker\s*\{([^}]*)\}/)?.[1];

    expect(markerRule).toBeDefined();
    expect(markerRule).toContain('top: 0');
  });
});

describe('TimelineGrid simulation range controls', () => {
  test('includes selected start and end lines in keyboard deletion', () => {
    const selectionGuard = source.match(/const hasSelection\s*=([\s\S]*?);/)?.[1];

    expect(selectionGuard).toBeDefined();
    expect(selectionGuard).toContain('store.isStartlineSelected');
    expect(selectionGuard).toContain('store.isEndlineSelected');
  });
});
