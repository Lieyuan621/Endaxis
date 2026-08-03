import { describe, expect, test } from 'vitest';
import { adaptColorForLightSurface } from './theme';

describe('adaptColorForLightSurface', () => {
  test('darkens pale physical beige for light chrome', () => {
    const physical = '#d4c5a0';
    expect(adaptColorForLightSurface(physical)).not.toBe(physical);
  });

  test('leaves saturated heat unchanged', () => {
    const heat = '#e85d3a';
    expect(adaptColorForLightSurface(heat)).toBe(heat);
  });

  test('keeps link yellow brighter than the old heavy darken', () => {
    const link = '#fdd900';
    const next = adaptColorForLightSurface(link);
    expect(next).not.toBe(link);
    // Former curve produced ~#ae9500; mild curve should stay clearly above that.
    const g = parseInt(next.slice(3, 5), 16);
    expect(g).toBeGreaterThan(0x95);
  });
});
