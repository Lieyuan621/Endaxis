import { describe, expect, it } from 'vitest';
import { createTimelineDamageAnalysisNumberFormat } from './timelineDamageAnalysisNumberFormat';

describe('createTimelineDamageAnalysisNumberFormat', () => {
  it('rounds chart damage for display without changing the chart value', () => {
    const value = 5853.211249999999;
    const format = createTimelineDamageAnalysisNumberFormat('en-US');
    expect(format.tooltip('管理员 · 自身伤害', value, 62.68)).toBe(
      '管理员 · 自身伤害: 5,853 (62.68%)',
    );
    expect(format.damage(-12.7)).toBe('-13');
    expect(value).toBe(5853.211249999999);
  });
});
