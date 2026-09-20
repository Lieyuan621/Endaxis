import type { CombatConditionKind, CombatStepKind } from '../../game-data/operatorDefinition';

/**
 * 已进入公共协议但尚无生产运行时所有者的节点。
 *
 * 这不是“可以忽略”的兼容列表：严格预检和责任链仍必须拒绝它们。记录原因只是让协议审计、
 * 编辑器告警和后续取证共享同一事实；接入实现时必须删除对应项，并由覆盖门禁证明已有所有者。
 */
export const COMBAT_PROTOCOL_RUNTIME_GAPS = {
  steps: {
    setContextFlag: '写入目标、状态寿命和与 contextFlagEquals 的共享所有者尚未由原生证据确定',
  },
  conditions: {
    skillBranchEnabled: '技能分支状态的原生所有者与写入路径尚未接入',
    contextFlagEquals: '必须与 setContextFlag 作为同一状态机制研究和接入',
    elementalInflictionPresent: '条件应读取哪一层附着状态及层数口径尚未接入',
  },
} as const satisfies {
  readonly steps: Partial<Record<CombatStepKind, string>>;
  readonly conditions: Partial<Record<CombatConditionKind, string>>;
};

export type UnimplementedCombatStepKind = keyof typeof COMBAT_PROTOCOL_RUNTIME_GAPS.steps;
export type UnimplementedCombatConditionKind = keyof typeof COMBAT_PROTOCOL_RUNTIME_GAPS.conditions;
