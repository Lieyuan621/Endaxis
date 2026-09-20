import { effectScope, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import {
  useInputRegionEligibility,
  useKeyboardInputRegion,
} from '../keyboard/keyboardShortcutRouter';
import { useInteractionBarrier } from './interactionSessionContext';
import { createInteractionSession } from './interactionSession';

describe('region-owned gesture isolation', () => {
  it('keeps modal gestures usable while the background is blocked and cancels them for a picker', () => {
    const scope = effectScope();
    const dialog = ref(false);
    const picker = ref(false);
    const background = createInteractionSession();
    const editor = createInteractionSession();
    const cancelled = vi.fn();
    scope.run(() => {
      const root = useKeyboardInputRegion({ label: 'root', parent: null, active: () => true });
      const rootEligible = useInputRegionEligibility(root);
      useInteractionBarrier(background, () => !rootEligible.value);
      const modal = useKeyboardInputRegion({
        label: 'editor',
        parent: root,
        modal: true,
        active: () => dialog.value,
      });
      const modalEligible = useInputRegionEligibility(modal);
      useInteractionBarrier(editor, () => !modalEligible.value);
      useInteractionBarrier(editor, () => picker.value);
    });
    expect(editor.tryStart('node', cancelled)).toBeNull();
    dialog.value = true;
    expect(background.tryStart('cast', vi.fn())).toBeNull();
    expect(editor.tryStart('node', cancelled)).not.toBeNull();
    picker.value = true;
    expect(cancelled).toHaveBeenCalledOnce();
    expect(editor.tryStart('pan', vi.fn())).toBeNull();
    picker.value = false;
    expect(editor.tryStart('pan', cancelled)).not.toBeNull();
    dialog.value = false;
    expect(cancelled).toHaveBeenCalledTimes(2);
    expect(background.tryStart('cast', vi.fn())).not.toBeNull();
    scope.stop();
  });

  it('cancels and blocks background gestures until the last modal descendant closes', () => {
    const scope = effectScope();
    const dialog = ref(false);
    const child = ref(false);
    const session = createInteractionSession();
    const cancelled = vi.fn();
    scope.run(() => {
      const root = useKeyboardInputRegion({ label: 'root', parent: null, active: () => true });
      const eligible = useInputRegionEligibility(root);
      useInteractionBarrier(session, () => !eligible.value);
      const modal = useKeyboardInputRegion({
        label: 'dialog',
        parent: root,
        modal: true,
        active: () => dialog.value,
      });
      useKeyboardInputRegion({
        label: 'child',
        parent: modal,
        modal: true,
        active: () => child.value,
      });
    });
    expect(session.tryStart('cast', cancelled)).not.toBeNull();
    dialog.value = true;
    expect(cancelled).toHaveBeenCalledOnce();
    expect(session.tryStart('resize', vi.fn())).toBeNull();
    child.value = true;
    dialog.value = false;
    expect(session.tryStart('cast', vi.fn())).toBeNull();
    child.value = false;
    expect(session.tryStart('cast', vi.fn())).not.toBeNull();
    scope.stop();
  });
});
