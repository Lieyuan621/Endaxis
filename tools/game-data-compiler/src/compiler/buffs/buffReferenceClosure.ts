import {
  collectBuffActionReferences,
  parseReferenceAwareBuffActionGraphSource,
} from '../../source/buffActionGraph.ts';
import {
  buffShowsTimelineActions,
  parseBuffRuntimeSource,
  type BuffRuntimeSource,
} from '../../source/buffRuntime.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import type { DefinitionReferenceSource } from '../../source/referenceGraph.ts';
import type { GlobalBuffTemplateCatalogSource } from '../../source/globalBuffTemplate.ts';

/**
 * 定义依赖收集，不改写动作和运行时黑板。
 * 只开放原生关键词的声明默认 child 或创建动作字面覆盖契约；一般动态字符串数据流仍显式阻塞。
 */
export function collectBuffRuntimeClosure(
  rootIds: readonly string[],
  buffData: Record<string, unknown> | ((id: string) => unknown),
  globalBuffCatalog?: GlobalBuffTemplateCatalogSource,
  provenDefaultKeywordCarrierRootIds: ReadonlySet<string> = new Set(),
  rootBlackboards: ReadonlyMap<string, Readonly<Record<string, number | string>>> = new Map(),
): Map<string, BuffRuntimeSource> {
  const result = new Map<string, BuffRuntimeSource>();
  const references = new Map<string, readonly DefinitionReferenceSource[]>();
  const queue = [...rootIds];
  do {
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (result.has(id)) continue;
      const value = typeof buffData === 'function' ? buffData(id) : buffData[id];
      if (value === undefined)
        throw new Error(`BuffData: missing Buff definition ${JSON.stringify(id)}`);
      const source = parseBuffRuntimeSource(value, `BuffData.${id}`);
      if (source.graph.buffId !== id) throw new Error(`BuffData.${id}.id: identity mismatch`);
      result.set(id, source);
      const referenceGraph = parseReferenceAwareBuffActionGraphSource(value, `BuffData.${id}`, {});
      const executableGraph = buffShowsTimelineActions(source)
        ? source.graph
        : { ...source.graph, timelineActions: [] };
      const executableReferenceGraph = buffShowsTimelineActions(source)
        ? referenceGraph
        : { ...referenceGraph, timelineActions: [] };
      // 可执行图能识别测试/旧切片中的公共动作，引用专用图还能穿透表现动作中
      // 的嵌套结束子图；闭包取二者并集，不能用后者替换前者。
      const allRefs = [
        ...collectBuffActionReferences(executableGraph),
        ...collectBuffActionReferences(executableReferenceGraph),
      ].filter(ref => ref.state !== 'inactive');
      for (const ref of allRefs.filter(ref => ref.kind === 'globalBuff')) {
        if (ref.state === 'dynamic' || ref.id === null) {
          throw new Error(`${ref.sourcePath}: dynamic GlobalBuff references are unsupported`);
        }
        const template = globalBuffCatalog?.byId.get(ref.id);
        if (template === undefined) {
          throw new Error(
            `${ref.sourcePath}: missing GlobalBuff template ${JSON.stringify(ref.id)}`,
          );
        }
        for (const child of template.children) queue.push(child.buffId);
      }
      const refs = allRefs.filter(ref => ref.kind === 'buff');
      references.set(id, refs);
      for (const ref of refs) {
        // Finish/query/inheritance only observe an already-existing instance and do not require
        // its definition to be hydrated into this owner. The roots are compiled applyBuff edges;
        // recursively follow only native edges that can create or own a child definition.
        if (
          ['apply', 'aura', 'keywordCarrier'].includes(ref.usage) &&
          ref.state !== 'dynamic' &&
          ref.id !== null
        )
          queue.push(ref.id);
      }
    }
    // 每次新子图加入后都重验来路：后发现的普通创建/未知覆盖不能绕过原先的证明。
    for (const [id, refs] of references) {
      for (const ref of refs) {
        if (ref.state !== 'dynamic' && ref.id !== null) continue;
        const candidates = resolveKeywordChildCandidates(
          id,
          ref,
          rootIds,
          result,
          references,
          provenDefaultKeywordCarrierRootIds,
          rootBlackboards,
        );
        for (const candidate of candidates) if (!result.has(candidate)) queue.push(candidate);
      }
    }
  } while (queue.length > 0);
  return result;
}

