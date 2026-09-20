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
import type {
  OperatorPanelContributionReceipt,
  ResolvedOperatorPanel,
} from '../../../core/compiler/resolveOperatorPanel';

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
  operatorPanel: ResolvedOperatorPanel | null;
  operatorPanelForEntry?: (entry: CombatReceiptEntry) => ResolvedOperatorPanel | null;
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
    staticBuildAttack: string;
    basicTotal: string;
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
    criticalHit: string;
    nonCriticalHit: string;
    cannotCritical: string;
    directMultiplier: string;
    damageTaken: string;
    defenseMultiplier: string;
    resistanceMultiplier: string;
    defenseDetail: (value: number) => string;
  };
}>();

const emit = defineEmits<{ close: []; toggleForceCritical: [forced: boolean] }>();
const origins = computed(() => new CombatObjectOrigins(props.receiptEntries ?? props.entries));

interface DetailRow {
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
  readonly staticAttack: number | null;
  readonly attackSources: readonly DetailRow[];
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
  readonly attributeContributions: readonly AttackAttributeContribution[];
}

const openAttackDetails = ref<ReadonlySet<number>>(new Set());
// 回执序号只在当前结果内有效；换一组结果后不能继承上一组的展开状态。
watch(
  () => props.entries,
  () => {
    openAttackDetails.value = new Set();
  },
);

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function num(value: unknown): string {
  return Math.floor(finiteNumber(value)).toLocaleString();
}

function pct(value: unknown): string {
  return `${(finiteNumber(value) * 100).toLocaleString(undefined, {
    useGrouping: false,
    minimumFractionDigits: 1,
    maximumFractionDigits: 6,
  })}%`;
}

