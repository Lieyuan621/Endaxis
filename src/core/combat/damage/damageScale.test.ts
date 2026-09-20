import { describe, expect, it } from 'vitest';
import { DamageScaleAccumulator } from './damageScale';

describe('DamageScaleAccumulator', () => {
  it('multiplies repeated product additions and adds repeated normal additions', () => {
    const scales = new DamageScaleAccumulator();

    scales.modify('attacker', 'product', 0.2);
    scales.modify('attacker', 'product', 0.5);
    scales.modify('attacker', 'normal', 0.2);
    scales.modify('attacker', 'normal', 0.5);

    expect(scales.getZoneValue('product')).toBeCloseTo(1.8);
    expect(scales.getZoneValue('normal')).toBeCloseTo(1.7);
    expect(scales.getFinalValue()).toBeCloseTo(3.06);
  });

  it('combines attacker and defender sides according to the recovered zone definition', () => {
    const scales = new DamageScaleAccumulator();

    scales.modify('attacker', 'normal', 0.2);
    scales.modify('defender', 'normal', 0.3);

    expect(scales.getZoneValue('normal')).toBeCloseTo(1.56);
    expect(scales.getSideValue('attacker', 'normal')).toBeCloseTo(1.2);
    expect(scales.getSideValue('defender', 'normal')).toBeCloseTo(1.3);
  });

  it('clamps negative and NaN zone results to zero', () => {
    const negative = new DamageScaleAccumulator();
    negative.modify('attacker', 'normal', -2);
    expect(negative.getZoneValue('normal')).toBe(0);

    const invalid = new DamageScaleAccumulator();
    invalid.modify('attacker', 'normal', Number.NaN);
    expect(invalid.getZoneValue('normal')).toBe(0);
  });
});
