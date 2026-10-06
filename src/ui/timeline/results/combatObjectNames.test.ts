import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../../../core/combat/receipt/combatReceipt';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { createCombatObjectNameResolver } from './combatObjectNames';

it('区分自身名称、继承展示名和来源名称，不改变未命名的直接来源身份', () => {
  const receipts = new CombatReceiptCollector();
  const parent = { kind: 'abilityEntity' as const, instanceId: 1 };
  const child = { kind: 'abilityEntity' as const, instanceId: 2 };
  const helper = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 3 };
  receipts.record({ frame: 0, time: 0, event: 'AbilityEntitySpawned', subject: parent });
  receipts.record({
    frame: 0,
    time: 0,
    event: 'AbilityEntitySpawned',
    subject: child,
    producedBy: parent,
  });
  receipts.record({
    frame: 0,
    time: 0,
    event: 'BuffCreated',
    subject: helper,
    producedBy: child,
    runtimeSource: parent,
  });
  receipts.record({ frame: 0, time: 0, event: 'DamageApplied', producedBy: helper });
  const origins = new CombatObjectOrigins(receipts.entries);
  const names = createCombatObjectNameResolver(origins, node =>
    node.ref.kind === 'abilityEntity' && node.fact !== undefined
      ? node.ref.instanceId === 1
        ? '古老图形'
        : '水龙卷'
      : undefined,
  );
  expect(names.own(child)).toBe('水龙卷');
  expect(names.display(child)).toBe('水龙卷');
  expect(names.sourceName(child)).toBe('古老图形');
  expect(names.own(helper)).toBeUndefined();
  expect(names.display(helper)).toBe('水龙卷');
  const ref = { kind: 'receipt' as const, sequence: receipts.entries.at(-1)!.sequence };
  expect(origins.get(ref).fact?.producedBy).toEqual(helper);
  expect(names.sourceName(ref)).toBe('水龙卷');
  expect(names.display({ kind: 'abilityEntity', instanceId: 99 })).toBeUndefined();
});
