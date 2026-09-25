/**
 * 在领域组装和步骤身份分配后，简化正式定义中的动作序列。
 * 分析模式也计算候选结果，但返回原定义；应用模式保留所有未删除步骤的 key 和原始数组顺序。
 */
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
} from '../../../../../packages/game-data-contract/src/actions.ts';
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions.ts';
import { compareCombatNumbers } from '../../../../../packages/game-data-contract/src/primitives.ts';
import {
  analyzeSequenceUsage,
  canDiscardUnexecutedSequence,
  type DefinitionValueUsage,
} from './definitionUsageAnalysis.ts';

/** off 保持原定义；report 报告候选但不替换；apply 返回优化后的定义。 */
export type DefinitionOptimizationMode = 'off' | 'report' | 'apply';

export interface DefinitionOptimizationChange {
  /** 组装前后的同一对象身份，不从文件名猜测游戏角色。 */
  readonly definitionId: string;
  /** 优化前定义中的路径；不伪称为未保存的原生动作坐标。 */
  readonly path: string;
  readonly rule:
    'constant-condition' | 'short-circuit-condition' | 'true-guard' | 'unreachable-branch';
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
  /** 排序后的当前黑板访问摘要；未知访问在后续裁剪初值时构成阻挡。 */
  readonly usage: {
    readonly reads: readonly string[];
    readonly writes: readonly string[];
    readonly externalReads: DefinitionValueUsage['externalReads'];
    readonly unknownAccess: boolean;
  };
}

interface OptimizationContext {
  readonly definitionId: string;
  readonly changes: DefinitionOptimizationChange[];
  readonly retained: DefinitionOptimizationRetention[];
}

/**
 * 优化一条序列及其内部控制流。跨时间线、跨黑板的值目前只报告用途，不据此删除初值。
 * 调用方为每个入口提供身份和路径，报告保持确定性，不包含机器路径和时间戳。
 */
export function optimizeActionSequenceDefinition(
  sequence: ActionSequenceDefinition,
  options: {
    readonly mode: DefinitionOptimizationMode;
    readonly definitionId: string;
    readonly path?: string;
  },
): { readonly sequence: ActionSequenceDefinition; readonly report: DefinitionOptimizationReport } {
  const context: OptimizationContext = {
    definitionId: options.definitionId,
    changes: [],
    retained: [],
  };
  const optimized =
    options.mode === 'off'
      ? sequence
      : optimizeSequence(sequence, options.path ?? 'sequence', context);
  const usage = analyzeSequenceUsage(optimized);
  return {
    sequence: options.mode === 'apply' ? optimized : sequence,
    report: {
      mode: options.mode,
      changes: context.changes,
      retained: context.retained,
      before: countSequence(sequence),
      after: countSequence(optimized),
      usage: serializeUsage(usage),
    },
  };
}

function serializeUsage(usage: DefinitionValueUsage): DefinitionOptimizationReport['usage'] {
  return {
    reads: [...usage.reads].sort(),
    writes: [...usage.writes].sort(),
    externalReads: usage.externalReads,
    unknownAccess: usage.unknownAccess,
  };
}