function nodes(source: BuffRuntimeSource) {
  return [
    ...source.graph.buffEvents.flatMap(event => event.actions),
    ...source.graph.abilityEvents.flatMap(event => event.actions),
    ...source.graph.igniteEvents.flatMap(event => event.actions),
    ...(buffShowsTimelineActions(source)
      ? source.graph.timelineActions.map(timeline => timeline.sequence)
      : []),
  ].flatMap(sequence => collectNativeActionNodes(sequence));
}

/** 已知引用存在，但当前创建来路不足以证明它的全部候选。 */
export class UnprovenBuffReferenceError extends Error {}

export function resolveKeywordChildCandidates(
  id: string,
  ref: DefinitionReferenceSource,
  roots: readonly string[],
  sources: ReadonlyMap<string, BuffRuntimeSource>,
  references: ReadonlyMap<string, readonly DefinitionReferenceSource[]>,
  provenDefaultKeywordCarrierRootIds: ReadonlySet<string>,
  rootBlackboards: ReadonlyMap<string, Readonly<Record<string, number | string>>>,
): readonly string[] {
  const fail = (): never => {
    throw new UnprovenBuffReferenceError(
      `${ref.sourcePath}: dynamic Buff references cannot form a static Buff closure without a proven keyword default-child contract`,
    );
  };
  // _DoApplyKeywordBuff 只有显式覆盖才修改此键；外部根的施加参数无法在本闭包中证明。
  if (ref.usage === 'apply' && ref.blackboardKey !== null) {
    const resolved = resolveStaticStringBlackboardCandidates(
      id,
      ref.blackboardKey,
      roots,
      sources,
      rootBlackboards,
    );
    if (resolved !== null && resolved.length > 0) return resolved;
  }
  if (
    (roots.includes(id) && !provenDefaultKeywordCarrierRootIds.has(id)) ||
    ref.usage !== 'apply' ||
    ref.blackboardKey !== 'child_buff_id'
  )
    return fail();
  const source = sources.get(id)!;
  const declared = source.graph.declaredBlackboard.find(item => item.key === ref.blackboardKey);
  if (!declared || declared.isDynamic || typeof declared.value !== 'string' || !declared.value)
    return fail();
  // 当前允许的载体只含创建子 Buff/表现动作，排除本地写入、条件副作用和共享板路径。
  if (
    (buffShowsTimelineActions(source) && source.graph.timelineActions.length > 0) ||
    source.graph.abilityEvents.length ||
    source.graph.igniteEvents.length
  )
    return fail();
  if (source.graph.buffEvents.some(event => event.event !== 'DuringBuffEnable')) return fail();
  if (
    nodes(source).some(
      node =>
        node.metadata.enabled &&
        (node.body.kind !== 'leaf' ||
          !['buffApplication', 'presentation'].includes(node.body.value.family)),
    )
  )
    return fail();
  const candidates = new Set<string>();
  if (provenDefaultKeywordCarrierRootIds.has(id)) candidates.add(declared.value);
  const incoming = [...references.values()]
    .flat()
    .filter(item => item.id === id && ['apply', 'aura', 'keywordCarrier'].includes(item.usage));
  if (
    !provenDefaultKeywordCarrierRootIds.has(id) &&
    (!incoming.length || incoming.some(item => item.usage !== 'keywordCarrier'))
  )
    return fail();
  const creators = [...sources.values()]
    .flatMap(nodes)
    .filter(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'keywordBuff' &&
        node.body.value.action.carrierBuffId === id,
    );
  if (!creators.length) return candidates.size > 0 ? [...candidates] : fail();
  for (const node of creators) {
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'keywordBuff') return fail();
    const action = node.body.value.action;
    if (!action.overrideChildBuffId) {
      candidates.add(declared.value);
      continue;
    }
    if (action.childBuffId.blackboardKey !== null) return fail();
    // _DoApplyKeywordBuff 只写入非空覆盖；启用覆盖但字符串为空时仍使用声明默认值。
    candidates.add(action.childBuffId.value || declared.value);
  }
  return [...candidates];
}

