import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { SpRegenPauseEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';

export class SpRegenPauseHandler implements EventHandler<SpRegenPauseEvent> {
  handle(e: SpRegenPauseEvent, ctx: SimulationContext) {
    const prepEnd = Number(ctx.state.team.config.prepDuration) || 0;
    if (prepEnd > 0 && e.time < prepEnd - 0.0001) {
      // 战前准备区：技力不会发生任何变化（不需要记录/暂停回复）
      return;
    }

    ctx.simLog({
      type: 'SP_REGEN_PAUSE',
      time: e.time,
      payload: {
        sourceId: e.payload.sourceId,
        duration: e.payload.duration,
        sp: ctx.state.team.getSp(),
      },
    });
    ctx.state.team.pauseSpRegen(e.payload.duration);
  }
}
