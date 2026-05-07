import { GameState } from "@/simulation/state/GameState.ts";
import type { SimEvent, SimLogEntry } from "@/simulation/events/event.types.ts";
import type { GameSnapshot } from "@/simulation/state/types.ts";
import type { ResolvedAction } from "../compiler/types";

export interface SimulationContext {
  state: GameState;
  queue: {
    enqueue: (event: SimEvent) => void;
  };
  simLog: (entry: SimLogEntry) => void;
  getAction: (id: string) => ResolvedAction | undefined;
  getActionsForActor: (actorId: string) => ResolvedAction[];
  getShiftedEndTime: (
    startTime: number,
    duration: number,
    excludeActionId?: string | null,
  ) => number;
}

export interface EventHookContext extends SimulationContext {
  beforeSnapshot: GameSnapshot;
  afterSnapshot: GameSnapshot;
}
