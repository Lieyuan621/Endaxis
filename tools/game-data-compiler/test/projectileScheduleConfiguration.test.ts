import { describe, expect, it } from 'vitest';
import { resolveProjectileScheduleConfiguration } from '../src/compiler/abilities/projectileScheduleConfiguration.ts';
import type { ProjectileScheduleConfiguration } from '../src/compiler/abilities/projectileScheduleConfiguration.ts';

function configuration(frames: readonly number[]): ProjectileScheduleConfiguration {
  return {
    schedule: {
      callbacks: [{ event: 'hit', triggerFrames: frames }],
      endFrame: 12,
    },
  };
}

describe('projectile callback configuration', () => {
  it('does not substitute zero for an unconfigured launch', () => {
    expect(() => resolveProjectileScheduleConfiguration(new Map(), 'skill/example:17')).toThrow(
      'Missing projectile callback schedule: skill/example:17',
    );
  });

  it('preserves explicit repeated callbacks and explicit non-triggering callbacks', () => {
    for (const frames of [[0, 3, 9], []]) {
      const entry = configuration(frames);
      expect(
        resolveProjectileScheduleConfiguration(
          new Map([['skill/example:17', entry]]),
          'skill/example:17',
        ),
      ).toBe(entry.schedule);
    }
  });

  it.each([[3, 3], [9, 3], [-1], [0.5], [13], [Number.NaN]])(
    'rejects invalid trigger frames %j',
    (...frames) => {
      expect(() =>
        resolveProjectileScheduleConfiguration(
          new Map([['skill/example:17', configuration(frames)]]),
          'skill/example:17',
        ),
      ).toThrow('Invalid projectile trigger frame');
    },
  );
});
