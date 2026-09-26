/** 在分支去重之后，提取同一资源内输入相同、后续不同的同步直线中间段。 */
import type {
  ActionGraphDefinition,
  ActionGraphMacroDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';

const MIN_NODES = 8;
const MAX_NODES = 64;
const MIN_NODE_SAVINGS = 4;

/** 仅包含立即读取或写入当前环境的叶动作；不跨作用域、回调和对象寿命。 */
const SYNCHRONOUS_LEAF_KINDS = new Set<ActionGraphStep['kind']>([
  'modifyActionValue',
  'calculateActionValue',
  'readBuffStackCount',
  'readBuffBlackboard',
  'storeSourceAttributeValue',
  'setContextFlag',
]);

export interface ActionGraphMiddleSegmentCandidate {
  readonly status: 'accepted' | 'rejected';
  readonly reason?:
    | 'terminalSegment'
    | 'sameContinuation'
    | 'overlap'
    | 'insufficientNodeSavings'
    | 'insufficientByteSavings';
  /** 提取前各段的首节点；接受后仍保留这些 ID 作为调用位置。 */
  readonly starts: readonly string[];
  /** 每份重复结构包含的有效动作数。 */
  readonly nodeCount: number;
  /** 各次调用离开公共段之后分别执行的节点。 */
  readonly continuations: readonly (string | null)[];
  readonly netNodeReduction: number;
  /** 原节点减去宏体、调用及节点身份映射之后的 UTF-8 字节收益。 */
  readonly savedBytes: number;
  readonly macroId?: string;
}

interface Candidate {
  readonly starts: readonly string[];
  readonly length: number;
}

interface Replacement {
  readonly macro: ActionGraphMacroDefinition;
  readonly calls: Readonly<Record<string, ActionGraphNode>>;
  readonly removed: readonly string[];
  readonly continuations: readonly (string | null)[];
  readonly netNodeReduction: number;
  readonly savedBytes: number;
}

function signature(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(signature).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${signature(item)}`)
      .join(',')}}`;
  }
  return `${typeof value}:${typeof value === 'number' && Object.is(value, -0) ? '-0' : (JSON.stringify(value) ?? String(value))}${typeof value === 'number' && !Number.isFinite(value) ? String(value) : ''}`;
}

/** 外部资源具有自己的节点空间，只统计当前资源的入口引用。 */
function visitReferences(value: unknown, visit: (id: string) => void): void {
  if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
  if ('$sequence' in value && Object.keys(value).length === 1) {
    const id = (value as ActionGraphReference).$sequence;
    if (id !== null) visit(id);
    return;
  }
  for (const [key, item] of Object.entries(value))
    if (key !== 'nodeBindings') visitReferences(item, visit);
}

