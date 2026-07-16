import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import { CalculationPipeline } from '../calculation/CalculationPipeline';
import type { StaggerContext } from '../calculation/type';
import type { StaggerChangeEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import { passesSkillFilter } from '@/data/filter';

export class StaggerChangeHandler implements EventHandler<StaggerChangeEvent> {
  private pipeline = new CalculationPipeline<StaggerContext>();

  handle(e: StaggerChangeEvent, ctx: SimulationContext) {
    let { stagger, actorId: sourceId } = e.payload;

    const actor = ctx.state.getActor(sourceId);

    // Apply stagger modifiers (flat/percent) from active effects.
    // `stat.skillTypes` matches the action's type (generic group); `stat.skillId` matches
    // the specific skill identity (including sub-variants).
    {
      const skillType = e.payload.skillType;
      const skillId = e.payload.skillId;
      const time = ctx.state.getCurrentTime();
      const entries = ctx.getOperatorEffects(sourceId).getActiveEntries(time);
      let flat = 0;
      let percent = 0;
      for (const entry of entries) {
        if (!entry.stat) continue;
        const { modifier } = entry.stat;
        if (modifier !== 'staggerFlat' && modifier !== 'staggerPercent') continue;
        if ('skillTypes' in entry.stat && entry.stat.skillTypes != null) {
          if (!skillType || !passesSkillFilter(entry.stat.skillTypes, skillType)) continue;
        }
        if ('skillId' in entry.stat && entry.stat.skillId != null) {
          if (!skillId || !passesSkillFilter(entry.stat.skillId, skillId)) continue;
        }
        const val = entry.value * entry.stacks;
        if (modifier === 'staggerFlat') flat += val;
        else percent += val / 100;
      }
      stagger = (stagger + flat) * (1 + percent);
    }

    // Arts intensity stagger mult for Lift/Knockdown — multiplicative with staggerPercent
    if (e.payload.reactionStaggerMult != null) {
      stagger *= e.payload.reactionStaggerMult;
    }

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

    // Record contribution before addStagger (which may freeze & reset on break)
    ctx.state.enemy.addStaggerContribution(actor.id, result.finalValue);

    const { broken, breakEnd, nodeReachedIndex, nodeEndTime } = ctx.state.enemy.addStagger(
      result.finalValue,
      ctx.state.getCurrentTime(),
    );

    ctx.simLog({
      type: 'STAGGER',
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

    // Surface each stagger node as an internal enemy status so effects
    // that watch for nodes (e.g. Akekuri's combo window) can activate via the
    // standard onStatusApplied/Expire trigger pipeline.
    if (nodeReachedIndex !== undefined && nodeEndTime !== undefined && !broken) {
      ctx.queue.enqueue(
        {
          type: 'ENEMY_EFFECT_APPLY',
          time: e.time,
          kind: 'status',
          id: 'staggerNode',
          value: 0,
          stacks: 1,
          maxStacks: 1,
          expiresAt: nodeEndTime,
          sourceId: actor.id,
          effect: { kind: 'status', hide: true },
        },
        0,
      );
    }

    // Surface the break window as an internal enemy status so passive effects
    // gated on `condition: { kind: 'enemyStaggered' }` activate via the
    // standard onStatusApplied/Expire trigger pipeline.
    if (broken && breakEnd !== undefined) {
      ctx.queue.enqueue(
        {
          type: 'ENEMY_EFFECT_APPLY',
          time: e.time,
          kind: 'status',
          id: 'staggered',
          value: 0,
          stacks: 1,
          maxStacks: 1,
          expiresAt: breakEnd,
          sourceId: actor.id,
          effect: { kind: 'status', hide: true } as any,
        },
        1,
      );
    }
  }
}
