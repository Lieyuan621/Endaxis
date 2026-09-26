/**
 * optimizeActionSequenceDefinition 的图侧对应：输入是投影后的单个定义主图（尚无宏），五条序列结构规则
 * 直接在节点表上执行，节点对象不可变，全部改写 copy-on-write 并产出新 nodes 表。
 *
 * 报告的 path 坐标系从树路径改为图节点 id 链：入口记为 path（默认 `entry`），链上节点追加 `→节点id`，
 * 嵌套子序列引用在节点后接字段名，例如 `entry→conditional_3.whenTrue→dealDamage_2`。
 *
 * 改写后重新做尾部 interning（与 actionGraphBuilder 的 stableSignature 同一思路）：内容不变的节点在
 * 原 id 对同一签名唯一时保留原 id，新节点按 `${kind}_optN` 确定性命名；最后从入口做可达性收集，
 * 剔除不再被任何入口或引用到达的节点。next 成环的链保守保留不改写。
 */
import type { CombatStepDefinition } from '../../../../../packages/game-data-contract/src/actions.ts';
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import {
  analyzeConditionUsage,
  analyzeStepUsage,
  actionValueUsage,
  mergeDefinitionValueUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from './definitionUsageAnalysis.ts';
import {
  simplifyDefinitionCondition,
  type DefinitionOptimizationChange,
  type DefinitionOptimizationMode,
  type DefinitionOptimizationReport,
  type DefinitionOptimizationRetention,
} from './definitionOptimization.ts';

type GraphConditional = Extract<ActionGraphStep, { kind: 'conditional' }>;
type GraphSwitch = Extract<ActionGraphStep, { kind: 'switch' }>;

const NOT_EQUIVALENT = Symbol('not-equivalent');
const EMPTY_REFERENCE: ActionGraphReference = { $sequence: null };

interface GraphOptimizationContext {
  readonly definitionId: string;
  readonly changes: DefinitionOptimizationChange[];
  readonly retained: DefinitionOptimizationRetention[];
  /** 工作节点表；节点对象本身不可变，替换内容即写入新对象。 */
  readonly nodes: Map<string, ActionGraphNode>;
  /** 签名 → 节点 id；种子是原图中签名唯一的节点，保证未触碰子链 id 稳定。 */
  readonly interned: Map<string, string>;
  readonly usedIds: Set<string>;
  readonly chainMemo: Map<string, ActionGraphReference>;
  readonly chainInProgress: Set<string>;
  optCounter: number;
  dirty: boolean;
}

/**
 * 优化单个定义的主图及其内部全部嵌套子序列引用。off 保持原图；report 报告候选但不替换；
 * apply 返回优化后的新图与新入口，未改动的图原样返回同一对象。
 */
export function optimizeActionGraphDefinition(
  graph: ActionGraphDefinition,
  entry: ActionGraphReference,
  options: {
    readonly mode: DefinitionOptimizationMode;
    readonly definitionId: string;
    readonly path?: string;
  },
): {
  readonly entry: ActionGraphReference;
  readonly graph: ActionGraphDefinition;
  readonly report: DefinitionOptimizationReport;
} {
  const result = optimizeActionGraphEntries(graph, [entry], options);
  return { entry: result.entries[0]!, graph: result.graph, report: result.report };
}

/** 一次优化资源的所有入口，避免处理单个入口时误删其他时间点或事件的节点。 */
export function optimizeActionGraphEntries(
  graph: ActionGraphDefinition,
  entries: readonly ActionGraphReference[],
  options: {
    readonly mode: DefinitionOptimizationMode;
    readonly definitionId: string;
    readonly path?: string;
  },
): {
  readonly entries: readonly ActionGraphReference[];
  readonly graph: ActionGraphDefinition;
  readonly report: DefinitionOptimizationReport;
} {
  const context = createContext(graph, options.definitionId);
  const optimizedEntries = entries.map((entry, index) =>
    options.mode === 'off'
      ? entry
      : processChain(entry, `${options.path ?? 'entry'}[${index}]`, context),
  );
  const optimizedGraph: ActionGraphDefinition =
    options.mode === 'off' || !context.dirty
      ? graph
      : { nodes: pruneUnreachable(context.nodes, optimizedEntries) };
  const usage = mergeDefinitionValueUsage(
    optimizedEntries.map(entry => analyzeGraphSequenceUsage(optimizedGraph, entry)),
  );
  const count = (graph: ActionGraphDefinition, roots: readonly ActionGraphReference[]) =>
    roots.reduce(
      (total, entry) => {
        const value = countGraph(graph, entry);
        return {
          steps: total.steps + value.steps,
          conditions: total.conditions + value.conditions,
        };
      },
      { steps: 0, conditions: 0 },
    );
  return {
    entries: options.mode === 'apply' ? optimizedEntries : entries,
    graph: options.mode === 'apply' ? optimizedGraph : graph,
    report: {
      mode: options.mode,
      changes: context.changes,
      retained: context.retained,
      before: count(graph, entries),
      after: count(optimizedGraph, optimizedEntries),
      usage: serializeUsage(usage),
    },
  };
}

function createContext(
  graph: ActionGraphDefinition,
  definitionId: string,
): GraphOptimizationContext {
  const bySignature = new Map<string, string | null>();
  for (const [id, node] of Object.entries(graph.nodes)) {
    const signature = stableSignature(node);
    // 同一签名有多个原 id 时不保留任一原 id，避免改写后静默合并调用方仍区分的节点。
    bySignature.set(signature, bySignature.has(signature) ? null : id);
  }
  const interned = new Map<string, string>();
  for (const [signature, id] of bySignature) if (id !== null) interned.set(signature, id);
  return {
    definitionId,
    changes: [],
    retained: [],
    nodes: new Map(Object.entries(graph.nodes)),
    interned,
    usedIds: new Set(Object.keys(graph.nodes)),
    chainMemo: new Map(),
    chainInProgress: new Set(),
    optCounter: 0,
    dirty: false,
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
  context: GraphOptimizationContext,
  path: string,
  rule: DefinitionOptimizationChange['rule'],
  detail: string,
): void {
  context.changes.push({ definitionId: context.definitionId, path, rule, detail });
}

function optimizeCondition(
  condition: CombatCondition,
  path: string,
  context: GraphOptimizationContext,
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

/** 处理一条链：逐节点优化动作并拼接替换段；全部不变时返回原引用，保证未触碰子链 id 稳定。 */
function processChain(
  reference: ActionGraphReference,
  path: string,
  context: GraphOptimizationContext,
): ActionGraphReference {
  if (reference.$sequence === null) return reference;
  const key = reference.$sequence;
  const memoized = context.chainMemo.get(key);
  if (memoized !== undefined) return memoized;
  // 嵌套引用成环时保守保留原引用，不向环内递归。
  if (context.chainInProgress.has(key)) return reference;
  context.chainInProgress.add(key);
  const result = processChainInner(reference, path, context);
  context.chainInProgress.delete(key);
  context.chainMemo.set(key, result);
  return result;
}

function processChainInner(
  reference: ActionGraphReference,
  path: string,
  context: GraphOptimizationContext,
): ActionGraphReference {
  const chain = collectChain(context.nodes, reference.$sequence!);
  // next 成环的链不改写：扁平化会改变重复执行结构。
  if (chain.cyclic) return reference;
  const replacements = chain.ids.map(id =>
    processAction(context.nodes.get(id)!.action, `${path}→${id}`, context),
  );
  const unchanged = replacements.every(
    (steps, index) =>
      steps.length === 1 && steps[0] === context.nodes.get(chain.ids[index]!)!.action,
  );
  if (unchanged) return reference;
  context.dirty = true;
  let next: string | null = null;
  const flat = replacements.flat();
  for (let index = flat.length - 1; index >= 0; index--)
    next = internNode({ action: flat[index]!, next }, context);
  return { $sequence: next };
}

/** 收集链上节点 id；next  revisit 时停止并标记成环。 */
function collectChain(
  nodes: ReadonlyMap<string, ActionGraphNode>,
  start: string,
): { readonly ids: readonly string[]; readonly cyclic: boolean } {
  const ids: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = start;
  while (cursor !== null) {
    if (seen.has(cursor)) return { ids, cyclic: true };
    seen.add(cursor);
    ids.push(cursor);
    const node = nodes.get(cursor);
    if (!node) return { ids, cyclic: true };
    cursor = node.next;
  }
  return { ids, cyclic: false };
}

function internNode(node: ActionGraphNode, context: GraphOptimizationContext): string {
  const signature = stableSignature(node);
  const existing = context.interned.get(signature);
  if (existing !== undefined) return existing;
  let id: string;
  do {
    id = `${node.action.kind}_opt${++context.optCounter}`;
  } while (context.usedIds.has(id));
  context.interned.set(signature, id);
  context.usedIds.add(id);
  context.nodes.set(id, node);
  return id;
}

/** 取一条链的动作列表（true-guard 内联与分支合并把这段动作拼进父链）。 */
function chainActions(
  reference: ActionGraphReference,
  context: GraphOptimizationContext,
): readonly ActionGraphStep[] {
  if (reference.$sequence === null) return [];
  const chain = collectChain(context.nodes, reference.$sequence);
  return chain.ids.map(id => context.nodes.get(id)!.action);
}

function processAction(
  action: ActionGraphStep,
  path: string,
  context: GraphOptimizationContext,
): readonly ActionGraphStep[] {
  switch (action.kind) {
    case 'conditional':
      return processConditional(action, path, context);
    case 'switch':
      return processSwitch(action, path, context);
    case 'once':
    case 'withActionBlackboardScope':
    case 'repeatEachTick':
    case 'repeatByActionValue':
    case 'forEachContextTarget': {
      const body = processChain(action.body, `${path}.body`, context);
      return [body === action.body ? action : { ...action, body }];
    }
    case 'listenForCombatEvents': {
      const responses = action.parameters.responses.map((response, index) => {
        const sequence = processChain(
          response.sequence,
          `${path}.parameters.responses[${index}].sequence`,
          context,
        );
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
        responses.every((response, index) => response === action.parameters.responses[index])
          ? action
          : { ...action, parameters: { ...action.parameters, responses } },
      ];
    }
    case 'jumpTimeline': {
      const condition =
        action.parameters.condition === undefined
          ? undefined
          : optimizeCondition(action.parameters.condition, `${path}.parameters.condition`, context);
      return [
        condition === action.parameters.condition
          ? action
          : { ...action, parameters: { ...action.parameters, condition } },
      ];
    }
    default:
      return [action];
  }
}

function processConditional(
  action: GraphConditional,
  path: string,
  context: GraphOptimizationContext,
): readonly ActionGraphStep[] {
  const condition = optimizeCondition(
    action.parameters.condition,
    `${path}.parameters.condition`,
    context,
  );
  let whenTrue = processChain(action.whenTrue, `${path}.whenTrue`, context);
  let whenFalse =
    action.whenFalse === undefined
      ? undefined
      : processChain(action.whenFalse, `${path}.whenFalse`, context);
  if (
    whenFalse !== undefined &&
    action.key === undefined &&
    canDiscardEquivalentBranchCondition(condition)
  ) {
    const merged = mergeGraphChains(whenTrue, whenFalse, context, new Set());
    if (
      merged !== NOT_EQUIVALENT &&
      (action.parameters.alwaysNext !== true || graphSequenceAlwaysContinues(merged, context))
    ) {
      change(
        context,
        path,
        'equivalent-branches',
        '两支战斗效果相同，仅自动生成的伤害身份路径不同',
      );
      return chainActions(merged, context);
    }
  }
  if (condition.kind === 'constant') {
    const unused = condition.value ? whenFalse : whenTrue;
    const unusedPath = `${path}.${condition.value ? 'whenFalse' : 'whenTrue'}`;
    if (unused !== undefined && unused.$sequence !== null) {
      if (canDiscardUnexecutedGraphSequence(unused, context)) {
        change(
          context,
          unusedPath,
          'unreachable-branch',
          `条件恒为 ${condition.value}，未执行分支无准备行为及被引用身份`,
        );
        // 不删除 else 字段：whenFalse 引用是否存在决定运行时使用独立 IfElse 还是顺序守卫。
        if (condition.value) whenFalse = EMPTY_REFERENCE;
        else whenTrue = EMPTY_REFERENCE;
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
      action.parameters.alwaysNext !== true &&
      action.key === undefined
    ) {
      if (whenTrue.$sequence !== null) {
        // 此形状在运行时原本就是 [守卫, ...body]，不改变任何子序列生命周期。
        change(context, path, 'true-guard', '顺序守卫恒真，保留后续步骤及其原 key');
        return chainActions(whenTrue, context);
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
    condition === action.parameters.condition &&
    whenTrue === action.whenTrue &&
    whenFalse === action.whenFalse
      ? action
      : {
          ...action,
          parameters: { ...action.parameters, condition },
          whenTrue,
          ...(whenFalse === undefined ? {} : { whenFalse }),
        },
  ];
}

function processSwitch(
  action: GraphSwitch,
  path: string,
  context: GraphOptimizationContext,
): readonly ActionGraphStep[] {
  const options = action.options.map((option, index) => {
    const sequence = processChain(option.sequence, `${path}.options[${index}].sequence`, context);
    return sequence === option.sequence ? option : { ...option, sequence };
  });
  if (action.key === undefined && options.length > 0) {
    let common: ActionGraphReference | typeof NOT_EQUIVALENT = options[0]!.sequence;
    for (let index = 1; index < options.length && common !== NOT_EQUIVALENT; index++)
      common = mergeGraphChains(common, options[index]!.sequence, context, new Set());
    if (common !== NOT_EQUIVALENT) {
      const matchAnyOption = optimizeCondition(
        {
          kind: 'any',
          conditions: options.map(option => ({
            kind: 'actionValueCompare' as const,
            left: action.parameters.choice,
            operator: 'equal' as const,
            right: option.value,
          })),
        },
        `${path}.parameters.choiceMatch`,
        context,
      );
      change(
        context,
        path,
        'equivalent-branches',
        `switch 的 ${options.length} 个候选效果相同，合并为一次候选匹配和一份公共序列`,
      );
      const synthetic: GraphConditional = {
        kind: 'conditional',
        parameters: {
          condition: matchAnyOption,
          ...(action.parameters.alwaysNext === true ? { alwaysNext: true } : {}),
        },
        whenTrue: common,
      };
      return processConditional(synthetic, path, context);
    }
  }
  return [
    options.every((option, index) => option === action.options[index])
      ? action
      : { ...action, options },
  ];
}

/** 两个 $sequence 子图等价判定：链同长且逐节点动作可合并，嵌套引用递归比较；产物是经 interner 的新链。 */
function mergeGraphChains(
  left: ActionGraphReference,
  right: ActionGraphReference,
  context: GraphOptimizationContext,
  pairs: ReadonlySet<string>,
): ActionGraphReference | typeof NOT_EQUIVALENT {
  if (left.$sequence === null || right.$sequence === null)
    return left.$sequence === right.$sequence ? left : NOT_EQUIVALENT;
  const pairKey = `${left.$sequence} <-> ${right.$sequence}`;
  if (pairs.has(pairKey)) return NOT_EQUIVALENT;
  const nextPairs = new Set([...pairs, pairKey]);
  const leftChain = collectChain(context.nodes, left.$sequence);
  const rightChain = collectChain(context.nodes, right.$sequence);
  if (leftChain.cyclic || rightChain.cyclic || leftChain.ids.length !== rightChain.ids.length)
    return NOT_EQUIVALENT;
  const merged: ActionGraphStep[] = [];
  for (let index = 0; index < leftChain.ids.length; index++) {
    const action = mergeGraphValue(
      context.nodes.get(leftChain.ids[index]!)!.action,
      context.nodes.get(rightChain.ids[index]!)!.action,
      context,
      nextPairs,
    );
    if (action === NOT_EQUIVALENT) return NOT_EQUIVALENT;
    merged.push(action as ActionGraphStep);
  }
  let next: string | null = null;
  for (let index = merged.length - 1; index >= 0; index--)
    next = internNode({ action: merged[index]!, next }, context);
  return { $sequence: next };
}

function isGraphReference(value: unknown): value is ActionGraphReference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== '$sequence') return false;
  const target = (value as ActionGraphReference).$sequence;
  return typeof target === 'string' || target === null;
}

function mergeEquivalentGeneratedDamageKey(
  left: string,
  right: string,
  definitionId: string,
): string | typeof NOT_EQUIVALENT {
  const prefix = `${definitionId}:/`;
  if (!left.startsWith(prefix) || !right.startsWith(prefix)) return NOT_EQUIVALENT;
  // 自动 key 只区分生成定义中的伤害节点，不表达业务差异，也不存在节点间引用。
  // 分支消除可能让两条原始路径深度不同；固定选择字典序较小者，结果与遍历方向无关。
  return left < right ? left : right;
}

/** mergeEquivalentBranchValue 的图版本：$sequence 引用递归合并子图，图节点的 key 在 action.key 上。 */
function mergeGraphValue(
  left: unknown,
  right: unknown,
  context: GraphOptimizationContext,
  pairs: ReadonlySet<string>,
  damageStep = false,
): unknown {
  if (Object.is(left, right)) return left;
  if (
    (left && typeof left === 'object' && 'actionGraph' in left) ||
    (right && typeof right === 'object' && 'actionGraph' in right)
  )
    return NOT_EQUIVALENT;
  if (damageStep && typeof left === 'string' && typeof right === 'string')
    return mergeEquivalentGeneratedDamageKey(left, right, context.definitionId);
  if (isGraphReference(left) || isGraphReference(right)) {
    if (!isGraphReference(left) || !isGraphReference(right)) return NOT_EQUIVALENT;
    return mergeGraphChains(left, right, context, pairs);
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
      return NOT_EQUIVALENT;
    const merged = left.map((value, index) => mergeGraphValue(value, right[index], context, pairs));
    return merged.includes(NOT_EQUIVALENT) ? NOT_EQUIVALENT : merged;
  }
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
    return NOT_EQUIVALENT;
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  if (
    leftKeys.length !== rightKeys.length ||
    leftKeys.some(key => !Object.hasOwn(rightRecord, key))
  )
    return NOT_EQUIVALENT;
  const generatedDamageStep =
    leftRecord.kind === rightRecord.kind &&
    (leftRecord.kind === 'dealDamage' || leftRecord.kind === 'dealFixedDamage');
  const result: Record<string, unknown> = {};
  for (const key of leftKeys) {
    const merged = mergeGraphValue(
      leftRecord[key],
      rightRecord[key],
      context,
      pairs,
      generatedDamageStep && key === 'key',
    );
    if (merged === NOT_EQUIVALENT) return NOT_EQUIVALENT;
    result[key] = merged;
  }
  return result;
}

/** 等价分支只可省略没有写入、随机取样或动作黑板读取的状态查询。 */
function canDiscardEquivalentBranchCondition(condition: CombatCondition): boolean {
  const usage = analyzeConditionUsage(condition);
  return (
    !usage.observable &&
    !usage.unknownAccess &&
    usage.reads.size === 0 &&
    usage.writes.size === 0 &&
    usage.externalReads.length === 0
  );
}

/** alwaysNext 会吞掉公共序列的停止结果；只对确定总会继续的叶动作链展开。 */
function graphSequenceAlwaysContinues(
  reference: ActionGraphReference,
  context: GraphOptimizationContext,
): boolean {
  if (reference.$sequence === null) return true;
  const chain = collectChain(context.nodes, reference.$sequence);
  if (chain.cyclic) return false;
  return chain.ids.every(id =>
    ['applyElementalInfliction', 'dealDamage', 'dealFixedDamage', 'modifyActionValue'].includes(
      context.nodes.get(id)!.action.kind,
    ),
  );
}

/**
 * canDiscardUnexecutedSequence 的图遍历版本：沿节点 next 与所有 $sequence 引用递归，visited 去重防环。
 * 不可达分支仍在 Reset 时准备；只允许移除已经确认准备阶段无行为的节点。
 */
function canDiscardUnexecutedGraphSequence(
  reference: ActionGraphReference,
  context: GraphOptimizationContext,
): boolean {
  const visited = new Set<string>();
  const check = (ref: ActionGraphReference): boolean => {
    let cursor = ref.$sequence;
    while (cursor !== null) {
      if (visited.has(cursor)) return true;
      visited.add(cursor);
      const node = context.nodes.get(cursor);
      if (!node) return false;
      const action = node.action;
      if (action.key !== undefined) return false;
      switch (action.kind) {
        case 'modifyActionValue':
        case 'calculateActionValue':
          break;
        case 'conditional':
          if (!check(action.whenTrue)) return false;
          if (action.whenFalse !== undefined && !check(action.whenFalse)) return false;
          break;
        case 'switch':
          if (!action.options.every(option => check(option.sequence))) return false;
          break;
        default:
          return false;
      }
      cursor = node.next;
    }
    return true;
  };
  return check(reference);
}

/** 删除节点后，从新入口做可达性收集，未被任何入口或引用到达的节点从新 nodes 表剔除。 */
function pruneUnreachable(
  nodes: ReadonlyMap<string, ActionGraphNode>,
  entries: readonly ActionGraphReference[],
): Record<string, ActionGraphNode> {
  const reachable = new Set<string>();
  const visitReference = (reference: ActionGraphReference): void => {
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (reachable.has(cursor)) return;
      reachable.add(cursor);
      const node = nodes.get(cursor);
      if (!node) return;
      scanStepReferences(node.action, visitReference);
      cursor = node.next;
    }
  };
  entries.forEach(visitReference);
  const pruned: Record<string, ActionGraphNode> = {};
  for (const [id, node] of nodes) if (reachable.has(id)) pruned[id] = node;
  return pruned;
}

function scanStepReferences(
  value: unknown,
  visit: (reference: ActionGraphReference) => void,
): void {
  if (value && typeof value === 'object' && 'actionGraph' in value) return;
  if (Array.isArray(value)) {
    value.forEach(item => scanStepReferences(item, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'nodeBindings') continue;
    if (key === '$sequence' && (typeof item === 'string' || item === null))
      visit({ $sequence: item });
    else scanStepReferences(item, visit);
  }
}

function countGraph(
  graph: ActionGraphDefinition,
  entry: ActionGraphReference,
): DefinitionOptimizationReport['before'] {
  const count = { steps: 0, conditions: 0 };
  const reachable = new Set<string>();
  const visitReference = (reference: ActionGraphReference): void => {
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (reachable.has(cursor)) return;
      reachable.add(cursor);
      const node = graph.nodes[cursor];
      if (!node) return;
      scanStepReferences(node.action, visitReference);
      cursor = node.next;
    }
  };
  visitReference(entry);
  for (const id of reachable) {
    const action = graph.nodes[id]!.action;
    count.steps++;
    switch (action.kind) {
      case 'conditional':
        count.conditions += countCondition(action.parameters.condition);
        break;
      case 'listenForCombatEvents':
        for (const response of action.parameters.responses)
          if (response.condition !== undefined)
            count.conditions += countCondition(response.condition);
        break;
      case 'jumpTimeline':
        if (action.parameters.condition !== undefined)
          count.conditions += countCondition(action.parameters.condition);
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

const EMPTY_USAGE: DefinitionValueUsage = {
  reads: new Set(),
  writes: new Set(),
  externalReads: [],
  unknownAccess: false,
  mayThrow: false,
  observable: false,
};

/**
 * analyzeSequenceUsage 的图遍历版本：从入口沿 next 与 $sequence 引用遍历，visited 按节点去重防环，
 * 共享子图只统计一次。携带子序列引用的种类在此沿引用递归；其余叶动作与树版结构相同，直接复用
 * analyzeStepUsage。输出结构与树版一致。
 */
export function analyzeGraphSequenceUsage(
  graph: ActionGraphDefinition,
  entry: ActionGraphReference,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  const visited = new Set<string>();
  const walkReference = (reference: ActionGraphReference): DefinitionValueUsage => {
    const usages: DefinitionValueUsage[] = [];
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const node = graph.nodes[cursor];
      if (!node) break;
      usages.push(graphStepUsage(node.action, walkReference, context));
      cursor = node.next;
    }
    return mergeDefinitionValueUsage(usages);
  };
  return walkReference(entry);
}

function graphStepUsage(
  action: ActionGraphStep,
  walkReference: (reference: ActionGraphReference) => DefinitionValueUsage,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  switch (action.kind) {
    case 'conditional':
      return mergeDefinitionValueUsage([
        analyzeConditionUsage(action.parameters.condition),
        walkReference(action.whenTrue),
        ...(action.whenFalse === undefined ? [] : [walkReference(action.whenFalse)]),
      ]);
    case 'switch':
      return mergeDefinitionValueUsage([
        actionValueUsage(action.parameters.choice),
        ...action.options.flatMap(option => [
          actionValueUsage(option.value),
          walkReference(option.sequence),
        ]),
      ]);
    case 'once':
    case 'repeatEachTick':
    case 'forEachContextTarget':
      return { ...walkReference(action.body), observable: true };
    case 'repeatByActionValue':
      return {
        ...mergeDefinitionValueUsage([
          actionValueUsage(action.parameters.count),
          walkReference(action.body),
        ]),
        observable: true,
      };
    case 'withActionBlackboardScope':
      return {
        ...mergeDefinitionValueUsage([
          walkReference(action.body),
          ...Object.values(action.parameters.entityAssignments ?? {}).map(actionValueUsage),
        ]),
        mayThrow: true,
        observable: true,
      };
    case 'listenForCombatEvents':
      return {
        ...mergeDefinitionValueUsage(
          action.parameters.responses.flatMap(response => [
            walkReference(response.sequence),
            ...(response.condition === undefined
              ? []
              : [analyzeConditionUsage(response.condition)]),
          ]),
        ),
        observable: true,
      };
    case 'launchProjectile':
      // 回调是独立资源：沿自己的图分析延时入口。回调 direct 板继承创建时的父快照并覆盖
      // 自身初值，回调体的读取必须上传为父板读取；回调黑板默认值不是父板读取。
      return {
        ...mergeDefinitionValueUsage(
          action.callbacks.flatMap(callback =>
            callback.skill.scheduledSequences.map(item =>
              analyzeGraphSequenceUsage(callback.skill.actionGraph.main, item.sequence, context),
            ),
          ),
        ),
        mayThrow: true,
        observable: true,
      };
    case 'callResource':
    case 'callMacro':
      // 宏内部节点不在本图；保守标成未知访问。
      return { ...EMPTY_USAGE, unknownAccess: true, mayThrow: true, observable: true };
    default:
      // 叶动作的图形态与树形态结构相同（ActionGraphValue 只改写子序列字段）。
      return analyzeStepUsage(action as unknown as CombatStepDefinition, context);
  }
}

/** 与 actionGraphBuilder 的 stableSignature 同一实现：不压平 Infinity/undefined，不依赖属性插入顺序。 */
function stableSignature(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableSignature).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => JSON.stringify(key) + ':' + stableSignature(item))
        .join(',') +
      '}'
    );
  return (
    typeof value +
    ':' +
    String(value === 0 && Object.is(value, -0) ? '-0' : (JSON.stringify(value) ?? value)) +
    (typeof value === 'number' && !Number.isFinite(value) ? String(value) : '')
  );
}
