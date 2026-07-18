import { TimeContext } from './timeContext';
import { resolveEffectLifecycle } from '@/data/effectPresets';
import type {
  Connection,
  ActionNode,
  ResolvedTimeline,
  ResolvedAction,
  ResolvedEffect,
  ResolvedHit,
  TimeExtension,
} from './types';
import { isComboSkillLikeAction, isUltimateLikeAction } from './types';

interface ShiftContext {
  shift: number;
  amount: number;
  realStart: number;
  realEnd: number;
}

function round(num: number, factor: number = 1000): number {
  return Math.round(num * factor) / factor;
}

function getNominalFreezeDuration(action: ActionNode['node']): number {
  if (isComboSkillLikeAction(action)) return 0.5;
  if (isUltimateLikeAction(action)) return Number(action.animationTime) || 1.5;
  return 0;
}

function calculateTimeShifts(startSortedActions: ActionNode[]) {
  const stopSources = startSortedActions.filter(item => {
    const a = item.node;
    const hasWindow = (a.triggerWindow || 0) >= 0;
    return (isComboSkillLikeAction(a) || isUltimateLikeAction(a)) && hasWindow && !a.isDisabled;
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
    if (isUltimateLikeAction(source)) {
      amount = Number(source.animationTime) || 1.5;
    } else if (nextSource) {
      const gap = nextSource.startTime - source.startTime;
      amount = Math.min(0.5, Math.max(0.1, round(gap)));
    } else {
      amount = 0.5;
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
      cumulativeFreezeTime,
    });

    cumulativeFreezeTime = round(cumulativeFreezeTime + amount);
    lastRealEnd = round(realStart + amount);
  });

  return { stopSources, sourceShiftMap, timeExtensions };
}

function resolveAction(
  item: ActionNode,
  stopSources: ActionNode[],
  sourceShiftMap: Map<string, ShiftContext>,
  timeCtx: TimeContext,
): ResolvedAction {
  const action = item.node;
  const startTime = action.startTime;

  let realStartTime = startTime;
  const activeSourceItem = [...stopSources].reverse().find(s => s.node.startTime <= startTime);

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
  }

  const effectiveDuration = round(
    Math.max(
      0,
      action.duration - nominalFreezeDuration + (realFreezeDuration ?? nominalFreezeDuration),
    ),
  );
  const realEndTime = timeCtx.getShiftedEndTime(realStartTime, effectiveDuration, item.id);
  const realDuration = round(realEndTime - realStartTime);
  const actionExtension = round(realDuration - action.duration);

  const resolvedEffects: ResolvedEffect[] = [];
  let globalFlatIndex = 0;
  (action.hits || []).forEach((hit, hitIndex) => {
    (hit.effects || []).forEach((effect, effectIndex) => {
      const uniqueId = effect._id || `${item.id}_${hitIndex}_${effectIndex}`;
      const flatIndex = globalFlatIndex++;
      const inheritedCondition = (effect as any)?.condition ?? (hit as any)?._condition;

      const effectRealStartTime = timeCtx.getShiftedEndTime(
        realStartTime,
        Number(hit.offset) || 0,
        item.id,
      );

      const lifecycle = resolveEffectLifecycle(effect as any);
      const baseDuration = Number(lifecycle.duration) || 0;
      const effectRealEndTime = (effect as any)?.ignoreTimeShift
        ? round(effectRealStartTime + baseDuration)
        : timeCtx.getShiftedEndTime(effectRealStartTime, baseDuration, item.id);

      resolvedEffects.push({
        ...(effect as any),
        ...(inheritedCondition ? { condition: inheritedCondition } : {}),
        type: 'effect',
        id: uniqueId,
        actionId: item.id,
        uniqueId: `${uniqueId}_${flatIndex}`,
        realStartTime: effectRealStartTime,
        realDuration: round(effectRealEndTime - effectRealStartTime),
        displayDuration: round(effectRealEndTime - effectRealStartTime),
        isConsumed: false,
        extensionAmount: round(round(effectRealEndTime - effectRealStartTime) - baseDuration),
        hitIndex,
        effectIndex,
        flatIndex,
        node: effect,
      });
    });
  });

  // Tag the last hit of a completed basic-attack sequence 'finalStrike' (mirrors
  // TriggerRegistry.onFinalStrike gating; sequenceTotal 0 = single hit).
  const seqNode = action as any;
  const sequenceIndex = Number(seqNode.sequenceIndex ?? seqNode.attackSequenceIndex) || 0;
  const sequenceTotal = Number(seqNode.sequenceTotal ?? seqNode.attackSequenceTotal) || 0;
  const isFinalStrikeAction =
    action.type === 'basicAttack' && (sequenceTotal === 0 || sequenceIndex === sequenceTotal);
  const lastHitIndex = (action.hits?.length ?? 0) - 1;

  const resolvedHits: ResolvedHit[] = (action.hits || []).map((hit, hitIndex) => {
    const realTime = timeCtx.getShiftedEndTime(realStartTime, Number(hit.offset) || 0, item.id);
    const treatAsReaction = (hit as any).treatAsReaction as string | undefined;
    const treatAsSkillType = (hit as any).treatAsSkillType as string | undefined;
    const isFinalHit = isFinalStrikeAction && hitIndex === lastHitIndex;

    return {
      ...hit,
      realTime,
      realOffset: realTime - realStartTime,
      time: timeCtx.toGameTime(realTime),
      skillType: treatAsSkillType ?? (isFinalHit ? 'finalStrike' : action.type),
      skillId: (hit as any).skillId ?? action.skillId,
      element: hit.element || action.element,
      _actionInstanceId: item.id,
      _hitIndex: hitIndex,
      ...(treatAsReaction
        ? {
            _reactionMeta: {
              reactionType: treatAsReaction,
              level: 0,
              element: (hit as any).element ?? action.element ?? 'physical',
              consumedStackSources: {},
              synthetic: true,
            },
          }
        : {}),
    };
  });

  return {
    ...item,
    startTime,
    realStartTime,
    duration: action.duration,
    realDuration,
    isInterrupted: false,
    effects: resolvedEffects,
    resolvedHits,
    triggerWindow: {
      hasWindow: (action.triggerWindow || 0) >= 0,
      startTime: 0,
      duration: Math.abs(action.triggerWindow || 0),
    },
    extensionAmount: actionExtension,
    freezeDuration: realFreezeDuration,
  };
}

