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

  it("keeps Avywenna combo ultimate energy at zero", () => {
    const avywenna = getCharacterRoster().find((entry) => entry.id === "avywenna");

    expect(avywenna?.comboSkill_ultimateEnergyGain).toBe(0);
  });

  it("keeps Last Rite combo action energy at zero because its hit grants the base 40", () => {
    const lastRite = getCharacterRoster().find((entry) => entry.id === "last-rite");

    expect(lastRite?.comboSkill_ultimateEnergyGain).toBe(0);
    expect(lastRite?.accept_self_sp_cost_ult_energy).toBe(false);
    expect(
      lastRite?.comboSkill_damage_hits?.some((hit: any) =>
        hit.effects?.some((effect: any) => effect.kind === "ultEnergyGain" && effect.value === 40),
      ),
    ).toBe(true);
  });

  it("gives non-Avywenna combo skills their authored 10 ultimate energy", () => {
    const perlica = getCharacterRoster().find((entry) => entry.id === "perlica");
    const alesh = getCharacterRoster().find((entry) => entry.id === "alesh");

    expect(perlica?.comboSkill_ultimateEnergyGain).toBe(10);
    expect(alesh?.comboSkill_ultimateEnergyGain).toBe(10);
  });

  it("preserves explicitly authored combo-skill ultimate energy", () => {
    const arclight = getCharacterRoster().find((entry) => entry.id === "arclight");

    expect(arclight?.comboSkill_ultimateEnergyGain).toBe(5);
  });
});