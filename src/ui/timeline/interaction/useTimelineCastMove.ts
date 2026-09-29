import { nextTick, onScopeDispose, shallowRef } from 'vue';
import type { AdaptiveTimelineSimulationService } from '../../../application/simulation/adaptiveTimelineSimulationService';
import { passedTimelineDragThreshold } from './timelineDragThreshold';
import { projectTimelineEdgeAutoScrollDelta } from './timelineEdgeAutoScroll';
import { getSkillCastPlacementAnchor } from '../../../core/project/skillCastPlacement';
import { type ScenarioDocument, type TrackIndex } from '../../../core/project/schema';
import { timelinePxToExactFrame } from '../timelineGeometry';
import { expandSkillCastGroupSelection } from './skillCastGroupInteraction';
import { selectTimelineAction, type TimelineActionSelection } from './timelineActionSelection';
import { moveSkillCasts } from './timelineDocumentCommands';
import { resolveTimelineCastMovePointerFrame } from './timelineCastMoveGeometry';
import type { Ref } from 'vue';
import type { InteractionSession } from '../../interaction/interactionSession';
interface TimelineCastMoveOptions {
  readonly isInputReadOnly?: (castId: string) => boolean;
  readonly minimumInputFrame?: Readonly<Ref<number>>;
  readonly prepEndFrame?: Readonly<Ref<number>>;
  readonly scenario: Ref<ScenarioDocument>;
  readonly actionSelection: Readonly<Ref<TimelineActionSelection>>;
  readonly interactionSession: InteractionSession;
  readonly simulationService: Pick<
    AdaptiveTimelineSimulationService,
    'beginInteractiveSession' | 'endInteractiveSession'
  >;
  readonly resolvedSkillCastStartFrames: Readonly<Ref<ReadonlyMap<string, number>>>;
  readonly timelineScroll: Ref<HTMLElement | null>;
  readonly pxPerFrame: Readonly<Ref<number>>;
  readonly snapFrames: Readonly<Ref<number>>;
  readonly cursorFrame: Ref<number>;
  readonly trackHeaderWidth: number;
  readonly rulerHeight: number;
  readonly verticalAutoScrollEnabled?: () => boolean;
  readonly timelineFramePx: (frame: number) => number;
  readonly alignSelectedCastToTarget: (event: PointerEvent, castId: string) => boolean;
  readonly applyActionSelection: (selection: TimelineActionSelection) => void;
  readonly commitScenario: (
    commandName: string,
    command: (current: ScenarioDocument) => ScenarioDocument,
  ) => boolean;
  readonly simulateNow: () => Promise<boolean>;
  readonly warnLocked: () => void;
  readonly onDropped?: (
    event: PointerEvent,
    trackIndex: TrackIndex,
    castIds: readonly string[],
  ) => void;
}
/** 一个技能拖动会话拥有预览、指针捕获、自动滚动及发布后的收尾。 */
export function useTimelineCastMove(options: TimelineCastMoveOptions) {
  const {
    scenario,
    actionSelection,
    interactionSession,
    simulationService,
    resolvedSkillCastStartFrames,
    timelineScroll,
    pxPerFrame,
    snapFrames,
    cursorFrame,
    trackHeaderWidth: TIMELINE_TRACK_HEADER_WIDTH,
    rulerHeight: TIMELINE_RULER_HEIGHT,
    timelineFramePx,
    alignSelectedCastToTarget,
    applyActionSelection,
    commitScenario,
    simulateNow,
    warnLocked,
  } = options;
  interface TimelineCastMoveGesture {
    readonly pointerId: number;
    readonly trackIndex: TrackIndex;
    readonly skillCastId: string;
    readonly pointerCastId: string;
    readonly skillCastIds: readonly string[];
    readonly baseStartFrames: ReadonlyMap<string, number>;
    readonly pointerOffsetActualFrames: number;
    readonly initialPointerX: number;
    readonly initialPointerY: number;
    latestPointerX: number;
    latestPointerY: number;
    readonly baseScenario: ScenarioDocument;
    previewFrame: number;
    previewActualFrame: number;
    /** 松手后保留预览，直到对应场景的新模拟快照发布。 */
    readonly committed: boolean;
    dragStarted: boolean;
    moved: boolean;
  }
  const castMoveGesture = shallowRef<TimelineCastMoveGesture | null>(null);
  let stopCastMoveGesture: (() => void) | null = null;
  let castMoveAutoScrollFrame: number | null = null;
  let suppressedCastClickId: string | null = null;

  function beginCastMove(event: PointerEvent, trackIndex: TrackIndex, skillCastId: string): void {
    if (event.button !== 0) return;
    if (interactionSession.current !== null) return;
    if (alignSelectedCastToTarget(event, skillCastId)) return;
    event.preventDefault();
    event.stopPropagation();
    cancelCastMove();
    const selection = actionSelection.value.selectedIds.has(skillCastId)
      ? { ...actionSelection.value, primaryId: skillCastId }
      : selectTimelineAction(actionSelection.value, skillCastId, false);
    const movingIds = expandSkillCastGroupSelection(scenario.value, selection.selectedIds);
    const selectedCasts = scenario.value.tracks.flatMap(track =>
      track === null ? [] : track.skillCasts.filter(candidate => movingIds.has(candidate.id)),
    );
    if (
      selectedCasts.some(
        candidate => candidate.presentation?.locked || options.isInputReadOnly?.(candidate.id),
      )
    ) {
      event.preventDefault();
      event.stopPropagation();
      warnLocked();
      return;
    }
    const block = event.currentTarget as HTMLElement;
    const cast = scenario.value.tracks[trackIndex]?.skillCasts.find(
      candidate => candidate.id === skillCastId,
    );
    if (cast === undefined) return;
    const anchor = getSkillCastPlacementAnchor(
      scenario.value.tracks[trackIndex]!.skillCasts,
      cast.id,
    );
    const baseStartFrames = resolvedSkillCastStartFrames.value;
    const initialActualFrame = baseStartFrames.get(anchor.id)!;
    const initialPlacementFrame = anchor.placement.startFrame!;
    const pointerTimelinePx =
      timelineFramePx(baseStartFrames.get(cast.id)!) +
      event.clientX -
      block.getBoundingClientRect().left;
    const pointerOffsetActualFrames = Math.max(
      0,
      timelinePxToExactFrame(
        pointerTimelinePx,
        scenario.value.battle.prepFrames,
        pxPerFrame.value,
        scenario.value.editor.prepExpanded,
        options.prepEndFrame?.value,
      ) - initialActualFrame,
    );
    const lease = interactionSession.tryStart('cast-move', cancelCastMove);
    if (lease === null) return;
    castMoveGesture.value = {
      pointerId: event.pointerId,
      trackIndex,
      skillCastId: anchor.id,
      pointerCastId: skillCastId,
      skillCastIds: [...movingIds],
      baseStartFrames,
      pointerOffsetActualFrames,
      initialPointerX: event.clientX,
      initialPointerY: event.clientY,
      latestPointerX: event.clientX,
      latestPointerY: event.clientY,
      baseScenario: scenario.value,
      previewFrame: initialPlacementFrame,
      previewActualFrame: initialActualFrame,
      committed: false,
      dragStarted: false,
      moved: false,
    };
    simulationService.beginInteractiveSession();
    // 捕获到稳定的滚动容器，避免模拟刷新替换技能块或跨控件悬停抢走手势。
    // 落点仍通过 elementFromPoint 解析，不依赖捕获后的 event.target。
    const captureTarget = timelineScroll.value;
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      // 在窗口外松手等情况下可能漏收 pointerup；没有主按钮时不能继续拖动。
      if ((moveEvent.buttons & 1) === 0) {
        cancelCastMove();
        return;
      }
      moveEvent.stopPropagation();
      try {
        updateCastMove(moveEvent);
      } catch (error) {
        cancelCastMove();
        throw error;
      }
      // 超过拖动阈值才接管，普通点击仍交给原技能块，不能丢失选择行为。
      if (
        castMoveGesture.value?.dragStarted &&
        !captureTarget?.hasPointerCapture(event.pointerId)
      ) {
        try {
          captureTarget?.setPointerCapture(event.pointerId);
        } catch (error) {
          cancelCastMove();
          throw error;
        }
      }
    };
    const onFinish = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId !== event.pointerId) return;
      finishEvent.stopPropagation();
      void finishCastMove(finishEvent).catch(error => {
        console.error('Failed to finish timeline skill drag', error);
      });
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === event.pointerId) cancelCastMove();
    };
    const onBlur = () => cancelCastMove();
    stopCastMoveGesture = () => {
      // 先解除收尾函数，释放捕获触发同步事件时也不能再次清理本次手势。
      stopCastMoveGesture = null;
      simulationService.endInteractiveSession();
      lease.release();
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onFinish, true);
      window.removeEventListener('pointercancel', onCancel, true);
      captureTarget?.removeEventListener('lostpointercapture', onCancel);
      window.removeEventListener('blur', onBlur);
      if (captureTarget?.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
      }
      if (castMoveAutoScrollFrame !== null) cancelAnimationFrame(castMoveAutoScrollFrame);
      castMoveAutoScrollFrame = null;
    };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onFinish, true);
    window.addEventListener('pointercancel', onCancel, true);
    captureTarget?.addEventListener('lostpointercapture', onCancel);
    window.addEventListener('blur', onBlur);
  }

  function castMoveFrame(
    clientX: number,
    clientY: number,
    gesture: TimelineCastMoveGesture,
  ): { readonly placementFrame: number; readonly actualFrame: number } | null {
    const pointed = document.elementFromPoint(clientX, clientY);
    const lane = pointed instanceof Element ? pointed.closest<HTMLElement>('.track-lane') : null;
    if (lane?.dataset.trackIndex !== String(gesture.trackIndex)) return null;
    return resolveTimelineCastMovePointerFrame({
      clientX,
      laneLeftPx: lane.getBoundingClientRect().left,
      pxPerFrame: pxPerFrame.value,
      prepFrames: scenario.value.battle.prepFrames,
      prepExpanded: scenario.value.editor.prepExpanded,
      prepEndFrame: options.prepEndFrame?.value,
      pointerOffsetActualFrames: gesture.pointerOffsetActualFrames,
      snapFrames: snapFrames.value,
      minimumFrame: options.minimumInputFrame?.value ?? -gesture.baseScenario.battle.prepFrames,
      actualMaximumFrame: scenario.value.battle.durationFrames,
    });
  }

  function updateCastMoveAt(
    pointerId: number,
    clientX: number,
    clientY: number,
    fromAutoScroll = false,
  ): void {
    let gesture = castMoveGesture.value;
    if (gesture === null || gesture.pointerId !== pointerId) return;
    if (!fromAutoScroll) {
      gesture.latestPointerX = clientX;
      gesture.latestPointerY = clientY;
    }
    if (!gesture.dragStarted) {
      if (
        !passedTimelineDragThreshold(
          gesture.initialPointerX,
          gesture.initialPointerY,
          clientX,
          clientY,
        )
      ) {
        return;
      }
      gesture = { ...gesture, dragStarted: true };
      castMoveGesture.value = gesture;
    }
    if (!fromAutoScroll) scheduleCastMoveAutoScroll();
    const frame = castMoveFrame(clientX, clientY, gesture);
    if (frame === null) return;
    const movedScenario = moveSkillCasts(
      gesture.baseScenario,
      new Set(gesture.skillCastIds),
      gesture.trackIndex,
      gesture.skillCastId,
      frame.placementFrame,
      gesture.baseStartFrames,
      options.minimumInputFrame?.value,
    );
    // 多选按共享位移整体限位。预览必须使用命令实际采用的落点，不能让主块单独越界。
    const placedFrame = movedScenario.tracks[gesture.trackIndex]!.skillCasts.find(
      cast => cast.id === gesture.skillCastId,
    )!.placement.startFrame!;
    const actualFrame = frame.actualFrame + placedFrame - frame.placementFrame;
    if (placedFrame === gesture.previewFrame && actualFrame === gesture.previewActualFrame) {
      return;
    }
    if (!gesture.moved) {
      gesture.moved = true;
      applyActionSelection({
        selectedIds: new Set(gesture.skillCastIds),
        primaryId: gesture.pointerCastId,
      });
    }
    castMoveGesture.value = {
      ...gesture,
      previewFrame: placedFrame,
      previewActualFrame: actualFrame,
    };
    if (placedFrame !== gesture.previewFrame) {
      scenario.value = movedScenario;
    }
    cursorFrame.value = placedFrame;
  }

  function updateCastMove(event: PointerEvent): void {
    updateCastMoveAt(event.pointerId, event.clientX, event.clientY);
  }

  function scheduleCastMoveAutoScroll(): void {
    if (castMoveAutoScrollFrame !== null) return;
    const tick = () => {
      castMoveAutoScrollFrame = null;
      const gesture = castMoveGesture.value;
      const viewport = timelineScroll.value;
      if (gesture === null || viewport === null || gesture.committed || !gesture.dragStarted)
        return;
      const rect = viewport.getBoundingClientRect();
      const delta = projectTimelineEdgeAutoScrollDelta({
        pointerX: gesture.latestPointerX,
        pointerY: gesture.latestPointerY,
        left: rect.left + TIMELINE_TRACK_HEADER_WIDTH,
        right: rect.right,
        top: rect.top + TIMELINE_RULER_HEIGHT,
        bottom: rect.bottom,
      });
      if (delta.x === 0 && delta.y === 0) return;
      const previousLeft = viewport.scrollLeft;
      const previousTop = viewport.scrollTop;
      viewport.scrollLeft += delta.x;
      viewport.scrollTop =
        options.verticalAutoScrollEnabled?.() === false ? 0 : previousTop + delta.y;
      if (viewport.scrollLeft === previousLeft && viewport.scrollTop === previousTop) return;
      updateCastMoveAt(gesture.pointerId, gesture.latestPointerX, gesture.latestPointerY, true);
      castMoveAutoScrollFrame = requestAnimationFrame(tick);
    };
    castMoveAutoScrollFrame = requestAnimationFrame(tick);
  }

  async function finishCastMove(event: PointerEvent): Promise<void> {
    let gesture = castMoveGesture.value;
    if (gesture === null || gesture.pointerId !== event.pointerId) return;
    try {
      updateCastMove(event);
    } catch (error) {
      cancelCastMove();
      throw error;
    }
    gesture = castMoveGesture.value;
    if (gesture === null) return;
    const finalScenario = scenario.value;
    const moved = gesture.moved;
    stopCastMoveGesture?.();
    if (!moved) {
      castMoveGesture.value = null;
      scenario.value = gesture.baseScenario;
      return;
    }
    const settlingGesture = { ...gesture, committed: true };
    castMoveGesture.value = settlingGesture;
    suppressedCastClickId = gesture.pointerCastId;
    setTimeout(() => {
      if (suppressedCastClickId === gesture.pointerCastId) suppressedCastClickId = null;
    }, 0);
    try {
      // 预览不是已提交文档；失败时必须恢复原输入。
      scenario.value = gesture.baseScenario;
      const committed = commitScenario('moveSkillCasts', () => finalScenario);
      if (!committed) {
        castMoveGesture.value = null;
        await simulateNow();
        return;
      }
      options.onDropped?.(event, gesture.trackIndex, gesture.skillCastIds);
      await nextTick();
      await simulateNow();
    } finally {
      // 模拟可能被较新请求替代或失败，均不得留下已经结束的拖动预览。
      // 旧请求结束时也不能清掉后来开始的新手势。
      if (castMoveGesture.value === settlingGesture) castMoveGesture.value = null;
    }
  }

  function cancelCastMove(): void {
    const gesture = castMoveGesture.value;
    stopCastMoveGesture?.();
    castMoveGesture.value = null;
    if (gesture !== null && !gesture.committed) scenario.value = gesture.baseScenario;
  }

  function discardCastMove(): void {
    castMoveGesture.value = null;
    stopCastMoveGesture?.();
    suppressedCastClickId = null;
  }
  function consumeCastClick(castId: string): boolean {
    if (suppressedCastClickId !== castId) return false;
    suppressedCastClickId = null;
    return true;
  }
  onScopeDispose(cancelCastMove);
  return { castMoveGesture, beginCastMove, cancelCastMove, discardCastMove, consumeCastClick };
}
