import type { SimEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';

export interface EventHandler<E extends SimEvent> {
  handle(event: E, ctx: SimulationContext): void;
}
