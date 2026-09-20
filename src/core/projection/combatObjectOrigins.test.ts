import { expect, it } from 'vitest';
import { CombatReceiptCollector, type CombatObjectRef } from '../combat/receipt/combatReceipt';
import { exportCombatReceiptJsonLines } from '../combat/receipt/combatReceiptExport';
import { restoreCombatReceiptView } from '../combat/receipt/combatReceiptHistory';
import { CombatObjectOrigins } from './combatObjectOrigins';
import { operationProducer } from '../combat/receipt/combatObjectIdentity';

const action: CombatObjectRef = { kind: 'action', ownerId: 'caster', actionId: 'cast' };
const buff: CombatObjectRef = { kind: 'buff', ownerId: 'caster', instanceId: 1 };
const entity = (instanceId: number): CombatObjectRef => ({ kind: 'abilityEntity', instanceId });
const hasBuff = (node: { ref: CombatObjectRef }) => node.ref.kind === 'buff';
it('connects stack and consumption facts to exact instances and casts without changing birth or damage provenance', () => {
  const c = new CombatReceiptCollector();
  c.record({
    frame: 0,
    time: 0,
    event: 'SkillStarted',
    sourceId: 'caster',
    data: { castId: 'cast' },
  });
  c.record({ frame: 0, time: 0, event: 'BuffCreated', subject: buff, producedBy: action });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffStackChanged',
    targetId: 'caster',
    data: { instanceId: 1, previousLayers: 1, layers: 2, delta: 1, castId: 'cast' },
  });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffConsumed',
    sourceId: 'consumer',
    targetId: 'caster',
    data: { instanceId: 1, layers: 2, castId: 'cast' },
  });
  c.record({ frame: 0, time: 0, event: 'DamageApplied', producedBy: action });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffApplied',
    targetId: 'caster',
    data: { instanceId: 1, layers: 3, castId: 'cast' },
  });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffConsumed',
    targetId: 'other-owner',
    data: { instanceId: 1, layers: 9 },
  });
  const q = new CombatObjectOrigins(c.entries);
  const changes = q.relations(q.get(buff), 4).filter(link => link.relation === 'buffEvent');
  expect(changes.map(link => link.sequence)).toEqual([2, 3]);
  expect(q.get(buff).fact?.sequence).toBe(1);
  const consumed = q.relations(q.get({ kind: 'receipt', sequence: 3 }), 4);
  expect(consumed.find(link => link.relation === 'consumedBuff')?.target.ref).toEqual(buff);
  expect(consumed.find(link => link.relation === 'eventSource')?.target.ref).toEqual({
    kind: 'operator',
    operatorId: 'consumer',
  });
  expect(
    q
      .relations(q.get(action), 4)
      .filter(link => link.relation === 'castEvent')
      .map(link => link.sequence),
  ).toEqual([2, 3]);
  expect(q.findAncestor(q.get({ kind: 'receipt', sequence: 4 }), hasBuff).status).toBe('notFound');
});
it('reads the executing Buff or entity without borrowing event targets or inherited casts', () => {
  const context = {
    actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId: 3 },
    executingBuff: { buffId: 'definition', buffOwnerId: 'caster', buffInstanceId: 1 },
    currentTarget: { kind: 'enemy' as const },
    actionOwnerId: 'caster',
  };
  expect(operationProducer(context)).toEqual(buff);
  expect(operationProducer({ ...context, executingBuff: undefined })).toEqual(entity(3));
  expect(operationProducer({ actionOwnerId: 'caster' })).toBeUndefined();
});

it('resolves inherited cast ownership from its actual start, not the projectile sourceId', () => {
  const c = new CombatReceiptCollector();
  c.record({
    frame: 0,
    time: 0,
    event: 'SkillStarted',
    sourceId: 'caster',
    data: { castId: 'cast' },
  });
  c.record({
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    sourceId: 'ability-entity:3',
    data: { castId: 'cast' },
  });
  const q = new CombatObjectOrigins(c.entries);
  expect(q.relations(q.get({ kind: 'receipt', sequence: 1 }))[0]?.target.ref).toEqual(action);
});
function append(
  collector: CombatReceiptCollector,
  event: string,
  producedBy?: CombatObjectRef,
  subject?: CombatObjectRef,
) {
  collector.record({ frame: 0, time: 0, event, producedBy, subject });
}

it('distinguishes the same entity program produced by a Buff or an ordinary action after recycling', () => {
  const c = new CombatReceiptCollector();
  append(c, 'BuffCreated', action, buff);
  append(c, 'AbilityEntitySpawned', buff, entity(1));
  append(c, 'AbilityEntitySpawned', action, entity(2));
  append(c, 'ProjectileLaunched', entity(1), entity(3));
  append(c, 'DamageApplied', entity(3));
  append(c, 'DamageApplied', entity(2));
  append(c, 'AbilityEntityFinished');
  append(c, 'BuffReleased');
  const query = new CombatObjectOrigins(c.history.snapshot().entries());
  const result = query.findAncestor(query.get({ kind: 'receipt', sequence: 4 }), hasBuff);
  expect(result.status).toBe('found');
  if (result.status === 'found')
    expect(result.path.map(node => node.ref.kind)).toEqual([
      'receipt',
      'abilityEntity',
      'abilityEntity',
      'buff',
    ]);
  expect(query.findAncestor(query.get({ kind: 'receipt', sequence: 5 }), hasBuff)).toEqual({
    status: 'notFound',
  });
  expect([...query.objects()].filter(node => node.ref.kind === 'abilityEntity')).toHaveLength(3);
});

