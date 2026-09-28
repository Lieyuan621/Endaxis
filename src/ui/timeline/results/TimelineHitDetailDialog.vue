<script setup lang="ts">
import { ElIcon } from 'element-plus';
import { EaCheckbox, EaDialog, EaDialogActions, EaTooltip } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import CombatObjectOriginGraph from './CombatObjectOriginGraph.vue';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
/** 结构与视觉以旧版 HitDamageDetailDialog 为规格；UI 只投影回执冻结值。 */
import { computed, ref, watch } from 'vue';
import { ArrowRight, Warning } from '@element-plus/icons-vue';
import {
  DAMAGE_SCALE_ZONES,
  type AppliedDamageModifier,
  type DamageScaleZone,
} from '../../../core/combat/damage/damageScale';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE } from '../../../core/combat/attributes/operatorAttackAttributes';
import type { OperatorAttribute } from '../../../core/game-data/operatorDefinition';
import {
  ATTRIBUTE_MODIFIER_SLOTS,
  type AttributeModifierSlot,
  type DamageModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers';
import type { OperatorPanelContributionReceipt } from '../../../core/compiler/resolveOperatorPanel';
import { POISE_BREAK_BUFF_ID } from '../../../core/combat/buffs/poiseBreakBuffRuntime';

const props = defineProps<{
  visible: boolean;
  randomMode: 'expected' | 'sampled';
  forceCritical: boolean;
  /** 结果区使用发布快照；forceCritical 仅表示当前编辑中的复选框。 */
  resultForceCritical: boolean;
  allowForceCritical?: boolean;
  sourceDescription?: (entry: CombatReceiptEntry) => string | undefined;
  sourceLabel?: string;
  damageZoneLabel?: (zone: DamageScaleZone) => string;
  buffLabel?: (
    item: import('../../../core/combat/damage/damageScale').AppliedDamageModifier,
  ) => string;
  entries: readonly CombatReceiptEntry[];
  receiptEntries?: readonly CombatReceiptEntry[];
  operatorLabel?: (operatorId: string) => string;
  objectIcon?: import('./combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
  contributionSourceLabel: (
    entry: Pick<OperatorPanelContributionReceipt, 'source'>,
    sequence?: number,
  ) => string;
  damageTypeLabel: (value: string) => string;
  skillTypeLabel: (value: string) => string;
  labels: {
    dialogTitle: string;
    context: string;
    result: string;
    base: string;
    multipliers: string;
    skillType: string;
    element: string;
    expectedDamage: string;
    actualDamage: string;
    forcedDamage: string;
    forceCrit: string;
    criticalDamage: string;
    nonCriticalDamage: string;
    attack: string;
    basicTotal: string;
    baseAttack: string;
    operatorAttack: string;
    weaponAttack: string;
    attackBonus: string;
    flatAttack: string;
    percentageAttack: string;
    attackSlot: (slot: AttributeModifierSlot) => string;
    attributeBonus: string;
    scalingCoefficient: string;
    attributeLabel: (attribute: string) => string;
    fromSource: (name: string) => string;
    skillMultiplier: string;
    baseDamage: string;
    damageBonus: string;
    criticalExpectation: string;
    criticalResult: string;
    criticalRate: string;
    criticalRateStat: string;
    criticalDamageStat: string;
    rawCriticalRate: string;
    criticalRateCap: string;
    criticalHit: string;
    nonCriticalHit: string;
    cannotCritical: string;
    directMultiplier: string;
    levelCoefficient: string;
    artsIntensity: string;
    levelDetail: (value: number) => string;
    artsIntensityDetail: (value: number) => string;
    staggerMultiplier: string;
    finisherMultiplier: string;
    additionalScale: string;
    stacksDetail: (value: number) => string;
    baseMultiplier: string;
    damageTaken: string;
    defenseMultiplier: string;
    resistanceMultiplier: string;
    defenseDetail: (value: number) => string;
  };
}>();

const emit = defineEmits<{ close: []; toggleForceCritical: [forced: boolean] }>();
const origins = computed(() => new CombatObjectOrigins(props.receiptEntries ?? props.entries));

interface DetailRow {
  readonly order?: number;
  readonly kind?: 'crit';
  readonly factor?: number;
  readonly tooltip?: string;
  readonly label: string;
  readonly detail?: string;
  readonly value: string;
}

interface DamageDetail {
  readonly attackFormulaTooltip?: string;
  readonly attributeSources: Readonly<Record<string, readonly DetailRow[]>>;
  readonly formulaTooltip?: string;
  readonly key: number;
  readonly headline: number;
  readonly expectedDamage: number;
  readonly criticalDamage: number;
  readonly nonCriticalDamage: number;
  readonly canCritical: boolean;
  readonly canForceCritical: boolean;
  readonly attackValue: string;
  readonly criticalRateRaw: number;
  readonly criticalRateEffective: number;
  readonly criticalDamageIncrease: number;
  readonly criticalRateSources: readonly DetailRow[];
  readonly criticalDamageSources: readonly DetailRow[];
  readonly attackSources: readonly DetailRow[];
  readonly attackSlotValues: Readonly<Record<AttributeModifierSlot, number | null>>;
  readonly attackSlotSources: Readonly<Record<AttributeModifierSlot, readonly DetailRow[]>>;
  readonly otherAttackSlots: readonly AttributeModifierSlot[];
  readonly attackDetail: AttackDetail | null;
  readonly contextRows: readonly DetailRow[];
  readonly baseRows: readonly DetailRow[];
  readonly multiplierRows: readonly DetailRow[];
}

interface AttackAttributeContribution {
  readonly coefficient: number;
  readonly key: string;
  readonly value: number;
  readonly contribution: number;
  readonly isMain: boolean;
  readonly isSecondary: boolean;
}

interface AttackDetail {
  readonly formula: string;
  readonly basicTotal: number;
  readonly baseAttackTotal: number;
  readonly operatorBaseAttack: number;
  readonly weaponBaseAttack: number;
  readonly attackBonus: number;
  readonly flatAttack: number;
  readonly attackPercent: number;
  readonly attributeBonus: number;
  readonly attributeContributions: readonly AttackAttributeContribution[];
}

const openAttackDetails = ref<ReadonlySet<number>>(new Set());
const openCriticalDetails = ref<ReadonlySet<number>>(new Set());
// 回执序号只在当前结果内有效；换一组结果后不能继承上一组的展开状态。
watch(
  () => props.entries,
  () => {
    openAttackDetails.value = new Set();
    openCriticalDetails.value = new Set();
  },
);

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function num(value: unknown): string {
  return Math.floor(finiteNumber(value)).toLocaleString();
}

function ceilNum(value: number): string {
  return Math.ceil(value).toLocaleString();
}

function pct(value: unknown): string {
  return `${(finiteNumber(value) * 100).toLocaleString(undefined, {
    useGrouping: false,
    maximumFractionDigits: 3,
  })}%`;
}

function mult(value: unknown): string {
  return `x${finiteNumber(value).toLocaleString(undefined, {
    useGrouping: false,
    maximumFractionDigits: 3,
  })}`;
}

function differsFromOne(value: number): boolean {
  return Math.abs(value - 1) > 0.000_001;
}

function renderModifierTooltip(
  items: readonly AppliedDamageModifier[],
  sequence: number,
): string | undefined {
  if (items.length === 0) return undefined;
  return renderModifierRows(items, sequence)
    .map(row => `${row.label} ${row.value}`)
    .join('\n');
}

function renderModifierRows(
  items: readonly AppliedDamageModifier[],
  sequence: number,
): DetailRow[] {
  return items.map(item => {
    const name =
      item.panelSource !== undefined
        ? props.contributionSourceLabel({ source: item.panelSource }, sequence)
        : item.buffId !== undefined
          ? (props.buffLabel?.(item) ?? item.buffId)
          : ((item.sourceActionId === undefined
              ? undefined
              : props.actionPresentation?.(item.sourceId, item.sourceActionId)?.name) ??
            props.operatorLabel?.(item.sourceId) ??
            item.sourceId);
    let value: string;
    if (item.kind === 'multiplyValue') value = mult(item.multiplier);
    else if (item.kind === 'damageScale')
      value =
        item.zone === 'product'
          ? mult(1 + item.addition)
          : `${item.addition >= 0 ? '+' : ''}${pct(item.addition)}`;
    else {
      const signed = item.value >= 0 ? '+' : '';
      const absolute = ['Atk', 'strength', 'agility', 'intellect', 'will'].includes(item.attribute);
      value =
        item.slot === 'finalMultiplier' || item.slot === 'baseFinalMultiplier'
          ? mult(item.value)
          : item.slot === 'multiplier' || item.slot === 'baseMultiplier'
            ? `${signed}${pct(item.value)}`
            : item.attribute.endsWith('Resistance')
              ? `${signed}${item.value.toFixed(1)}%`
              : absolute
                ? `${signed}${item.value.toLocaleString()}`
                : `${signed}${pct(item.value)}`;
      const factorAttribute = Object.entries(ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE).find(
        ([, attribute]) => attribute === item.attribute,
      )?.[0];
      const label =
        item.attribute === 'criticalRate'
          ? props.labels.criticalRate
          : item.attribute === 'criticalDamageIncrease'
            ? props.labels.criticalDamage
            : item.attribute === 'Atk'
              ? props.labels.attack
              : ['strength', 'agility', 'intellect', 'will'].includes(item.attribute)
                ? props.labels.attributeLabel(item.attribute)
                : factorAttribute !== undefined
                  ? `${props.labels.attributeLabel(factorAttribute)} ${props.labels.scalingCoefficient}`
                  : '';
      if (label) value = `${label} ${value}`;
    }
    return { label: name, value };
  });
}

function projectAttackDetail(data: CombatReceiptEntry['data']): AttackDetail | null {
  if (data === undefined || typeof data.attackDetailMainAttribute !== 'string') return null;
  if (typeof data.attackDetailSecondaryAttribute !== 'string') return null;
  const required = [
    data.attackDetailOperatorBase,
    data.attackDetailWeaponBase,
    data.attackDetailAttackPercent,
    data.attackDetailFlatAttack,
    data.attackDetailStrength,
    data.attackDetailAgility,
    data.attackDetailIntellect,
    data.attackDetailWill,
    data.attackDetailStrengthCoefficient,
    data.attackDetailAgilityCoefficient,
    data.attackDetailIntellectCoefficient,
    data.attackDetailWillCoefficient,
  ];
  if (required.some(value => typeof value !== 'number' || !Number.isFinite(value))) return null;
  const operatorBaseAttack = finiteNumber(data.attackDetailOperatorBase);
  const weaponBaseAttack = finiteNumber(data.attackDetailWeaponBase);
  const attackPercent = finiteNumber(data.attackDetailAttackPercent);
  const flatAttack = finiteNumber(data.attackDetailFlatAttack);
  const baseAttackTotal = operatorBaseAttack + weaponBaseAttack;
  const attributes = ['strength', 'agility', 'intellect', 'will'] as const;
  const values = {
    strength: finiteNumber(data.attackDetailStrength),
    agility: finiteNumber(data.attackDetailAgility),
    intellect: finiteNumber(data.attackDetailIntellect),
    will: finiteNumber(data.attackDetailWill),
  };
  const coefficients = {
    strength: finiteNumber(data.attackDetailStrengthCoefficient),
    agility: finiteNumber(data.attackDetailAgilityCoefficient),
    intellect: finiteNumber(data.attackDetailIntellectCoefficient),
    will: finiteNumber(data.attackDetailWillCoefficient),
  };
  const attributeContributions = attributes
    .map(key => ({
      key,
      value: values[key],
      coefficient: coefficients[key],
      contribution: Math.floor(values[key]) * coefficients[key],
      isMain: key === data.attackDetailMainAttribute,
      isSecondary: key === data.attackDetailSecondaryAttribute,
    }))
    .filter(row => coefficients[row.key] !== 0)
    .sort(
      (left, right) =>
        Number(right.isMain) - Number(left.isMain) ||
        Number(right.isSecondary) - Number(left.isSecondary),
    );
  const basicTotal = finiteNumber(
    data.attackDetailActualBase,
    baseAttackTotal * (1 + attackPercent) + flatAttack,
  );
  const rawBase = finiteNumber(data.attackDetailRawBase, baseAttackTotal);
  // 舍入不能改变公式算出的整数攻击；必要时增加显示精度。
  let precision = 3;
  const rounded = (value: number) => Number(value.toFixed(precision));
  while (
    precision < 15 &&
    Math.floor(
      rounded(basicTotal) *
        (1 +
          attributeContributions.reduce(
            (sum, row) => sum + Math.floor(row.value) * rounded(row.coefficient),
            0,
          )),
    ) !== data.attack
  )
    precision++;
  const precise = (value: number) =>
    rounded(value).toLocaleString(undefined, { maximumFractionDigits: precision });
  const attributeFormula = attributeContributions
    .map(
      row =>
        `${props.labels.attributeLabel(row.key)} ${Math.floor(row.value)} × ${precise(row.coefficient)}`,
    )
    .join(' + ');
  const formula = [
    `${props.labels.attack} = ⌊${props.labels.basicTotal} × (1 + ${props.labels.attributeBonus})⌋`,
    `= ⌊${precise(basicTotal)} × (1 + ${attributeFormula || '0'})⌋`,
    `= ${num(data.attack)}`,
  ];
  // 基础四槽与最终四槽分阶段显示；不把 Buff 的最终乘数伪装成面板百分比加算。
  const slot = (name: string, fallback = 0) =>
    finiteNumber(data[`attackDetailSlot:${name}`], fallback);
  const armed = finiteNumber(data.attackDetailArmedBase, basicTotal);
  const bounded = (expression: string, value: number) => {
    if (typeof data.attackDetailMinimum === 'number' && value < data.attackDetailMinimum)
      return `max(${precise(data.attackDetailMinimum)}, ${expression})`;
    if (typeof data.attackDetailMaximum === 'number' && value > data.attackDetailMaximum)
      return `min(${precise(data.attackDetailMaximum)}, ${expression})`;
    return expression;
  };
  const baseValue = Math.min(
    finiteNumber(data.attackDetailMaximum, Infinity),
    Math.max(finiteNumber(data.attackDetailMinimum, -Infinity), rawBase + slot('baseAddition')),
  );
  const baseExpression = bounded(
    `(${precise(rawBase)} + ${precise(slot('baseAddition'))})`,
    rawBase + slot('baseAddition'),
  );
  const baseMultiplier =
    attackPercent < -1
      ? `max(0, 1 + ${precise(attackPercent)})`
      : `(1 + ${precise(attackPercent)})`;
  formula.push('', `${props.labels.basicTotal}:`);
  formula.push(`${baseExpression} × ${baseMultiplier} + ${precise(flatAttack)}`);
  if (slot('baseFinalMultiplier', 1) !== 1)
    formula[formula.length - 1] =
      `(${formula[formula.length - 1]}) × ${precise(slot('baseFinalMultiplier', 1))}`;
  formula[formula.length - 1] =
    bounded(
      formula[formula.length - 1]!,
      (baseValue * Math.max(0, 1 + attackPercent) + flatAttack) * slot('baseFinalMultiplier', 1),
    ) + ` ≈ ${precise(armed)}`;
  if (
    slot('addition') !== 0 ||
    slot('multiplier') !== 0 ||
    slot('finalAddition') !== 0 ||
    slot('finalMultiplier', 1) !== 1
  ) {
    const multiplier =
      slot('multiplier') < -1
        ? `max(0, 1 + ${precise(slot('multiplier'))})`
        : `(1 + ${precise(slot('multiplier'))})`;
    const expression = `((${precise(armed)} + ${precise(slot('addition'))}) × ${multiplier} + ${precise(slot('finalAddition'))}) × ${precise(slot('finalMultiplier', 1))}`;
    formula.push(
      bounded(
        expression,
        ((armed + slot('addition')) * Math.max(0, 1 + slot('multiplier')) + slot('finalAddition')) *
          slot('finalMultiplier', 1),
      ) + ` ≈ ${precise(basicTotal)}`,
    );
  }
  return {
    formula: formula.join('\n'),
    basicTotal,
    baseAttackTotal,
    operatorBaseAttack,
    weaponBaseAttack,
    attackBonus: baseAttackTotal * attackPercent + flatAttack,
    flatAttack,
    attackPercent,
    attributeBonus: attributeContributions.reduce((sum, row) => sum + row.contribution, 0),
    attributeContributions,
  };
}

function signedNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${Math.ceil(value).toLocaleString()}`;
}

function signedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function attackSlotValue(slot: AttributeModifierSlot, value: number | null): string {
  if (value === null) return '—';
  if (slot === 'baseFinalMultiplier' || slot === 'finalMultiplier') return mult(value);
  if (slot === 'baseMultiplier' || slot === 'multiplier') return signedPercent(value);
  return signedNumber(value);
}

function toggleAttackDetail(key: number): void {
  const next = new Set(openAttackDetails.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  openAttackDetails.value = next;
}

function toggleCriticalDetail(key: number): void {
  const next = new Set(openCriticalDetails.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  openCriticalDetails.value = next;
}

const damageDetails = computed<readonly DamageDetail[]>(() =>
  props.entries.flatMap(entry => {
    if (entry.event !== 'DamageApplied') return [];
    const data = entry.data ?? {};
    const actualValue = finiteNumber(data.value);
    const expectedDamage = finiteNumber(data.expectedDamage, actualValue);
    const nonCriticalDamage = finiteNumber(data.nonCriticalDamage, actualValue);
    const criticalDamage = finiteNumber(data.criticalDamage, actualValue);
    const skillType = typeof data.skillType === 'string' ? data.skillType : null;
    const damageType = typeof data.damageType === 'string' ? data.damageType : null;
    const standardCalculation = data.standardCalculation === true;
    const damageScaleMultiplier = finiteNumber(data.damageScaleMultiplier, 1);
    const criticalRate = finiteNumber(data.criticalRate);
    const criticalRateEffective =
      data.canCritical === false ? 0 : Math.min(Math.max(criticalRate, 0), 1);
    const criticalDamageIncrease = finiteNumber(data.criticalDamageIncrease);
    const criticalExpectation = finiteNumber(data.criticalExpectationMultiplier, 1);
    const criticalMultiplier = finiteNumber(data.criticalMultiplier, 1);
    const isCritical = data.isCritical === true;
    const directMultiplier = finiteNumber(data.directDamageMultiplier, 1);
    const damageTakenMultiplier = finiteNumber(data.damageTakenMultiplier, 1);
    const resistanceMultiplier = finiteNumber(data.resistancePercentMultiplier, 1);
    const contextRows: DetailRow[] = [];
    const sourceDescription = props.sourceDescription?.(entry);
    if (sourceDescription && props.sourceLabel) {
      contextRows.push({ label: props.sourceLabel, value: sourceDescription });
    }
    if (
      skillType !== null &&
      data.reactionDamageKind === undefined &&
      data.spellBurstType === undefined
    ) {
      contextRows.push({ label: props.labels.skillType, value: props.skillTypeLabel(skillType) });
    }
    if (damageType !== null) {
      contextRows.push({ label: props.labels.element, value: props.damageTypeLabel(damageType) });
    }
    const baseRows: DetailRow[] = [
      ...(standardCalculation
        ? [
            {
              label: props.labels.skillMultiplier,
              value: pct(finiteNumber(data.skillMultiplierPercent) / 100),
            },
          ]
        : []),
      { label: props.labels.baseDamage, value: num(data.baseDamage) },
    ];
    const multiplierRows: DetailRow[] = [];
    const modifiers = origins.value
      .directModifiers(origins.value.get({ kind: 'receipt', sequence: entry.sequence }))
      .map(item => item.modifier);
    const attributes = (side: DamageModifierSide, keys: readonly string[]) =>
      modifiers.filter(
        item => item.kind === 'attribute' && item.side === side && keys.includes(item.attribute),
      );
    const modifierRows = (items: readonly AppliedDamageModifier[]) =>
      renderModifierRows(items, entry.sequence);
    const modifierTooltip = (items: readonly AppliedDamageModifier[]) =>
      renderModifierTooltip(items, entry.sequence);
    const criticalTooltip =
      [...modifierRows(attributes('attacker', ['criticalRate', 'criticalDamageIncrease']))]
        .map(row => `${row.label} ${row.value}`)
        .join('\n') || undefined;
    const criticalSources = (attribute: 'criticalRate' | 'criticalDamageIncrease') =>
      attributes('attacker', [attribute]).map(item => {
        const row = modifierRows([item])[0]!;
        const value =
          item.kind === 'attribute' &&
          (item.slot === 'finalMultiplier' || item.slot === 'baseFinalMultiplier')
            ? mult(item.value)
            : item.kind === 'attribute'
              ? `${item.value >= 0 ? '+' : ''}${pct(item.value)}`
              : row.value;
        return { label: row.label, value };
      });
    const criticalRateSources = criticalSources('criticalRate');
    const criticalDamageSources = criticalSources('criticalDamageIncrease');
    const hasZones = DAMAGE_SCALE_ZONES.some(
      zone => typeof data[`damageScale:${zone}`] === 'number',
    );
    const staggerSources = modifiers.filter(
      item =>
        item.kind === 'damageScale' &&
        item.zone === 'product' &&
        item.buffId === POISE_BREAK_BUFF_ID,
    );
    const staggerMultiplier = staggerSources.reduce(
      (value, item) => value * (item.kind === 'damageScale' ? 1 + item.addition : 1),
      1,
    );
    const zoneOrder: Record<DamageScaleZone, number> = {
      normal: 0,
      abnormalAndBurst: 1,
      race: 2,
      enhanced: 4,
      product: 5,
      vulnerable: 7,
      combo: 9,
    };
    if (hasZones) {
      for (const zone of DAMAGE_SCALE_ZONES) {
        if (zone === 'normal' && typeof data['damageScale:normal:attacker'] === 'number') {
          for (const side of ['attacker', 'defender'] as const) {
            const value = finiteNumber(data[`damageScale:normal:${side}`], 1);
            const sources = modifiers.filter(
              item => item.kind !== 'multiplyValue' && item.zone === zone && item.side === side,
            );
            if (!differsFromOne(value) && sources.length === 0) continue;
            multiplierRows.push({
              label: side === 'attacker' ? props.labels.damageBonus : props.labels.damageTaken,
              order: side === 'attacker' ? 0 : 8,
              detail: `${value >= 1 ? '+' : ''}${pct(value - 1)}`,
              value: mult(value),
              factor: value,
              tooltip: modifierTooltip(sources),
            });
          }
          continue;
        }
        const value =
          finiteNumber(data[`damageScale:${zone}`], 1) /
          (zone === 'product' && staggerMultiplier !== 0 ? staggerMultiplier : 1);
        const sources = modifiers.filter(
          item =>
            item.kind !== 'multiplyValue' && item.zone === zone && !staggerSources.includes(item),
        );
        if (!differsFromOne(value) && sources.length === 0) continue;
        const comboInstances = new Map(
          sources
            .filter(item => item.consumedStacks !== undefined)
            .map(
              item =>
                [
                  item.buff ? `${item.buff.ownerId}:${item.buff.instanceId}` : item,
                  item.consumedStacks!,
                ] as const,
            ),
        );
        multiplierRows.push({
          label: props.damageZoneLabel?.(zone) ?? props.labels.damageBonus,
          order: zoneOrder[zone],
          detail:
            zone === 'combo' && comboInstances.size > 0
              ? props.labels.stacksDetail(
                  [...comboInstances.values()].reduce((sum, count) => sum + count, 0),
                )
              : `${value >= 1 ? '+' : ''}${pct(value - 1)}`,
          value: mult(value),
          factor: value,
          tooltip: modifierTooltip(sources),
        });
      }
    } else if (differsFromOne(damageScaleMultiplier)) {
      multiplierRows.push({
        label: props.labels.damageBonus,
        order: 0,
        detail: damageScaleMultiplier >= 1 ? `+${pct(damageScaleMultiplier - 1)}` : undefined,
        value: mult(damageScaleMultiplier),
        factor: damageScaleMultiplier,
        tooltip: modifierTooltip(modifiers.filter(item => item.kind === 'damageScale')),
      });
    }
    if (props.randomMode === 'expected') {
      multiplierRows.push({
        kind: 'crit',
        label: props.labels.criticalExpectation,
        order: 3,
        tooltip: criticalTooltip,
        detail: `${pct(criticalRateEffective)} × ${pct(criticalDamageIncrease)}`,
        value: mult(criticalExpectation),
        factor: criticalExpectation,
      });
    }
    if (props.randomMode === 'sampled') {
      const criticalResult =
        data.canCritical === false
          ? props.labels.cannotCritical
          : isCritical
            ? props.labels.criticalHit
            : props.labels.nonCriticalHit;
      multiplierRows.push({
        kind: 'crit',
        label: props.labels.criticalResult,
        order: 3,
        tooltip: criticalTooltip,
        detail: `${props.labels.criticalRate} ${pct(criticalRateEffective)} · ${criticalResult}`,
        value: mult(criticalMultiplier),
        factor: criticalMultiplier,
      });
    }
    if (differsFromOne(directMultiplier)) {
      multiplierRows.push({
        label: props.labels.directMultiplier,
        order: 6,
        tooltip: modifierTooltip([
          ...modifiers.filter(item => item.kind === 'multiplyValue'),
          ...attributes('attacker', ['weaknessDamageMultiplier']),
          ...attributes('defender', ['shelterDamageMultiplier']),
        ]),
        value: mult(directMultiplier),
        factor: directMultiplier,
      });
    }
    if (differsFromOne(damageTakenMultiplier)) {
      multiplierRows.push({
        label: props.labels.damageTaken,
        order: 8,
        detail: damageTakenMultiplier >= 1 ? `+${pct(damageTakenMultiplier - 1)}` : undefined,
        value: mult(damageTakenMultiplier),
        factor: damageTakenMultiplier,
      });
    }
    multiplierRows.push({
      label: props.labels.defenseMultiplier,
      order: 10,
      detail: props.labels.defenseDetail(Math.floor(finiteNumber(data.enemyDefense))),
      value: mult(data.defenseMultiplier),
      factor: finiteNumber(data.defenseMultiplier, 1),
    });
    if (typeof data.levelCoefficient === 'number') {
      multiplierRows.push({
        label: props.labels.levelCoefficient,
        order: 14,
        detail:
          typeof data.sourceLevel === 'number'
            ? props.labels.levelDetail(data.sourceLevel)
            : undefined,
        value: mult(data.levelCoefficient),
        factor: data.levelCoefficient,
        tooltip: modifierTooltip(
          attributes('attacker', ['IgniteDamageScalar', 'PhysicalInflictionDamageScalar']),
        ),
      });
    }
    if (typeof data.artsIntensityMultiplier === 'number') {
      multiplierRows.push({
        label: props.labels.artsIntensity,
        order: 15,
        detail:
          typeof data.artsIntensity === 'number'
            ? props.labels.artsIntensityDetail(data.artsIntensity)
            : undefined,
        value: mult(data.artsIntensityMultiplier),
        factor: data.artsIntensityMultiplier,
      });
    }
    if (differsFromOne(resistanceMultiplier)) {
      multiplierRows.push({
        label: props.labels.resistanceMultiplier,
        order: 11,
        tooltip: modifierTooltip(
          attributes('defender', [
            (
              {
                physical: 'PhysicalResistance',
                heat: 'FireResistance',
                electric: 'PulseResistance',
                cryo: 'CrystResistance',
                nature: 'NaturalResistance',
                ether: 'EtherResistance',
              } as Record<string, string>
            )[damageType ?? ''] ?? '',
          ]),
        ),
        detail:
          typeof data.enemyBaseResistancePercent === 'number' &&
          data.enemyBaseResistancePercent !== data.enemyResistancePercent
            ? `${pct(data.enemyBaseResistancePercent / 100)} → ${pct(finiteNumber(data.enemyResistancePercent) / 100)}`
            : pct(finiteNumber(data.enemyResistancePercent) / 100),
        value: mult(resistanceMultiplier),
        factor: resistanceMultiplier,
      });
    }
    for (const row of [
      {
        label: props.labels.staggerMultiplier,
        order: 12,
        factor: staggerMultiplier,
        tooltip: modifierTooltip(staggerSources),
      },
      {
        label: props.labels.finisherMultiplier,
        order: 13,
        factor: finiteNumber(data.finisherMultiplier, 1),
      },
      {
        label: props.labels.additionalScale,
        order: 16,
        factor: finiteNumber(data.additionalScaleMultiplier, 1),
      },
    ]) {
      if (differsFromOne(row.factor)) multiplierRows.push({ ...row, value: mult(row.factor) });
    }
    multiplierRows.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    const forced =
      props.resultForceCritical &&
      data.canCritical !== false &&
      Math.abs(criticalDamage - nonCriticalDamage) > 0.000_001;
    const formulaNumber = (value: number) =>
      value.toLocaleString(undefined, { maximumFractionDigits: 3 });
    const formulaFactors = multiplierRows.map(row => {
      const critical =
        row.label === props.labels.criticalExpectation || row.label === props.labels.criticalResult;
      return `${forced && critical ? props.labels.criticalHit : row.label}（${formulaNumber(forced && critical ? 1 + criticalDamageIncrease : (row.factor ?? 1))}）`;
    });
    const formulaBase = standardCalculation
      ? `${props.labels.attack}（${formulaNumber(finiteNumber(data.attack))}）\n× ${props.labels.skillMultiplier}（${formulaNumber(finiteNumber(data.skillMultiplierPercent) / 100)}）`
      : `${props.labels.baseDamage}（${formulaNumber(finiteNumber(data.baseDamage))}）`;
    const formulaResult = forced
      ? criticalDamage
      : props.randomMode === 'expected'
        ? expectedDamage
        : actualValue;
    const formulaLabel = forced
      ? props.labels.forcedDamage
      : props.randomMode === 'expected'
        ? props.labels.expectedDamage
        : props.labels.actualDamage;
    const formulaTooltip =
      typeof data.baseDamage === 'number'
        ? [
            formulaBase,
            ...formulaFactors.map(factor => `× ${factor}`),
            `≈ ${formulaLabel}（${num(formulaResult)}）`,
          ].join('\n')
        : undefined;
    const attackDetail = projectAttackDetail(entry.data);
    const attackModifiers = attributes('attacker', ['Atk']);
    const attackSlotValues = Object.fromEntries(
      ATTRIBUTE_MODIFIER_SLOTS.map(slot => {
        const value = data[`attackDetailSlot:${slot}`];
        return [slot, typeof value === 'number' && Number.isFinite(value) ? value : null];
      }),
    ) as Record<AttributeModifierSlot, number | null>;
    const attackSlotSources = Object.fromEntries(
      ATTRIBUTE_MODIFIER_SLOTS.map(slot => [
        slot,
        modifierRows(
          attackModifiers.filter(item => item.kind === 'attribute' && item.slot === slot),
        ),
      ]),
    ) as Record<AttributeModifierSlot, DetailRow[]>;
    return [
      {
        formulaTooltip,
        attackFormulaTooltip: attackDetail?.formula,
        attributeSources: Object.fromEntries(
          (attackDetail?.attributeContributions ?? []).map(row => [
            row.key,
            [
              ...modifierRows(
                attributes('attacker', [
                  row.key,
                  ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE[row.key as OperatorAttribute],
                ]),
              ),
            ],
          ]),
        ),
        key: entry.sequence,
        headline: props.randomMode === 'expected' ? expectedDamage : actualValue,
        expectedDamage,
        criticalDamage,
        nonCriticalDamage,
        canCritical: data.canCritical !== false,
        canForceCritical:
          data.canCritical !== false && Math.abs(criticalDamage - nonCriticalDamage) > 0.000_001,
        attackValue: num(data.attack),
        criticalRateRaw: criticalRate,
        criticalRateEffective,
        criticalDamageIncrease,
        criticalRateSources,
        criticalDamageSources,
        attackSources: modifierRows(attackModifiers),
        attackSlotValues,
        attackSlotSources,
        otherAttackSlots: (
          [
            'baseAddition',
            'baseMultiplier',
            'baseFinalAddition',
            'baseFinalMultiplier',
            'addition',
            'multiplier',
            'finalAddition',
            'finalMultiplier',
          ] as const
        ).filter(
          slot =>
            (attackSlotSources[slot].length > 0 ||
              (attackSlotValues[slot] !== null &&
                Math.abs(
                  attackSlotValues[slot] -
                    (slot === 'baseFinalMultiplier' || slot === 'finalMultiplier' ? 1 : 0),
                ) > 0.000_001)) &&
            (attackDetail === null || (slot !== 'baseMultiplier' && slot !== 'baseFinalAddition')),
        ),
        attackDetail,
        contextRows,
        baseRows,
        multiplierRows,
      },
    ];
  }),
);

const canForceCritical = computed(() =>
  damageDetails.value.some(detail => detail.canForceCritical),
);

function onClose(): void {
  openAttackDetails.value = new Set();
  openCriticalDetails.value = new Set();
  emit('close');
}
</script>

<template>
  <InputRegionBoundary label="TimelineHitDetailDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="labels.dialogTitle"
      width="420px"
      class="hit-damage-detail-dialog"
      :close-on-click-modal="true"
      append-to-body
      @close="onClose"
    >
      <slot name="status" />
      <div
        v-if="damageDetails.length > 0"
        class="hit-detail-content"
        :class="{ 'is-multiple': damageDetails.length > 1 }"
      >
        <template v-for="detail in damageDetails" :key="detail.key">
          <template v-if="detail.contextRows.length > 0">
            <div class="section-label">{{ labels.context }}</div>
            <table class="stat-table">
              <tbody>
                <tr v-for="row in detail.contextRows" :key="row.label">
                  <td class="label-cell">{{ row.label }}</td>
                  <td class="value-cell">{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <div class="section-label">{{ labels.result }}</div>
          <div class="damage-result">
            <div class="expected-damage">
              <span class="damage-label"
                >{{
                  resultForceCritical && detail.canForceCritical
                    ? labels.forcedDamage
                    : randomMode === 'expected'
                      ? labels.expectedDamage
                      : labels.actualDamage
                }}
                <EaTooltip
                  v-if="detail.formulaTooltip"
                  :content="detail.formulaTooltip"
                  placement="top"
                  :show-after="80"
                  popper-class="hit-detail-source-tooltip"
                >
                  <el-icon class="hint-icon" tabindex="0" :aria-label="labels.multipliers"
                    ><Warning
                  /></el-icon>
                </EaTooltip>
              </span>
              <span class="damage-result-value">
                <span
                  class="damage-value"
                  :class="{ forced: resultForceCritical && detail.canForceCritical }"
                  >{{
                    num(
                      resultForceCritical && detail.canForceCritical
                        ? detail.criticalDamage
                        : detail.headline,
                    )
                  }}</span
                >
              </span>
            </div>
            <table class="stat-table">
              <tbody>
                <tr v-if="detail.canCritical" class="dim">
                  <td class="label-cell">{{ labels.criticalDamage }}</td>
                  <td class="value-cell">{{ num(detail.criticalDamage) }}</td>
                </tr>
                <tr v-if="randomMode === 'sampled'" class="dim">
                  <td class="label-cell">{{ labels.expectedDamage }}</td>
                  <td class="value-cell">{{ num(detail.expectedDamage) }}</td>
                </tr>
                <tr class="dim">
                  <td class="label-cell">{{ labels.nonCriticalDamage }}</td>
                  <td class="value-cell">{{ num(detail.nonCriticalDamage) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-label">{{ labels.base }}</div>
          <table class="stat-table">
            <tbody>
              <tr
                class="expandable-row"
                :class="{
                  'is-disabled': detail.attackDetail === null && detail.attackSources.length === 0,
                }"
                @click="
                  detail.attackDetail !== null || detail.attackSources.length > 0
                    ? toggleAttackDetail(detail.key)
                    : undefined
                "
              >
                <td class="label-cell">
                  <el-icon
                    v-if="detail.attackDetail !== null || detail.attackSources.length > 0"
                    class="expand-icon"
                    :class="{ 'is-open': openAttackDetails.has(detail.key) }"
                  >
                    <ArrowRight />
                  </el-icon>
                  {{ labels.attack }}
                  <EaTooltip
                    v-if="detail.attackFormulaTooltip"
                    :content="detail.attackFormulaTooltip"
                    placement="top"
                    :show-after="80"
                    popper-class="hit-detail-source-tooltip"
                  >
                    <el-icon class="hint-icon" tabindex="0" :aria-label="labels.attack" @click.stop
                      ><Warning
                    /></el-icon>
                  </EaTooltip>
                </td>
                <td class="value-cell">{{ detail.attackValue }}</td>
              </tr>
              <template v-if="openAttackDetails.has(detail.key)">
                <template v-if="detail.attackDetail !== null">
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ labels.basicTotal }}</td>
                    <td class="value-cell">{{ ceilNum(detail.attackDetail.basicTotal) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-2">{{ labels.baseAttack }}</td>
                    <td class="value-cell">{{ ceilNum(detail.attackDetail.baseAttackTotal) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ labels.operatorAttack }}</td>
                    <td class="value-cell">
                      {{ ceilNum(detail.attackDetail.operatorBaseAttack) }}
                    </td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ labels.weaponAttack }}</td>
                    <td class="value-cell">{{ ceilNum(detail.attackDetail.weaponBaseAttack) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-2">{{ labels.attackBonus }}</td>
                    <td class="value-cell">{{ signedNumber(detail.attackDetail.attackBonus) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ labels.flatAttack }}</td>
                    <td class="value-cell">{{ signedNumber(detail.attackDetail.flatAttack) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in detail.attackSlotSources.baseFinalAddition"
                    :key="`flat-${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-4">{{ labels.fromSource(source.label) }}</td>
                    <td class="value-cell">{{ source.value }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ labels.percentageAttack }}</td>
                    <td class="value-cell">{{ pct(detail.attackDetail.attackPercent) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in detail.attackSlotSources.baseMultiplier"
                    :key="`percent-${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-4">{{ labels.fromSource(source.label) }}</td>
                    <td class="value-cell">{{ source.value }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ labels.attributeBonus }}</td>
                    <td class="value-cell">
                      {{ signedPercent(detail.attackDetail.attributeBonus) }}
                    </td>
                  </tr>
                  <template
                    v-for="attribute in detail.attackDetail.attributeContributions"
                    :key="attribute.key"
                  >
                    <tr
                      class="sub-row dim"
                      :class="{ 'is-main': attribute.isMain, 'is-sub': attribute.isSecondary }"
                    >
                      <td class="label-cell indent-2">
                        {{ labels.fromSource(labels.attributeLabel(attribute.key)) }}
                      </td>
                      <td class="value-cell">{{ signedPercent(attribute.contribution) }}</td>
                    </tr>
                    <tr
                      v-for="(source, index) in detail.attributeSources[attribute.key]"
                      :key="index"
                      class="sub-row dim"
                    >
                      <td class="label-cell indent-3">{{ labels.fromSource(source.label) }}</td>
                      <td class="value-cell">{{ source.value }}</td>
                    </tr>
                  </template>
                </template>
                <template v-for="slot in detail.otherAttackSlots" :key="slot">
                  <tr class="sub-row dim">
                    <td class="label-cell indent-1">{{ labels.attackSlot(slot) }}</td>
                    <td class="value-cell">
                      {{ attackSlotValue(slot, detail.attackSlotValues[slot]) }}
                    </td>
                  </tr>
                  <tr
                    v-for="(source, index) in detail.attackSlotSources[slot]"
                    :key="index"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-2">{{ labels.fromSource(source.label) }}</td>
                    <td class="value-cell">{{ source.value }}</td>
                  </tr>
                </template>
              </template>
              <tr
                v-for="row in detail.baseRows"
                :key="row.label"
                :class="{ bold: row.label === labels.baseDamage }"
              >
                <td class="label-cell">{{ row.label }}</td>
                <td class="value-cell">{{ row.value }}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-label">{{ labels.multipliers }}</div>
          <table class="stat-table">
            <tbody>
              <template v-for="row in detail.multiplierRows" :key="row.label">
                <tr
                  :class="{ 'expandable-row': row.kind === 'crit' }"
                  @click="row.kind === 'crit' ? toggleCriticalDetail(detail.key) : undefined"
                >
                  <td class="label-cell">
                    <el-icon
                      v-if="row.kind === 'crit'"
                      class="expand-icon"
                      :class="{ 'is-open': openCriticalDetails.has(detail.key) }"
                    >
                      <ArrowRight />
                    </el-icon>
                    {{ row.label }}
                    <EaTooltip
                      v-if="row.tooltip"
                      :content="row.tooltip"
                      placement="top"
                      :show-after="80"
                      popper-class="hit-detail-source-tooltip"
                    >
                      <span class="hint-icon" aria-hidden="true">ⓘ</span>
                    </EaTooltip>
                    <span v-if="row.detail" class="mult-detail">{{ row.detail }}</span>
                  </td>
                  <td class="value-cell mult-value">{{ row.value }}</td>
                </tr>
                <template v-if="row.kind === 'crit' && openCriticalDetails.has(detail.key)">
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ labels.criticalRateStat }}</td>
                    <td class="value-cell">{{ pct(detail.criticalRateEffective) }}</td>
                  </tr>
                  <tr v-if="detail.canCritical && detail.criticalRateRaw > 1" class="sub-row dim">
                    <td class="label-cell indent-2">{{ labels.rawCriticalRate }}</td>
                    <td class="value-cell">{{ pct(detail.criticalRateRaw) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in detail.criticalRateSources"
                    :key="`critical-rate-${index}`"
                    class="sub-row dim"
                  >
                    <td
                      class="label-cell"
                      :class="
                        detail.canCritical && detail.criticalRateRaw > 1 ? 'indent-3' : 'indent-2'
                      "
                    >
                      {{ source.label }}
                    </td>
                    <td class="value-cell">{{ source.value }}</td>
                  </tr>
                  <tr v-if="detail.canCritical && detail.criticalRateRaw > 1" class="sub-row dim">
                    <td class="label-cell indent-2">{{ labels.criticalRateCap }}</td>
                    <td class="value-cell">{{ pct(detail.criticalRateEffective) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ labels.criticalDamageStat }}</td>
                    <td class="value-cell">{{ pct(detail.criticalDamageIncrease) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in detail.criticalDamageSources"
                    :key="`critical-damage-${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-2">{{ source.label }}</td>
                    <td class="value-cell">{{ source.value }}</td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
          <CombatObjectOriginGraph
            kind="damage"
            :action-presentation="actionPresentation"
            :object-icon="objectIcon"
            :origins="origins"
            :sequence="detail.key"
            :operator-label="operatorLabel"
          />
        </template>
      </div>
      <div v-else class="hit-detail-empty">—</div>

      <template #footer>
        <EaDialogActions align="start">
          <EaCheckbox
            v-if="canForceCritical && allowForceCritical !== false"
            class="force-crit-check"
            :model-value="forceCritical"
            @change="emit('toggleForceCritical', $event)"
            >{{ labels.forceCrit }}</EaCheckbox
          >
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.hint-icon {
  margin-left: 4px;
  color: inherit;
  opacity: 0.55;
  font-size: 12px;
  line-height: 1;
  cursor: help;
  vertical-align: baseline;
}
.hit-detail-content {
  color: var(--ea-fg, #f0f0f0);
  font-size: 13px;
}
.hit-detail-content.is-multiple {
  max-height: calc(80dvh - 120px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.section-label {
  margin: 12px 0 6px;
  color: var(--ea-fg-muted, #aaa);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.section-label:first-child {
  margin-top: 0;
}
.stat-table {
  width: 100%;
  border-collapse: collapse;
}
.stat-table tr {
  border-bottom: 1px solid var(--ea-border-soft, rgb(255 255 255 / 6%));
}
.stat-table tr:last-child {
  border-bottom: 0;
}
.stat-table td {
  padding: 5px 4px;
}
.label-cell {
  color: var(--ea-fg-secondary, #ddd);
}
.value-cell {
  color: var(--ea-fg, #eee);
  font-family: monospace;
  text-align: right;
  white-space: nowrap;
}
.bold {
  font-weight: 600;
}
.dim {
  opacity: 0.72;
  font-size: 12px;
}
.indent-1 {
  padding-left: 16px !important;
}
.indent-2 {
  padding-left: 28px !important;
}
.indent-3 {
  padding-left: 40px !important;
}
.indent-4 {
  padding-left: 52px !important;
}
.expandable-row {
  cursor: pointer;
}
.expandable-row:hover {
  background: var(--ea-hover-fill, rgb(255 255 255 / 5%));
}
.expandable-row.is-disabled {
  cursor: default;
}
.expandable-row.is-disabled:hover {
  background: transparent;
}
.expand-icon {
  margin-right: 4px;
  vertical-align: -2px;
  color: var(--ea-fg-muted, #888);
  font-size: 12px;
  transition:
    transform 0.18s ease,
    color 0.18s ease;
}
.expand-icon.is-open {
  transform: rotate(90deg);
  color: var(--ea-fg-secondary, #bbb);
}
.expandable-row:hover .expand-icon {
  color: var(--ea-fg-secondary, #bbb);
}
.sub-row {
  border-bottom-color: var(--ea-border-soft, rgb(255 255 255 / 3%)) !important;
}
tr.is-main {
  background: color-mix(in srgb, var(--ea-gold, #ffc107) 10%, transparent);
}
tr.is-sub {
  background: var(--ea-fill-soft, rgb(158 158 158 / 8%));
}
.damage-result {
  margin-bottom: 4px;
}
.expected-damage {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid var(--ea-border-soft, rgb(255 255 255 / 6%));
}
.damage-label {
  color: var(--ea-fg-secondary, #ddd);
  font-weight: 600;
}
.damage-value {
  color: #e25555;
  font-family: monospace;
  font-size: 20px;
  font-weight: 700;
}
.damage-result-value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.damage-value.forced {
  color: var(--ea-gold);
  text-shadow: none;
}
.mult-detail {
  margin-left: 6px;
  color: var(--ea-fg-muted, #888);
  font-size: 11px;
}
.mult-value {
  color: #3b82c4;
}
.hit-detail-empty {
  padding: 24px 0 18px;
  color: var(--ea-fg-muted);
  text-align: center;
}
</style>

<style>
.hit-detail-source-tooltip {
  max-width: min(320px, calc(100vw - 48px));
  white-space: pre-line;
  line-height: 1.45;
}
html[data-theme='dark'] .hit-damage-detail-dialog .damage-value {
  color: #ff6b6b;
}
html[data-theme='dark'] .hit-damage-detail-dialog .damage-value.forced {
  color: #ffd166;
  text-shadow: 0 0 8px rgb(255 209 102 / 35%);
}
html[data-theme='dark'] .hit-damage-detail-dialog .mult-value {
  color: #b8d4ff;
}
</style>
