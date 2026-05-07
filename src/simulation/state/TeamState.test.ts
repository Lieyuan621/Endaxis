import { describe, expect, it } from "vitest";
import { TeamState } from "./TeamState";

describe("TeamState", () => {
  it("consumes refund SP before recover SP", () => {
    const team = new TeamState(
      {
        maxSp: 200,
        initialSp: 0,
        spRegenRate: 0,
        skillSpCostDefault: 100,
        linkCdReduction: 0,
      },
      {} as never,
    );

    team.addSp(40, "recover");
    team.addSp(60, "refund");

    const result = team.consumeSp(100);

    expect(result.refundConsumed).toBe(60);
    expect(result.recoverConsumed).toBe(40);
    expect(team.getRefundSp()).toBe(0);
    expect(team.getRecoverSp()).toBe(0);
  });
});