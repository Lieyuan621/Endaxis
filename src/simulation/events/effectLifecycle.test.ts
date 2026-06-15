import { describe, expect, it } from "vitest";
import { createDefaultStats } from "@/simulation/defaultActorStats";
import { compileScenario } from "@/simulation/compiler/compileScenario";
import { simulate } from "@/simulation/simulator";
import { TriggerRegistry } from "@/simulation/engine/TriggerRegistry";
import type { Action, ScenarioData, ScenarioTrack } from "@/simulation/compiler/types";
import type { BaseStatValues } from "@/data/stats/types";

type TrackPatch = Omit<Partial<ScenarioTrack>, "stats"> & {
  stats?: Partial<ScenarioTrack["stats"]>;
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

function runScenario(tracks: ScenarioTrack[], triggerRegistry?: TriggerRegistry) {
  const scenario: ScenarioData = { tracks, connections: [] };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  const baseStatsByTrack = new Map<string, BaseStatValues>(
    actors.map((actor) => [actor.id, BASE_STATS]),
  );
  return simulate(timeline, teamConfig, enemyConfig, actors, triggerRegistry, undefined, {
    baseStatsByTrack,
    enemyDef: 100,
  });
}

describe("effect lifecycle runtime", () => {
  it("fires onStatusExpire for operator statuses with the apply skill context", () => {
    const triggerRegistry = new TriggerRegistry([
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: {
            kind: "onStatusExpire",
            status: "self-buff",
            target: "self",
            skillId: "alpha_skill",
          },
          effects: [
            {
              id: "expire_gain",
              kind: "ultEnergyGain",
              value: 5,
            },
          ],
        },
      },
    ]);
    const result = runScenario(
      [
        createTrack("alpha", [
          createAction("alpha_skill", "battleSkill", {
            hits: [
              {
                offset: 0,
                multiplier: 100,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    id: "self-buff",
                    kind: "status",
                    stat: { modifier: "atkPercent" },
                    target: "self",
                    value: 10,
                    duration: 2,
                  },
                ],
              },
            ],
          }),
        ]),
      ],
      triggerRegistry,
    );

    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "OPERATOR_EFFECT_APPLY",
          id: "self-buff",
          targetTrackId: "alpha",
          time: 0,
        }),
        expect.objectContaining({
          type: "OPERATOR_EFFECT_EXPIRE",
          id: "self-buff",
          targetTrackId: "alpha",
          time: 2,
          sourceSkillId: "alpha_skill",
        }),
      ]),
    );
    expect(result.simLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ULT_ENERGY_CHANGE",
          time: 2,
          payload: expect.objectContaining({
            actorId: "alpha",
            change: 5,
            sourceId: "expire_gain",
          }),
        }),
      ]),
    );
  });

  it("fires onStatusConsumed for enemy statuses with the consuming skill context", () => {
    const triggerRegistry = new TriggerRegistry([
      {
        sourceTrackId: "alpha",
        triggerEffect: {
          trigger: {
            kind: "onStatusConsumed",
            status: "enemy-mark",
            target: "enemy",
            skillTypes: "battleSkill",
            skillId: "alpha_skill",
          },
          effects: [
            {
              id: "consumed_gain",
              kind: "ultEnergyGain",
              value: 7,
            },
          ],
        },
      },
    ]);
    const result = runScenario(
      [
        createTrack("alpha", [
          createAction("alpha_basic", "basicAttack", {
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
                    id: "enemy-mark",
                    kind: "status",
                    stat: { modifier: "increasedDmgTaken" },
                    target: "enemy",
                    value: 10,
                    duration: 100,
                  },
                ],
              },
            ],
          }),
          createAction("alpha_skill", "battleSkill", {
            startTime: 1,
            hits: [
              {
                offset: 0,
                multiplier: 100,
                spRecovery: 0,
                spReturn: 0,
                stagger: 0,
                effects: [
                  {
                    id: "consume-vulnerability",
                    kind: "consume",
                    enemyStatus: "enemy-mark",
                  },
                ],
              },
            ],
          }),
        ]),
      ],
      triggerRegistry,
    );

    expect(result.enemyLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ENEMY_STATUS_APPLY",
          id: "enemy-mark",
          time: 0,
        }),
        expect.objectContaining({
          type: "ENEMY_EFFECT_EXPIRE",
          kind: "status",
          id: "enemy-mark",
          consumed: true,
          sourceSkillType: "battleSkill",
          sourceSkillId: "alpha_skill",
        }),
      ]),
    );
    expect(result.simLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ULT_ENERGY_CHANGE",
          time: 1,
          payload: expect.objectContaining({
            actorId: "alpha",
            change: 7,
            sourceId: "consumed_gain",
          }),
        }),
      ]),
    );
  });
});
