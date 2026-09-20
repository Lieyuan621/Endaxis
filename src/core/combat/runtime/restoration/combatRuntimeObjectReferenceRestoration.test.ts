import { expect, it, vi } from 'vitest';
import type { BindRestoredSkillAffixObjectReference } from '../../buffs/buffLifecycleSequenceRuntime';
import type { BuffOperationTarget } from '../../buffs/buffOperationExecutor';
import { configureRestoredCombatObjectReferences } from './combatRuntimeObjectReferenceRestoration';

it('按对象目录把 SkillAffix 引用接到能力实体、投射物或 Buff', () => {
  let bind!: BindRestoredSkillAffixObjectReference;
  const bindEntity = vi.fn(() => ({ dispose: () => {} }));
  const bindProjectile = vi.fn(() => ({ dispose: () => {} }));
  const bindBuff = vi.fn(() => ({ dispose: () => {} }));
  const release = vi.fn();
  configureRestoredCombatObjectReferences({
    entities: {
      runtime: { bindResetCallback: bindEntity },
      targets: new Map<string, Partial<BuffOperationTarget>>([
        [
          'host',
          {
            ownerId: 'host',
            configureRestoredSkillAffixObjectReferenceBinder: value => {
              bind = value;
            },
          },
        ],
        [
          'buff-owner',
          {
            ownerId: 'buff-owner',
            bindRestoredBuffRecycleCallback: bindBuff,
          },
        ],
      ]),
    } as never,
    projectiles: {
      runtimeState: { instances: new Map([[3, {}]]) },
      bindRestoredResetCallback: bindProjectile,
    } as never,
  });

  bind(
    {
      kind: 'entity',
      target: { kind: 'abilityEntity', instanceId: 2 },
      resetRegistrationId: 7,
    },
    release,
  );
  bind(
    {
      kind: 'entity',
      target: { kind: 'abilityEntity', instanceId: 3 },
      resetRegistrationId: 8,
    },
    release,
  );
  bind(
    {
      kind: 'buff',
      reference: { ownerId: 'buff-owner', instanceId: 4 },
      recycleRegistrationId: 9,
    },
    release,
  );

  expect(bindEntity).toHaveBeenCalledWith({ kind: 'abilityEntity', instanceId: 2 }, 7, release);
  expect(bindProjectile).toHaveBeenCalledWith(3, 8, release);
  expect(bindBuff).toHaveBeenCalledWith({ ownerId: 'buff-owner', instanceId: 4 }, 9, release);
});
