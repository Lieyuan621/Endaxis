import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { ActionStartEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';
import type { OperatorEffectExpireEvent } from '@/simulation/engine/types';
import { resolveEffectiveActionSkillType } from '@/simulation/events/actionSkillType';
import { consumeSourceQueue } from '@/simulation/state/sourceQueue';
import { evaluateSkillRequisites } from '@/simulation/requisites/evaluateSkillRequisites';

export class ActionStartHandler implements EventHandler<ActionStartEvent> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(e: ActionStartEvent, ctx: SimulationContext) {
    const isPrepAction = this.isPrepAction(e, ctx);
    ctx.simLog({
      type: 'ACTION_START',
      time: e.time,
      payload: {
        skillId: e.payload.skillId,
        actionId: e.payload.actionId,
        type: e.payload.type,
        spCost: isPrepAction ? 0 : e.payload.spCost,
      },
    });
    this.logRequisiteFailures(e, ctx);
    const spFreezeDuration = isPrepAction ? 0 : this.getSpFreezeDuration(e);
    if (spFreezeDuration > 0) {
      // 暂停SP再生
      ctx.queue.enqueue({
        type: 'SP_REGEN_PAUSE',
        time: ctx.state.getCurrentTime(),
        payload: {
          sourceId: e.payload.actorId,
          duration: spFreezeDuration,
        },
      });
    }

    if (!isPrepAction && e.payload.spCost && e.payload.spCost > 0) {
      // Resolve battleSkillSPCostReduction from live active effects
      let finalSpCost = e.payload.spCost;
      const time = ctx.state.getCurrentTime();
      const entries = ctx.getOperatorEffects(e.payload.actorId).getActiveEntries(time);
      let reduction = 0;
      for (const entry of entries) {
        if (entry.stat?.modifier === 'battleSkillSPCostReduction') {
          reduction += entry.value * entry.stacks;
        }
      }
      if (reduction > 0) {
        finalSpCost = Math.max(0, finalSpCost * (1 - reduction / 100));
      }
      ctx.queue.enqueue({
        type: 'SP_CHANGE',
        time,
        payload: {
          actorId: e.payload.actorId,
          spChange: -finalSpCost,
          reason: 'skill',
          sourceId: e.payload.actionId,
          parent: e,
          spType: 'recovery',
        },
      });
    }

    this.consumeLink(e, ctx);
    this.consumeOneTimeEffects(e, ctx);
    this.registry?.onActionStart(e, ctx);
    this.registry?.onDuringAction(e, ctx);
  }

  private isPrepAction(e: ActionStartEvent, ctx: SimulationContext) {
    const prepEnd = Number(ctx.state.team.config.prepDuration) || 0;
    return prepEnd > 0 && e.time < prepEnd - 1e-6;
  }

  private logRequisiteFailures(e: ActionStartEvent, ctx: SimulationContext): void {
    const action = ctx.getAction(e.payload.actionId);
    if (!action) return;

    for (const failure of evaluateSkillRequisites(action, ctx)) {
      ctx.simLog({
        type: 'ACTION_REQUISITE_FAILED',
        time: e.time,
        payload: {
          actionId: e.payload.actionId,
          actorId: e.payload.actorId,
          skillId: e.payload.skillId,
          type: e.payload.type,
          ...failure,
        },
      });
    }
  }

  /** Consume all team-wide link stacks when a battle skill or ultimate starts. */
  private consumeLink(e: ActionStartEvent, ctx: SimulationContext): void {
    const action = ctx.getAction(e.payload.actionId);
    const effectiveType = action
      ? resolveEffectiveActionSkillType(action, e.time, e.payload.actorId, ctx)
      : e.payload.type;
    if (effectiveType !== 'battleSkill' && effectiveType !== 'ultimate') return;

    const time = e.time;
    const linkEntries: { trackId: string; id: string }[] = [];
    // Link pools onto one canonical entry id ('link') replicated per track. Dedup by id
    // for counting; the entry's sourceQueue holds the authoritative per-applier breakdown.
    const deduped = new Map<
      string,
      { stacks: number; sourceId: string; sourceQueue?: SourceSlot[] }
    >();

    for (const trackId of ctx.allTrackIds) {
      const entries = ctx.getOperatorEffects(trackId).getActiveEntries(time);
      for (const entry of entries) {
        if (entry.stat?.modifier === 'link') {
          linkEntries.push({ trackId, id: entry.id });
          if (!deduped.has(entry.id)) {
            deduped.set(entry.id, {
              stacks: entry.stacks,
              sourceId: entry.sourceId,
              sourceQueue: entry.sourceQueue,
            });
          }
        }
      }
    }

    if (deduped.size === 0) return;
    let totalStacks = 0;
    for (const { stacks } of deduped.values()) totalStacks += stacks;
    const consumed = Math.min(totalStacks, 4);

    // Mark the action object
    if (action) {
      if (!action.consumedStacks) action.consumedStacks = {};
      action.consumedStacks.link = consumed;

      // Stamp per-source link attribution for LMDI — from the entry's sourceQueue when
      // present, falling back to the single applier for legacy/queue-less entries.
      const linkSourceMap: Record<string, number> = {};
      for (const { sourceId, stacks, sourceQueue } of deduped.values()) {
        const bySource = sourceQueue?.length
          ? consumeSourceQueue(sourceQueue)
          : { [sourceId]: stacks };
        for (const [sid, n] of Object.entries(bySource)) {
          linkSourceMap[sid] = (linkSourceMap[sid] ?? 0) + n;
        }
      }
      // Scale attribution down to the actually-consumed stack count when over cap.
      const attributed = Object.values(linkSourceMap).reduce((s, n) => s + n, 0);
      if (attributed > consumed && attributed > 0) {
        const scale = consumed / attributed;
        for (const sid of Object.keys(linkSourceMap)) {
          linkSourceMap[sid] = Math.round((linkSourceMap[sid] ?? 0) * scale);
        }
      }
      action.consumedLinkSources = linkSourceMap;
    }

    // Schedule consumption of each link entry at priority 3
    for (const { trackId, id } of linkEntries) {
      ctx.queue.enqueue(
        {
          type: 'OPERATOR_EFFECT_EXPIRE',
          time,
          targetTrackId: trackId,
          id,
          consumed: true,
        } as OperatorEffectExpireEvent,
        3,
      );
    }

    ctx.simLog({
      type: 'LINK_CONSUMED',
      time,
      payload: {
        actionId: e.payload.actionId,
        actorId: e.payload.actorId,
        stacks: consumed,
      },
    });
  }

  /** Consume all one-time effects matching this action's type/skillId and stamp onto the action. */
  private consumeOneTimeEffects(e: ActionStartEvent, ctx: SimulationContext): void {
    const action = ctx.getAction(e.payload.actionId);
    if (!action) return;
    const trackId = e.payload.actorId;
    const effectiveType = resolveEffectiveActionSkillType(action, e.time, trackId, ctx);
    const consumed = ctx
      .getOperatorEffects(trackId)
      .consumeOneTime(effectiveType, action.node.skillId, e.time);
    if (consumed.length > 0) {
      action.consumedStatEffects = consumed;
      for (const c of consumed) {
        ctx.operatorLog({
          type: 'OPERATOR_EFFECT_EXPIRE',
          time: e.time,
          targetTrackId: trackId,
          id: c.id,
          consumed: true,
        });
      }
    }
  }

  private getSpFreezeDuration(e: ActionStartEvent) {
    if (e.payload.type === 'battleSkill') {
      return 0.5;
    }
    if (e.payload.type === 'ultimate' || e.payload.type === 'comboSkill') {
      return e.payload.freezeDuration ?? 1.5;
    }
    return 0;
  }
}
