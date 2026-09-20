import { onScopeDispose } from 'vue';
import { useKeyboardModalBoundary } from '../keyboard/keyboardShortcutRouter';
import type { InteractionSession } from './interactionSession';
import { createAsyncModalBoundary } from './asyncModalBoundary';
import type { InputRegion } from '../keyboard/inputRegions';

export function useAsyncModalBoundary(session: InteractionSession, region?: InputRegion) {
  const boundary = createAsyncModalBoundary(session, useKeyboardModalBoundary(region));
  onScopeDispose(() => boundary.dispose());
  return boundary;
}
