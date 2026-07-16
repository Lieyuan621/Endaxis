import { describe, it, expect } from 'vitest';
import { TimeContext } from './timeContext';
import { timeExtensions } from './fixture/time-extension-1';

describe('TimeContext', () => {
  const ctx = new TimeContext(timeExtensions);

  describe('toGameTime', () => {
    it('should return same time if before any freezes', () => {
      expect(ctx.toGameTime(1.0)).toBe(1.0);
      expect(ctx.toGameTime(2.4)).toBe(2.4);
    });

    it('should return freeze start time during a freeze window', () => {
      expect(ctx.toGameTime(2.5)).toBe(2.5);
      expect(ctx.toGameTime(2.7)).toBe(2.5);
      expect(ctx.toGameTime(2.99)).toBe(2.5);
    });

    it('should return shifted time after one freeze', () => {
      expect(ctx.toGameTime(3.0)).toBe(2.5);
      expect(ctx.toGameTime(4.0)).toBe(3.5);
    });

    it('should handle multiple freezes correctly', () => {
      expect(ctx.toGameTime(6.1)).toBe(5.1);
      expect(ctx.toGameTime(7.0)).toBe(6.0);
    });

    it('should handle late timeline values', () => {
      expect(ctx.toGameTime(30.0)).toBe(25.0);
    });
  });

  describe('toRealTime', () => {
    it('should return same time if before any freezes', () => {
      expect(ctx.toRealTime(1.0)).toBe(1.0);
    });

    it('should return exact start time at freeze start', () => {
      expect(ctx.toRealTime(2.5)).toBe(2.5);
    });

    it('should return time AFTER freeze immediately after freeze start', () => {
      expect(ctx.toRealTime(2.51)).toBeCloseTo(3.01);
    });

    it('should accumulate multiple freezes', () => {
      expect(ctx.toRealTime(6.0)).toBe(7.0);
    });
  });

  describe('getShiftedEndTime', () => {
    it('should return simple duration if no overlaps', () => {
      expect(ctx.getShiftedEndTime(0, 1)).toBe(1);
    });

    it('should extend duration if overlapping a freeze', () => {
      expect(ctx.getShiftedEndTime(2.0, 1.0)).toBe(3.5);
    });

    it('should extend for multiple freezes', () => {
      expect(ctx.getShiftedEndTime(2.0, 10.0)).toBe(13.5);
    });

    it('should exclude specific source ID', () => {
      expect(ctx.getShiftedEndTime(2.0, 1.0, 'inst_9fi6580')).toBe(3.0);
    });
  });
});
