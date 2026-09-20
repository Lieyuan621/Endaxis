import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../combat/receipt/combatReceipt';
import type { AppliedDamageModifier } from '../combat/damage/damageScale';
import type { DamageModifierSide } from '../../../packages/game-data-contract/src/modifiers';
import { CombatObjectOrigins } from './combatObjectOrigins';
import { projectHitDamageContribution } from './damageContribution';

function modifier(
  sourceId: string,
  addition: number,
  side: DamageModifierSide = 'attacker',
): AppliedDamageModifier {
  return {
    kind: 'damageScale',
    zone: 'normal',
    side,
    addition,
    sourceId,
    buffId: 'shared-definition',
  };
}
function project(
  modifiers: readonly AppliedDamageModifier[],
  value: number,
  attacker: number,
  defender = 1,
  extraData: Record<string, number | string> = {},
) {
  const c = new CombatReceiptCollector();
  c.record({
    event: 'DamageApplied',
    frame: 0,
    time: 0,
    sourceId: 'a',
    targetId: 'enemy',
    data: {
      value,
      'damageScale:normal:attacker': attacker,
      'damageScale:normal:defender': defender,
      ...extraData,
    },
    appliedDamageModifiers: modifiers,
  });
  const origins = new CombatObjectOrigins(c.entries);
  return projectHitDamageContribution(origins, origins.get({ kind: 'receipt', sequence: 0 }), 'a');
}

it('护盾吸收后的伤害不能按吸收前的乘法公式分账', () => {
  const c = new CombatReceiptCollector();
  c.record({
    event: 'DamageApplied',
    frame: 0,
    time: 0,
    sourceId: 'a',
    targetId: 'enemy',
    data: { value: 50, damageBeforeAbsorption: 150, 'damageScale:normal:attacker': 1.5 },
    appliedDamageModifiers: [modifier('b', 0.5)],
  });
  const origins = new CombatObjectOrigins(c.entries);
  expect(
    projectHitDamageContribution(origins, origins.get({ kind: 'receipt', sequence: 0 }), 'a'),
  ).toEqual({ self: 50, external: [], diagnostics: ['damage-absorbed'] });
});

it('直接倍率与已有乘区共用有限分配，保留自身倍率且不依赖记录顺序', () => {
  const multiply = (sourceId: string, multiplier: number): AppliedDamageModifier => ({
    kind: 'multiplyValue',
    buffId: 'direct-scale',
    sourceId,
    side: 'attacker',
    multiplier,
  });
  const records = [multiply('a', 2), multiply('b', 1.5), multiply('c', 0.8), modifier('d', 0.25)];
  const result = project(records, 300, 1.25);
  expect(result.self).toBeCloseTo(200);
  expect(result.external.reduce((sum, item) => sum + item.value, 0)).toBeCloseTo(100);
  expect(result.external.find(item => item.providerOperatorId === 'c')!.value).toBeLessThan(0);
  expect(result.diagnostics).toEqual([]);
  const reversed = project([...records].reverse(), 300, 1.25);
  for (const item of result.external)
    expect(
      reversed.external.find(other => other.providerOperatorId === item.providerOperatorId)!.value,
    ).toBeCloseTo(item.value);
  for (const multiplier of [0, -1, Infinity, NaN]) {
    const invalid = project([multiply('b', multiplier)], 300, 1);
    expect(invalid.self).toBe(300);
    expect(invalid.external).toEqual([]);
  }
});

it('纯加法减抗按百分点分配，保留自身减抗，并拒绝混合槽及无关元素', () => {
  const resistance = (sourceId: string, value: number): AppliedDamageModifier => ({
    kind: 'attribute',
    attribute: 'PulseResistance',
    slot: 'addition',
    value,
    side: 'defender',
    sourceId,
    buffId: 'resistance',
  });
  const data = {
    damageType: 'electric',
    enemyResistancePercent: 10,
    resistancePercentMultiplier: 0.9,
  };
  // 基础抗性 50，自身减抗 10，外部减抗 30：自身伤害 60，外部贡献 30。
  const result = project([resistance('a', -10), resistance('b', -30)], 90, 1, 1, data);
  expect(result.self).toBeCloseTo(60);
  expect(result.external[0]!.value).toBeCloseTo(30);
  expect(result.diagnostics).toEqual([]);
  const mixed = project(
    [
      resistance('b', -30),
      { ...resistance('a', 0.5), slot: 'baseMultiplier' } as AppliedDamageModifier,
    ],
    90,
    1,
    1,
    data,
  );
  expect(mixed.self).toBe(90);
  expect(mixed.external).toEqual([]);
  expect(mixed.diagnostics).toContain('unsupported-resistance-slots');
  expect(
    project([resistance('b', -30)], 90, 1, 1, { ...data, damageType: 'nature' }).external,
  ).toEqual([]);
  expect(project([resistance('b', -30)], 90, 1, 1).external).toEqual([]);
  expect(project([resistance('b', -120)], 90, 1, 1, data).external).toEqual([]);
});

