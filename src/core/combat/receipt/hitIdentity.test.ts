import { expect, it } from 'vitest';
import { CombatReceiptCollector, type CombatObjectRef } from './combatReceipt';
const root: CombatObjectRef = { kind: 'action', ownerId: 'operator', actionId: 'cast' };
it('创建链按父来源、定义和归属计数，不依赖实例流水号或内部节点', () => {
  const make = (offset: number) => {
    const receipt = new CombatReceiptCollector();
    const entity: CombatObjectRef = { kind: 'abilityEntity', instanceId: offset };
    receipt.record({
      frame: 0,
      time: 0,
      event: 'AbilityEntitySpawned',
      subject: entity,
      producedBy: root,
      sourceId: 'operator',
      data: { abilityEntityId: 'spear' },
    });
    const buff: CombatObjectRef = { kind: 'buff', ownerId: 'enemy', instanceId: offset + 1 };
    receipt.record({
      frame: 0,
      time: 0,
      event: 'BuffCreated',
      subject: buff,
      producedBy: entity,
      targetId: 'enemy',
      data: { buffId: 'thunder' },
    });
    return { receipt, buff };
  };
  const a = make(1),
    b = make(200);
  const key = a.receipt.nextHitIdentity(a.buff, 'operator', 'enemy')!;
  expect(b.receipt.nextHitIdentity(b.buff, 'operator', 'enemy')).toBe(key);
  expect(a.receipt.nextHitIdentity(a.buff, 'operator', 'other')).not.toBe(key);
  const second = a.receipt.nextHitIdentity(a.buff, 'operator', 'enemy')!;
  expect(JSON.parse(key).at(-1).at(-1)).toBe(0);
  expect(JSON.parse(second).at(-1).at(-1)).toBe(1);
  // 回执可能先记录嵌套命中，恢复按已发布序号最大值推进。
  for (const identity of [second, key])
    a.receipt.record({
      frame: 1,
      time: 1 / 30,
      event: 'DamageApplied',
      data: { hitIdentity: identity },
    });
  const restored = new CombatReceiptCollector(a.receipt.history.snapshot());
  expect(restored.nextHitIdentity(a.buff, 'operator', 'enemy')).toBe(
    a.receipt.nextHitIdentity(a.buff, 'operator', 'enemy'),
  );
});
it('其他定义、归属和父来源的创建不改变目标链，未知实例不猜测', () => {
  const receipt = new CombatReceiptCollector();
  const birth = (id: number, type: string, owner: string, parent: CombatObjectRef = root) => {
    const subject: CombatObjectRef = { kind: 'abilityEntity', instanceId: id };
    receipt.record({
      frame: 0,
      time: 0,
      event: 'AbilityEntitySpawned',
      subject,
      producedBy: parent,
      sourceId: owner,
      data: { abilityEntityId: type },
    });
    return subject;
  };
  const first = birth(1, 'spear', 'operator');
  birth(2, 'other', 'operator');
  birth(3, 'spear', 'other');
  const second = birth(4, 'spear', 'operator');
  expect(receipt.nextHitIdentity(first, 'operator', 'enemy')).not.toBe(
    receipt.nextHitIdentity(second, 'operator', 'enemy'),
  );
  expect(
    receipt.nextHitIdentity(
      { kind: 'buff', ownerId: 'enemy', instanceId: 99 },
      'operator',
      'enemy',
    ),
  ).toBeUndefined();
});

it('投射物按资源各自计数，局部序号在切面恢复后连续', () => {
  const receipt = new CombatReceiptCollector();
  const launch = (collector: CombatReceiptCollector, instanceId: number, projectileId: string) => {
    const subject = { kind: 'abilityEntity', instanceId } as const;
    collector.record({
      event: 'ProjectileLaunched',
      time: 0,
      frame: 0,
      sourceId: 'operator',
      producedBy: root,
      subject,
      data: { projectileId },
    });
    return collector.nextHitIdentity(subject, 'operator', 'enemy')!;
  };
  const first = launch(receipt, 1, 'spear');
  launch(receipt, 2, 'arrow');
  const saved = new CombatReceiptCollector(receipt.history.snapshot());
  const next = launch(saved, 3, 'spear');
  expect(JSON.parse(first)[1]).toEqual(['abilityEntity', 'spear', 'operator', 0]);
  expect(JSON.parse(next)[1]).toEqual(['abilityEntity', 'spear', 'operator', 1]);
  expect(launch(receipt, 3, 'spear')).toBe(next);
});

it('状态更新不重排创建序号，无法追溯的实体宿主不分配身份', () => {
  const receipt = new CombatReceiptCollector();
  const add = (ownerId: string, instanceId: number) => {
    const subject = { kind: 'buff', ownerId, instanceId } as const;
    const fact = {
      time: 0,
      frame: 0,
      producedBy: root,
      subject,
      data: { buffId: 'buff' },
      targetId: ownerId,
    };
    receipt.record({ ...fact, event: 'BuffCreated' });
    receipt.record({ ...fact, event: 'BuffApplied' });
    return subject;
  };
  const unknown = add('ability-entity:43', 1);
  expect(receipt.nextHitIdentity(unknown, 'operator', 'enemy')).toBeUndefined();
  const first = add('enemy', 1);
  expect(JSON.parse(receipt.nextHitIdentity(first, 'operator', 'enemy')!)[1]).toEqual([
    'buff',
    'buff',
    'enemy',
    0,
  ]);
  const second = add('enemy', 2);
  expect(JSON.parse(receipt.nextHitIdentity(second, 'operator', 'enemy')!)[1]).toEqual([
    'buff',
    'buff',
    'enemy',
    1,
  ]);
});
