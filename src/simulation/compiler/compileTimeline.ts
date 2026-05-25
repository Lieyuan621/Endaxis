import { TimeContext } from "./timeContext";
import type {
  Connection,
  ActionNode,
  ResolvedTimeline,
  ResolvedAction,
  ResolvedEffect,
  ResolvedDamageTick,
  TimeExtension,
} from "./types";

interface ShiftContext {
  shift: number;
  amount: number;
  realStart: number;
  realEnd: number;
}

function round(num: number, factor: number = 1000): number {
  return Math.round(num * factor) / factor;
}

function getNominalFreezeDuration(action: ActionNode["node"]): number {
  if (action.type === "link") return 0.5;
  if (action.type === "ultimate") return Number(action.animationTime) || 1.5;
  return 0;
}

function calculateTimeShifts(startSortedActions: ActionNode[]) {
  const stopSources = startSortedActions.filter((item) => {
    const a = item.node;
    const hasWindow = (a.triggerWindow || 0) >= 0;
    return (
      (a.type === "link" || a.type === "ultimate") && hasWindow && !a.isDisabled
    );
  });

  const sourceShiftMap = new Map<string, ShiftContext>();
  const timeExtensions: TimeExtension[] = [];

  let lastRealEnd = 0;
  let cumulativeFreezeTime = 0;

  stopSources.forEach((sourceItem, index) => {
    const source = sourceItem.node;
    const nextSourceItem = stopSources[index + 1];
    const nextSource = nextSourceItem?.node;

    const gameStart = source.startTime;
    const realStart = round(Math.max(gameStart, lastRealEnd));

    let amount = 0;
    if (source.type === "ultimate") {
      amount = source.animationTime || 1.5;
    } else {
      if (nextSource) {
        const gap = nextSource.startTime - source.startTime;
        amount = Math.min(0.5, Math.max(0.1, round(gap)));
      } else {
        amount = 0.5;
      }
    }

    const shift = round(realStart - gameStart);

    sourceShiftMap.set(sourceItem.id, {
      shift,
      amount,
      realStart,
      realEnd: round(realStart + amount),
    });

    timeExtensions.push({
      time: realStart,
      gameTime: gameStart,
      amount,
      sourceId: sourceItem.id,
      logicalTime: gameStart,
      cumulativeFreezeTime: cumulativeFreezeTime,
    });

    cumulativeFreezeTime = round(cumulativeFreezeTime + amount);
    lastRealEnd = round(realStart + amount);
  });

  return { stopSources, sourceShiftMap, timeExtensions };
}

// Resolve an action's shifted timing and derived runtime data.
function resolveAction(
  item: ActionNode,
  stopSources: ActionNode[],
  sourceShiftMap: Map<string, ShiftContext>,
  timeCtx: TimeContext
): ResolvedAction {
  const action = item.node;
  const startTime = action.startTime;

  let realStartTime = startTime;

  // Apply Freeze Offset
  const activeSourceItem = [...stopSources]
    .reverse()
    .find((s) => s.node.startTime <= startTime);

  const realFreezeDuration = sourceShiftMap.get(item.id)?.amount;
  const nominalFreezeDuration = getNominalFreezeDuration(action);

  if (activeSourceItem) {
    const ctx = sourceShiftMap.get(activeSourceItem.id)!;
    if (item.id === activeSourceItem.id) {
      realStartTime = round(ctx.realStart);
    } else {
      const normalShifted = startTime + ctx.shift;
      realStartTime = round(Math.max(normalShifted, ctx.realEnd));
    }
  } else {
    realStartTime = startTime;
  }

  // Calculate Real Duration
  const effectiveDuration = round(
    Math.max(
      0,
      action.duration - nominalFreezeDuration + (realFreezeDuration ?? nominalFreezeDuration)
    )
  );
  const realEndTime = timeCtx.getShiftedEndTime(
    realStartTime,
    effectiveDuration,
    item.id
  );
  const realDuration = round(realEndTime - realStartTime);
  const actionExtension = round(realDuration - action.duration);

  // Resolve Effects
  const resolvedEffects: ResolvedEffect[] = [];
  if (action.physicalAnomaly && action.physicalAnomaly.length > 0) {
    let globalFlatIndex = 0;
    action.physicalAnomaly.forEach((row, rowIndex) => {
      row.forEach((effect, colIndex) => {
        const uniqueId = effect._id;
        const flatIndex = globalFlatIndex++;
        const originalOffset = Number(effect.offset) || 0;

        // Effect Start
        const effectRealStartTime = timeCtx.getShiftedEndTime(
          realStartTime,
          originalOffset,
          item.id
        );

        // Effect Duration
        const effectRealEndTime = timeCtx.getShiftedEndTime(
          effectRealStartTime,
          effect.duration,
          item.id
        );

        resolvedEffects.push({
          ...effect,
          type: "effect",
          id: uniqueId,
          actionId: item.id,
          uniqueId: `${uniqueId}_${flatIndex}`,

          realStartTime: effectRealStartTime,
          realDuration: round(effectRealEndTime - effectRealStartTime),
          displayDuration: round(effectRealEndTime - effectRealStartTime),
          isConsumed: false,
          extensionAmount: round(
            round(effectRealEndTime - effectRealStartTime) - effect.duration
          ),

          rowIndex,
          colIndex,
          flatIndex,
          node: effect,
        });
      });
    });
  }

  const resolvedDamageTicks: ResolvedDamageTick[] = action.damageTicks.map(
    (tick) => {
      const realTime = timeCtx.getShiftedEndTime(
        realStartTime,
        tick.offset || 0,
        item.id
      );

      return {
        ...tick,
        realTime,
        realOffset: realTime - realStartTime,
        time: timeCtx.toGameTime(realTime),
      };
    }
  );

  return {
    ...item,
    startTime,
    realStartTime,
    duration: action.duration,
    realDuration,
    isInterrupted: false,
    effects: resolvedEffects,
    resolvedDamageTicks,
    triggerWindow: {
      hasWindow: (action.triggerWindow || 0) >= 0,
      startTime: 0,
      duration: Math.abs(action.triggerWindow || 0),
    },
    extensionAmount: actionExtension,
    freezeDuration: realFreezeDuration,
  };
}

