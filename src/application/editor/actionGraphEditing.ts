/** 正式动作图的不可变编辑；节点身份、宏和独立资源边界与运行时共用同一契约。 */
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { validateActionGraphOwner } from '../../core/action-graph/actionGraphValidation';
import type { ScheduledSequenceDefinition } from '../../../packages/game-data-contract/src/actions';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';
import { validateActionGraphStepDefinition } from '../../core/game-data/validation/actionPrograms';
import { updateSkillGraph, type SkillGraphAddress } from './skillGraphCommands';

export interface GraphPort {
  /** 从节点根开始的字段路径，例如 next 或 action.body.$sequence。 */
  readonly path: readonly string[];
  readonly label: string;
  readonly target: string | null;
}

/** 入口只投影正式定义，不写入额外节点或入口表；数组下标始终对应源调度项。 */
export interface GraphEntry {
  /** timeline:{index}、event:{handlerIndex}:{sequenceIndex}、switch 或 macro。 */
  readonly id: string;
  readonly label: string;
  readonly targetId: string | null;
  readonly startFrame?: number;
  readonly endFrame?: number;
}

export interface GraphEntryGroup {
  /** timeline、event:{handlerIndex}、switch 或 macro。 */
  readonly id: string;
  readonly label: string;
  readonly entries: readonly GraphEntry[];
}

export interface GraphEntryPatch {
  readonly targetId?: string | null;
  readonly startFrame?: number;
  /** null 删除可选的结束帧，undefined 保持原值。 */
  readonly endFrame?: number | null;
}

export function getEditableGraph(
  skill: SkillDefinition,
  address: SkillGraphAddress,
): ActionGraphDefinition {
  if (address.kind === 'main') return skill.actionGraph.main;
  if (!Object.hasOwn(skill.actionGraph.macros, address.macroId))
    throw new Error(`skill '${skill.key}' has no macro '${address.macroId}'`);
  return skill.actionGraph.macros[address.macroId]!.graph;
}

function scheduleEntries(
  schedules: readonly ScheduledSequenceDefinition[],
  prefix: string,
): readonly GraphEntry[] {
  return schedules.map((schedule, index) => ({
    id: `${prefix}:${index}`,
    label: `调度 ${index + 1}`,
    targetId: schedule.sequence.$sequence,
    startFrame: schedule.startFrame,
    ...(schedule.endFrame === undefined ? {} : { endFrame: schedule.endFrame }),
  }));
}

/** 施放时间线与每个事件来源分别成组；共享目标不会合并调度调用及其帧范围。 */
export function listGraphEntryGroups(
  skill: SkillDefinition,
  address: SkillGraphAddress,
): readonly GraphEntryGroup[] {
  getEditableGraph(skill, address);
  if (address.kind === 'macro')
    return [
      {
        id: 'macro',
        label: `宏 · ${address.macroId}`,
        entries: [
          {
            id: 'macro',
            label: '宏入口',
            targetId: skill.actionGraph.macros[address.macroId]!.entry.$sequence,
          },
        ],
      },
    ];
  const groups: GraphEntryGroup[] = [
    {
      id: 'timeline',
      label: '施放时间线',
      entries: scheduleEntries(skill.scheduledSequences, 'timeline'),
    },
  ];
  skill.eventHandlers?.forEach((handler, index) =>
    groups.push({
      id: `event:${index}`,
      label: `事件 · ${handler.key}`,
      entries: scheduleEntries(handler.scheduledSequences, `event:${index}`),
    }),
  );
  if (skill.switchToBuffCast !== undefined)
    groups.push({
      id: 'switch',
      label: '切换为 Buff 施放',
      entries: [
        { id: 'switch', label: '切换入口', targetId: skill.switchToBuffCast.sequence.$sequence },
      ],
    });
  return groups;
}

function editSchedules(
  schedules: readonly ScheduledSequenceDefinition[],
  prefix: string,
  selected: ReadonlySet<string>,
  patch: GraphEntryPatch,
): readonly ScheduledSequenceDefinition[] {
  const result = schedules.map((schedule, index) => {
    if (!selected.has(`${prefix}:${index}`)) return schedule;
    let changed = schedule;
    if (patch.targetId !== undefined && patch.targetId !== schedule.sequence.$sequence)
      changed = { ...changed, sequence: { $sequence: patch.targetId } };
    if (patch.startFrame !== undefined && patch.startFrame !== schedule.startFrame)
      changed = { ...changed, startFrame: patch.startFrame };
    if (patch.endFrame === null && schedule.endFrame !== undefined) {
      changed = { ...changed };
      delete changed.endFrame;
    } else if (
      patch.endFrame !== undefined &&
      patch.endFrame !== null &&
      patch.endFrame !== schedule.endFrame
    )
      changed = { ...changed, endFrame: patch.endFrame };
    return changed;
  });
  return result.every((schedule, index) => schedule === schedules[index]) ? schedules : result;
}