function mult(value: unknown): string {
  return `x${finiteNumber(value).toLocaleString(undefined, {
    useGrouping: false,
    minimumFractionDigits: 3,
    maximumFractionDigits: 6,
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
    attributeContributions,
  };
}

function toggleAttackDetail(key: number): void {
  const next = new Set(openAttackDetails.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  openAttackDetails.value = next;
}

const damageDetails = computed<readonly DamageDetail[]>(() =>
  props.entries.flatMap(entry => {
    if (entry.event !== 'DamageApplied') return [];
    const data = entry.data ?? {};
    const panel = props.operatorPanelForEntry
      ? props.operatorPanelForEntry(entry)
      : props.operatorPanel;
    const actualValue = finiteNumber(data.value);
    const expectedDamage = finiteNumber(data.expectedDamage, actualValue);
    const nonCriticalDamage = finiteNumber(data.nonCriticalDamage, actualValue);
    const criticalDamage = finiteNumber(data.criticalDamage, actualValue);
    const skillType = typeof data.skillType === 'string' ? data.skillType : null;
    const damageType = typeof data.damageType === 'string' ? data.damageType : null;
    const standardCalculation = data.standardCalculation === true;
    const damageScaleMultiplier = finiteNumber(data.damageScaleMultiplier, 1);
    const criticalRate = finiteNumber(data.criticalRate);
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
    if (skillType !== null) {
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
              value: `${finiteNumber(data.skillMultiplierPercent).toFixed(1)}%`,
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
    const hasZones = DAMAGE_SCALE_ZONES.some(
      zone => typeof data[`damageScale:${zone}`] === 'number',
    );
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
              value: mult(value),
              factor: value,
              tooltip: modifierTooltip(sources),
            });
          }
          continue;
        }
        const value = finiteNumber(data[`damageScale:${zone}`], 1);
        const sources = modifiers.filter(
          item => item.kind !== 'multiplyValue' && item.zone === zone,
        );
        if (!differsFromOne(value) && sources.length === 0) continue;
        multiplierRows.push({
          label: props.damageZoneLabel?.(zone) ?? props.labels.damageBonus,
          value: mult(value),
          factor: value,
          tooltip: modifierTooltip(sources),
        });
      }
    } else if (differsFromOne(damageScaleMultiplier)) {
      multiplierRows.push({
        label: props.labels.damageBonus,
        detail: damageScaleMultiplier >= 1 ? `+${pct(damageScaleMultiplier - 1)}` : undefined,
        value: mult(damageScaleMultiplier),
        factor: damageScaleMultiplier,
        tooltip: modifierTooltip(modifiers.filter(item => item.kind === 'damageScale')),
      });
    }
    if (props.randomMode === 'expected') {
      multiplierRows.push({
        label: props.labels.criticalExpectation,
        tooltip: criticalTooltip,
        detail: `${props.labels.criticalRate} ${pct(criticalRate)} × ${pct(criticalDamageIncrease)}`,
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
        label: props.labels.criticalResult,
        tooltip: criticalTooltip,
        detail: `${props.labels.criticalRate} ${pct(criticalRate)} · ${criticalResult}`,
        value: mult(criticalMultiplier),
        factor: criticalMultiplier,
      });
    }
    if (differsFromOne(directMultiplier)) {
      multiplierRows.push({
        label: props.labels.directMultiplier,
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
        detail: damageTakenMultiplier >= 1 ? `+${pct(damageTakenMultiplier - 1)}` : undefined,
        value: mult(damageTakenMultiplier),
        factor: damageTakenMultiplier,
      });
    }
    multiplierRows.push({
      label: props.labels.defenseMultiplier,
      detail: props.labels.defenseDetail(Math.floor(finiteNumber(data.enemyDefense))),
      value: mult(data.defenseMultiplier),
      factor: finiteNumber(data.defenseMultiplier, 1),
    });
    if (differsFromOne(resistanceMultiplier)) {
      multiplierRows.push({
        label: props.labels.resistanceMultiplier,
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
        detail: pct(finiteNumber(data.enemyResistancePercent) / 100),
        value: mult(resistanceMultiplier),
        factor: resistanceMultiplier,
      });
    }
    const forced =
      props.resultForceCritical &&
      data.canCritical !== false &&
      Math.abs(criticalDamage - nonCriticalDamage) > 0.000_001;
    const formulaNumber = (value: number) =>
      value.toLocaleString(undefined, { maximumFractionDigits: 6 });
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
        staticAttack: panel?.attack ?? null,
        attackSources: modifierRows(attackModifiers),
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
        ).filter(slot => attackSlotSources[slot].length > 0),
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
                <tr v-if="detail.staticAttack !== null" class="sub-row">
                  <td class="label-cell indent-1">{{ labels.staticBuildAttack }}</td>
                  <td class="value-cell">{{ num(detail.staticAttack) }}</td>
                </tr>
                <template v-for="slot in detail.otherAttackSlots" :key="slot">
                  <tr class="sub-row dim">
                    <td class="label-cell indent-1">{{ labels.attackSlot(slot) }}</td>
                    <td class="value-cell"></td>
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
                <template v-for="(sources, attribute) in detail.attributeSources" :key="attribute">
                  <tr v-for="(source, index) in sources" :key="index" class="sub-row dim">
                    <td class="label-cell indent-1">{{ labels.fromSource(source.label) }}</td>
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
              <tr v-for="row in detail.multiplierRows" :key="row.label">
                <td class="label-cell">
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
            </tbody>
          </table>
          <CombatObjectOriginGraph
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
/* 旧版 dark 主题的 Element Plus 提示框；不采用新版通用浮层三角箭头。 */
html body .el-popper.hit-detail-source-tooltip.is-dark {
  color: #141414;
  background: #e5eaf3;
  border: 1px solid #e5eaf3;
  border-radius: 4px;
  padding: 5px 11px;
  font-size: 12px;
  box-shadow: none;
}
html
  body
  .el-popper.el-popper.el-popper.hit-detail-source-tooltip[data-popper-placement]
  > .el-popper__arrow {
  width: 10px !important;
  height: 10px !important;
}
html
  body
  .el-popper.el-popper.el-popper.hit-detail-source-tooltip[data-popper-placement]
  > .el-popper__arrow::before {
  width: 10px !important;
  height: 10px !important;
  background: #e5eaf3 !important;
  transform: rotate(45deg) !important;
  clip-path: none !important;
}
html
  body
  .el-popper.el-popper.el-popper.hit-detail-source-tooltip[data-popper-placement^='top']
  > .el-popper__arrow {
  bottom: -5px !important;
}
html
  body
  .el-popper.el-popper.el-popper.hit-detail-source-tooltip[data-popper-placement^='bottom']
  > .el-popper__arrow {
  top: -5px !important;
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
