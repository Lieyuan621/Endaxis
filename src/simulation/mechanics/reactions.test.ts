import { describe, it, expect } from "vitest";
import { ReactionRegistry } from "./reactions";
import { Effect, type EffectTag } from "../effects/types";
import { EffectManager } from "@/simulation/state/EffectManager";

describe("ReactionRegistry", () => {
  it("无可反应的元素时返回null", () => {
    const effectManager = new EffectManager();
    const incomingEffect = new Effect({
      id: "NOTHING",
      tags: ["NOTHING" as EffectTag],
    });
    const result = ReactionRegistry.check(effectManager, incomingEffect);
    expect(result).toBeNull();
  });

  describe("法术", () => {
    it.each([
      "ELEMENT_HEAT",
      "ELEMENT_CRYO",
      "ELEMENT_ELECTRIC",
      "ELEMENT_NATURE",
    ])("无先手元素时触发附着 %s", (incoming) => {
      const effectManager = new EffectManager();

      const incomingEffect = new Effect({
        id: incoming,
        tags: [incoming as EffectTag],
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).toBeNull();
    });

    it.each([
      ["ELEMENT_HEAT", "ELEMENT_HEAT", "ELEMENT_HEAT_BURST"],
      ["ELEMENT_CRYO", "ELEMENT_CRYO", "ELEMENT_CRYO_BURST"],
      ["ELEMENT_ELECTRIC", "ELEMENT_ELECTRIC", "ELEMENT_ELECTRIC_BURST"],
      ["ELEMENT_NATURE", "ELEMENT_NATURE", "ELEMENT_NATURE_BURST"],
    ])(`同元素触发法术爆发 %s + %s -> %s`, (existing, incoming, expected) => {
      const effectManager = new EffectManager();

      effectManager.add(
        new Effect({
          id: existing,
          tags: [existing as EffectTag],
        }),
      );

      const incomingEffect = new Effect({
        id: incoming,
        tags: [incoming as EffectTag],
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).not.toBeNull();
      // 不消耗原有附着
      expect(result!.removeIds).toHaveLength(0);
      expect(result!.spawnEffects).toHaveLength(1);
      expect(result!.spawnEffects[0]?.tags).toContain(expected as EffectTag);
    });

    it.each([
      ["ELEMENT_CRYO", "ELEMENT_HEAT", "ELEMENT_COMBUSTION"],
      ["ELEMENT_ELECTRIC", "ELEMENT_HEAT", "ELEMENT_COMBUSTION"],
      ["ELEMENT_NATURE", "ELEMENT_HEAT", "ELEMENT_COMBUSTION"],

      ["ELEMENT_CRYO", "ELEMENT_ELECTRIC", "ELEMENT_ELECTRIFICATION"],
      ["ELEMENT_NATURE", "ELEMENT_ELECTRIC", "ELEMENT_ELECTRIFICATION"],
      ["ELEMENT_HEAT", "ELEMENT_ELECTRIC", "ELEMENT_ELECTRIFICATION"],

      ["ELEMENT_CRYO", "ELEMENT_NATURE", "ELEMENT_CORROSION"],
      ["ELEMENT_HEAT", "ELEMENT_NATURE", "ELEMENT_CORROSION"],
      ["ELEMENT_ELECTRIC", "ELEMENT_NATURE", "ELEMENT_CORROSION"],

      ["ELEMENT_HEAT", "ELEMENT_CRYO", "ELEMENT_SOLIDIFICATION"],
      ["ELEMENT_ELECTRIC", "ELEMENT_CRYO", "ELEMENT_SOLIDIFICATION"],
      ["ELEMENT_NATURE", "ELEMENT_CRYO", "ELEMENT_SOLIDIFICATION"],
    ])(`不同元素触发法术异常 %s + %s -> %s`, (existing, incoming, expected) => {
      const effectManager = new EffectManager();
      effectManager.add(
        new Effect({
          id: existing,
          tags: [existing as EffectTag],
        }),
      );

      const incomingEffect = new Effect({
        id: incoming,
        tags: [incoming as EffectTag],
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).not.toBeNull();
      expect(result?.removeIds).toHaveLength(1);
      expect(result?.spawnEffects).toHaveLength(1);
      expect(result?.spawnEffects[0]?.tags).toContain(expected as EffectTag);
    });
  });

  describe("物理", () => {
    it.each([
      "PHYSICAL_KNOCK_DOWN",
      "PHYSICAL_LIFT",
      "PHYSICAL_BREACH",
      "PHYSICAL_CRUSH",
    ])("无破防时触发破防 %s", (incoming) => {
      const effectManager = new EffectManager();
      effectManager.add(
        new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        }),
      );

      const incomingEffect = new Effect({
        id: incoming,
        tags: [incoming as EffectTag],
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).not.toBeNull();
      expect(result?.removeIds).toHaveLength(0);
      expect(result?.spawnEffects).toHaveLength(1);
      expect(result?.spawnEffects[0]?.tags).toContain("PHYSICAL_VULNERABLE");
    });

    it.each(["PHYSICAL_KNOCK_DOWN", "PHYSICAL_LIFT"])(
      "破防时触发倒地击飞 %s",
      (incoming) => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: "PHYSICAL_VULNERABLE",
            tags: ["PHYSICAL_VULNERABLE"],
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result?.removeIds).toHaveLength(0);
        // 添加一层破防
        expect(result?.spawnEffects).toHaveLength(1);
        expect(result?.spawnEffects[0]?.tags).toContain("PHYSICAL_VULNERABLE");
      },
    );

    it.each(["PHYSICAL_BREACH", "PHYSICAL_CRUSH"])(
      "破防时触发猛击碎甲 %s",
      (incoming) => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: "PHYSICAL_VULNERABLE",
            tags: ["PHYSICAL_VULNERABLE"],
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        // 消耗破防
        expect(result?.removeIds).toHaveLength(1);
        // instanceId
        expect(result?.removeIds).toContain("PHYSICAL_VULNERABLE_0");
        expect(result?.spawnEffects).toHaveLength(0);
      },
    );
  });
});
