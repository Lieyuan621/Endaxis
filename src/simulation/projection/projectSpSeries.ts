import type { GameSnapshot } from '@/simulation/state/types.ts';
import type { SimLogEntry } from '@/simulation/events/event.types.ts';

export interface SpPoint {
  time: number;
  sp: number;
  actionId?: string;
  change?: number;
  recoverSp?: number;
  refundSp?: number;
  debtSp?: number;
}

interface SpPools {
  recoverSp: number;
  refundSp: number;
  debtSp: number;
}

export interface SpSample extends SpPools {
  sp: number;
}

const EPSILON = 1e-6;

function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function samePoint(left: SpPoint | undefined, right: SpPoint): boolean {
  if (!left) return false;
  return (
    Math.abs(left.time - right.time) < EPSILON &&
    Math.abs(left.sp - right.sp) < EPSILON &&
    Math.abs((left.refundSp ?? 0) - (right.refundSp ?? 0)) < EPSILON &&
    Math.abs((left.recoverSp ?? 0) - (right.recoverSp ?? 0)) < EPSILON &&
    Math.abs((left.debtSp ?? 0) - (right.debtSp ?? 0)) < EPSILON &&
    left.actionId === right.actionId &&
    left.change === right.change
  );
}

function poolsSp(pools: SpPools): number {
  return pools.recoverSp + pools.refundSp - pools.debtSp;
}

function samePools(left: SpPools, right: SpPools): boolean {
  return (
    Math.abs(left.recoverSp - right.recoverSp) < EPSILON &&
    Math.abs(left.refundSp - right.refundSp) < EPSILON &&
    Math.abs(left.debtSp - right.debtSp) < EPSILON
  );
}

function recoverPools(pools: SpPools, gain: number, maxSp: number): SpPools {
  const next = { ...pools };
  let remaining = Math.max(0, finiteNumber(gain));

  if (next.debtSp > 0) {
    const repaid = Math.min(next.debtSp, remaining);
    next.debtSp -= repaid;
    remaining -= repaid;
  }

  if (remaining <= EPSILON) return next;

  next.recoverSp += remaining;
  let overflow = Math.max(0, next.recoverSp + next.refundSp - maxSp);

  if (overflow > EPSILON && next.refundSp > 0) {
    const displacedRefund = Math.min(next.refundSp, overflow);
    next.refundSp -= displacedRefund;
    overflow -= displacedRefund;
  }

  if (overflow > EPSILON) {
    next.recoverSp = Math.max(0, next.recoverSp - overflow);
  }

  return next;
}

function consumePools(pools: SpPools, cost: number): SpPools {
  const next = { ...pools };
  let remaining = Math.max(0, finiteNumber(cost));

  const refundConsumed = Math.min(next.refundSp, remaining);
  next.refundSp -= refundConsumed;
  remaining -= refundConsumed;

  const recoverConsumed = Math.min(next.recoverSp, remaining);
  next.recoverSp -= recoverConsumed;
  remaining -= recoverConsumed;

  if (remaining > EPSILON) {
    next.debtSp += remaining;
  }

  return next;
}

function toSample(point: SpPoint): SpSample {
  return {
    sp: finiteNumber(point.sp),
    recoverSp: Math.max(0, finiteNumber(point.recoverSp)),
    refundSp: Math.max(0, finiteNumber(point.refundSp)),
    debtSp: Math.max(0, finiteNumber(point.debtSp)),
  };
}

function interpolateSample(left: SpPoint, right: SpPoint, progress: number): SpSample {
  const start = toSample(left);
  const end = toSample(right);
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  return {
    sp: lerp(start.sp, end.sp),
    recoverSp: Math.max(0, lerp(start.recoverSp, end.recoverSp)),
    refundSp: Math.max(0, lerp(start.refundSp, end.refundSp)),
    debtSp: Math.max(0, lerp(start.debtSp, end.debtSp)),
  };
}

export function sampleSpSeriesAtTime(
  spSeries: SpPoint[],
  time: number,
  options: { prefer?: 'pre' | 'post' } = {},
): SpSample {
  if (!spSeries.length) {
    return { sp: 0, recoverSp: 0, refundSp: 0, debtSp: 0 };
  }

  const targetTime = finiteNumber(time);
  const prefer = options.prefer ?? 'post';

  let exactStart = -1;
  let exactEnd = -1;
  for (let i = 0; i < spSeries.length; i += 1) {
    if (Math.abs(spSeries[i]!.time - targetTime) < EPSILON) {
      if (exactStart === -1) exactStart = i;
      exactEnd = i;
    } else if (spSeries[i]!.time > targetTime + EPSILON && exactEnd !== -1) {
      break;
    }
  }

  if (exactStart !== -1) {
    return toSample(spSeries[prefer === 'pre' ? exactStart : exactEnd]!);
  }

  if (targetTime <= spSeries[0]!.time) {
    return toSample(spSeries[0]!);
  }

  for (let i = 0; i < spSeries.length - 1; i += 1) {
    const left = spSeries[i]!;
    const right = spSeries[i + 1]!;
    if (targetTime > left.time && targetTime < right.time) {
      const duration = right.time - left.time;
      if (duration <= EPSILON) return toSample(right);
      return interpolateSample(left, right, (targetTime - left.time) / duration);
    }
  }

  return toSample(spSeries[spSeries.length - 1]!);
}

