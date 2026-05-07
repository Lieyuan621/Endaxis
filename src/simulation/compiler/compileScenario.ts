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
import { createDefaultStats } from "@/utils/coreStats";
import type { ActorSnapshot } from "@/simulation/state/types.ts";

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
  const nextAction = {
    ...action,
    damageTicks: (action.damageTicks || []).map((tick) => ({
      ...tick,
      spKind: tick.spKind || "recover",
    })),
  };

  // Skill-based ultimate charge is now derived from consumed recover SP.
  if (nextAction.type === "skill") {
    nextAction.gaugeGain = 0;
    nextAction.teamGaugeGain = 0;
  }

  return nextAction;
}

function resolveTrackMaxGauge(track: ScenarioTrack) {
  if (Number(track.maxGaugeOverride) > 0) {
    return Number(track.maxGaugeOverride);
  }

  const ultimateAction = (track.actions || []).find(
    (action) => action.type === "ultimate" && Number(action.gaugeCost) > 0,
  );

  return Math.max(1, Number(ultimateAction?.gaugeCost) || 100);
}

function processActors(tracks: ScenarioTrack[]): ActorSnapshot[] {
  return tracks
    .filter((t) => !!t.id)
    .map((track) => {
      return {
        id: track.id,
        stats: track.stats,
        acceptTeamGauge: track.acceptTeamGauge !== false,
        resources: {
          hp: track.stats.hp,
          gauge: track.initialGauge,
          maxGauge: resolveTrackMaxGauge(track),
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
  maxStagger: 100,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 10,
  executionRecovery: 25,
};

export function compileScenario(
  scenario: ScenarioData,
  {
    systemConstants,
  }: {
    systemConstants?: Partial<SystemConstants>;
    db?: GameDatabase;
  } = {}
): CompiledScenario {
  const { actions, actors } = normalizeScenario(scenario);

  const compiledTimeline = compileTimeline(actions, scenario.connections);

  const mergedSystemConstants = {
    ...DEFAULT_SYSTEM_CONSTANTS,
    ...systemConstants,
    ...scenario.systemConstants,
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
    },
    enemyConfig: {
      maxStagger: mergedSystemConstants.maxStagger,
      staggerNodeCount: mergedSystemConstants.staggerNodeCount,
      staggerNodeDuration: mergedSystemConstants.staggerNodeDuration,
      staggerBreakDuration: mergedSystemConstants.staggerBreakDuration,
      executionRecovery: mergedSystemConstants.executionRecovery,
    },
    systemConstants: mergedSystemConstants,
  };
}
