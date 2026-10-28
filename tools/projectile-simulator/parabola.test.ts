import { expect, it } from 'vitest';
import { parabolaFromApex } from './parabola.ts';

it('reaches the requested endpoint and apex for uphill and downhill throws', () => {
  for (const [startY, endY] of [
    [0, 2],
    [2, 0],
    [1, 1],
  ]) {
    const duration = 1.7;
    const result = parabolaFromApex({
      horizontalDistance: 3,
      startY: startY!,
      endY: endY!,
      apexOffset: 1.2,
      duration,
    });
    const y = (t: number) => startY! + result.verticalSpeed * t - (result.gravity * t * t) / 2;
    expect(y(duration)).toBeCloseTo(endY!, 10);
    expect(y(result.ascentSeconds)).toBeCloseTo(Math.max(startY!, endY!) + 1.2, 10);
    expect(result.horizontalSpeed * duration).toBeCloseTo(3, 10);
  }
});
