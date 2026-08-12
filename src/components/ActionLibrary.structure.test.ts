import { describe, expect, test } from 'vitest';
import source from './ActionLibrary.vue?raw';

describe('ActionLibrary structure', () => {
  test('uses square library controls and cards', () => {
    expect(source).not.toContain('border-radius: 4px');
    expect(source).not.toContain('border-radius: 2px');
    expect(source).toContain('border-radius: 0');
  });

  test('renders no skill-type label on any card', () => {
    // The skill name already says what the action is; the meta row keeps only a spacer.
    expect(source).not.toContain('class="skill-type"');
    expect(source).toContain('class="skill-type-empty"');
  });

  test('keeps the skill card lower-right triangle decoration', () => {
    expect(source).toContain('.card-bg-deco');
    expect(source).toContain('clip-path: polygon(100% 0, 0 100%, 100% 100%)');
  });
});
