import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { SpChangeEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class SpChangeHandler implements EventHandler<SpChangeEvent> {
  handle(e: SpChangeEvent, ctx: SimulationContext) {
    // TODO: run sp change through calculation pipeline
    let recoverConsumed = 0;

    if (e.payload.spChange > 0) {
      ctx.state.team.addSp(
        e.payload.spChange,
        e.payload.sourceKind || "recover",
      );
    } else if (e.payload.spChange < 0) {
      const consumeResult = ctx.state.team.consumeSp(Math.abs(e.payload.spChange));
      recoverConsumed = consumeResult.recoverConsumed;

      if (recoverConsumed > 0 && e.payload.reason === "skill_cost") {
        const baseTeamCharge = recoverConsumed * 0.065;
        ctx.state.getActors().forEach((actor) => {
          ctx.queue.enqueue({
            type: "ULTIMATE_CHARGE_CHANGE",
            time: e.time,
            payload: {
              actorId: actor.id,
              sourceActorId: e.payload.actorId,
              actionId: e.payload.sourceId,
              change: baseTeamCharge,
              reason: "skill_sp_recover",
              sourceId: e.payload.sourceId,
              isTeamGain: true,
              parent: e,
            },
          });
        });
      }
    }

    ctx.simLog({
      type: "SP_CHANGE",
      time: e.time,
      payload: {
        sp: ctx.state.team.getSp(),
        change: e.payload.spChange,
        sourceId: e.payload.sourceId,
        reason: e.payload.reason,
        sourceKind: e.payload.sourceKind,
        recoverSp: ctx.state.team.getRecoverSp(),
        refundSp: ctx.state.team.getRefundSp(),
        debtSp: ctx.state.team.getDebtSp(),
      },
    });
  }
}
