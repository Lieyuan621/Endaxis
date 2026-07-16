// ─── Timeline simulation composable ─────────────────────────────────────────
// Owns the compile → simulate → project pipeline: it compiles the active
// scenario, runs the discrete-event simulator, and exposes the projected view
// models (logs, series, effect layouts, combo windows, requisite warnings) as
// computeds. The compile/project orchestration currently delegates to the
// simulation adapters; Phase 3 folds that logic in here directly.

import { computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { simulate, type InitialEffect } from '@/simulation/simulator';
import { compileEndaxisScenario } from '@/simulation/adapters/compileEndaxisScenario';
import { projectOptimizerResult } from '@/simulation/adapters/projectOptimizerResult';
import type { Track, RosterEntry, ScenarioListEntry } from './types';

// ─── Dependencies ────────────────────────────────────────────────────────────

interface SimulationDeps {
  scenarioList: Ref<ScenarioListEntry[]>;
  activeScenarioId: Ref<string>;
  tracks: Ref<Track[]>;
  characterRoster: Ref<RosterEntry[]>;
  effectiveSystemConstants: ComputedRef<Record<string, any>>;
  prepDuration: Ref<number>;
  activeEnemyId: Ref<string>;
  runtimeInitialEffects: Ref<Record<string, unknown>[]>;
  inheritedInitialEffects: Ref<Record<string, unknown>[]>;
  inheritedInitialEnemyState: Ref<Record<string, unknown> | null>;
  simulationEndline: Ref<number | null>;
  lmdiAttributionMode: Ref<'stacks' | 'applier'>;
  controlledOperatorSegments: ComputedRef<any>;
  viewDuration: ComputedRef<number>;
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useTimelineSimulation(deps: SimulationDeps) {
  const {
    scenarioList,
    activeScenarioId,
    tracks,
    characterRoster,
    effectiveSystemConstants,
    prepDuration,
    activeEnemyId,
    runtimeInitialEffects,
    inheritedInitialEffects,
    inheritedInitialEnemyState,
    simulationEndline,
    lmdiAttributionMode,
    controlledOperatorSegments,
    viewDuration,
  } = deps;

  const compiledScenario = computed(() => {
    const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value);
    if (!currentScenario) return null;
    return compileEndaxisScenario({
      scenarioData: currentScenario.data,
      tracks: tracks.value,
      characterRoster: characterRoster.value,
      systemConstants: effectiveSystemConstants.value,
      prepDuration: prepDuration.value,
      activeEnemyId: activeEnemyId.value,
      runtimeInitialEffects: [
        ...runtimeInitialEffects.value,
        ...inheritedInitialEffects.value,
      ] as unknown as InitialEffect[],
      runtimeInitialEnemyState: inheritedInitialEnemyState.value,
      simulationEndline: simulationEndline.value,
      lmdiAttributionMode: lmdiAttributionMode.value,
      controlledOperatorSegments: controlledOperatorSegments.value,
    });
  });

  const compiledTimeline = computed(() => {
    return compiledScenario.value?.timeline;
  });

  const simulation = computed(() => {
    const scenario = compiledScenario.value;
    if (!scenario) return null;
    return simulate(
      scenario.timeline,
      scenario.teamConfig,
      scenario.enemyConfig,
      scenario.actors,
      scenario.triggerRegistry,
      scenario.consumedStacksWriteKeys,
      {
        initialEffects: scenario.initialEffects,
        initialEnemyState: scenario.initialEnemyState,
        baseStatsByTrack: scenario.baseStatsByTrack,
        enemyDef: scenario.enemyDef,
        enemyResistance: scenario.enemyResistance,
        endlineTime: scenario.endlineTime,
        lmdiAttributionMode: scenario.lmdiAttributionMode,
        controlledOperatorSegments: scenario.controlledOperatorSegments,
      },
    );
  });

  const optimizerProjection = computed(() => {
    return projectOptimizerResult({
      simulation: simulation.value,
      compiledScenario: compiledScenario.value,
      tracks: tracks.value,
      viewDuration: viewDuration.value,
      prepDuration: prepDuration.value,
      simulationEndline: simulationEndline.value,
    });
  });

  const simLog = computed(() => {
    return optimizerProjection.value.simLog;
  });

  const operatorLog = computed(() => {
    return optimizerProjection.value.operatorLog;
  });

  const enemyLog = computed(() => {
    return optimizerProjection.value.enemyLog;
  });

  const simLogRevision = computed(() => {
    return simLog.value.length + enemyLog.value.length;
  });

  const spSeries = computed(() => {
    return optimizerProjection.value.spSeries;
  });

  const staggerSeries = computed(() => {
    return optimizerProjection.value.staggerSeries;
  });

  const trackBuffLayouts = computed(() => {
    return optimizerProjection.value.trackBuffLayouts;
  });

  const enemyEffectLayout = computed(() => {
    return optimizerProjection.value.enemyEffectLayout;
  });

  const enemyAfflictionViz = computed(() => {
    return optimizerProjection.value.enemyAfflictionViz;
  });

  const operatorEffectLayouts = computed(() => {
    return optimizerProjection.value.operatorEffectLayouts;
  });

  const comboWindowLayouts = computed(() => {
    return optimizerProjection.value.comboWindowLayouts;
  });

  const requisiteWarnings = computed(() => {
    return optimizerProjection.value.requisiteWarnings;
  });

  const gaugeSeriesByTrackId = computed(() => {
    return optimizerProjection.value.gaugeSeriesByTrackId;
  });

  const timeContext = computed(() => compiledTimeline.value?.timeContext || null);

  const globalExtensions = computed(() => {
    return compiledTimeline.value?.timeExtensions || [];
  });

  return {
    compiledScenario,
    compiledTimeline,
    simulation,
    simLog,
    operatorLog,
    enemyLog,
    simLogRevision,
    spSeries,
    staggerSeries,
    trackBuffLayouts,
    enemyEffectLayout,
    enemyAfflictionViz,
    operatorEffectLayouts,
    comboWindowLayouts,
    requisiteWarnings,
    gaugeSeriesByTrackId,
    timeContext,
    globalExtensions,
  };
}
