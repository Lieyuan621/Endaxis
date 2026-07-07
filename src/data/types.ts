// ─── Primitive enumerations ───────────────────────────────────────────────────

export type CombatSkillType = 'basicAttack' | 'battleSkill' | 'comboSkill' | 'ultimate';

export type SkillType = CombatSkillType | 'finalStrike' | 'dive';

export type ArtsElement = 'cryo' | 'electric' | 'nature' | 'heat';

export type DamageElement = 'physical' | ArtsElement;

export type Attribute = 'strength' | 'agility' | 'intellect' | 'will' | 'main' | 'sub';

export type operatorClass = 'guard' | 'caster' | 'defender' | 'vanguard' | 'supporter' | 'striker';

// ─── Combat capabilities ────────────────────────────────────────────────────

export type PhysicalStatus = 'vulnerability' | 'lift' | 'knockdown' | 'crush' | 'breach';

export type ArtsReaction = 'solidification' | 'electrification' | 'corrosion' | 'combustion';

// ─── Damage-relevant stat types ──────────────────────────────────────────────

/** Stats that debuff the enemy or modify how it receives damage. */
export type EnemyStat =
  | { modifier: 'susceptibility'; elements?: DamageElement | DamageElement[] }
  | { modifier: 'increasedDmgTaken'; elements?: DamageElement | DamageElement[] }
  | { modifier: 'resistanceShred'; elements?: DamageElement | DamageElement[] }
  | { modifier: 'slowed' }
  | { modifier: 'weaken' }
  | { modifier: 'inflictionBarrier'; elements?: DamageElement | DamageElement[] };