it('保留自身加成，并按带符号的同区间外部增量分配', () => {
  const r = project([modifier('a', 0.2), modifier('b', 0.4), modifier('c', -0.1)], 150, 1.5);
  expect(r.self).toBeCloseTo(120);
  expect(r.external.map(x => x.value)).toEqual([expect.closeTo(40), expect.closeTo(-10)]);
  expect(r.self + r.external.reduce((sum, x) => sum + x.value, 0)).toBe(150);
});
it('正负完全抵消仍保留各自贡献，接近相等的因子也不产生 NaN', () => {
  const r = project([modifier('b', 0.2), modifier('c', -0.2)], 100, 1);
  expect(r.external.map(x => x.value)).toEqual([20, -20]);
  expect(r.self).toBe(100);
  const tiny = project([modifier('b', 1e-12)], 100, 1 + 1e-12);
  expect(tiny.external[0]!.value).toBeGreaterThan(0);
  expect(Number.isFinite(tiny.self)).toBe(true);
});
it('双方同名区间独立分解，独立乘区按实际因子处理', () => {
  const modifiers: AppliedDamageModifier[] = [
    modifier('b', 0.5),
    modifier('c', 0.2, 'defender'),
    { ...modifier('b', 0.1), kind: 'damageScale', zone: 'product', addition: 0.1 },
  ];
  const r = project(modifiers, 198, 1.5, 1.2);
  expect(r.self).toBeCloseTo(100);
  expect(r.external.reduce((sum, x) => sum + x.value, 0)).toBeCloseTo(98);
  const reversed = project([...modifiers].reverse(), 198, 1.5, 1.2);
  for (const provider of ['b', 'c']) {
    const sum = (items: typeof r.external) =>
      items.filter(x => x.providerOperatorId === provider).reduce((s, x) => s + x.value, 0);
    expect(sum(r.external)).toBeCloseTo(sum(reversed.external));
  }
});
it('属性原记录与注入副本不重复分配，无法稳定分解时保留自身', () => {
  const attribute: AppliedDamageModifier = {
    kind: 'attribute',
    buffId: 'buff',
    sourceId: 'b',
    side: 'attacker',
    attribute: 'heatDamageIncrease',
    slot: 'addition',
    value: 0.2,
  };
  const r = project([attribute, { ...attribute, zone: 'normal' }], 120, 1.2);
  expect(r.self).toBe(120);
  expect(r.external).toEqual([]);
  expect(r.diagnostics).toContain('unsupported-modifier');
  expect(project([modifier('b', 2)], 100, 1).self).toBe(100);
  expect(project([modifier('b', 2)], 100, 1).external).toEqual([]);
});
it('同名 Buff 精确寻址，回收和未来记录不改变已发布修正，分支句柄不能混用', () => {
  const c = new CombatReceiptCollector();
  const ref = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
  c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: ref });
  const source = { ownerId: 'enemy', instanceId: 1 };
  c.record({
    event: 'DamageApplied',
    frame: 0,
    time: 0,
    sourceId: 'a',
    data: { value: 150, 'damageScale:normal:attacker': 1.5 },
    appliedDamageModifiers: [{ ...modifier('b', 0.5), buff: source }],
  });
  source.instanceId = 2;
  c.record({
    event: 'BuffReleased',
    frame: 1,
    time: 1 / 30,
    targetId: 'enemy',
    data: { instanceId: 1 },
  });
  const q = new CombatObjectOrigins(c.entries);
  const hit = q.get({ kind: 'receipt', sequence: 1 });
  const direct = q.directModifiers(hit)[0]!;
  expect(direct.buff!.ref).toEqual(ref);
  expect(q.relations(direct.node, 1).find(x => x.relation === 'producedBy')!.target).toBe(
    direct.buff,
  );
  expect(q.providerOperator(direct.provider, 1)).toBe('b');
  expect(projectHitDamageContribution(q, hit, 'a').external[0]!.value).toBeCloseTo(50);
  expect(() => new CombatObjectOrigins(c.entries).directModifiers(hit)).toThrow(
    'another origin query',
  );
});