function change(
  context: OptimizationContext,
  path: string,
  rule: DefinitionOptimizationChange['rule'],
  detail: string,
): void {
  context.changes.push({ definitionId: context.definitionId, path, rule, detail });
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

function optimizeCondition(
  condition: CombatCondition,
  path: string,
  context: OptimizationContext,
): CombatCondition {
  const result = simplifyDefinitionCondition(condition);
  if (result !== condition) {
    change(
      context,
      path,
      result.kind === 'constant' ? 'constant-condition' : 'short-circuit-condition',
      `${condition.kind} → ${result.kind}`,
    );
  }
  return result;
}

function optimizeSequence(
  sequence: ActionSequenceDefinition,
  path: string,
  context: OptimizationContext,
): ActionSequenceDefinition {
  const steps = sequence.steps.flatMap((step, index) =>
    optimizeStep(step, `${path}.steps[${index}]`, context),
  );
  return steps.length === sequence.steps.length &&
    steps.every((step, index) => step === sequence.steps[index])
    ? sequence
    : { ...sequence, steps };
}

function optimizeStep(
  step: CombatStepDefinition,
  path: string,
  context: OptimizationContext,
): readonly CombatStepDefinition[] {
  const child = (sequence: ActionSequenceDefinition, field: string) =>
    optimizeSequence(sequence, `${path}.${field}`, context);
  switch (step.kind) {
    case 'conditional': {
      const condition = optimizeCondition(
        step.parameters.condition,
        `${path}.parameters.condition`,
        context,
      );
      let whenTrue = child(step.whenTrue, 'whenTrue');
      let whenFalse = step.whenFalse === undefined ? undefined : child(step.whenFalse, 'whenFalse');
      if (condition.kind === 'constant') {
        const unused = condition.value ? whenFalse : whenTrue;
        const unusedPath = `${path}.${condition.value ? 'whenFalse' : 'whenTrue'}`;
        if (unused !== undefined && unused.steps.length > 0) {
          if (canDiscardUnexecutedSequence(unused)) {
            change(
              context,
              unusedPath,
              'unreachable-branch',
              `条件恒为 ${condition.value}，未执行分支无准备行为及被引用身份`,
            );
            // 不删除 else 字段：它的存在决定运行时使用独立 IfElse 还是顺序守卫。
            if (condition.value) whenFalse = { ...unused, steps: [] };
            else whenTrue = { ...unused, steps: [] };
          } else {
            context.retained.push({
              definitionId: context.definitionId,
              path: unusedPath,
              reason: 'preparation-or-identity',
            });
          }
        }
        if (
          condition.value &&
          whenFalse === undefined &&
          step.parameters.alwaysNext !== true &&
          step.key === undefined
        ) {
          if (whenTrue.steps.length > 0) {
            // 此形状在运行时原本就是 [守卫, ...body]，不改变任何子序列生命周期。
            change(context, path, 'true-guard', '顺序守卫恒真，保留后续步骤及其原 key');
            return whenTrue.steps;
          }
          // 空序列再次执行会返回 true，有一个已执行守卫的序列则返回 false。
          context.retained.push({
            definitionId: context.definitionId,
            path,
            reason: 'sequence-lifetime',
          });
        }
      }
      return [
        condition === step.parameters.condition &&
        whenTrue === step.whenTrue &&
        whenFalse === step.whenFalse
          ? step
          : {
              ...step,
              parameters: { ...step.parameters, condition },
              whenTrue,
              ...(whenFalse === undefined ? {} : { whenFalse }),
            },
      ];
    }
    case 'switch': {
      const options = step.options.map((option, index) => {
        const sequence = child(option.sequence, `options[${index}].sequence`);
        return sequence === option.sequence ? option : { ...option, sequence };
      });
      return [
        options.every((option, index) => option === step.options[index])
          ? step
          : { ...step, options },
      ];
    }
    case 'once':
    case 'withActionBlackboardScope':
    case 'repeatEachTick':
    case 'repeatByActionValue':
    case 'forEachContextTarget': {
      const body = child(step.body, 'body');
      return [body === step.body ? step : { ...step, body }];
    }
    case 'listenForCombatEvents': {
      const responses = step.parameters.responses.map((response, index) => {
        const sequence = child(response.sequence, `parameters.responses[${index}].sequence`);
        const condition =
          response.condition === undefined
            ? undefined
            : optimizeCondition(
                response.condition,
                `${path}.parameters.responses[${index}].condition`,
                context,
              );
        return sequence === response.sequence && condition === response.condition
          ? response
          : {
              ...response,
              sequence,
              ...(condition === undefined ? {} : { condition }),
            };
      });
      return [
        responses.every((response, index) => response === step.parameters.responses[index])
          ? step
          : { ...step, parameters: { ...step.parameters, responses } },
      ];
    }
    case 'launchProjectile': {
      const callbacks = step.callbacks.map((callback, callbackIndex) => {
        const scheduledSequences = callback.skill.scheduledSequences.map((scheduled, index) => {
          const sequence = child(
            scheduled.sequence,
            `callbacks[${callbackIndex}].skill.scheduledSequences[${index}].sequence`,
          );
          return sequence === scheduled.sequence ? scheduled : { ...scheduled, sequence };
        });
        return scheduledSequences.every(
          (scheduled, index) => scheduled === callback.skill.scheduledSequences[index],
        )
          ? callback
          : { ...callback, skill: { ...callback.skill, scheduledSequences } };
      });
      return [
        callbacks.every((callback, index) => callback === step.callbacks[index])
          ? step
          : { ...step, callbacks },
      ];
    }
    case 'jumpTimeline': {
      const condition =
        step.parameters.condition === undefined
          ? undefined
          : optimizeCondition(step.parameters.condition, `${path}.parameters.condition`, context);
      return [
        condition === step.parameters.condition
          ? step
          : { ...step, parameters: { ...step.parameters, condition } },
      ];
    }
    default:
      return [step];
  }
}

function countSequence(sequence: ActionSequenceDefinition): DefinitionOptimizationReport['before'] {
  const count = { steps: 0, conditions: 0 };
  const add = (sequence: ActionSequenceDefinition) => {
    const nested = countSequence(sequence);
    count.steps += nested.steps;
    count.conditions += nested.conditions;
  };
  for (const step of sequence.steps) {
    count.steps++;
    switch (step.kind) {
      case 'conditional':
        count.conditions += countCondition(step.parameters.condition);
        add(step.whenTrue);
        if (step.whenFalse !== undefined) add(step.whenFalse);
        break;
      case 'switch':
        step.options.forEach(option => add(option.sequence));
        break;
      case 'once':
      case 'withActionBlackboardScope':
      case 'repeatEachTick':
      case 'repeatByActionValue':
      case 'forEachContextTarget':
        add(step.body);
        break;
      case 'listenForCombatEvents':
        step.parameters.responses.forEach(response => {
          add(response.sequence);
          if (response.condition !== undefined)
            count.conditions += countCondition(response.condition);
        });
        break;
      case 'launchProjectile':
        step.callbacks
          .flatMap(callback => callback.skill.scheduledSequences)
          .forEach(scheduled => add(scheduled.sequence));
        break;
      case 'jumpTimeline':
        if (step.parameters.condition !== undefined)
          count.conditions += countCondition(step.parameters.condition);
        break;
    }
  }
  return count;
}

function countCondition(condition: CombatCondition): number {
  if (condition.kind === 'not') return 1 + countCondition(condition.condition);
  if (condition.kind === 'all' || condition.kind === 'any') {
    return 1 + condition.conditions.reduce((count, child) => count + countCondition(child), 0);
  }
  return 1;
}