function resolveConsumption(resolvedActions: ResolvedAction[], connections: Connection[]) {
  if (!connections?.length) return;

  resolvedActions.forEach(producer => {
    if (producer.node.isDisabled) return;
    producer.effects.forEach(effect => {
      const conn = connections.find(c => c.isConsumption && c.fromEffectId === effect.id);
      if (!conn?.to) return;

      const consumer = resolvedActions.find(a => a.id === conn.to);
      if (!consumer || consumer.node.isDisabled) return;

      const consumptionOffset = Number(conn.consumptionOffset) || 0;
      const consumptionTime = consumer.realStartTime - consumptionOffset;
      const cutDuration = consumptionTime - effect.realStartTime;
      const snappedCut = round(cutDuration);

      if (snappedCut >= 0) {
        effect.displayDuration = Math.min(effect.displayDuration, snappedCut);
        effect.isConsumed = true;
      }
    });
  });
}

function resolveActions(
  actions: ActionNode[],
  stopSources: ActionNode[],
  sourceShiftMap: Map<string, ShiftContext>,
  timeCtx: TimeContext,
) {
  const resolvedActions: ResolvedAction[] = [];
  const actionMap = new Map<string, ResolvedAction>();
  const effectMap = new Map<string, ResolvedEffect>();

  for (const item of actions) {
    const resolvedAction = resolveAction(item, stopSources, sourceShiftMap, timeCtx);
    resolvedActions.push(resolvedAction);
    actionMap.set(resolvedAction.id, resolvedAction);
    resolvedAction.effects.forEach(effect => {
      effectMap.set(effect.id, effect);
    });
  }

  return { resolvedActions, actionMap, effectMap };
}

function applyActionInterruptions(resolvedActions: ResolvedAction[]) {
  const trackBuckets = new Map<string, ResolvedAction[]>();
  const epsilon = 0.0001;

  resolvedActions.forEach(action => {
    if (!action.trackId || action.node.isDisabled) return;
    const bucket = trackBuckets.get(action.trackId) ?? [];
    bucket.push(action);
    trackBuckets.set(action.trackId, bucket);
  });

  trackBuckets.forEach(bucket => {
    bucket.sort((a, b) => {
      if (a.realStartTime !== b.realStartTime) {
        return a.realStartTime - b.realStartTime;
      }
      return a.id.localeCompare(b.id);
    });

    bucket.forEach((action, index) => {
      const nextAction = bucket[index + 1];
      if (!nextAction) return;

      const activeEnd = round(action.realStartTime + action.realDuration);
      const interruptAt = round(nextAction.realStartTime);
      if (interruptAt >= activeEnd - epsilon) return;

      action.isInterrupted = true;
      action.interruptTime = interruptAt;
      action.realDuration = round(Math.max(0, interruptAt - action.realStartTime));
      action.resolvedHits = action.resolvedHits.filter(hit => hit.realTime < interruptAt - epsilon);
      action.effects = action.effects.filter(
        effect => effect.realStartTime < interruptAt - epsilon,
      );
      action.extensionAmount = round(action.realDuration - action.duration);
    });
  });
}

function rebuildEffectMap(resolvedActions: ResolvedAction[]) {
  const effectMap = new Map<string, ResolvedEffect>();
  resolvedActions.forEach(action => {
    action.effects.forEach(effect => {
      effectMap.set(effect.id, effect);
    });
  });
  return effectMap;
}

export function compileTimeline(
  actions: ActionNode[],
  connections: Connection[] = [],
): ResolvedTimeline {
  const sortedActions = actions.toSorted((a, b) => a.node.startTime - b.node.startTime);

  const { stopSources, sourceShiftMap, timeExtensions } = calculateTimeShifts(sortedActions);

  const timeCtx = new TimeContext(timeExtensions);

  const { resolvedActions, actionMap } = resolveActions(
    sortedActions,
    stopSources,
    sourceShiftMap,
    timeCtx,
  );

  applyActionInterruptions(resolvedActions);
  const finalEffectMap = rebuildEffectMap(resolvedActions);

  if (connections.length > 0) {
    resolveConsumption(resolvedActions, connections);
  }

  const totalDuration = resolvedActions.reduce(
    (max, a) => Math.max(max, round(a.realStartTime + a.realDuration)),
    0,
  );

  return {
    actions: resolvedActions,
    actionMap,
    effectMap: finalEffectMap,
    timeExtensions,
    timeContext: timeCtx,
    meta: {
      totalDuration,
    },
  };
}
