import { describe, expect, test } from 'vitest';
import source from './TimelineGrid.vue?raw';

describe('TimelineGrid cursor guide', () => {
  test('shows returned SP next to current SP', () => {
    expect(source).toContain('const currentReturnedSpValue = computed');
    expect(source).toContain("entry?.type !== 'SP_CHANGE'");
    expect(source).toContain('entry.payload?.refundSp');
    expect(source).toContain('const currentSpReturnText = computed');
    expect(source).toContain("t('timelineGrid.cursor.spReturn')");
    expect(source).toContain('{{ currentSpValue }}{{ currentSpReturnText }}');
  });
});
