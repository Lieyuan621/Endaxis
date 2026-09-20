import type { InteractionSession } from './interactionSession';

/** Service-created modals have a promise lifetime, rather than a component open prop. */
export function createAsyncModalBoundary(
  session: InteractionSession,
  acquireInputBoundary: () => () => void = () => () => {},
) {
  const pending = new Map<symbol, () => void>();
  let releaseInput: (() => void) | undefined;
  const releaseIdleInput = () => {
    if (pending.size !== 0) return;
    const release = releaseInput;
    releaseInput = undefined;
    release?.();
  };
  let disposed = false;
  return {
    get active(): boolean {
      return pending.size > 0;
    },
    async run<T>(open: () => T | PromiseLike<T>): Promise<T> {
      if (disposed) throw new Error('Modal owner has been disposed');
      const token = Symbol('async-modal');
      // Keyboard isolation must already be active during gesture cancellation callbacks.
      pending.set(token, () => {});
      let release = () => {};
      try {
        // Concurrent service promises share isolation until the last one settles.
        releaseInput ??= acquireInputBoundary();
        release = session.block();
        if (disposed) throw new Error('Modal owner has been disposed');
        pending.set(token, release);
        const result = await open();
        if (disposed) throw new Error('Modal owner has been disposed');
        return result;
      } finally {
        pending.delete(token);
        release();
        releaseIdleInput();
      }
    },
    dispose(): void {
      disposed = true;
      for (const release of pending.values()) release();
      pending.clear();
      releaseIdleInput();
    },
  };
}
