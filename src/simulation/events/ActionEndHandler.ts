import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { ActionEndEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import { isBattleSkillLikeAction } from '@/simulation/compiler/types';

export class ActionEndHandler implements EventHandler<ActionEndEvent> {
  handle(e: ActionEndEvent, ctx: SimulationContext) {
    // Defer if there are still pending hits beyond this time (conditional hits with
    // durationExtension can have offsets past the base action duration).
    ctx.simLog({
      type: 'ACTION_END',
      time: e.time,
      payload: {
        skillId: e.payload.skillId,
        actionId: e.payload.actionId,
        type: e.payload.type,
      },
    });
    if (e.payload.type === 'finisher') {
      const finisherRecovery = ctx.state.enemy.config.finisherRecovery ?? 0;
      if (finisherRecovery <= 0) return;
      ctx.queue.enqueue({
        type: 'SP_CHANGE',
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.actorId,
          spChange: finisherRecovery,
          reason: 'finisher',
          sourceId: e.payload.actionId,
          parent: e,
          spType: 'recovery',
        },
      });
    }

    const action = ctx.getAction(e.payload.actionId);
    if (action) {
      if (isBattleSkillLikeAction(action.node)) return;

      // Scale down UE proportionally to returned SP consumed.
      // Insufficient SP is ignored — only returned SP reduces UE gain.
      const actualCost: number = (action as any)._actualSpCost ?? action.node.spCost ?? 0;
      const returnedConsumed: number = (action as any)._returnedConsumed ?? 0;
      const ueFraction = actualCost > 0 ? 1 - returnedConsumed / actualCost : 1;

      const ueTime = e.time - 0.01;
      const selfGain = (action.node.ultimateEnergyGain ?? 0) * ueFraction;
      if (selfGain > 0) {
        ctx.queue.enqueue({
          type: 'ULT_ENERGY_CHANGE',
          time: ueTime,
          payload: { actorId: e.payload.actorId, change: selfGain, sourceId: e.payload.actionId },
        });
      }

      // Team gains — emit to all other actors that accept team energy
      const teamGain = (action.node.teamUltimateEnergyGain ?? 0) * ueFraction;
      if (teamGain > 0) {
        for (const targetId of ctx.allTrackIds) {
          if (targetId === e.payload.actorId) continue;
          const targetMeta = ctx.getActorMeta(targetId);
          if (!targetMeta.acceptTeamUltEnergy) continue;
          ctx.queue.enqueue({
            type: 'ULT_ENERGY_CHANGE',
            time: ueTime,
            payload: { actorId: targetId, change: teamGain, sourceId: e.payload.actionId },
          });
        }
      }
    }
  }
}
