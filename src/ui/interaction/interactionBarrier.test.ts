import { effectScope, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createInteractionSession } from './interactionSession';
import { useInteractionBarrier } from './interactionSessionContext';

describe('overlay gesture barrier lifecycle', () => {
  it('takes effect synchronously when a panel opens and releases when it closes', () => {
    const scope = effectScope();
    const session = createInteractionSession();
    const open = ref(false);
    scope.run(() => useInteractionBarrier(session, () => open.value));
    const cancel = vi.fn();
    session.tryStart('cast-move', cancel);
    open.value = true;
    expect(cancel).toHaveBeenCalledOnce();
    expect(session.tryStart('library-drag', vi.fn())).toBeNull();
    open.value = false;
    expect(session.tryStart('library-drag', vi.fn())).not.toBeNull();
    scope.stop();
  });

  it('disposal releases only that panel and stops watching future changes', () => {
    const session = createInteractionSession();
    const first = effectScope();
    const second = effectScope();
    const open = ref(true);
    first.run(() => useInteractionBarrier(session, () => open.value));
    second.run(() => useInteractionBarrier(session, () => true));
    first.stop();
    expect(session.tryStart('cast-move', vi.fn())).toBeNull();
    second.stop();
    open.value = false;
    open.value = true;
    expect(session.tryStart('cast-move', vi.fn())).not.toBeNull();
  });
});
