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
  const stop = watch(
    options.active,
    active => {
      if (!regions.contains(region)) return;
      if (active) release ??= regions.activate(region);
      else {
        release?.();
        release = undefined;
      }
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => {
    stop();
    release?.();
    regions.dispose(region);
  });
  return region;
}
