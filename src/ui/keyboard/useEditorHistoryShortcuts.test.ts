import { createRenderer, defineComponent, nextTick, ref } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import type { KeyboardShortcutScope } from './keyboardShortcutRouter';
import { useEditorHistoryShortcuts } from './useEditorHistoryShortcuts';
import { useDefinitionDraftHistory } from '../timeline/definitions/useDefinitionDraftHistory';

const capture = vi.hoisted(() => ({ scope: undefined as KeyboardShortcutScope | undefined }));
vi.mock('./keyboardShortcutRouter', () => ({
  useKeyboardShortcutScope: (scope: KeyboardShortcutScope) => {
    capture.scope = scope;
  },
}));
afterEach(() => vi.unstubAllGlobals());

it.each(['input', 'textarea', 'select', 'contenteditable'])(
  '%s 内直接撤销共享草稿，先提交失焦修改再撤销，支持重做',
  async tag => {
    class Element extends EventTarget {
      inEditor = true;
      inDialog = true;
      blur = vi.fn();
      contains(target: unknown) {
        return target instanceof Element && target.inEditor;
      }
      closest(selector: string) {
        return selector.includes(tag === 'contenteditable' ? '[contenteditable="true"]' : tag)
          ? this
          : null;
      }
    }
    const document = new EventTarget();
    vi.stubGlobal('document', document);
    vi.stubGlobal('Node', Element);
    vi.stubGlobal('HTMLElement', Element);
    const input = new Element();
    const root = new Element();
    const dialog = new Element();
    root.closest = selector => (selector.includes('[role="dialog"]') ? dialog : null);
    dialog.contains = target => target instanceof Element && target.inDialog;
    const draft = ref({ value: 1 });
    let history!: ReturnType<typeof useDefinitionDraftHistory<{ value: number }>>;
    const renderer = createRenderer<object, object>({
      insert() {},
      remove() {},
      patchProp() {},
      setText() {},
      setElementText() {},
      createElement: () => ({}),
      createText: () => ({}),
      createComment: () => ({}),
      parentNode: () => null,
      nextSibling: () => null,
    });
    const app = renderer.createApp(
      defineComponent({
        setup() {
          history = useDefinitionDraftHistory(
            () => draft.value,
            next => {
              draft.value = next;
            },
          );
          useEditorHistoryShortcuts(ref(root as unknown as HTMLElement), history.restore);
          return () => null;
        },
      }),
    );
    app.mount({});
    try {
      history.commit({ value: 2 });
      // 模拟 number/change 控件尚未提交的 3；不能直接撤销成更早的 1。
      input.blur.mockImplementationOnce(() => history.commit({ value: 3 }));
      const focus = new Event('focusin');
      Object.defineProperty(focus, 'target', { value: input });
      document.dispatchEvent(focus);
      expect(capture.scope!.active()).toBe(true);
      const key = (key: string, extra = {}) =>
        ({ key, ctrlKey: true, target: input, ...extra }) as unknown as KeyboardEvent;
      expect(capture.scope!.handle(key('z'))).toBe(true);
      expect(draft.value.value).toBe(3);
      await nextTick();
      expect(draft.value.value).toBe(2);
      expect(capture.scope!.handle(key('z', { shiftKey: true }))).toBe(true);
      await nextTick();
      expect(draft.value.value).toBe(3);
      expect(capture.scope!.handle(key('c'))).toBe(false);
      expect(capture.scope!.handle(key('z', { isComposing: true }))).toBe(false);
      expect(capture.scope!.handle(key('z', { altKey: true }))).toBe(false);
      // 点击不属于 Inspector 内容根的弹窗留白，仍能撤销同一保存范围。
      const blank = new Element();
      blank.inEditor = false;
      blank.closest = () => null;
      const point = new Event('pointerdown');
      Object.defineProperty(point, 'target', { value: blank });
      document.dispatchEvent(point);
      expect(capture.scope!.active()).toBe(true);
      capture.scope!.handle(key('z', { target: blank }));
      expect(draft.value.value).toBe(2);
      capture.scope!.handle(key('y', { target: blank }));
      expect(draft.value.value).toBe(3);
      blank.inDialog = false;
      document.dispatchEvent(point);
      expect(capture.scope!.active()).toBe(false);
      document.dispatchEvent(focus);
      // 页面切换后不执行已经排队的撤销。
      capture.scope!.handle(key('z'));
      app.unmount();
      await nextTick();
      expect(draft.value.value).toBe(3);
    } finally {
      app.unmount();
    }
  },
);
