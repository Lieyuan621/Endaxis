import { describe, it, expect, beforeEach } from "vitest";
import { EffectManager } from "./EffectManager";
import { Effect } from "../effects/types";

describe("EffectManager", () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
  });

  it("添加状态", () => {
    const effect = new Effect({
      id: "test_buff",
      name: "Test Buff",
      tags: ["ELEMENT_HEAT"],
    });

    manager.add(effect);

    expect(manager.getAll().length).toBe(1);
    expect(manager.hasTag("ELEMENT_HEAT")).toBe(true);
  });

  it("叠加状态", () => {
    const effect1 = new Effect({
      id: "stacking_buff",
      name: "Stacking Buff",
      tags: ["ELEMENT_HEAT"],
      currentStacks: 2,
      maxStacks: 4,
    });

    const effect2 = new Effect({
      id: "stacking_buff",
      name: "Stacking Buff",
      tags: ["ELEMENT_HEAT"],
      currentStacks: 3,
      maxStacks: 4,
    });

    manager.add(effect1);
    expect(manager.getAll()[0]?.effect.currentStacks).toBe(2);

    manager.add(effect2);
    expect(manager.getAll()).toHaveLength(1);
    expect(manager.getAll()[0]?.effect.currentStacks).toBe(4);
  });

  it("移除状态", () => {
    const effect = new Effect({
      id: "temp_buff",
      name: "Temp Buff",
      tags: ["ELEMENT_HEAT"],
    });

    const inst = manager.add(effect);
    expect(manager.hasTag("ELEMENT_HEAT")).toBe(true);

    manager.remove(inst.id);
    expect(manager.getAll().length).toBe(0);
    expect(manager.hasTag("ELEMENT_HEAT")).toBe(false);
  });
});
