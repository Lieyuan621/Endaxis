import { describe, it, expect } from "vitest";
import { compileTimeline } from "./compileTimeline";
import type { Action, ActionNode, CompiledEffect } from "./types";

function createAction(action: Partial<Action>): Action {
  return {
    instanceId: action.instanceId || "",
    id: action.id || "",
    skillId: action.skillId || action.id || "mock_skill",
    type: "battleSkill",
    name: "mock_skill",
    logicalStartTime: 0,
    element: "physical",
    enhancementTime: 0,
    startTime: 0,
    cooldown: 0,
    spCost: 0,
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    duration: 0,
    triggerWindow: 0,
    animationTime: 0,
    hits: [],
    ...action,
  };
}

function createEffect(effect: Partial<CompiledEffect>): CompiledEffect {
  return {
    _id: effect._id || "",
    kind: "status",
    id: effect.id || effect._id || "buff",
    name: effect.name || effect.id || "buff",
    duration: 0,
    stacks: 1,
    ...effect,
  } as CompiledEffect;
}

describe("compileTimeline", () => {
  const createMockAction = (
    id: string,
    startTime: number,
    duration: number,
    options: Partial<Action> = {},
  ): ActionNode => ({
    id,
    type: "action",
    trackId: "",
    trackIndex: 0,
    node: createAction({
      startTime,
      duration,
      type: options.type || "battleSkill",
      animationTime: options.animationTime,
      triggerWindow: options.triggerWindow,
      ...options,
    }),
  });

  it("maps actions without freeze shifts", () => {
    const actions = [createMockAction("A", 0, 5), createMockAction("B", 6, 2)];

    const result = compileTimeline(actions);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]?.realStartTime).toBe(0);
    expect(result.actions[1]?.realStartTime).toBe(6);
  });

  describe("freeze calculations", () => {
    it("delays actions that start during a freeze", () => {
      const ult = createMockAction("ULT", 2, 5, {
        type: "ultimate",
        animationTime: 2,
      });
      const skill = createMockAction("SKILL", 3, 1, { type: "battleSkill" });

      const result = compileTimeline([ult, skill]);

      const resolvedUlt = result.actions.find((a) => a.id === "ULT")!;
      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(resolvedUlt.realStartTime).toBe(2);
      expect(resolvedUlt.realDuration).toBe(5);

      expect(resolvedSkill.realStartTime).toBe(4);
      expect(resolvedSkill.realDuration).toBe(1);
    });

    it("extends actions that overlap later freezes", () => {
      const ult = createMockAction("ULT", 2, 3, {
        type: "ultimate",
        animationTime: 1.5,
      });
      const skill = createMockAction("SKILL", 0, 2.2, { type: "battleSkill" });
      const link = createMockAction("LINK", 3.5, 1.2, { type: "comboSkill" });

      const result = compileTimeline([ult, skill, link]);

      const resolvedUlt = result.actions.find((a) => a.id === "ULT")!;
      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;
      const resolvedLink = result.actions.find((a) => a.id === "LINK")!;

      expect(resolvedUlt.realStartTime).toBe(2);
      expect(resolvedUlt.realDuration).toBe(3.5);

      expect(resolvedLink.realStartTime).toBe(3.5);
      expect(resolvedLink.realDuration).toBe(1.2);

      expect(resolvedSkill.realStartTime).toBe(0);
      expect(resolvedSkill.realDuration).toBe(4.2);
    });

    it("ignores disabled freeze sources", () => {
      const ult = createMockAction("ULT", 2, 5, {
        type: "ultimate",
        animationTime: 2,
        isDisabled: true,
      });
      const skill = createMockAction("SKILL", 3, 1, { type: "battleSkill" });

      const result = compileTimeline([ult, skill]);

      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(result.actions.some((a) => a.id === "ULT")).toBe(true);
      expect(resolvedSkill.realStartTime).toBe(3);
      expect(resolvedSkill.realDuration).toBe(1);
    });

    it("ignores ghost actions with negative triggerWindow", () => {
      const ult = createMockAction("ULT", 2, 5, {
        type: "ultimate",
        animationTime: 2,
        triggerWindow: -1,
      });
      const skill = createMockAction("SKILL", 3, 1, { type: "battleSkill" });

      const result = compileTimeline([ult, skill]);

      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(resolvedSkill.realStartTime).toBe(3);
      expect(resolvedSkill.realDuration).toBe(1);
    });

    it("shortens link freeze when the next source starts early", () => {
      const link1 = createMockAction("LINK1", 0, 1.2, {
        type: "comboSkill",
      });
      const link2 = createMockAction("LINK2", 0.1, 1.2, {
        type: "comboSkill",
      });

      const result = compileTimeline([link1, link2]);

      const l1 = result.actions.find((a) => a.id === "LINK1")!;
      const l2 = result.actions.find((a) => a.id === "LINK2")!;

      expect(l1.realStartTime).toBe(0);
      expect(l1.realDuration).toBe(1.3);
      expect(l2.realStartTime).toBe(0.1);
      expect(l2.realDuration).toBe(1.2);
    });

    it("ultimate freeze duration is not shortened", () => {
      const ult1 = createMockAction("ULT1", 0, 1.5, {
        type: "ultimate",
        animationTime: 1.5,
      });
      const ult2 = createMockAction("ULT2", 1, 2.7, {
        type: "ultimate",
        animationTime: 2.7,
      });

      const result = compileTimeline([ult1, ult2]);

      const r1 = result.actions.find((a) => a.id === "ULT1")!;
      const r2 = result.actions.find((a) => a.id === "ULT2")!;

      expect(r1.realStartTime).toBe(0);
      expect(r1.realDuration).toBe(1.5);
      expect(r2.realStartTime).toBe(1.5);
      expect(r2.realDuration).toBe(2.7);
    });

    it("delays effect start times that begin during a freeze", () => {
      const ult = createMockAction("ULT", 2, 5, {
        type: "ultimate",
        animationTime: 2,
      });
      const skill = createMockAction("SKILL", 3, 1, {
        type: "battleSkill",
        hits: [
          {
            offset: 1,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [createEffect({ _id: "eff1", duration: 1 })],
          },
        ],
      });

      const result = compileTimeline([ult, skill]);

      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(resolvedSkill.effects).toHaveLength(1);
      expect(resolvedSkill.effects[0]?.realStartTime).toBe(5);
      expect(resolvedSkill.effects[0]?.realDuration).toBe(1);
      expect(resolvedSkill.effects[0]?.extensionAmount).toBe(0);
    });

    it("extends effect durations that overlap freezes", () => {
      const ult = createMockAction("ULT", 3, 5, {
        type: "ultimate",
        animationTime: 2,
      });
      const skill = createMockAction("SKILL", 1, 1, {
        type: "battleSkill",
        hits: [
          {
            offset: 1,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [createEffect({ _id: "eff1", duration: 2 })],
          },
        ],
      });

      const result = compileTimeline([ult, skill]);

      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(resolvedSkill.effects).toHaveLength(1);
      expect(resolvedSkill.effects[0]?.realStartTime).toBe(2);
      expect(resolvedSkill.effects[0]?.realDuration).toBe(4);
      expect(resolvedSkill.effects[0]?.extensionAmount).toBe(2);
    });

    it("shifts hit timings", () => {
      const ult = createMockAction("ULT", 2, 5, {
        type: "ultimate",
        animationTime: 2,
      });
      const skill = createMockAction("SKILL", 1, 2, {
        type: "battleSkill",
        hits: [
          {
            offset: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
          },
          {
            offset: 2,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
          },
        ],
      });

      const result = compileTimeline([ult, skill]);

      const resolvedSkill = result.actions.find((a) => a.id === "SKILL")!;

      expect(resolvedSkill.resolvedHits).toHaveLength(2);
      expect(resolvedSkill.resolvedHits[0]?.realOffset).toBe(0);
      expect(resolvedSkill.resolvedHits[0]?.realTime).toBe(1);
      expect(resolvedSkill.resolvedHits[1]?.realOffset).toBe(4);
      expect(resolvedSkill.resolvedHits[1]?.realTime).toBe(5);
    });
  });

  describe("action interruption", () => {
    it("cuts hits and effects when a later same-track action overlaps the active duration", () => {
      const first = createMockAction("FIRST", 0, 3, {
        hits: [
          {
            offset: 0.5,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
          },
          {
            offset: 2,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [createEffect({ _id: "late-effect", duration: 5 })],
          },
        ],
      });
      const second = createMockAction("SECOND", 1, 1);
      first.trackId = "operator-a";
      second.trackId = "operator-a";

      const result = compileTimeline([first, second]);
      const resolvedFirst = result.actions.find((a) => a.id === "FIRST")!;

      expect(resolvedFirst.isInterrupted).toBe(true);
      expect(resolvedFirst.interruptTime).toBe(1);
      expect(resolvedFirst.realDuration).toBe(1);
      expect(resolvedFirst.resolvedHits).toHaveLength(1);
      expect(resolvedFirst.resolvedHits[0]?.realTime).toBe(0.5);
      expect(resolvedFirst.effects).toHaveLength(0);
      expect(result.effectMap.has("late-effect")).toBe(false);
    });

    it("keeps delayed hits when the later same-track action starts after active duration", () => {
      const detachedLike = createMockAction("DETACHED_LIKE", 0, 1, {
        hits: [
          {
            offset: 2,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
          },
        ],
      });
      const later = createMockAction("LATER", 1.5, 1);
      detachedLike.trackId = "operator-a";
      later.trackId = "operator-a";

      const result = compileTimeline([detachedLike, later]);
      const resolved = result.actions.find((a) => a.id === "DETACHED_LIKE")!;

      expect(resolved.isInterrupted).toBe(false);
      expect(resolved.interruptTime).toBeUndefined();
      expect(resolved.realDuration).toBe(1);
      expect(resolved.resolvedHits).toHaveLength(1);
      expect(resolved.resolvedHits[0]?.realTime).toBe(2);
    });
  });

  it("resolves consumed effects", () => {
    const producer = createMockAction("PROD", 0, 10, {
      hits: [
        {
          offset: 0,
          spRecovery: 0,
          spReturn: 0,
          stagger: 0,
          effects: [createEffect({ _id: "eff1", duration: 10 })],
        },
      ],
    });
    const consumer = createMockAction("CONS", 5, 2);

    const connections = [
      {
        id: "c1",
        fromEffectId: "eff1",
        to: "CONS",
        from: "PROD",
        isConsumption: true,
        consumptionOffset: 0,
      },
    ];

    const result = compileTimeline([producer, consumer], connections);

    const rProd = result.actions.find((a) => a.id === "PROD")!;
    const effect = rProd.effects[0];

    expect(effect).toBeDefined();
    expect(effect?.isConsumed).toBe(true);
    expect(effect?.displayDuration).toBe(5);
  });
});
