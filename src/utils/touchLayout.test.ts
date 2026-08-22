import { describe, expect, it } from 'vitest';
import { shouldUseTouchLayout } from './touchLayout';

describe('shouldUseTouchLayout', () => {
  it('uses the touch layout on a phone with a coarse pointer', () => {
    expect(shouldUseTouchLayout({ viewportWidth: 390, coarsePointer: true })).toBe(true);
  });

  it('keeps Android tablets in the touch layout in landscape', () => {
    expect(
      shouldUseTouchLayout({
        viewportWidth: 1280,
        coarsePointer: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Tablet)',
      }),
    ).toBe(true);
  });

  it('recognizes iPadOS when it uses a desktop user agent', () => {
    expect(
      shouldUseTouchLayout({
        viewportWidth: 1366,
        coarsePointer: false,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it('uses the touch layout for a Windows tablet with a coarse primary pointer', () => {
    expect(shouldUseTouchLayout({ viewportWidth: 1200, coarsePointer: true })).toBe(true);
  });

  it('keeps ordinary desktop browsers in the desktop layout', () => {
    expect(
      shouldUseTouchLayout({
        viewportWidth: 1280,
        coarsePointer: false,
        platform: 'Win32',
      }),
    ).toBe(false);
  });

  it('does not switch a touch-capable laptop whose primary pointer is precise', () => {
    expect(
      shouldUseTouchLayout({
        viewportWidth: 1280,
        coarsePointer: false,
        platform: 'Win32',
        maxTouchPoints: 10,
      }),
    ).toBe(false);
  });

  it('does not use the touch layout beyond the supported tablet width', () => {
    expect(
      shouldUseTouchLayout({
        viewportWidth: 1440,
        coarsePointer: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Tablet)',
      }),
    ).toBe(false);
  });
});
