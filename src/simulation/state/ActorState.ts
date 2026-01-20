import type { ActorSnapshot } from "@/simulation/state/types.ts";
import type { BaseGameState } from "./BaseGameState";
import { EffectManager } from "./EffectManager";

export class ActorState implements BaseGameState<ActorSnapshot> {
  public effects: EffectManager;

  constructor(public readonly snapshotData: ActorSnapshot) {
    this.effects = new EffectManager();
  }

  get id() {
    return this.snapshotData.id;
  }

  advanceTime(_dt: number, _currentTime: number) {}

  snapshot(): ActorSnapshot {
    return this.snapshotData;
  }
}
