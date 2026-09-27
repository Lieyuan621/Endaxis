/** 正式动作图的不可变编辑；节点身份、宏和独立资源边界与运行时共用同一契约。 */
import type {
  ActionGraphDefinition,
  ActionGraphNode,
} from '../../../packages/game-data-contract/src/actionGraph';
import { validateActionGraphOwner } from '../../core/action-graph/actionGraphValidation';
import type { ScheduledSequenceDefinition } from '../../../packages/game-data-contract/src/actions';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';
import type { SkillGraphAddress } from './skillGraphCommands';
export { listGraphPorts } from './actionGraphPorts';
export type { GraphPort } from './actionGraphPorts';
import {
  resourceGraph,
  connectResourceNode,
  replaceResourceNodeAction,
  addResourceNode,
  removeResourceNode,
} from './actionGraphResourceEditing';

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
  return resourceGraph(skill, address);
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

function requireNode(graph: ActionGraphDefinition, nodeId: string): ActionGraphNode {
  if (!Object.hasOwn(graph.nodes, nodeId)) throw new Error(`missing action graph node: ${nodeId}`);
  return graph.nodes[nodeId]!;
}

export function setGraphConnection(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  path: readonly string[],
  targetId: string | null,
): SkillDefinition {
  const changed = connectResourceNode(skill, address, nodeId, path, targetId);
  return changed === skill ? skill : validateEditedSkill(changed);
}

export function replaceGraphNodeAction(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  action: unknown,
): SkillDefinition {
  const changed = replaceResourceNodeAction(skill, address, nodeId, action);
  return changed === skill ? skill : validateEditedSkill(changed);
}

export function addGraphNode(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
  action: unknown,
): SkillDefinition {
  return validateEditedSkill(addResourceNode(skill, address, nodeId, action));
}

/** 删除只断开引用，不把入口或分支偷偷改接到 next；独立资源中的同名节点保持不变。 */
export function removeGraphNode(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  nodeId: string,
): SkillDefinition {
  return validateEditedSkill(removeResourceNode(skill, address, nodeId));
}
