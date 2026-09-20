/**
 * 删除装备贡献中不会被运行程序使用的黑板初值。
 *
 * 静态属性已由来源编译器写入 modifiers。装备黑板只供启用、初始化、事件条件和
 * 事件程序读取；该贡献保存的 Buff 蓝图使用各自的实例黑板，不回读装备板的同名键。
 * 按全部入口的读写汇总保留初值，未知访问则整板保留，不按词条位置或装备身份分派。
 */
import type { EquipmentContributionDefinition } from '../../../../../packages/game-data-contract/src/equipment.ts';
import type { DefinitionOptimizationMode } from './definitionOptimization.ts';
import {
  analyzeConditionUsage,
  analyzeSequenceUsage,
  mergeDefinitionValueUsage,
} from './definitionUsageAnalysis.ts';

/** 每项装备贡献的黑板裁剪结果，与技能黑板的优化报告分开记录。 */
export interface EquipmentValueOptimizationReport {
  /** 词条或套装所属的定义身份。 */
  readonly definitionId: string;
  /** 贡献在完整定义中的路径。 */
  readonly path: string;
  /** 候选中删除的初值键；关闭优化时为空。 */
  readonly removedInitialKeys: readonly string[];
  /** 剩余初值存在运行时用途、访问尚未查清，或调用方关闭了优化。 */
  readonly retainedReason?:
    'runtime-value-access' | 'unresolved-blackboard-access' | 'optimization-disabled';
}

/** 只删除初值，不移除写入或入口；空程序仍保留原有装备宿主和注册行为。 */
export function pruneUnusedEquipmentContributionBlackboard(
  value: EquipmentContributionDefinition,
  options: {
    readonly mode: DefinitionOptimizationMode;
    readonly definitionId: string;
    readonly path: string;
  },
): {
  readonly contribution: EquipmentContributionDefinition;
  readonly report: EquipmentValueOptimizationReport;
} {
  const report = { definitionId: options.definitionId, path: options.path };
  if (options.mode === 'off') {
    return {
      contribution: value,
      report: { ...report, removedInitialKeys: [], retainedReason: 'optimization-disabled' },
    };
  }
  const usage = mergeDefinitionValueUsage([
    ...(value.enableSequence === undefined ? [] : [analyzeSequenceUsage(value.enableSequence)]),
    ...(value.initializationSequence === undefined
      ? []
      : [analyzeSequenceUsage(value.initializationSequence)]),
    ...(value.eventHandlers?.flatMap(handler => [
      ...(handler.condition === undefined ? [] : [analyzeConditionUsage(handler.condition)]),
      analyzeSequenceUsage(handler.sequence),
    ]) ?? []),
  ]);
  if (usage.unknownAccess) {
    return {
      contribution: value,
      report: { ...report, removedInitialKeys: [], retainedReason: 'unresolved-blackboard-access' },
    };
  }
  const { blackboard, ...contribution } = value;
  // 数值写入会用旧值进行 epsilon 比较；即使没有后续显式读取，也不能删除目的键初值。
  const isUsed = (key: string) => usage.reads.has(key) || usage.writes.has(key);
  const remaining = Object.entries(blackboard ?? {}).filter(([key]) => isUsed(key));
  const removedInitialKeys = Object.keys(blackboard ?? {}).filter(key => !isUsed(key));
  return {
    contribution:
      blackboard === undefined
        ? value
        : remaining.length === 0
          ? contribution
          : removedInitialKeys.length === 0
            ? value
            : { ...contribution, blackboard: Object.fromEntries(remaining) },
    report: {
      ...report,
      removedInitialKeys,
      ...(remaining.length === 0 ? {} : { retainedReason: 'runtime-value-access' }),
    },
  };
}
