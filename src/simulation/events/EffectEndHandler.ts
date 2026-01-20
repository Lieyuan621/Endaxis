import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { EffectEndEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class EffectEndHandler implements EventHandler<EffectEndEvent> {
  handle(event: EffectEndEvent, ctx: SimulationContext) {
    const { effectInstanceId } = event.payload;

    const removed = ctx.state.enemy.effects.remove(effectInstanceId);

    if (!removed) {
      // 状态已经被移除
      return;
    }

    ctx.simLog({
      type: "EFFECT_END",
      time: event.time,
      payload: {
        effectId: removed.effect.id,
        targetId: "",
        type: event.payload.type,
      },
    });
  }
}
