import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { SpChangeEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';
import { passesSkillFilter } from '@/data/filter';

export class SpChangeHandler implements EventHandler<SpChangeEvent> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(e: SpChangeEvent, ctx: SimulationContext) {
    let sp = e.payload.spChange;
    const isReturn = e.payload.spType === 'return';

    // Apply recovery modifiers only to positive recovery-type SP gains
    if (sp > 0 && !isReturn) {
      const action = ctx.getAction(e.payload.sourceId);
      // Prefer event-level stamps (HitHandler sets these from hit.skillType/skillId so
      // sub-variants carry the right pair); fall back to action.node when the event
      // came from a non-hit pathway.
      const type = e.payload.skillType ?? action?.node.type;
      const skillId = e.payload.skillId ?? action?.node.skillId;
      const time = ctx.state.getCurrentTime();
      const entries = ctx.getOperatorEffects(e.payload.actorId).getActiveEntries(time);
      let flat = 0;
      let percent = 0;
      for (const entry of entries) {
        if (!entry.stat) continue;
        const { modifier } = entry.stat;
        if (modifier !== 'spRecoveryFlat' && modifier !== 'spRecoveryPercent') continue;
        // `skillTypes` modifier scope matches the action's type (covers sub-variants).
        if ('skillTypes' in entry.stat && entry.stat.skillTypes != null) {
          if (!type || !passesSkillFilter(entry.stat.skillTypes, type)) continue;
        }
        // `skillId` modifier scope matches the specific skillId.
        if ('skillId' in entry.stat && entry.stat.skillId != null) {
          if (!skillId || !passesSkillFilter(entry.stat.skillId, skillId)) continue;
        }
        const val = entry.value * entry.stacks;
        if (modifier === 'spRecoveryFlat') flat += val;
        else percent += val / 100;
      }
      sp = (sp + flat) * (1 + percent);
    }

    if (sp > 0) {
      if (isReturn) {
        ctx.state.team.modifySpReturn(sp);
      } else {
        ctx.state.team.modifySpRecovery(sp);
      }
    } else if (sp < 0) {
      // Consumption: consume returned SP first, then recovered
      const { recoveredConsumed, returnedConsumed } = ctx.state.team.consumeSp(-sp);
      // Stamp returned SP consumed on the action for UE scaling in ActionEndHandler
      const action = ctx.getAction(e.payload.sourceId);
      if (action) {
        (action as any)._recoveredConsumed = recoveredConsumed;
        (action as any)._returnedConsumed = returnedConsumed;
        (action as any)._actualSpCost = -sp;
      }
    }

    const spType = isReturn ? 'return' : 'recovery';

    ctx.simLog({
      type: 'SP_CHANGE',
      time: e.time,
      payload: {
        sp: ctx.state.team.getSp(),
        change: sp,
        actorId: e.payload.actorId,
        sourceId: e.payload.sourceId,
        reason: e.payload.reason,
        spType,
        recoverSp: ctx.state.team.getRecoverSp(),
        refundSp: ctx.state.team.getRefundSp(),
        debtSp: ctx.state.team.getDebtSp(),
      },
    });

    // Only trigger onSpRecovery for recovery-type gains
    if (sp > 0 && !isReturn) {
      this.registry?.onSpRecovery({ ...e, payload: { ...e.payload, spChange: sp } }, ctx);
    }
  }
}
