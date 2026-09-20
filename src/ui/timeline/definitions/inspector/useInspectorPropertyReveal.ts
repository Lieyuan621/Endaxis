import { nextTick, onScopeDispose, type Ref } from 'vue';
import type { InspectorPropertyPath } from './inspectorProperty';

/** 仅改变视图：不触发输入事件，不启用被省略/禁用的字段，不提交草稿。 */
export function revealInspectorProperty(
  root: HTMLElement,
  path: InspectorPropertyPath,
  allowContainer = false,
): boolean {
  const key = JSON.stringify(path);
  const fields = Array.from(root.querySelectorAll<HTMLElement>('[data-property-path]'));
  // 透明联合可能与内部字段使用相同路径，优先选择最内层。
  const field = fields.filter(element => element.dataset.propertyPath === key).at(-1);
  if (!field) return false;
  const control = field.querySelector<HTMLElement>(
    'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
  );
  if (!control && !allowContainer) return false;
  let parent: HTMLElement | null = field;
  while (parent && root.contains(parent)) {
    if (parent.tagName === 'DETAILS') (parent as HTMLDetailsElement).open = true;
    parent = parent.parentElement;
  }
  if (!control) field.tabIndex = -1;
  (control ?? field).focus({ preventScroll: true });
  field.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}

/** 异步编辑器挂载后再定位；新请求和卸载会取消旧请求，禁止持续抢焦点。 */
export function useInspectorPropertyReveal(root: Ref<HTMLElement | null>) {
  let revision = 0;
  let stop = () => {};
  onScopeDispose(() => {
    revision++;
    stop();
  });
  return async (path?: InspectorPropertyPath) => {
    const current = ++revision;
    stop();
    if (!path) return;
    await nextTick();
    const element = root.value;
    if (current !== revision || !element) return;
    if (revealInspectorProperty(element, path)) return;
    const observer = new MutationObserver(() => {
      if (current === revision && revealInspectorProperty(element, path)) stop();
    });
    const timer = setTimeout(() => {
      if (current === revision) revealInspectorProperty(element, path, true);
      stop();
    }, 1000);
    stop = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    observer.observe(element, { childList: true, subtree: true });
  };
}
