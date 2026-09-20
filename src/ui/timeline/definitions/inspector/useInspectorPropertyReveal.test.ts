import { effectScope, nextTick, shallowRef } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { revealInspectorProperty, useInspectorPropertyReveal } from './useInspectorPropertyReveal';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function fixture() {
  const focus = vi.fn();
  const control = { focus };
  const details = { tagName: 'DETAILS', open: false, parentElement: null };
  const field = {
    dataset: { propertyPath: JSON.stringify(['parameters', 'items', 0, 'a.b']) },
    tagName: 'DIV',
    parentElement: details,
    tabIndex: 0,
    querySelector: vi.fn((): unknown => control),
    focus: vi.fn(),
    scrollIntoView: vi.fn(),
  };
  const root = { querySelectorAll: vi.fn(() => [field]), contains: () => true };
  return { root: root as unknown as HTMLElement, field, details, focus };
}
it('精确匹配路径段并展开祖先，只聚焦而不触发输入事件', () => {
  const { root, field, details, focus } = fixture();
  expect(revealInspectorProperty(root, ['parameters', 'items', 0, 'a.b'])).toBe(true);
  expect(details.open).toBe(true);
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(field.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(revealInspectorProperty(root, ['parameters', 'items', 0, 'a', 'b'])).toBe(false);
});
it('等待异步控件，不把未挂载控件误判为可聚焦；禁用时可以定位容器', () => {
  const { root, field } = fixture();
  field.querySelector.mockReturnValue(null);
  const path = ['parameters', 'items', 0, 'a.b'];
  expect(revealInspectorProperty(root, path)).toBe(false);
  expect(revealInspectorProperty(root, path, true)).toBe(true);
  expect(field.tabIndex).toBe(-1);
  expect(field.focus).toHaveBeenCalledTimes(1);
});
it('挂载完成后定位一次，取消或卸载不留下监听器和定时器', async () => {
  vi.useFakeTimers();
  const { root, field, focus } = fixture();
  field.querySelector.mockReturnValue(null);
  let notify = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const scope = effectScope();
  const reveal = scope.run(() => useInspectorPropertyReveal(shallowRef(root)))!;
  await reveal(['parameters', 'items', 0, 'a.b']);
  field.querySelector.mockReturnValue({ focus });
  notify();
  expect(focus).toHaveBeenCalledTimes(1);
  expect(disconnect).toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  field.querySelector.mockReturnValue(null);
  await reveal(['parameters', 'items', 0, 'a.b']);
  scope.stop();
  await nextTick();
  expect(vi.getTimerCount()).toBe(0);
});
