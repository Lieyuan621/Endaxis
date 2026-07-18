import { describe, expect, test } from 'vitest';
import source from './ActionItem.vue?raw';

describe('ActionItem display labels', () => {
  test('uses the final basic attack segment name instead of the group name', () => {
    expect(source).toContain('const finalSegmentName =');
    expect(source).toContain('name.trim() || props.action.attackGroupName');
    expect(source).toContain('return `${finalSegmentName}${suffix}`');
    expect(source).not.toContain('return `${groupName}${suffix}`');
  });

  test('hides cooldown bars when remaining CD was fully cleared mid-action', () => {
    expect(source).toContain('const cdClearedByInterrupt = computed');
    expect(source).toContain('clearedRemaining === true');
    expect(source).toContain('if (cdClearedByInterrupt.value) return 0;');
  });
});
