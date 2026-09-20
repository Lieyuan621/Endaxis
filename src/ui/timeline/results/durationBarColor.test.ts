import { describe, expect, it } from 'vitest';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import {
  DURATION_COLOR_SOURCES,
  durationColorSource,
  normalizeDurationBarColorPrefs,
  resolveDurationBarColor,
} from './durationBarColor';
import controls from './TimelineDurationBarColorControls.vue?raw';
import track from './TimelineBuffBands.vue?raw';
import enemy from './TimelineEnemyEffects.vue?raw';

describe('duration bar display preferences', () => {
  it('keeps the legacy source-control order', () => {
    expect(DURATION_COLOR_SOURCES).toEqual(['anomaly', 'weapon', 'gearSet', 'operator']);
  });

  it('defaults to neutral buffs and colored anomaly bars in both surfaces', () => {
    const prefs = normalizeDurationBarColorPrefs(undefined);
    expect(prefs).toEqual({
      enabled: true,
      saturation: 50,
      lightness: 90,
      sources: { weapon: false, gearSet: false, operator: false, anomaly: true },
      surfaces: { track: true, enemy: true },
    });
    expect(resolveDurationBarColor(prefs, 'track', { buffId: 'ordinary' })).toBe('#8c8c8c');
    expect(
      resolveDurationBarColor(prefs, 'enemy', { buffId: 'attachment', abnormalColorType: 'Fire' }),
    ).toMatch(/^hsl\(/);
  });
  it('bounds corrupt persisted tuning and keeps independent default maps', () => {
    const prefs = normalizeDurationBarColorPrefs({
      saturation: Infinity,
      lightness: -5,
      sources: { weapon: true },
      surfaces: { enemy: false },
    });
    expect(prefs.saturation).toBe(50);
    expect(prefs.lightness).toBe(0);
    expect(prefs.sources.weapon).toBe(true);
    expect(prefs.surfaces).toEqual({ track: true, enemy: false });
    prefs.sources.operator = true;
    expect(normalizeDurationBarColorPrefs(null).sources.operator).toBe(false);
  });
  it.each([
    ['equipment:weaponTrait:slug:handler', 'weapon'],
    ['upgrade-initialization:weapon-trait:slug:skill3', 'weapon'],
    ['equipment:gearSet:slug:handler', 'gearSet'],
    ['upgrade-initialization:gear-trait:slug:handler', 'gearSet'],
    ['cast:skill', 'operator'],
    [undefined, 'operator'],
  ] as const)('classifies provenance %s as %s', (id, expected) =>
    expect(durationColorSource(id)).toBe(expected),
  );
  it('keeps equipment distinct from the operator switch and respects surface/master switches', () => {
    const prefs = normalizeDurationBarColorPrefs({ sources: { operator: true } });
    const buff = { buffId: 'buff', sourceActionId: 'equipment:weaponTrait:slug:handler' };
    expect(resolveDurationBarColor(prefs, 'track', buff)).toBe('#8c8c8c');
    prefs.sources.weapon = true;
    const color = resolveDurationBarColor(prefs, 'track', buff);
    expect(color).toMatch(/^hsl\(/);
    prefs.surfaces.enemy = false;
    expect(resolveDurationBarColor(prefs, 'enemy', buff)).toBe('#8c8c8c');
    expect(resolveDurationBarColor(prefs, 'track', buff)).toBe(color);
    prefs.enabled = false;
    expect(resolveDurationBarColor(prefs, 'track', buff)).toBe('#8c8c8c');
  });
  it('uses stable buff identity and applies saturation/lightness without changing the segment', () => {
    const prefs = normalizeDurationBarColorPrefs({ sources: { operator: true } });
    const buff = Object.freeze({ buffId: 'ordinary', sourceActionId: 'cast:a' });
    const before = resolveDurationBarColor(prefs, 'track', buff);
    expect(resolveDurationBarColor(prefs, 'track', { ...buff, sourceActionId: 'cast:b' })).toBe(
      before,
    );
    prefs.saturation = 0;
    expect(resolveDurationBarColor(prefs, 'track', buff)).toContain(' 0% ');
    prefs.lightness = 0;
    expect(resolveDurationBarColor(prefs, 'track', buff)).toMatch(/ 0%\)$/);
    prefs.sources.anomaly = false;
    expect(
      resolveDurationBarColor(prefs, 'track', { buffId: 'attachment', abnormalColorType: 'Fire' }),
    ).toBe('#8c8c8c');
  });
  it.each(['Fire', 'Pulse', 'Cryst', 'Natural'])(
    'colors %s factory outputs by native metadata, not IDs',
    abnormalColorType => {
      const prefs = normalizeDurationBarColorPrefs(undefined);
      const color = resolveDurationBarColor(prefs, 'enemy', {
        buffId: 'factory:one',
        abnormalColorType,
      });
      expect(color).toMatch(/^hsl\(/);
      expect(
        resolveDurationBarColor(prefs, 'enemy', { buffId: 'factory:two', abnormalColorType }),
      ).toBe(color);
      expect(
        resolveDurationBarColor(prefs, 'enemy', {
          buffId: 'unrecognized-buff',
        }),
      ).toBe('#8c8c8c');
      expect(
        resolveDurationBarColor(prefs, 'enemy', {
          buffId: 'unknown',
          abnormalColorType: 'Unknown',
        }),
      ).toBe('#8c8c8c');
      prefs.sources.anomaly = false;
      expect(
        resolveDurationBarColor(prefs, 'enemy', { buffId: 'factory:one', abnormalColorType }),
      ).toBe('#8c8c8c');
    },
  );
  it('uses exported attachment roles when native abnormal color is Physical', () => {
    const prefs = normalizeDurationBarColorPrefs(undefined);
    const attachments = elementalAttachments.buffs.filter(
      buff => buff.role?.kind === 'elementalAttachment',
    );
    expect(attachments).toHaveLength(4);
    const colors = attachments.map(buff =>
      resolveDurationBarColor(prefs, 'enemy', {
        buffId: buff.id,
        abnormalColorType: buff.presentation?.abnormalColorType,
      }),
    );
    expect(colors.every(color => color.startsWith('hsl('))).toBe(true);
    expect(new Set(colors).size).toBe(4);
  });
  it('wires shared settings to track/enemy rendering and hides tuning when disabled', () => {
    expect(controls).toContain('v-if="prefs.enabled"');
    expect(controls).toContain('DURATION_COLOR_SOURCES');
    expect(controls).toContain('DURATION_COLOR_SURFACES');
    expect(track).toContain("resolveDurationBarColor(durationBarColor.value, 'track', segment)");
    expect(enemy).toContain("resolveDurationBarColor(durationBarColor.value, 'enemy', buff)");
    expect(track).toContain(':duration-color="item.color"');
  });
});
