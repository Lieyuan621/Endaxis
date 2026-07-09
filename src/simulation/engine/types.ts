import type {
  ArtsElement,
  ArtsReaction,
  PhysicalStatus,
  EnemyStat,
  Effect,
  EffectStat,
} from '@/data/types';

export interface EnemyStatusEntry {
  id: string;
  stat?: EnemyStat;
  value: number;
  stacks: number;
  maxStacks: number;
  expiresAt: number;
  sourceId: string;
  stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  icon?: string;
  /** When set, the entry is not yet active until this time. */
  startsAt?: number;
  effect?: Effect;
  /** Snapshotted consumed stacks from the action that applied this effect. */
  consumedStacks?: Record<string, number>;
  /** Multi-source attribution breakdown for reaction debuffs. sourceId → fractional share (sums to 1). */
  sourceBreakdown?: Record<string, number>;
  /** When set, pending events with this key are cancelled on expire/consume (used by DoT effects). */
  cancelHitKey?: string;
  /** Standalone-multiplicative damage-taken modifier (e.g. Wrap): routed to the external factor. */
  external?: boolean;
}

// ─── Source tracking for LMDI attribution ───────────────────────────────────

export interface SourceSlot {
  sourceId: string;
  count: number;
}

// ─── Simulation State ───────────────────────────────────────────────────────

export interface InflictionState {
  element: ArtsElement;
  stacks: number; // 1–4
  appliedAt: number;
  expiresAt: number; // appliedAt + 20
  sourceQueue: SourceSlot[];
}

export interface VulnerabilityState {
  stacks: number; // 1–4
  appliedAt: number;
  expiresAt: number; // appliedAt + 20
  sourceQueue: SourceSlot[];
}

export interface SolidificationState {
  level: number;
  expiresAt: number;
  consumedStackSources?: Record<string, number>;
  sourceId?: string;
}

export interface CombustionState {
  level: number;
  startedAt: number;
  expiresAt: number;
  sourceId?: string;
  effectiveness?: number;
  consumedStackSources?: Record<string, number>;
  actionId?: string;
}

export interface ElectrificationState {
  level: number;
  expiresAt: number;
  operatorSlot: number;
  sourceId?: string;
}

export interface CorrosionState {
  level: number; // 1–4
  startedAt: number;
  expiresAt: number;
  operatorSlot: number;
  currentResShred: number; // accumulated
  /** Pre-computed per-second increment (accounts for enhancement + effectiveness). */
  perSecond: number;
  /** Pre-computed max shred cap (accounts for enhancement + effectiveness). */
  maxShred: number;
  /** Source operator track ID. */
  sourceId: string;
}

export interface BreachState {
  level: number;
  expiresAt: number;
  operatorSlot: number;
  sourceId?: string;
}

// ─── Operator runtime effect state ──────────────────────────────────────────

export interface OperatorStatusEntry {
  id: string;
  stat?: EffectStat;
  value: number;
  stacks: number;
  maxStacks: number;
  expiresAt: number;
  sourceId: string;
  stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  effect?: Effect;
  /** Snapshotted consumed stacks from the action that applied this effect. */
  consumedStacks?: Record<string, number>;
  external?: boolean;
}

// ─── Engine events: enemy side ───────────────────────────────────────────────

/** Single entry-point event for all enemy-targeting effects. EnemyEffectHandler routes by kind. */
export type EnemyEffectApplyEvent = {
  type: 'ENEMY_EFFECT_APPLY';
  time: number;
  sourceId: string;
  /** Action type (e.g. 'battleSkill'). Used for `skillTypes` filtering in onStatusApplied triggers. */
  sourceSkillType?: string;
  /** Specific skillId (e.g. 'alesh-enhanced-combo'). Used for `skillId` filtering in onStatusApplied triggers. */
  sourceSkillId?: string;
  /** Parent action ID — threads consumedStacks from the originating action through to reaction damage hits. */
  actionId?: string;
} & (
  | {
      kind: 'infliction';
      element: ArtsElement;
      effectiveDuration: number;
      stacks?: number;
      stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
    }
  | {
      kind: 'physicalStatus';
      physicalType: PhysicalStatus;
      effectiveDuration: number;
      stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
      forced?: boolean;
      effectiveness?: number;
    }
  | {
      kind: 'reaction';
      reactionType: ArtsReaction | 'shatter' | 'breach' | 'crush';
      level?: number;
      requiresInfliction?: ArtsElement[];
      effectiveDuration: number;
      stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
      effectiveness?: number;
      /** True when applied via ReactionEffect (skill-defined), not from natural infliction consumption. Forced reactions don't deal damage. */
      forced?: boolean;
      /** Per-source stack attribution from consumed infliction/vulnerability. */
      consumedStackSources?: Record<string, number>;
    }
  | {
      kind: 'status';
      id: string;
      stat?: EnemyStat;
      value: number;
      stacks: number;
      maxStacks: number;
      expiresAt: number;
      stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
      icon?: string;
      consumedStacks?: Record<string, number>;
      effect?: Effect;
      sourceBreakdown?: Record<string, number>;
      /** When true, applying this effect does not fire onStatusApplied triggers. */
      silent?: boolean;
      /** Standalone-multiplicative damage-taken modifier (Wrap); carried onto the entry. */
      external?: boolean;
    }
);

