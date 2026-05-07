import type { TeamConfig, EnemyConfig, ActorSnapshot } from "./state/types.ts";
import { createEngine } from "./engine/createEngine.ts";
import type { ResolvedTimeline } from "./compiler/types.ts";
import { SCNEARIO_EFFECT_TYPE_MAP } from "./effects/scenarioAdapter.ts";
import { AfflictionEffectMap } from "./effects/afflictionEffectMap.ts";

export function simulate(
  timeline: ResolvedTimeline,
  teamConfig: TeamConfig,
  enemyConfig: EnemyConfig,
  actors: ActorSnapshot[],
) {
  const engine = createEngine(teamConfig, enemyConfig, actors, timeline);
  const actorIds = actors.map((actor) => actor.id);

  timeline.actions.forEach((action) => {
    engine.enqueue({
      type: "ACTION_START",
      time: action.realStartTime,
      payload: {
        skillId: action.node.id || "",
        actionId: action.id,
        spCost: action.node.spCost,
        actorId: action.trackId,
        type: action.node.type,
        freezeDuration: action.freezeDuration,
      },
    });

    if (action.node.gaugeCost > 0) {
      engine.enqueue({
        type: "ULTIMATE_CHARGE_CHANGE",
        time: action.realStartTime,
        payload: {
          actorId: action.trackId,
          sourceActorId: action.trackId,
          actionId: action.id,
          change: -action.node.gaugeCost,
          reason: `${action.node.type}_cost`,
          sourceId: action.id,
        },
      });
    }

    engine.enqueue({
      type: "ACTION_END",
      time: action.realStartTime + action.realDuration,
      payload: {
        skillId: action.node.id || "",
        actionId: action.id,
        spGain: action.node.spGain,
        spGainKind: action.node.spGainKind,
        actorId: action.trackId,
        type: action.node.type,
      },
    });

    if (action.node.gaugeGain > 0 && action.node.type !== "skill") {
      engine.enqueue({
        type: "ULTIMATE_CHARGE_CHANGE",
        time: action.realStartTime + action.realDuration,
        payload: {
          actorId: action.trackId,
          sourceActorId: action.trackId,
          actionId: action.id,
          change: action.node.gaugeGain,
          reason: `${action.node.type}_gain`,
          sourceId: action.id,
        },
      });
    }

    if (action.node.teamGaugeGain > 0) {
      actorIds.forEach((actorId) => {
        engine.enqueue({
          type: "ULTIMATE_CHARGE_CHANGE",
          time: action.realStartTime + action.realDuration,
          payload: {
            actorId,
            sourceActorId: action.trackId,
            actionId: action.id,
            change: action.node.teamGaugeGain,
            reason: `${action.node.type}_team_gain`,
            sourceId: action.id,
            isTeamGain: true,
          },
        });
      });
    }

    action.resolvedDamageTicks.forEach((tick) => {
      engine.enqueue({
        type: "DAMAGE_TICK",
        time: tick.realTime,
        payload: {
          sourceId: action.trackId,
          targetId: "boss",
          damage: 0,
          stagger: tick.stagger,
          tickData: tick,
          actionId: action.id,
        },
      });
    });

    action.effects.forEach((resolvedEffect) => {
      const tag =
        SCNEARIO_EFFECT_TYPE_MAP[
          resolvedEffect.node.type as keyof typeof SCNEARIO_EFFECT_TYPE_MAP
        ];

      if (!tag) {
        return;
      }

      const effect = AfflictionEffectMap[tag];
      effect.startTime = resolvedEffect.realStartTime;

      engine.enqueue({
        type: "EFFECT_START",
        time: effect.startTime,
        payload: {
          actorId: action.trackId,
          actionId: action.id,
          targetId: "boss",
          effect: effect.snapshot(),
        },
      });
    });
  });

  const state = engine.run();

  const simLog = engine.getSimLog();

  return {
    state,
    simLog,
  };
}
