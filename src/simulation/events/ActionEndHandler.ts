import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { ActionEndEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import { isBattleSkillLikeAction } from '@/simulation/compiler/types';

const ULT_ENERGY_PER_RECOVERED_SP = 6.5 / 100;

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
      // Scale UE by the real SP actually paid, relative to the base cost the UE gain is calibrated
      // against (node.UE = spCost/100 * 6.5). Both SP-cost reductions and returned SP shrink the
      // real amount paid, so a reduced/free cast grants proportionally less UE. Insufficient SP is
      // ignored. (_actualSpCost is the post-reduction cost the SP_CHANGE actually consumed.)
      const baseCost: number = action.node.spCost ?? 0;
      const finalSpCost: number = (action as any)._actualSpCost ?? baseCost;
      const returnedConsumed: number = (action as any)._returnedConsumed ?? 0;
      const realPaid = finalSpCost - returnedConsumed;
      const ueFraction = baseCost > 0 ? Math.min(1, Math.max(0, realPaid / baseCost)) : 1;

      const ueTime = e.time - 0.01;
      const battleSkillRecoveredConsumed = Number((action as any)._recoveredConsumed) || 0;
      const isBattleSkill = isBattleSkillLikeAction(action.node);
      const actorMeta = ctx.getActorMeta(e.payload.actorId);
      const battleSkillSelfGain =
        battleSkillRecoveredConsumed > 0 && actorMeta.acceptSelfSpCostUltEnergy
          ? battleSkillRecoveredConsumed * ULT_ENERGY_PER_RECOVERED_SP
          : (action.node.ultimateEnergyGain ?? 0) * ueFraction;
      const selfGain = isBattleSkill
        ? battleSkillSelfGain
        : (action.node.ultimateEnergyGain ?? 0) * ueFraction;
      if (selfGain > 0) {
        ctx.queue.enqueue({
          type: 'ULT_ENERGY_CHANGE',
          time: ueTime,
          payload: { actorId: e.payload.actorId, change: selfGain, sourceId: e.payload.actionId },
        });
      }

      // Team gains — emit to all other actors that accept team energy
      const battleSkillTeamGain =
        battleSkillRecoveredConsumed > 0
          ? battleSkillRecoveredConsumed * ULT_ENERGY_PER_RECOVERED_SP
          : (action.node.teamUltimateEnergyGain ?? 0) * ueFraction;
      const teamGain = isBattleSkill
        ? battleSkillTeamGain
        : (action.node.teamUltimateEnergyGain ?? 0) * ueFraction;
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