/** Stats that buff the operator (self/team). */
export type OperatorStat =
  // ── Unscoped ─────────────────────────────────────────────────────────────
  | { modifier: 'atkPercent' | 'attributeAtkPercent' | 'atkFlat' }
  | { modifier: 'hpPercent' | 'flatHp' | 'defPercent' | 'flatDef' }
  | { modifier: 'artsIntensity' }
  | { modifier: 'ultimateGainEfficiency' | 'ultimateEnergyCostReduction' }
  | { modifier: 'shield' }
  | { modifier: 'protection' }
  | { modifier: 'link' }
  | { modifier: 'heal' }

  // ── SkillType-scoped ─────────────────────────────────────────────────────
  | {
      modifier: 'critRate' | 'critDmg';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'directMultiplier';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'spRecoveryFlat';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'spRecoveryPercent';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | { modifier: 'battleSkillSPCostReduction' }
  | {
      modifier: 'staggerFlat';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'staggerPercent';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'cooldownReductionFlat';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }
  | {
      modifier: 'cooldownReductionPercent';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
    }

  // ── Element-scoped ────────────────────────────────────────────────────────
  | { modifier: 'ampBonus'; elements?: DamageElement | DamageElement[] }
  | { modifier: 'resistanceIgnore'; elements?: DamageElement | DamageElement[] }

  // ── Dual-scoped (skill type + element, both optional) ─────────────────────
  | {
      modifier: 'dmgBonus';
      /** `'nonSkill'` scopes to damage with no combat-skill-type attribution — reactions, burn-DoT,
       *  and talent/gear/weapon-triggered hits; mutually exclusive with skill-type scoping. */
      skillTypes?: SkillType | SkillType[] | 'nonSkill';
      skillId?: string | string[];
      elements?: DamageElement | DamageElement[];
    }
  | {
      modifier: 'susceptibilityAmplify';
      skillTypes?: SkillType | SkillType[];
      skillId?: string | string[];
      elements?: DamageElement | DamageElement[];
    }

  // ── Attribute ─────────────────────────────────────────────────────────────
  | { modifier: 'attributeFlat' | 'attributePercent'; attribute: Attribute | Attribute[] };

export type EffectStat = EnemyStat | OperatorStat;

// ─── Trigger events ─────────────────────────────────────────────────────────

interface TriggerSkillFilter {
  skillTypes?: SkillType | SkillType[];
  skillId?: string | string[];
}

interface TriggerStatusFilter {
  /** String matches by effect id; object matches by stat descriptor. */
  status: EffectStat | string | (EffectStat | string)[];
  target: 'enemy' | 'self';
}

interface TriggerScopeFilter {
  triggerScope?: 'self' | 'global';
}

interface TriggerElementFilter {
  /** Restrict to actions whose element matches (e.g. 'heat'). Omitted = any element. */
  element?: DamageElement | DamageElement[];
}

export type TriggerEvent =
  | ({ kind: 'onHit' } & TriggerSkillFilter & TriggerScopeFilter)
  | ({ kind: 'onFinalStrike' } & TriggerScopeFilter)
  | ({ kind: 'onFinisher' } & TriggerScopeFilter)
  | ({ kind: 'onDive' } & TriggerScopeFilter)
  | ({ kind: 'onSpRecovery' } & TriggerSkillFilter)
  | ({ kind: 'onStatusApplied' } & TriggerSkillFilter & TriggerStatusFilter & TriggerScopeFilter)
  | ({ kind: 'onStatusExpire' } & TriggerSkillFilter & TriggerStatusFilter & TriggerScopeFilter)
  | ({ kind: 'onStatusConsumed' } & TriggerSkillFilter & TriggerStatusFilter & TriggerScopeFilter)
  | ({ kind: 'onActionStart' } & TriggerSkillFilter & TriggerScopeFilter & TriggerElementFilter)
  | ({ kind: 'duringAction' } & TriggerSkillFilter);

// ─── Effect conditions ──────────────────────────────────────────────────────

export interface StacksConstraint {
  compare: 'exact' | 'atLeast' | 'atMost';
  count: number;
}

/** Condition on enemy status. `status` is either an EnemyStat descriptor or a named state string
 *  (e.g. `'cryoInfliction'`, `'vulnerability'`, `'originiumCrystals'`). An array is an OR — passes if any element matches. */
export interface EnemyCondition {
  kind: 'enemyStatus';
  status: EnemyStat | string | (EnemyStat | string)[];
  stacks?: StacksConstraint;
  /** Ends the checked status prematurely at priority 3 (after all other checks at the same time).
   *  true = consume all stacks; number = consume exactly N stacks (state kind only, partial if N < current stacks). */
  consume?: boolean | number;
}

export interface EnemyHpCondition {
  kind: 'enemyHp';
  compare: 'above' | 'below';
  percent: number;
}

/** Condition on operator status. `status` is either an EffectStat descriptor (matches any
 *  StatusEffect carrying that stat) or a string effect id. An array is an OR — passes if any element matches. */
export interface OperatorCondition {
  kind: 'operatorStatus';
  status: EffectStat | string | (EffectStat | string)[];
  stacks?: StacksConstraint;
  /** true = consume all stacks from triggering operator; number = consume exactly N stacks (partial if N < current stacks). */
  consume?: boolean | number;
  /** 'team' = check any team member and consume from all. */
  consumeScope?: 'team';
  /** Which operator the status is read from / consumed on. 'self' (default) = the source operator;
   *  'controlled' = the operator controlled at the effect's time (resolved via the control timeline). */
  target?: 'self' | 'controlled';
}

export interface OperatorHpCondition {
  kind: 'operatorHp';
  compare: 'above' | 'below';
  percent: number;
}

export interface NegatedCondition {
  kind: 'not';
  condition: EnemyCondition | OperatorCondition | EnemyStaggeredCondition | OrCondition;
}

export interface OrCondition {
  kind: 'or';
  conditions: EffectCondition[];
}

export interface ActionLinkConsumedCondition {
  kind: 'actionLinkConsumed';
}

export interface EnemyStaggeredCondition {
  kind: 'enemyStaggered';
}

export type EffectCondition =
  | EnemyCondition
  | EnemyHpCondition
  | EnemyStaggeredCondition
  | OperatorCondition
  | OperatorHpCondition
  | ActionLinkConsumedCondition
  | NegatedCondition
  | OrCondition;

// ─── Leveled value type ──────────────────────────────────────────────────────

/** A value that is either a flat scalar or a level-indexed array.
 *  Index 0 = level 1 (or talent inactive→active); last element is clamped to. */
export type Leveled<T> = T | T[];

/** Resolve a `Leveled<number>` to a scalar at the given 0-based index.
 *  Clamps to `[0, array.length - 1]`. Flat numbers are returned as-is. */
export function resolveLeveled(v: Leveled<number>, idx: number): number {
  if (typeof v === 'number') return v;
  return v[Math.max(0, Math.min(idx, v.length - 1))] ?? 0;
}

// ─── Effect value modes ──────────────────────────────────────────────────────

export interface AttributeScaling {
  basis: string | string[];
  coefficient: Leveled<number>;
}

export interface StackScaling {
  /** The id of the effect whose current stack count is used. */
  key: string;
  /** Whether to read stacks from the enemy or the operator (self). Defaults to 'self'. */
  target?: 'enemy' | 'self';
  /** Multiplied against the stack count to produce the additive contribution. */
  coefficient: Leveled<number>;
}

export interface ScalingDef {
  /** Additive terms summed on top of the base value. Each term is an attribute scaling, a stack scaling, a fixed number, or a leveled number array. */
  additive?: (AttributeScaling | StackScaling | Leveled<number>)[];
  /** Post-computation multipliers. Each applied as (1 + m). */
  multiplier?: Leveled<number>[];
  cap?: Leveled<number>;
  /** Scaling terms that only apply when the given condition is met. */
  conditionalScaling?: { condition: EffectCondition; scaling: ScalingDef };
}

// ─── Trigger Effect ──────────────────────────────────────────────────────────

export interface TriggerEffect {
  trigger: TriggerEvent;
  effects: Effect[];
  /** When set, resolve leveled values at this skill's level instead of the talent level. */
  skillLevelKey?: CombatSkillType;
  /** Override the skill type used for damage computation (dmgBonus scoping, etc.).
   *  Only needed for talent/potential triggers whose effects should be attributed to a different skill. */
  damageEffectSkillType?: CombatSkillType;
}

// ─── Effect Target ────────────────────────────────────────────────────────────

export type EffectTargetScope =
  | 'self'
  | 'team'
  | 'teamExcludeSelf'
  | 'teamExcludeSameElement'
  | 'enemy'
  | 'owner'
  /** The operator the player is controlling at the effect's time. Resolved via the control timeline. */
  | 'controlled';

export type EffectTarget =
  | { scope: EffectTargetScope; classes?: operatorClass[] }
  | EffectTargetScope;

// ─── Effect Base ─────────────────────────────────────────────────────────────

export interface EffectBase {
  kind: Effect['kind'];

  // Display overrides (resolved from presets/i18n when absent)
  name?: string;
  displayType?: string;
  /** Single icon path, or an array where index 0 = stack 1, index 1 = stack 2, etc. */
  icon?: string | string[];

  // Lifecycle
  duration?: Leveled<number>;
  /** Extends effect duration beyond the base value: total = duration + durationExtension. */
  durationExtension?: number;
  /** Initial stack count. Defaults to 1 when omitted. Use `'fromConsume'` to set stacks equal
   *  to the number of consumed status stacks at trigger dispatch time. */
  stacks?: Leveled<number> | 'fromConsume';
  /** Maximum stack count. Defaults to 1 when omitted. */
  maxStacks?: Leveled<number>;
  /** Stacking behavior. Defaults to 'REFRESH_DURATION' when omitted. */
  stackStrategy?: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  condition?: EffectCondition | EffectCondition[];
  /** Internal cooldown in seconds — minimum interval between trigger activations. */
  icd?: number;
  /** Optional shared ICD bucket. Effects with the same bucket share cooldown across sources. */
  icdGroup?: string;

  // Identity
  id?: string;
  sourceGroup?: 'operator' | 'weapon' | 'gearSet';

  /** When true, suppress rendering this effect in the timeline tracks. Defaults to false. */
  hide?: boolean;

  /** When true, effect duration is not extended by freeze events (combo/ultimate animations). */
  ignoreTimeShift?: boolean;

  /**
   * Hit-attached effects normally apply after the hit damage is calculated.
   * `beforeDamage` lets a specific hit effect apply first when its own hit must
   * benefit from triggers caused by that effect.
   */
  applyTiming?: 'beforeDamage' | 'afterDamage';
}

// ─── Effect Subtypes ────────────────────────────────────────────────────────

/**
 * Unified effect type replacing StatEffect and StateEffect.
 * A pure state-tracking effect omits `stat`; a stat-modifying effect sets `stat`.
 * `id` serves as the primary identity key (replaces the old `stateKey`).
 */
export interface StatusEffect extends EffectBase {
  kind: 'status';
  /** Optional — defaults to { scope: 'self' }. Inferred as { scope: 'enemy' } when stat is an EnemyStat. */
  target?: EffectTarget;
  /** Stat modifier. Absent for pure state-tracking effects. */
  stat?: EffectStat;
  value?: Leveled<number>;
  scaling?: ScalingDef;
  /** When true, applying this effect does not fire onStatusApplied triggers. */
  silent?: boolean;
  /**
   * When true on an attribute modifier (`attributePercent`), the value is applied as an
   * independent final multiplier on the attribute instead of being summed into the additive
   * percent pool — i.e. `attr × (1 + Σpct) × (1 + value/100)` rather than `(1 + Σpct + value/100)`.
   * Also routes `dmgBonus`/`increasedDmgTaken`/`cooldownReductionPercent` to standalone multiplicative factors.
   */
  external?: boolean;
}

/** Always targets the enemy — no target field needed. */
export interface InflictionEffect extends EffectBase {
  kind: 'infliction';
  element: ArtsElement;
}

/** Arts burst (same-element infliction re-apply). Log/display only — no lasting state. */
export interface BurstEffect extends EffectBase {
  kind: 'burst';
  element: ArtsElement;
}

/** Always targets the enemy — no target field needed. */
export interface ReactionEffect extends EffectBase {
  kind: 'reaction';
  reactionType: ArtsReaction;
  requiresInfliction?: ArtsElement[];
  effectiveness?: number;
  /**
   * Starting reaction level (1–MAX_INFLICTION_STACKS). Defaults to 1.
   * With requiresInfliction, consumed stacks add: final level = clamp(consumedStacks + defaultLevel - 1).
   */
  defaultLevel?: number;
}

/** Always targets the enemy — no target field needed. */
export interface PhysicalStatusEffect extends EffectBase {
  kind: 'physicalStatus';
  physicalType: PhysicalStatus;
  forced?: boolean;
  effectiveness?: Leveled<number>;
}

/** Dispatches a DAMAGE_HIT event from the trigger owner. Always targets the enemy. */
export interface DamageHitEffect extends EffectBase {
  kind: 'damageHit';
  element: DamageElement;
  multiplier: Leveled<number>;
  multiplierScaling?: ScalingDef;
  staggerScaling?: ScalingDef;
  /** Delay in seconds before the hit fires (default 0). */
  offset?: number;
  hit?: Omit<Hit, 'offset'>;
  /** Read consumed stacks from an intermediary status entry and annotate the dispatched hit. */
  readConsumedStacks?: { statusKey: string; target: 'enemy' | 'self' };
  /** When true, the resolved multiplier is scaled by the operator's current crit rate at dispatch time. */
  scaleByCrit?: boolean;
}

/** Schedules periodic DAMAGE_HIT events over a duration. Always targets the enemy. */
export interface DamageOverTimeEffect extends EffectBase {
  kind: 'damageOverTime';
  element: DamageElement;
  multiplier: Leveled<number>;
  multiplierMode?: 'each' | 'split';
  multiplierScaling?: ScalingDef;
  /** Delay in seconds before the DoT schedule starts (default 0). */
  offset?: number;
  /** Seconds between ticks. Tick count derived from duration / interval. */
  interval: number;
  /** Snapshot operator stats at apply time for all ticks. */
  snapshot?: boolean;
  /** Whether ticks can crit (default true). */
  canCrit?: boolean;
  /** Skip tick at t=0; first tick at t=interval (default false). */
  skipFirstTick?: boolean;
  /** Cancel pending ticks when the same effect is reapplied (default false). */
  cancelOnRefresh?: boolean;
  /** Stat effects baked into every tick (merged into consumedStatEffects on each DOT_TICK). */
  consumedStatEffects?: { stat: OperatorStat; value: Leveled<number> }[];
}

/** Dispatches an SP_CHANGE event (recovery) on the trigger owner. Always targets self. */
export interface SpGainEffect extends EffectBase {
  kind: 'spRecovery';
  value: Leveled<number>;
  scaling?: ScalingDef;
}

/** Dispatches an SP_CHANGE event (return) on the trigger owner. Always targets self.
 *  SP Return is not SP Recovery: it does not activate SP Recovery-triggered effects,
 *  and spending returned SP does not gain Ultimate Energy. */
export interface SpReturnEffect extends EffectBase {
  kind: 'spReturn';
  value: Leveled<number>;
  scaling?: ScalingDef;
}

export interface UltimateEnergyGainEffect extends EffectBase {
  kind: 'ultEnergyGain';
  target?: EffectTarget;
  value: Leveled<number>;
  scaling?: ScalingDef;
}

/** Instantly reduces the remaining cooldown of the most recent matching skill on the actor.
 *  'flat': reduces by `value` seconds.
 *  'percent': reduces by `baseCooldown * value / 100` seconds (percent of the defined cooldown). */
export interface CooldownReductionEffect extends EffectBase {
  kind: 'cooldownReductionFlat' | 'cooldownReductionPercent';
  value: Leveled<number>;
  target?: EffectTarget;
  skillTypes?: SkillType | SkillType[];
  skillId?: string | string[];
}

/** Copies a named collected StatEffect and merges override fields over it.
 *  Resolved at collection time — expands into a ResolvedStatEffect.
 *  If the source is not active, produces no effect (silently dropped). */
export interface DerivedEffect extends EffectBase {
  kind: 'derived';
  /** id of the source StatEffect to inherit stat, value, duration, etc. from */
  sourceEffect: string;
  /** Fields merged over the copied effect — same shape as PatchEffect.effect */
  effect?: Partial<PatchableEffectFields>;
}

/** Consumed at the start of a matching action. Stat stamped onto the action's hits.
 *  Always targets self. Transient — no events dispatched, no trigger firing. */
export interface OneTimeEffect extends EffectBase {
  kind: 'oneTime';
  stat: OperatorStat;
  value: Leveled<number>;
  target?: EffectTarget;
  /** Which actions consume this effect. Same matching as passesSkillFilter. */
  skillTypes?: SkillType | SkillType[];
  skillId?: string | string[];
}

/** Directly consumes an active operator or enemy status without applying any effect. */
export interface ConsumeEffect extends EffectBase {
  kind: 'consume';
  /** Operator status id(s) or stat descriptors to consume. */
  operatorStatus?: string | EffectStat | (string | EffectStat)[];
  /** Enemy status id(s) or stat descriptors to consume. */
  enemyStatus?: string | EnemyStat | (string | EnemyStat)[];
  /** Partial stack count to consume. Omit to consume all stacks. */
  consumeStacks?: number;
  /** 'team' = consume from all team members (operatorStatus only). */
  consumeScope?: 'team';
}

export type PatchableEffectBaseFields = Pick<
  EffectBase,
  | 'id'
  | 'name'
  | 'icon'
  | 'duration'
  | 'durationExtension'
  | 'stacks'
  | 'maxStacks'
  | 'stackStrategy'
  | 'condition'
  | 'icd'
  | 'icdGroup'
  | 'hide'
  | 'applyTiming'
>;

export type PatchableStatusEffectFields = PatchableEffectBaseFields &
  Pick<StatusEffect, 'stat' | 'value' | 'scaling' | 'target' | 'silent'>;

export type PatchableReactionEffectFields = PatchableEffectBaseFields &
  Pick<ReactionEffect, 'effectiveness'>;

export type PatchableDamageHitEffectFields = PatchableEffectBaseFields &
  Pick<DamageHitEffect, 'multiplier' | 'multiplierScaling' | 'staggerScaling' | 'hit'>;

export type PatchableSpGainEffectFields = PatchableEffectBaseFields &
  Pick<SpGainEffect, 'value' | 'scaling'>;

export type PatchableUltimateEnergyGainEffectFields = PatchableEffectBaseFields &
  Pick<UltimateEnergyGainEffect, 'value' | 'scaling'>;

export type PatchableConsumeEffectFields = PatchableEffectBaseFields &
  Pick<ConsumeEffect, 'consumeStacks'>;

export type PatchableDamageOverTimeEffectFields = PatchableEffectBaseFields &
  Pick<DamageOverTimeEffect, 'multiplier' | 'multiplierScaling' | 'consumedStatEffects'>;

export type PatchableEffectFields =
  | PatchableStatusEffectFields
  | PatchableReactionEffectFields
  | PatchableDamageHitEffectFields
  | PatchableDamageOverTimeEffectFields
  | PatchableSpGainEffectFields
  | PatchableUltimateEnergyGainEffectFields
  | PatchableConsumeEffectFields;

export interface PatchEffect {
  kind: 'patchEffect';
  targetEffect: string;
  id?: string;
  /** Override fields merged into the target effect at collection time. */
  effect: Partial<PatchableEffectFields>;
}

/** Effects are appendeded while other fields are overrided. */
export type PatchableHitFields = Pick<
  Hit,
  'offset' | 'spRecovery' | 'spReturn' | 'stagger' | 'durationExtension' | 'effects'
>;

export interface PatchHit {
  kind: 'patchHit';
  targetHit: string;
  id?: string;
  /** Override fields merged into the target hit at collection time. */
  hit: Partial<PatchableHitFields>;
}

export interface AppendEffect {
  kind: 'appendEffect';
  /** Id of a sibling effect in TriggerEffect.effects[]. New effect is appended to the same array. */
  targetEffect: string;
  /** Resolved at the same level index as the sibling's trigger. */
  effect: Effect;
}

export type PatchableTickFields = Pick<Tick, 'hitCount'>;

export interface PatchTick {
  kind: 'patchTick';
  targetTick: string;
  tick: Partial<PatchableTickFields>;
}

export type Patch = PatchEffect | PatchHit | AppendEffect | PatchTick;

export type Effect =
  | StatusEffect
  | InflictionEffect
  | BurstEffect
  | ReactionEffect
  | PhysicalStatusEffect
  | DamageHitEffect
  | DamageOverTimeEffect
  | SpGainEffect
  | SpReturnEffect
  | UltimateEnergyGainEffect
  | ConsumeEffect
  | DerivedEffect
  | OneTimeEffect
  | CooldownReductionEffect;

export function isStatusEffect(
  effect: Effect | ResolvedEffect,
): effect is StatusEffect | ResolvedStatusEffect {
  return effect.kind === 'status';
}

const ENEMY_STAT_MODIFIERS = new Set(['susceptibility', 'increasedDmgTaken', 'resistanceShred']);

export function isEnemyStat(stat: EffectStat): stat is EnemyStat {
  return ENEMY_STAT_MODIFIERS.has((stat as { modifier: string }).modifier);
}

/** Returns true when the effect targets the enemy (routing based on kind/stat/target). */
export function isEnemyEffect(effect: Effect | ResolvedEffect): boolean {
  if (
    effect.kind === 'infliction' ||
    effect.kind === 'burst' ||
    effect.kind === 'reaction' ||
    effect.kind === 'physicalStatus'
  )
    return true;
  if (effect.kind === 'damageHit' || effect.kind === 'damageOverTime') return false;
  if (effect.kind === 'cooldownReductionFlat' || effect.kind === 'cooldownReductionPercent')
    return false; // actor-side cooldown reduction
  if (effect.kind === 'status') {
    const target = effect.target;
    const scope = typeof target === 'string' ? target : target?.scope;
    if (scope === 'enemy') return true;
    if (effect.stat && isEnemyStat(effect.stat)) return true;
    return false;
  }
  return false;
}

// ─── Resolved types ─────────────────────────────────────────────────────────

/** EffectBase with all `Leveled<number>` lifecycle fields resolved to scalars. */
interface ResolvedEffectBase extends Omit<
  EffectBase,
  'kind' | 'duration' | 'stacks' | 'maxStacks'
> {
  duration?: number;
  stacks?: number | 'fromConsume';
  maxStacks?: number;
}

export interface ResolvedAttributeScaling {
  basis: string | string[];
  coefficient: number;
}

export interface ResolvedStackScaling {
  key: string;
  target?: 'enemy' | 'self';
  coefficient: number;
}

export interface ResolvedScalingDef {
  additive?: (ResolvedAttributeScaling | ResolvedStackScaling | number)[];
  multiplier?: number[];
  cap?: number;
  conditionalScaling?: { condition: EffectCondition; scaling: ResolvedScalingDef };
}

export interface ResolvedStatusEffect extends ResolvedEffectBase {
  kind: 'status';
  target?: EffectTarget;
  stat?: EffectStat;
  value?: number;
  scaling?: ResolvedScalingDef;
  silent?: boolean;
  external?: boolean;
}

export interface ResolvedInflictionEffect extends ResolvedEffectBase {
  kind: 'infliction';
  element: ArtsElement;
}

export interface ResolvedBurstEffect extends ResolvedEffectBase {
  kind: 'burst';
  element: ArtsElement;
}

export interface ResolvedReactionEffect extends ResolvedEffectBase {
  kind: 'reaction';
  reactionType: ArtsReaction;
  requiresInfliction?: ArtsElement[];
  effectiveness?: number;
  defaultLevel?: number;
}

export interface ResolvedPhysicalStatusEffect extends ResolvedEffectBase {
  kind: 'physicalStatus';
  physicalType: PhysicalStatus;
  forced?: boolean;
  effectiveness?: number;
}

export interface ResolvedDamageHitEffect extends ResolvedEffectBase {
  kind: 'damageHit';
  element: DamageElement;
  multiplier: number;
  multiplierScaling?: ResolvedScalingDef;
  staggerScaling?: ResolvedScalingDef;
  offset?: number;
  hit?: {
    spRecovery?: number;
    spReturn?: number;
    stagger?: number;
    effects?: Effect[];
  };
  readConsumedStacks?: { statusKey: string; target: 'enemy' | 'self' };
  scaleByCrit?: boolean;
}

export interface ResolvedDamageOverTimeEffect extends ResolvedEffectBase {
  kind: 'damageOverTime';
  element: DamageElement;
  multiplier: number;
  multiplierMode?: 'each' | 'split';
  multiplierScaling?: ResolvedScalingDef;
  offset?: number;
  interval: number;
  snapshot?: boolean;
  canCrit?: boolean;
  skipFirstTick?: boolean;
  cancelOnRefresh?: boolean;
  consumedStatEffects?: { stat: OperatorStat; value: number }[];
}

export interface ResolvedSpGainEffect extends ResolvedEffectBase {
  kind: 'spRecovery';
  value: number;
  scaling?: ResolvedScalingDef;
}

export interface ResolvedSpReturnEffect extends ResolvedEffectBase {
  kind: 'spReturn';
  value: number;
  scaling?: ResolvedScalingDef;
}

export interface ResolvedUltimateEnergyGainEffect extends ResolvedEffectBase {
  kind: 'ultEnergyGain';
  target?: EffectTarget;
  value: number;
  scaling?: ResolvedScalingDef;
}

export interface ResolvedConsumeEffect extends ResolvedEffectBase {
  kind: 'consume';
  operatorStatus?: string | EffectStat | (string | EffectStat)[];
  enemyStatus?: string | EnemyStat | (string | EnemyStat)[];
  consumeStacks?: number;
  consumeScope?: 'team';
}

export interface ResolvedOneTimeEffect extends ResolvedEffectBase {
  kind: 'oneTime';
  stat: OperatorStat;
  value: number;
  target?: EffectTarget;
  skillTypes?: SkillType | SkillType[];
  skillId?: string | string[];
}

export type ResolvedEffect =
  | ResolvedStatusEffect
  | ResolvedInflictionEffect
  | ResolvedBurstEffect
  | ResolvedReactionEffect
  | ResolvedPhysicalStatusEffect
  | ResolvedDamageHitEffect
  | ResolvedDamageOverTimeEffect
  | ResolvedSpGainEffect
  | ResolvedSpReturnEffect
  | ResolvedUltimateEnergyGainEffect
  | ResolvedConsumeEffect
  | ResolvedOneTimeEffect;

export interface ResolvedTriggerEffect {
  trigger: TriggerEvent;
  effects: ResolvedEffect[];
}

// ─── Operator Sheet ─────────────────────────────────────────────────────────

export interface TalentEntry {
  levels: number;
  effects?: Effect[];
  triggers?: TriggerEffect[];
  patches?: Patch[];
}

export interface PotentialEntry {
  /** No level dimension — values must be flat scalars (enforced by Resolved<Effect>). */
  effects?: ResolvedEffect[];
  triggers?: TriggerEffect[];
  patches?: Patch[];
}

export interface CombatSkillEntry {
  segments: Segment[];
  element?: DamageElement;
  subSkills?: SubSkillEntry[];
  triggers?: TriggerEffect[];
  /** Passive effects active while this skill is available/equipped. Resolved by skill level. */
  effects?: Effect[];
  icon?: string;
  cooldown?: Leveled<number>;
  ultimateEnergyCost?: number;
  ultimateEnergyGain?: number;
  animationTime?: number;
  enhancementTime?: number;
}

/**
 * Post-collect representation of a skill. Produced by expandCombatSkills/patchCombatSkills
 * — subSkills are hoisted to top-level entries so downstream code handles every skill
 * uniformly (no more nested subSkills traversal).
 */
export interface FlatSkillEntry extends Omit<CombatSkillEntry, 'subSkills'> {
  /** Unique key within the operator. Equals the combatSkills dict key for standard skills,
   *  `sub.id ?? sub.name` for subSkills, and `'finisher' | 'dive'` for the synthetic entries. */
  skillKey: string;
  /** Key into opInst.skillLevels. For subSkills and finisher/dive, points at the parent
   *  skill's combatSkills key (e.g. 'basicAttack'). */
  levelKey: string;
  /** Skill type tag: `'basicAttack' | 'battleSkill' | 'comboSkill' | 'ultimate' | 'finisher' | 'dive'`.
   *  For subSkills this equals the parent combatSkills key — generic trigger filters targeting
   *  e.g. `'comboSkill'` match the parent AND every sub-variant by plain equality. */
  type: string;
  /** SubSkill's author-provided `name`. Used as the i18n lookup key and override-key segment
   *  so that back-compat with user-stored overrides is preserved. */
  name?: string;
  /** SubSkill's optional element override, preserved from SubSkillEntry. */
  element?: DamageElement;
}

/** Create a finisher CombatSkillEntry with the given element. */
export function createFinisherEntry(element: DamageElement): CombatSkillEntry {
  return {
    segments: [
      {
        duration: 1.5,
        damageGroups: [
          {
            element,
            multiplier: [400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900],
            multiplierMode: 'split' as const,
            hits: [{ offset: 1.2 }],
          },
        ],
      },
    ],
  };
}

/** Create a dive CombatSkillEntry with the given element. */
export function createDiveEntry(element: DamageElement): CombatSkillEntry {
  return {
    segments: [
      {
        duration: 1.2,
        damageGroups: [
          {
            element,
            multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
            multiplierMode: 'split' as const,
            hits: [{ offset: 1 }],
          },
        ],
      },
    ],
  };
}

export interface SubSkillEntry {
  group: CombatSkillType;
  name: string;
  id?: string;
  segments: Segment[];
  effects?: Effect[];
  icon?: string;
  cooldown?: Leveled<number>;
}

export interface OperatorSheet {
  rarity: number;
  weapon: string;
  element: DamageElement;
  class: operatorClass;
  mainAttribute: Attribute;
  subAttribute: Attribute;
  attributes: Record<string, number[]>;
  talents: TalentEntry[];
  potentials: PotentialEntry[];
  combatSkills: Record<CombatSkillType, CombatSkillEntry>;
  gameId?: string;
  avatar?: string;
  talentIcons?: string[];
  acceptTeamUltEnergy?: boolean;
  acceptSelfSpCostUltEnergy?: boolean;
  finisherElement: DamageElement;
  diveElement: DamageElement;
  /** Default potential for the "Max" button. When omitted, defaults to 5 for rarity <= 5. */
  defaultPotential?: number;
  new?: boolean;
  beta?: boolean;
}

// ─── Weapon Sheet ───────────────────────────────────────────────────────────

export interface WeaponSheet {
  rarity: number;
  type: string;
  icon: string;
  baseAtk: number[];
  skill1: { effects?: Effect[]; triggers?: TriggerEffect[] };
  skill2: { effects?: Effect[]; triggers?: TriggerEffect[] };
  skill3: { effects?: Effect[]; triggers?: TriggerEffect[] };
}

// ─── Enemy Sheet ───────────────────────────────────────────────────────────

export interface EnemySheet {
  name: string;
  gameId: string;
  avatar: string;
  category: string;
  tier: 'normal' | 'advanced' | 'elite' | 'boss' | 'leader';
  levelHp: Record<number, number>;
  def: number;
  resistance: Record<DamageElement, number>;
  superArmor: number;
  maxStagger: number;
  staggerNodeCount: number;
  staggerNodeDuration: number;
  staggerBreakDuration: number;
  finisherRecovery: number;
}

// ─── Gear Piece Sheet ───────────────────────────────────────────────────────

export interface GearPieceSheet {
  name: string;
  icon: string;
  slotType: string;
  levelRequirement: number;
  defense: number;
  skill1: { effects?: Effect[] };
  skill2?: { effects?: Effect[] };
  skill3?: { effects?: Effect[] };
  setSlug?: string;
}

// ─── Gear Set Sheet ─────────────────────────────────────────────────────────

export interface GearSetSheet {
  effects: ResolvedEffect[];
  triggers?: ResolvedTriggerEffect[];
}

// ─── Timeline Types ─────────────────────────────────────────────────────────

export interface Hit {
  id?: string;
  offset: number;
  /** Relative share of the group multiplier this hit receives when multiplierMode is 'split'. Defaults to 1. */
  weight?: number;
  spRecovery?: Leveled<number>;
  spReturn?: Leveled<number>;
  stagger?: Leveled<number>;
  durationExtension?: number;
  effects?: Effect[];
  treatAsReaction?: ArtsReaction | 'shatter' | 'breach' | 'crush';
}

export interface HitGroup {
  id?: string;
  element?: DamageElement;
  multiplier?: number[];
  multiplierMode?: 'each' | 'split';
  /** Additive scaling on top of multiplier. Resolved at display time. */
  multiplierScaling?: ScalingDef;
  hits: Hit[];
  condition?: EffectCondition | EffectCondition[];
  treatAsSkillType?: CombatSkillType;
}

export interface Tick {
  id?: (index: number) => string;
  offset: number;
  duration: number;
  hitCount: number;
  spRecovery?: (index: number) => Leveled<number>;
  spReturn?: (index: number) => Leveled<number>;
  stagger?: (index: number) => Leveled<number>;
  durationExtension?: (index: number) => number;
  effects?: (index: number) => Effect[];
}

export interface TickGroup {
  id?: string;
  element?: DamageElement;
  multiplier?: number[];
  multiplierMode?: 'each' | 'split';
  multiplierScaling?: ScalingDef;
  condition?: EffectCondition | EffectCondition[];
  tick: Tick;
}

export function isTickGroup(group: HitGroup | TickGroup): group is TickGroup {
  return 'tick' in group;
}

export interface Segment {
  duration: number;
  /** Gap (seconds) before this segment starts (relative to the previous segment's end). */
  gap?: number;
  /** Override the skillId for this segment's hits. */
  skillId?: string;
  /** Per-segment SP cost for multi-stage battle skills. */
  spCost?: number;
  damageGroups: (HitGroup | TickGroup)[];
}

export interface SystemConstants {
  iconDatabase: Record<string, string>;
  modifierDefs: { id: string; label: string; unit: string; note?: string; domainTags?: string[] }[];
  weaponCommonModifiers: Record<string, Record<string, number[]>>;
  equipmentTemplates: Record<string, unknown>;
  equipmentCategories: string[];
  equipmentCategoryConfigs: Record<string, unknown>;
}
