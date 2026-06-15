import { compileTimeline } from "./compileTimeline";
import type {
  ActionNode,
  ActorStats,
  CompiledScenario,
  GameDatabase,
  ScenarioData,
  ScenarioTrack,
  SystemConstants,
  Action,
} from "./types";
import { createDefaultStats } from "@/simulation/defaultActorStats";
import type { ActorSnapshot } from "@/simulation/state/types.ts";
import { isUltimateLikeAction } from "./types";

function normalizeTracks(tracks: ScenarioTrack[]): ScenarioTrack[] {
  return tracks.map((track) => {
    const baseStats = createDefaultStats() as ActorStats;
    track.stats = { ...baseStats, ...track.stats };
    track.acceptTeamGauge = track.acceptTeamGauge !== false;
    track.actions = (track.actions || []).map((action) => normalizeAction(action));
    return track;
  });
}

function normalizeAction(action: Action): Action {
  return {
    ...action,
    hits: (action.hits || []).map((hit) => ({
      ...hit,
      spRecovery: Number(hit.spRecovery) || 0,
      spReturn: Number(hit.spReturn) || 0,
      stagger: Number(hit.stagger) || 0,
    })),
  };
}

function resolveTrackMaxGauge(track: ScenarioTrack) {
  if (Number(track.maxGaugeOverride) > 0) {
    return Number(track.maxGaugeOverride);
  }

  const intrinsicMaxGauge = Number(
    track.maxUltimateGauge ?? track.ultimate_gaugeMax,
  );
  if (intrinsicMaxGauge > 0) {
    return intrinsicMaxGauge;
  }

  const ultimateAction = (track.actions || []).find(
    (action) => isUltimateLikeAction(action) && Number(action.gaugeCost) > 0,
  );

  return Math.max(1, Number(ultimateAction?.gaugeCost) || 100);
}

function processActors(tracks: ScenarioTrack[]): ActorSnapshot[] {
  return tracks
    .filter((t) => !!t.id)
    .map((track) => {
      return {
        id: track.id,
        element: (track as any).element,
        stats: track.stats,
        baseStats: track.baseStats ?? null,
        triggerEffects: track.triggerEffects || [],
        acceptTeamGauge: track.acceptTeamGauge !== false,
        acceptTeamUltEnergy: track.acceptTeamGauge !== false,
        ultimateEnergyCostOverride: track.maxGaugeOverride ?? null,
        resources: {
          hp: track.stats.hp,
          gauge: track.initialGauge,
          maxGauge: resolveTrackMaxGauge(track),
          ultimateEnergy: track.initialGauge,
        },
        cooldowns: new Map(),
        activeBuffs: new Map(),
      };
    });
}

export function normalizeScenario(scenario: ScenarioData) {
  const tracks = normalizeTracks(scenario.tracks);

  const actions: ActionNode[] = [];
  tracks.forEach((track, index) => {
    track.actions.forEach((action) => {
      actions.push({
        type: "action",
        id: action.instanceId,
        trackIndex: index,
        trackId: track.id || `track_${index}`,
        node: action,
      });
    });
  });

  return {
    tracks,
    actions,
    actors: processActors(tracks),
  };
}

const DEFAULT_SYSTEM_CONSTANTS: SystemConstants = {
  maxSp: 300,
  initialSp: 200,
  spRegenRate: 8,
  skillSpCostDefault: 100,
  linkCdReduction: 0,
  prepDuration: 0,
  maxStagger: 100,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 10,
  executionRecovery: 25,
  defense: 100,
  tier: "normal",
};

export function compileScenario(
  scenario: ScenarioData,
  {
    systemConstants,
  }: {
    systemConstants?: Partial<SystemConstants>;
    db?: GameDatabase;
  } = {},
): CompiledScenario {
  const { actions, actors } = normalizeScenario(scenario);
  const compiledTimeline = compileTimeline(actions, scenario.connections);

  const mergedSystemConstants = {
    ...DEFAULT_SYSTEM_CONSTANTS,
    ...scenario.systemConstants,
    ...systemConstants,
  };

  return {
    timeline: compiledTimeline,
    actors,
    teamConfig: {
      maxSp: mergedSystemConstants.maxSp,
      initialSp: mergedSystemConstants.initialSp,
      spRegenRate: mergedSystemConstants.spRegenRate,
      skillSpCostDefault: mergedSystemConstants.skillSpCostDefault,
      linkCdReduction: mergedSystemConstants.linkCdReduction,
      prepDuration: mergedSystemConstants.prepDuration,
    },
    enemyConfig: {
      maxStagger: mergedSystemConstants.maxStagger,
      staggerNodeCount: mergedSystemConstants.staggerNodeCount,
      staggerNodeDuration: mergedSystemConstants.staggerNodeDuration,
      staggerBreakDuration: mergedSystemConstants.staggerBreakDuration,
      executionRecovery: mergedSystemConstants.executionRecovery,
      finisherRecovery: mergedSystemConstants.executionRecovery,
      finisherMultiplier:
        (mergedSystemConstants as any).finisherMultiplier ??
        (mergedSystemConstants.tier === "boss"
          ? 1.75
          : mergedSystemConstants.tier === "elite"
            ? 1.5
            : mergedSystemConstants.tier === "advanced"
              ? 1.25
              : 1),
      defense: mergedSystemConstants.defense,
      tier: mergedSystemConstants.tier,
    },
    systemConstants: mergedSystemConstants,
  };
}
