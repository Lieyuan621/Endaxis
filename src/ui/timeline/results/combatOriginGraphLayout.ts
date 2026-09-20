import * as dagre from '@dagrejs/dagre';
import { eventBuff } from '../../../core/projection/combatObjectOrigins';
import type { CombatObjectRef } from '../../../core/combat/receipt/combatReceipt';
import type {
  CombatObjectNode,
  CombatObjectOrigins,
  CombatObjectRelation,
  CombatDirectModifier,
} from '../../../core/projection/combatObjectOrigins';

export type OriginRelationFilter = CombatObjectRelation | 'all' | 'buffChanges';
const buffChangeRelations = new Set<CombatObjectRelation>([
  'producedBy',
  'stackedBy',
  'previousState',
  'convertedBy',
  'modifiedBy',
  'providedBy',
  'ownedBy',
  'originCast',
  'appliedBuff',
  'changedStacks',
  'attemptedStacking',
  'consumedBuff',
  'absorbedBuff',
  'endedBuff',
  'eventSource',
]);
export interface OriginGraphNode {
  readonly object: CombatObjectNode;
  readonly x: number;
  readonly y: number;
  readonly modifiers: readonly CombatDirectModifier[];
}
export interface OriginGraphEdge {
  readonly from: number;
  readonly to: number;
  readonly relation: CombatObjectRelation;
}

