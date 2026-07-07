import { describe, expect, it } from "vitest";
import { compileScenario } from "./compiler/compileScenario";
import type { Action, ScenarioData, ScenarioTrack } from "./compiler/types";
import { simulate } from "./simulator";
import { TriggerRegistry } from "./engine/TriggerRegistry";
import { compileEndaxisScenario } from "./adapters/compileEndaxisScenario";
import { projectEnemyAfflictionViz, projectOptimizerResult } from "./adapters/projectOptimizerResult";
import { projectActionBuffs } from "./projection/projectActionBuffs";
import { createDefaultStats } from "@/simulation/defaultActorStats";
import { collectTriggerEffects, patchCombatSkills } from "@/data/collect";
import estellaSheet from "@/data/operators/estella";
import perlicaSheet from "@/data/operators/perlica";
import mifuSheet from "@/data/operators/mifu";
import { extractRawEntries, resolveHitsFromSheet } from "@/stores/timeline/resolveHits";
import type { BaseStatValues } from "@/data/stats/types";
import type { Effect, TriggerEffect } from "@/data/types";
import type { GearInstance, OperatorInstance, TeamInstance, WeaponInstance } from "@/types";
import { CRITERION_MECHANISMS } from "@/data/contingencyContracts/criteriaEffects";
import { resetEnemyStaggerCarryover } from "@/simulation/state/EnemyState";
import {
  buildEffectiveEnemySystemConstants,
  computeContingencyEnemyHealing,
  getContingencyEnemyDamageCap,
  getContingencyEnemyHealingRate,
  getContingencyEnemyHpMultiplier,
} from "@/data/contingencyContracts/criteriaEffects";

type TrackPatch = Omit<Partial<ScenarioTrack>, "stats"> & {
  stats?: Partial<ScenarioTrack["stats"]>;
  triggerEffects?: Array<{
    sourceTrackId: string;
    sourceSkillType?: string;
    triggerEffect: TriggerEffect;
  }>;
};

const BASE_STATS: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: {
    strength: 100,
    agility: 100,
    intellect: 100,
    will: 100,
  },
  mainAttributeName: "agility",
  secondaryAttributeName: "intellect",
};

function createAction(
  id: string,
  type: Action["type"],
  patch: Partial<Action> = {},
): Action {
  const startTime = Number(patch.startTime) || 0;
  return {
    id,
    instanceId: patch.instanceId || `${id}_inst`,
    type,
    skillId: patch.skillId || id,
    name: patch.name || id,
    startTime,
    logicalStartTime: patch.logicalStartTime ?? startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: "recover",
    element: "physical",
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [],
    ...patch,
  };
}

function createTrack(
  id: string,
  actions: Action[],
  patch: TrackPatch = {},
): ScenarioTrack {
  const { stats: statsPatch, ...restPatch } = patch;
  const stats = {
    ...createDefaultStats(),
    ...(statsPatch || {}),
  } as ScenarioTrack["stats"];

  return {
    id,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: Number(stats.ult_charge_eff) || 100,
    originiumArtsPower: Number(stats.originium_arts_power) || 0,
    linkCdReduction: Number(stats.link_cd_reduction) || 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
    ...restPatch,
  };
}

function createScenario(tracks: ScenarioTrack[]): ScenarioData {
  return { tracks, connections: [] };
}

function runScenario(
  tracks: ScenarioTrack[],
  registry?: TriggerRegistry,
  options: {
    lmdiAttributionMode?: "stacks" | "applier";
    systemConstants?: Record<string, any>;
  } = {},
) {
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks), {
    systemConstants: options.systemConstants,
  });
  const baseStatsByTrack = new Map<string, BaseStatValues>(
    actors.map((actor) => [actor.id, BASE_STATS]),
  );
  return simulate(timeline, teamConfig, enemyConfig, actors, registry, undefined, {
    baseStatsByTrack,
    enemyDef: 100,
    lmdiAttributionMode: options.lmdiAttributionMode,
  });
}

function registry(entries: TrackPatch["triggerEffects"]) {
  return new TriggerRegistry(entries ?? []);
}

function createOperatorInstance(id = "op_alpha", operatorSlug = "estella"): OperatorInstance {
  return {
    id,
    operatorSlug,
    level: 60,
    promoted: true,
    potential: 0,
    skillLevels: {
      basicAttack: 1,
      battleSkill: 9,
      comboSkill: 9,
      ultimate: 9,
    },
    talentStates: {},
    trustLevel: 0,
  };
}

function createWeaponInstance(
  id = "wp_thermite",
  weaponSlug = "thermite-cutter",
): WeaponInstance {
  return {
    id,
    weaponSlug,
    level: 60,
    tuned: true,
    potential: 0,
    skill1Level: 9,
    skill2Level: 9,
    skill3Level: 9,
  };
}

function createGearInstance(id: string, gearPieceId: string): GearInstance {
  return { id, gearPieceId, artificingLevels: [] };
}

function createTeam(
  operatorId = "op_alpha",
  weaponId: string | null = null,
  gear: Partial<TeamInstance["slots"][number]["gear"]> = {},
): TeamInstance {
  return {
    id: "team",
    name: "team",
    slots: [
      {
        operatorId,
        weaponId,
        gear: {
          armor: gear.armor ?? null,
          gloves: gear.gloves ?? null,
          kit1: gear.kit1 ?? null,
          kit2: gear.kit2 ?? null,
        },
      },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
    ],
  };
}

function collectRuntimeTriggers(
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
  weaponInstances: WeaponInstance[] = [],
  gearInstances: GearInstance[] = [],
  tracks: ScenarioTrack[],
): NonNullable<TrackPatch["triggerEffects"]> {
  const triggers = collectTriggerEffects(
    team,
    operatorInstances,
    weaponInstances,
    gearInstances,
    new Map(),
  );
  return triggers.map((entry) => ({
    ...entry,
    sourceTrackId: tracks[entry.sourceSlotIndex]?.id ?? entry.sourceOperatorSlug,
  })) as NonNullable<TrackPatch["triggerEffects"]>;
}

function damageFor(result: ReturnType<typeof runScenario>, actionId: string): number {
  const entry = result.simLog.find(
    (item) => item.type === "DAMAGE_HIT" && item.payload.actionId === actionId,
  );
  if (!entry || entry.type !== "DAMAGE_HIT") {
    throw new Error(`Missing DAMAGE_HIT for action ${actionId}`);
  }
  return Number(entry.payload.hitData._expectedDamage ?? 0);
}

function resolveSheetHits(
  skillKey: string,
  segmentIndex = 0,
): ReturnType<typeof resolveHitsFromSheet> {
  const flatSkills = patchCombatSkills(estellaSheet, { talentStates: {}, potential: 0 });
  const segment = flatSkills[skillKey]?.segments?.[segmentIndex];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, 0, { preserveCondition: true });
}

function resolveOperatorSheetHits(
  sheet: Parameters<typeof patchCombatSkills>[0],
  skillKey: string,
  segmentIndex = 0,
  levelIndex = 11,
  potential = 0,
): ReturnType<typeof resolveHitsFromSheet> {
  const flatSkills = patchCombatSkills(sheet, { talentStates: {}, potential });
  const segment = flatSkills[skillKey]?.segments?.[segmentIndex];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true });
}

