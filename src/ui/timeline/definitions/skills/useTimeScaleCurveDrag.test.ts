import { effectScope, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createInteractionSession } from '../../../interaction/interactionSession';
import { useTimeScaleCurveDrag } from './useTimeScaleCurveDrag';

function fixture() {
  const scope = effectScope();
  const keys = ref(
    [0, 0.5, 1].map(time => ({
      time,
      value: 1,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0 as const,
      inWeight: 1 / 3,
      outWeight: 1 / 3,
    })),
  );
  const readonly = ref(false);
  const commit = vi.fn();
  const session = createInteractionSession();
  const captured = new Set<number>();
  const target = {
    setPointerCapture: vi.fn((id: number) => {
      captured.add(id);
    }),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: vi.fn((id: number) => {
      captured.delete(id);
    }),
  };
  const drag = scope.run(() =>
    useTimeScaleCurveDrag({
      session,
      keys: () => keys.value,
      readonly: () => readonly.value,
      commit,
    }),
  )!;
  const start = () => drag.start(1, { button: 0, pointerId: 7 }, target);
  return { scope, keys, readonly, commit, session, target, captured, drag, start };
}

describe('curve drag transaction', () => {
  it('keeps neighbor order and tangent metadata when dragging beyond a neighbor', () => {
    const f = fixture();
    f.start();
    f.drag.move(7, { time: 2, value: 0.4 });
    expect(f.drag.preview.value?.[1]).toEqual({ ...f.keys.value[1], time: 0.999999, value: 0.4 });
    f.drag.move(7, { time: -1, value: 0.4 });
    expect(f.drag.preview.value?.[1]?.time).toBe(0.000001);
    f.scope.stop();
  });

  it('previews many moves without writing the draft and commits once on owner release', () => {
    const f = fixture();
    f.start();
    f.drag.move(7, { time: 0.6, value: 0.4 });
    f.drag.move(7, { time: 0.7, value: 0.3 });
    expect(f.keys.value[1]).toMatchObject({ time: 0.5, value: 1 });
    expect(f.commit).not.toHaveBeenCalled();
    expect(f.drag.preview.value?.[1]).toMatchObject({ time: 0.7, value: 0.3 });
    f.drag.finish(7);
    expect(f.commit).toHaveBeenCalledOnce();
    expect(f.commit.mock.calls[0]![0][1]).toMatchObject({ time: 0.7, value: 0.3 });
    expect(f.session.current).toBeNull();
    expect(f.captured.size).toBe(0);
    f.drag.finish(7);
    expect(f.commit).toHaveBeenCalledOnce();
    f.scope.stop();
  });

  it('ignores other pointers and does not create an edit for a click', () => {
    const f = fixture();
    f.start();
    f.drag.move(8, { time: 0.8, value: 0 });
    f.drag.finish(8);
    f.drag.cancelPointer(8);
    expect(f.session.current).not.toBeNull();
    f.drag.finish(7);
    expect(f.commit).not.toHaveBeenCalled();
    f.scope.stop();
  });

  it.each(['session', 'pointer', 'readonly', 'replace', 'mutate', 'unmount'] as const)(
    'discards preview on %s cancellation',
    reason => {
      const f = fixture();
      f.start();
      f.drag.move(7, { time: 0.8, value: 0 });
      if (reason === 'session') f.session.cancel();
      if (reason === 'pointer') f.drag.cancelPointer(7);
      if (reason === 'readonly') f.readonly.value = true;
      if (reason === 'replace') f.keys.value = f.keys.value.map(key => ({ ...key }));
      if (reason === 'mutate') f.keys.value[1]!.value = 2;
      if (reason === 'unmount') f.scope.stop();
      expect(f.drag.preview.value).toBeUndefined();
      expect(f.session.current).toBeNull();
      expect(f.captured.size).toBe(0);
      f.drag.finish(7);
      expect(f.commit).not.toHaveBeenCalled();
      f.scope.stop();
    },
  );

  it('respects the session barrier and releases failed capture attempts', () => {
    const f = fixture();
    const release = f.session.block();
    expect(f.start()).toBe(false);
    release();
    f.target.setPointerCapture.mockImplementationOnce(() => {
      throw new Error('lost pointer');
    });
    expect(f.start).toThrow('lost pointer');
    expect(f.session.current).toBeNull();
    expect(f.drag.preview.value).toBeUndefined();
    expect(f.start()).toBe(true);
    f.scope.stop();
  });
});
