import { onScopeDispose, readonly, shallowRef, watchEffect } from 'vue';
import { InputRegions, type InputRegion } from './inputRegions';
import {
  inheritedInputRegion,
  useInputRegion,
  type InputRegionOptions,
} from './inputRegionContext';

/**
 * 页面级快捷键作用域。优先级较高的活动作用域先获得按键，处理后不会继续穿透。
 * 弹窗、菜单和编辑器可分别注册作用域，避免在组件中散落 window 监听器。
 */
export interface KeyboardShortcutScope {
  readonly id: string;
  readonly region?: InputRegion;
  readonly priority: number;
  readonly active: () => boolean;
  readonly handle: (event: KeyboardEvent) => boolean;
  /** Browser edit menus dispatch clipboard events without a keydown. Same owner, same commands. */
  readonly handleClipboard?: (event: ClipboardEvent) => boolean;
  /** Passive held-key preview, never a command. null revokes ownership or clears focus. */
  readonly observeKeyboardState?: (event: KeyboardEvent | null) => void;
  /** 当前作用域未处理该键时，是否仍阻止更低层页面快捷键接管。 */
  readonly blockLowerScopes?: boolean;
}

interface RegisteredKeyboardShortcutScope extends KeyboardShortcutScope {
  readonly order: number;
}

/** 文本编辑控件应保留浏览器原生复制、粘贴和光标操作。 */
export function isTextEditingTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

/**
 * 传送到 document.body 的弹窗、菜单和可交互浮层不一定能由页面组件状态感知。
 * 在统一路由边界识别它们，避免按钮上的 Delete/Ctrl+C 等继续落到时间轴。
 */
export function isKeyboardShortcutIsolationTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  return (
    isTextEditingTarget(target) ||
    target.closest(
      '.el-overlay, .el-popper, [role="dialog"], [role="menu"], [data-keyboard-shortcut-scope="overlay"]',
    ) !== null
  );
}

export class KeyboardShortcutRouter {
  readonly regions = new InputRegions();
  constructor() {
    this.regions.onChange(() => this.revokeInactiveKeyboardState());
  }
  // id is a diagnostic label, not a component-instance identity.
  readonly #scopes = new Map<number, RegisteredKeyboardShortcutScope>();
  #nextOrder = 0;
  readonly #serviceRegions = new Map<
    InputRegion,
    {
      children: number;
      closed: boolean;
      finalize: () => void;
    }
  >();

  /** Service dialogs inherit the foreground at opening, not their caller's setup context. */
  acquireModalBoundary(owner?: InputRegion): () => void {
    const parent = this.regions.path()[0] ?? owner ?? null;
    if (owner) {
      let ancestor = parent;
      while (ancestor && ancestor !== owner) ancestor = ancestor.parent;
      if (!ancestor || !this.regions.contains(owner))
        throw new Error('Modal owner is not in the active input branch');
    }
    const region = this.regions.create('service-modal', parent, true);
    let ancestor = parent;
    while (ancestor && !this.#serviceRegions.has(ancestor)) ancestor = ancestor.parent;
    const parentService = ancestor ? this.#serviceRegions.get(ancestor) : undefined;
    if (parentService) parentService.children++;
    const unregister = this.register({
      id: 'service-modal',
      region,
      priority: 0,
      active: () => true,
      blockLowerScopes: true,
      handle: () => false,
    });
    const deactivate = this.regions.activate(region);
    const entry = {
      children: 0,
      closed: false,
      finalize: () => {
        if (!entry.closed || entry.children !== 0) return;
        this.#serviceRegions.delete(region);
        this.regions.dispose(region);
        if (parentService) {
          parentService.children--;
          parentService.finalize();
        }
      },
    };
    this.#serviceRegions.set(region, entry);
    return () => {
      if (entry.closed) return;
      entry.closed = true;
      unregister();
      deactivate();
      // A parent promise may settle before a nested service dialog. Keep its
      // region identity alive until descendants close, but never reactivate it.
      entry.finalize();
    };
  }

  register(scope: KeyboardShortcutScope): () => void {
    const registered = { ...scope, order: this.#nextOrder++ };
    this.#scopes.set(registered.order, registered);
    return () => {
      this.#scopes.delete(registered.order);
    };
  }

  route(event: KeyboardEvent): boolean {
    this.updateKeyboardState(event);
    // An IME owns its composition keys; a previously handled event is not a new command.
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return false;
    return this.#dispatch(event, scope => scope.handle(event));
  }

  updateKeyboardState(event: KeyboardEvent | null): void {
    const eligible = this.#keyboardStateOwners();
    for (const scope of this.#scopes.values()) {
      scope.observeKeyboardState?.(eligible.has(scope.order) ? event : null);
    }
  }

  revokeInactiveKeyboardState(): void {
    const eligible = this.#keyboardStateOwners();
    for (const scope of this.#scopes.values()) {
      if (!eligible.has(scope.order)) scope.observeKeyboardState?.(null);
    }
  }

  #keyboardStateOwners(): Set<number> {
    const owners = new Set<number>();
    const active = this.#candidates();
    for (const scope of active) {
      owners.add(scope.order);
      if (scope.blockLowerScopes) break;
    }
    return owners;
  }

  #candidates(): RegisteredKeyboardShortcutScope[] {
    const path = this.regions.path();
    return [...this.#scopes.values()]
      .filter(
        scope =>
          scope.active() &&
          (path.length === 0
            ? scope.region === undefined
            : scope.region !== undefined && path.includes(scope.region)),
      )
      .sort((a, b) => {
        const depth = path.indexOf(a.region!) - path.indexOf(b.region!);
        return depth || b.priority - a.priority || b.order - a.order;
      });
  }

  routeClipboard(event: ClipboardEvent): boolean {
    if (
      event.defaultPrevented ||
      (event.type !== 'copy' && event.type !== 'paste') ||
      isTextEditingTarget(event.target)
    )
      return false;
    return this.#dispatch(event, scope => scope.handleClipboard?.(event) ?? false);
  }

  #dispatch(event: Event, handle: (scope: RegisteredKeyboardShortcutScope) => boolean): boolean {
    const activeScopes = this.#candidates();

    for (const scope of activeScopes) {
      if (handle(scope)) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      if (scope.blockLowerScopes) break;
    }
    return false;
  }
}

