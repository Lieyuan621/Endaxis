import type {
  ActorSnapshot,
  EnemyConfig,
  TeamConfig,
} from "@/simulation/state/types.ts";
import type { OperatorStatus, ComputedEnemyStatus } from "@/types";
import type { TimeContext } from "@/simulation/compiler/timeContext.ts";
import type {
  Effect,
  EffectCondition,
  OperatorStat,
  ResolvedScalingDef,
} from "@/data/types";
import type { DamageBreakdown } from "@/data/stats/computeDamage";
import type { BaseStatValues } from "@/data/stats/types";

export type { Effect };

export interface ScenarioData {
  tracks: ScenarioTrack[];
  connections?: Connection[];

  systemConstants?: SystemConstants;
  characterOverrides?: Record<string, any>;
  weaponOverrides?: Record<string, any>;
  equipmentCategoryOverrides?: Record<string, any>;

  activeEnemyId?: string;
  customEnemyParams?: Partial<EnemyConfig>;
  switchEvents?: SwitchEvent[];

  [key: string]: any;
}

export type SystemConstants = EnemyConfig & TeamConfig;

export interface SwitchEvent {
  /** Unique id (format `sw_<uid>`). */
  id: string;
  /** Time at which control switches to `characterId` (effective from this time onward). */
  time: number;
  /** Track id (operator slug) that gains control at `time`. */
  characterId: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromEffectId?: string | null;
  fromEffectIndex?: number | null;
  toEffectId?: string | null;
  toEffectIndex?: number | null;
  isConsumption?: boolean;
  consumptionOffset?: number;
  targetPort?: string;
  sourcePort?: string;
}

export type ActorStats = {
  primary_ability: number;
  secondary_ability: number;
  strength: number;
  agility: number;
  intellect: number;
  will: number;
  attack: number;
  hp: number;
  crit_rate: number;
  blaze_dmg: number;
  emag_dmg: number;
  cold_dmg: number;
  nature_dmg: number;
  healing_effect: number;
  physical_dmg: number;
  arts_dmg: number;
  originium_arts_power: number;
  ult_charge_eff: number;
  link_cd_reduction: number;
  combo_cd_reduction: number;
  combo_cd_reduction_flat: number;
  ult_cd_reduction: number;
  ult_cd_reduction_flat: number;
  combo_cd_external_mult: number;
  ult_cd_external_mult: number;
};

export type ActorStatKeys = keyof ActorStats;

export interface ScenarioTrack {
  id: string;
  element?: string;
  actions: Action[];

  stats: ActorStats;
  gaugeEfficiency: number;
  originiumArtsPower: number;
  linkCdReduction: number;

  initialGauge: number;
  maxGaugeOverride?: number | null;
  maxUltimateGauge?: number | null;
  ultimate_gaugeMax?: number | null;
  acceptTeamGauge?: boolean;
  acceptTeamUltEnergy?: boolean;
  acceptSelfSpCostUltEnergy?: boolean;
  ultimateEnergyCostOverride?: number | null;
  operatorStatus?: OperatorStatus | null;
  baseStats?: BaseStatValues | null;
  enemyStatus?: ComputedEnemyStatus | null;
  triggerEffects?: any[];

  weaponId?: string | null;
  weaponCommon1Tier?: number;
  weaponCommon2Tier?: number;
  weaponBuffTier?: number;
  weaponAppliedDeltas?: Record<string, any>;
  equipArmorId?: string | null;
  equipGlovesId?: string | null;
  equipAccessory1Id?: string | null;
  equipAccessory2Id?: string | null;
}

export interface GameDatabase {
  weapons?: any[];
}

export interface CompiledScenario {
  timeline: ResolvedTimeline;
  actors: ActorSnapshot[];
  teamConfig: TeamConfig;
  enemyConfig: EnemyConfig;
  systemConstants: SystemConstants;
}

export type SpGainKind = "recover" | "refund";

export interface ConsumedStatEffect {
  stat: OperatorStat;
  value: number;
}

export type CompiledEffect = Effect & {
  _id?: string;
};

export interface Hit {
  id?: string;
  offset: number;
  _noDamage?: boolean;
  multiplier?: number;
  _multiplierScaling?: ResolvedScalingDef;
  element?: string;
  spRecovery: number;
  spReturn: number;
  stagger: number;
  durationExtension?: number;
  effects?: CompiledEffect[];
  _condition?: EffectCondition | EffectCondition[];
  treatAsReaction?: string;
  treatAsSkillType?: string;
  skillId?: string;
}

