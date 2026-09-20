/**
 * 法术爆发的伤害执行。
 *
 * 倍率来自 SkillSetting 的“法术爆发伤害倍率”，按原生 ReadSkillSettingData 计算：
 * 倍率 = 定义值 × 增强公式(来源附着增强属性)。之后走标准玩家伤害公式
 * （防御、抗性、暴击），最后写入敌人生命账本。数据缺失时明确报错，不假装打出伤害。
 */
import type { CombatBuffSpellBurstDefinition } from '../buffs/combatBuffDefinitions';
import type { CompoundStatusSkillSettingSource } from './skillSettings';
import type { CombatReceiptEntry } from '../receipt/combatReceipt';
import {
  PlayerDamageOperationExecutor,
  type PlayerDamageOperationDependencies,
} from '../damage/playerDamageOperationExecutor';

/** 一次爆发伤害需要的全部输入。 */
export interface ExecuteSpellBurstInput {
  readonly definition: CombatBuffSpellBurstDefinition;
  /**
   * 来源附着增强属性；面板尚未落地该属性时传 `null`。
   * `null` 只允许在爆发不需要增强公式（enhanceFormulaKey 为空）时使用，
   * 需要增强公式的爆发必须显式失败，不能退化为无增强。
   */
  readonly enhance: number | null;
  readonly settings: CompoundStatusSkillSettingSource;
  /** 与技能、Buff 伤害共用的战斗端口；这里不再另建公式或生命结算路径。 */
  readonly damage: PlayerDamageOperationDependencies;
}

/** 一次爆发结算后的结果。 */
export interface SpellBurstResult {
  readonly burstType: string;
  readonly skillScale: number;
  readonly enhanceFactor: number;
  readonly value: number;
  readonly actualDamage: number;
  readonly remainingHealth: number;
}

/** 按原生增强公式计算倍率乘数；无公式时为 1。 */
export function resolveSpellBurstEnhanceFactor(
  settings: CompoundStatusSkillSettingSource,
  enhanceFormulaKey: string,
  enhance: number | null,
): number {
  if (enhanceFormulaKey === '') return 1;
  if (enhance === null) {
    throw new Error(
      `spell burst enhancement formula '${enhanceFormulaKey}' requires the source infliction-enhance attribute, which is not available`,
    );
  }
  const formula = settings.getEnhanceFormula(enhanceFormulaKey);
  if (formula === undefined) return 1;
  switch (formula.kind) {
    case 'linear':
      return formula.paramA * enhance + 1;
    case 'saturating':
      return (formula.paramA * enhance) / (formula.paramB + enhance) + 1;
    case 'none':
      return 1;
  }
}

/** 执行一次爆发伤害；SkillSetting 缺少对应倍率数据时严格失败。 */
export function executeSpellBurst(input: ExecuteSpellBurstInput): SpellBurstResult {
  const setting = input.settings.getSetting(input.definition.skillSettingDataKey);
  if (setting === undefined) {
    throw new Error(
      `spell burst '${input.definition.burstType}' requires SkillSetting '${input.definition.skillSettingDataKey}', but the setting is missing`,
    );
  }
  const column = input.definition.skillSettingColumn - 1;
  if (column < 0 || column >= setting.values.length) {
    throw new Error(
      `spell burst '${input.definition.burstType}' reads SkillSetting column ${input.definition.skillSettingColumn} (index ${column}), but only ${setting.values.length} columns exist`,
    );
  }
  const skillScale = setting.values[column]!;
  const enhanceFactor = resolveSpellBurstEnhanceFactor(
    input.settings,
    setting.enhanceFormulaKey,
    input.enhance,
  );
  const scale = skillScale * enhanceFactor;

  const step = {
    kind: 'dealDamage' as const,
    parameters: {
      damageType: input.definition.damageType,
      attackScale: scale,
      tags: [] as const,
    },
  };
  let applied: CombatReceiptEntry['data'];
  new PlayerDamageOperationExecutor({
    ...input.damage,
    receipt: {
      record: entry => {
        if (entry.event !== 'DamageApplied') {
          input.damage.receipt.record(entry);
          return;
        }
        applied = entry.data;
        input.damage.receipt.record({
          ...entry,
          data: {
            ...entry.data,
            spellBurstType: input.definition.burstType,
            spellBurstEnhanceFactor: enhanceFactor,
          },
        });
      },
    },
  }).execute(step);
  if (applied === undefined) throw new Error('spell burst executor produced no damage receipt');
  const result: SpellBurstResult = {
    burstType: input.definition.burstType,
    skillScale,
    enhanceFactor,
    value: applied.value as number,
    actualDamage: applied.actualDamage as number,
    remainingHealth: applied.remainingHealth as number,
  };
  input.damage.receipt.record({
    frame: input.damage.clock.frame,
    time: input.damage.clock.time,
    event: 'SpellBurstApplied',
    sourceId: input.damage.sourceOperatorId,
    targetId: input.damage.targetId,
    data: { ...result },
  });
  return result;
}
