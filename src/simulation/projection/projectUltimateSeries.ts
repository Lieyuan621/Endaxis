import type { SimLogEntry } from "@/simulation/events/event.types.ts";
import type { GameSnapshot } from "@/simulation/state/types.ts";

export interface GaugePoint {
  time: number;
  val: number;
  ratio: number;
}

export function projectUltimateSeries(
  simLog: SimLogEntry[],
  initialSnapshot: GameSnapshot,
  actorId: string,
  timelineDuration = 120,
): GaugePoint[] {
  const actor = initialSnapshot.actors.find((item) => item.id === actorId);
  if (!actor) {
    return [];
  }

  const maxGauge = Math.max(1, Number(actor.resources?.maxGauge) || 100);
  let currentGauge = Math.max(
    0,
    Math.min(Number(actor.resources?.gauge ?? actor.resources?.ultimateEnergy) || 0, maxGauge),
  );

  const points : GaugePoint[] = [
    { time: 0, val: currentGauge, ratio: currentGauge / maxGauge },
  ];

  simLog.forEach((entry) => {
    if (
      entry.type !== "ULT_ENERGY_CHANGE" ||
      entry.payload.actorId !== actorId
    ) {
      return;
    }

    points.push({
      time: entry.time,
      val: currentGauge,
      ratio: currentGauge / maxGauge,
    });

    currentGauge = Math.max(0, Math.min(currentGauge + (Number(entry.payload.change) || 0), maxGauge));

    points.push({
      time: entry.time,
      val: currentGauge,
      ratio: currentGauge / maxGauge,
    });
  });

  points.push({
    time: timelineDuration,
    val: currentGauge,
    ratio: currentGauge / maxGauge,
  });

  return points;
}
