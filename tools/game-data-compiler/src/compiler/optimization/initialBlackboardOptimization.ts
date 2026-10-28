import type { ActionGraphStep } from '../intermediateDefinitions.ts';
import type { GraphValueScope } from './graphValueOptimization.ts';
import {
  actionValueUsage,
  analyzeConditionUsage,
  analyzeStepUsage,
  type DefinitionUsageContext,
} from './definitionUsageAnalysis.ts';

/** 只证明初值无用，不删除变量或运行时写入。各入口独立分析，不假定调度一定先后执行。 */
export function overwrittenInitialKeys(
  scope: GraphValueScope,
  protectedKeys: ReadonlySet<string>,
  context?: DefinitionUsageContext,
): ReadonlySet<string> {
  const removed = new Set<string>();
  if (scope.entries.some(entry => !entry.analyzeControlFlow || entry.resultIsConsumed))
    return removed;
  const graph = scope.actionGraph.main;
  for (const [key, initial] of Object.entries(scope.blackboard ?? {})) {
    if (protectedKeys.has(key) || key.startsWith('EntityBB_')) continue;
    const values = Array.isArray(initial) ? initial : [initial];
    if (
      !values.length ||
      !values.every(value => typeof value === 'number' && Number.isFinite(value))
    )
      continue;
    const conditions = scope.conditions.map(condition => analyzeConditionUsage(condition));
    if (
      conditions.some(usage => usage.unknownAccess || usage.reads.has(key) || usage.writes.has(key))
    )
      continue;
    let safe = true;
    const active = new Set<string>();
    // 返回 true 表示初值仍可能存活；false 表示所有继续路径已用新值覆盖。
    const visit = (start: string | null, initialAlive: boolean): boolean => {
      let id = start;
      const visited: string[] = [];
      while (id !== null && initialAlive && safe) {
        if (active.has(id)) {
          safe = false;
          break;
        }
        active.add(id);
        visited.push(id);
        const node = graph.nodes[id];
        if (!node) {
          safe = false;
          break;
        }
        const step = node.action;
        if (step.kind === 'ifElse' && step.parameters.alwaysNext && step.key === undefined) {
          const usage = analyzeConditionUsage(step.condition);
          if (
            usage.unknownAccess ||
            usage.observable ||
            usage.reads.has(key) ||
            usage.writes.size
          ) {
            safe = false;
            break;
          }
          const yes = visit(step.whenTrue.$sequence, true);
          const no = visit(step.whenFalse?.$sequence ?? null, true);
          initialAlive = yes || no;
        } else if (definitelyReplacesInitial(step, key, values as number[])) {
          initialAlive = false;
        } else {
          if (step.kind === 'callMacro' || step.kind === 'callResource') {
            safe = false;
            break;
          }
          const usage = analyzeStepUsage(step, context);
          // 事件、回调及复制可能把初值交给别的作用域，未覆盖前一律保留。
          if (
            usage.unknownAccess ||
            usage.observable ||
            usage.reads.has(key) ||
            usage.writes.has(key)
          ) {
            safe = false;
            break;
          }
        }
        id = node.next;
      }
      visited.forEach(nodeId => active.delete(nodeId));
      return initialAlive;
    };
    for (const entry of scope.entries) visit(entry.sequence.$sequence, true);
    if (safe) removed.add(key);
  }
  return removed;
}

function definitelyReplacesInitial(
  step: ActionGraphStep,
  key: string,
  initial: readonly number[],
): boolean {
  if (step.key !== undefined) return false;
  if (
    step.kind === 'modifyActionValue' &&
    step.parameters.key === key &&
    step.parameters.operation === 'assign'
  ) {
    const value = step.parameters.value;
    if (value.kind !== 'constant') return false;
    const replacement = Math.fround(value.value);
    // 容差内但不相等时保留旧值；不能为裁剪初值改变赋值精度。
    return initial.every(old => old === replacement || Math.abs(old - replacement) > 0.00001);
  }
  if (step.kind === 'readBuffStackCount' && step.parameters.outputKey === key) {
    // 层数是整数，整数初值只可能完全相同或相差至少 1；动作返回值不依赖赋值结果。
    return initial.every(Number.isSafeInteger);
  }
  if (step.kind === 'storeRandomInteger' && step.parameters.key === key) {
    const inputs = [step.parameters.minimum, step.parameters.maximum].map(actionValueUsage);
    return (
      initial.every(Number.isSafeInteger) &&
      inputs.every(usage => !usage.unknownAccess && !usage.reads.has(key))
    );
  }
  return false;
}
