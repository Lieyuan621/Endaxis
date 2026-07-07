import { describe, expect, it } from "vitest";
import { compileScenario } from "./compiler/compileScenario";
import type { Action, ScenarioData, ScenarioTrack } from "./compiler/types";
import { simulate } from "./simulator";
import { TriggerRegistry } from "./engine/TriggerRegistry";
import { compileEndaxisScenario } from "./adapters/compileEndaxisScenario";
import { createDefaultStats } from "@/simulation/defaultActorStats";
import { collectTriggerEffects, patchCombatSkills } from "@/data/collect";
import estellaSheet from "@/data/operators/estella";
import daPanSheet from "@/data/operators/da-pan";
import snowshineSheet from "@/data/operators/snowshine";
import { extractRawEntries, resolveHitsFromSheet } from "@/stores/timeline/resolveHits";
import type { BaseStatValues } from "@/data/stats/types";
import type { Effect, TriggerEffect } from "@/data/types";
import type { GearInstance, OperatorInstance, TeamInstance, WeaponInstance } from "@/types";
import type { EnemyResistance } from "@/data/enemyResistance";

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

function createAction(id: string, type: Action["type"], patch: Partial<Action> = {}): Action {
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

function createTrack(id: string, actions: Action[], patch: TrackPatch = {}): ScenarioTrack {
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

function createRegistry(entries: TrackPatch["triggerEffects"]) {
  return new TriggerRegistry(entries ?? []);
}

function runScenario(
  tracks: ScenarioTrack[],
  triggerRegistry?: TriggerRegistry,
  options: {
    enemyDef?: number;
    enemyResistance?: EnemyResistance;
    lmdiAttributionMode?: "stacks" | "applier";
  } = {},
) {
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
  const baseStatsByTrack = new Map<string, BaseStatValues>(
    actors.map((actor) => [actor.id, BASE_STATS]),
  );
  return simulate(timeline, teamConfig, enemyConfig, actors, triggerRegistry, undefined, {
    baseStatsByTrack,
    enemyDef: options.enemyDef ?? 100,
    enemyResistance: options.enemyResistance,
    lmdiAttributionMode: options.lmdiAttributionMode,
  });
}

function runEndaxisScenario(
  tracks: ScenarioTrack[],
  options: {
    characterRoster?: any[];
    activeEnemyId?: string | null;
    lmdiAttributionMode?: "stacks" | "applier";
  } = {},
) {
  const compiled = compileEndaxisScenario({
    scenarioData: createScenario(tracks),
    tracks,
    characterRoster: options.characterRoster ?? [],
    systemConstants: {},
    activeEnemyId: options.activeEnemyId,
    lmdiAttributionMode: options.lmdiAttributionMode,
  });
  if (!compiled) throw new Error("Failed to compile Endaxis scenario");
  return simulate(
    compiled.timeline,
    compiled.teamConfig,
    compiled.enemyConfig,
    compiled.actors,
    compiled.triggerRegistry,
    compiled.consumedStacksWriteKeys,
    {
      initialEffects: compiled.initialEffects,
      baseStatsByTrack: compiled.baseStatsByTrack,
      enemyDef: compiled.enemyDef,
      endlineTime: compiled.endlineTime,
      lmdiAttributionMode: compiled.lmdiAttributionMode,
    },
  );
}

function resolveEstellaSheetHits(
  skillKey: string,
  segmentIndex = 0,
): ReturnType<typeof resolveHitsFromSheet> {
  const flatSkills = patchCombatSkills(estellaSheet, { talentStates: {}, potential: 0 });
  const segment = flatSkills[skillKey]?.segments?.[segmentIndex];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, 0, { preserveCondition: true });
}

function resolveOperatorSheetHits(
  sheet: any,
  skillKey: string,
  levelIndex = 0,
  segmentIndex = 0,
  patch = { talentStates: {}, potential: 0 },
): ReturnType<typeof resolveHitsFromSheet> {
  const flatSkills = patchCombatSkills(sheet, patch);
  const skill = flatSkills[skillKey];
  const segment = skill?.segments?.[segmentIndex];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true });
}

