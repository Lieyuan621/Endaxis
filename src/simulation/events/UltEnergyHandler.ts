import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { UltEnergyChangeEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';

export class UltEnergyHandler implements EventHandler<UltEnergyChangeEvent> {
  handle(e: UltEnergyChangeEvent, ctx: SimulationContext) {
    const actor = ctx.state.getActor(e.payload.actorId);
    const rawChange = Number(e.payload.change) || 0;
    if (rawChange > 0 && ctx.isUltimateEnergyBlocked(e.payload.actorId, e.time)) {
      return;
    }
    const stats = actor.snapshot().stats as any;
    const efficiency = rawChange > 0 ? Math.max(0, Number(stats?.ult_charge_eff) || 100) / 100 : 1;
    const change = rawChange * efficiency;
    const gauge = actor.modifyGauge(change);

    ctx.simLog({
      type: 'ULT_ENERGY_CHANGE',
      time: e.time,
      payload: {
        actorId: e.payload.actorId,
        change,
        gauge,
        sourceId: e.payload.sourceId,
      },
    });
  }
}
