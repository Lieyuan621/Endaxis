import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { createInteractionSession } from './interactionSession';
import { useTimelineMarqueeGesture } from '../timeline/interaction/useTimelineMarqueeGesture';
import { useTimelineViewportPan } from '../timeline/interaction/useTimelineViewportPan';

function pointer(type: string, pointerId = 1, x = 0): PointerEvent {
  return Object.assign(new Event(type), {
    pointerId,
    clientX: x,
    clientY: 0,
    button: 0,
    ctrlKey: false,
    metaKey: false,
  }) as PointerEvent;
}

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const events = new EventTarget();
  vi.stubGlobal('window', events);
  vi.stubGlobal('Element', class {});
  const scope = effectScope();
  const session = createInteractionSession();
  const applySelection = vi.fn();
  const marquee = scope.run(() =>
    useTimelineMarqueeGesture({
      interactionSession: session,
      surface: ref(null),
      getSelection: () => ({ selectedIds: new Set<string>(), primaryId: null }),
      applySelection,
    }),
  )!;
  return { events, scope, session, marquee, applySelection };
}

describe('marquee uses the workbench ownership lifecycle', () => {
  it('does not start or replace an existing library gesture', () => {
    const f = fixture();
    const drag = f.session.tryStart('library-drag', vi.fn())!;
    f.marquee.beginMarqueeGesture(pointer('pointerdown'));
    expect(f.marquee.marqueeStyle.value).toBeNull();
    expect(drag.isCurrent()).toBe(true);
    f.scope.stop();
    expect(drag.isCurrent()).toBe(true);
  });

  it('ignores another pointer cancellation and releases on its own pointer cancellation', () => {
    const f = fixture();
    f.marquee.beginMarqueeGesture(pointer('pointerdown'));
    f.events.dispatchEvent(pointer('pointercancel', 2));
    expect(f.session.current?.owner).toBe('marquee');
    f.events.dispatchEvent(pointer('pointercancel', 1));
    expect(f.session.current).toBeNull();
    expect(f.marquee.marqueeStyle.value).toBeNull();
    expect(f.applySelection).not.toHaveBeenCalled();
    f.scope.stop();
  });

  it('owner cancellation removes listeners and never commits the pending selection', () => {
    const f = fixture();
    f.marquee.beginMarqueeGesture(pointer('pointerdown'));
    f.events.dispatchEvent(pointer('pointermove', 1, 20));
    expect(f.marquee.marqueeStyle.value?.width).toBe('20px');
    f.session.cancel();
    f.events.dispatchEvent(pointer('pointerup', 1, 20));
    expect(f.applySelection).not.toHaveBeenCalled();
    expect(f.marquee.marqueeStyle.value).toBeNull();
    expect(f.session.tryStart('track-order', vi.fn())).not.toBeNull();
    f.scope.stop();
  });

  it('disposal releases only its own session and permits the next gesture', () => {
    const f = fixture();
    f.marquee.beginMarqueeGesture(pointer('pointerdown'));
    f.scope.stop();
    expect(f.session.current).toBeNull();
    f.events.dispatchEvent(pointer('pointerup', 1, 20));
    expect(f.applySelection).not.toHaveBeenCalled();
  });
});

describe('viewport pan shares ownership with selection tools', () => {
  it('cannot overlap marquee and releases its listeners on owner cancellation', () => {
    const f = fixture();
    const viewport = { scrollLeft: 100, scrollTop: 50 } as HTMLElement;
    const pan = f.scope.run(() =>
      useTimelineViewportPan({
        interactionSession: f.session,
        viewport: ref(viewport),
      }),
    )!;
    const middleDown = () => Object.assign(pointer('pointerdown'), { button: 1 });
    f.marquee.beginMarqueeGesture(pointer('pointerdown'));
    expect(pan.beginViewportPan(middleDown())).toBe(false);
    f.session.cancel();
    expect(pan.beginViewportPan(middleDown())).toBe(true);
    f.events.dispatchEvent(pointer('pointermove', 1, 20));
    expect(viewport.scrollLeft).toBe(80);
    f.events.dispatchEvent(pointer('pointerup', 2));
    expect(pan.isPanning.value).toBe(true);
    f.session.cancel();
    expect(pan.isPanning.value).toBe(false);
    f.events.dispatchEvent(pointer('pointermove', 1, 40));
    expect(viewport.scrollLeft).toBe(80);
    expect(f.session.current).toBeNull();
    f.scope.stop();
  });
});
