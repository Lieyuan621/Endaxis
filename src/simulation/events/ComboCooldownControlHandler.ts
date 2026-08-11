import type { EventHandler } from '@/simulation/events/EventHandler';
import type { ComboCooldownControlEvent } from '@/simulation/events/event.types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';

export class ComboCooldownControlHandler implements EventHandler<ComboCooldownControlEvent> {
  handle(event: ComboCooldownControlEvent, ctx: SimulationContext) {
    for (const actorId of ctx.allTrackIds) {
      if (event.payload.mode === 'ready') {
        ctx.clearComboCooldown(actorId, event.time);
        continue;
      }
      const duration = Number(event.payload.cooldownByActorId[actorId]) || 0;
      ctx.startComboCooldown(
        actorId,
        event.time,
        duration,
        `${event.payload.eventId}:${actorId}`,
        undefined,
        true,
      );
    }
  }
}
