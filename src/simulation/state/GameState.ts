import type { BaseGameState } from "@/simulation/state/BaseGameState.ts";
import type {
  ActorSnapshot,
  EnemyConfig,
  GameSnapshot,
  TeamConfig,
} from "@/simulation/state/types.ts";
import { TeamState } from "@/simulation/state/TeamState.ts";
import { EnemyState } from "@/simulation/state/EnemyState.ts";
import type { SimulationEngine } from "../engine/SimulationEngine";
import { ActorState } from "./ActorState";
import { OperatorEffectState } from "./OperatorEffectState";

export class GameState implements BaseGameState<GameSnapshot> {
  team: TeamState;
  enemy: EnemyState;
  private actors: Map<string, ActorState> = new Map();
  private operatorEffects: Map<string, OperatorEffectState> = new Map();
  private currentTime: number = 0;
  private initialSnapshot: GameSnapshot;

  constructor(
    teamConfig: TeamConfig,
    enemyConfig: EnemyConfig,
    _engine: SimulationEngine,
  ) {
    this.team = new TeamState(teamConfig, _engine);
    this.enemy = new EnemyState(enemyConfig, _engine);
    this.initialSnapshot = this.snapshot();
  }

  advanceTime(deltaTime: number) {
    this.currentTime += deltaTime;
    this.team.advanceTime(deltaTime, this.currentTime);
    this.enemy.advanceTime(deltaTime, this.currentTime);
  }

  setActor(actorSnapshot: ActorSnapshot) {
    this.actors.set(actorSnapshot.id, new ActorState(actorSnapshot));
    if (!this.operatorEffects.has(actorSnapshot.id)) {
      this.operatorEffects.set(actorSnapshot.id, new OperatorEffectState(actorSnapshot.id));
    }
    this.initialSnapshot = this.snapshot();
  }

  getActor(id: string): ActorState {
    const actor = this.actors.get(id);
    if (!actor) {
      throw new Error(`Actor ${id} not found`);
    }
    return actor;
  }

  getActors(): ActorState[] {
    return Array.from(this.actors.values());
  }

  getOperatorEffects(trackId: string): OperatorEffectState {
    let state = this.operatorEffects.get(trackId);
    if (!state) {
      state = new OperatorEffectState(trackId);
      this.operatorEffects.set(trackId, state);
    }
    return state;
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getInitialSnapshot() {
    return this.initialSnapshot;
  }

  snapshot(): GameSnapshot {
    return {
      team: this.team.snapshot(),
      enemy: this.enemy.snapshot(),
      actors: this.getActors().map((actor) => actor.snapshot()),
    };
  }
  exportCarryoverSnapshot(time = this.currentTime) {
    const base = this.snapshot();

    return {
      ...base,
      time,
      enemyCarryover: this.enemy.exportCarryoverSnapshot(time),
      operatorEffects: this.getActors().map((actor) => ({
        trackId: actor.id,
        effects: this.getOperatorEffects(actor.id).exportCarryoverEntries(time),
        oneTimeEffects: this.getOperatorEffects(actor.id).exportCarryoverOneTimeEntries(time),
      })),
    };
  }
}
