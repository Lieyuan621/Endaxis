import { effectScope, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createInteractionSession } from './interactionSession';
import { useInteractionBarrier } from './interactionSessionContext';

describe('interaction barrier reentrant cancellation', () => {
  it('preserves a successor barrier opened by the cancellation callback', () => {
    const scope = effectScope();
    const active = ref(false);
    const session = createInteractionSession();
    scope.run(() => useInteractionBarrier(session, () => active.value));
    session.tryStart('drag', () => {
      active.value = false;
      active.value = true;
    });
    active.value = true;
    expect(session.tryStart('blocked', vi.fn())).toBeNull();
    active.value = false;
    expect(session.tryStart('next-drag', vi.fn())).not.toBeNull();
    scope.stop();
  });

  it.each(['close', 'unmount'])('releases a barrier when cancellation causes %s', mode => {
    const scope = effectScope();
    const active = ref(false);
    const session = createInteractionSession();
    scope.run(() => useInteractionBarrier(session, () => active.value));
    session.tryStart('drag', () => {
      if (mode === 'close') active.value = false;
      else scope.stop();
    });
    active.value = true;
    expect(session.current).toBeNull();
    expect(session.tryStart('next-drag', vi.fn())).not.toBeNull();
    scope.stop();
  });
});
