import type {
  ActorSnapshot,
  EnemyConfig,
  TeamConfig,
} from "@/simulation/state/types.ts";
import type { TimeContext } from "@/simulation/compiler/timeContext.ts";

export interface ScenarioData {
  tracks: ScenarioTrack[];
  connections?: Connection[];

  // config
  systemConstants?: SystemConstants;
  characterOverrides?: Record<string, any>;
  weaponOverrides?: Record<string, any>;
  equipmentCategoryOverrides?: Record<string, any>;
  weaponStatuses?: any[];

  // enemy
  activeEnemyId?: string;
  customEnemyParams?: Partial<EnemyConfig>;

  switchEvents?: SwitchEvent[];

  // others
  [key: string]: any;
}

export type SystemConstants = EnemyConfig & TeamConfig;

export interface SwitchEvent {
  // TOOD
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
};

export type ActorStatKeys = keyof ActorStats;

export interface ScenarioTrack {
  // 角色名
  id: string;
  actions: Action[];

  // stats
  stats: ActorStats;
  /**
   * @deprecated - use stats.ult_charge_eff
   */
  gaugeEfficiency: number;
  /**
   * @deprecated - use stats.originium_arts_power
   */
  originiumArtsPower: number;
  /**
   * @deprecated - use stats.link_cd_reduction
   */
  linkCdReduction: number;

  // config
  initialGauge: number;
  maxGaugeOverride?: number | null;
  acceptTeamGauge?: boolean;

  // equipment
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
  // TODO
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

export interface Anomaly {
  _id: string;
  offset: number;
  duration: number;
  type: string;
  sp?: number;
  stagger?: number;
  stacks: number | string; // numeric string
}

export interface DamageTick {
  offset: number;
  sp: number;
  spKind?: SpGainKind;
  stagger: number;
  boundEffects?: string[];
}

export interface ResolvedDamageTick extends DamageTick {
  realTime: number;
  realOffset: number;
  time: number;
}

export type ActionType =
  | "execution" // 处决
  | "skill" // 技能
  | "link" // 连携
  | "ultimate" // 终结技
  | "attack"; // 重击

export interface Action {
  id: string;
  instanceId: string;
  type: ActionType;
  name: string;
  startTime: number;
  logicalStartTime: number;
  cooldown: number;
  spCost: number;
  spGain?: number;
  spGainKind?: SpGainKind;
  element: string;
  librarySource?: string;
  icon?: string;
  gaugeCost: number;
  gaugeGain: number;
  teamGaugeGain: number;
  enhancementTime?: number;
  duration: number;
  triggerWindow?: number;
  animationTime?: number;
  isDisabled?: boolean;
  weaponId?: string | null;
  sourceWeaponId?: string | null;
  allowedTypes: string[];
  damageTicks: DamageTick[];
  physicalAnomaly: Anomaly[][];

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

export interface AnomalyNode {
  type: "effect";
  id: string;
  actionId: string;
  colIndex: number;
  rowIndex: number;
  flatIndex: number;
  node: Anomaly;
}

export interface ResolvedEffect extends AnomalyNode {
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
  effects: ResolvedEffect[];
  triggerWindow: {
    hasWindow: boolean;
    startTime: number;
    duration: number;
  };
  resolvedDamageTicks: ResolvedDamageTick[];
  extensionAmount: number;
  freezeDuration?: number;
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
