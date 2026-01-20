import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import {
  CalculationPipeline,
  OriginiumArtsModifier,
} from "../calculation/CalculationPipeline";
import type { StaggerContext } from "../calculation/type";
import type { StaggerChangeEvent } from "@/simulation/events/event.types.ts";
import type { SimulationContext } from "@/simulation/engine/SimulationContext.ts";

export class StaggerChangeHandler implements EventHandler<StaggerChangeEvent> {
  private pipeline = new CalculationPipeline<StaggerContext>();

  constructor() {
    this.pipeline.add(OriginiumArtsModifier);
  }

  handle(e: StaggerChangeEvent, ctx: SimulationContext) {
    const { stagger, actorId: sourceId } = e.payload;

    const actor = ctx.state.getActor(sourceId);

    const staggerCtx: StaggerContext = {
      source: actor.snapshotData,
      target: ctx.state.enemy,
      baseValue: stagger,
      tags: [],
      state: ctx.state,
    };

    const result = this.pipeline.execute(staggerCtx, stagger);

    if (result.finalValue <= 0) {
      return;
    }

    const { broken, breakEnd, nodeReachedIndex, nodeEndTime } =
      ctx.state.enemy.addStagger(result.finalValue, ctx.state.getCurrentTime());

    ctx.simLog({
      type: "STAGGER",
      time: e.time,
      payload: {
        actorId: actor.id,
        actionId: e.payload.actionId,
        amount: result.finalValue,
        stagger: ctx.state.enemy.getStagger(),
        isBroken: broken,
        breakEndTime: breakEnd,
        nodeReachedIndex,
        nodeEndTime,
      },
    });
  }
}
