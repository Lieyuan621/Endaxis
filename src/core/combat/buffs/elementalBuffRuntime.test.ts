import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import {
  compileCombatBuffDefinitions,
  type CombatBuffDefinitionsDocument,
} from './combatBuffDefinitions';
import { resolveElementalInfliction } from '../infliction/elementalInfliction';
import { ElementalBuffRuntime } from './elementalBuffRuntime';

const DOCUMENT: CombatBuffDefinitionsDocument = {
  schemaVersion: 1,
  revision: 'test',
  buffs: [
    {
      id: 'heat-attachment',
      stackingType: 'enhanceAndRefresh',
      maxStackCount: 4,
      durationSeconds: 1 / 30,
      role: { kind: 'elementalAttachment', element: 'heat' },
    },
    {
      id: 'heat-burst',
      stackingType: 'highPriority',
      role: { kind: 'elementalBurst', element: 'heat' },
    },
    {
      id: 'heat-electric-status',
      stackingType: 'highPriority',
      role: {
        kind: 'compoundStatus',
        consumedElement: 'heat',
        incomingElement: 'electric',
      },
    },
  ],
};

function createRuntime() {
  return new ElementalBuffRuntime({
    ownerId: 'enemy',
    attributes: new CombatAttributeSet(),
    index: compileCombatBuffDefinitions(DOCUMENT, {
      emitElementalInflictionStarted: vi.fn(),
    }),
  });
}

describe('ElementalBuffRuntime', () => {
  it('uses one container for generic Buff operations, infliction writes, and frame expiry', () => {
    const runtime = createRuntime();
    const adapter = runtime.createInflictionAdapter('operator');

    for (const operation of resolveElementalInfliction('heat', adapter.getExistingAttachment())) {
      adapter.apply(operation);
    }

    expect(runtime.ownerId).toBe('enemy');
    expect(runtime.getCountByIds(['heat-attachment'])).toBe(1);
    expect(adapter.getExistingAttachment()).toEqual({ element: 'heat', layers: 1 });

    runtime.advanceFrame();

    expect(runtime.getCountByIds(['heat-attachment'])).toBe(0);
    expect(adapter.getExistingAttachment()).toBeNull();
  });

  it('keeps projected attachment state local to each skill adapter', () => {
    const runtime = createRuntime();
    const first = runtime.createInflictionAdapter('operator-a');
    const second = runtime.createInflictionAdapter('operator-b');
    first.apply({ kind: 'addAttachment', element: 'heat' });

    const existing = second.getExistingAttachment();
    expect(existing).toEqual({ element: 'heat', layers: 1 });
    for (const operation of resolveElementalInfliction('electric', existing)) {
      second.apply(operation);
    }

    expect(runtime.getCountByIds(['heat-attachment'])).toBe(0);
    expect(runtime.getCountByIds(['heat-electric-status'])).toBe(1);
  });
});
