export type ShortcutTargetLike =
  | {
      tagName?: string | null;
      isContentEditable?: boolean;
    }
  | null
  | undefined;

export function isEditableShortcutTarget(target: ShortcutTargetLike): boolean {
  const tagName = typeof target?.tagName === 'string' ? target.tagName.toUpperCase() : '';
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    Boolean(target?.isContentEditable)
  );
}

export type TimelineShortcutScopeState = {
  hasOpenDialog?: boolean;
  hasOpenElementPlusDialog?: boolean;
  hasTimelineGridDialog?: boolean;
};

export function isTimelineShortcutScopeBlocked(state: TimelineShortcutScopeState = {}): boolean {
  return Boolean(
    state.hasOpenDialog || state.hasOpenElementPlusDialog || state.hasTimelineGridDialog,
  );
}

export type TimelineGridDialogState = {
  operator?: boolean;
  weapon?: boolean;
  equipment?: boolean;
  statDetail?: boolean;
  hitDetail?: boolean;
};

export function hasAnyTimelineGridDialogState(state: TimelineGridDialogState): boolean {
  return Boolean(
    state.operator || state.weapon || state.equipment || state.statDetail || state.hitDetail,
  );
}

// 临时兼容：Element Plus 关闭弹窗后可能保留隐藏的 overlay DOM，不能只靠 selector 存在性判断。
// 后续应改成弹窗主动注册 shortcut scope，避免在全局快捷键逻辑里扫描具体 UI 库的 DOM。
type VisibleElementLike = {
  getAttribute?: (name: string) => string | null;
  getBoundingClientRect?: () => { width?: number; height?: number };
  ownerDocument?: {
    defaultView?: {
      getComputedStyle?: (element: VisibleElementLike) => {
        display?: string;
        visibility?: string;
      };
    } | null;
  } | null;
};

type DialogRootLike = {
  querySelectorAll?: (selector: string) => Iterable<VisibleElementLike>;
};

function isVisiblyRenderedElement(element: VisibleElementLike | null | undefined): boolean {
  if (!element) return false;
  if (element.getAttribute?.('aria-hidden') === 'true') return false;

  const style = element.ownerDocument?.defaultView?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden') return false;

  const rect = element.getBoundingClientRect?.();
  if (!rect) return true;
  return (Number(rect.width) || 0) > 0 && (Number(rect.height) || 0) > 0;
}

export function hasVisibleElementPlusDialog(
  root: DialogRootLike | null | undefined = typeof document === 'undefined' ? null : document,
): boolean {
  const overlays = Array.from(root?.querySelectorAll?.('.el-overlay') ?? []);
  return overlays.some(overlay => {
    if (!isVisiblyRenderedElement(overlay)) return false;
    const dialog = (
      overlay as VisibleElementLike & {
        querySelector?: (selector: string) => VisibleElementLike | null;
      }
    ).querySelector?.('.el-dialog');
    return isVisiblyRenderedElement(dialog);
  });
}