/**
 * 将画布入口编辑写回正式字段；批量连接仍保留每个独立调度及事件来源。
 * 非时间入口只接受 targetId，目标节点始终属于 address 指定的图。
 */
export function editGraphEntries(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  entryIds: readonly string[],
  patch: GraphEntryPatch,
): SkillDefinition {
  const graph = getEditableGraph(skill, address);
  const entries = new Map(
    listGraphEntryGroups(skill, address).flatMap(group =>
      group.entries.map(entry => [entry.id, entry] as const),
    ),
  );
  const selected = new Set(entryIds);
  for (const id of selected) {
    const entry = entries.get(id);
    if (entry === undefined) throw new Error(`graph has no entry '${id}'`);
    if (
      entry.startFrame === undefined &&
      (patch.startFrame !== undefined || patch.endFrame !== undefined)
    )
      throw new Error(`entry '${id}' does not have a time range`);
  }
  for (const [key, value] of [
    ['startFrame', patch.startFrame],
    ['endFrame', patch.endFrame],
  ] as const)
    if (
      value !== undefined &&
      !(key === 'endFrame' && value === null) &&
      (typeof value !== 'number' || !Number.isInteger(value) || value < 0)
    )
      throw new Error(`${key}: expected a non-negative integer`);
  if (patch.targetId !== undefined && patch.targetId !== null) requireNode(graph, patch.targetId);
  if (selected.size === 0) return skill;
  let changed = skill;
  if (address.kind === 'macro') {
    const macro = skill.actionGraph.macros[address.macroId]!;
    if (patch.targetId !== undefined && patch.targetId !== macro.entry.$sequence)
      changed = {
        ...skill,
        actionGraph: {
          ...skill.actionGraph,
          macros: {
            ...skill.actionGraph.macros,
            [address.macroId]: { ...macro, entry: { $sequence: patch.targetId } },
          },
        },
      };
  } else {
    const schedules = editSchedules(skill.scheduledSequences, 'timeline', selected, patch);
    if (schedules !== skill.scheduledSequences)
      changed = { ...changed, scheduledSequences: schedules };
    const handlers = skill.eventHandlers?.map((handler, index) => {
      const schedules = editSchedules(
        handler.scheduledSequences,
        `event:${index}`,
        selected,
        patch,
      );
      return schedules === handler.scheduledSequences
        ? handler
        : { ...handler, scheduledSequences: schedules };
    });
    if (handlers?.some((handler, index) => handler !== skill.eventHandlers![index]))
      changed = { ...changed, eventHandlers: handlers };
    const route = skill.switchToBuffCast;
    if (
      selected.has('switch') &&
      route !== undefined &&
      patch.targetId !== undefined &&
      patch.targetId !== route.sequence.$sequence
    )
      changed = {
        ...changed,
        switchToBuffCast: { ...route, sequence: { $sequence: patch.targetId } },
      };
  }
  return validateEditedSkill(changed);
}

function validateEditedSkill(skill: SkillDefinition): SkillDefinition {
  const issues = validateSkillDefinition(skill, `skill.${skill.key}`);
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  validateActionGraphOwner(skill, `skill.${skill.key}`);
  return skill;
}

function replaceSkillTimelineSchedules(
  skill: SkillDefinition,
  schedules: readonly ScheduledSequenceDefinition[],
): SkillDefinition {
  if (
    schedules.length === skill.scheduledSequences.length &&
    schedules.every((schedule, index) => schedule === skill.scheduledSequences[index])
  )
    return skill;
  return validateEditedSkill({ ...skill, scheduledSequences: schedules });
}

function requireTimelineScheduleIndex(skill: SkillDefinition, index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= skill.scheduledSequences.length)
    throw new Error(`timeline schedule index out of range: ${index}`);
}