describe("optimizer-native runtime parity", () => {
  it("fully excludes disabled actions and restores them when re-enabled", () => {
    const action = createAction("disabled_skill", "battleSkill", {
      isDisabled: true,
      spCost: 40,
      gaugeGain: 20,
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 15,
          spReturn: 0,
          stagger: 30,
          effects: [
            {
              id: "disabled-buff",
              kind: "status",
              stat: { modifier: "atkPercent" },
              value: 10,
              target: "self",
              duration: 5,
            },
            {
              id: "disabled-infliction",
              kind: "infliction",
              element: "heat",
            },
          ],
        },
      ],
    });

    const disabled = runScenario([createTrack("alpha", [action])]);

    expect(disabled.simLog.some((entry) =>
      entry.type === "ACTION_START" || entry.type === "DAMAGE_HIT" || entry.type === "STAGGER"
    )).toBe(false);
    expect(disabled.operatorLog).toHaveLength(0);
    expect(disabled.enemyLog).toHaveLength(0);
    expect(disabled.state.snapshot().enemy.stagger).toBe(0);
    expect(disabled.state.snapshot().actors[0]?.resources.gauge).toBe(0);

    action.isDisabled = false;
    const enabled = runScenario([createTrack("alpha", [action])]);

    expect(enabled.simLog).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "ACTION_START" }),
      expect.objectContaining({ type: "DAMAGE_HIT" }),
      expect.objectContaining({ type: "STAGGER" }),
    ]));
    expect(enabled.operatorLog).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "OPERATOR_EFFECT_APPLY", id: "disabled-buff" }),
    ]));
    expect(enabled.enemyLog.length).toBeGreaterThan(0);
    expect(enabled.state.snapshot().enemy.stagger).toBe(30);
    expect(enabled.state.snapshot().actors[0]?.resources.gauge).toBeCloseTo(2.6);
  });

  it("resets stagger carryover when switching to an enemy with different stagger config", () => {
    const nextEnemyConfig = {
      maxStagger: 120,
      staggerNodeCount: 2,
      staggerNodeDuration: 4,
      staggerBreakDuration: 7,
      executionRecovery: 25,
    };
    const carryover = {
      stagger: {
        value: 90,
        maxStagger: 300,
        breakRemaining: 6,
        lockRemaining: 3,
        staggerContributions: { alpha: 90 },
        lastBreakContributions: { alpha: 300 },
      },
      infliction: { element: "heat", stacks: 2, remainingDuration: 5 },
      statuses: [],
    };
    const reset = resetEnemyStaggerCarryover(carryover, nextEnemyConfig);

    expect(reset.stagger).toEqual({
      value: 0,
      maxStagger: 120,
      breakRemaining: 0,
      lockRemaining: 0,
      staggerContributions: {},
      lastBreakContributions: {},
    });
    expect(reset.infliction).toEqual(carryover.infliction);

    const track = createTrack("alpha", [
      createAction("new_enemy_hit", "battleSkill", {
        startTime: 1,
        hits: [{ offset: 0, multiplier: 0, spRecovery: 0, spReturn: 0, stagger: 40 }],
      }),
    ]);
    const compiled = compileScenario(createScenario([track]), {
      systemConstants: nextEnemyConfig,
    });
    const result = simulate(
      compiled.timeline,
      compiled.teamConfig,
      compiled.enemyConfig,
      compiled.actors,
      undefined,
      undefined,
      { initialEnemyState: reset },
    );
    const staggerLogs = result.simLog.filter((entry) => entry.type === "STAGGER");

    expect(staggerLogs[0]).toMatchObject({
      time: 0,
      payload: { stagger: 0, isBroken: false },
    });
    expect(staggerLogs[1]).toMatchObject({
      time: 1,
      payload: { stagger: 40, nodeReachedIndex: 1, nodeEndTime: 5 },
    });
    expect(result.state.snapshot().enemy).toMatchObject({
      stagger: 40,
      isBroken: false,
    });
  });

  it("keeps a disabled inherited combustion visible without importing or ticking it", () => {
    const tracks = [createTrack("alpha", [])];
    const compiled = compileScenario(createScenario(tracks));
    const inheritedCombustion = {
      stagger: { value: 0 },
      infliction: null,
      vulnerability: null,
      debuffs: {
        combustion: {
          level: 2,
          remainingDuration: 3,
          nextTickDelay: 1,
          sourceId: "alpha",
          actionId: "carried-combustion",
        },
      },
      statuses: [],
      disabledEffects: ["debuff:combustion"],
    };
    const disabled = simulate(
      compiled.timeline,
      compiled.teamConfig,
      compiled.enemyConfig,
      compiled.actors,
      undefined,
      undefined,
      { initialEnemyState: inheritedCombustion },
    );
    const disabledProjection = projectOptimizerResult({
      simulation: disabled,
      compiledScenario: compiled,
      tracks,
      viewDuration: 5,
    });

    expect(disabled.state.enemy.combustion).toBeNull();
    expect(disabled.simLog.some((entry) => entry.type === "DAMAGE_HIT")).toBe(false);
    expect(disabled.enemyLog).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "DEBUFF_APPLY",
        debuffType: "combustion",
        carryoverKey: "debuff:combustion",
        disabled: true,
      }),
    ]));
    expect(disabledProjection.enemyAfflictionViz.anomalies.segments[0]).toMatchObject({
      typeKey: "combustion",
      carryoverKey: "debuff:combustion",
      disabled: true,
    });

    const enabled = simulate(
      compiled.timeline,
      compiled.teamConfig,
      compiled.enemyConfig,
      compiled.actors,
      undefined,
      undefined,
      { initialEnemyState: { ...inheritedCombustion, disabledEffects: [] } },
    );
    expect(enabled.simLog.some((entry) => entry.type === "DAMAGE_HIT")).toBe(true);
  });

  it("compiles Endaxis UI state into optimizer-native scenario inputs", () => {
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        sourceSkillType: "battleSkill",
        triggerEffect: {
          trigger: { kind: "onHit" },
          effects: [
            {
              id: "consume-vulnerability-hit",
              kind: "damageHit",
              element: "physical",
              multiplier: 50,
              readConsumedStacks: { statusKey: "vulnerability", target: "enemy" },
            } as Effect,
          ],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];
    const runtimeInitialEffects = [
      {
        targetTrackId: "alpha",
        id: "hidden-passive",
        stat: { modifier: "atkPercent" as const },
        value: 10,
        sourceId: "alpha",
        effect: { id: "hidden-passive", kind: "status" as const, hide: true },
      },
    ];
    const tracks = [
      createTrack(
        "alpha",
        [
          createAction("status", "battleSkill", {
            hits: [
              {
                offset: 0,
                multiplier: 100,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    kind: "damageHit",
                    element: "physical",
                    multiplier: 10,
                    readConsumedStacks: { statusKey: "combo-state", target: "enemy" },
                  } as Effect,
                ],
              },
            ],
          }),
        ],
        { triggerEffects },
      ),
    ];

    const compiled = compileEndaxisScenario({
      scenarioData: createScenario(tracks),
      tracks,
      characterRoster: [
        {
          id: "alpha",
          element: "heat",
          accept_team_gauge: false,
          accept_self_sp_cost_ult_energy: false,
          maxUltimateGauge: 150,
        },
      ],
      systemConstants: {
        maxSp: 300,
        initialSp: 123,
        spRegenRate: 8,
        skillSpCostDefault: 100,
      },
      prepDuration: 3,
      activeEnemyId: "eny_0051_rodin",
      runtimeInitialEffects,
      simulationEndline: 9,
      lmdiAttributionMode: "applier",
    });

    expect(compiled).toBeTruthy();
    expect(compiled?.teamConfig).toMatchObject({ initialSp: 123, prepDuration: 3 });
    expect(compiled?.enemyConfig).toMatchObject({
      maxStagger: 280,
      staggerNodeCount: 1,
      staggerNodeDuration: 2,
      staggerBreakDuration: 10,
      finisherRecovery: 100,
      defense: 100,
      tier: "leader",
    });
    expect(compiled?.actors[0]).toMatchObject({
      id: "alpha",
      element: "heat",
      acceptTeamGauge: false,
      acceptTeamUltEnergy: false,
      acceptSelfSpCostUltEnergy: false,
      ultimateEnergyCostOverride: 150,
    });
    expect(compiled?.triggerRegistry).toBeInstanceOf(TriggerRegistry);
    expect(compiled?.triggerEntries).toHaveLength(1);
    expect(compiled?.consumedStacksWriteKeys.has("combo-state")).toBe(true);
    expect(compiled?.consumedStacksWriteKeys.has("vulnerability")).toBe(true);
    expect(compiled?.initialEffects).toBe(runtimeInitialEffects);
    expect(compiled?.baseStatsByTrack.get("alpha")).toEqual(BASE_STATS);
    expect(compiled?.enemyDef).toBe(100);
    expect(compiled?.endlineTime).toBe(9);
    expect(compiled?.lmdiAttributionMode).toBe("applier");
  });

  it("keeps existing combo ultimate energy fields unchanged at the Endaxis compile boundary", () => {
    const tracks = [
      createTrack("avywenna", [
        createAction("combo", "comboSkill", {
          gaugeGain: 10,
          hits: [{ offset: 0, multiplier: 0, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
      createTrack("beta", []),
    ];

    const compiled = compileEndaxisScenario({
      scenarioData: createScenario(tracks),
      tracks,
      characterRoster: [
        {
          id: "avywenna",
          element: "electric",
          comboSkill_ultimateEnergyGain: 0,
          maxUltimateGauge: 100,
        },
        {
          id: "beta",
          element: "physical",
          maxUltimateGauge: 100,
        },
      ],
      systemConstants: {
        maxSp: 300,
        initialSp: 123,
        spRegenRate: 8,
        skillSpCostDefault: 100,
      },
    });

    expect(compiled?.timeline.actions[0]?.node.gaugeGain).toBe(10);
  });

  it("routes newly resolved arts infliction effects from sheet hits into enemyLog", () => {
    const hits = resolveSheetHits("battleSkill");
    expect(hits.flatMap((hit) => hit.effects ?? [])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "infliction", element: "cryo" }),
      ]),
    );

    const result = runScenario([
      createTrack("alpha", [
        createAction("estella_battle", "battleSkill", {
          element: "cryo",
          hits,
        }),
      ]),
    ]);

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "INFLICTION_APPLY",
          element: "cryo",
          sourceId: "alpha",
        }),
      ]),
    );
  });

  it("routes newly resolved physical status effects from sheet hits into enemyLog", () => {
    const hits = resolveSheetHits("comboSkill");
    expect(hits.flatMap((hit) => hit.effects ?? [])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "physicalStatus", physicalType: "lift" }),
      ]),
    );

    const result = runScenario([
      createTrack("alpha", [
        createAction("estella_combo", "comboSkill", {
          element: "physical",
          hits,
        }),
      ]),
    ]);

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "PHYSICAL_STATUS",
          physicalType: "lift",
          sourceId: "alpha",
        }),
      ]),
    );
  });

  it("routes thermite-cutter SP and link triggers through operatorLog, lower buff projection, and damage", () => {
    const thermiteEffect: Effect = {
      id: "thermite-cutter-skill3",
      kind: "status",
      stat: { modifier: "atkPercent" },
      target: "team",
      value: 14,
      stackStrategy: "INDEPENDENT",
      maxStacks: 2,
      duration: 20,
      sourceGroup: "weapon",
      icon: "/weapons/sword/wpn_sword_0012.webp",
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: {
            kind: "onSpRecovery",
            skillTypes: ["battleSkill", "comboSkill", "ultimate"],
          },
          effects: [thermiteEffect],
        },
      },
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: {
            kind: "onStatusApplied",
            status: { modifier: "link" },
            target: "self",
          },
          effects: [thermiteEffect],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];

    const thermiteDamageAction = createAction("damage", "battleSkill", {
      startTime: 6,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const tracks = [
      createTrack(
        "alpha",
        [
          createAction("recover", "battleSkill", {
            startTime: 0,
            hits: [{ offset: 0, spRecovery: 10, spReturn: 0, stagger: 0 }],
          }),
          createAction("link", "battleSkill", {
            startTime: 5,
            hits: [
              {
                offset: 0,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    id: "runtime-link",
                    kind: "status",
                    stat: { modifier: "link" },
                    target: "self",
                    duration: 1,
                    hide: true,
                  },
                ],
              },
            ],
          }),
          thermiteDamageAction,
        ],
        { triggerEffects },
      ),
      createTrack("beta", []),
    ];

    const baseline = runScenario([
      createTrack("alpha", [thermiteDamageAction]),
      createTrack("beta", []),
    ]);
    const result = runScenario(tracks, registry(triggerEffects));
    const applies = result.operatorLog.filter(
      (entry) => entry.type === "OPERATOR_EFFECT_APPLY" && entry.id === "thermite-cutter-skill3",
    );

    expect(applies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetTrackId: "alpha",
          stacks: 1,
          maxStacks: 2,
          stackStrategy: "INDEPENDENT",
          effect: expect.objectContaining({ sourceGroup: "weapon", target: "team" }),
        }),
        expect.objectContaining({
          targetTrackId: "beta",
          effect: expect.objectContaining({ sourceGroup: "weapon", target: "team" }),
        }),
      ]),
    );
    expect(damageFor(result, "damage_inst")).toBeGreaterThan(damageFor(baseline, "damage_inst"));

    const layout = projectActionBuffs(result.operatorLog, 30).get("alpha");
    expect(layout?.upper).toHaveLength(0);
    expect(layout?.lower.map((segment) => ({
      start: segment.start,
      end: segment.end,
      stacks: segment.stacks,
      sourceGroup: segment.sourceGroup,
    }))).toEqual([
      { start: 0, end: 5, stacks: 1, sourceGroup: "weapon" },
      { start: 5, end: 20, stacks: 2, sourceGroup: "weapon" },
      { start: 20, end: 25, stacks: 1, sourceGroup: "weapon" },
    ]);
  });

  it("collects real thermite-cutter sheet triggers into runtime and lower buff projection", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("recover", "battleSkill", {
          startTime: 0,
          hits: [{ offset: 0, spRecovery: 10, spReturn: 0, stagger: 0 }],
        }),
        createAction("damage", "battleSkill", {
          startTime: 2,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const team = createTeam("op_alpha", "wp_thermite");
    const operatorInstances = [createOperatorInstance()];
    const weaponInstances = [createWeaponInstance()];
    const triggerEffects = collectRuntimeTriggers(team, operatorInstances, weaponInstances, [], tracks);

    expect(
      triggerEffects.filter((entry) =>
        entry.triggerEffect.effects.some((effect: any) => effect.id === "thermite-cutter-skill3"),
      ),
    ).toHaveLength(2);
    expect(
      triggerEffects.flatMap((entry) => entry.triggerEffect.effects).filter(
        (effect: any) => effect.id === "thermite-cutter-skill3",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceGroup: "weapon",
          target: "team",
          stackStrategy: "INDEPENDENT",
          maxStacks: 2,
          duration: 20,
          icon: "/weapons/sword/wpn_sword_0012.webp",
        }),
      ]),
    );

    const result = runScenario(tracks, registry(triggerEffects));
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "OPERATOR_EFFECT_APPLY",
          id: "thermite-cutter-skill3",
          targetTrackId: "alpha",
          sourceId: "alpha",
          effect: expect.objectContaining({ sourceGroup: "weapon" }),
        }),
      ]),
    );
    expect(projectActionBuffs(result.operatorLog, 25).get("alpha")?.lower[0]).toMatchObject({
      sourceGroup: "weapon",
      start: 0,
      end: 20,
      maxStacks: 2,
    });
  });

  it("lets ally final strikes feed Laevatain melting flame from heat infliction", () => {
    const tracks = [
      createTrack("laevatain", []),
      createTrack("ally", [
        createAction("apply_heat", "battleSkill", {
          startTime: 0,
          hits: [0, 0.1, 0.2, 0.3].map((offset) => ({
            offset,
            multiplier: 1,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [{ kind: "infliction", element: "heat", duration: 20 }],
          })),
        }),
        createAction("ally_basic_first", "basicAttack", {
          startTime: 1,
          attackSequenceIndex: 1,
          attackSequenceTotal: 5,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        } as Partial<Action>),
        createAction("ally_final_strike", "basicAttack", {
          startTime: 2,
          attackSequenceIndex: 5,
          attackSequenceTotal: 5,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        } as Partial<Action>),
      ]),
    ];
    const team: TeamInstance = {
      id: "team",
      name: "team",
      slots: [
        {
          operatorId: "op_laevatain",
          weaponId: null,
          gear: { armor: null, gloves: null, kit1: null, kit2: null },
        },
        {
          operatorId: "op_ally",
          weaponId: null,
          gear: { armor: null, gloves: null, kit1: null, kit2: null },
        },
        {
          operatorId: null,
          weaponId: null,
          gear: { armor: null, gloves: null, kit1: null, kit2: null },
        },
        {
          operatorId: null,
          weaponId: null,
          gear: { armor: null, gloves: null, kit1: null, kit2: null },
        },
      ],
    };
    const laevatain = createOperatorInstance("op_laevatain", "laevatain");
    laevatain.talentStates = { "0": 1 };
    const operatorInstances = [
      laevatain,
      createOperatorInstance("op_ally", "estella"),
    ];
    const triggerEffects = collectRuntimeTriggers(team, operatorInstances, [], [], tracks);

    expect(triggerEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceTrackId: "laevatain",
          triggerEffect: expect.objectContaining({
            trigger: expect.objectContaining({
              kind: "onFinalStrike",
              triggerScope: "global",
            }),
          }),
        }),
      ]),
    );

    const result = runScenario(tracks, registry(triggerEffects));
    const meltingFlameApplies = result.operatorLog.filter(
      (entry) => entry.type === "OPERATOR_EFFECT_APPLY" && entry.id === "laevatain-melting-flame",
    );
    expect(meltingFlameApplies.some((entry) => entry.time === 1)).toBe(false);
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "OPERATOR_EFFECT_APPLY",
          id: "laevatain-melting-flame",
          time: 2,
          targetTrackId: "laevatain",
          sourceId: "laevatain",
          stacks: 4,
        }),
      ]),
    );
  });

  it("projects a 3-piece gear-set onHit stack in the lower buff layer and affects later damage", () => {
    const gearEffect: Effect = {
      id: "mi-security-stack",
      kind: "status",
      stat: { modifier: "atkPercent" },
      target: "self",
      value: 5,
      maxStacks: 5,
      duration: 5,
      sourceGroup: "gearSet",
      icon: "/equipment/item_equip_t4_suit_criti01_edc_03.webp",
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: { kind: "onHit" },
          effects: [gearEffect],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];
    const gearDamageAction = createAction("damage", "basicAttack", {
      startTime: 1,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const tracks = [
      createTrack(
        "alpha",
        [
          createAction("stack", "basicAttack", {
            startTime: 0,
            hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
          }),
          gearDamageAction,
        ],
        { triggerEffects },
      ),
    ];

    const baseline = runScenario([createTrack("alpha", [gearDamageAction])]);
    const result = runScenario(tracks, registry(triggerEffects));
    const apply = result.operatorLog.find(
      (entry) => entry.type === "OPERATOR_EFFECT_APPLY" && entry.id === "mi-security-stack",
    );

    expect(apply).toMatchObject({
      targetTrackId: "alpha",
      effect: expect.objectContaining({ sourceGroup: "gearSet" }),
    });
    expect(damageFor(result, "damage_inst")).toBeGreaterThan(damageFor(baseline, "damage_inst"));
    expect(
      projectActionBuffs(result.operatorLog, 8)
        .get("alpha")
        ?.lower.map((segment) => ({
          sourceGroup: segment.sourceGroup,
          start: segment.start,
          end: segment.end,
          stacks: segment.stacks,
        })),
    ).toEqual([
      { sourceGroup: "gearSet", start: 0, end: 1, stacks: 1 },
      { sourceGroup: "gearSet", start: 1, end: 6, stacks: 2 },
    ]);
  });

  it("collects real mi-security 3-piece trigger into runtime and lower buff projection", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("stack", "basicAttack", {
          startTime: 0,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
        createAction("damage", "basicAttack", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const gearInstances = [
      createGearInstance("gear_armor", "mi-security-armor"),
      createGearInstance("gear_gloves", "mi-security-gloves"),
      createGearInstance("gear_kit", "mi-security-toolkit"),
    ];
    const team = createTeam("op_alpha", null, {
      armor: "gear_armor",
      gloves: "gear_gloves",
      kit1: "gear_kit",
    });
    const operatorInstances = [createOperatorInstance()];
    const triggerEffects = collectRuntimeTriggers(team, operatorInstances, [], gearInstances, tracks);
    const miSecurityEffects = triggerEffects.flatMap((entry) => entry.triggerEffect.effects).filter(
      (effect) => effect.id === "mi-security-stack",
    );

    expect(miSecurityEffects).toEqual([
      expect.objectContaining({
        sourceGroup: "gearSet",
        maxStacks: 5,
        duration: 5,
      }),
    ]);

    const baseline = runScenario([
      createTrack("alpha", [
        createAction("damage", "basicAttack", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);
    const result = runScenario(tracks, registry(triggerEffects));
    expect(damageFor(result, "damage_inst")).toBeGreaterThan(damageFor(baseline, "damage_inst"));
    expect(projectActionBuffs(result.operatorLog, 8).get("alpha")?.lower[0]).toMatchObject({
      sourceGroup: "gearSet",
      start: 0,
      end: 1,
      stacks: 1,
    });
  });

  it("lets Perlica combo damage benefit from potential 3 before the hit resolves", () => {
    const runPerlicaCombo = (potential: number) => {
      const comboHits = resolveOperatorSheetHits(perlicaSheet, "comboSkill", 0, 11, potential);
      const tracks = [
        createTrack("perlica", [
          createAction("perlica_combo", "comboSkill", {
            startTime: 0,
            skillId: "perlica_combo",
            element: "electric",
            hits: comboHits,
          }),
        ]),
      ];
      const operatorInstances = [createOperatorInstance("op_perlica", "perlica")];
      operatorInstances[0]!.potential = potential;
      const team = createTeam("op_perlica");
      const triggerEffects = collectRuntimeTriggers(team, operatorInstances, [], [], tracks);
      const result = runScenario(tracks, registry(triggerEffects));
      const comboHit = result.simLog.find(
        (entry) =>
          entry.type === "DAMAGE_HIT" &&
          entry.payload.actionId === "perlica_combo_inst" &&
          entry.payload.hitData.triggeredBy == null,
      );
      if (!comboHit || comboHit.type !== "DAMAGE_HIT") {
        throw new Error("Missing Perlica combo damage hit");
      }
      return { result, hit: comboHit.payload.hitData };
    };

    const potential2 = runPerlicaCombo(2);
    const potential3 = runPerlicaCombo(3);
    const potential4 = runPerlicaCombo(4);

    expect(potential3.hit._damageBreakdown?.attack).toBeGreaterThan(
      potential2.hit._damageBreakdown?.attack ?? 0,
    );
    expect(potential4.hit._expectedDamage).toBeGreaterThan(potential3.hit._expectedDamage ?? 0);
    expect(potential4.result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "OPERATOR_EFFECT_APPLY",
          targetTrackId: "perlica",
          value: 20,
          effect: expect.objectContaining({
            stat: expect.objectContaining({ modifier: "atkPercent" }),
          }),
        }),
      ]),
    );
  });

  it("applies grizzled-edge 3-piece bonus at 1.5x when consuming physical vulnerability", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("apply_vulnerability", "battleSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "vulnerability" } as Effect],
            },
          ],
        }),
        createAction("consume_vulnerability", "battleSkill", {
          startTime: 1,
          hits: [
            {
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "crush" } as Effect],
            },
          ],
        }),
      ]),
    ];
    const gearInstances = [
      createGearInstance("gear_armor", "grizzled-edge-armor"),
      createGearInstance("gear_gloves", "grizzled-edge-gauntlets"),
      createGearInstance("gear_kit", "grizzled-edge-push-knife"),
    ];
    const team = createTeam("op_alpha", null, {
      armor: "gear_armor",
      gloves: "gear_gloves",
      kit1: "gear_kit",
    });
    const operatorInstances = [createOperatorInstance()];
    const triggerEffects = collectRuntimeTriggers(team, operatorInstances, [], gearInstances, tracks);
    const result = runScenario(tracks, registry(triggerEffects));
    const physicalDmgBonusApplies = result.operatorLog.filter(
      (
        entry,
      ): entry is Extract<(typeof result.operatorLog)[number], { type: "OPERATOR_EFFECT_APPLY" }> =>
        entry.type === "OPERATOR_EFFECT_APPLY" &&
        entry.targetTrackId === "alpha" &&
        entry.effect?.sourceGroup === "gearSet" &&
        entry.effect?.kind === "status" &&
        entry.effect?.stat?.modifier === "dmgBonus" &&
        entry.effect?.stat?.elements === "physical",
    );

    expect(physicalDmgBonusApplies.map((entry) => entry.value)).toEqual([6, 3]);
    expect(physicalDmgBonusApplies.every((entry) => entry.stacks === 1)).toBe(true);
  });

  it.each([
    {
      name: "enemy staggered",
      setupAction: createAction("break_enemy", "battleSkill", {
        startTime: 0,
        hits: [{ offset: 0, multiplier: 0, spRecovery: 0, spReturn: 0, stagger: 100 }],
      }),
    },
    {
      name: "Endministrator Originium Crystals",
      setupAction: createAction("apply_crystals", "battleSkill", {
        startTime: 0,
        hits: [
          {
            offset: 0,
            multiplier: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [
              {
                kind: "status",
                id: "endministrator-originium-crystals",
                target: "enemy",
                value: 0,
                duration: 10,
              } as Effect,
            ],
          },
        ],
      }),
    },
  ])("applies grizzled-edge 3-piece bonus at 1.5x when $name", ({ setupAction }) => {
    const tracks = [
      createTrack("alpha", [
        setupAction,
        createAction("apply_vulnerability", "battleSkill", {
          startTime: 1,
          hits: [
            {
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "vulnerability" } as Effect],
            },
          ],
        }),
        createAction("consume_vulnerability", "battleSkill", {
          startTime: 2,
          hits: [
            {
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "crush" } as Effect],
            },
          ],
        }),
      ]),
    ];
    const gearInstances = [
      createGearInstance("gear_armor", "grizzled-edge-armor"),
      createGearInstance("gear_gloves", "grizzled-edge-gauntlets"),
      createGearInstance("gear_kit", "grizzled-edge-push-knife"),
    ];
    const team = createTeam("op_alpha", null, {
      armor: "gear_armor",
      gloves: "gear_gloves",
      kit1: "gear_kit",
    });
    const operatorInstances = [createOperatorInstance()];
    const triggerEffects = collectRuntimeTriggers(team, operatorInstances, [], gearInstances, tracks);
    const result = runScenario(tracks, registry(triggerEffects));
    const physicalDmgBonusApplies = result.operatorLog.filter(
      (
        entry,
      ): entry is Extract<(typeof result.operatorLog)[number], { type: "OPERATOR_EFFECT_APPLY" }> =>
        entry.type === "OPERATOR_EFFECT_APPLY" &&
        entry.targetTrackId === "alpha" &&
        entry.effect?.sourceGroup === "gearSet" &&
        entry.effect?.kind === "status" &&
        entry.effect?.stat?.modifier === "dmgBonus" &&
        entry.effect?.stat?.elements === "physical",
    );

    expect(physicalDmgBonusApplies.map((entry) => entry.value)).toEqual([6, 3]);
  });

  it("honors onHit weapon skill type filters", () => {
    const weaponEffect: Effect = {
      id: "artzy-tyrannical-stack",
      kind: "status",
      stat: { modifier: "dmgBonus", elements: "cryo" },
      target: "self",
      value: 28,
      stackStrategy: "INDEPENDENT",
      maxStacks: 3,
      duration: 30,
      sourceGroup: "weapon",
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: { kind: "onHit", skillTypes: ["battleSkill", "comboSkill"] },
          effects: [weaponEffect],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];

    const result = runScenario(
      [
        createTrack(
          "alpha",
          [
            createAction("basic", "basicAttack", {
              startTime: 0,
              hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
            }),
            createAction("battle", "battleSkill", {
              startTime: 1,
              element: "cryo",
              hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
            }),
            createAction("combo", "comboSkill", {
              startTime: 2,
              element: "cryo",
              hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
            }),
          ],
          { triggerEffects },
        ),
      ],
      registry(triggerEffects),
    );

    const applies = result.operatorLog.filter(
      (entry): entry is Extract<(typeof result.operatorLog)[number], { type: "OPERATOR_EFFECT_APPLY" }> =>
        entry.type === "OPERATOR_EFFECT_APPLY" &&
        entry.id === "artzy-tyrannical-stack" &&
        !entry.isContinuation,
    );
    expect(applies).toHaveLength(2);
    expect(applies.map((entry) => entry.time)).toEqual([1, 2]);
    expect(applies.every((entry) => entry.effect?.sourceGroup === "weapon")).toBe(true);
  });

  it("keeps nested damageHit.hit.effects ids and sourceGroup through triggered runtime hits", () => {
    const nestedStatus: Effect = {
      id: "nested-gear-status",
      kind: "status",
      stat: { modifier: "dmgBonus", elements: "physical" },
      target: "self",
      value: 25,
      duration: 10,
      sourceGroup: "gearSet",
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: { kind: "onHit" },
          effects: [
            {
              id: "nested-gear-hit",
              kind: "damageHit",
              element: "physical",
              multiplier: 50,
              sourceGroup: "gearSet",
              hit: {
                stagger: 0,
                effects: [nestedStatus],
              },
            } as Effect,
          ],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];

    const result = runScenario(
      [
        createTrack(
          "alpha",
          [
            createAction("starter", "battleSkill", {
              startTime: 0,
              hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
            }),
          ],
          { triggerEffects },
        ),
      ],
      registry(triggerEffects),
    );

    const triggeredHit = result.simLog.find(
      (entry) =>
        entry.type === "DAMAGE_HIT" &&
        entry.payload.hitData.triggeredBy === "nested-gear-hit",
    );
    const nestedApply = result.operatorLog.find(
      (entry) => entry.type === "OPERATOR_EFFECT_APPLY" && entry.id === "nested-gear-status",
    );

    expect(triggeredHit).toBeDefined();
    expect(nestedApply).toMatchObject({
      targetTrackId: "alpha",
      effect: expect.objectContaining({
        id: "nested-gear-status",
        sourceGroup: "gearSet",
      }),
    });
    expect(projectActionBuffs(result.operatorLog, 12).get("alpha")?.lower[0]).toMatchObject({
      sourceGroup: "gearSet",
      start: 0,
      end: 10,
    });
  });

  it("runs arts infliction consume, reaction damage, enemy projection, and LMDI source attribution", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("heat", "battleSkill", {
          startTime: 0,
          element: "heat",
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "infliction", element: "heat", stacks: 2 } as Effect],
            },
          ],
        }),
      ]),
      createTrack("beta", [
        createAction("electric", "battleSkill", {
          startTime: 1,
          element: "electric",
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "infliction", element: "electric", stacks: 1 } as Effect],
            },
          ],
        }),
      ]),
    ];
    const result = runScenario(tracks);
    const reactionHit = result.simLog.find(
      (entry) =>
        entry.type === "DAMAGE_HIT" &&
        entry.payload.hitData?._reactionMeta?.reactionType === "electrification",
    );

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "INFLICTION_APPLY", element: "heat", sourceId: "alpha" }),
        expect.objectContaining({ type: "INFLICTION_CONSUMED", element: "heat", consumedStacks: 2 }),
        expect.objectContaining({ type: "REACTION_TRIGGER", reactionType: "electrification", sourceId: "beta" }),
        expect.objectContaining({ type: "DEBUFF_APPLY", debuffType: "electrification", sourceId: "beta" }),
        expect.objectContaining({ type: "INFLICTION_APPLY", element: "electric", sourceId: "beta", triggerOnly: true }),
      ]),
    );
    expect(reactionHit).toBeDefined();
    const reactionHitData = (reactionHit as any)?.payload?.hitData;
    expect(reactionHitData?._expectedDamage).toBeGreaterThan(0);
    expect(reactionHitData?._reactionMeta?.consumedStackSources).toEqual(
      expect.objectContaining({ alpha: 2 }),
    );
    expect(reactionHitData?._lmdiSelf).toBeDefined();
    expect(reactionHitData?._lmdiExternal).toBeDefined();

    const projection = projectOptimizerResult({
      simulation: result,
      compiledScenario: compileScenario(createScenario(tracks)),
      tracks,
      viewDuration: 12,
    });
    expect(projection.enemyAfflictionViz.attachment.segments[0]).toMatchObject({
      typeKey: "heat_infliction",
      start: 0,
      end: 1,
    });
    expect(projection.enemyAfflictionViz.anomalies.segments[0]).toMatchObject({
      typeKey: "electrification",
      kind: "anomaly",
    });
  });

  it("runs physical vulnerability stack, consume, reaction damage, and enemy projection", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("lift", "comboSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
            },
          ],
        }),
        createAction("knockdown", "comboSkill", {
          startTime: 1,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "knockdown" } as Effect],
            },
          ],
        }),
        createAction("breach", "comboSkill", {
          startTime: 2,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "breach" } as Effect],
            },
          ],
        }),
      ]),
    ];
    const result = runScenario(tracks);
    const breachHit = result.simLog.find(
      (entry) =>
        entry.type === "DAMAGE_HIT" &&
        entry.payload.hitData?._reactionMeta?.reactionType === "breach",
    );
    const projection = projectOptimizerResult({
      simulation: result,
      compiledScenario: compileScenario(createScenario(tracks)),
      tracks,
      viewDuration: 12,
    });

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "PHYSICAL_STATUS", physicalType: "lift" }),
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 1 }),
        expect.objectContaining({ type: "PHYSICAL_STATUS", physicalType: "knockdown" }),
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 2 }),
        expect.objectContaining({ type: "VULNERABILITY_CONSUMED", consumedStacks: 2 }),
        expect.objectContaining({ type: "DEBUFF_APPLY", debuffType: "breach", level: 2 }),
      ]),
    );
    expect((breachHit as any)?.payload?.hitData?._expectedDamage).toBeGreaterThan(0);
    expect(projection.enemyAfflictionViz.physical.segments[0]).toMatchObject({
      typeKey: "vulnerability",
      start: 0,
      end: 1,
      stacks: 1,
    });
    expect(projection.enemyAfflictionViz.physical.markers).toEqual([
      expect.objectContaining({ typeKey: "vulnerability", time: 0, stacks: 1 }),
      expect.objectContaining({ typeKey: "knockdown", time: 1, stacks: 2 }),
      expect.objectContaining({ typeKey: "breach", time: 2, stacks: 2 }),
    ]);
  });

  it("keeps lift and knockdown as 20s physical vulnerability for delayed physical links", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("lift", "comboSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
            },
          ],
        }),
        createAction("breach", "comboSkill", {
          startTime: 10,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "breach" } as Effect],
            },
          ],
        }),
      ]),
    ];
    const result = runScenario(tracks);

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "PHYSICAL_STATUS",
          physicalType: "lift",
          effectiveDuration: 3,
        }),
        expect.objectContaining({
          type: "VULNERABILITY_CHANGE",
          trigger: "lift",
          expiresAt: expect.any(Number),
        }),
        expect.objectContaining({
          type: "VULNERABILITY_CONSUMED",
          consumedBy: "breach",
          consumedStacks: 1,
        }),
        expect.objectContaining({ type: "DEBUFF_APPLY", debuffType: "breach", level: 1 }),
      ]),
    );
    const liftVulnerability = result.enemyLog.find(
      (entry: any) => entry.type === "VULNERABILITY_CHANGE" && entry.trigger === "lift",
    ) as any;
    expect(liftVulnerability.expiresAt).toBeGreaterThan(10);
  });

  it("resolves Mifu ultimate hit multipliers as 200% then 500% at max level", () => {
    const rawEntries = extractRawEntries(mifuSheet.combatSkills.ultimate, 0);
    const hits = resolveHitsFromSheet([], rawEntries, 11);

    expect(hits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "mifu-ult-hit-1", multiplier: 200 }),
        expect.objectContaining({ id: "mifu-ult-hit-2", multiplier: 500 }),
      ]),
    );
  });

  it("projects optimizer-native logs through the UI result adapter", () => {
    const gearEffect: Effect = {
      id: "adapter-gear-stack",
      kind: "status",
      stat: { modifier: "atkPercent" },
      target: "self",
      value: 5,
      duration: 8,
      sourceGroup: "gearSet",
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: { kind: "onHit" },
          effects: [gearEffect],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];
    const tracks = [
      createTrack(
        "alpha",
        [
          createAction("status", "battleSkill", {
            startTime: 0,
            spGain: 10,
            gaugeGain: 12,
            element: "heat",
            hits: [
              {
                offset: 0,
                multiplier: 100,
                spRecovery: 0,
                spReturn: 0,
                stagger: 5,
                effects: [{ kind: "infliction", element: "heat", stacks: 1 } as Effect],
              },
            ],
          }),
        ],
        { triggerEffects },
      ),
    ];
    const compiledScenario = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      compiledScenario.actors.map((actor) => [actor.id, BASE_STATS]),
    );
    const simulation = simulate(
      compiledScenario.timeline,
      compiledScenario.teamConfig,
      compiledScenario.enemyConfig,
      compiledScenario.actors,
      registry(triggerEffects),
      undefined,
      { baseStatsByTrack, enemyDef: 100 },
    );

    const projection = projectOptimizerResult({
      simulation,
      compiledScenario,
      tracks,
      viewDuration: 12,
      prepDuration: 0,
      simulationEndline: null,
    });

    expect(projection.simLog).toBe(simulation.simLog);
    expect(projection.operatorLog).toBe(simulation.operatorLog);
    expect(projection.enemyLog).toBe(simulation.enemyLog);
    expect(projection.spSeries.length).toBeGreaterThan(1);
    expect(projection.staggerSeries.points.length).toBeGreaterThan(1);
    expect(projection.gaugeSeriesByTrackId.get("alpha")?.length).toBeGreaterThan(1);
    expect(projection.trackBuffLayouts.get("alpha")?.lower[0]).toMatchObject({
      sourceGroup: "gearSet",
      start: 0,
      end: 8,
    });
    expect(
      projection.enemyEffectLayout.positionedSegments.some(
        (segment: any) => segment.group === 2 && segment.effect?.kind === "infliction",
      ),
    ).toBe(true);
    expect(projection.enemyAfflictionViz.attachment.segments[0]).toMatchObject({
      typeKey: "heat_infliction",
      kind: "attachment",
      stacks: 1,
      start: 0,
    });
  });

  it("applies ultimate gain efficiency to ultimate energy gains", () => {
    const simulation = runScenario([
      createTrack(
        "alpha",
        [
          createAction("gain", "comboSkill", {
            startTime: 0,
            duration: 1,
            gaugeGain: 10,
          }),
        ],
        {
          maxGaugeOverride: 100,
          stats: { ult_charge_eff: 150 },
        },
      ),
    ]);

    const gaugeEntry = simulation.simLog.find((entry) => entry.type === "ULT_ENERGY_CHANGE");
    expect(gaugeEntry?.payload.change).toBe(15);
    expect(gaugeEntry?.payload.gauge).toBe(15);
  });

  it("converts consumed recovered SP to battle-skill ultimate energy but excludes returned SP", () => {
    const simulation = runScenario([
      createTrack(
        "alpha",
        [
          createAction("spend-recovered-sp", "battleSkill", {
            startTime: 0,
            duration: 1,
            spCost: 100,
            gaugeGain: 0,
            teamGaugeGain: 0,
          }),
        ],
        {
          maxGaugeOverride: 100,
          stats: { ult_charge_eff: 100 },
        },
      ),
      createTrack(
        "beta",
        [],
        {
          maxGaugeOverride: 100,
          stats: { ult_charge_eff: 100 },
        },
      ),
    ]);

    const ueEntries = simulation.simLog.filter(
      (entry) => entry.type === "ULT_ENERGY_CHANGE",
    );

    expect(ueEntries).toHaveLength(2);
    expect(ueEntries.map((entry) => entry.payload)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: "alpha",
          sourceId: "spend-recovered-sp_inst",
          change: 6.5,
          gauge: 6.5,
        }),
        expect.objectContaining({
          actorId: "beta",
          sourceId: "spend-recovered-sp_inst",
          change: 6.5,
          gauge: 6.5,
        }),
      ]),
    );
  });

  it("lets actors opt out of self SP-cost ultimate energy while still granting team energy", () => {
    const simulation = runScenario([
      createTrack(
        "alpha",
        [
          createAction("spend-recovered-sp", "battleSkill", {
            startTime: 0,
            duration: 1,
            spCost: 100,
            gaugeGain: 0,
            teamGaugeGain: 0,
          }),
        ],
        {
          maxGaugeOverride: 100,
          stats: { ult_charge_eff: 100 },
          acceptSelfSpCostUltEnergy: false,
        },
      ),
      createTrack(
        "beta",
        [],
        {
          maxGaugeOverride: 100,
          stats: { ult_charge_eff: 100 },
        },
      ),
    ]);

    const ueEntries = simulation.simLog.filter(
      (entry) => entry.type === "ULT_ENERGY_CHANGE",
    );

    expect(ueEntries).toHaveLength(1);
    expect(ueEntries[0]?.payload).toMatchObject({
      actorId: "beta",
      sourceId: "spend-recovered-sp_inst",
      change: 6.5,
      gauge: 6.5,
    });
    expect(simulation.state.snapshot().actors.find((actor) => actor.id === "alpha")?.resources.gauge)
      .toBe(0);
  });

  it("does not convert returned SP consumption into battle-skill ultimate energy", () => {
    const simulation = runScenario(
      [
        createTrack(
          "alpha",
          [
            createAction("return-sp-setup", "basicAttack", {
              startTime: 0,
              duration: 0.1,
              gaugeGain: 0,
              spGain: 100,
              spGainKind: "refund",
            }),
            createAction("spend-returned-sp", "battleSkill", {
              startTime: 1,
              duration: 1,
              spCost: 100,
              gaugeGain: 0,
              teamGaugeGain: 0,
            }),
          ],
          {
            maxGaugeOverride: 100,
            stats: { ult_charge_eff: 100 },
          },
        ),
      ],
      undefined,
      { systemConstants: { spRegenRate: 0 } },
    );

    const ueEntries = simulation.simLog.filter(
      (entry) => entry.type === "ULT_ENERGY_CHANGE",
    );

    expect(ueEntries).toEqual([]);
  });

  it("does not apply default battle-skill ultimate energy when no SP is recovered", () => {
    const simulation = runScenario([
      createTrack(
        "alpha",
        [
          createAction("free-battle", "battleSkill", {
            startTime: 0,
            duration: 1,
            spCost: 0,
            gaugeGain: 6.5,
            teamGaugeGain: 6.5,
            hits: [
              {
                offset: 0,
                multiplier: 0,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
              },
            ],
          }),
        ],
        { maxGaugeOverride: 100 },
      ),
      createTrack("beta", [], { maxGaugeOverride: 100 }),
    ]);

    expect(simulation.simLog).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ type: "ULT_ENERGY_CHANGE" }),
      ]),
    );
    expect(simulation.state.snapshot().actors.find((actor) => actor.id === "alpha")?.resources.gauge)
      .toBe(0);
    expect(simulation.state.snapshot().actors.find((actor) => actor.id === "beta")?.resources.gauge)
      .toBe(0);
  });

  it("applies explicit fixed battle-skill ultimate energy when no SP is consumed", () => {
    const simulation = runScenario([
      createTrack(
        "alpha",
        [
          createAction("fixed-free-battle", "battleSkill", {
            startTime: 0,
            duration: 1,
            spCost: 0,
            ultimateEnergyGain: 6.5,
            teamUltimateEnergyGain: 6.5,
            hits: [
              {
                offset: 0,
                multiplier: 0,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
              },
            ],
          }),
        ],
        { maxGaugeOverride: 100 },
      ),
      createTrack("beta", [], { maxGaugeOverride: 100 }),
    ]);

    const ueEntries = simulation.simLog.filter(
      (entry) => entry.type === "ULT_ENERGY_CHANGE",
    );

    expect(ueEntries).toHaveLength(2);
    expect(ueEntries.map((entry) => entry.payload)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: "alpha",
          sourceId: "fixed-free-battle_inst",
          change: 6.5,
          gauge: 6.5,
        }),
        expect.objectContaining({
          actorId: "beta",
          sourceId: "fixed-free-battle_inst",
          change: 6.5,
          gauge: 6.5,
        }),
      ]),
    );
  });

  it("does not consume link stacks when the active action branch is treated as comboSkill", () => {
    const readyStatus: Effect = {
      id: "camille-hunter-pursuit-ready",
      kind: "status",
      target: "self",
      duration: 10,
    } as Effect;
    const linkStatus: Effect = {
      id: "two-link-stacks",
      kind: "status",
      stat: { modifier: "link" },
      target: "team",
      duration: 10,
      stacks: 2,
      maxStacks: 2,
    } as Effect;
    const result = runScenario([
      createTrack("alpha", [
        createAction("setup", "battleSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [readyStatus, linkStatus],
            },
          ],
        }),
        createAction("pursuit", "battleSkill", {
          startTime: 1,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              _condition: {
                kind: "not",
                condition: { kind: "operatorStatus", status: "camille-hunter-pursuit-ready" },
              },
            },
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              treatAsSkillType: "comboSkill",
              _condition: { kind: "operatorStatus", status: "camille-hunter-pursuit-ready" },
            },
          ],
        }),
        createAction("consume", "battleSkill", {
          startTime: 2,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);

    const pursuitHit = result.simLog.find(
      (entry: any) =>
        entry.type === "DAMAGE_HIT" && entry.payload.actionId === "pursuit_inst",
    ) as any;
    const consumeHit = result.simLog.find(
      (entry: any) =>
        entry.type === "DAMAGE_HIT" && entry.payload.actionId === "consume_inst",
    ) as any;

    expect(pursuitHit?.payload.hitData.skillType).toBe("comboSkill");
    expect(pursuitHit?.payload.hitData.consumedStacks?.link).toBeUndefined();
    expect(consumeHit?.payload.hitData.consumedStacks).toEqual({ link: 2 });
    expect(result.simLog).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          type: "LINK_CONSUMED",
          payload: expect.objectContaining({ actionId: "pursuit_inst" }),
        }),
      ]),
    );
  });

  it("blocks positive ultimate energy gains during own ultimate enhancement window", () => {
    const simulation = runScenario([
      createTrack(
          "alpha",
          [
            createAction("ult", "ultimate", {
              startTime: 0,
              duration: 2,
              animationTime: 1,
              enhancementTime: 5,
              gaugeCost: 50,
            }),
            createAction("gain-inside", "comboSkill", {
              startTime: 2,
              duration: 1,
              gaugeGain: 10,
            }),
            createAction("gain-after", "comboSkill", {
              startTime: 8,
              duration: 1,
              gaugeGain: 10,
            }),
          ],
          {
            initialGauge: 50,
            maxGaugeOverride: 100,
          },
      ),
    ]);

    const ueEntries = simulation.simLog.filter(
        (entry) => entry.type === "ULT_ENERGY_CHANGE",
    );

    expect(
        ueEntries.some((entry) => entry.payload.sourceId === "gain-inside_inst"),
    ).toBe(false);

    expect(
        ueEntries.some((entry) => entry.payload.sourceId === "gain-after_inst"),
    ).toBe(true);
  });

  it("maps optimizer enemy effect layout into ResourceMonitor affliction groups", () => {
    const viz = projectEnemyAfflictionViz({
      positionedSegments: [
        {
          group: 0,
          subRow: 0,
          start: 1,
          end: 5,
          stacks: 2,
          icon: null,
          effect: { kind: "physicalStatus", physicalType: "vulnerability" },
        },
        {
          group: 2,
          subRow: 0,
          start: 2,
          end: 8,
          stacks: 3,
          icon: null,
          effect: { kind: "infliction", element: "heat" },
        },
        {
          group: 3,
          subRow: 1,
          start: 3,
          end: 9,
          stacks: 1,
          icon: null,
          effect: { kind: "reaction", reactionType: "combustion" },
        },
        {
          group: 4,
          subRow: 0,
          start: 4,
          end: 10,
          stacks: 1,
          icon: null,
          sourceId: "alpha",
          effect: { kind: "status", id: "resistanceShred" },
        },
      ],
    });

    expect(viz.physical.segments[0]).toMatchObject({
      typeKey: "vulnerability",
      kind: "physical",
      tracksComboState: true,
    });
    expect(viz.attachment.segments[0]).toMatchObject({
      typeKey: "heat_infliction",
      kind: "attachment",
      stacks: 3,
    });
    expect(viz.anomalies.segments[0]).toMatchObject({
      typeKey: "combustion",
      kind: "anomaly",
      row: 1,
    });
    expect(viz.statuses.segments[0]).toMatchObject({
      typeKey: "resistanceShred",
      kind: "status",
      sourceId: "alpha",
    });
    expect(viz.anomalies.rowCount).toBe(2);
    expect(viz.statuses.rowCount).toBe(1);
  });

  it("normalizes physical marker display without changing runtime effect state", () => {
    const viz = projectEnemyAfflictionViz({
      positionedSegments: [
        {
          group: 0,
          subRow: 0,
          start: 0,
          end: 0,
          stacks: 1,
          icon: "/legacy/crush.webp",
          effect: { kind: "physicalStatus", physicalType: "crush" },
        },
        {
          group: 0,
          subRow: 0,
          start: 1,
          end: 2,
          stacks: 3,
          icon: null,
          effect: { kind: "physicalStatus", physicalType: "vulnerability" },
        },
        {
          group: 0,
          subRow: 0,
          start: 2,
          end: 2,
          stacks: 3,
          icon: "/legacy/crush.webp",
          effect: { kind: "physicalStatus", physicalType: "crush" },
        },
      ],
    });

    expect(viz.physical.markers).toEqual([
      expect.objectContaining({ typeKey: "vulnerability", time: 0, stacks: 1 }),
      expect.objectContaining({ typeKey: "crush", time: 2, stacks: 3 }),
    ]);
  });
});

