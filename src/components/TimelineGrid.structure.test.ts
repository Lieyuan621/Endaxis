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
});