it('does not confuse a damage modifier, owner or native Source with the producer', () => {
  const c = new CombatReceiptCollector();
  append(c, 'BuffCreated', action, buff);
  c.record({
    frame: 0,
    time: 0,
    event: 'AbilityEntitySpawned',
    subject: entity(1),
    producedBy: action,
    runtimeSource: { kind: 'operator', operatorId: 'other' },
    sourceId: 'owner',
  });
  c.record({
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    producedBy: entity(1),
    appliedDamageModifiers: [
      {
        kind: 'damageScale',
        buffId: 'buff-definition',
        sourceId: 'ally',
        sourceActionId: 'weapon',
        side: 'attacker',
        zone: 'normal',
        addition: 0.2,
      },
    ],
  });
  const q = new CombatObjectOrigins(c.entries);
  const hit = q.get({ kind: 'receipt', sequence: 2 });
  expect(q.findAncestor(hit, hasBuff)).toEqual({ status: 'notFound' });
  expect(q.relations(q.get(entity(1))).map(link => link.relation)).toEqual([
    'producedBy',
    'runtimeSource',
    'ownedBy',
  ]);
  const modifier = q.relations(hit).find(link => link.relation === 'modifiedBy')!.target;
  expect(q.relations(modifier)[0]?.target.ref).toEqual({
    kind: 'action',
    ownerId: 'ally',
    actionId: 'weapon',
  });
});

it('uses instance owner as part of Buff identity and does not rewrite birth on refresh', () => {
  const c = new CombatReceiptCollector();
  append(c, 'BuffCreated', action, buff);
  append(c, 'BuffCreated', entity(7), { kind: 'buff', ownerId: 'enemy', instanceId: 1 });
  append(c, 'BuffApplied', entity(9));
  append(c, 'DamageApplied', buff);
  const q = new CombatObjectOrigins(c.entries);
  expect(q.relations(q.get(buff))[0]?.target.ref).toEqual(action);
  expect(q.get(buff)).not.toBe(q.get({ kind: 'buff', ownerId: 'enemy', instanceId: 1 }));
});

it('isolates restored histories with identical sequence and object numbers', () => {
  const root = new CombatReceiptCollector();
  const saved = root.history.snapshot();
  const a = new CombatReceiptCollector(saved),
    b = new CombatReceiptCollector(saved);
  append(a, 'AbilityEntitySpawned', buff, entity(1));
  append(b, 'AbilityEntitySpawned', action, entity(1));
  append(a, 'DamageApplied', entity(1));
  append(b, 'DamageApplied', entity(1));
  const qa = new CombatObjectOrigins(a.entries),
    qb = new CombatObjectOrigins(b.entries);
  const na = qa.get({ kind: 'receipt', sequence: 1 });
  expect(qa.findAncestor(na, hasBuff).status).toBe('found');
  expect(qb.findAncestor(qb.get(na.ref), hasBuff).status).toBe('notFound');
  expect(() => qb.relations(na)).toThrow('another origin query');
});

it('reports missing, cyclic and bounded paths without using future same-frame births', () => {
  const c = new CombatReceiptCollector();
  append(c, 'DamageApplied', entity(1));
  append(c, 'AbilityEntitySpawned', buff, entity(1));
  append(c, 'AbilityEntitySpawned', entity(3), entity(2));
  append(c, 'AbilityEntitySpawned', entity(2), entity(3));
  append(c, 'DamageApplied', entity(2));
  const q = new CombatObjectOrigins(c.entries);
  expect(q.findAncestor(q.get({ kind: 'receipt', sequence: 0 }), hasBuff).status).toBe('missing');
  const hit = q.get({ kind: 'receipt', sequence: 4 });
  expect(q.findAncestor(hit, hasBuff).status).toBe('cycle');
  expect(q.findAncestor(hit, hasBuff, { maxNodes: 1 }).status).toBe('limit');
});

it('keeps a frozen direct reference through the common export and restore path', () => {
  const c = new CombatReceiptCollector();
  const producer = { kind: 'buff' as const, ownerId: 'caster', instanceId: 7 };
  append(c, 'DamageApplied', producer);
  producer.instanceId = 99;
  const exported = [...exportCombatReceiptJsonLines(c.history.snapshot(), 0)];
  const restored = restoreCombatReceiptView(exported.slice(1).map(line => JSON.parse(line)));
  expect(restored.get(0)?.producedBy).toEqual({ kind: 'buff', ownerId: 'caster', instanceId: 7 });
  expect(Object.isFrozen(restored.get(0)?.producedBy)).toBe(true);
  const q = new CombatObjectOrigins(restored.entries());
  expect(q.findAncestor(q.get({ kind: 'receipt', sequence: 0 }), hasBuff).status).toBe('found');
});
