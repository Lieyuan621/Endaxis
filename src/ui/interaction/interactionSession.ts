import { shallowRef } from 'vue';

export interface InteractionLease {
  readonly owner: string;
  /** Persistent pointer modes may keep gesture ownership without swallowing editor shortcuts. */
  readonly blocksKeyboard: boolean;
  readonly isCurrent: () => boolean;
  readonly release: () => void;
}

export interface InteractionLeaseOptions {
  readonly blocksKeyboard?: boolean;
}

/** One workbench, one editing gesture. Labels describe owners; leases identify attempts. */
export function createInteractionSession() {
  const current = shallowRef<InteractionLease | null>(null);
  const barriers = new Set<symbol>();
  let cancelCurrent: (() => void) | null = null;
  function cancel(): boolean {
    const callback = cancelCurrent;
    if (callback === null) return false;
    current.value = null;
    cancelCurrent = null;
    callback();
    return true;
  }
  return {
    get current() {
      return current.value;
    },
    tryStart(
      owner: string,
      onCancel: () => void,
      options: InteractionLeaseOptions = {},
    ): InteractionLease | null {
      if (current.value !== null || barriers.size > 0) return null;
      const lease: InteractionLease = {
        owner,
        blocksKeyboard: options.blocksKeyboard ?? true,
        isCurrent: () => current.value === lease,
        release: () => {
          if (current.value !== lease) return;
          current.value = null;
          cancelCurrent = null;
        },
      };
      current.value = lease;
      cancelCurrent = onCancel;
      return lease;
    },
    /** A modal boundary blocks new gestures before cancelling the old owner's preview. */
    block(): () => void {
      const token = Symbol('interaction-barrier');
      barriers.add(token);
      try {
        cancel();
      } catch (error) {
        barriers.delete(token);
        throw error;
      }
      return () => {
        barriers.delete(token);
      };
    },
    cancel,
  };
}

export type InteractionSession = ReturnType<typeof createInteractionSession>;
