import { describe, expect, test } from 'vitest';
import { projectSpSeries, sampleSpSeriesAtTime } from './projectSpSeries';

const baseSnapshot = {
  team: {
    sp: 0,
    recoverSp: 0,
    refundSp: 0,
    debtSp: 0,
    maxSp: 300,
    spRegenRate: 10,
  },
} as any;

describe('projectSpSeries', () => {
  test('inserts the natural full-SP point before a much later skill spend', () => {
    const series = projectSpSeries(
      [
        {
          type: 'SP_CHANGE',
          time: 100,
          payload: {
            sp: 250,
            change: -50,
            actualChange: -50,
            prevSp: 300,
            prevRecoverSp: 300,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 250,
            refundSp: 0,
            debtSp: 0,
            sourceId: 'late-skill',
            actorId: 'op',
            reason: 'skill',
          },
        },
      ] as any,
      baseSnapshot,
      120,
    );

    expect(series).toContainEqual(expect.objectContaining({ time: 30, sp: 300 }));
    expect(series).toContainEqual(expect.objectContaining({ time: 100, sp: 300 }));
    expect(series).toContainEqual(
      expect.objectContaining({ time: 100, sp: 250, actionId: 'late-skill' }),
    );
  });

  test('uses actual SP delta so clipped returned SP does not create a false dip', () => {
    const series = projectSpSeries(
      [
        {
          type: 'SP_CHANGE',
          time: 10,
          payload: {
            sp: 300,
            change: 20,
            actualChange: 0,
            prevSp: 300,
            prevRecoverSp: 300,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 300,
            refundSp: 0,
            debtSp: 0,
            sourceId: 'return-at-cap',
            actorId: 'op',
            reason: 'hit',
            spType: 'return',
          },
        },
      ] as any,
      {
        ...baseSnapshot,
        team: { ...baseSnapshot.team, sp: 300, recoverSp: 300 },
      },
      20,
    );

    expect(series.find(point => point.time === 10 && point.sp === 280)).toBeUndefined();
  });

  test('projects returned SP being displaced by passive recovery', () => {
    const series = projectSpSeries(
      [
        {
          type: 'SP_CHANGE',
          time: 0,
          payload: {
            sp: 300,
            change: 20,
            actualChange: 20,
            prevSp: 280,
            prevRecoverSp: 280,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 280,
            refundSp: 20,
            debtSp: 0,
            sourceId: 'return-to-cap',
            actorId: 'op',
            reason: 'hit',
            spType: 'return',
          },
        },
      ] as any,
      {
        ...baseSnapshot,
        team: { ...baseSnapshot.team, sp: 280, recoverSp: 280 },
      },
      5,
    );

    expect(series).toContainEqual(expect.objectContaining({ time: 2, sp: 300, refundSp: 0 }));
  });

  test('samples returned SP after depletion instead of carrying it to a later skill', () => {
    const series = projectSpSeries(
      [
        {
          type: 'SP_CHANGE',
          time: 0,
          payload: {
            sp: 300,
            change: 20,
            actualChange: 20,
            prevSp: 280,
            prevRecoverSp: 280,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 280,
            refundSp: 20,
            debtSp: 0,
            sourceId: 'return-to-cap',
            actorId: 'op',
            reason: 'hit',
            spType: 'return',
          },
        },
        {
          type: 'SP_CHANGE',
          time: 100,
          payload: {
            sp: 250,
            change: -50,
            actualChange: -50,
            prevSp: 300,
            prevRecoverSp: 300,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 250,
            refundSp: 0,
            debtSp: 0,
            sourceId: 'late-skill',
            actorId: 'op',
            reason: 'skill',
          },
        },
      ] as any,
      {
        ...baseSnapshot,
        team: { ...baseSnapshot.team, sp: 280, recoverSp: 280 },
      },
      120,
    );

    expect(series).toContainEqual(expect.objectContaining({ time: 2, sp: 300, refundSp: 0 }));
    expect(sampleSpSeriesAtTime(series, 50).refundSp).toBe(0);
    expect(sampleSpSeriesAtTime(series, 99.9).refundSp).toBe(0);
    expect(sampleSpSeriesAtTime(series, 100).refundSp).toBe(0);
  });

  test('reconciles stale pre-skill refund pools after passive recovery displacement', () => {
    const series = projectSpSeries(
      [
        {
          type: 'SP_CHANGE',
          time: 50,
          payload: {
            sp: 300,
            change: 50,
            actualChange: 50,
            prevSp: 250,
            prevRecoverSp: 250,
            prevRefundSp: 0,
            prevDebtSp: 0,
            recoverSp: 250,
            refundSp: 50,
            debtSp: 0,
            sourceId: 'return-at-50',
            actorId: 'op',
            reason: 'hit',
            spType: 'return',
          },
        },
        {
          type: 'SP_CHANGE',
          time: 60,
          payload: {
            sp: 250,
            change: -50,
            actualChange: -50,
            prevSp: 300,
            prevRecoverSp: 250,
            prevRefundSp: 50,
            prevDebtSp: 0,
            recoverSp: 250,
            refundSp: 0,
            debtSp: 0,
            sourceId: 'skill-at-60',
            actorId: 'op',
            reason: 'skill',
          },
        },
      ] as any,
      {
        ...baseSnapshot,
        team: { ...baseSnapshot.team, sp: 250, recoverSp: 250 },
      },
      80,
    );

    expect(series).toContainEqual(expect.objectContaining({ time: 55, sp: 300, refundSp: 0 }));
    expect(sampleSpSeriesAtTime(series, 52.5).refundSp).toBeCloseTo(25);
    expect(sampleSpSeriesAtTime(series, 59.9).refundSp).toBe(0);
    expect(sampleSpSeriesAtTime(series, 60, { prefer: 'pre' })).toMatchObject({
      sp: 300,
      recoverSp: 300,
      refundSp: 0,
    });
  });

  test('samples the post-change point at a same-time skill spend by default', () => {
    const series = [
      { time: 0, sp: 300, recoverSp: 280, refundSp: 20, debtSp: 0 },
      { time: 1, sp: 300, recoverSp: 290, refundSp: 10, debtSp: 0 },
      {
        time: 1,
        sp: 250,
        recoverSp: 250,
        refundSp: 0,
        debtSp: 0,
        actionId: 'skill',
        change: -50,
      },
      { time: 10, sp: 300, recoverSp: 300, refundSp: 0, debtSp: 0 },
    ];

    expect(sampleSpSeriesAtTime(series, 1)).toMatchObject({ sp: 250, refundSp: 0 });
    expect(sampleSpSeriesAtTime(series, 1, { prefer: 'pre' })).toMatchObject({
      sp: 300,
      refundSp: 10,
    });
  });
});
