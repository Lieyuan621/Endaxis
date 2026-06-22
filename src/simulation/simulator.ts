import type { TeamConfig, EnemyConfig, ActorSnapshot } from "./state/types.ts";
import { createEngine } from "./engine/createEngine.ts";
import type { ResolvedTimeline, ResolvedHit } from "./compiler/types.ts";
import {
  getReactionDamageElement,
  getReactionMultiplier,
} from "@/data/stats/computeReactionDamage";
import type { TriggerRegistry } from "./engine/TriggerRegistry";
import type { OperatorStat } from "@/data/types";
import type { BaseStatValues } from "@/data/stats/types";
import type { EnemyResistance } from "@/data/enemyResistance";
import { normalizeEnemyResistance } from "@/data/enemyResistance";
import type { ControlSegment } from "@/stores/timeline/controlledOperator";

export interface InitialEffect {
  kind?: "status" | "oneTime";
  targetTrackId: string;
  id: string;
  stat?: OperatorStat;
  value: number;
  sourceId: string;
  effect?: any;
  stacks?: number;
  maxStacks?: number;
  stackStrategy?: "REFRESH_DURATION" | "INDEPENDENT" | "REPLACE";
  remainingDuration?: number;
  expiresAt?: number;
  consumedStacks?: Record<string, number>;
  skillTypes?: any;
  skillId?: any;
  external?: boolean;
}

interface SimulationOptions {
  triggerRegistry?: TriggerRegistry;
  consumedStacksWriteKeys?: Set<string>;
  initialEffects?: InitialEffect[];
  initialEnemyState?: any;
  baseStatsByTrack?: Map<string, BaseStatValues>;
  enemyDef?: number;
  enemyResistance?: EnemyResistance;
  endlineTime?: number;
  lmdiAttributionMode?: "stacks" | "applier";
  controlledOperatorSegments?: ControlSegment[];
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
  if (options.initialEnemyState) {
    const applyTime = Math.max(0, Number(teamConfig.prepDuration) || 0);
    logAndScheduleInitialEnemyState(engine, options.initialEnemyState, applyTime);
  }
  if (consumedStacksWriteKeys || options.consumedStacksWriteKeys) {
    engine.consumedStacksWriteKeys = consumedStacksWriteKeys ?? options.consumedStacksWriteKeys!;
  }
  if (options.baseStatsByTrack) engine.baseStatsByTrack = options.baseStatsByTrack;
  if (options.enemyDef !== undefined) engine.enemyDef = options.enemyDef;
  engine.enemyResistance = normalizeEnemyResistance(
    options.enemyResistance ?? enemyConfig.resistance,
  );
  if (options.endlineTime !== undefined) engine.endlineTime = options.endlineTime;
  if (options.lmdiAttributionMode !== undefined) {
    engine.lmdiAttributionMode = options.lmdiAttributionMode;
  }
  if (options.controlledOperatorSegments) {
    engine.controlledOperatorSegments = options.controlledOperatorSegments;
  }

  function finiteRemaining(entry: any) {
    const remaining = Number(entry?.remainingDuration);
    return Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  }

  function toExpiresAt(entry: any, applyTime: number) {
    return applyTime + finiteRemaining(entry);
  }