function createOperatorInstance(
  operatorSlug: string,
  patch: Partial<OperatorInstance> = {},
): OperatorInstance {
  return {
    id: `op_${operatorSlug}`,
    operatorSlug,
    level: 60,
    promoted: true,
    potential: 0,
    skillLevels: {
      basicAttack: 1,
      battleSkill: 1,
      comboSkill: 1,
      ultimate: 1,
    },
    talentStates: {},
    trustLevel: 0,
    ...patch,
  };
}

function createWeaponInstance(
  weaponSlug: string,
  patch: Partial<WeaponInstance> = {},
): WeaponInstance {
  return {
    id: `wp_${weaponSlug}`,
    weaponSlug,
    level: 60,
    tuned: true,
    potential: 0,
    skill1Level: 1,
    skill2Level: 1,
    skill3Level: 1,
    ...patch,
  };
}

function createTeam(
  operatorId: string,
  weaponId: string | null = null,
  gear: TeamInstance["slots"][number]["gear"] = {
    armor: null,
    gloves: null,
    kit1: null,
    kit2: null,
  },
): TeamInstance {
  return {
    id: "team",
    name: "Golden team",
    slots: [
      { operatorId, weaponId, gear },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
    ],
  };
}

function mapTriggerEntriesToTracks(entries: Array<any>, tracks: ScenarioTrack[]) {
  return entries.map((entry) => ({
    ...entry,
    sourceTrackId: tracks[entry.sourceSlotIndex]?.id ?? entry.sourceOperatorSlug,
  }));
}

function collectRuntimeTriggers(
  team: TeamInstance,
  operators: OperatorInstance[],
  weapons: WeaponInstance[] = [],
  gear: GearInstance[] = [],
  tracks: ScenarioTrack[],
) {
  return mapTriggerEntriesToTracks(
    collectTriggerEffects(team, operators, weapons, gear, new Map()),
    tracks,
  );
}

function damageHits(result: ReturnType<typeof runScenario>) {
  return result.simLog
    .filter((entry) => entry.type === "DAMAGE_HIT")
    .map((entry) => entry.payload.hitData)
    .filter((hit) => typeof hit._expectedDamage === "number");
}

function damageByAction(result: ReturnType<typeof runScenario>, actionId: string) {
  const entry = result.simLog.find(
    (item) => item.type === "DAMAGE_HIT" && item.payload.actionId === actionId,
  );
  if (!entry || entry.type !== "DAMAGE_HIT") {
    throw new Error(`Missing DAMAGE_HIT for ${actionId}`);
  }
  return entry.payload.hitData;
}

function totalDamage(result: ReturnType<typeof runScenario>) {
  return damageHits(result).reduce((sum, hit) => sum + Number(hit._expectedDamage), 0);
}