describe("controlled-operator target scope", () => {
  const cryoTrigger = (): TriggerEffect => ({
    trigger: { kind: "onActionStart", skillTypes: "battleSkill", triggerScope: "global" },
    effects: [
      {
        kind: "status",
        id: "test-cryo",
        target: "controlled",
        stacks: 1,
        maxStacks: 4,
        duration: 20,
        name: "Cryo",
      } as Effect,
    ],
  });

  function runWithControl(
    tracks: ScenarioTrack[],
    segments: { startTime: number; operatorId: string | null }[],
    entries: NonNullable<TrackPatch["triggerEffects"]>,
  ) {
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      actors.map((actor) => [actor.id, BASE_STATS]),
    );
    return simulate(timeline, teamConfig, enemyConfig, actors, new TriggerRegistry(entries), undefined, {
      baseStatsByTrack,
      enemyDef: 100,
      controlledOperatorSegments: segments,
    });
  }

  const cryoApplies = (result: ReturnType<typeof runWithControl>) =>
    result.operatorLog
      .filter(
        (e): e is Extract<typeof e, { type: "OPERATOR_EFFECT_APPLY" }> =>
          e.type === "OPERATOR_EFFECT_APPLY",
      )
      .filter((e) => e.id === "test-cryo");

  it("applies a target:'controlled' status to the controlled operator, not the caster", () => {
    const result = runWithControl(
      [
        createTrack("A", [createAction("a-bs", "battleSkill", { startTime: 0 })]),
        createTrack("B", []),
      ],
      [{ startTime: 0, operatorId: "B" }],
      [{ sourceTrackId: "A", triggerEffect: cryoTrigger() }],
    );
    const applies = cryoApplies(result);
    expect(applies).toHaveLength(1);
    expect(applies[0]!.targetTrackId).toBe("B");
  });

  it("follows a control switch over time", () => {
    const result = runWithControl(
      [
        createTrack("A", [
          createAction("a1", "battleSkill", { startTime: 0 }),
          createAction("a2", "battleSkill", { startTime: 6 }),
        ]),
        createTrack("B", []),
      ],
      [
        { startTime: 0, operatorId: "A" },
        { startTime: 5, operatorId: "B" },
      ],
      [{ sourceTrackId: "A", triggerEffect: cryoTrigger() }],
    );
    expect(cryoApplies(result).map((e) => ({ time: e.time, target: e.targetTrackId }))).toEqual([
      { time: 0, target: "A" },
      { time: 6, target: "B" },
    ]);
  });

  it("drops the status when nobody is controlled", () => {
    const result = runWithControl(
      [
        createTrack("A", [createAction("a-bs", "battleSkill", { startTime: 0 })]),
        createTrack("B", []),
      ],
      [{ startTime: 0, operatorId: null }],
      [{ sourceTrackId: "A", triggerEffect: cryoTrigger() }],
    );
    expect(cryoApplies(result)).toHaveLength(0);
  });
});