  function logAndScheduleInitialEnemyState(engine: any, initialEnemyState: any, applyTime: number) {
    if (!initialEnemyState) return;

    const enemy = engine.getState().enemy;
    enemy.importCarryoverSnapshot(initialEnemyState, applyTime);

    const stagger = initialEnemyState.stagger;
    if (stagger) {
      const breakRemaining = Math.max(0, Number(stagger.breakRemaining) || 0);
      const lockRemaining = Math.max(0, Number(stagger.lockRemaining) || 0);
      const staggerValue = Math.max(0, Number(stagger.value) || 0);

      const nodeCount = Number(enemy.config?.staggerNodeCount) || 0;
      const maxStagger = Number(enemy.config?.maxStagger) || 0;
      const nodeStep = nodeCount > 0 && maxStagger > 0
          ? maxStagger / (nodeCount + 1)
          : 0;

      const nodeReachedIndex =
          breakRemaining <= 0 && lockRemaining > 0 && nodeStep > 0
              ? Math.max(1, Math.floor(staggerValue / nodeStep + 0.0001))
              : undefined;

      engine.logSimEntry({
        type: "STAGGER",
        time: applyTime,
        payload: {
          actorId: "carryover",
          actionId: "carryover:enemy-stagger",
          amount: 0,
          stagger: staggerValue,
          isBroken: breakRemaining > 0,
          breakEndTime: breakRemaining > 0 ? applyTime + breakRemaining : undefined,
          nodeReachedIndex,
          nodeEndTime: lockRemaining > 0 ? applyTime + lockRemaining : undefined,
        },
      });
    }

    const enqueueExpire = (event: any, priority = 2) => {
      if (Number.isFinite(event.time) && event.time > applyTime) {
        engine.enqueue(event, priority);
      }
    };

    const log = (event: any) => {
      engine.logEnemyEvent(event);
    };

    const infliction = initialEnemyState.infliction;
    if (infliction && finiteRemaining(infliction) > 0) {
      const expiresAt = toExpiresAt(infliction, applyTime);

      log({
        type: "INFLICTION_APPLY",
        time: applyTime,
        element: infliction.element,
        stacks: Number(infliction.stacks) || 1,
        sourceId: infliction.sourceQueue?.[0]?.sourceId || infliction.sourceId || "",
        expiresAt,
        effectiveDuration: finiteRemaining(infliction),
      });

      enqueueExpire({
        type: "ENEMY_EFFECT_EXPIRE",
        time: expiresAt,
        kind: "infliction",
        element: infliction.element,
        consumed: false,
      });
    }

    const vulnerability = initialEnemyState.vulnerability;
    if (vulnerability && finiteRemaining(vulnerability) > 0) {
      const expiresAt = toExpiresAt(vulnerability, applyTime);

      log({
        type: "VULNERABILITY_CHANGE",
        time: applyTime,
        stacks: Number(vulnerability.stacks) || 1,
        expiresAt,
        trigger: "lift",
        sourceId: vulnerability.sourceQueue?.[0]?.sourceId || vulnerability.sourceId || "",
      });

      enqueueExpire({
        type: "ENEMY_EFFECT_EXPIRE",
        time: expiresAt,
        kind: "vulnerability",
        consumed: false,
      });
    }

    const debuffs = initialEnemyState.debuffs || {};

    const logDebuff = (debuffType: string, entry: any) => {
      if (!entry || finiteRemaining(entry) <= 0) return;

      const expiresAt = toExpiresAt(entry, applyTime);
      const sourceId = entry.sourceId || "";

      log({
        type: "DEBUFF_APPLY",
        time: applyTime,
        debuffType,
        level: Number(entry.level) || 1,
        expiresAt,
        sourceId,
      });

      enqueueExpire({
        type: "ENEMY_EFFECT_EXPIRE",
        time: expiresAt,
        kind: "debuff",
        debuffType,
        consumed: false,
      });
    };

    logDebuff("electrification", debuffs.electrification);
    logDebuff("solidification", debuffs.solidification);
    logDebuff("breach", debuffs.breach);
    logDebuff("corrosion", debuffs.corrosion);
    logDebuff("combustion", debuffs.combustion);

    const corrosion = debuffs.corrosion;
    if (corrosion && finiteRemaining(corrosion) > 0) {
      const expiresAt = toExpiresAt(corrosion, applyTime);
      const nextTickDelay = Math.max(0, Number(corrosion.nextTickDelay) || 1);
      const firstTickTime = applyTime + nextTickDelay;

      log({
        type: "CORROSION_TICK",
        time: applyTime,
        sourceId: corrosion.sourceId || "",
        resShred: Number(corrosion.currentResShred) || 0,
        level: Number(corrosion.level) || 1,
        tickIndex: 0,
      });

      if (firstTickTime < expiresAt) {
        engine.enqueue(
            {
              type: "CORROSION_TICK",
              time: firstTickTime,
              payload: {
                sourceId: corrosion.sourceId || "",
                perSecond: Number(corrosion.perSecond) || 0,
                maxShred: Number(corrosion.maxShred) || 0,
                tickIndex: 1,
                expiresAt,
              },
            },
            1,
        );
      }
    }

    const combustion = debuffs.combustion;
    if (combustion && finiteRemaining(combustion) > 0) {
      const expiresAt = toExpiresAt(combustion, applyTime);
      const level = Math.max(1, Math.min(4, Number(combustion.level) || 1));
      const sourceId = combustion.sourceId || "";
      const effectiveness = combustion.effectiveness;

      let tickTime = applyTime + Math.max(0, Number(combustion.nextTickDelay) || 1);
      let tickIndex = 1;

      while (tickTime <= expiresAt + 0.0001 && tickIndex <= 20) {
        const multiplier = getReactionMultiplier("combustion_dot" as any, level);
        const element = getReactionDamageElement("combustion_dot" as any);

        engine.enqueue(
            {
              type: "DAMAGE_HIT",
              time: tickTime,
              payload: {
                targetId: "boss",
                sourceId,
                stagger: 0,
                hitData: {
                  offset: 0,
                  multiplier,
                  spRecovery: 0,
                  spReturn: 0,
                  stagger: 0,
                  realTime: tickTime,
                  realOffset: 0,
                  time: tickTime,
                  triggered: true,
                  triggeredBy: "reaction:combustion_dot",
                  _reactionMeta: {
                    reactionType: "combustion_dot",
                    level,
                    element,
                    effectiveness,
                    consumedStackSources: combustion.consumedStackSources,
                  },
                  _canCrit: false,
                } as ResolvedHit,
                actionId: combustion.actionId || `reaction:combustion_dot:carryover:${tickTime}`,
              },
            },
            0,
        );

        tickIndex += 1;
        tickTime += 1;
      }
    }

    for (const raw of initialEnemyState.statuses || []) {
      if (!raw?.id || finiteRemaining(raw) <= 0) continue;

      const expiresAt = toExpiresAt(raw, applyTime);

      log({
        type: "ENEMY_STATUS_APPLY",
        time: applyTime,
        id: raw.id,
        stat: raw.stat,
        value: Number(raw.value) || 0,
        stacks: Math.max(1, Number(raw.stacks) || 1),
        maxStacks: Math.max(1, Number(raw.maxStacks) || 1),
        expiresAt,
        sourceId: raw.sourceId || "",
        icon: raw.icon,
        effect: raw.effect,
      });

      enqueueExpire({
        type: "ENEMY_EFFECT_EXPIRE",
        time: expiresAt,
        kind: "status",
        id: raw.id,
        consumed: false,
      });
    }
  }