/**
 * 沿 CreateBuff 的字面黑板赋值反向求一个字符串键的所有静态候选。
 * 根实例覆盖、直接赋值和父 Buff 黑板转发是三种已解析的数据来源；任何未知来路都会保留阻断。
 */
function resolveStaticStringBlackboardCandidates(
  buffId: string,
  key: string,
  roots: readonly string[],
  sources: ReadonlyMap<string, BuffRuntimeSource>,
  rootBlackboards: ReadonlyMap<string, Readonly<Record<string, number | string>>>,
  visiting: ReadonlySet<string> = new Set(),
): readonly string[] | null {
  const visitKey = `${buffId}\u0000${key}`;
  if (visiting.has(visitKey)) return null;
  const source = sources.get(buffId);
  if (source === undefined) return null;
  const nextVisiting = new Set(visiting).add(visitKey);
  const declared = source.graph.declaredBlackboard.find(item => item.key === key);
  const defaultValue =
    declared !== undefined && !declared.isDynamic && typeof declared.value === 'string'
      ? declared.value
      : null;
  const candidates = new Set<string>();
  let hasPath = false;
  let unknown = false;

  if (roots.includes(buffId)) {
    hasPath = true;
    const rootBlackboard = rootBlackboards.get(buffId);
    const rootValue =
      rootBlackboard === undefined ? undefined : (rootBlackboard[key] ?? defaultValue);
    // 根 Buff 的实例黑板由外部施加者决定。只有调用方明确提供了覆盖值才能静态解析；
    // 声明默认值是否可用于关键词载体，继续交给下方经过审计的默认-child 协议判断。
    if (rootBlackboard !== undefined && typeof rootValue === 'string' && rootValue.length > 0)
      candidates.add(rootValue);
    else unknown = true;
  }

  for (const [parentId, parent] of sources) {
    for (const node of nodes(parent)) {
      if (
        !node.metadata.enabled ||
        node.body.kind !== 'leaf' ||
        node.body.value.family !== 'buffApplication'
      )
        continue;
      for (const entry of node.body.value.action.buffs) {
        if (entry.readIdFromBlackboard || entry.buffId !== buffId) continue;
        hasPath = true;
        const assignment = entry.assignments.find(item => item.targetKey === key);
        if (assignment === undefined) {
          // 普通 CreateBuff 没有显式赋值时，调用点仍可能通过尚未建模的实例黑板来源
          // 覆盖声明值；不能把默认值当成已证明的数据流。
          unknown = true;
          continue;
        }
        if (assignment.useDirectValue) {
          if (assignment.valueType === 'String' && assignment.stringValue.length > 0)
            candidates.add(assignment.stringValue);
          else unknown = true;
          continue;
        }
        const inherited = resolveStaticStringBlackboardCandidates(
          parentId,
          assignment.inputValueKey,
          roots,
          sources,
          rootBlackboards,
          nextVisiting,
        );
        if (inherited === null || inherited.length === 0) unknown = true;
        else for (const value of inherited) candidates.add(value);
      }
    }
  }
  if (!hasPath) return null;
  return unknown ? null : [...candidates];
}

/**
 * 返回完整闭包已经证明的字符串黑板候选；null 表示仍存在未知施加来路。
 * 供投影阶段判断动态 Buff 创建是否只有纯表现候选，不得用于猜测一般动态引用。
 */
export function resolveProvenStringBlackboardCandidates(
  buffId: string,
  key: string,
  roots: readonly string[],
  sources: ReadonlyMap<string, BuffRuntimeSource>,
  rootBlackboards: ReadonlyMap<string, Readonly<Record<string, number | string>>>,
): readonly string[] | null {
  return resolveStaticStringBlackboardCandidates(buffId, key, roots, sources, rootBlackboards);
}
