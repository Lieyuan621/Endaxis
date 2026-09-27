import {
  getCurrentInstance,
  hasInjectionContext,
  inject,
  onScopeDispose,
  provide,
  watch,
  type InjectionKey,
} from 'vue';
import type { InputRegion, InputRegions } from './inputRegions';

const inputRegionKey: InjectionKey<InputRegion> = Symbol('keyboard-input-region');

export function inheritedInputRegion(): InputRegion | undefined {
  return hasInjectionContext() ? inject(inputRegionKey, undefined) : undefined;
}

export interface InputRegionOptions {
  readonly label: string;
  /** Explicit parent is also required for a region created in the same setup as its parent. */
  readonly parent?: InputRegion | null;
  readonly modal?: boolean;
  readonly active: () => boolean;
}

/** Vue ancestry survives Teleport; DOM ancestry is deliberately not consulted here. */
export function useInputRegion(regions: InputRegions, options: InputRegionOptions): InputRegion {
  const parent = options.parent === undefined ? (inheritedInputRegion() ?? null) : options.parent;
  const region = regions.create(options.label, parent, options.modal ?? false);
  if (getCurrentInstance()) provide(inputRegionKey, region);
  let release: (() => void) | undefined;
  let revision = 0;
  let disposed = false;
  const stop = watch(
    options.active,
    active => {
      if (disposed || !regions.contains(region)) return;
      const attempt = ++revision;
      if (active) {
        if (release) return;
        // 激活通知可能同步关闭面板；返回的句柄不能留给已经关闭的区域。
        const acquired = regions.activate(region);
        if (disposed || attempt !== revision || !options.active()) acquired();
        else release = acquired;
      } else {
        const previous = release;
        release = undefined;
        previous?.();
      }
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => {
    disposed = true;
    revision++;
    stop();
    const previous = release;
    release = undefined;
    previous?.();
    regions.dispose(region);
  });
  return region;
}
