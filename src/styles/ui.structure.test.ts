/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(new URL('./ui.css', import.meta.url), 'utf8');

describe('global icon button styling', () => {
  test('prevents icon buttons from being squeezed in flex rows', () => {
    expect(source).toContain('flex: 0 0 var(--ea-btn-size)');
    expect(source).toContain('min-width: var(--ea-btn-size)');
  });

  test('draws danger icon buttons with a centered css cross', () => {
    expect(source).toContain('.ea-btn--icon.ea-btn--glass-rect-danger::before');
    expect(source).toContain('.ea-btn--icon.ea-btn--glass-rect-danger::after');
    expect(source).toContain('rotate(45deg)');
    expect(source).toContain('rotate(-45deg)');
  });

  test('defines reusable square checkbox option styling', () => {
    expect(source).toContain('.ea-check-rect');
    expect(source).toContain(".ea-check-rect input[type='checkbox']");
    expect(source).toContain(".ea-check-rect input[type='checkbox']:checked");
    expect(source).toContain('--ea-check-accent');
  });
});
