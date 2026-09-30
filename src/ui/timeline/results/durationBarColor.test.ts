import { describe, expect, it } from 'vitest';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import {
  durationColorSource,
  normalizeDurationBarColorPrefs,
  resolveDurationBarColor,
} from './durationBarColor';

describe('duration bar display preferences', () => {
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
    ['upgrade-initialization:gear-trait:slug:handler', 'gearSet'],
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
  it('按原生异常颜色元数据上色，不从 Buff ID 猜测', () => {
    const prefs = normalizeDurationBarColorPrefs(undefined);
    const color = resolveDurationBarColor(prefs, 'enemy', {
      buffId: 'factory:one',
      abnormalColorType: 'Fire',
    });
    expect(color).toMatch(/^hsl\(/);
    expect(
      resolveDurationBarColor(prefs, 'enemy', {
        buffId: 'factory:two',
        abnormalColorType: 'Fire',
      }),
    ).toBe(color);
    expect(resolveDurationBarColor(prefs, 'enemy', { buffId: 'unrecognized-buff' })).toBe(
      '#8c8c8c',
    );
    expect(
      resolveDurationBarColor(prefs, 'enemy', {
        buffId: 'unknown',
        abnormalColorType: 'Unknown',
      }),
    ).toBe('#8c8c8c');
    prefs.sources.anomaly = false;
    expect(
      resolveDurationBarColor(prefs, 'enemy', {
        buffId: 'factory:one',
        abnormalColorType: 'Fire',
      }),
    ).toBe('#8c8c8c');
  });
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
});
