import { describe, expect, it } from 'vitest';
import { parseDashEnergyConfigSource } from '../src/source/dashEnergyConfigSource.ts';

describe('Dash energy config source', () => {
  it('拒绝缺失和非正数，保留原生浮点换算', () => {
    expect(() => parseDashEnergyConfigSource({}, 'missing')).toThrow('maxDashEnergyLimit');
    expect(() =>
      parseDashEnergyConfigSource({ maxDashEnergyLimit: 480, dashCostEnergyValue: 0 }, 'zero'),
    ).toThrow('positive finite number');
    expect(
      parseDashEnergyConfigSource(
        { maxDashEnergyLimit: 480, dashCostEnergyValue: 70 },
        'fractional',
      ),
    ).toMatchObject({ maximumCapacity: 480 / 70 });
  });
});