/** Unified expiry for all enemy effects. consumed=true means priority-3 forced consume. */
export type EnemyEffectExpireEvent = {
  type: 'ENEMY_EFFECT_EXPIRE';
  time: number;
  consumed: boolean;
  /** Identifies the operator that triggered consumption. Only set when consumed=true. */
  sourceId?: string;
  /** Action type that caused consumption. Used by onStatusConsumed/Expire triggers' `skillTypes` filter. */
  sourceSkillType?: string;
  /** Specific skillId that caused consumption. Used by onStatusConsumed/Expire triggers' `skillId` filter. */
  sourceSkillId?: string;
} & (
  | { kind: 'infliction'; element: ArtsElement; stacksToConsume?: number }
  | { kind: 'vulnerability' }
  | {
      kind: 'debuff';
      debuffType: 'electrification' | 'corrosion' | 'combustion' | 'solidification' | 'breach';
    }
  | { kind: 'status'; id: string; stacksToConsume?: number }
);

// ─── Log-only events: enemy side (logged by EnemyEffectHandler, read by projection) ─

export interface InflictionApplyEvent {
  type: 'INFLICTION_APPLY';
  time: number;
  element: ArtsElement;
  stacks: number;
  sourceId: string;
  /** When true, this apply only triggered a reaction — no infliction bar remains. */
  triggerOnly?: boolean;
  /** Updated expiresAt after this apply (present on same-element reapply when timer is refreshed). */
  expiresAt?: number;
  /** Total resolved duration (base + extension) to apply. */
  effectiveDuration: number;
  carryoverKey?: string;
  disabled?: boolean;
}

export interface ArtsBurstEvent {
  type: 'ARTS_BURST';
  time: number;
  element: ArtsElement;
  sourceId: string;
  sourceSkillType?: string;
  sourceSkillId?: string;
}

export interface ReactionTriggerEvent {
  type: 'REACTION_TRIGGER';
  time: number;
  reactionType: ArtsReaction | 'shatter' | 'breach' | 'crush';
  level: number;
  sourceId: string;
  requiresInfliction?: ArtsElement[];
  /** Total resolved duration (base + extension) to apply. 0 means use the game-level default for this reaction. */
  effectiveDuration: number;
  effectiveness?: number;
}

export interface PhysicalStatusEvent {
  type: 'PHYSICAL_STATUS';
  time: number;
  physicalType: PhysicalStatus;
  sourceId: string;
  /** Total resolved duration (base + extension) to apply. */
  effectiveDuration: number;
  /** False when Lift/Knock Down only adds vulnerability and does not actually control the enemy. */
  actualControl?: boolean;
}

export interface VulnerabilityChangeEvent {
  type: 'VULNERABILITY_CHANGE';
  time: number;
  stacks: number;
  expiresAt: number;
  trigger: PhysicalStatus;
  sourceId: string;
  carryoverKey?: string;
  disabled?: boolean;
}

export interface VulnerabilityConsumedEvent {
  type: 'VULNERABILITY_CONSUMED';
  time: number;
  consumedStacks: number;
  consumedBy: 'breach' | 'crush';
  sourceId: string;
}

export interface EnemyStatusApplyEvent {
  type: 'ENEMY_STATUS_APPLY';
  time: number;
  id: string;
  stat?: EnemyStat;
  value: number;
  stacks: number;
  maxStacks: number;
  expiresAt: number;
  sourceId: string;
  stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  icon?: string;
  effect?: Effect;
  /** True when this apply is a stack-decrement continuation — icon should not be re-shown. */
  isContinuation?: boolean;
  carryoverKey?: string;
  disabled?: boolean;
}

export interface DebuffApplyEvent {
  type: 'DEBUFF_APPLY';
  time: number;
  debuffType: 'electrification' | 'corrosion' | 'combustion' | 'solidification' | 'breach';
  level: number;
  expiresAt: number;
  sourceId: string;
  carryoverKey?: string;
  disabled?: boolean;
}

