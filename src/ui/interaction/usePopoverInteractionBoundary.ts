import { useKeyboardShortcutScope } from '../keyboard/keyboardShortcutRouter';
import type { InteractionSession } from './interactionSession';
import { useInteractionBarrier } from './interactionSessionContext';

/** Interactive popovers own input while open, even if focus stays on their trigger. */
export function usePopoverInteractionBoundary(
  session: InteractionSession,
  active: () => boolean,
  close: () => void,
): void {
  useInteractionBarrier(session, active);
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
