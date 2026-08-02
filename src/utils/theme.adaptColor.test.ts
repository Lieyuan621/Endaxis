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
});
