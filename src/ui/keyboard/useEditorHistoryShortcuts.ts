import { nextTick, onMounted, onScopeDispose, ref, type Ref } from 'vue';
import { useKeyboardShortcutScope } from './keyboardShortcutRouter';

/** 同一保存范围的输入框与图共用撤销；复制、粘贴和光标操作仍由浏览器处理。 */
export function useEditorHistoryShortcuts(
  root: Ref<HTMLElement | null>,
  restore: (action: 'undo' | 'redo') => unknown,
  enabled: () => boolean = () => true,
) {
  const active = ref(false);
  let disposed = false;
  const track = (event: Event) => {
    // Inspector 根只覆盖内容区；标题、底栏和留白仍属于同一编辑弹窗。
    // 不跨越最近的 dialog，嵌套弹窗的优先权继续由统一输入区域路由决定。
    const owner = root.value?.closest('[role="dialog"], .el-dialog') ?? root.value;
    active.value = event.target instanceof Node && (owner?.contains(event.target) ?? false);
  };
  onMounted(() => {
    if (typeof document === 'undefined') return;
    document.addEventListener('pointerdown', track, true);
    document.addEventListener('focusin', track, true);
  });
  onScopeDispose(() => {
    disposed = true;
    if (typeof document === 'undefined') return;
    document.removeEventListener('pointerdown', track, true);
    document.removeEventListener('focusin', track, true);
  });
  useKeyboardShortcutScope({
    id: 'editor-history',
    priority: 150,
    active: () => active.value && enabled(),
    handle: event => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.isComposing) return false;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return false;
      const action = key === 'y' || event.shiftKey ? 'redo' : 'undo';
      const input =
        typeof HTMLElement !== 'undefined' && event.target instanceof HTMLElement
          ? event.target.closest<HTMLElement>('input, textarea, select, [contenteditable="true"]')
          : null;
      if (input) {
        // change/blur 控件先提交当前值，等待 Vue 将父草稿传回后再移动共享历史游标。
        input.blur();
        void nextTick(() => {
          if (!disposed && enabled()) restore(action);
        });
      } else restore(action);
      return true;
    },
  });
}
