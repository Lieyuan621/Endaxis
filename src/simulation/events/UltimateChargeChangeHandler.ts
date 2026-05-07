import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import type { UltimateChargeChangeEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

function isUltimateChargeBlocked(
  ctx: SimulationContext,
  actorId: string,
  time: number,
  excludeActionId: string | null = null,
) {
  const epsilon = 0.0001;

  return ctx.getActionsForActor(actorId).some((action) => {
    if (action.node.type !== "ultimate" || action.node.isDisabled) {
      return false;
    }

    if (excludeActionId && action.id === excludeActionId) {
      return false;
    }

    const start = action.realStartTime;
    const blockDuration =
      (Number(action.node.animationTime) || 0) +
      (Number(action.node.enhancementTime) || 0);
    if (blockDuration <= 0) {
      return false;
    }

    const end = ctx.getShiftedEndTime(start, blockDuration, action.id);
    return time > start + epsilon && time < end - epsilon;
  });
}

export class UltimateChargeChangeHandler
  implements EventHandler<UltimateChargeChangeEvent>
{
  handle(e: UltimateChargeChangeEvent, ctx: SimulationContext) {
    const actor = ctx.state.getActor(e.payload.actorId);

    if (
      e.payload.change > 0 &&
      e.payload.isTeamGain &&
      e.payload.sourceActorId &&
      e.payload.actorId !== e.payload.sourceActorId &&
      actor.snapshotData.acceptTeamGauge === false
    ) {
      return;
    }

    if (
      e.payload.change > 0 &&
      isUltimateChargeBlocked(
        ctx,
        e.payload.actorId,
        e.time,
        e.payload.actionId || null,
      )
    ) {
      return;
    }

    const efficiency = (Number(actor.snapshotData.stats?.ult_charge_eff) || 100) / 100;
    const actualChange =
      e.payload.change > 0 ? e.payload.change * efficiency : e.payload.change;

    const gauge = actor.modifyGauge(actualChange);

    ctx.simLog({
      type: "ULTIMATE_CHARGE_CHANGE",
      time: e.time,
      payload: {
        actorId: e.payload.actorId,
        gauge,
        maxGauge: actor.getMaxGauge(),
        change: actualChange,
        sourceId: e.payload.sourceId,
        reason: e.payload.reason,
      },
    });
  }
}