import type { GameSnapshot } from '@/simulation/state/types.ts';
import type { SimLogEntry } from '@/simulation/events/event.types.ts';

export interface SpPoint {
  time: number;
  sp: number;
  actionId?: string;
  change?: number;
}

export function projectSpSeries(
  simLog: SimLogEntry[],
  initialSnapshot: GameSnapshot,
  timelineDuration = 120,
): SpPoint[] {
  const spSeries: SpPoint[] = [];

  let lastTime = 0;
  let lastValue = initialSnapshot.team.sp;
  let frozenUntil = 0;

  spSeries.push({ time: 0, sp: lastValue });

  for (let i = 0; i < simLog.length; i++) {
    const entry = simLog[i];

    if (!entry || (entry.type !== 'SP_REGEN_PAUSE' && entry.type !== 'SP_CHANGE')) {
      continue;
    }

    const now = entry.time;

    let arrivalValue = lastValue;

    if (entry.type === 'SP_CHANGE') {
      arrivalValue = entry.payload.sp - entry.payload.change;
    } else if (entry.type === 'SP_REGEN_PAUSE') {
      arrivalValue = entry.payload.sp;
    } else {
      arrivalValue = lastValue;
    }

    if (now > lastTime) {
      if (frozenUntil > lastTime) {
        if (frozenUntil < now) {
          spSeries.push({ time: frozenUntil, sp: lastValue });
          spSeries.push({ time: now, sp: arrivalValue });
        } else {
          spSeries.push({ time: now, sp: lastValue });
          arrivalValue = lastValue;
        }
      } else {
        spSeries.push({ time: now, sp: arrivalValue });
      }
    }

    if (entry.type === 'SP_CHANGE') {
      lastValue = entry.payload.sp;
      spSeries.push({
        time: now,
        sp: lastValue,
        actionId: entry.payload.sourceId,
        change: entry.payload.change,
      });
    } else if (entry.type === 'SP_REGEN_PAUSE') {
      lastValue = arrivalValue;

      const newFreezeEnd = now + entry.payload.duration;
      frozenUntil = Math.max(frozenUntil, newFreezeEnd);

      // lookahead
      let nextEventTime = Infinity;
      for (let j = i + 1; j < simLog.length; j++) {
        const nextEntry = simLog[j];
        if (!nextEntry) {
          break;
        }
        if (nextEntry.type === 'SP_CHANGE' || nextEntry.type === 'SP_REGEN_PAUSE') {
          nextEventTime = nextEntry.time;
          break;
        }
      }

      if (nextEventTime > newFreezeEnd) {
        spSeries.push({ time: newFreezeEnd, sp: lastValue });
        lastTime = Math.max(lastTime, newFreezeEnd);
      }
    }

    lastTime = Math.max(lastTime, now);
  }

  if (frozenUntil > lastTime) {
    spSeries.push({ time: frozenUntil, sp: lastValue });
    lastTime = frozenUntil;
  }

  const maxSp = initialSnapshot.team.maxSp;
  const regenRate = initialSnapshot.team.spRegenRate;
  const regenDuration = (maxSp - lastValue) / regenRate;
  const regenEndTime = lastTime + regenDuration;
  spSeries.push({ time: regenEndTime, sp: maxSp });

  if (regenEndTime < timelineDuration) {
    spSeries.push({ time: timelineDuration, sp: maxSp });
  }

  return spSeries;
}