describe("optimizer damage golden baselines", () => {
  it("locks real Estella sheet battle-skill hit damage and damage type", () => {
    const result = runScenario([
      createTrack("alpha", [
        createAction("estella_battle", "battleSkill", {
          element: "cryo",
          hits: resolveEstellaSheetHits("battleSkill"),
        }),
      ]),
    ]);
    const hits = damageHits(result);
    const firstHit = hits[0]!;

    expect(hits.map((hit) => hit._expectedDamage)).toEqual([1359]);
    expect(totalDamage(result)).toBe(1359);
    expect(firstHit._damageBreakdown).toMatchObject({
      attack: 1700,
      multiplier: 156,
      skillType: "battleSkill",
      element: "cryo",
      base: 2652,
      defMult: 0.5,
      resMult: 1,
      nonCritDamage: 1326,
      critDamage: 1989,
      expectedDamage: 1359,
    });
    expect(firstHit._lmdiSelf).toBe(1359);
    expect(firstHit._lmdiExternal).toEqual({});
  });

  it("locks Rodin enemy sheet mapping and enemy DEF impact on hit damage", () => {
    const compiledRodin = compileEndaxisScenario({
      scenarioData: createScenario([]),
      tracks: [],
      characterRoster: [],
      systemConstants: {},
      activeEnemyId: "eny_0051_rodin",
    });
    const tracks = [
      createTrack("alpha", [
        createAction("def_hit", "battleSkill", {
          element: "physical",
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const def100 = damageByAction(runScenario(tracks), "def_hit_inst");
    const def300 = damageByAction(runScenario(tracks, undefined, { enemyDef: 300 }), "def_hit_inst");

    expect(compiledRodin?.enemyConfig).toMatchObject({
      defense: 100,
      tier: "leader",
      maxStagger: 280,
      finisherMultiplier: 1.75,
    });
    expect(def100._damageBreakdown).toMatchObject({
      enemyDef: 100,
      defMult: 0.5,
      expectedDamage: 871,
    });
    expect(def300._damageBreakdown).toMatchObject({
      enemyDef: 300,
      defMult: 0.25,
      expectedDamage: 435,
    });
    expect(def300._expectedDamage).toBeLessThan(def100._expectedDamage!);
  });

  it("keeps neutral enemy resistance at the old damage result", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("neutral_res_hit", "battleSkill", {
          element: "physical",
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const hit = damageByAction(runScenario(tracks), "neutral_res_hit_inst");

    expect(hit._expectedDamage).toBe(871);
    expect(hit._damageBreakdown).toMatchObject({
      enemyResistance: 0,
      enemyResMult: 1,
      resMult: 1,
      expectedDamage: 871,
    });
  });

  it("reduces matching-element damage when enemy resistance multiplier is lower", () => {
    const tracks = [
      createTrack("alpha", [
        createAction("physical_res_hit", "battleSkill", {
          element: "physical",
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const neutral = damageByAction(runScenario(tracks), "physical_res_hit_inst");
    const resisted = damageByAction(
      runScenario(tracks, undefined, {
        enemyResistance: {
          physical: 20,
          heat: 0,
          cryo: 0,
          electric: 0,
          nature: 0,
        },
      }),
      "physical_res_hit_inst",
    );

    expect(resisted._expectedDamage).toBe(696);
    expect(resisted._expectedDamage).toBeLessThan(neutral._expectedDamage!);
    expect(resisted._damageBreakdown).toMatchObject({
      element: "physical",
      enemyResistance: 0.2,
      enemyResMult: 0.8,
      resMult: 0.8,
      expectedDamage: 696,
    });
  });

  it("stacks resistance ignore and shred with enemy resistance as separate multipliers", () => {
    const result = runScenario(
      [
        createTrack("alpha", [
          createAction("setup_res_mods", "battleSkill", {
            startTime: 0,
            hits: [
              {
                offset: 0,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    id: "self-res-ignore",
                    kind: "status",
                    stat: { modifier: "resistanceIgnore", elements: "physical" },
                    target: "self",
                    value: 10,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-res-shred",
                    kind: "status",
                    stat: { modifier: "resistanceShred" },
                    target: "enemy",
                    value: 15,
                    duration: 10,
                  } as Effect,
                ],
              },
            ],
          }),
          createAction("res_stack_hit", "battleSkill", {
            startTime: 1,
            element: "physical",
            hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
          }),
        ]),
      ],
      undefined,
      {
        enemyResistance: {
          physical: 20,
          heat: 0,
          cryo: 0,
          electric: 0,
          nature: 0,
        },
      },
    );
    const hit = damageByAction(result, "res_stack_hit_inst");

    expect(hit._expectedDamage).toBe(914);
    expect(hit._damageBreakdown).toMatchObject({
      enemyResistance: 0.2,
      resistanceIgnore: 0.1,
      resistanceShred: 0.15,
      resMult: 1.05,
      enemyResMult: 1.05,
      expectedDamage: 914,
    });
  });

  it("locks arts infliction consumption, reaction damage, and reaction attribution", () => {
    const result = runScenario([
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
    ]);
    const hits = damageHits(result);
    const reactionHit = hits.find(
      (hit) => hit._reactionMeta?.reactionType === "electrification",
    );

    expect(hits.map((hit) => hit._expectedDamage)).toEqual([871, 871, 2720]);
    expect(totalDamage(result)).toBe(4462);
    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "INFLICTION_APPLY", element: "heat", stacks: 2, sourceId: "alpha" }),
        expect.objectContaining({ type: "INFLICTION_CONSUMED", element: "heat", consumedStacks: 2 }),
        expect.objectContaining({ type: "REACTION_TRIGGER", reactionType: "electrification", level: 2, sourceId: "beta" }),
      ]),
    );
    expect(reactionHit?._reactionMeta?.consumedStackSources).toEqual({ alpha: 2 });
    expect(reactionHit?._damageBreakdown).toMatchObject({
      isReaction: true,
      reactionType: "electrification",
      element: "electric",
      multiplier: 240,
      levelCoefficient: 1.3010204081632653,
      expectedDamage: 2720,
    });
    expect(reactionHit?._lmdiSelf).toBe(2720);
    expect(reactionHit?._lmdiExternal).toEqual({});
  });

  it("locks physical vulnerability consumption and physical reaction damage", () => {
    const result = runScenario([
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
    ]);
    const hits = damageHits(result);
    const breachHit = hits.find((hit) => hit._reactionMeta?.reactionType === "breach");

    expect(hits.map((hit) => hit._expectedDamage)).toEqual([871, 871, 1202, 871, 1502]);
    expect(totalDamage(result)).toBe(5317);
    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 1, trigger: "lift" }),
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 2, trigger: "knockdown" }),
        expect.objectContaining({ type: "VULNERABILITY_CONSUMED", consumedStacks: 2, consumedBy: "breach" }),
        expect.objectContaining({ type: "DEBUFF_APPLY", debuffType: "breach", level: 2 }),
      ]),
    );
    expect(breachHit?._reactionMeta?.consumedStackSources).toEqual({ alpha: 2 });
    expect(breachHit?._damageBreakdown).toMatchObject({
      isReaction: true,
      reactionType: "breach",
      element: "physical",
      multiplier: 150,
      levelCoefficient: 1.1505102040816326,
      expectedDamage: 1502,
    });
    expect(breachHit?._lmdiSelf).toBe(1502);
    expect(breachHit?._lmdiExternal).toEqual({});
  });

  it("locks weapon-triggered damage delta and cross-source LMDI attribution", () => {
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
    } as Effect;
    const triggerEffects = [
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: { kind: "onSpRecovery", skillTypes: ["battleSkill", "comboSkill", "ultimate"] },
          effects: [thermiteEffect],
        },
      },
    ] satisfies TrackPatch["triggerEffects"];
    const buffed = runScenario(
      [
        createTrack(
          "alpha",
          [
            createAction("recover", "battleSkill", {
              startTime: 0,
              hits: [{ offset: 0, spRecovery: 10, spReturn: 0, stagger: 0 }],
            }),
          ],
          { triggerEffects },
        ),
        createTrack("beta", [
          createAction("beta_hit", "battleSkill", {
            startTime: 1,
            hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
          }),
        ]),
      ],
      createRegistry(triggerEffects),
    );
    const baseline = runScenario([
      createTrack("alpha", []),
      createTrack("beta", [
        createAction("beta_hit", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);
    const buffedHit = damageByAction(buffed, "beta_hit_inst");
    const baselineHit = damageByAction(baseline, "beta_hit_inst");

    expect(baselineHit._expectedDamage).toBe(871);
    expect(buffedHit._expectedDamage).toBe(993);
    expect(buffedHit._damageBreakdown).toMatchObject({
      attack: 1938,
      expectedDamage: 993,
      element: "physical",
    });
    expect(buffed.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetTrackId: "beta",
          id: "thermite-cutter-skill3",
          sourceId: "alpha",
          effect: expect.objectContaining({ sourceGroup: "weapon", target: "team" }),
        }),
      ]),
    );

    const externalDebuff = runScenario([
      createTrack("alpha", [
        createAction("debuff", "battleSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              multiplier: 100,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: "alpha-dmg-taken",
                  kind: "status",
                  stat: { modifier: "increasedDmgTaken", elements: ["physical"] },
                  target: "enemy",
                  value: 20,
                  duration: 10,
                } as Effect,
              ],
            },
          ],
        }),
      ]),
      createTrack("beta", [
        createAction("beta_debuffed_hit", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);
    const attributedHit = damageByAction(externalDebuff, "beta_debuffed_hit_inst");

    expect(attributedHit._expectedDamage).toBe(1045);
    expect(attributedHit._damageBreakdown).toMatchObject({
      increasedDmgTaken: 0.2,
      dmgTakenMult: 1.2,
      expectedDamage: 1045,
    });
    expect(attributedHit._lmdiSelf).toBeCloseTo(870.8171733663617, 8);
    expect((attributedHit._lmdiExternal as Record<string, number>).alpha).toBeCloseTo(
      174.18282663363829,
      8,
    );
  });

  it("locks standard modifier order across damage, crit, amp, enemy, resistance, and rounding", () => {
    const result = runScenario(
      [
        createTrack("alpha", [
          createAction("setup_mods", "battleSkill", {
            startTime: 0,
            hits: [
              {
                offset: 0,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    id: "self-dmg-bonus",
                    kind: "status",
                    stat: { modifier: "dmgBonus", elements: "physical" },
                    target: "self",
                    value: 20,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-amp-bonus",
                    kind: "status",
                    stat: { modifier: "ampBonus", elements: "physical" },
                    target: "self",
                    value: 30,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-direct",
                    kind: "status",
                    stat: { modifier: "directMultiplier", skillTypes: "battleSkill" },
                    target: "self",
                    value: 1.5,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-crit-rate",
                    kind: "status",
                    stat: { modifier: "critRate" },
                    target: "self",
                    value: 50,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-crit-dmg",
                    kind: "status",
                    stat: { modifier: "critDmg" },
                    target: "self",
                    value: 100,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-res-ignore",
                    kind: "status",
                    stat: { modifier: "resistanceIgnore", elements: "physical" },
                    target: "self",
                    value: 10,
                    duration: 10,
                  } as Effect,
                  {
                    id: "self-susc-amp",
                    kind: "status",
                    stat: { modifier: "susceptibilityAmplify", elements: "physical" },
                    target: "self",
                    value: 50,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-susc",
                    kind: "status",
                    stat: { modifier: "susceptibility" },
                    target: "enemy",
                    value: 20,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-physical-susc",
                    kind: "status",
                    stat: { modifier: "susceptibility", elements: "physical" },
                    target: "enemy",
                    value: 10,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-taken",
                    kind: "status",
                    stat: { modifier: "increasedDmgTaken" },
                    target: "enemy",
                    value: 25,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-physical-taken",
                    kind: "status",
                    stat: { modifier: "increasedDmgTaken", elements: "physical" },
                    target: "enemy",
                    value: 5,
                    duration: 10,
                  } as Effect,
                  {
                    id: "enemy-res-shred",
                    kind: "status",
                    stat: { modifier: "resistanceShred" },
                    target: "enemy",
                    value: 15,
                    duration: 10,
                  } as Effect,
                ],
              },
            ],
          }),
          createAction("formula_hit", "battleSkill", {
            startTime: 1,
            element: "physical",
            hits: [{ offset: 0, multiplier: 120, spRecovery: 0, spReturn: 0, stagger: 0 }],
          }),
        ]),
      ],
      undefined,
      { enemyDef: 200 },
    );
    const hit = damageByAction(result, "formula_hit_inst");

    expect(hit._expectedDamage).toBe(6842);
    expect(hit._damageBreakdown).toMatchObject({
      attack: 1700,
      multiplier: 120,
      base: 2040,
      dmgBonus: 0.2,
      dmgBonusMult: 1.2,
      critRate: 0.55,
      critDmg: 1.5,
      critMult: 1.8250000000000002,
      ampBonus: 0.3,
      ampMult: 1.3,
      directMultiplier: 1.5,
      susceptibility: 0.45000000000000007,
      susceptMult: 1.4500000000000002,
      increasedDmgTaken: 0.3,
      dmgTakenMult: 1.3,
      enemyDef: 200,
      defMult: 0.3333333333333333,
      resistanceIgnore: 0.1,
      resistanceShred: 0.15,
      resMult: 1.25,
      nonCritDamage: 3749,
      critDamage: 9373,
      expectedDamage: 6842,
    });
  });

  it("locks one-time consumed stat effects onto the consuming hit", () => {
    const result = runScenario([
      createTrack("alpha", [
        createAction("prime_onetime", "battleSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: "next-battle-dmg",
                  kind: "oneTime",
                  stat: { modifier: "dmgBonus" },
                  target: "self",
                  value: 80,
                  skillTypes: "battleSkill",
                } as Effect,
              ],
            },
          ],
        }),
        createAction("consume_onetime", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);
    const hit = damageByAction(result, "consume_onetime_inst");

    expect(hit.consumedStatEffects).toEqual([
      expect.objectContaining({
        id: "next-battle-dmg",
        stat: { modifier: "dmgBonus" },
        value: 80,
      }),
    ]);
    expect(hit._damageBreakdown).toMatchObject({
      dmgBonus: 0.8,
      dmgBonusMult: 1.8,
      nonCritDamage: 1530,
      critDamage: 2295,
      expectedDamage: 1568,
    });
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "OPERATOR_EFFECT_EXPIRE",
          targetTrackId: "alpha",
          id: "next-battle-dmg",
          consumed: true,
        }),
      ]),
    );
  });

  it("locks consumed link stacks as a battle-skill damage multiplier", () => {
    const result = runScenario([
      createTrack("alpha", [
        createAction("apply_link", "battleSkill", {
          startTime: 0,
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: "team-link-stack",
                  kind: "status",
                  stat: { modifier: "link" },
                  target: "team",
                  value: 1,
                  duration: 10,
                } as Effect,
              ],
            },
          ],
        }),
      ]),
      createTrack("beta", [
        createAction("linked_hit", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ]);
    const hit = damageByAction(result, "linked_hit_inst");

    expect(hit.consumedStacks).toEqual({ link: 1 });
    expect(hit._damageBreakdown).toMatchObject({
      linkStacks: 1,
      linkMult: 1.3,
      nonCritDamage: 1105,
      critDamage: 1657,
      expectedDamage: 1132,
    });
    expect(result.simLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "LINK_CONSUMED",
          payload: expect.objectContaining({
            actionId: "linked_hit_inst",
            actorId: "beta",
            stacks: 1,
          }),
        }),
      ]),
    );
  });

  it("locks real Snowshine sheet cryo hit, heat infliction consumption, and solidification damage", () => {
    const snowshineHits = resolveOperatorSheetHits(snowshineSheet, "battleSkill");
    const result = runEndaxisScenario([
      createTrack("alpha", [
        createAction("prime_heat", "battleSkill", {
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
        createAction("snowshine_battle", "battleSkill", {
          startTime: 1,
          skillId: "battleSkill",
          element: "cryo",
          hits: snowshineHits,
        }),
      ]),
    ]);
    const hits = damageHits(result);
    const reactionHit = hits.find((hit) => hit._reactionMeta?.reactionType === "solidification");

    expect(hits.map((hit) => hit._expectedDamage)).toEqual([871, 1742, 2720]);
    expect(totalDamage(result)).toBe(5333);
    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "INFLICTION_APPLY", element: "heat", stacks: 2, sourceId: "alpha" }),
        expect.objectContaining({ type: "INFLICTION_CONSUMED", element: "heat", consumedStacks: 2 }),
        expect.objectContaining({ type: "REACTION_TRIGGER", reactionType: "solidification", level: 2, sourceId: "alpha" }),
      ]),
    );
    expect(hits[1]?._damageBreakdown).toMatchObject({
      attack: 1700,
      multiplier: 200,
      skillType: "battleSkill",
      element: "cryo",
      expectedDamage: 1742,
    });
    expect(reactionHit?._reactionMeta?.consumedStackSources).toEqual({ alpha: 2 });
    expect(reactionHit?._damageBreakdown).toMatchObject({
      isReaction: true,
      reactionType: "solidification",
      element: "cryo",
      multiplier: 240,
      levelCoefficient: 1.3010204081632653,
      expectedDamage: 2720,
    });
    expect(reactionHit?._lmdiSelf).toBe(2720);
    expect(reactionHit?._lmdiExternal).toEqual({});
  });

  it("locks real Da Pan sheet physical status chain and crush consumed-stack damage", () => {
    const daPanBattleHits = resolveOperatorSheetHits(daPanSheet, "battleSkill");
    const daPanComboHits = resolveOperatorSheetHits(daPanSheet, "comboSkill");
    const daPanUltimateHits = resolveOperatorSheetHits(daPanSheet, "ultimate");
    const result = runEndaxisScenario([
      createTrack("alpha", [
        createAction("da_pan_real_lift", "battleSkill", {
          startTime: 0,
          skillId: "battleSkill",
          element: "physical",
          hits: daPanBattleHits,
        }),
        createAction("da_pan_real_knockdown", "ultimate", {
          startTime: 2,
          skillId: "ultimate",
          element: "physical",
          hits: daPanUltimateHits,
        }),
        createAction("da_pan_real_crush", "comboSkill", {
          startTime: 6,
          skillId: "comboSkill",
          element: "physical",
          hits: daPanComboHits,
        }),
      ]),
    ]);
    const hits = damageHits(result);
    const crushHit = hits.find((hit) => hit._reactionMeta?.reactionType === "crush");

    expect(hits.map((hit) => hit._expectedDamage)).toEqual([
      1158,
      191,
      1202,
      191,
      191,
      191,
      191,
      191,
      1550,
      1202,
      2517,
      6615,
    ]);
    expect(totalDamage(result)).toBe(15390);
    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 1, trigger: "lift" }),
        expect.objectContaining({ type: "VULNERABILITY_CHANGE", stacks: 3, trigger: "knockdown" }),
        expect.objectContaining({ type: "VULNERABILITY_CONSUMED", consumedStacks: 3, consumedBy: "crush" }),
      ]),
    );
    expect(hits[0]?._damageBreakdown).toMatchObject({
      multiplier: 133,
      skillType: "battleSkill",
      element: "physical",
      expectedDamage: 1158,
    });
    expect(crushHit?._reactionMeta?.consumedStackSources).toEqual({ alpha: 3 });
    expect(crushHit?._damageBreakdown).toMatchObject({
      isReaction: true,
      reactionType: "crush",
      element: "physical",
      multiplier: 600,
      levelCoefficient: 1.1505102040816326,
      effectivenessMult: 1.1,
      expectedDamage: 6615,
    });
    expect(crushHit?._lmdiSelf).toBe(6615);
    expect(crushHit?._lmdiExternal).toEqual({});
  });

  it("locks real Thermite Cutter weapon trigger buff through Endaxis compile", () => {
    const weaponOperator = createOperatorInstance("estella");
    const weapon = createWeaponInstance("thermite-cutter", {
      skill1Level: 9,
      skill2Level: 9,
      skill3Level: 9,
    });
    const weaponTracks = [
      createTrack("alpha", [
        createAction("recover", "battleSkill", {
          startTime: 0,
          hits: [{ offset: 0, spRecovery: 10, spReturn: 0, stagger: 0 }],
        }),
      ]),
      createTrack("beta", [
        createAction("weapon_buffed_hit", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const weaponTeam = createTeam(weaponOperator.id, weapon.id);
    const weaponTriggers = collectRuntimeTriggers(weaponTeam, [weaponOperator], [weapon], [], weaponTracks);
    weaponTracks[0]!.triggerEffects = weaponTriggers;
    const result = runEndaxisScenario(weaponTracks);
    const hit = damageByAction(result, "weapon_buffed_hit_inst");

    expect(hit._expectedDamage).toBe(993);
    expect(hit._damageBreakdown).toMatchObject({
      attack: 1938,
      multiplier: 100,
      skillType: "battleSkill",
      element: "physical",
      expectedDamage: 993,
    });
    expect(hit._lmdiSelf).toBe(993);
    expect(hit._lmdiExternal).toEqual({});
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetTrackId: "beta",
          id: "thermite-cutter-skill3",
          sourceId: "alpha",
          effect: expect.objectContaining({ sourceGroup: "weapon", target: "team" }),
        }),
      ]),
    );
  });

  it("locks real Frontiers gear-set trigger buff and external LMDI attribution", () => {
    const operator = createOperatorInstance("estella");
    const gear: GearInstance[] = [
      { id: "gear_0", gearPieceId: "item_equip_t4_suit_atb01_body_01", artificingLevels: [] },
      { id: "gear_1", gearPieceId: "item_equip_t4_suit_atb01_hand_01", artificingLevels: [] },
      { id: "gear_2", gearPieceId: "item_equip_t4_suit_atb01_edc_01", artificingLevels: [] },
    ];
    const gearTracks = [
      createTrack("alpha", [
        createAction("gear_recover", "battleSkill", {
          startTime: 0,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 10, spReturn: 0, stagger: 0 }],
        }),
      ]),
      createTrack("beta", [
        createAction("gear_buffed_hit", "battleSkill", {
          startTime: 1,
          hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
        }),
      ]),
    ];
    const gearTeam = createTeam(operator.id, null, {
      armor: "gear_0",
      gloves: "gear_1",
      kit1: "gear_2",
      kit2: null,
    });
    const gearTriggers = collectRuntimeTriggers(gearTeam, [operator], [], gear, gearTracks);
    gearTracks[0]!.triggerEffects = gearTriggers;
    const result = runEndaxisScenario(gearTracks);
    const setupHit = damageByAction(result, "gear_recover_inst");
    const buffedHit = damageByAction(result, "gear_buffed_hit_inst");

    expect(damageHits(result).map((hit) => hit._expectedDamage)).toEqual([871, 1010]);
    expect(totalDamage(result)).toBe(1881);
    expect(setupHit._damageBreakdown).toMatchObject({
      dmgBonus: 0,
      expectedDamage: 871,
    });
    expect(buffedHit._damageBreakdown).toMatchObject({
      multiplier: 100,
      skillType: "battleSkill",
      element: "physical",
      dmgBonus: 0.16,
      dmgBonusMult: 1.16,
      expectedDamage: 1010,
    });
    expect(buffedHit._lmdiSelf).toBeCloseTo(870.6654429866906, 8);
    expect((buffedHit._lmdiExternal as Record<string, number>).alpha).toBeCloseTo(
      139.3345570133094,
      8,
    );
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetTrackId: "beta",
          sourceId: "alpha",
          effect: expect.objectContaining({ sourceGroup: "gearSet", target: "team" }),
        }),
      ]),
    );
  });
});
