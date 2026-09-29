import { useKeyboardShortcutScope } from '../keyboard/keyboardShortcutRouter';
import type { InteractionSession } from './interactionSession';
import { watch } from 'vue';

/** 非模态浮层拥有键盘输入；背景手势可在同步收起浮层后直接开始。 */
export function usePopoverInteractionBoundary(
  session: InteractionSession,
  active: () => boolean,
  close: () => void,
): void {
  watch(
    active,
    (open, _previous, onCleanup) => {
      if (!open) return;
      const unregister = session.registerDismissibleLayer(close);
      onCleanup(unregister);
      session.cancel();
    },
    { immediate: true, flush: 'sync' },
  );
  useKeyboardShortcutScope({
    id: 'interactive-popover',
    priority: 400,
    active,
    blockLowerScopes: true,
    handle: event => {
      if (event.key !== 'Escape') return false;
      close();
      return true;
    },
  });
}
