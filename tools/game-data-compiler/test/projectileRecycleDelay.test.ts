import { describe, expect, it } from 'vitest';
import { resolveProjectileRecycleDelaySource } from '../src/compiler/abilities/projectileRuntimeProjection.ts';

describe('projectile recycle delay source', () => {
  it.each([-1, 1.5, Number.POSITIVE_INFINITY, 1e100])(
    'rejects invalid or unrepresentable durationFrame %s',
    durationFrame => {
      const launch = {
        callbacks: [{ event: 'finish', enabled: true, skillId: 'finish' }] as const,
      };
      expect(() =>
        resolveProjectileRecycleDelaySource(
          launch,
          new Map([['finish', { durationFrame }]]),
          'launch',
        ),
      ).toThrow();
    },
  );

  it('uses all enabled callbacks, including a longer block callback that the stump never invokes', () => {
    const launch = {
      callbacks: [
        { event: 'hit', enabled: true, skillId: 'hit' },
        { event: 'block', enabled: true, skillId: 'block' },
        { event: 'finish', enabled: true, skillId: 'finish' },
        { event: 'reach', enabled: false, skillId: 'stale' },
      ] as const,
    };
    expect(
      resolveProjectileRecycleDelaySource(
        launch,
        new Map([
          ['hit', { durationFrame: 15 }],
          ['block', { durationFrame: 120 }],
          ['finish', { durationFrame: 30 }],
        ]),
        'launch',
      ),
    ).toBe(4);
  });

  it('keeps zero-frame callback duration distinct from having no callbacks', () => {
    const launch = { callbacks: [{ event: 'finish', enabled: true, skillId: 'finish' }] as const };
    expect(
      resolveProjectileRecycleDelaySource(
        launch,
        new Map([['finish', { durationFrame: 0 }]]),
        'launch',
      ),
    ).toBe(Math.fround(1 / 30));
    expect(resolveProjectileRecycleDelaySource({ callbacks: [] }, new Map(), 'launch')).toBe(0);
    expect(() => resolveProjectileRecycleDelaySource(launch, new Map(), 'launch')).toThrow(
      'missing projectile callback SkillData finish',
    );
  });
});
