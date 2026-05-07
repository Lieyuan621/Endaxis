import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { ActionStartEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class ActionStartHandler implements EventHandler<ActionStartEvent> {
  handle(e: ActionStartEvent, ctx: SimulationContext) {
    ctx.simLog({
      type: "ACTION_START",
      time: e.time,
      payload: {
        skillId: e.payload.skillId,
        actionId: e.payload.actionId,
        type: e.payload.type,
        spCost: e.payload.spCost,
      },
    });

    const spFreezeDuration = this.getSpFreezeDuration(e);
    if (spFreezeDuration > 0) {
      // 暂停SP再生
      ctx.queue.enqueue({
        type: "SP_REGEN_PAUSE",
        time: ctx.state.getCurrentTime(),
        payload: {
          sourceId: e.payload.actorId,
          duration: spFreezeDuration,
        },
      });
    }

    if (e.payload.spCost && e.payload.spCost > 0) {
      // 技能SP消耗
      ctx.queue.enqueue({
        type: "SP_CHANGE",
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.actorId,
          spChange: -e.payload.spCost,
          reason: e.payload.type === "skill" ? "skill_cost" : "cost",
          sourceId: e.payload.actionId,
          parent: e,
        },
      });
    }
  }

  private getSpFreezeDuration(e: ActionStartEvent) {
    if (e.payload.type === "skill") {
      return 0.5;
    }
    if (e.payload.type === "ultimate" || e.payload.type === "link") {
      return e.payload.freezeDuration ?? 1.5;
    }
    return 0;
  }
}