export interface CorrosionTickEvent {
  type: 'CORROSION_TICK';
  time: number;
  sourceId: string;
  /** Current accumulated resistance shred after this tick. */
  resShred: number;
  /** The level of the corrosion debuff at tick time. */
  level: number;
  /** Tick index (0 = initial apply, 1+ = per-second ramps). */
  tickIndex: number;
}

export interface InflictionConsumedEvent {
  type: 'INFLICTION_CONSUMED';
  time: number;
  element: ArtsElement;
  consumedStacks: number;
}

export interface VulnerabilityApplyEvent {
  type: 'VULNERABILITY_APPLY';
  time: number;
  physicalType: PhysicalStatus;
  sourceId: string;
  /** Total resolved duration (base + extension) to apply. */
  effectiveDuration: number;
}

// ─── Engine + log events: operator side ─────────────────────────────────────

/** Apply event for operator StatusEffects. */
export interface OperatorEffectApplyEvent {
  type: 'OPERATOR_EFFECT_APPLY';
  time: number;
  targetTrackId: string;
  sourceId: string;
  expiresAt: number;
  stacks: number;
  maxStacks: number;
  id: string;
  stat?: EffectStat;
  value: number;
  /** The resolved Effect object, carried for projection rendering (icon, color, label). */
  effect?: Effect;
  /** Cumulative stacks after this apply (resolved by simulation). Set by OperatorEffectHandler. */
  cumulativeStacks?: number;
  /** True when this apply is a stack-decrement continuation — icon should not be re-shown. */
  isContinuation?: boolean;
  /** Action type (e.g. 'basicAttack'). Used for `skillTypes` filtering in onStatusApplied triggers. */
  sourceSkillType?: string;
  /** Specific skillId (e.g. 'alesh-enhanced-combo'). Used for `skillId` filtering in onStatusApplied triggers. */
  sourceSkillId?: string;
  stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  /** Set for effects applied via duringAction trigger; used to reschedule expiry on hit.durationExtension. */
  actionId?: string;
  /** Snapshotted consumed stacks from the action that applied this effect. */
  consumedStacks?: Record<string, number>;
  /** When true, applying this effect does not fire onStatusApplied triggers. */
  silent?: boolean;
  skipStatusAppliedTrigger?: boolean;
  /** See StatusEffect.external — applied as an independent final attribute multiplier. */
  external?: boolean;
}

/** Expire event for operator StatusEffects. consumed=true means priority-3 forced consume. */
export interface OperatorEffectExpireEvent {
  type: 'OPERATOR_EFFECT_EXPIRE';
  time: number;
  targetTrackId: string;
  consumed: boolean;
  id: string;
  stacksToConsume?: number;
  /** Mirrors actionId from the apply event; allows HitHandler to reschedule duringAction expiries. */
  actionId?: string;
  /** Action type that caused consumption. Used by onStatusConsumed/Expire triggers' `skillTypes` filter. */
  sourceSkillType?: string;
  /** Specific skillId that caused consumption. Used by onStatusConsumed/Expire triggers' `skillId` filter. */
  sourceSkillId?: string;
}

export type OperatorStateEvent = OperatorEffectApplyEvent | OperatorEffectExpireEvent;

// ─── Event unions ────────────────────────────────────────────────────────────

export type EnemyStateEvent =
  | EnemyEffectExpireEvent
  | InflictionApplyEvent
  | InflictionConsumedEvent
  | ArtsBurstEvent
  | ReactionTriggerEvent
  | PhysicalStatusEvent
  | VulnerabilityApplyEvent
  | VulnerabilityChangeEvent
  | VulnerabilityConsumedEvent
  | DebuffApplyEvent
  | EnemyStatusApplyEvent
  | CorrosionTickEvent
  | DotTickLogEvent;

export interface DotTickLogEvent {
  type: 'DOT_TICK';
  time: number;
  effectId: string;
  sourceId: string;
}

// ─── Combined enemy status snapshot (used by HitHandler condition evaluation)
export interface EnemyStatusSnapshot {
  infliction: InflictionState | null;
  vulnerability: VulnerabilityState | null;
  solidification: SolidificationState | null;
  combustion: CombustionState | null;
  electrification: ElectrificationState | null;
  corrosion: CorrosionState | null;
  breach: BreachState | null;
  /** Unified map of all enemy StatusEffect entries (both stat-bearing and pure state). */
  enemyStatusEffects: Map<string, EnemyStatusEntry>;
}
