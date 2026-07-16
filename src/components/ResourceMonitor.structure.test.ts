import { describe, expect, test } from 'vitest';
import source from './ResourceMonitor.vue?raw';

describe('ResourceMonitor structure', () => {
  test('enemy status effect icons and duration bars hover independently without scaling', () => {
    expect(source).toContain('getTypeTitle');
    expect(source).toContain(':title="getTypeTitle(it.typeKey)"');
    expect(source).toContain('.anomaly-icon-box:hover');
    expect(source).toContain('.anomaly-icon-box:hover .anomaly-icon');
    expect(source).toContain('.anomaly-duration-bar:hover');
    expect(source).toContain('pointer-events: auto');
    expect(source).not.toContain(
      '.affliction-item:not(.is-damage-hit):hover .anomaly-duration-bar',
    );
    expect(source).not.toContain('.affliction-item:not(.is-damage-hit):hover .anomaly-icon-box');
    expect(source).not.toContain('scale(1.18)');
    expect(source).not.toContain('z-index: 18');
  });
});
