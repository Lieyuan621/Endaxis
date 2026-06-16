import type { TeamConfig, EnemyConfig, ActorSnapshot } from "./state/types.ts";
import { createEngine } from "./engine/createEngine.ts";
import type { ResolvedTimeline } from "./compiler/types.ts";
import type { TriggerRegistry } from "./engine/TriggerRegistry";
import type { OperatorStat } from "@/data/types";
import type { BaseStatValues } from "@/data/stats/types";

export interface InitialEffect {
  targetTrackId: string;
  id: string;
  stat?: OperatorStat;
  value: number;
  sourceId: string;
  effect?: any;
  stacks?: number;
  maxStacks?: number;
  stackStrategy?: "REFRESH_DURATION" | "INDEPENDENT" | "REPLACE";
}

interface SimulationOptions {
  triggerRegistry?: TriggerRegistry;
  consumedStacksWriteKeys?: Set<string>;
  initialEffects?: InitialEffect[];
  baseStatsByTrack?: Map<string, BaseStatValues>;
  enemyDef?: number;
  endlineTime?: number;
  lmdiAttributionMode?: "stacks" | "applier";
}

export function simulate(
  timeline: ResolvedTimeline,
  teamConfig: TeamConfig,
  enemyConfig: EnemyConfig,
  actors: ActorSnapshot[],
  triggerRegistry?: TriggerRegistry,
  consumedStacksWriteKeys?: Set<string>,
  options: SimulationOptions = {},
) {
  const activeTriggerRegistry = triggerRegistry ?? options.triggerRegistry;
  const initialEffects = options.initialEffects ?? [];

  const engine = createEngine(teamConfig, enemyConfig, actors, timeline, activeTriggerRegistry);
  if (consumedStacksWriteKeys || options.consumedStacksWriteKeys) {
    engine.consumedStacksWriteKeys = consumedStacksWriteKeys ?? options.consumedStacksWriteKeys!;
  }
  if (options.baseStatsByTrack) engine.baseStatsByTrack = options.baseStatsByTrack;
  if (options.enemyDef !== undefined) engine.enemyDef = options.enemyDef;
  if (options.endlineTime !== undefined) engine.endlineTime = options.endlineTime;
  if (options.lmdiAttributionMode !== undefined) {
    engine.lmdiAttributionMode = options.lmdiAttributionMode;
  }

  initialEffects.forEach((effect) => {
    if (!effect?.targetTrackId || !effect.id) return;
    engine.enqueue({
      type: "OPERATOR_EFFECT_APPLY",
      time: 0,
      targetTrackId: effect.targetTrackId,
      id: effect.id,
      stat: effect.stat,
      value: Number(effect.value) || 0,
      stacks: Math.max(1, Number(effect.stacks) || 1),
      maxStacks: Math.max(1, Number(effect.maxStacks) || 1),
      expiresAt: Infinity,
      sourceId: effect.sourceId,
      effect: effect.effect ?? ({ kind: "status", id: effect.id, hide: true } as any),
      stackStrategy: effect.stackStrategy,
      silent: true,
    });
  });

  const actorIds = actors.map((actor) => actor.id);
  const actorMetaById = new Map(actors.map(actor => [actor.id, actor]));

  timeline.actions.forEach((action) => {
    engine.enqueue({
      type: "ACTION_START",
      time: action.realStartTime,
      payload: {
        skillId: action.node.skillId || action.node.id || "",
        actionId: action.id,
        spCost: action.node.spCost,
        actorId: action.trackId,
        type: action.node.type,
        freezeDuration: action.freezeDuration,
      },
    });

    if (Number(action.node.gaugeCost) > 0) {
      engine.enqueue({
        type: "ULT_ENERGY_CHANGE",
        time: action.realStartTime,
        payload: {
          actorId: action.trackId,
          change: -Number(action.node.gaugeCost),
          sourceId: action.id,
        },
      });
    }

    const optimisticExtension = action.resolvedHits.reduce(
      (sum, hit) => sum + (Number(hit.durationExtension) || 0),
      0,
    );
    const actionEndTime = action.realStartTime + action.realDuration + optimisticExtension;

    engine.enqueue({
      type: "ACTION_END",
      time: actionEndTime,
      payload: {
        skillId: action.node.skillId || action.node.id || "",
        actionId: action.id,
        actorId: action.trackId,
        type: action.node.type,
      },
    });

    if (Number(action.node.spGain) > 0) {
      engine.enqueue({
        type: "SP_CHANGE",
        time: actionEndTime,
        payload: {
          actorId: action.trackId,
          spChange: Number(action.node.spGain) || 0,
          reason: "skill",
          sourceId: action.id,
          parent: null as any,
          spType: action.node.spGainKind === "refund" ? "return" : "recovery",
          skillType: action.node.type,
          skillId: action.node.skillId || action.node.id,
        },
      });
    }

    if (Number(action.node.gaugeGain) > 0) {
      engine.enqueue({
        type: "ULT_ENERGY_CHANGE",
        time: action.realStartTime + action.realDuration,
        payload: {
          actorId: action.trackId,
          change: Number(action.node.gaugeGain) || 0,
          sourceId: action.id,
        },
      });
    }

    if (Number(action.node.teamGaugeGain) > 0) {
      actorIds.forEach((actorId) => {
        if (actorId === action.trackId) return;
        const targetActor = actorMetaById.get(actorId);
        if (targetActor?.acceptTeamUltEnergy === false) return;
        engine.enqueue({
          type: "ULT_ENERGY_CHANGE",
          time: action.realStartTime + action.realDuration,
          payload: {
            actorId,
            change: Number(action.node.teamGaugeGain) || 0,
            sourceId: action.id,
          },
        });
      });
    }

    action.resolvedHits.forEach((hit) => {
      engine.enqueue({
        type: "DAMAGE_HIT",
        time: hit.realTime,
        payload: {
          sourceId: action.trackId,
          targetId: "boss",
          stagger: hit.stagger,
          hitData: hit,
          actionId: action.id,
        },
      });
    });
  });

  const { state, actionEndTimes } = engine.run();

  return {
    state,
    simLog: engine.getSimLog(),
    enemyLog: engine.getEnemyLog(),
    operatorLog: engine.getOperatorLog(),
    actionEndTimes,
  };
}
