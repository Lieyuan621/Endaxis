import { describe, expect, it } from 'vitest';
import {
  parseDashEnergyConfigSource,
  renderDashEnergyConfigModule,
} from '../src/source/dashEnergyConfigSource.ts';

describe('Dash energy config source', () => {
  it('换算全局最大次数，不将它解释为账号当前上限', () => {
    const source = parseDashEnergyConfigSource(
      { maxDashEnergyLimit: 480, dashCostEnergyValue: 60 },
      'GlobalConst.json',
    );

    expect(source).toEqual({ maximumEnergyLimit: 480, costPerDash: 60, maximumCapacity: 8 });
    expect(renderDashEnergyConfigModule(source)).toContain('"maximumCapacity": 8');
  });

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
