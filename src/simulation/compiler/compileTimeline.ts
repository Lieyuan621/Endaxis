import { TimeContext } from './timeContext';
import { resolveEffectLifecycle } from '@/data/effectPresets';
import type {
  ActionNode,
  ResolvedTimeline,
  ResolvedAction,
  ResolvedEffect,
  ResolvedHit,
  TimeExtension,
} from './types';
import { isComboSkillLikeAction, isUltimateLikeAction } from './types';
import { resolveConditionalFreezeTiming, type FreezeOptions } from './conditionalFreeze';

interface ShiftContext {
  shift: number;
  amount: number;
  realStart: number;
  realEnd: number;
}

function round(num: number, factor: number = 1000): number {
  return Math.round(num * factor) / factor;
}

function getNominalFreezeDuration(action: ActionNode['node'], conditionalDuration = 0): number {
  if (isComboSkillLikeAction(action)) return 0.5;
  if (isUltimateLikeAction(action)) return Number(action.animationTime) || 1.5;
  return conditionalDuration;
}

function calculateTimeShifts(
  startSortedActions: ActionNode[],
  conditionalDurations: Map<string, number>,
  nonCompressing: ReadonlySet<string>,
) {
  const staticSources = startSortedActions.filter(item => {
    const a = item.node;
    const hasWindow = (a.triggerWindow || 0) >= 0;
    return (isComboSkillLikeAction(a) || isUltimateLikeAction(a)) && hasWindow && !a.isDisabled;
  });
  const staticIds = new Set(staticSources.map(item => item.id));
  const stopSources = startSortedActions.filter(
    item => staticIds.has(item.id) || conditionalDurations.has(item.id),
  );
  if (conditionalDurations.size) {
    // A candidate was evaluated after the existing same-time freeze(s). Keep
    // that causal order when inserting it, even if it came first in the input.
    stopSources.sort(
      (a, b) =>
        a.node.startTime - b.node.startTime ||
        Number(conditionalDurations.has(a.id)) - Number(conditionalDurations.has(b.id)),
    );
  }

  const participatesInCompression = (item: ActionNode) =>
    staticIds.has(item.id) ||
    (item.node.conditionalFreeze?.compression === 'comboSkill' && !nonCompressing.has(item.id));
  const compressionSources = stopSources.filter(participatesInCompression);
  const nextCompressionSource = new Map(
    compressionSources.map((item, index) => [item.id, compressionSources[index + 1]]),
  );

  const sourceShiftMap = new Map<string, ShiftContext>();
  const timeExtensions: TimeExtension[] = [];

  let lastRealEnd = 0;
  let cumulativeFreezeTime = 0;

  stopSources.forEach(sourceItem => {
    const source = sourceItem.node;
    const nextSourceItem = nextCompressionSource.get(sourceItem.id);
    const nextSource = nextSourceItem?.node;

    const gameStart = source.startTime;
    const realStart = round(Math.max(gameStart, lastRealEnd));

    let amount = 0;
    if (conditionalDurations.has(sourceItem.id) && !participatesInCompression(sourceItem)) {
      amount = conditionalDurations.get(sourceItem.id)!;
    } else if (isUltimateLikeAction(source)) {
      amount = Number(source.animationTime) || 1.5;
    } else if (nextSource) {
      const gap = nextSource.startTime - source.startTime;
      const nominal = getNominalFreezeDuration(source, conditionalDurations.get(sourceItem.id));
      amount = Math.min(nominal, Math.max(0.1, round(gap)));
    } else {
      amount = getNominalFreezeDuration(source, conditionalDurations.get(sourceItem.id));
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

  const actionStartTimes = new Map<string, number>();
  const effectiveDurations = new Map<string, number>();
  let sourceIndex = -1;
  for (const item of startSortedActions) {
    const start = item.node.startTime;
    while (stopSources[sourceIndex + 1] && stopSources[sourceIndex + 1]!.node.startTime <= start)
      sourceIndex++;
    const activeSource = stopSources[sourceIndex];
    const ctx = activeSource ? sourceShiftMap.get(activeSource.id) : undefined;
    const own = sourceShiftMap.get(item.id);
    actionStartTimes.set(
      item.id,
      own?.realStart ?? (ctx ? round(Math.max(start + ctx.shift, ctx.realEnd)) : start),
    );
    const nominal = getNominalFreezeDuration(item.node, conditionalDurations.get(item.id));
    effectiveDurations.set(
      item.id,
      round(Math.max(0, item.node.duration - nominal + (own?.amount ?? nominal))),
    );
  }
  return {
    sourceShiftMap,
    timeExtensions,
    actionStartTimes,
    effectiveDurations,
    timeContext: new TimeContext(timeExtensions),
  };
}

/** Shared by compiler and editor stop-shifting; never executes the simulator. */
export function calculateTimelineShifts(actions: ActionNode[], options: FreezeOptions = {}) {
  const sorted = actions.toSorted((a, b) => a.node.startTime - b.node.startTime);
  const timing = resolveConditionalFreezeTiming(
    sorted,
    (durations, nonCompressing) => calculateTimeShifts(sorted, durations, nonCompressing),
    options,
  );
  return { ...timing, sortedActions: sorted };
}

function resolveAction(
  item: ActionNode,
  timing: ReturnType<typeof calculateTimelineShifts>,
): ResolvedAction {
  const action = item.node;
  const startTime = action.startTime;

  const timeCtx = timing.timeContext;
  const realStartTime = timing.actionStartTimes.get(item.id)!;
  const realFreezeDuration = timing.sourceShiftMap.get(item.id)?.amount;
  const effectiveDuration = timing.effectiveDurations.get(item.id)!;
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
  // A nonSkill action's damage carries no skill-type attribution — the whole point of the type.
  // Leave it undefined rather than stamping the literal, which is what `skillTypes: 'nonSkill'`
  // modifiers actually match (see matchesSkillType in computeDamage).
  const actionSkillType = action.type === 'nonSkill' ? undefined : action.type;

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
      skillType: treatAsSkillType ?? (isFinalHit ? 'finalStrike' : actionSkillType),
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

function resolveActions(actions: ActionNode[], timing: ReturnType<typeof calculateTimelineShifts>) {
  const resolvedActions: ResolvedAction[] = [];
  const actionMap = new Map<string, ResolvedAction>();
  const effectMap = new Map<string, ResolvedEffect>();

  for (const item of actions) {
    const resolvedAction = resolveAction(item, timing);
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
  options: FreezeOptions = {},
): ResolvedTimeline {
  const timing = calculateTimelineShifts(actions, options);
  const { resolvedActions, actionMap } = resolveActions(timing.sortedActions, timing);

  applyActionInterruptions(resolvedActions);
  const finalEffectMap = rebuildEffectMap(resolvedActions);

  const totalDuration = resolvedActions.reduce(
    (max, a) => Math.max(max, round(a.realStartTime + a.realDuration)),
    0,
  );

  return {
    actions: resolvedActions,
    actionMap,
    effectMap: finalEffectMap,
    timeExtensions: timing.timeExtensions,
    timeContext: timing.timeContext,
    meta: {
      totalDuration,
    },
  };
}
