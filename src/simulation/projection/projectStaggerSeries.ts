import type { EnemyConfig } from '@/simulation/state/types.ts';
import type { GameSnapshot } from '@/simulation/state/types.ts';
import type { SimLogEntry } from '@/simulation/events/event.types.ts';

export interface StaggerData {
  points: { time: number; val: number }[];
  lockSegments: { start: number; end: number }[];
  nodeSegments: {
    start: number;
    end: number;
    nodeIndex: number;
    thresholdVal: number;
  }[];
  nodeStep: number;
}

export function projectStaggerSeries(
  logs: SimLogEntry[],
  initial: GameSnapshot,
  { maxStagger, staggerNodeCount }: EnemyConfig,
  timelineDuration: number = 120,
): StaggerData {
  const points: { time: number; val: number }[] = [];
  const lockSegments: { start: number; end: number }[] = [];
  const nodeSegments: {
    start: number;
    end: number;
    nodeIndex: number;
    thresholdVal: number;
  }[] = [];

  const nodeStep = maxStagger / (staggerNodeCount + 1);

  points.push({ time: 0, val: initial.enemy.stagger });

  let currentStagger = initial.enemy.stagger;

  logs.forEach(log => {
    if (log.type === 'STAGGER') {
      points.push({ time: log.time, val: currentStagger });

      currentStagger = log.payload.stagger;
      points.push({ time: log.time, val: currentStagger });

      if (log.payload.isBroken && log.payload.breakEndTime) {
        lockSegments.push({
          start: log.time,
          end: log.payload.breakEndTime,
        });
      }

      if (log.payload.nodeReachedIndex !== undefined && log.payload.nodeEndTime) {
        nodeSegments.push({
          start: log.time,
          end: log.payload.nodeEndTime,
          nodeIndex: log.payload.nodeReachedIndex,
          thresholdVal: log.payload.nodeReachedIndex * nodeStep,
        });
      }
    }
  });

  const cleanPoints: { time: number; val: number }[] = [];
  if (points.length > 0) {
    const first = points[0];
    if (first) cleanPoints.push(first);

    for (let i = 1; i < points.length; i++) {
      const prev = cleanPoints[cleanPoints.length - 1];
      const curr = points[i];

      if (!prev || !curr) continue;

      if (curr.time === prev.time && Math.abs(curr.val - prev.val) < 0.001) {
        continue;
      }
      cleanPoints.push(curr);
    }
  }

  const finalPoint = { time: timelineDuration, val: currentStagger };
  cleanPoints.push(finalPoint);

  return {
    points: cleanPoints,
    lockSegments,
    nodeSegments,
    nodeStep,
  };
}