/** 在配置末尾追加空目标调度，时间位置不改变源配置顺序。 */
export function addSkillTimelineSchedule(
  skill: SkillDefinition,
  startFrame: number,
): SkillDefinition {
  return replaceSkillTimelineSchedules(skill, [
    ...skill.scheduledSequences,
    { startFrame, sequence: { $sequence: null } },
  ]);
}

/** 复制一次调度调用并紧接原项插入；共享目标图和引用，不复制动作节点。 */
export function duplicateSkillTimelineSchedule(
  skill: SkillDefinition,
  index: number,
): SkillDefinition {
  requireTimelineScheduleIndex(skill, index);
  const schedules = [...skill.scheduledSequences];
  schedules.splice(index + 1, 0, { ...schedules[index]! });
  return replaceSkillTimelineSchedules(skill, schedules);
}

/** 移除一次调度调用；动作图、宏、其他入口与节点身份均保持原样。 */
export function removeSkillTimelineSchedule(
  skill: SkillDefinition,
  index: number,
): SkillDefinition {
  requireTimelineScheduleIndex(skill, index);
  return replaceSkillTimelineSchedules(
    skill,
    skill.scheduledSequences.filter((_, currentIndex) => currentIndex !== index),
  );
}

/** toIndex 是移动后的最终下标；保留其余调度的相对顺序，不按时间排序。 */
export function moveSkillTimelineSchedule(
  skill: SkillDefinition,
  fromIndex: number,
  toIndex: number,
): SkillDefinition {
  requireTimelineScheduleIndex(skill, fromIndex);
  requireTimelineScheduleIndex(skill, toIndex);
  if (fromIndex === toIndex) return skill;
  const schedules = [...skill.scheduledSequences];
  const [schedule] = schedules.splice(fromIndex, 1);
  schedules.splice(toIndex, 0, schedule!);
  return replaceSkillTimelineSchedules(skill, schedules);
}

/** 仅列出本图的控制出口；外部资源与宏身份映射不会被投影成本图连线。 */
export function listGraphPorts(node: ActionGraphNode): readonly GraphPort[] {
  // 结束时间线会同步终止本次执行，不存在可接续的控制出口。
  const ports: GraphPort[] =
    node.action.kind === 'finishTimeline'
      ? []
      : [{ path: ['next'], label: 'next', target: node.next }];
  if (node.action.kind === 'callMacro') return ports;
  const visit = (value: unknown, path: readonly string[]): void => {
    if (value === null || typeof value !== 'object' || Object.hasOwn(value, 'actionGraph')) return;
    if (Object.hasOwn(value, '$sequence')) {
      const reference = value as { readonly $sequence: string | null };
      ports.push({
        path: [...path, '$sequence'],
        label: path.slice(1).join('.') || '$sequence',
        target: reference.$sequence,
      });
      return;
    }
    for (const [key, child] of Object.entries(value))
      if (key !== 'nodeBindings') visit(child, [...path, key]);
  };
  visit(node.action, ['action']);
  // 正式条件动作允许省略 false 分支；画布仍需提供可连接的空出口。
  if (node.action.kind === 'conditional' && node.action.whenFalse === undefined)
    ports.push({
      path: ['action', 'whenFalse', '$sequence'],
      label: 'whenFalse',
      target: null,
    });
  return ports;
}

function requireNode(graph: ActionGraphDefinition, nodeId: string): ActionGraphNode {
  if (!Object.hasOwn(graph.nodes, nodeId)) throw new Error(`missing action graph node: ${nodeId}`);
  return graph.nodes[nodeId]!;
}

function samePath(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}

/** 路径必须先由端口枚举确认；可为合法的可选分支建立缺失父对象，不改动原定义。 */
function replaceAtPath(value: unknown, path: readonly string[], replacement: unknown): unknown {
  if (path.length === 0) return replacement;
  const [key, ...rest] = path;
  const record = (value === undefined ? {} : value) as Record<string, unknown>;
  const child = replaceAtPath(record[key!], rest, replacement);
  if (Array.isArray(value)) {
    const result = [...value];
    result[Number(key)] = child;
    return result;
  }
  return { ...record, [key!]: child };
}

