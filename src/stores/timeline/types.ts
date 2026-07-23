// ─── Timeline store domain types ───────────────────────────────────────────
// Shapes for the timeline store's reactive state. The timeline is a dynamic
// editor model — actions are spread from library skills and carry many
// transient fields — so the sprawling objects declare their common fields and
// keep an index signature for the rest. Phase 2b decomposition builds on these.

/** A skill/action instance placed on a track's timeline. */
export interface TimelineAction {
  id?: string;
  instanceId?: string;
  type?: string;
  name?: string;
  skillId?: string;
  element?: string;
  startTime: number;
  logicalStartTime?: number;
  duration?: number;
  cooldown?: number;
  spCost?: number;
  gaugeCost?: number;
  gaugeGain?: number;
  teamGaugeGain?: number;
  hits?: unknown[];
  librarySource?: string;
  sourceSkillKey?: string;
  sourceWeaponId?: string | null;
  segmentIndex?: number;
  segmentTotal?: number;
  followupDelay?: number;
  parentSkillId?: string | null;
  attackGroupInstanceId?: string;
  attackGroupName?: string;
  attackSequenceIndex?: number;
  attackSequenceTotal?: number;
  forcedCritHits?: number[];
  locked?: boolean;
  disabled?: boolean;
  isLocked?: boolean;
  isDisabled?: boolean;
  customColor?: string | null;
  kind?: string;
  triggerWindow?: number;
  animationTime?: number;
  enhancementTime?: number | string;
  realStartTime?: number;
  realDuration?: number;
  comboGroupId?: string;
  comboSegmentIndex?: number;
  comboSegmentTotal?: number;
  comboLinked?: boolean;
  comboFollowupDelay?: number;
  comboPrevId?: string | null;
  comboNextId?: string | null;
  comboParentSkillId?: string | null;
  attackSegmentIndex?: number;
  [key: string]: unknown;
}

export interface TrackStatusState {
  [key: string]: unknown;
}

/** Context passed to an ultimate-enhancement extender to compute extra freeze duration. */
export interface UltEnhancerContext {
  track: Track | null | undefined;
  enhStart: number;
  baseDuration: number;
  ultimateAction: TimelineAction;
  getShiftedEndTime: (start: number, duration: number, instanceId?: string) => number;
}

/** An operator-specific hook that extends an ultimate's enhancement window. */
export type UltEnhancer = (context: UltEnhancerContext) => number;

export interface TriggerEffectEntry {
  triggerEffect?: unknown;
  sourceTrackId?: string;
  sourceSkillType?: string;
  [key: string]: unknown;
}

/** One operator lane in the timeline. Shape mirrors `createEmptyTrack()`. */
export interface Track {
  id: string | null;
  operatorInstanceId: string | null;
  actions: TimelineAction[];
  initialGauge: number;
  maxGaugeOverride: number | null;
  gaugeEfficiency: number;
  originiumArtsPower: number;
  weaponId: string | null;
  weaponInstanceId: string | null;
  weaponCommon1Tier: number;
  weaponCommon2Tier: number;
  weaponBuffTier: number;
  weaponAppliedDeltas: Record<string, unknown>;
  equipmentAppliedDeltas: Record<string, unknown>;
  stats: Record<string, unknown>;
  equipArmorId: string | null;
  equipGlovesId: string | null;
  equipAccessory1Id: string | null;
  equipAccessory2Id: string | null;
  equipArmorInstanceId: string | null;
  equipGlovesInstanceId: string | null;
  equipAccessory1InstanceId: string | null;
  equipAccessory2InstanceId: string | null;
  equipArmorRefineTier: number;
  equipGlovesRefineTier: number;
  equipAccessory1RefineTier: number;
  equipAccessory2RefineTier: number;
  linkCdReduction: number;
  operatorStatus: TrackStatusState | null;
  enemyStatus: TrackStatusState | null;
  triggerEffects: TriggerEffectEntry[];
  element?: string;
  [key: string]: unknown;
}

/** A dependency/consumption link drawn between two timeline nodes. */
export interface Connection {
  id: string;
  isConsumption?: boolean;
  sourcePort?: string | null;
  targetPort?: string | null;
  fromNodeId?: string | null;
  toNodeId?: string | null;
  fromEffectId?: string | null;
  toEffectId?: string | null;
  from?: string | null;
  to?: string | null;
  fromNodeType?: string;
  toNodeType?: string;
  fromEffectIndex?: number | null;
  toEffectIndex?: number | null;
  [key: string]: unknown;
}

/** An entry in the character roster (armory-derived, dynamically shaped). */
export interface RosterEntry {
  id: string;
  name?: string;
  element?: string;
  [key: string]: unknown;
}

export interface ScenarioData {
  [key: string]: unknown;
}

/** A serialized scenario snapshot (tracks + timeline state) persisted per scenario. */
export interface ScenarioSnapshot {
  tracks?: Track[];
  connections?: Connection[];
  cycleBoundaries?: CycleBoundary[];
  switchEvents?: SwitchEvent[];
  characterOverrides?: Record<string, unknown>;
  weaponOverrides?: Record<string, unknown>;
  equipmentCategoryOverrides?: Record<string, unknown>;
  systemConstants?: Record<string, unknown>;
  customEnemyParams?: Record<string, unknown>;
  activeEnemyId?: string;
  activeEnemyLevel?: number;
  inheritedInitialEffects?: unknown[];
  inheritedInitialEnemyState?: Record<string, unknown> | null;
  contingencyContractTags?: unknown[];
  operators?: unknown;
  weapons?: unknown;
  gears?: unknown;
  prepDuration?: number;
  prepExpanded?: boolean;
  /** Battle-phase timeline length in seconds (default 120, max 600). */
  battleDuration?: number;
  /** Optional simulation analysis window start (absolute timeline seconds). */
  simulationStartline?: number | null;
  /** Optional simulation hard stop (absolute timeline seconds). */
  simulationEndline?: number | null;
  /** Per-track relative row height weights (UI layout for this scenario). */
  trackRowHeightWeights?: number[];
  [key: string]: unknown;
}

/** One saved scenario in the scenario list. `data` is null while it is the active scenario. */
export interface ScenarioListEntry {
  id: string;
  name: string;
  data: ScenarioData | null;
}

/** Runtime enemy/system configuration (systemConstants + customEnemyParams). */
export interface EnemyConfigState {
  maxSp?: number;
  initialSp?: number;
  spRegenRate?: number;
  skillSpCostDefault?: number;
  linkCdReduction?: number;
  maxStagger?: number;
  staggerNodeCount?: number;
  staggerNodeDuration?: number;
  staggerBreakDuration?: number;
  executionRecovery?: number;
  enemyHp?: number;
  superArmor?: number;
  def?: number;
  tier?: string;
  resistance: Record<string, number>;
  [key: string]: unknown;
}

/** A generic node reference resolved from an id (action or effect). */
export interface ResolvedTimelineNode {
  id: string;
  type?: string;
  actionId?: string | null;
  flatIndex?: number | null;
  [key: string]: unknown;
}

/** The measured bounding box of the timeline viewport, in screen pixels. */
export interface TimelineRect {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface SwitchEvent {
  id: string;
  [key: string]: unknown;
}

export interface CycleBoundary {
  id: string;
  [key: string]: unknown;
}
