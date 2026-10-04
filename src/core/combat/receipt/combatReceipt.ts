/**
 * 战斗核心与曲线、诊断、日志等投影之间的事实协议。
 * 运行时只能追加已发生事实；本地化文本和面向 UI 的聚合结果不得写入回执。
 */
import { CombatReceiptHistory, type CombatReceiptView } from './combatReceiptHistory';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { AppliedDamageModifier, CombatObjectRef } from '../state/foundationState';
export type { CombatObjectRef } from '../state/foundationState';
export type CombatReceiptValue = boolean | number | string | null;

/** Buff 在该时点已经解析的属性槽修正，不包含条件伤害规则或来源链。 */
export interface BuffAttributeEffect {
  readonly attribute: string;
  readonly slot: string;
  readonly value: number;
}

/** 已解析数值的伤害规则；condition 是适用条件，不表示任意一次命中已经满足它。 */
export interface BuffDamageEffect {
  readonly side: 'attacker' | 'defender';
  readonly zone: string;
  readonly addition: number;
  readonly damageTypes?: readonly string[];
  readonly conditional: boolean;
  readonly multiplier?: number;
  readonly attributeEffect?: BuffAttributeEffect;
}

/** 一条带帧、事实类型和结构化数据的运行时回执。 */
export interface CombatReceiptEntry {
  readonly sequence: number;
  readonly frame: number;
  readonly time: number;
  readonly event: string;
  readonly sourceId?: string;
  readonly targetId?: string;
  /** 创建事实所描述的对象。普通回执自身用 sequence 寻址。 */
  readonly subject?: CombatObjectRef;
  /** 直接执行者；缺少表示未记录，不能从归属干员反推。 */
  readonly producedBy?: CombatObjectRef;
  /** 原生实体 Source，与直接创建者分别保存。 */
  readonly runtimeSource?: RuntimeTargetRef;
  readonly data?: Readonly<Record<string, CombatReceiptValue>>;
  /** 本次命中冻结的技能倍率运算链，不属于可重算的 UI 投影。 */
  readonly skillMultiplierCalculation?: import('../state/foundationState').ActionValueCalculation;
  readonly appliedDamageModifiers?: readonly AppliedDamageModifier[];
  readonly buffAttributeEffects?: readonly BuffAttributeEffect[];
  readonly buffDamageEffects?: readonly BuffDamageEffect[];
}

/** 运行时追加事实的最小端口，投影层只读取其最终结果。 */
export interface CombatReceiptSink {
  record(entry: Omit<CombatReceiptEntry, 'sequence'>): void;
}

/** 稳定且仅追加的事实记录；本地化与展示均属于投影。 */
export class CombatReceiptCollector implements CombatReceiptSink {
  readonly history: CombatReceiptHistory;
  /** 已发布数值的派生索引；恢复时只读固定前缀重建，分支之间不共享。 */
  readonly #passiveUiValues = new Map<string, { sourceId: string; value: number }>();
  constructor(saved?: CombatReceiptView) {
    this.history = saved?.fork() ?? new CombatReceiptHistory();
    if (saved !== undefined)
      for (const entry of saved.entries())
        if (entry.event === 'CharacterPassiveUiValueChanged' && entry.targetId !== undefined)
          this.#recordPassiveUiValue(entry, false);
  }

  get entries(): readonly CombatReceiptEntry[] {
    return this.history.snapshot().toArray();
  }

  record(entry: Omit<CombatReceiptEntry, 'sequence'>): void {
    if (entry.event === 'CharacterPassiveUiValueChanged' && entry.targetId !== undefined)
      this.#recordPassiveUiValue(entry, true);
    else this.history.append(entry);
  }

  /** 仅压缩同一目标连续收到的相同原始数值；首次零、换来源和附加证据均保留。 */
  #recordPassiveUiValue(entry: Omit<CombatReceiptEntry, 'sequence'>, append: boolean): void {
    const targetId = entry.targetId!;
    const value = entry.data?.value;
    if (
      entry.sourceId === undefined ||
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      Object.keys(entry.data!).length !== 1 ||
      entry.subject !== undefined ||
      entry.producedBy !== undefined ||
      entry.buffDamageEffects !== undefined ||
      entry.runtimeSource !== undefined ||
      entry.skillMultiplierCalculation !== undefined ||
      entry.appliedDamageModifiers !== undefined ||
      entry.buffAttributeEffects !== undefined
    ) {
      if (append) this.history.append(entry);
      this.#passiveUiValues.delete(targetId);
      return;
    }
    const previous = this.#passiveUiValues.get(targetId);
    if (previous?.sourceId === entry.sourceId && Object.is(previous.value, value)) return;
    if (append) this.history.append(entry);
    this.#passiveUiValues.set(targetId, { sourceId: entry.sourceId, value });
  }
}