function resolveConsumption(
  resolvedActions: ResolvedAction[],
  connections: Connection[]
) {
  if (!connections) return;

  resolvedActions.forEach((producer) => {
    producer.effects.forEach((effect) => {
      const conn = connections.find(
        (c) => c.isConsumption && c.fromEffectId === effect.id
      );
      if (conn && conn.to) {
        const consumer = resolvedActions.find((a) => a.id === conn.to);
        if (consumer) {
          const consumptionOffset = conn.consumptionOffset || 0;
          const consumptionTime = consumer.realStartTime - consumptionOffset;
          const cutDuration = consumptionTime - effect.realStartTime;
          const snappedCut = round(cutDuration);

          if (snappedCut >= 0) {
            effect.displayDuration = Math.min(
              effect.displayDuration,
              snappedCut
            );
            effect.isConsumed = true;
          }
        }
      }
    });
  });
}

function resolveActions(
  actions: ActionNode[],
  stopSources: ActionNode[],
  sourceShiftMap: Map<string, ShiftContext>,
  timeCtx: TimeContext
) {
  const resolvedActions: ResolvedAction[] = [];
  const actionMap = new Map<string, ResolvedAction>();
  const effectMap = new Map<string, ResolvedEffect>();
  for (const item of actions) {
    const resolvedAction = resolveAction(
      item,
      stopSources,
      sourceShiftMap,
      timeCtx
    );
    resolvedActions.push(resolvedAction);
    actionMap.set(resolvedAction.id, resolvedAction);
    resolvedAction.effects.forEach((effect) => {
      effectMap.set(effect.id, effect);
    });
  }

  return { resolvedActions, actionMap, effectMap };
}

export function compileTimeline(
  actions: ActionNode[],
  connections: Connection[] = []
): ResolvedTimeline {
  const sortedActions = actions.toSorted(
    (a, b) => a.node.startTime - b.node.startTime
  );

  const { stopSources, sourceShiftMap, timeExtensions } =
    calculateTimeShifts(sortedActions);

  const timeCtx = new TimeContext(timeExtensions);

  const { resolvedActions, actionMap, effectMap } = resolveActions(
    sortedActions,
    stopSources,
    sourceShiftMap,
    timeCtx
  );

  if (connections.length > 0) {
    resolveConsumption(resolvedActions, connections);
  }

  const totalDuration = resolvedActions.reduce(
    (max, a) => Math.max(max, round(a.realStartTime + a.realDuration)),
    0
  );

  return {
    actions: resolvedActions,
    actionMap,
    effectMap,
    timeExtensions,
    timeContext: timeCtx,
    meta: {
      totalDuration,
    },
  };
}
