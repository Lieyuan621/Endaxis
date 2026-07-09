import { describe, expect, it } from "vitest";
import { getDisplayKeyCandidates } from "@/utils/effectDisplay";
import { projectFromSimLog } from "./projectEnemyEffects";

describe("enemy effect projection display keys", () => {
  it("uses status names for display while preserving runtime status identity", () => {
    const projection = projectFromSimLog(
      [
        {
          type: "ENEMY_STATUS_APPLY",
          time: 0,
          id: "tangtang-oldenStare",
          value: 0,
          stacks: 1,
          maxStacks: 1,
          expiresAt: 3,
          sourceId: "tangtang",
          effect: {
            kind: "status",
            id: "tangtang-oldenStare",
            name: "oldenStare",
            target: "enemy",
          },
        },
        {
          type: "ENEMY_EFFECT_EXPIRE",
          time: 3,
          kind: "status",
          id: "tangtang-oldenStare",
          consumed: false,
        },
      ] as any,
      [
        {
          type: "DAMAGE_HIT",
          time: 1,
          payload: {
            targetId: "enemy",
            sourceId: "tangtang",
            actionId: "dot",
            stagger: 0,
            hitData: {
              triggeredBy: "dot:tangtang-oldenStare",
            },
          },
        },
      ] as any,
    );

    const status = projection.segments.find(segment => !segment.isDamageHit);
    const marker = projection.segments.find(segment => segment.isDamageHit);

    expect(status?.typeKey).toBe("state:oldenStare:tangtang-oldenStare");
    expect(marker?.typeKey).toBe(status?.typeKey);
    expect(getDisplayKeyCandidates(status?.typeKey)).toContain("oldenStare");
  });
});
