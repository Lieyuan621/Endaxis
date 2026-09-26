/** 图优化的报告格式和条件常量折叠；不包含动作树优化。 */
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions.ts';
import { compareCombatNumbers } from '../../../../../src/core/mechanics/combatNumbers.ts';
import type { DefinitionValueUsage } from './definitionUsageAnalysis.ts';
import type { ActionGraphMiddleSegmentCandidate } from './actionGraphMiddleSegments.ts';

/** off 保持原定义；report 报告候选但不替换；apply 返回优化后的定义。 */
export type DefinitionOptimizationMode = 'off' | 'report' | 'apply';

export interface DefinitionOptimizationChange {
  /** 组装前后的同一对象身份，不从文件名猜测游戏角色。 */
  readonly definitionId: string;
  /** 优化前定义中的路径；不伪称为未保存的原生动作坐标。 */
  readonly path: string;
  readonly rule:
    | 'constant-condition'
    | 'short-circuit-condition'
    | 'true-guard'
    | 'unreachable-branch'
    | 'equivalent-branches';
  readonly detail: string;
}

export interface DefinitionOptimizationRetention {
  readonly definitionId: string;
  readonly path: string;
  readonly reason: 'preparation-or-identity' | 'sequence-lifetime';
}

export interface DefinitionOptimizationReport {
  readonly mode: DefinitionOptimizationMode;
  readonly changes: readonly DefinitionOptimizationChange[];
  readonly retained: readonly DefinitionOptimizationRetention[];
  readonly before: { readonly steps: number; readonly conditions: number };
  readonly after: { readonly steps: number; readonly conditions: number };
  /** 分支去重后的宏候选及实际存储收益；与上方按入口统计的动作数量分开。 */
  readonly macroCandidates?: readonly (ActionGraphMiddleSegmentCandidate & {
    readonly resourcePath: string;
  })[];
  /** 排序后的当前黑板访问摘要；未知访问在后续裁剪初值时构成阻挡。 */
  readonly usage: {
    readonly reads: readonly string[];
    readonly writes: readonly string[];
    readonly externalReads: DefinitionValueUsage['externalReads'];
    readonly unknownAccess: boolean;
  };
}

/** 字面量按运行时同一份比较函数求值；不根据黑板默认值推断常量。 */
export function simplifyDefinitionCondition(condition: CombatCondition): CombatCondition {
  switch (condition.kind) {
    case 'actionValueCompare':
      if (
        condition.left.kind === 'constant' &&
        condition.right.kind === 'constant' &&
        Number.isFinite(condition.left.value) &&
        Number.isFinite(condition.right.value)
      ) {
        return {
          kind: 'constant',
          value: compareCombatNumbers(
            condition.left.value,
            condition.right.value,
            condition.operator,
          ),
        };
      }
      return condition;
    case 'not': {
      const child = simplifyDefinitionCondition(condition.condition);
      if (child.kind === 'constant') return { kind: 'constant', value: !child.value };
      return child === condition.condition ? condition : { ...condition, condition: child };
    }
    case 'all':
    case 'any': {
      const identity = condition.kind === 'all';
      const children: CombatCondition[] = [];
      for (const child of condition.conditions) {
        const simplified = simplifyDefinitionCondition(child);
        if (simplified.kind === 'constant') {
          if (simplified.value === identity) continue;
          // 恒定停止值之前的查询可能写黑板或抽样，必须保留；之后的条件从不会求值。
          children.push(simplified);
          break;
        }
        children.push(simplified);
      }
      if (children.length === 0) return { kind: 'constant', value: identity };
      if (children.length === 1) return children[0]!;
      return children.length === condition.conditions.length &&
        children.every((child, index) => child === condition.conditions[index])
        ? condition
        : { ...condition, conditions: children };
    }
    default:
      return condition;
  }
}