/** 不改变图入口，不展开动作树；没有合格候选时直接返回原图和原入口。 */
export function extractActionGraphMiddleSegments(
  graph: ActionGraphDefinition,
  entries: readonly ActionGraphReference[],
): {
  graph: ActionGraphDefinition;
  entries: readonly ActionGraphReference[];
  macros: Readonly<Record<string, ActionGraphMacroDefinition>>;
  candidates: readonly ActionGraphMiddleSegmentCandidate[];
} {
  const roots = new Set(
    entries.flatMap(entry => (entry.$sequence === null ? [] : [entry.$sequence])),
  );
  const incoming = new Map<string, Set<string>>();
  const reachable = new Set<string>();
  const pending = [...roots];
  while (pending.length) {
    const id = pending.pop()!;
    if (reachable.has(id)) continue;
    const node = graph.nodes[id];
    if (!node) throw new Error(`missing graph node: ${id}`);
    reachable.add(id);
    const register = (target: string) => {
      let sources = incoming.get(target);
      if (!sources) incoming.set(target, (sources = new Set()));
      sources.add(id);
      pending.push(target);
    };
    if (node.next !== null) register(node.next);
    visitReferences(node.action, register);
  }

  const actionTokens = new Map<string, number>();
  const tokens = new Map<string, number>();
  for (const id of [...reachable].sort()) {
    const action = graph.nodes[id]!.action;
    if (!SYNCHRONOUS_LEAF_KINDS.has(action.kind)) continue;
    let hasReference = false;
    visitReferences(action, () => (hasReference = true));
    if (hasReference) continue;
    const key = signature(action);
    if (!actionTokens.has(key)) actionTokens.set(key, actionTokens.size);
    tokens.set(id, actionTokens.get(key)!);
  }

  // 只沿原图走最多 64 步。内节点被其他入口或分支引用时立即停止，不能截走共享节点。
  const chains = new Map<string, readonly string[]>();
  const groups = new Map<string, string[]>();
  for (const start of tokens.keys()) {
    const chain: string[] = [];
    const seen = new Set<string>();
    let id: string | null = start;
    while (id !== null && tokens.has(id) && chain.length < MAX_NODES) {
      if (seen.has(id)) throw new Error(`cyclic graph node: ${id}`);
      if (chain.length && (roots.has(id) || incoming.get(id)?.size !== 1)) break;
      chain.push(id);
      seen.add(id);
      id = graph.nodes[id]!.next;
    }
    if (chain.length < MIN_NODES) continue;
    chains.set(start, chain);
    const key = chain
      .slice(0, MIN_NODES)
      .map(nodeId => tokens.get(nodeId))
      .join(',');
    let starts = groups.get(key);
    if (!starts) groups.set(key, (starts = []));
    starts.push(start);
  }

  // 共同前缀仍覆盖相同调用位置时只保留更长候选；发生分歧时才保留较短候选。
  const candidates: Candidate[] = [];
  const groupsToExtend = [...groups.values()]
    .filter(starts => starts.length > 1)
    .map(starts => ({ starts, length: MIN_NODES }));
  while (groupsToExtend.length) {
    const candidate = groupsToExtend.pop()!;
    const nextGroups = new Map<number, string[]>();
    if (candidate.length < MAX_NODES) {
      for (const start of candidate.starts) {
        const next = chains.get(start)![candidate.length];
        if (next === undefined) continue;
        const token = tokens.get(next)!;
        let starts = nextGroups.get(token);
        if (!starts) nextGroups.set(token, (starts = []));
        starts.push(start);
      }
    }
    const extensions = [...nextGroups.values()].filter(starts => starts.length > 1);
    if (extensions.length !== 1 || extensions[0]!.length !== candidate.starts.length)
      candidates.push(candidate);
    for (const starts of extensions) groupsToExtend.push({ starts, length: candidate.length + 1 });
  }

  function replacement(candidate: Candidate, macroId: string, existingMacroCount = 0): Replacement {
    const macroNodes: Record<string, ActionGraphNode> = {};
    const calls: Record<string, ActionGraphNode> = {};
    const removed: string[] = [];
    const continuations: (string | null)[] = [];
    const original: Record<string, ActionGraphNode> = {};
    const template = chains.get(candidate.starts[0]!)!;
    for (let i = 0; i < candidate.length; i++) {
      macroNodes[`n${i + 1}`] = {
        action: graph.nodes[template[i]!]!.action,
        next: i + 1 === candidate.length ? null : `n${i + 2}`,
      };
    }
    for (const start of candidate.starts) {
      const ids = chains.get(start)!.slice(0, candidate.length);
      const next = graph.nodes[ids.at(-1)!]!.next;
      continuations.push(next);
      for (const id of ids) original[id] = graph.nodes[id]!;
      removed.push(...ids.slice(1));
      calls[start] = {
        action: {
          kind: 'callMacro',
          macroId,
          nodeBindings: Object.fromEntries(ids.map((id, index) => [`n${index + 1}`, id])),
        },
        next,
      };
    }
    const macro = { graph: { nodes: macroNodes }, entry: { $sequence: 'n1' } };
    // 两侧均计入对象包装成本；新侧额外计入宏目录中的名称。
    const savedBytes =
      Buffer.byteLength(JSON.stringify({ nodes: original, macros: {} })) -
      Buffer.byteLength(JSON.stringify({ nodes: calls, macros: { [macroId]: macro } })) -
      (existingMacroCount > 0 ? 1 : 0);
    return {
      macro,
      calls,
      removed,
      continuations,
      netNodeReduction: Object.keys(original).length - Object.keys(calls).length - candidate.length,
      savedBytes,
    };
  }

  // 同一重复模式内也可能互相覆盖；每次选取实际独立的实例，不能把共享节点重复算收益。
  function independent(candidate: Candidate, excluded: ReadonlySet<string>): Candidate {
    const used = new Set<string>(excluded);
    const starts = candidate.starts.filter(start => {
      const ids = chains.get(start)!.slice(0, candidate.length);
      if (ids.some(id => used.has(id))) return false;
      for (const id of ids) used.add(id);
      return true;
    });
    return { ...candidate, starts };
  }
  const ranked = candidates.map(candidate => {
    const { savedBytes, netNodeReduction } = replacement(
      independent(candidate, new Set()),
      'middle_1',
    );
    return { candidate, savedBytes, netNodeReduction };
  });
  ranked.sort(
    (a, b) =>
      b.savedBytes - a.savedBytes ||
      b.netNodeReduction - a.netNodeReduction ||
      b.candidate.length - a.candidate.length ||
      (a.candidate.starts[0]! < b.candidate.starts[0]! ? -1 : 1),
  );

  const macros: Record<string, ActionGraphMacroDefinition> = {};
  const reports: ActionGraphMiddleSegmentCandidate[] = [];
  const used = new Set<string>();
  let result: Record<string, ActionGraphNode> | undefined;
  for (const { candidate: originalCandidate } of ranked) {
    const candidate = independent(originalCandidate, used);
    if (candidate.starts.length < 2) {
      reports.push({
        status: 'rejected',
        reason: 'overlap',
        starts: originalCandidate.starts,
        nodeCount: originalCandidate.length,
        continuations: originalCandidate.starts.map(
          start => graph.nodes[chains.get(start)![originalCandidate.length - 1]!]!.next,
        ),
        netNodeReduction: 0,
        savedBytes: 0,
      });
      continue;
    }
    const macroId = `middle_${Object.keys(macros).length + 1}`;
    const update = replacement(candidate, macroId, Object.keys(macros).length);
    const ids = candidate.starts.flatMap(start => chains.get(start)!.slice(0, candidate.length));
    const reason: ActionGraphMiddleSegmentCandidate['reason'] = update.continuations.some(
      next => next === null,
    )
      ? 'terminalSegment'
      : new Set(update.continuations).size < 2
        ? 'sameContinuation'
        : update.netNodeReduction < MIN_NODE_SAVINGS
          ? 'insufficientNodeSavings'
          : update.savedBytes <= 0
            ? 'insufficientByteSavings'
            : undefined;
    reports.push({
      status: reason === undefined ? 'accepted' : 'rejected',
      ...(reason === undefined ? { macroId } : { reason }),
      starts: candidate.starts,
      nodeCount: candidate.length,
      continuations: update.continuations,
      netNodeReduction: update.netNodeReduction,
      savedBytes: update.savedBytes,
    });
    if (reason !== undefined) continue;
    result ??= { ...graph.nodes };
    for (const id of update.removed) delete result[id];
    Object.assign(result, update.calls);
    macros[macroId] = update.macro;
    for (const id of ids) used.add(id);
  }
  return { graph: result ? { nodes: result } : graph, entries, macros, candidates: reports };
}