/** 展示层布局；共用历史状态只放置一次，来源关系指向关系发生时的上游状态。 */
export function layoutCombatOriginGraph(
  origins: CombatObjectOrigins,
  sequence: number,
  filter: OriginRelationFilter,
  maximum = 128,
  root: CombatObjectRef = { kind: 'receipt', sequence },
) {
  const rootObject = origins.get(root);
  const objects = [origins.buffState(rootObject, sequence)];
  const direct = origins.directModifiers(rootObject);
  const modifiersByObject = new Map<CombatObjectNode, CombatDirectModifier[]>();
  const buffByModifier = new Map<CombatObjectNode, CombatObjectNode>();
  for (const item of direct) {
    const object = item.buff ? origins.buffState(item.buff, sequence) : item.node;
    const items = modifiersByObject.get(object) ?? [];
    items.push(item);
    modifiersByObject.set(object, items);
    if (item.buff) buffByModifier.set(item.node, object);
  }
  const indices = new Map<CombatObjectNode, number>([[objects[0]!, 0]]);
  const edges: OriginGraphEdge[] = [];
  let limited = false;
  for (let from = 0; from < objects.length; from++) {
    const object = objects[from]!;
    // 只在展示层折叠修正节点；数值记录仍保留原命中索引和精确实例。
    const links = [...origins.relations(object, sequence)];
    const stateBuff =
      object.fact && ['BuffApplied', 'BuffStackChanged'].includes(object.fact.event)
        ? eventBuff(object.fact)
        : undefined;
    if (stateBuff && object.fact?.event === 'BuffApplied') {
      // 初始状态继承出生/转化来源；后续状态仅沿 previousState 回到它。
      links.push(
        ...origins
          .relations(origins.get(stateBuff), sequence)
          .filter(link => ['producedBy', 'convertedBy', 'ownedBy'].includes(link.relation)),
      );
    }
    if (object.ref.kind === 'buff' || stateBuff) {
      for (const item of modifiersByObject.get(object) ?? [])
        links.push({ relation: 'providedBy', target: item.provider, sequence });
    }
    for (const link of links) {
      // 图只追溯上游；实例/施法的过程索引属于向后展开，全部关系模式也不遍历。
      if (link.relation === 'buffEvent' || link.relation === 'castEvent') continue;
      // Buff 已在入图时定位到历史状态，出生节点不能再跳到该实例的最新状态。
      if (link.relation === 'stackedBy') continue;
      // 实际增层已作为上游事件展开，不再用“作用于自身”的边连回 Buff 形成展示环。
      if (stateBuff && ['changedStacks', 'appliedBuff'].includes(link.relation)) continue;
      const accepted =
        filter === 'all' ||
        (filter === 'buffChanges' && buffChangeRelations.has(link.relation)) ||
        (object.ref.kind === 'action' && link.relation === 'ownedBy') ||
        (filter === 'modifiedBy'
          ? link.relation === 'modifiedBy' || link.relation === 'providedBy'
          : link.relation === filter);
      if (!accepted) continue;
      const resolved = buffByModifier.get(link.target) ?? link.target;
      // 每条来源关系都使用它自身发生前的状态，而不是当前命中的全局截止时刻。
      // 例如 A 产生 B、B 后来增强 A：B 的来源是早期 A，不能跳到增强后的 A 形成环。
      // 初始状态继承的出生边沿用出生序号，比 BuffApplied 更早。
      const cutoff = Math.min(sequence, (link.sequence ?? sequence + 1) - 1);
      const target =
        link.relation === 'previousState' ? resolved : origins.buffState(resolved, cutoff);
      // 对象引用自身不提供额外来源信息；实际自增长由 previousState 指向较早状态。
      if (target === object) continue;
      let to = indices.get(target);
      if (to === undefined) {
        if (objects.length >= maximum) {
          limited = true;
          continue;
        }
        to = objects.length;
        objects.push(target);
        indices.set(target, to);
      }
      if (
        !edges.some(edge => edge.from === from && edge.to === to && edge.relation === link.relation)
      )
        edges.push({ from, to, relation: link.relation });
    }
  }
  // Dagre 完成分层、交叉消减、坐标分配及跨层边路由。
  // 每条关系经独立布局点连接，避免 Dagre 3.1.1 在分支 DAG 的平行边上生成退化交点。
  // 布局点不作为业务节点输出；关系方向、历史身份和数量保持不变，也不用于掩盖因果环。
  const layout = new dagre.graphlib.Graph();
  layout.setGraph({
    rankdir: 'LR',
    ranker: 'network-simplex',
    nodesep: 48,
    edgesep: 24,
    // 一条关系现在跨两段，保持原有约 120px 的节点间距。
    ranksep: 60,
    marginx: 32,
    marginy: 32,
  });
  objects.forEach((_, index) => layout.setNode(String(index), { width: 240, height: 88 }));
  edges.forEach((edge, index) => {
    const waypoint = `relation:${index}`;
    layout.setNode(waypoint, { width: 1, height: 1 });
    layout.setEdge(String(edge.from), waypoint, {});
    layout.setEdge(waypoint, String(edge.to), {});
  });
  dagre.layout(layout);
  const nodes: OriginGraphNode[] = objects.map((object, index) => {
    const position = layout.node(String(index));
    return {
      object,
      modifiers: modifiersByObject.get(object) ?? [],
      x: position.x - position.width / 2,
      y: position.y - position.height / 2,
    };
  });
  const routes = edges.map((edge, index) => {
    const waypoint = `relation:${index}`;
    const middle = layout.node(waypoint);
    const incoming = layout.edge(String(edge.from), waypoint).points;
    const outgoing = layout.edge(waypoint, String(edge.to)).points;
    // 两段在不可见布局点处接成一条路径；舍去该点的矩形边界，保留其中心作为控制点。
    const points = [...incoming.slice(0, -1), { x: middle.x, y: middle.y }, ...outgoing.slice(1)];
    return { path: curvedRoute(points), x: middle.x, y: middle.y - 7 };
  });
  return {
    nodes,
    edges,
    routes,
    limited,
    width: layout.graph().width!,
    height: layout.graph().height!,
  };
}

/** 沿布局库给出的路由点平滑连接，不重新决定绕行方向或覆盖其跨层路径。 */
function curvedRoute(points: readonly { x: number; y: number }[]): string {
  const first = points[0]!;
  let path = `M ${first.x} ${first.y}`;
  // 二次曲线以路径点为控制点、相邻中点为端点，不会发生插值曲线的外侧过冲。
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index]!;
    const next = points[index + 1]!;
    path += ` Q ${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
  }
  const last = points[points.length - 1]!;
  path += ` Q ${last.x} ${last.y} ${last.x} ${last.y}`;
  return path;
}
