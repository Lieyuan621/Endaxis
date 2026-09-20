import { expect, it, vi } from 'vitest';
import { CombatSharedRuntime } from './combatSharedRuntime';
import { CombatReceiptCollector } from '../receipt/combatReceipt';

const resources = {
  sp: 10,
  maxSp: 300,
  returnedSp: 0,
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  squad: [
    {
      operatorId: 'operator',
      ultimateEnergy: 0,
      maxUltimateEnergy: 100,
      ultimateEnergyGainMultiplier: 1,
      allowedUltimateEnergyRecoveryTags: null,
    },
  ],
} as const;

it('binds every shared runtime to one copied graph without replaying business events', () => {
  const original = new CombatSharedRuntime({
    resources,
    operatorOrder: ['operator'],
    initialFrame: -10,
    timeDilation: { config: {} },
  });
  original.clock.advanceFrame();
  original.receipt.record({ frame: -9, time: -0.3, event: 'Saved' });
  original.globalCooldowns.set('operator', 'marker', 3);
  original.abilityEntityInstanceIds.allocate();
  original.skillCastIds.allocate();
  original.basicAttackInheritance.register('operator', {
    skillCastId: 1,
    originSkillId: 'skill',
    originSkillType: 'basicAttack',
    nonReturnedSpCost: 0,
  });
  original.timeDilation!.runtimeState.globalScaledTime = 2;
  const saved = structuredClone(original.runtimeState);
  const observer = { started: vi.fn(), rejected: vi.fn(), ended: vi.fn() };

  const restored = new CombatSharedRuntime(
    {
      resources,
      operatorOrder: ['operator'],
      timeDilation: { config: {}, observer },
      receipt: new CombatReceiptCollector(original.receipt.history.snapshot()),
    },
    { state: saved, timeDilationPrograms: original.timeDilation!.programs },
  );

  expect(restored.runtimeState).toBe(saved);
  expect(restored.clock.runtimeState).toBe(saved.clock);
  expect(restored.resources.runtimeState).toBe(saved.resources);
  expect(restored.receipt.entries).toEqual(original.receipt.entries);
  expect(restored.ultimatePresentation.runtimeState).toBe(saved.ultimatePresentation);
  expect(restored.comboWindows.runtimeState).toBe(saved.comboWindows);
  expect(restored.timeDilation!.runtimeState).toBe(saved.timeDilation);
  expect(restored.globalCooldowns.runtimeState).toBe(saved.globalCooldowns);
  expect(restored.abilityEntityInstanceIds.runtimeState).toBe(saved.identities.abilityEntities);
  expect(restored.skillCastIds.runtimeState).toBe(saved.identities.skillCasts);
  expect(restored.basicAttackInheritance.runtimeState).toBe(saved.basicAttackInheritance);
  expect(restored.receipt.entries).toHaveLength(1);
  expect(observer.started).not.toHaveBeenCalled();
  expect(observer.rejected).not.toHaveBeenCalled();
  expect(observer.ended).not.toHaveBeenCalled();
  expect(restored.abilityEntityInstanceIds.allocate()).toBe(2);
  expect(restored.skillCastIds.allocate()).toBe(2);
});