describe("Heat Loss criterion end-to-end (group 1003)", () => {
  const heatLossCryoId = "cc:heat-loss:cryo";
  const mech = CRITERION_MECHANISMS[1003]!;
  // Registry entries for a given level (idx): level-invariant freeze trigger + the level's cast trigger.
  const entriesFor = (idx: number): NonNullable<TrackPatch["triggerEffects"]> =>
    [...(mech.triggers ?? []), ...(mech.triggersByLevel![idx]!)].map((te) => ({
      sourceTrackId: "A",
      triggerEffect: te,
    }));

  // Caster A controlled throughout; most casts are spaced well beyond the per-caster 1s ICD.
  function run(idx: number, castTimes: number[], initialEffects?: any[]) {
    const actions = castTimes.map((t, i) =>
      createAction(`bs${i}`, "battleSkill", { startTime: t }),
    );
    const tracks = [createTrack("A", actions)];
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      actors.map((actor) => [actor.id, BASE_STATS]),
    );
    const result = simulate(
      timeline,
      teamConfig,
      enemyConfig,
      actors,
      new TriggerRegistry(entriesFor(idx)),
      undefined,
      {
        baseStatsByTrack,
        enemyDef: 100,
        controlledOperatorSegments: [{ startTime: 0, operatorId: "A" }],
        initialEffects,
      },
    );
    const applies = (id: string) =>
      result.operatorLog.filter(
        (e): e is Extract<typeof e, { type: "OPERATOR_EFFECT_APPLY" }> =>
          e.type === "OPERATOR_EFFECT_APPLY" && e.id === id,
      );
    return { applies };
  }

  it("level 2: adds a Cryo stack per (icd-gated) cast and freezes on the 4th", () => {
    const { applies } = run(1, [0, 4, 8, 12]);
    const cryo = applies(heatLossCryoId);
    expect(cryo.map((e) => e.cumulativeStacks)).toEqual([1, 2, 3, 4]);
    const frozen = applies("cc:frozen");
    expect(frozen).toHaveLength(1);
    expect(frozen[0]!.targetTrackId).toBe("A");
  });

  it("level 1: adds a Cryo stack every 2 casts (team-wide toggle)", () => {
    const { applies } = run(0, [0, 4, 8, 12]);
    // 4 counted casts → bank, cryo, bank, cryo → 2 stacks, no freeze.
    expect(applies(heatLossCryoId)).toHaveLength(2);
    expect(applies("cc:frozen")).toHaveLength(0);
  });

  it("per-caster 1s recast cooldown: sub-second casts are ignored", () => {
    const { applies } = run(1, [0, 0.5, 1, 1.5, 2]);
    expect(applies(heatLossCryoId).map((e) => e.time)).toEqual([0, 1, 2]);
  });

  it("shares the 1s Cryo cooldown across Heat Loss criteria and trigger sources", () => {
    const tracks = [
      createTrack("A", [
        createAction("a-bs-0", "battleSkill", { startTime: 0 }),
        createAction("a-bs-1", "battleSkill", { startTime: 1 }),
      ]),
      createTrack("B", [createAction("b-cs", "comboSkill", { startTime: 0.5 })]),
    ];
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      actors.map((actor) => [actor.id, BASE_STATS]),
    );
    const result = simulate(
      timeline,
      teamConfig,
      enemyConfig,
      actors,
      new TriggerRegistry([
        {
          sourceTrackId: "A",
          triggerEffect: CRITERION_MECHANISMS[1003]!.triggersByLevel![1]![0]!,
        },
        {
          sourceTrackId: "B",
          triggerEffect: CRITERION_MECHANISMS[1004]!.triggersByLevel![1]![0]!,
        },
      ]),
      undefined,
      {
        baseStatsByTrack,
        enemyDef: 100,
        controlledOperatorSegments: [{ startTime: 0, operatorId: "A" }],
      },
    );
    const cryoTimes = result.operatorLog
      .filter((event) => event.type === "OPERATOR_EFFECT_APPLY" && event.id === heatLossCryoId)
      .map((event) => event.time);

    expect(cryoTimes).toEqual([0, 1]);
  });

  it("blocks new Cryo stacks while the controlled operator is Frozen", () => {
    // Freeze lands at t=12 (4th stack) and lasts 5s. The t=16 cast clears the 1s ICD but is
    // blocked by Frozen; the t=20 cast lands after Frozen expires and starts a fresh stack.
    const { applies } = run(1, [0, 4, 8, 12, 16, 20]);
    expect(applies(heatLossCryoId).map((e) => e.cumulativeStacks)).toEqual([1, 2, 3, 4, 1]);
    expect(applies("cc:frozen")).toHaveLength(1);
  });

  it("a cryo-immune controlled operator (e.g. Estella talent 2) accrues no Cryo", () => {
    // Pre-apply the immunity marker on the controlled operator (as Estella's passive talent would).
    const { applies } = run(1, [0, 4, 8, 12], [
      { targetTrackId: "A", id: "cryo-infliction-immune" },
    ]);
    expect(applies(heatLossCryoId)).toHaveLength(0);
    expect(applies("cc:frozen")).toHaveLength(0);
  });
});

