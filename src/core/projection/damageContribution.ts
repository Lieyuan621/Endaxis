/**
 * 从已发布命中的直接修正分配贡献。只读来源查询和冻结乘区，不执行技能或重算战斗。
 * 支持 damageScale、直接 multiplyValue、纯加法抗性及可闭合的攻击基数加成。
 * 仅分配本次直接提供者，不递归追究增益来源的来源；未支持的部分保留在自身项。
 */
import { CombatObjectOrigins, type CombatObjectNode } from './combatObjectOrigins';
import type { CombatObjectRef } from '../combat/receipt/combatReceipt';
import { ENEMY_RESISTANCE_ATTRIBUTES } from '../combat/damage/playerActiveDamageInput';

export interface HitDamageContribution {
  readonly self: number;
  readonly external: readonly {
    readonly modifier: CombatObjectRef;
    readonly providerOperatorId: string;
    readonly value: number;
  }[];
  /** 仅供开发诊断，不作为用户界面的未归因扇区。 */
  readonly diagnostics: readonly string[];
}

export function projectHitDamageContribution(
  origins: CombatObjectOrigins,
  hit: CombatObjectNode,
  attackerOperatorId: string,
): HitDamageContribution {
  const direct = origins.directModifiers(hit);
  const value = hit.fact?.data?.value;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    return { self: 0, external: [], diagnostics: [] };
  const diagnostics = new Set<string>();
  const groups = new Map<
    string,
    {
      actual: number;
      attack?: {
        unrounded: number;
        scalar: number;
        minimum: number;
        maximum: number;
        baseMultiplier: number;
        outerMultiplier: number;
      };
      items: {
        modifier: CombatObjectRef;
        providerOperatorId: string;
        addition: number;
      }[];
    }
  >();
  const weights: { modifier: CombatObjectRef; providerOperatorId: string; logarithm: number }[] =
    [];
  const fallback = (reason: string): HitDamageContribution => ({
    self: value,
    external: [],
    diagnostics: [...diagnostics, reason],
  });
  // 护盾是减法或条件处理，不能把吸收后的数值当作同一乘法公式分配。
  const beforeAbsorption = hit.fact?.data?.damageBeforeAbsorption;
  if (typeof beforeAbsorption === 'number' && beforeAbsorption !== value)
    return fallback('damage-absorbed');
  for (const item of direct) {
    const provider = origins.providerOperator(item.provider, hit.fact!.sequence);
    if (provider === attackerOperatorId) continue;
    if (provider === undefined) {
      diagnostics.add('unknown-provider');
      continue;
    }
    const modifier = item.modifier;
    const identity = { modifier: item.node.ref, providerOperatorId: provider };
    if (
      modifier.kind === 'attribute' &&
      modifier.side === 'attacker' &&
      modifier.attribute === 'Atk'
    ) {
      const data = hit.fact!.data!;
      const attack = data.attack;
      const base = data.attackDetailActualBase;
      const raw = data.attackDetailRawBase;
      const scale = data.skillMultiplierPercent;
      // 只接受已闭合的攻击×倍率；固定伤害或附加基础伤害不能按攻击比例分账。
      if (
        data.standardCalculation !== true ||
        typeof attack !== 'number' ||
        attack <= 0 ||
        typeof base !== 'number' ||
        base <= 0 ||
        typeof raw !== 'number' ||
        typeof scale !== 'number' ||
        typeof data.baseDamage !== 'number' ||
        Math.abs(data.baseDamage - (attack * scale) / 100) > 1e-6 ||
        !['baseMultiplier', 'baseFinalAddition'].includes(modifier.slot)
      ) {
        diagnostics.add('unsupported-attack-factor');
        continue;
      }
      const slot = (key: string, fallback = 0) => {
        const value = data[`attackDetailSlot:${key}`];
        return typeof value === 'number' ? value : fallback;
      };
      const multiplier = 1 + slot('baseMultiplier');
      const finalMultiplier = 1 + slot('multiplier');
      const baseValue = raw + slot('baseAddition');
      const armed =
        (baseValue * multiplier + slot('baseFinalAddition')) * slot('baseFinalMultiplier', 1);
      const resolved =
        ((armed + slot('addition')) * finalMultiplier + slot('finalAddition')) *
        slot('finalMultiplier', 1);
      const attributeFactor =
        1 +
        ['Strength', 'Agility', 'Intellect', 'Will'].reduce((sum, key) => {
          const value = data[`attackDetail${key}`],
            coefficient = data[`attackDetail${key}Coefficient`];
          return (
            sum +
            (typeof value === 'number' && typeof coefficient === 'number'
              ? Math.floor(value) * coefficient
              : NaN)
          );
        }, 0);
      const minimum =
        typeof data.attackDetailMinimum === 'number' ? data.attackDetailMinimum : -Infinity;
      const maximum =
        typeof data.attackDetailMaximum === 'number' ? data.attackDetailMaximum : Infinity;
      if (
        multiplier <= 0 ||
        finalMultiplier <= 0 ||
        [baseValue, armed, resolved].some(value => value < minimum || value > maximum) ||
        Math.abs(resolved - base) > 1e-6 ||
        Math.floor(base * attributeFactor) !== attack ||
        !Number.isFinite(modifier.value) ||
        slot('addition') !== 0 ||
        slot('finalAddition') !== 0 ||
        baseValue < 0
      ) {
        diagnostics.add('missing-or-clamped-attack');
        continue;
      }
      // 这两个槽对最终攻击基数是线性的。静态构筑、自身 Buff 与其他槽保持原值。
      const addition =
        modifier.value *
        (modifier.slot === 'baseMultiplier' ? baseValue : 1) *
        slot('baseFinalMultiplier', 1) *
        finalMultiplier *
        slot('finalMultiplier', 1) *
        attributeFactor;
      let group = groups.get('attack');
      if (group === undefined) {
        group = {
          actual: attack,
          attack: {
            unrounded: base * attributeFactor,
            scalar: attributeFactor,
            minimum,
            maximum,
            baseMultiplier: multiplier,
            outerMultiplier: finalMultiplier * slot('finalMultiplier', 1),
          },
          items: [],
        };
        groups.set('attack', group);
      }
      if (modifier.slot === 'baseMultiplier') group.attack!.baseMultiplier -= modifier.value;
      group.items.push({ ...identity, addition });
      continue;
    }
    if (modifier.kind === 'multiplyValue') {
      if (!Number.isFinite(modifier.multiplier)) return fallback('non-finite-modifier');
      if (modifier.multiplier <= 0) return fallback('non-positive-factor');
      // 原处理器直接乘到计算值，记录就是独立因子，无需重算基础伤害或追溯参数。
      weights.push({ ...identity, logarithm: Math.log(modifier.multiplier) });
      continue;
    }
    if (
      modifier.kind === 'attribute' &&
      modifier.side === 'defender' &&
      Object.values(ENEMY_RESISTANCE_ATTRIBUTES).some(attribute => attribute === modifier.attribute)
    ) {
      const expectedAttribute = Object.entries(ENEMY_RESISTANCE_ATTRIBUTES).find(
        ([damageType]) => damageType === hit.fact?.data?.damageType,
      )?.[1];
      if (modifier.attribute !== expectedAttribute) {
        diagnostics.add('resistance-type-mismatch');
        continue;
      }
      // 敌方抗性从静态原值与原生八槽求值。只有全部已记录槽都是纯加法时，
      // 百分点变化才能直接换成抗性因子的增量；不猜乘法槽或其他属性的边际效果。
      const additiveSlots = ['baseAddition', 'baseFinalAddition', 'addition', 'finalAddition'];
      const sameAttribute = direct.filter(
        entry =>
          entry.modifier.kind === 'attribute' &&
          entry.modifier.side === modifier.side &&
          entry.modifier.attribute === modifier.attribute,
      );
      if (
        sameAttribute.some(
          entry =>
            entry.modifier.kind === 'attribute' && !additiveSlots.includes(entry.modifier.slot),
        )
      ) {
        diagnostics.add('unsupported-resistance-slots');
        continue;
      }
      const actual = hit.fact?.data?.resistancePercentMultiplier;
      const resistance = hit.fact?.data?.enemyResistancePercent;
      if (
        typeof actual !== 'number' ||
        typeof resistance !== 'number' ||
        !Number.isFinite(actual) ||
        !Number.isFinite(resistance) ||
        actual <= 0 ||
        Math.abs(actual - (1 - resistance / 100)) > 1e-9
      )
        return fallback('missing-or-clamped-resistance');
      if (!Number.isFinite(modifier.value)) return fallback('non-finite-modifier');
      let group = groups.get('resistance');
      if (group === undefined) {
        group = { actual, items: [] };
        groups.set('resistance', group);
      }
      group.items.push({ ...identity, addition: -modifier.value / 100 });
      continue;
    }
    // zone 是伤害执行器在实际注入乘区时记录的事实。无 zone 的属性原记录
    // 不是另一份乘区增益，不能同时分配。只在同属性全部为加法槽时直接采用槽增量。
    if (modifier.kind === 'attribute' && modifier.zone !== undefined) {
      const additiveSlots = ['baseAddition', 'baseFinalAddition', 'addition', 'finalAddition'];
      const mixedSlots = direct.some(
        entry =>
          entry.modifier.kind === 'attribute' &&
          entry.modifier.side === modifier.side &&
          entry.modifier.attribute === modifier.attribute &&
          !additiveSlots.includes(entry.modifier.slot),
      );
      if (mixedSlots || modifier.zone === 'product') {
        diagnostics.add('unsupported-damage-scale-attribute-slots');
        continue;
      }
    } else if (modifier.kind !== 'damageScale') {
      diagnostics.add('unsupported-modifier');
      continue;
    }
    const addition = modifier.kind === 'damageScale' ? modifier.addition : modifier.value;
    if (!Number.isFinite(addition)) return fallback('non-finite-modifier');
    if (modifier.zone === 'product') {
      if (1 + addition <= 0) return fallback('non-positive-factor');
      weights.push({ ...identity, logarithm: Math.log1p(addition) });
    } else {
      const key = `damageScale:${modifier.zone}:${modifier.side}`;
      const actual = hit.fact?.data?.[key];
      if (typeof actual !== 'number' || !Number.isFinite(actual) || actual <= 0)
        return fallback('missing-or-clamped-factor');
      let group = groups.get(key);
      if (group === undefined) {
        group = { actual, items: [] };
        groups.set(key, group);
      }
      group.items.push({ ...identity, addition });
    }
  }
  for (const group of groups.values()) {
    if (group.attack !== undefined) {
      const delta = group.items.reduce((sum, item) => sum + item.addition, 0);
      const selfUnrounded = group.attack.unrounded - delta;
      const base = selfUnrounded / group.attack.scalar;
      const armed = base / group.attack.outerMultiplier;
      if (
        group.attack.baseMultiplier < 0 ||
        base <= 0 ||
        [base, armed].some(value => value < group.attack!.minimum || value > group.attack!.maximum)
      )
        return fallback('non-positive-or-clamped-self-attack');
      // 攻击力取整在来源拆分之前发生；把实际整数差按线性槽增量分摊，保持总额闭合。
      const integerDelta = group.actual - Math.floor(selfUnrounded);
      if (delta !== 0) for (const item of group.items) item.addition *= integerDelta / delta;
    }
    const delta = group.items.reduce((sum, item) => sum + item.addition, 0);
    const selfFactor = group.actual - delta;
    if (!(selfFactor > 0) || !Number.isFinite(selfFactor))
      return fallback('non-positive-self-factor');
    // 带符号的同量纲分配。正负修正抵消时取连续极限，不能除以零或按绝对值分摊。
    const slope = delta === 0 ? 1 / selfFactor : Math.log1p(delta / selfFactor) / delta;
    for (const item of group.items)
      weights.push({
        modifier: item.modifier,
        providerOperatorId: item.providerOperatorId,
        logarithm: item.addition * slope,
      });
  }
  const logarithm = weights.reduce((sum, item) => sum + item.logarithm, 0);
  const mean = value * (logarithm === 0 ? 1 : -Math.expm1(-logarithm) / logarithm);
  const external = weights.map(item => ({
    modifier: item.modifier,
    providerOperatorId: item.providerOperatorId,
    value: mean * item.logarithm,
  }));
  const self = value - external.reduce((sum, item) => sum + item.value, 0);
  if (!Number.isFinite(self) || external.some(item => !Number.isFinite(item.value)))
    return fallback('unstable-decomposition');
  return { self, external, diagnostics: [...diagnostics] };
}
