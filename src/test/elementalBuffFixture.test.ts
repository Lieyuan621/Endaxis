import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../core/combat/attributes/combatAttributes';
import { createEnemyElementalBuffRuntime } from './elementalBuffFixture';

describe('createEnemyElementalBuffRuntime', () => {
  it('wires the versioned attachment index to one enemy runtime', () => {
    const emitStarted = vi.fn();
    const onSpellBurstTriggered = vi.fn();
    const runtime = createEnemyElementalBuffRuntime({
      attributes: new CombatAttributeSet(),
      emitElementalInflictionStarted: emitStarted,
      onSpellBurstTriggered,
    });
    const adapter = runtime.createInflictionAdapter('operator');

    adapter.apply({ kind: 'addAttachment', element: 'heat' });
    adapter.apply({ kind: 'addAttachment', element: 'heat' });

    expect(runtime.ownerId).toBe('enemy');
    expect(adapter.getExistingAttachment()).toEqual({ element: 'heat', layers: 2 });
    expect(emitStarted).toHaveBeenLastCalledWith({ element: 'heat', layers: 2 });
    expect(onSpellBurstTriggered).not.toHaveBeenCalled();
  });
});