describe("Lysis (Freeze extend + dispel) end-to-end (1003 Heat Loss + 1017 Pyrolysis)", () => {
  const hl = CRITERION_MECHANISMS[1003]!;
  const pyro = CRITERION_MECHANISMS[1017]!; // heat-element dispel

  // Heat Loss level 2 (every cast) + Pyrolysis extend/dispel triggers, all sourced from "A".
  const entries: NonNullable<TrackPatch["triggerEffects"]> = [
    ...(hl.triggers ?? []),
    ...hl.triggersByLevel![1]!,
    ...(pyro.triggers ?? []),
  ].map((te) => ({ sourceTrackId: "A", triggerEffect: te }));

  function runActions(actions: Action[]) {
    const tracks = [createTrack("A", actions)];
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      actors.map((actor) => [actor.id, BASE_STATS]),
    );
    const result = simulate(
      timeline,
      teamConfig,
      enemyConfig,
      actors,
      new TriggerRegistry(entries),
      undefined,
      {
        baseStatsByTrack,
        enemyDef: 100,
        controlledOperatorSegments: [{ startTime: 0, operatorId: "A" }],
      },
    );
    const ops = (type: string, id: string) =>
      result.operatorLog.filter((e: any) => e.type === type && e.id === id);
    return { ops };
  }

  // Four icd-clearing battle-skill casts → Cryo→4 → Freeze at t=12.
  const freezeRamp = [0, 4, 8, 12].map((t, i) =>
    createAction(`bs${i}`, "battleSkill", { startTime: t }),
  );

  it("extends the Freeze window to 15s while a lysis criterion is active", () => {
    const { ops } = runActions(freezeRamp);
    const frozen = ops("OPERATOR_EFFECT_APPLY", "cc:frozen") as any[];
    expect(frozen.some((e) => e.expiresAt === 27)).toBe(true); // 12 + 15, not the base 12 + 5
  });

  it("a matching-element Combo Skill dispels Freeze and leaves one Cryo stack", () => {
    const { ops } = runActions([
      ...freezeRamp,
      createAction("heatCast", "comboSkill", { startTime: 14, element: "heat" }),
    ]);
    const expired = ops("OPERATOR_EFFECT_EXPIRE", "cc:frozen") as any[];
    expect(expired.some((e) => e.time === 14 && e.consumed)).toBe(true);
    const cryo = ops("OPERATOR_EFFECT_APPLY", "cc:heat-loss:cryo") as any[];
    expect(cryo.some((e) => e.time === 14 && e.cumulativeStacks === 1)).toBe(true);
  });

  it("a matching-element Ultimate dispels Freeze without leaving Cryo", () => {
    const { ops } = runActions([
      ...freezeRamp,
      createAction("heatUlt", "ultimate", { startTime: 14, element: "heat" }),
    ]);
    const expired = ops("OPERATOR_EFFECT_EXPIRE", "cc:frozen") as any[];
    expect(expired.some((e) => e.time === 14 && e.consumed)).toBe(true);
    const cryoAt14 = (ops("OPERATOR_EFFECT_APPLY", "cc:heat-loss:cryo") as any[])
      .filter((e) => e.time === 14);
    expect(cryoAt14).toHaveLength(0);
  });

  it("a matching-element Basic Attack does not dispel Freeze", () => {
    const { ops } = runActions([
      ...freezeRamp,
      createAction("heatBasic", "basicAttack", { startTime: 14, element: "heat" }),
    ]);
    const expiredAt14 = (ops("OPERATOR_EFFECT_EXPIRE", "cc:frozen") as any[])
      .filter((e) => e.time === 14 && e.consumed);
    expect(expiredAt14).toHaveLength(0);
  });

  it("a non-matching element does not dispel", () => {
    const { ops } = runActions([
      ...freezeRamp,
      createAction("coldCast", "comboSkill", { startTime: 14, element: "cryo" }),
    ]);
    const expiredAt14 = (ops("OPERATOR_EFFECT_EXPIRE", "cc:frozen") as any[]).filter(
      (e) => e.time === 14 && e.consumed,
    );
    expect(expiredAt14).toHaveLength(0);
  });
});

