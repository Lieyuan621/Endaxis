import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { BattleStartEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';

export class BattleStartHandler implements EventHandler<BattleStartEvent> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(_e: BattleStartEvent, ctx: SimulationContext) {
    this.registry?.onBattleStart(ctx);
  }
}
