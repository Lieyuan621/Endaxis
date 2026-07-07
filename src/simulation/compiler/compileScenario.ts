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
import { isComboSkillLikeAction, isUltimateLikeAction } from "./types";
import { createDefaultEnemyResistance, normalizeEnemyResistance } from "@/data/enemyResistance";

function clampPercent(value: unknown): number {
  const num = Number(value) || 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

function resolveEffectiveCooldown(
    action: Action,
    track: ScenarioTrack,
    systemConstants?: Partial<SystemConstants>,
) {
  const baseCooldown = Math.max(0, Number(action.cooldown) || 0);

  if (baseCooldown <= 0) {
    return {
      baseCooldown,
      cooldown: 0,
      cooldownReductionPercent: 0,
      cooldownReductionFlat: 0,
    };
  }

  const stats = track.stats || ({} as ActorStats);
  let reductionPercent = 0;
  let reductionFlat = 0;
  let externalMult = 1;

  if (isComboSkillLikeAction(action)) {
    reductionPercent = Math.max(
        clampPercent((stats as any).combo_cd_reduction),
        clampPercent(stats.link_cd_reduction),
        clampPercent(track.linkCdReduction),
        clampPercent(systemConstants?.linkCdReduction),
    );
    reductionFlat = Math.max(0, Number((stats as any).combo_cd_reduction_flat) || 0);
    externalMult = Math.max(0, Number((stats as any).combo_cd_external_mult ?? 1) || 1);
  } else if (isUltimateLikeAction(action)) {
    reductionPercent = clampPercent((stats as any).ult_cd_reduction);
    reductionFlat = Math.max(0, Number((stats as any).ult_cd_reduction_flat) || 0);
    externalMult = Math.max(0, Number((stats as any).ult_cd_external_mult ?? 1) || 1);
  }

  const cooldown = Math.max(
      0,
      (baseCooldown - reductionFlat) * (1 - reductionPercent / 100) * externalMult,
  );

  return {
    baseCooldown,
    cooldown,
    cooldownReductionPercent: reductionPercent,
    cooldownReductionFlat: reductionFlat,
  };
}

function normalizeTracks(
    tracks: ScenarioTrack[],
    systemConstants?: Partial<SystemConstants>,
): ScenarioTrack[] {
  return tracks.map((track) => {
    const baseStats = createDefaultStats() as ActorStats;
    track.stats = { ...baseStats, ...track.stats };
    track.acceptTeamGauge = track.acceptTeamGauge !== false;
    track.actions = (track.actions || []).map((action) =>
        normalizeAction(action, track, systemConstants),
    );
    return track;
  });
}

function normalizeAction(
    action: Action,
    track: ScenarioTrack,
    systemConstants?: Partial<SystemConstants>,
): Action {
  const cooldown = resolveEffectiveCooldown(action, track, systemConstants);

  return {
    ...action,
    ...cooldown,
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
        const maxGauge = resolveTrackMaxGauge(track);
        return {
          id: track.id,
          element: (track as any).element,
          stats: track.stats,
          baseStats: track.baseStats ?? null,
          triggerEffects: track.triggerEffects || [],
          acceptTeamGauge: track.acceptTeamGauge !== false,
          acceptTeamUltEnergy: track.acceptTeamUltEnergy ?? track.acceptTeamGauge !== false,
          acceptSelfSpCostUltEnergy: track.acceptSelfSpCostUltEnergy !== false,
          ultimateEnergyCostOverride: maxGauge,
          resources: {
            hp: track.stats.hp,
            gauge: track.initialGauge,
            maxGauge,
            ultimateEnergy: track.initialGauge,
          },
          cooldowns: new Map(),
          activeBuffs: new Map(),
        };
      });
}

export function normalizeScenario(
    scenario: ScenarioData,
    systemConstants?: Partial<SystemConstants>,
) {
  const tracks = normalizeTracks(scenario.tracks, systemConstants);

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
  superArmor: 0,
  tier: "normal",
  resistance: createDefaultEnemyResistance(),
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
  const mergedSystemConstants = {
    ...DEFAULT_SYSTEM_CONSTANTS,
    ...scenario.systemConstants,
    ...systemConstants,
  };

  const { actions, actors } = normalizeScenario(scenario, mergedSystemConstants);
  const compiledTimeline = compileTimeline(actions, scenario.connections);

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
          (mergedSystemConstants.tier === "leader"
              ? 1.75
              : mergedSystemConstants.tier === "boss"
                  ? 1.5
                  : mergedSystemConstants.tier === "elite"
                      ? 1.25
                      : mergedSystemConstants.tier === "advanced"
                          ? 1.1
                          : 1),
      defense: mergedSystemConstants.defense,
      enemyHp: (mergedSystemConstants as any).enemyHp,
      superArmor: (mergedSystemConstants as any).superArmor,
      enemyDamageCapWindowSeconds: (mergedSystemConstants as any).enemyDamageCapWindowSeconds,
      enemyDamageCapRatio: (mergedSystemConstants as any).enemyDamageCapRatio,
      tier: mergedSystemConstants.tier,
      resistance: normalizeEnemyResistance(mergedSystemConstants.resistance),
    },
    systemConstants: mergedSystemConstants,
  };
}