const pageKeyboardShortcutRouter = new KeyboardShortcutRouter();
export function useKeyboardInputRegion(options: InputRegionOptions): InputRegion {
  return useInputRegion(pageKeyboardShortcutRouter.regions, options);
}

/** Gesture ownership uses the same modal path as keyboard and clipboard routing. */
export function useInputRegionEligibility(region: InputRegion) {
  const regions = pageKeyboardShortcutRouter.regions;
  const eligible = shallowRef(regions.path().includes(region));
  const unsubscribe = regions.onChange(() => {
    eligible.value = regions.path().includes(region);
  });
  onScopeDispose(unsubscribe);
  return readonly(eligible);
}
let listening = false;
let pageScopeCount = 0;

function routePageKeyboardEvent(event: KeyboardEvent): void {
  pageKeyboardShortcutRouter.route(event);
}

function routePageClipboardEvent(event: ClipboardEvent): void {
  pageKeyboardShortcutRouter.routeClipboard(event);
}

function updatePageKeyboardState(event: KeyboardEvent): void {
  pageKeyboardShortcutRouter.updateKeyboardState(event);
}

function clearPageKeyboardState(): void {
  pageKeyboardShortcutRouter.updateKeyboardState(null);
}

function ensurePageListener(): void {
  if (listening || typeof window === 'undefined') return;
  window.addEventListener('keydown', routePageKeyboardEvent, true);
  window.addEventListener('copy', routePageClipboardEvent, true);
  window.addEventListener('paste', routePageClipboardEvent, true);
  window.addEventListener('keyup', updatePageKeyboardState, true);
  window.addEventListener('blur', clearPageKeyboardState);
  listening = true;
}

/** 注册随 Vue 作用域自动释放的页面级快捷键作用域。 */
export function useKeyboardShortcutScope(scope: KeyboardShortcutScope): void {
  usePageKeyboardRouter();
  const unregister = pageKeyboardShortcutRouter.register({
    ...scope,
    region: scope.region ?? inheritedInputRegion(),
  });
  const stopWatching = watchEffect(() => pageKeyboardShortcutRouter.revokeInactiveKeyboardState(), {
    flush: 'sync',
  });
  onScopeDispose(() => {
    stopWatching();
    scope.observeKeyboardState?.(null);
    unregister();
  });
}

export function useKeyboardModalBoundary(owner?: InputRegion): () => () => void {
  usePageKeyboardRouter();
  const parent = owner ?? inheritedInputRegion();
  return () => pageKeyboardShortcutRouter.acquireModalBoundary(parent);
}

function usePageKeyboardRouter(): void {
  ensurePageListener();
  pageScopeCount += 1;
  onScopeDispose(() => {
    pageScopeCount -= 1;
    if (pageScopeCount === 0 && listening && typeof window !== 'undefined') {
      window.removeEventListener('keydown', routePageKeyboardEvent, true);
      window.removeEventListener('copy', routePageClipboardEvent, true);
      window.removeEventListener('paste', routePageClipboardEvent, true);
      window.removeEventListener('keyup', updatePageKeyboardState, true);
      window.removeEventListener('blur', clearPageKeyboardState);
      listening = false;
    }
  });
}
