import { inject, onScopeDispose, provide, watch, type InjectionKey } from 'vue';
import {
  useInputRegionEligibility,
  useKeyboardShortcutScope,
} from '../keyboard/keyboardShortcutRouter';
import { createInteractionSession, type InteractionSession } from './interactionSession';
import type { InputRegion } from '../keyboard/inputRegions';

const interactionSessionKey: InjectionKey<InteractionSession> = Symbol('workbench-interaction');

/** Register a background-gesture barrier for a panel's actual open lifecycle. */
export function useInteractionBarrier(session: InteractionSession, active: () => boolean): void {
  let release: (() => void) | undefined;
  let revision = 0;
  let disposed = false;
  const releaseCurrent = () => {
    const previous = release;
    release = undefined;
    previous?.();
  };
  onScopeDispose(() => {
    disposed = true;
    revision++;
    releaseCurrent();
  });
  watch(
    active,
    blocked => {
      if (disposed) return;
      const attempt = ++revision;
      if (blocked) {
        if (release) return;
        // block() synchronously cancels the previous gesture. That callback may
        // close/reopen this panel or dispose its scope before the lease returns.
        const acquired = session.block();
        if (disposed || attempt !== revision) acquired();
        else release = acquired;
      } else {
        releaseCurrent();
      }
    },
    { immediate: true, flush: 'sync' },
  );
}

export function provideInteractionSession(region?: InputRegion): InteractionSession {
  const session = createInteractionSession();
  provide(interactionSessionKey, session);
  if (region) {
    const eligible = useInputRegionEligibility(region);
    useInteractionBarrier(session, () => !eligible.value);
  }
  useKeyboardShortcutScope({
    id: 'workbench-gesture',
    region,
    priority: 1000,
    active: () => session.current !== null,
    blockLowerScopes: true,
    handle: event => event.key === 'Escape' && session.cancel(),
  });
  const cancel = () => {
    session.cancel();
  };
  if (typeof window !== 'undefined') window.addEventListener('blur', cancel);
  onScopeDispose(() => {
    if (typeof window !== 'undefined') window.removeEventListener('blur', cancel);
    session.cancel();
  });
  return session;
}

/** Standalone shells still work; descendants of an editor share its ownership boundary. */
export function useInteractionSession(): InteractionSession {
  const inherited = inject(interactionSessionKey, null);
  return inherited ?? provideInteractionSession();
}
