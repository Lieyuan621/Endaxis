import { useKeyboardShortcutScope } from '../keyboard/keyboardShortcutRouter';
import type { InteractionSession } from './interactionSession';
import type { InputRegion } from '../keyboard/inputRegions';
import { useInteractionBarrier } from './interactionSessionContext';

/** Leaf dialogs own background input; their dialog library retains Escape and focus handling.
 * Not for containers with nested command editors: those need an explicit child scope hierarchy.
 */
export function useDialogInteractionBoundary(
  session: InteractionSession,
  active: () => boolean,
  close?: () => void,
  region?: InputRegion,
): void {
  useInteractionBarrier(session, active);
  useKeyboardShortcutScope({
    id: 'leaf-dialog',
    region,
    priority: region ? 0 : 1500,
    active,
    blockLowerScopes: true,
    handle: event => {
      if (event.key !== 'Escape' || close === undefined) return false;
      close();
      return true;
    },
  });
}
