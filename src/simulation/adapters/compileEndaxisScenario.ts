import { compileScenario } from "@/simulation/compiler/compileScenario";
import { TriggerRegistry } from "@/simulation/engine/TriggerRegistry";
import type { InitialEffect } from "@/simulation/simulator";
import { getEnemy } from "@/data";
import { normalizeEnemyResistance } from "@/data/enemyResistance";

interface CompileEndaxisScenarioInput {
  scenarioData: any;
  tracks: any[];
  characterRoster: any[];
  systemConstants: Record<string, any>;
  prepDuration?: number;
  activeEnemyId?: string | null;
  runtimeInitialEffects?: InitialEffect[];
  runtimeInitialEnemyState?: any;
  simulationEndline?: number | null;
  lmdiAttributionMode?: "stacks" | "applier";
  controlledOperatorSegments?: { startTime: number; operatorId: string | null }[];
}

function buildTriggerRegistryEntries(tracks: any[]) {
  const entries: any[] = [];
  const seen = new Set<string>();

  for (const track of tracks || []) {
    for (const entry of Array.isArray(track?.triggerEffects) ? track.triggerEffects : []) {
      if (!entry?.triggerEffect || !entry?.sourceTrackId) continue;

      const trigger = entry.triggerEffect.trigger || {};
      const effectIds = (entry.triggerEffect.effects || [])
        .map((effect: any) => effect?.id || effect?.kind || "")
        .join(",");
      const key = [
        entry.sourceTrackId,
        entry.sourceSkillType || "",
        trigger.kind || "",
        JSON.stringify(trigger),
        effectIds,
      ].join("::");

      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
  }

  return entries;
}

function collectConsumedStacksWriteKeys(timeline: any, triggerEntries: any[]) {
  const keys = new Set<string>();

  for (const action of timeline?.actions || []) {
    for (const hit of action?.resolvedHits || []) {
      for (const effect of hit?.effects || []) {
        if (effect?.readConsumedStacks?.statusKey) {
          keys.add(effect.readConsumedStacks.statusKey);
        }
      }
    }
  }

  for (const entry of triggerEntries || []) {
    for (const effect of entry?.triggerEffect?.effects || []) {
      if (effect?.readConsumedStacks?.statusKey) {
        keys.add(effect.readConsumedStacks.statusKey);
      }
      const nestedEffects = effect?.hit?.effects;
      if (Array.isArray(nestedEffects)) {
        for (const nested of nestedEffects) {
          if (nested?.readConsumedStacks?.statusKey) {
            keys.add(nested.readConsumedStacks.statusKey);
          }
        }
      }
    }
  }

  return keys;
}

function resolveDynamicMaxGauge(track: any, charInfo: any) {
  const manualOverride = Number(track?.maxGaugeOverride)
  if (Number.isFinite(manualOverride) && manualOverride > 0) {
    return manualOverride
  }

  const base = Number(charInfo?.maxUltimateGauge ?? charInfo?.ultimate_gaugeMax) || 100
  const reduction = Number(track?.operatorStatus?.ultimateEnergyCostReduction) || 0
  return Math.max(1, Math.ceil(base * (1 - Math.max(0, Math.min(reduction, 0.99)))))
}

function buildCompiledTracks(tracks: any[], characterRoster: any[]) {
  return (tracks || []).map((track) => {
    const charInfo = (characterRoster || []).find((character) => character.id === track.id)
    const dynamicMaxGauge = resolveDynamicMaxGauge(track, charInfo)
    const trackGaugeOverride = Number(track.maxGaugeOverride) > 0 ? Number(track.maxGaugeOverride) : null
    const acceptTeamUltEnergy =
      track?.acceptTeamUltEnergy ??
      charInfo?.acceptTeamUltEnergy ??
      charInfo?.accept_team_ult_energy ??
      charInfo?.accept_team_gauge ??
      track?.acceptTeamGauge ??
      true

    return {
      ...track,
      element: charInfo?.element || track.element || "physical",
      acceptTeamGauge: acceptTeamUltEnergy !== false,
      acceptTeamUltEnergy: acceptTeamUltEnergy !== false,
      acceptSelfSpCostUltEnergy:
        track?.acceptSelfSpCostUltEnergy ??
        charInfo?.acceptSelfSpCostUltEnergy ??
        charInfo?.accept_self_sp_cost_ult_energy ??
        true,
      maxGaugeOverride: trackGaugeOverride,
      maxUltimateGauge: dynamicMaxGauge,
      ultimate_gaugeMax: dynamicMaxGauge,
    }
  })
}

export function compileEndaxisScenario(input: CompileEndaxisScenarioInput) {
  const {
    scenarioData,
    tracks,
    characterRoster,
    systemConstants,
    prepDuration,
    activeEnemyId,
    runtimeInitialEffects = [],
    runtimeInitialEnemyState = null,
    simulationEndline = null,
    lmdiAttributionMode = "stacks",
    controlledOperatorSegments = [],
  } = input;

  if (!scenarioData) return null;

  const enemySheet =
    activeEnemyId && activeEnemyId !== "custom" ? getEnemy(activeEnemyId) : null;
  const enemyResistance = normalizeEnemyResistance(
    systemConstants?.resistance ?? enemySheet?.resistance,
  );
  const compiledTracks = buildCompiledTracks(tracks, characterRoster);
  const { timeline, actors, teamConfig, enemyConfig } = compileScenario(
    {
      ...scenarioData,
      tracks: compiledTracks,
    },
    {
      systemConstants: {
        ...systemConstants,
        prepDuration: Number(prepDuration) || 0,
        defense: enemySheet?.def ?? 100,
        superArmor: Number(enemySheet?.superArmor ?? systemConstants?.superArmor) || 0,
        tier: enemySheet?.tier ?? "normal",
        resistance: enemyResistance,
        ...(enemySheet?.maxStagger !== undefined ? { maxStagger: enemySheet.maxStagger } : {}),
        ...(enemySheet?.staggerNodeCount !== undefined
          ? { staggerNodeCount: enemySheet.staggerNodeCount }
          : {}),
        ...(enemySheet?.staggerNodeDuration !== undefined
          ? { staggerNodeDuration: enemySheet.staggerNodeDuration }
          : {}),
        ...(enemySheet?.staggerBreakDuration !== undefined
          ? { staggerBreakDuration: enemySheet.staggerBreakDuration }
          : {}),
        ...(enemySheet?.finisherRecovery !== undefined
          ? { executionRecovery: enemySheet.finisherRecovery }
          : {}),
      },
    },
  );

  const triggerEntries = buildTriggerRegistryEntries(compiledTracks);
  const triggerRegistry =
    triggerEntries.length > 0 ? new TriggerRegistry(triggerEntries) : undefined;
  const consumedStacksWriteKeys = collectConsumedStacksWriteKeys(timeline, triggerEntries);

  const baseStatsByTrack = new Map<string, any>();
  for (const actor of actors || []) {
    if (actor?.id && actor?.baseStats) {
      baseStatsByTrack.set(actor.id, actor.baseStats);
    }
  }

  return {
    timeline,
    actors,
    teamConfig,
    enemyConfig,
    systemConstants,
    triggerEntries,
    triggerRegistry,
    consumedStacksWriteKeys,
    initialEffects: runtimeInitialEffects,
    initialEnemyState: runtimeInitialEnemyState,
    controlledOperatorSegments,
    baseStatsByTrack,
    enemyDef: enemySheet?.def ?? enemyConfig.defense ?? 100,
    enemyResistance: normalizeEnemyResistance(enemyConfig.resistance ?? enemyResistance),
    endlineTime: simulationEndline ?? undefined,
    lmdiAttributionMode,
  };
}