export interface ResolvedHit extends Hit {
  realTime: number;
  realOffset: number;
  time: number;
  triggered?: boolean;
  triggeredBy?: string;
  skillType?: string;
  skillId?: string;
  element?: string;
  _actionInstanceId?: string;
  _hitIndex?: number;
  consumedStacks?: Record<string, number>;
  consumedStatEffects?: ConsumedStatEffect[];
  _expectedDamage?: number;
  _damageBreakdown?: DamageBreakdown;
  _enemyDamageCap?: {
    capped: boolean;
    cap: number;
    rawDamage: number;
    finalDamage: number;
    usedBefore: number;
    windowStart: number;
    windowEnd: number;
  };
  _staggerMult?: number;
  _staggerContributions?: Record<string, number>;
  _finisherMult?: number;
  _reactionMeta?: {
    reactionType: string;
    level: number;
    element?: string;
    effectiveness?: number;
    consumedStackSources?: Record<string, number>;
    synthetic?: boolean;
  };
  _reactionStaggerMult?: number;
  _canCrit?: boolean;
  _critRateScale?: number;
  _lmdiSelf?: unknown;
  _lmdiExternal?: unknown;
}

export type ActionType =
  | "finisher"
  | "dive"
  | "battleSkill"
  | "comboSkill"
  | "ultimate"
  | "basicAttack";

export function resolveOptimizerSkillType(action: {
  type?: ActionType | null;
}) {
  return action?.type || null;
}

export function isBattleSkillLikeAction(action: {
  type?: ActionType | null;
}) {
  return resolveOptimizerSkillType(action) === "battleSkill";
}

export function isComboSkillLikeAction(action: {
  type?: ActionType | null;
}) {
  return resolveOptimizerSkillType(action) === "comboSkill";
}

export function isUltimateLikeAction(action: {
  type?: ActionType | null;
}) {
  return resolveOptimizerSkillType(action) === "ultimate";
}

export function isFinalStrikeLikeAction(action: {
  type?: ActionType | null;
}) {
  return resolveOptimizerSkillType(action) === "finisher";
}

export interface Action {
  id: string;
  instanceId: string;
  type: ActionType;
  skillId: string;
  name: string;
  startTime: number;
  logicalStartTime: number;
  /** Effective cooldown after passive flat/percent CD reductions. */
  cooldown: number;
  /** Raw skill-sheet cooldown before passive CD reductions. */
  baseCooldown?: number;
  cooldownReductionPercent?: number;
  cooldownReductionFlat?: number;
  spCost: number;
  spGain?: number;
  spGainKind?: SpGainKind;
  element: string;
  librarySource?: string;
  icon?: string;
  gaugeCost: number;
  gaugeGain: number;
  teamGaugeGain: number;
  ultimateEnergyCost?: number;
  ultimateEnergyGain?: number;
  teamUltimateEnergyGain?: number;
  enhancementTime?: number;
  duration: number;
  triggerWindow?: number;
  animationTime?: number;
  treatAsSkillType?: ActionType;
  isDisabled?: boolean;
  weaponId?: string | null;
  sourceWeaponId?: string | null;
  hits: Hit[];
  effects?: CompiledEffect[];

  isLocked?: boolean;
  customBars?: any[];
  customColor?: string | null;
}

export interface ActionNode {
  type: "action";
  id: string;
  trackIndex: number;
  trackId: string;
  node: Action;
}

export interface EffectNode {
  type: "effect";
  id: string;
  actionId: string;
  hitIndex: number;
  effectIndex: number;
  flatIndex: number;
  node: CompiledEffect;
}

export interface ResolvedEffect extends EffectNode {
  uniqueId: string;
  realDuration: number;
  realStartTime: number;
  displayDuration: number;
  isConsumed: boolean;
  extensionAmount: number;
}

export interface ResolvedAction extends ActionNode {
  startTime: number;
  realStartTime: number;
  duration: number;
  realDuration: number;
  isInterrupted: boolean;
  interruptTime?: number;
  effects: ResolvedEffect[];
  triggerWindow: {
    hasWindow: boolean;
    startTime: number;
    duration: number;
  };
  resolvedHits: ResolvedHit[];
  extensionAmount: number;
  freezeDuration?: number;
  consumedStacks?: Record<string, number>;
  consumedStatEffects?: ConsumedStatEffect[];
  consumedLinkSources?: Record<string, number>;
}

export interface TimeExtension {
  time: number;
  gameTime: number;
  amount: number;
  sourceId: string;
  logicalTime: number;
  cumulativeFreezeTime: number;
}

export interface ResolvedTimeline {
  actions: ResolvedAction[];
  actionMap: Map<string, ResolvedAction>;
  effectMap: Map<string, ResolvedEffect>;
  timeExtensions: TimeExtension[];
  timeContext: TimeContext;
  meta: {
    totalDuration: number;
  };
}
