import type { ActionType, ResolvedHit, ConsumedStatEffect } from '../compiler/types';
import type {
  EnemyEffectApplyEvent,
  EnemyEffectExpireEvent,
  ArtsBurstEvent,
  OperatorEffectApplyEvent,
  OperatorEffectExpireEvent,
} from '../engine/types';

export type SimEventType = SimEvent['type'];
type SimBaseEvent<Name extends string, Data = {}> = {
  // real time
  time: number;
  type: Name;
  payload: Data;
};
export type ActionStartEvent = SimBaseEvent<
  'ACTION_START',
  {
    skillId: string;
    actionId: string;
    spCost?: number;
    actorId: string;
    type: ActionType;
    freezeDuration?: number;
  }
>;
export type ActionEndEvent = SimBaseEvent<
  'ACTION_END',
  {
    skillId: string;
    actionId: string;
    actorId: string;
    type: ActionType;
  }
>;
export type HitEvent = SimBaseEvent<
  'DAMAGE_HIT',
  {
    targetId: string;
    sourceId: string;
    stagger: number;
    hitData: ResolvedHit;
    actionId: string;
  }
>;
export type SpChangeEvent = SimBaseEvent<
  'SP_CHANGE',
  {
    actorId: string;
    spChange: number;
    reason: string;
    sourceId: string;
    parent: SimEvent;
    spType?: 'recovery' | 'return';
    /** Skill type (action type, e.g. 'comboSkill') of the hit/effect. Used as fallback
     *  when sourceId refers to a synthetic triggered action (no action in ctx).
     *  Matches `trigger.skillTypes` filters. */
    skillType?: string;
    /** Specific skill identity (e.g. 'alesh-enhanced-combo'). Matches `trigger.skillId` filters. */
    skillId?: string;
  }
>;
export type SpRegenPauseEvent = SimBaseEvent<
  'SP_REGEN_PAUSE',
  {
    sourceId: string;
    duration: number;
  }
>;
export type StaggerChangeEvent = SimBaseEvent<
  'STAGGER_CHANGE',
  {
    stagger: number;
    actorId: string;
    actionId: string;
    targetId: string;
    /** Action-type tag (e.g. 'comboSkill'). Matches `stat.skillTypes` / `trigger.skillTypes`. */
    skillType?: string;
    /** Specific skill identity. Matches `stat.skillId` / `trigger.skillId`. */
    skillId?: string;
    reactionStaggerMult?: number;
  }
>;

/** Fires once at t=0 so `onBattleStart` triggers can apply effects at the start of the fight. */
export type BattleStartEvent = SimBaseEvent<'BATTLE_START', {}>;

export type UltEnergyChangeEvent = SimBaseEvent<
  'ULT_ENERGY_CHANGE',
  {
    actorId: string;
    change: number;
    sourceId: string;
    /** When true, this gain bypasses the recipient's ult charge efficiency multiplier. */
    ignoreEfficiency?: boolean;
  }
>;

export type CorrosionTickSimEvent = SimBaseEvent<
  'CORROSION_TICK',
  {
    sourceId: string;
    /** Pre-computed per-second shred increment. */
    perSecond: number;
    /** Pre-computed max shred cap. */
    maxShred: number;
    /** Tick index (1-based). */
    tickIndex: number;
    /** Corrosion expiry time — tick should not fire past this. */
    expiresAt: number;
  }
>;

export type DotTickSimEvent = SimBaseEvent<
  'DOT_TICK',
  {
    sourceId: string;
    effectId: string;
    element: string;
    multiplier: number;
    /** Action type (e.g. 'comboSkill'). Matches `stat.skillTypes` on DOT-tick damage. */
    skillType?: string;
    /** Specific skillId (e.g. 'alesh-enhanced-combo'). Matches `stat.skillId` on DOT-tick damage. */
    skillId?: string;
    canCrit?: boolean;
    consumedStacks?: Record<string, number>;
    consumedStatEffects?: ConsumedStatEffect[];
  }
>;

export type SimEvent =
  | ActionStartEvent
  | ActionEndEvent
  | HitEvent
  | SpChangeEvent
  | SpRegenPauseEvent
  | StaggerChangeEvent
  | UltEnergyChangeEvent
  | BattleStartEvent
  // Enemy state events
  | EnemyEffectApplyEvent
  | EnemyEffectExpireEvent
  | ArtsBurstEvent
  | CorrosionTickSimEvent
  | DotTickSimEvent
  // Operator effect events
  | OperatorEffectApplyEvent
  | OperatorEffectExpireEvent;

export type SimLogEntryBase<Name extends string, Data = {}> = {
  type: Name;
  time: number;
  payload: Data;
};

export type SimLogEntry =
  | SimLogEntryBase<
      'SP_REGEN_PAUSE',
      {
        sourceId: string;
        duration: number;
        sp: number;
      }
    >
  | SimLogEntryBase<
      'SP_CHANGE',
      {
        sp: number;
        change: number;
        actorId: string;
        sourceId: string;
        reason: string;
        spType?: 'recovery' | 'return';
        prevSp?: number;
        actualChange?: number;
        prevRecoverSp?: number;
        prevRefundSp?: number;
        prevDebtSp?: number;
        recoverSp?: number;
        refundSp?: number;
        debtSp?: number;
      }
    >
  | SimLogEntryBase<
      'STAGGER',
      {
        actorId: string;
        actionId: string;
        amount: number;
        stagger: number;
        isBroken: boolean;
        breakEndTime?: number;
        nodeReachedIndex?: number;
        nodeEndTime?: number;
      }
    >
  | SimLogEntryBase<
      'DAMAGE_HIT',
      {
        targetId: string;
        sourceId: string;
        stagger: number;
        hitData: ResolvedHit;
        actionId: string;
      }
    >
  | SimLogEntryBase<
      'ACTION_START',
      {
        skillId: string;
        actionId: string;
        type: ActionType;
        spCost?: number;
      }
    >
  | SimLogEntryBase<
      'ACTION_END',
      {
        skillId: string;
        actionId: string;
        type: ActionType;
      }
    >
  | SimLogEntryBase<
      'ULT_ENERGY_CHANGE',
      {
        actorId: string;
        change: number;
        gauge?: number;
        sourceId: string;
        /** When true, this gain bypassed the recipient's ult charge efficiency multiplier. */
        ignoreEfficiency?: boolean;
      }
    >
  | SimLogEntryBase<
      'LINK_CONSUMED',
      {
        actionId: string;
        actorId: string;
        stacks: number;
      }
    >
  | SimLogEntryBase<
      'CD_REDUCTION',
      {
        actorId: string;
        /** instanceId of the action whose cooldown bar is shortened. */
        actionId: string;
        /** Seconds removed from the cooldown (always a flat positive value). */
        reduction: number;
        /** True when this reduction cleared all remaining CD (hide the bar entirely). */
        clearedRemaining?: boolean;
      }
    >;
