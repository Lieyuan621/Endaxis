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
  const dismissibleLayers = new Map<symbol, () => void>();
  let acquiring = false;
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
      if (acquiring || current.value !== null || barriers.size > 0) return null;
      acquiring = true;
      try {
        // 非模态浮层先收起，同一次 pointerdown 随后即可取得手势。
        // 关闭回调可能打开模态框，因此关闭后必须重新检查权限。
        for (const [token, dismiss] of [...dismissibleLayers].reverse()) {
          if (dismissibleLayers.has(token)) dismiss();
        }
        if (current.value !== null || barriers.size > 0 || dismissibleLayers.size > 0) return null;
      } finally {
        acquiring = false;
      }
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
    /** 非模态浮层不会占用手势；新手势开始前先同步关闭。 */
    registerDismissibleLayer(dismiss: () => void): () => void {
      const token = Symbol('dismissible-layer');
      dismissibleLayers.set(token, dismiss);
      return () => {
        dismissibleLayers.delete(token);
      };
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
