import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { DamageTickEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class DamageHandler implements EventHandler<DamageTickEvent> {
  handle(e: DamageTickEvent, ctx: SimulationContext) {
    // TODO: 伤害计算

    if (e.payload.tickData) {
      ctx.simLog({
        type: "DAMAGE_TICK",
        time: e.time,
        payload: {
          targetId: e.payload.targetId,
          sourceId: e.payload.sourceId,
          damage: e.payload.damage,
          stagger: e.payload.tickData.stagger,
          tickData: e.payload.tickData,
          actionId: e.payload.actionId,
        },
      });
    }

    if (e.payload.tickData.stagger > 0) {
      ctx.queue.enqueue({
        type: "STAGGER_CHANGE",
        time: ctx.state.getCurrentTime(),
        payload: {
          stagger: e.payload.tickData.stagger,
          actorId: e.payload.sourceId,
          actionId: e.payload.actionId,
          targetId: e.payload.targetId,
        },
      });
    }

    if (e.payload.tickData?.sp > 0) {
      // 击中SP恢复
      ctx.queue.enqueue({
        type: "SP_CHANGE",
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.sourceId,
          spChange: e.payload.tickData.sp,
          sourceKind: e.payload.tickData.spKind || "recover",
          reason: "damage",
          sourceId: e.payload.actionId,
          parent: e,
        },
      });
    }
  }
}
