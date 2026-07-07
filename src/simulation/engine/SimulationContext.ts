import { GameState } from '@/simulation/state/GameState.ts';
import type { SimEvent, SimLogEntry } from '@/simulation/events/event.types.ts';
import type { GameSnapshot } from '@/simulation/state/types.ts';
import type { ResolvedAction } from '../compiler/types';
import type { EnemyStateEvent, OperatorStateEvent } from '../engine/types';
import type { OperatorEffectState } from '../state/OperatorEffectState';
import type { BaseStatValues } from '@/data/stats/types';
import type { EnemyResistance } from '@/data/enemyResistance';
export interface SimulationContext {
  /** All compiled actions in the timeline (used for cooldown-reduction targeting). */
  getAllActions: () => readonly ResolvedAction[];
  state: GameState;
  queue: {
    enqueue: (event: SimEvent, priority?: number) => void;
    cancel: (predicate: (event: SimEvent) => boolean) => void;
    collect: (predicate: (event: SimEvent) => boolean) => SimEvent[];
  };
  /** Current scheduled end time per action ID. Updated by HitHandler when a hit extends the action. */
  actionEndTimes: Map<string, number>;
  simLog: (entry: SimLogEntry) => void;
  getAction: (id: string) => ResolvedAction | undefined;
  enemyLog: (event: EnemyStateEvent) => void;
  operatorLog: (event: OperatorStateEvent) => void;
  getOperatorEffects: (trackId: string) => OperatorEffectState;
  /** Returns actor-level config flags for a given track. */
  getActorMeta: (trackId: string) => {
    acceptTeamUltEnergy: boolean;
    acceptSelfSpCostUltEnergy: boolean;
    ultimateEnergyCostOverride?: number | null;
  };
  /** All track IDs currently active in the simulation. */
  allTrackIds: string[];
  /** Map of trackId → operator element (for teamExcludeSameElement scope resolution). */
  elementByTrackId: ReadonlyMap<string, string | undefined>;
  /** Status keys that need consumedStacks written at apply time (auto-inferred from readConsumedStacks). */
  consumedStacksWriteKeys: Set<string>;
  /** Compute the real-time end point of a duration starting at startTime, accounting for any time freezes within the window. */
  getShiftedTime(startTime: number, duration: number): number;
  isUltimateEnergyBlocked(actorId: string, time: number): boolean;
  /** Base stat values per track for damage calculation (baseAtk, weaponAtk, attrs, etc.). */
  getBaseStats: (trackId: string) => BaseStatValues | undefined;
  /** Enemy defense value for damage calculation. */
  enemyDef: number;
  /** Enemy per-element damage multiplier. 100 = neutral. */
  enemyResistance: EnemyResistance;
  /** Apply enemy-side per-window incoming damage caps, returning the final damage. */
  applyEnemyDamageCap: (time: number, damage: number) => {
    damage: number;
    capped: boolean;
    cap: number;
    usedBefore: number;
    windowStart: number;
    windowEnd: number;
  };
  /** LMDI attribution mode for reaction debuff contributions. */
  lmdiAttributionMode: 'stacks' | 'applier';
  /** Operator (track id) controlled at the given time, or null if none. Derived from switch events. */
  getControlledOperatorAt: (time: number) => string | null;
}

export interface EventHookContext extends SimulationContext {
  beforeSnapshot: GameSnapshot;
  afterSnapshot: GameSnapshot;
}