export function setGraphConnection(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  path: readonly string[],
  targetId: string | null,
): SkillDefinition {
  const graph = getEditableGraph(skill, address);
  const node = requireNode(graph, nodeId);
  const port = listGraphPorts(node).find(candidate => samePath(candidate.path, path));
  if (port === undefined)
    throw new Error(`node '${nodeId}' has no control port '${path.join('.')}'`);
  if (targetId !== null) requireNode(graph, targetId);
  if (port.target === targetId) return skill;
  const changed = replaceAtPath(node, path, targetId) as ActionGraphNode;
  return updateSkillGraph(skill, address, current => ({
    ...current,
    nodes: { ...current.nodes, [nodeId]: changed },
  }));
}

function requireAction(action: unknown): ActionGraphStep {
  const issues = validateActionGraphStepDefinition(action, 'action');
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return action as ActionGraphStep;
}

export function replaceGraphNodeAction(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  action: unknown,
): SkillDefinition {
  const graph = getEditableGraph(skill, address);
  const node = requireNode(graph, nodeId);
  // 图数据引用由 updateSkillGraph 连同所属图一起校验，不能脱离图查找输入节点。
  const replacement = action as ActionGraphStep;
  if (replacement === node.action) return skill;
  return updateSkillGraph(skill, address, current => ({
    ...current,
    nodes: { ...current.nodes, [nodeId]: { ...node, action: replacement } },
  }));
}

/** 提取宏的 nodeBindings 保留运行身份，不能为新节点猜测身份或遗留失效映射。 */
function requireUnboundMacroStructure(skill: SkillDefinition, address: SkillGraphAddress): void {
  if (address.kind !== 'macro') return;
  const resource = skill.actionGraph;
  const graphs = [resource.main, ...Object.values(resource.macros).map(macro => macro.graph)];
  for (const graph of graphs)
    for (const node of Object.values(graph.nodes))
      if (
        node.action.kind === 'callMacro' &&
        node.action.macroId === address.macroId &&
        node.action.nodeBindings !== undefined
      )
        throw new Error(
          `macro '${address.macroId}' has nodeBindings; adding or removing its nodes requires an explicit identity mapping`,
        );
}

export function addGraphNode(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  action: unknown,
): SkillDefinition {
  const graph = getEditableGraph(skill, address);
  if (!nodeId) throw new Error('action graph node identity must not be empty');
  if (Object.hasOwn(graph.nodes, nodeId))
    throw new Error(`action graph node already exists: ${nodeId}`);
  requireUnboundMacroStructure(skill, address);
  const replacement = requireAction(action);
  return updateSkillGraph(skill, address, current => ({
    ...current,
    nodes: { ...current.nodes, [nodeId]: { action: replacement, next: null } },
  }));
}

function disconnectReferences(value: unknown, nodeId: string): unknown {
  if (value === null || typeof value !== 'object' || Object.hasOwn(value, 'actionGraph'))
    return value;
  if (Object.hasOwn(value, '$sequence')) {
    const reference = value as { readonly $sequence: string | null };
    return reference.$sequence === nodeId ? { ...reference, $sequence: null } : value;
  }
  let result = value;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'nodeBindings') continue;
    const changed = disconnectReferences(child, nodeId);
    if (changed !== child) result = replaceAtPath(result, [key], changed) as object;
  }
  return result;
}

/** 删除只断开引用，不把入口或分支偷偷改接到 next；独立资源中的同名节点保持不变。 */
export function removeGraphNode(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
): SkillDefinition {
  const graph = getEditableGraph(skill, address);
  requireNode(graph, nodeId);
  requireUnboundMacroStructure(skill, address);
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes)
      .filter(([id]) => id !== nodeId)
      .map(([id, node]) => {
        let changed = node;
        for (const port of listGraphPorts(node))
          if (port.target === nodeId)
            changed = replaceAtPath(changed, port.path, null) as ActionGraphNode;
        return [id, changed];
      }),
  );
  let withEntries = skill;
  if (address.kind === 'main') {
    for (const [key, value] of Object.entries(skill)) {
      if (key === 'actionGraph') continue;
      const changed = disconnectReferences(value, nodeId);
      if (changed !== value) withEntries = { ...withEntries, [key]: changed };
    }
  } else {
    const macro = skill.actionGraph.macros[address.macroId]!;
    if (macro.entry.$sequence === nodeId)
      withEntries = {
        ...skill,
        actionGraph: {
          ...skill.actionGraph,
          macros: {
            ...skill.actionGraph.macros,
            [address.macroId]: { ...macro, entry: { $sequence: null } },
          },
        },
      };
  }
  return updateSkillGraph(withEntries, address, () => ({ ...graph, nodes }));
}
