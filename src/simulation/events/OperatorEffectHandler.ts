import type { EventHandler } from './EventHandler';
import type { SimulationContext } from '../engine/SimulationContext';
import type { OperatorEffectApplyEvent, OperatorEffectExpireEvent } from '../engine/types';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';

type OperatorEffectEvents = OperatorEffectApplyEvent | OperatorEffectExpireEvent;

export class OperatorEffectHandler implements EventHandler<OperatorEffectEvents> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(event: OperatorEffectEvents, ctx: SimulationContext): void {
    const state = ctx.getOperatorEffects(event.targetTrackId);

    switch (event.type) {
      case 'OPERATOR_EFFECT_APPLY': {
        state.apply({
          id: event.id,
          stat: event.stat,
          value: event.value,
          stacks: event.stacks,
          maxStacks: event.maxStacks,
          expiresAt: event.expiresAt,
          sourceId: event.sourceId,
          stackStrategy: event.stackStrategy,
          effect: event.effect,
          consumedStacks: event.consumedStacks,
          external: event.external,
        });
        // Permanent passives (expiresAt === Infinity): only store in state, skip log/expiry/triggers
        if (event.expiresAt === Infinity) break;
        const resolvedStacks = state.getStacks(event.id, event.time);
        ctx.operatorLog({ ...event, cumulativeStacks: resolvedStacks });
        if (event.stackStrategy === 'INDEPENDENT') {
          // Each slot has its own expiry — don't cancel previous timers
          ctx.queue.enqueue(
            {
              type: 'OPERATOR_EFFECT_EXPIRE',
              time: event.expiresAt,
              targetTrackId: event.targetTrackId,
              id: event.id,
              consumed: false,
              actionId: event.actionId,
              sourceSkillType: event.sourceSkillType,
              sourceSkillId: event.sourceSkillId,
            },
            2,
          );
        } else {
          // Cancel any previous expiry (REFRESH_DURATION semantics)
          ctx.queue.cancel(
            e =>
              e.type === 'OPERATOR_EFFECT_EXPIRE' &&
              (e as OperatorEffectExpireEvent).id === event.id &&
              (e as OperatorEffectExpireEvent).targetTrackId === event.targetTrackId &&
              e.time > event.time,
          );
          ctx.queue.enqueue(
            {
              type: 'OPERATOR_EFFECT_EXPIRE',
              time: event.expiresAt,
              targetTrackId: event.targetTrackId,
              id: event.id,
              consumed: false,
              actionId: event.actionId,
              sourceSkillType: event.sourceSkillType,
              sourceSkillId: event.sourceSkillId,
            },
            2,
          );
        }
        if (!event.silent && !event.skipStatusAppliedTrigger) {
          this.registry?.onStatusApplied(
              event.id,
              event.stat,
              'self',
              event.sourceId,
              event.time,
              ctx,
              event.sourceSkillType,
              event.sourceSkillId,
              resolvedStacks,
          );
        }
        break;
      }
      case 'OPERATOR_EFFECT_EXPIRE': {
        const expiringStat = state.getStat(event.id);
        // Snapshot all operator stacks before any consume/expire so triggered
        // stack-scaling can read pre-consume values (mirrors enemy pre-consume snapshot).
        const preConsumeOpStacks = state.snapshotStacks();
        let consumedStacks = 1;
        if (event.stacksToConsume !== undefined) {
          const result = state.consumeStacks(event.id, event.stacksToConsume, event.time);
          if (result) {
            consumedStacks = event.stacksToConsume;
            ctx.operatorLog(event);
            if (result.remaining > 0) {
              ctx.operatorLog({
                type: 'OPERATOR_EFFECT_APPLY',
                time: event.time,
                targetTrackId: event.targetTrackId,
                sourceId: result.sourceId,
                id: event.id,
                value: 0,
                stacks: result.remaining,
                maxStacks: result.maxStacks,
                expiresAt: result.expiresAt,
                cumulativeStacks: result.remaining,
                isContinuation: true,
              });
            }
          }
        } else if (state.isIndependent(event.id)) {
          const result = state.expireIndependentSlot(event.id, event.time);
          if (!result) break; // slot was already removed (e.g. trimmed by cap overflow)
          ctx.operatorLog(event);
          if (result.remaining > 0) {
            ctx.operatorLog({
              type: 'OPERATOR_EFFECT_APPLY',
              time: event.time,
              targetTrackId: event.targetTrackId,
              sourceId: result.sourceId,
              id: event.id,
              value: 0,
              stacks: result.remaining,
              maxStacks: result.maxStacks,
              expiresAt: result.nextExpiresAt,
              cumulativeStacks: result.remaining,
              isContinuation: true,
            });
          }
        } else {
          const expiredStacks = state.expire(event.id);
          if (expiredStacks > 0) {
            consumedStacks = expiredStacks;
            ctx.operatorLog(event);
          } else {
            break; // stale expire event — effect already gone
          }
        }
        if (event.consumed) {
          this.registry?.onStatusConsumed(
            event.id,
            expiringStat,
            'self',
            event.targetTrackId,
            event.time,
            ctx,
            consumedStacks,
            event.sourceSkillType,
            event.sourceSkillId,
            undefined,
            preConsumeOpStacks,
          );
        } else {
          this.registry?.onStatusExpire(
            event.id,
            expiringStat,
            'self',
            event.targetTrackId,
            event.time,
            ctx,
            consumedStacks,
            event.sourceSkillType,
            event.sourceSkillId,
            undefined,
            preConsumeOpStacks,
          );
        }
        break;
      }
    }
  }
}