  initialEffects.forEach((effect) => {
    if (!effect?.targetTrackId || !effect.id) return;

    const remainingDuration = Number(effect.remainingDuration);
    const explicitExpiresAt = Number(effect.expiresAt);

    const hasRemainingDuration = Number.isFinite(remainingDuration);
    const hasExplicitExpiresAt = Number.isFinite(explicitExpiresAt);
    const hasFiniteDuration = hasRemainingDuration || hasExplicitExpiresAt;

    const applyTime = hasFiniteDuration
        ? Math.max(0, Number(teamConfig.prepDuration) || 0)
        : 0;

    const duration = hasRemainingDuration
        ? Math.max(0, remainingDuration)
        : hasExplicitExpiresAt
            ? Math.max(0, explicitExpiresAt)
            : Infinity;

    if (hasFiniteDuration && duration <= 0) return;

    const expiresAt = hasFiniteDuration
        ? applyTime + duration
        : Infinity;

    if (effect.kind === "oneTime") {
      const state = engine.getState().getOperatorEffects(effect.targetTrackId);

      const cumulativeStacks = state.applyOneTime({
        id: effect.id,
        stat: effect.stat as any,
        value: Number(effect.value) || 0,
        stacks: Math.max(1, Number(effect.stacks) || 1),
        maxStacks: Math.max(1, Number(effect.maxStacks) || 1),
        skillTypes: effect.skillTypes,
        skillId: effect.skillId,
        expiresAt,
        sourceId: effect.sourceId || effect.targetTrackId,
        effect: effect.effect,
      });

      engine.logOperatorEvent({
        type: "OPERATOR_EFFECT_APPLY",
        time: applyTime,
        targetTrackId: effect.targetTrackId,
        id: effect.id,
        stat: effect.stat as any,
        value: Number(effect.value) || 0,
        stacks: Math.max(1, Number(effect.stacks) || 1),
        maxStacks: Math.max(1, Number(effect.maxStacks) || 1),
        expiresAt,
        sourceId: effect.sourceId || effect.targetTrackId,
        effect: effect.effect,
        cumulativeStacks,
        silent: true,
      } as any);

      return;
    }

    engine.enqueue({
      type: "OPERATOR_EFFECT_APPLY",
      time: applyTime,
      targetTrackId: effect.targetTrackId,
      id: effect.id,
      stat: effect.stat,
      value: Number(effect.value) || 0,
      stacks: Math.max(1, Number(effect.stacks) || 1),
      maxStacks: Math.max(1, Number(effect.maxStacks) || 1),
      expiresAt,
      sourceId: effect.sourceId || effect.targetTrackId,
      effect: effect.effect ?? ({
        kind: "status",
        id: effect.id,
        target: { scope: "self" },
        hide: !hasFiniteDuration,
      } as any),
      stackStrategy: effect.stackStrategy,
      consumedStacks: effect.consumedStacks,
      silent: !hasFiniteDuration,
      skipStatusAppliedTrigger: hasFiniteDuration,
      external: effect.external,
    });
  });

  const actorIds = actors.map((actor) => actor.id);
  const actorMetaById = new Map(actors.map(actor => [actor.id, actor]));

  timeline.actions.forEach((action) => {
    // Keep disabled actions in the compiled timeline for editor rendering, but
    // never let them enter the simulator event queue.
    if (action.node.isDisabled) return;

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
