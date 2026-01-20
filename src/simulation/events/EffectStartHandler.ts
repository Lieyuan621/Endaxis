import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { EffectStartEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";
import { Effect } from "@/simulation/effects/types";
import { ReactionRegistry } from "@/mechanics/reactions";

export class EffectStartHandler implements EventHandler<EffectStartEvent> {
  handle(event: EffectStartEvent, ctx: SimulationContext) {
    const { effect } = event.payload;

    const target =
      event.payload.targetId === "boss"
        ? ctx.state.enemy
        : ctx.state.getActor(event.payload.targetId);

    const incoming = new Effect(effect);

    const reaction = ReactionRegistry.check(target.effects, incoming);

    if (reaction) {
      ctx.simLog({
        type: "REACTION_OCCURRED",
        time: event.time,
        payload: {
          reactionName: reaction.name,
          actorId: event.payload.actorId,
        },
      });

      reaction.removeIds.forEach((id) => {
        ctx.queue.enqueue({
          type: "EFFECT_END",
          time: ctx.state.getCurrentTime(),
          payload: {
            effectInstanceId: id,
            type: "consumption",
          },
        });
      });

      reaction.spawnEffects.forEach((newEff) => {
        ctx.queue.enqueue({
          type: "EFFECT_START",
          time: ctx.state.getCurrentTime(),
          payload: {
            effect: newEff,
            targetId: event.payload.targetId,
            actorId: event.payload.actorId,
          },
        });
      });

      if (reaction.cancelIncoming) {
        return;
      }
    }

    const appliedInstance = target.effects.add(new Effect(effect));

    ctx.simLog({
      type: "EFFECT_START",
      time: event.time,
      payload: {
        effectSnapshot: appliedInstance.effect.snapshot(),
        targetId: event.payload.targetId,
      },
    });

    ctx.queue.enqueue({
      type: "EFFECT_END",
      time: effect.startTime + effect.duration,
      payload: {
        effectInstanceId: appliedInstance.id,
        type: "expiration",
      },
    });
  }
}
