import type {
  ActorStats,
  ResolvedAction,
  ResolvedEffect,
} from "@/simulation/compiler/types.ts";
import type { BaseStatValues } from "@/data/stats/types";
import type { EnemyResistance } from "@/data/enemyResistance";

export interface ActorSnapshot {
  id: string;
  element?: string;
  stats: ActorStats;
  baseStats?: BaseStatValues | null;
  triggerEffects?: any[];
  acceptTeamGauge?: boolean;
  acceptTeamUltEnergy?: boolean;
  acceptSelfSpCostUltEnergy?: boolean;
  ultimateEnergyCostOverride?: number | null;
  resources: {
    hp: number;
    gauge: number;
    maxGauge: number;
    ultimateEnergy?: number;
  };
  cooldowns: Map<string, number>;
  activeBuffs: Map<string, ResolvedEffect>;
  activeAction?: ResolvedAction;
}

export interface TeamConfig {
  maxSp: number;
  initialSp: number;
  spRegenRate: number;
  skillSpCostDefault: number;
  linkCdReduction: number;
  prepDuration: number;
}

export interface TeamSnapshot {
  sp: number;
  recoverSp: number;
  refundSp: number;
  debtSp: number;
  spRecovered?: number;
  spReturned?: number;
  spRegenRate: number;
  maxSp: number;
  isSpRegenPaused: boolean;
  spRegenPauseDuration: number;
}

export interface EnemyConfig {
  maxStagger: number;
  staggerNodeCount: number;
  staggerNodeDuration: number;
  staggerBreakDuration: number;
  executionRecovery: number;
  finisherRecovery?: number;
  finisherMultiplier?: number;
  defense?: number;
  enemyHp?: number;
  superArmor?: number;
  enemyDamageCapWindowSeconds?: number;
  enemyDamageCapRatio?: number;
  tier?: string;
  resistance?: EnemyResistance;
}

export interface EnemySnapshot {
  stagger: number;
  isBroken: boolean;
  isLocked: boolean;
  breakEndTime: number;
  lockEndTime: number;
}

export interface GameConfig {
  team: TeamConfig;
  enemy: EnemyConfig;
}

export interface GameSnapshot {
  team: TeamSnapshot;
  enemy: EnemySnapshot;
  actors: ActorSnapshot[];
}
