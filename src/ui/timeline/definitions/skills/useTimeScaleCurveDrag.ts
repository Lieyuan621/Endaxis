import { onScopeDispose, shallowRef, watch } from 'vue';
import type { TimeScaleCurveKeyDefinition } from '../../../../core/game-data/operatorDefinition';
import type { InteractionLease, InteractionSession } from '../../../interaction/interactionSession';

type CaptureTarget = Pick<
  Element,
  'setPointerCapture' | 'hasPointerCapture' | 'releasePointerCapture'
>;
type Keys = readonly TimeScaleCurveKeyDefinition[];

/** Curve motion is a local preview; one pointer release creates one draft edit. */
export function useTimeScaleCurveDrag(options: {
  session: InteractionSession;
  keys: () => Keys;
  readonly: () => boolean;
  commit: (keys: Keys) => void;
}) {
  const preview = shallowRef<Keys>();
  const index = shallowRef<number>();
  let lease: InteractionLease | null = null;
  let pointerId: number | undefined;
  let capture: CaptureTarget | undefined;

  function cancel() {
    const target = capture;
    const id = pointerId;
    capture = undefined;
    pointerId = undefined;
    index.value = undefined;
    preview.value = undefined;
    lease?.release();
    lease = null;
    if (id !== undefined && target?.hasPointerCapture(id)) target.releasePointerCapture(id);
  }

  function start(
    keyIndex: number,
    event: Pick<PointerEvent, 'button' | 'pointerId'>,
    target: CaptureTarget,
  ) {
    if (options.readonly() || event.button !== 0 || !options.keys()[keyIndex]) return false;
    const acquired = options.session.tryStart('time-scale-curve', cancel);
    if (!acquired) return false;
    lease = acquired;
    pointerId = event.pointerId;
    capture = target;
    index.value = keyIndex;
    preview.value = options.keys().map(key => ({ ...key }));
    try {
      target.setPointerCapture(event.pointerId);
    } catch (error) {
      cancel();
      throw error;
    }
    return true;
  }

  function owns(id: number) {
    return lease?.isCurrent() === true && pointerId === id;
  }

  function move(id: number, point: { time: number; value: number }) {
    if (!owns(id) || index.value === undefined || !preview.value) return;
    const keyIndex = index.value;
    const previous = preview.value[keyIndex - 1]?.time ?? -Infinity;
    const next = preview.value[keyIndex + 1]?.time ?? Infinity;
    const time = Math.min(next - 0.000001, Math.max(previous + 0.000001, point.time));
    preview.value = preview.value.map((key, i) =>
      i === keyIndex ? { ...key, time, value: point.value } : key,
    );
  }

  function finish(id: number) {
    if (!owns(id)) return;
    const result = preview.value;
    const changed = result?.some(
      (key, i) => key.time !== options.keys()[i]?.time || key.value !== options.keys()[i]?.value,
    );
    cancel();
    if (changed && result) options.commit(result);
  }

  function cancelPointer(id: number) {
    if (owns(id)) cancel();
  }
  watch(() => [options.keys(), options.readonly()], cancel, { deep: true, flush: 'sync' });
  onScopeDispose(cancel);
  return { preview, index, start, move, finish, cancelPointer };
}
