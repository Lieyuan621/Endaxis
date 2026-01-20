import type { ActorSnapshot, EnemyConfig, TeamConfig } from "../state/types.ts";
import { PriorityQueue } from "@/simulation/engine/PriorityQueue.ts";
import type { EventHandler } from "@/simulation/events/EventHandler.ts";
import { GameState } from "@/simulation/state/GameState.ts";
import type {
  SimEvent,
  SimEventType,
  SimLogEntry,
} from "@/simulation/events/event.types.ts";
import type {
  EventHookContext,
  SimulationContext,
} from "@/simulation/engine/SimulationContext.ts";
import type { ResolvedTimeline } from "../compiler/types.ts";

type SimEventHook = (event: SimEvent, ctx: EventHookContext) => void;

export class SimulationEngine {
  private queue = new PriorityQueue<SimEvent>();
  private handlers = new Map<SimEventType, EventHandler<SimEvent>>();
  private listeners = new Set<SimEventHook>();
  private state: GameState;
  private simLog = new PriorityQueue<SimLogEntry>();

  constructor(
    private timeline: ResolvedTimeline,
    teamConfig: TeamConfig,
    enemyConfig: EnemyConfig,
    private actors: ActorSnapshot[],
  ) {
    this.state = new GameState(teamConfig, enemyConfig, this);

    this.actors.forEach((actor) => {
      this.state.setActor(actor);
    });
  }

  getState() {
    return this.state;
  }

  registerHandler<E extends SimEvent>(
    type: E["type"],
    handler: EventHandler<E>,
  ) {
    this.handlers.set(type, handler);
  }

  subscribe(listener: SimEventHook): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  enqueue(event: SimEvent) {
    this.queue.enqueue(event);
  }

  getAction(id: string) {
    return this.timeline.actionMap.get(id);
  }

  getSimLog(): SimLogEntry[] {
    return this.simLog.toArray();
  }

  getShiftedTime(startTime: number, duration: number) {
    return this.timeline.timeContext.getShiftedEndTime(startTime, duration);
  }

  run() {
    const ctx: SimulationContext = {
      state: this.state,
      queue: { enqueue: this.enqueue.bind(this) },
      simLog: (entry: SimLogEntry) => {
        this.simLog.enqueue(entry);
      },
      getAction: this.getAction.bind(this),
    };

    while (!this.queue.isEmpty()) {
      const event = this.queue.dequeue()!;

      if (event.time > this.state.getCurrentTime()) {
        const dt = event.time - this.state.getCurrentTime();
        this.state.advanceTime(dt);
        // TODO: may need emit simLog events for state changes
      }

      const handler = this.handlers.get(event.type);
      if (handler) {
        handler.handle(event, ctx);
      } else {
        throw new Error(`No handler for event type: ${event.type}`);
      }
    }

    return this.state;
  }
}