describe("Contingency runtime enemy mechanics", () => {
  it("resolves Vitality, Healing, and Surge from selected tag ids", () => {
    expect(getContingencyEnemyHpMultiplier([900103])).toBe(3);
    expect(getContingencyEnemyHealingRate([101102])).toBe(0.15);
    expect(getContingencyEnemyDamageCap([102302])).toEqual({
      windowSeconds: 0.1,
      ratio: 0.25,
    });
    expect(buildEffectiveEnemySystemConstants({ enemyHp: 1000 }, [900102, 102302])).toMatchObject({
      enemyHp: 2000,
      enemyDamageCapWindowSeconds: 0.1,
      enemyDamageCapRatio: 0.25,
    });
  });

  it("caps enemy damage taken per 0.1 seconds for Surge", () => {
    const result = runScenario(
      [
        createTrack("alpha", [
          createAction("surgeHits", "battleSkill", {
            startTime: 0,
            hits: [
              { offset: 0, multiplier: 1000, spRecovery: 0, spReturn: 0, stagger: 0 },
              { offset: 0.05, multiplier: 1000, spRecovery: 0, spReturn: 0, stagger: 0 },
              { offset: 0.1, multiplier: 1000, spRecovery: 0, spReturn: 0, stagger: 0 },
            ],
          }),
        ]),
      ],
      undefined,
      {
        systemConstants: {
          enemyHp: 1000,
          enemyDamageCapWindowSeconds: 0.1,
          enemyDamageCapRatio: 0.25,
        },
      },
    );

    const damages = result.simLog
      .filter((entry) => entry.type === "DAMAGE_HIT")
      .map((entry: any) => entry.payload.hitData._expectedDamage);

    expect(damages.slice(0, 2).reduce((sum, value) => sum + value, 0)).toBe(250);
    expect(damages[2]).toBe(250);
    expect(
      result.simLog.some(
        (entry: any) => entry.type === "DAMAGE_HIT" && entry.payload.hitData._enemyDamageCap?.capped,
      ),
    ).toBe(true);
  });

  it("computes Healing from enemy control intervals without double-counting overlaps", () => {
    const healing = computeContingencyEnemyHealing(
      [
        {
          type: "PHYSICAL_STATUS",
          time: 0,
          physicalType: "lift",
          sourceId: "alpha",
          effectiveDuration: 2,
        },
        {
          type: "DEBUFF_APPLY",
          time: 1,
          debuffType: "solidification",
          level: 1,
          expiresAt: 3,
          sourceId: "beta",
        },
        {
          type: "ENEMY_STATUS_APPLY",
          time: 4,
          id: "tangtang-oldenStare@tangtang_ultimate_inst",
          value: 0,
          stacks: 1,
          maxStacks: 1,
          expiresAt: 5,
          sourceId: "gamma",
        },
      ] as any,
      { maxHp: 1000, rate: 0.05, until: 10 },
    );

    expect(healing).toBeCloseTo(200);
  });

  it("filters Healing control intervals by enemy super armor thresholds", () => {
    const events = [
      {
        type: "PHYSICAL_STATUS",
        time: 0,
        physicalType: "lift",
        sourceId: "alpha",
        effectiveDuration: 3,
      },
      {
        type: "DEBUFF_APPLY",
        time: 4,
        debuffType: "solidification",
        level: 1,
        expiresAt: 7,
        sourceId: "beta",
      },
    ] as any;

    expect(
      computeContingencyEnemyHealing(events, { maxHp: 1000, rate: 0.05, until: 10, superArmor: 20 }),
    ).toBeCloseTo(300);
    expect(
      computeContingencyEnemyHealing(events, { maxHp: 1000, rate: 0.05, until: 10, superArmor: 30 }),
    ).toBe(0);
  });

  it("counts Endministrator Originium Crystals as Healing control only up to super armor 20", () => {
    const events = [
      {
        type: "ENEMY_STATUS_APPLY",
        time: 0,
        id: "endministrator-originium-crystals",
        value: 0,
        stacks: 1,
        maxStacks: 1,
        expiresAt: 4,
        sourceId: "endministrator",
      },
    ] as any;

    expect(
      computeContingencyEnemyHealing(events, { maxHp: 1000, rate: 0.05, until: 10, superArmor: 20 }),
    ).toBeCloseTo(200);
    expect(
      computeContingencyEnemyHealing(events, { maxHp: 1000, rate: 0.05, until: 10, superArmor: 30 }),
    ).toBe(0);
  });

  it("uses 3s as the default Lift/Knock Down control duration", () => {
    const result = runScenario([
      createTrack("alpha", [
        createAction("lift", "comboSkill", {
          hits: [
            {
              id: "lift_hit",
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
            },
          ],
        }),
      ]),
    ]);

    expect(result.enemyLog).toContainEqual(
      expect.objectContaining({
        type: "PHYSICAL_STATUS",
        physicalType: "lift",
        effectiveDuration: 3,
      }),
    );
  });

  it("does not count Lift/Knock Down as Healing control before vulnerability exists", () => {
    const firstLift = runScenario([
      createTrack("alpha", [
        createAction("lift", "comboSkill", {
          hits: [
            {
              id: "lift_hit",
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
            },
          ],
        }),
      ]),
    ]);
    const firstLiftEvent = firstLift.enemyLog.find(
      (event: any) => event.type === "PHYSICAL_STATUS" && event.physicalType === "lift",
    ) as any;

    expect(firstLiftEvent.actualControl).toBe(false);
    expect(
      computeContingencyEnemyHealing(firstLift.enemyLog as any, {
        maxHp: 1000,
        rate: 0.05,
        until: 10,
      }),
    ).toBe(0);

    const secondLift = runScenario([
      createTrack("alpha", [
        createAction("setup", "comboSkill", {
          startTime: 0,
          hits: [
            {
              id: "setup_hit",
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "vulnerability" } as Effect],
            },
          ],
        }),
        createAction("lift", "comboSkill", {
          startTime: 1,
          hits: [
            {
              id: "lift_hit",
              offset: 0,
              multiplier: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
            },
          ],
        }),
      ]),
    ]);
    const secondLiftEvent = secondLift.enemyLog.find(
      (event: any) => event.type === "PHYSICAL_STATUS" && event.physicalType === "lift",
    ) as any;

    expect(secondLiftEvent.actualControl).toBe(true);
    expect(
      computeContingencyEnemyHealing(secondLift.enemyLog as any, {
        maxHp: 1000,
        rate: 0.05,
        until: 10,
      }),
    ).toBeCloseTo(150);
  });

  it("projects Lift/Knock Down duration only when the enemy can actually be controlled", () => {
    const actions = [
      createAction("setup", "comboSkill", {
        startTime: 0,
        hits: [
          {
            id: "setup_hit",
            offset: 0,
            multiplier: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [{ kind: "physicalStatus", physicalType: "vulnerability" } as Effect],
          },
        ],
      }),
      createAction("lift", "comboSkill", {
        startTime: 1,
        hits: [
          {
            id: "lift_hit",
            offset: 0,
            multiplier: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [{ kind: "physicalStatus", physicalType: "lift" } as Effect],
          },
        ],
      }),
    ];
    const tracks = [createTrack("alpha", actions)];
    const controlled = runScenario(tracks);
    const controlledProjection = projectOptimizerResult({
      simulation: controlled,
      compiledScenario: compileScenario(createScenario(tracks)),
      tracks,
      viewDuration: 8,
    });

    expect(controlled.enemyLog).toContainEqual(
      expect.objectContaining({ type: "PHYSICAL_STATUS", physicalType: "lift", actualControl: true }),
    );
    expect(controlledProjection.enemyAfflictionViz.physical.segments).toContainEqual(
      expect.objectContaining({ typeKey: "lift", start: 1, end: 4 }),
    );

    const armored = runScenario(tracks, undefined, { systemConstants: { superArmor: 30 } });
    const armoredProjection = projectOptimizerResult({
      simulation: armored,
      compiledScenario: compileScenario(createScenario(tracks), {
        systemConstants: { superArmor: 30 },
      }),
      tracks,
      viewDuration: 8,
    });

    expect(armored.enemyLog).toContainEqual(
      expect.objectContaining({ type: "PHYSICAL_STATUS", physicalType: "lift", actualControl: false }),
    );
    expect(
      armoredProjection.enemyAfflictionViz.physical.segments.some(
        (segment: any) => segment.typeKey === "lift",
      ),
    ).toBe(false);
  });
});

