import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { ActionEndEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class ActionEndHandler implements EventHandler<ActionEndEvent> {
  handle(e: ActionEndEvent, ctx: SimulationContext) {
    ctx.simLog({
      type: "ACTION_END",
      time: e.time,
      payload: {
        skillId: e.payload.skillId,
        actionId: e.payload.actionId,
        type: e.payload.type,
        spGain: e.payload.spGain,
        spGainKind: e.payload.spGainKind,
      },
    });
    if (e.payload.spGain && e.payload.spGain > 0) {
      // 技能SP恢复
      ctx.queue.enqueue({
        type: "SP_CHANGE",
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.actorId,
          spChange: e.payload.spGain,
          sourceKind: e.payload.spGainKind || "recover",
          reason: "skill",
          sourceId: e.payload.actionId,
          parent: e,
        },
      });
    } else if (e.payload.type === "execution") {
      // 处决SP恢复
      ctx.queue.enqueue({
        type: "SP_CHANGE",
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.actorId,
          spChange: ctx.state.enemy.config.executionRecovery,
          sourceKind: "recover",
          reason: "execution",
          sourceId: e.payload.actionId,
          parent: e,
        },
      });
    }
  }
}
