import { describe, expect, it } from "vitest";
import { getCharacterRoster } from "./timeline";

describe("timeline data roster", () => {
  it("does not synthesize default battle-skill ultimate energy from SP cost", () => {
    const zhuangFangyi = getCharacterRoster().find((entry) => entry.id === "zhuang-fangyi");

    expect(zhuangFangyi?.battleSkill_ultimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_teamUltimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_segments?.[0]?.ultimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_segments?.[0]?.teamUltimateEnergyGain).toBe(0);
  });
});