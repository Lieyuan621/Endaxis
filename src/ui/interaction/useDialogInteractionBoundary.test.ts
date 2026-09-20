import { effectScope, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInteractionSession } from './interactionSession';
import { useDialogInteractionBoundary } from './useDialogInteractionBoundary';
import { usePopoverInteractionBoundary } from './usePopoverInteractionBoundary';
import { useKeyboardShortcutScope } from '../keyboard/keyboardShortcutRouter';
import enemy from '../timeline/components/EnemySettingsPanel.vue?raw';
import global from '../timeline/components/GlobalResourcePanel.vue?raw';
import reset from '../timeline/components/TimelineResetDialog.vue?raw';
import markerMenu from '../timeline/interaction/TimelineMarkerContextMenu.vue?raw';

describe('locally owned leaf dialog input', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('closes only the custom dialog above a popover, then gives Escape back to the popover', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const session = createInteractionSession();
    const dialog = ref(true);
    const closePopover = vi.fn();
    const closeDialog = vi.fn(() => {
      dialog.value = false;
    });
    scope.run(() => {
      usePopoverInteractionBoundary(session, () => true, closePopover);
      useDialogInteractionBoundary(session, () => dialog.value, closeDialog);
    });
    try {
      const escape = () =>
        Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
      const first = escape();
      target.dispatchEvent(first);
      expect(first.defaultPrevented).toBe(true);
      expect(closeDialog).toHaveBeenCalledOnce();
      expect(closePopover).not.toHaveBeenCalled();
      target.dispatchEvent(escape());
      expect(closePopover).toHaveBeenCalledOnce();
      expect(closeDialog).toHaveBeenCalledOnce();
    } finally {
      scope.stop();
    }
  });

  it('routes reset and marker menu Escape without independent document/window listeners', () => {
    expect(reset).toContain(
      'useDialogInteractionBoundary(session, () => props.modelValue, close, region)',
    );
    expect(markerMenu).toContain('usePopoverInteractionBoundary(');
    for (const source of [reset, markerMenu])
      expect(source).not.toContain("addEventListener('keydown'");
  });

  it('blocks background commands and leaves native Escape to the dialog above a popover', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const session = createInteractionSession();
    const dialog = ref(false);
    const popover = ref(false);
    const closePopover = vi.fn();
    const background = vi.fn(() => true);
    const cancel = vi.fn();
    scope.run(() => {
      useKeyboardShortcutScope({
        id: 'timeline',
        priority: 10,
        active: () => true,
        handle: background,
        handleClipboard: background,
      });
      usePopoverInteractionBoundary(session, () => popover.value, closePopover);
      useDialogInteractionBoundary(session, () => dialog.value);
    });
    try {
      session.tryStart('drag', cancel);
      dialog.value = true;
      expect(cancel).toHaveBeenCalledOnce();
      popover.value = true;
      const escape = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
      target.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBe(false);
      expect(closePopover).not.toHaveBeenCalled();
      target.dispatchEvent(new Event('paste', { cancelable: true }));
      expect(background).not.toHaveBeenCalled();
      expect(session.tryStart('drag', cancel)).toBeNull();
      dialog.value = false;
      expect(session.tryStart('drag', cancel)).toBeNull();
      target.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Escape' }));
      expect(closePopover).toHaveBeenCalledOnce();
      popover.value = false;
      expect(session.tryStart('drag', cancel)).not.toBeNull();
      target.dispatchEvent(new Event('paste'));
      expect(background).toHaveBeenCalledOnce();
    } finally {
      scope.stop();
    }
  });

  it('releases a local open dialog on disposal', () => {
    vi.stubGlobal('window', new EventTarget());
    const scope = effectScope();
    const session = createInteractionSession();
    scope.run(() => useDialogInteractionBoundary(session, () => true));
    expect(session.tryStart('drag', vi.fn())).toBeNull();
    scope.stop();
    expect(session.tryStart('drag', vi.fn())).not.toBeNull();
  });

  it('registers local enemy and global attribute dialog lifecycles', () => {
    expect(enemy).toContain('label="enemy-selection" :active="selectorVisible" modal');
    expect(enemy).toContain('label="enemy-stats" :active="statsVisible" modal');
    expect(global).toContain('label="global-modifiers" :active="editorVisible" modal');
    expect(enemy).toContain("emit('save', cloneEditorDefinition(draft))");
  });
});
