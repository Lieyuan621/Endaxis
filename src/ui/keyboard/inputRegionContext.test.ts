import { effectScope, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { InputRegions } from './inputRegions';
import { useInputRegion } from './inputRegionContext';

describe('Vue input region lifecycle', () => {
  it('opens/closes children synchronously and restores the parent without stale activation', () => {
    const regions = new InputRegions();
    const owner = effectScope();
    const childScope = effectScope();
    const childOpen = ref(false);
    const root = owner.run(() =>
      useInputRegion(regions, { label: 'workbench', active: () => true }),
    )!;
    const child = childScope.run(() =>
      useInputRegion(regions, {
        label: 'dialog',
        parent: root,
        modal: true,
        active: () => childOpen.value,
      }),
    )!;
    try {
      expect(regions.path()).toEqual([root]);
      childOpen.value = true;
      expect(regions.path()).toEqual([child]);
      childOpen.value = false;
      expect(regions.path()).toEqual([root]);
      childOpen.value = true;
      childScope.stop();
      expect(regions.path()).toEqual([root]);
      childOpen.value = false;
      childOpen.value = true;
      expect(regions.path()).toEqual([root]);
    } finally {
      childScope.stop();
      owner.stop();
    }
    expect(regions.path()).toEqual([]);
  });

  it('parent disposal invalidates children even when their Vue scope is disposed later', () => {
    const regions = new InputRegions();
    const parentScope = effectScope();
    const childScope = effectScope();
    const open = ref(true);
    const parent = parentScope.run(() =>
      useInputRegion(regions, { label: 'parent', active: () => true }),
    )!;
    childScope.run(() =>
      useInputRegion(regions, { label: 'child', parent, active: () => open.value }),
    );
    parentScope.stop();
    expect(regions.path()).toEqual([]);
    expect(() => {
      open.value = false;
      open.value = true;
    }).not.toThrow();
    expect(regions.path()).toEqual([]);
    expect(() => childScope.stop()).not.toThrow();
  });
});