describe("external dmgBonus via initial effect (Poor Basics regression)", () => {
  function damageWith(initialEffects: any[]) {
    const tracks = [
      createTrack("A", [
        createAction("ba", "basicAttack", {
          element: "physical",
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
    const baseStatsByTrack = new Map<string, BaseStatValues>(
      actors.map((actor) => [actor.id, BASE_STATS]),
    );
    const result = simulate(timeline, teamConfig, enemyConfig, actors, undefined, undefined, {
      baseStatsByTrack,
      enemyDef: 100,
      initialEffects,
    });
    return damageFor(result, "ba_inst");
  }

  const dmgBonus = (value: number, external?: boolean) => ({
    targetTrackId: "A",
    id: `db-${value}-${external ? "x" : "a"}`,
    stat: { modifier: "dmgBonus", skillTypes: "basicAttack" },
    value,
    sourceId: "A",
    ...(external ? { external: true } : {}),
  });

  it("external -70% stacks multiplicatively with a +50% regular dmgBonus (not additively)", () => {
    const plus50 = damageWith([dmgBonus(50)]); // ×1.5
    const withExternal = damageWith([dmgBonus(50), dmgBonus(-70, true)]); // ×1.5 × 0.30
    // External: ×0.30 of the +50% baseline. Additive bug would give (1+0.5-0.7)=0.8 → ratio ≈0.533.
    expect(withExternal / plus50).toBeCloseTo(0.3, 2);
  });
});