export function projectSpSeries(
  simLog: SimLogEntry[],
  initialSnapshot: GameSnapshot,
  timelineDuration = 120,
): SpPoint[] {
  const spSeries: SpPoint[] = [];

  const maxSp = Math.max(0, finiteNumber(initialSnapshot.team.maxSp, 300));
  const regenRate = Math.max(0, finiteNumber(initialSnapshot.team.spRegenRate, 0));

  let lastTime = 0;
  let lastValue = finiteNumber(initialSnapshot.team.sp);
  let lastPools: SpPools = {
    recoverSp: finiteNumber(initialSnapshot.team.recoverSp ?? initialSnapshot.team.spRecovered),
    refundSp: finiteNumber(initialSnapshot.team.refundSp ?? initialSnapshot.team.spReturned),
    debtSp: finiteNumber(initialSnapshot.team.debtSp),
  };
  let frozenUntil = 0;

  function pushPoint(point: SpPoint) {
    const normalized: SpPoint = {
      ...point,
      sp: finiteNumber(point.sp),
      recoverSp: Math.max(0, finiteNumber(point.recoverSp)),
      refundSp: Math.max(0, finiteNumber(point.refundSp)),
      debtSp: Math.max(0, finiteNumber(point.debtSp)),
    };
    if (samePoint(spSeries[spSeries.length - 1], normalized)) return;
    spSeries.push(normalized);
  }

  function currentPoint(time: number, overrides: Partial<SpPoint> = {}): SpPoint {
    return {
      time,
      sp: lastValue,
      recoverSp: lastPools.recoverSp,
      refundSp: lastPools.refundSp,
      debtSp: lastPools.debtSp,
      ...overrides,
    };
  }

  function pushNaturalTransition(
    endTime: number,
    arrivalValue: number,
    arrivalPools: SpPools,
  ): SpPools {
    if (endTime <= lastTime + EPSILON) return arrivalPools;

    let activeStart = lastTime;
    const activeStartValue = lastValue;
    const activeStartPools = { ...lastPools };
    let projectedArrivalPools = { ...arrivalPools };

    if (frozenUntil > lastTime + EPSILON) {
      const freezeEnd = Math.min(frozenUntil, endTime);
      pushPoint(currentPoint(freezeEnd));

      if (frozenUntil >= endTime - EPSILON) {
        return arrivalPools;
      }

      activeStart = frozenUntil;
    }

    if (regenRate > 0 && endTime > activeStart + EPSILON) {
      const naturalArrivalPools = recoverPools(
        activeStartPools,
        (endTime - activeStart) * regenRate,
        maxSp,
      );
      if (Math.abs(poolsSp(naturalArrivalPools) - arrivalValue) < 0.001) {
        projectedArrivalPools = naturalArrivalPools;
      }

      let fullTime: number | null = null;
      if (activeStartValue < maxSp - EPSILON && arrivalValue >= maxSp - EPSILON) {
        fullTime = activeStart + (maxSp - activeStartValue) / regenRate;
        if (fullTime > activeStart + EPSILON && fullTime < endTime - EPSILON) {
          pushPoint({
            time: fullTime,
            sp: maxSp,
            recoverSp: Math.max(0, maxSp - activeStartPools.refundSp),
            refundSp: activeStartPools.refundSp,
            debtSp: 0,
          });
        }
      } else if (activeStartValue >= maxSp - EPSILON) {
        fullTime = activeStart;
      }

      if (
        activeStartPools.refundSp > EPSILON &&
        projectedArrivalPools.refundSp <= EPSILON &&
        fullTime != null
      ) {
        const refundDepleteTime = fullTime + activeStartPools.refundSp / regenRate;
        if (refundDepleteTime > fullTime + EPSILON && refundDepleteTime < endTime - EPSILON) {
          pushPoint({
            time: refundDepleteTime,
            sp: maxSp,
            recoverSp: maxSp,
            refundSp: 0,
            debtSp: 0,
          });
        }
      }
    }

    pushPoint({
      time: endTime,
      sp: arrivalValue,
      recoverSp: projectedArrivalPools.recoverSp,
      refundSp: projectedArrivalPools.refundSp,
      debtSp: projectedArrivalPools.debtSp,
    });

    return projectedArrivalPools;
  }

  function applyArrival(time: number, value: number, pools: SpPools) {
    lastValue = value;
    lastPools = { ...pools };
    lastTime = Math.max(lastTime, time);
  }

  pushPoint(currentPoint(0));

  for (let i = 0; i < simLog.length; i++) {
    const entry = simLog[i];

    if (!entry || (entry.type !== 'SP_REGEN_PAUSE' && entry.type !== 'SP_CHANGE')) {
      continue;
    }

    const now = finiteNumber(entry.time, lastTime);

    if (entry.type === 'SP_CHANGE') {
      const payload = entry.payload;
      const actualChange =
        payload.actualChange != null ? finiteNumber(payload.actualChange) : finiteNumber(payload.change);
      const arrivalValue =
        payload.prevSp != null ? finiteNumber(payload.prevSp) : finiteNumber(payload.sp) - actualChange;
      const arrivalPools: SpPools = {
        recoverSp:
          payload.prevRecoverSp != null ? finiteNumber(payload.prevRecoverSp) : lastPools.recoverSp,
        refundSp:
          payload.prevRefundSp != null ? finiteNumber(payload.prevRefundSp) : lastPools.refundSp,
        debtSp: payload.prevDebtSp != null ? finiteNumber(payload.prevDebtSp) : lastPools.debtSp,
      };

      const projectedArrivalPools = pushNaturalTransition(now, arrivalValue, arrivalPools);
      applyArrival(now, arrivalValue, projectedArrivalPools);

      const nextPools: SpPools = {
        recoverSp:
          payload.recoverSp != null ? finiteNumber(payload.recoverSp) : projectedArrivalPools.recoverSp,
        refundSp:
          payload.refundSp != null ? finiteNumber(payload.refundSp) : projectedArrivalPools.refundSp,
        debtSp: payload.debtSp != null ? finiteNumber(payload.debtSp) : projectedArrivalPools.debtSp,
      };
      const nextValue = finiteNumber(payload.sp, arrivalValue + actualChange);
      const reconciledNextPools =
        actualChange < -EPSILON && !samePools(projectedArrivalPools, arrivalPools)
          ? consumePools(projectedArrivalPools, -actualChange)
          : nextPools;

      pushPoint({
        time: now,
        sp: nextValue,
        actionId: payload.sourceId,
        change: payload.change,
        recoverSp: reconciledNextPools.recoverSp,
        refundSp: reconciledNextPools.refundSp,
        debtSp: reconciledNextPools.debtSp,
      });
      applyArrival(now, nextValue, reconciledNextPools);
      continue;
    }

    const pauseValue = finiteNumber(entry.payload.sp, lastValue);
    const projectedPausePools = pushNaturalTransition(now, pauseValue, lastPools);
    applyArrival(now, pauseValue, projectedPausePools);

    frozenUntil = Math.max(frozenUntil, now + finiteNumber(entry.payload.duration));
    pushPoint(currentPoint(now));
  }

  const naturalEnd =
    regenRate > 0 && lastValue < maxSp - EPSILON
      ? Math.max(timelineDuration, lastTime + (maxSp - lastValue) / regenRate)
      : timelineDuration;

  const projectedEnd = Math.max(lastTime, naturalEnd);
  if (projectedEnd > lastTime + EPSILON) {
    const endValue =
      regenRate > 0 ? Math.min(maxSp, lastValue + (projectedEnd - lastTime) * regenRate) : lastValue;
    const reachesFull =
      regenRate > 0 && lastValue < maxSp - EPSILON && endValue >= maxSp - EPSILON;
    const fullTime = reachesFull ? lastTime + (maxSp - lastValue) / regenRate : null;
    let endPools = { ...lastPools };

    if (fullTime != null && projectedEnd >= fullTime - EPSILON) {
      endPools = {
        recoverSp: Math.max(0, maxSp - lastPools.refundSp),
        refundSp: lastPools.refundSp,
        debtSp: 0,
      };
    }

    if (regenRate > 0 && endPools.refundSp > EPSILON && endValue >= maxSp - EPSILON) {
      const refundStart = fullTime ?? lastTime;
      const refundDepleteTime = refundStart + endPools.refundSp / regenRate;
      if (projectedEnd >= refundDepleteTime - EPSILON) {
        endPools = { recoverSp: maxSp, refundSp: 0, debtSp: 0 };
      }
    }

    pushNaturalTransition(projectedEnd, endValue, endPools);
  }

  return spSeries;
}
