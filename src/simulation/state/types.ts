import type {
  ActorStats,
  ResolvedAction,
  ResolvedEffect,
} from "@/simulation/compiler/types.ts";

export interface ActorSnapshot {
  id: string;
  stats: ActorStats;
  acceptTeamGauge?: boolean;
  resources: {
    hp: number;
    gauge: number;
    maxGauge: number;
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
}

export interface TeamSnapshot {
  sp: number;
  recoverSp: number;
  refundSp: number;
  debtSp: number;
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
