import type { SkillDefinition } from '../../../../../packages/game-data-contract/src/skills.ts';
/**
 * 三块树分析/优化的图侧对应，与 graphSequenceOptimization.ts 并列：
 *
 * - pruneUnusedGraphSkillValues ↔ skillValueOptimization.ts 的 pruneUnusedSkillValues：
 *   删除技能黑板中无读取者的初始值声明/写入步骤。用途收集与删除判定改为图遍历
 *   （沿 next 与全部 $sequence 引用，visited 防环，共享子图只统计一次）。裁剪发生在宏提取
 *   之前，图中尚无 callMacro；防御性遇到时保守标成未知访问。删除写入在共享 DAG 上全局安全：
 *   只裁剪整个资源（该定义主图）内无读取的键，前驱 next 与入口/字段引用 copy-on-write
 *   重接到下一个幸存节点，所有共享该节点的引用方看到同一份结果，最后剔除不可达节点。
 *   retainedLifetimePaths（"序列留一命"）语义保留：一条引用的整条链都被删除时保留首节点。
 *   报告坐标从 path.steps[i] 改为节点 id 链：`scheduledSequences[0].sequence→modifyActionValue_1`。
 *
 * - createGraphEntityUsageContext / collectGraphSharedEntityValueUsage /
 *   createGraphSharedEntityValueUsageCollector ↔ definitionEntityUsageContext.ts：
 *   收集能力实体/子技能对黑板与 Buff 的跨定义用途。图版入口遍历
 *   OperatorDefinition 的 abilityEntityDefinitions、各技能/被动/养成/
 *   连携条件自己的 actionGraph，以及携带 actionGraph 的 Buff 与装备贡献。
 *
 * - pruneUnusedGraphEquipmentContributionBlackboard ↔ equipmentValueOptimization.ts：
 *   只删除装备黑板初值，用途按 enableSequence/initializationSequence/eventHandlers 的图遍历汇总。
 */
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import type { CombatStepDefinition } from '../../../../../packages/game-data-contract/src/actions.ts';
import type { OperatorBuffDefinitions } from '../../../../../packages/game-data-contract/src/buffs.ts';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type {
  EquipmentContributionDefinition,
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import type {
  OperatorDefinition,
  OperatorPassiveSkillDefinition,
  OperatorUpgradeDefinition,
} from '../../../../../packages/game-data-contract/src/operators.ts';
import type {
  AbilityEntityDefinition,
  OperatorAbilityEntityDefinitions,
} from '../../../../../packages/game-data-contract/src/skills.ts';

import {
  actionValueUsage,
  analyzeConditionUsage,
  analyzeStepUsage,
  mergeDefinitionValueUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from './definitionUsageAnalysis.ts';
import type { DefinitionOptimizationMode } from './definitionOptimization.ts';
import type { SkillValueOptimizationReport } from './skillValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './equipmentValueOptimization.ts';
import { analyzeGraphSequenceUsage } from './graphSequenceOptimization.ts';
import {
  analyzeGraphBuffDefinitionUsage,
  graphBuffPrograms,
} from '../buffs/graphBuffValueUsage.ts';

const EMPTY_USAGE: DefinitionValueUsage = {
  reads: new Set(),
  writes: new Set(),
  externalReads: [],
  unknownAccess: false,
  mayThrow: false,
  observable: false,
};

function isGraphReference(value: unknown): value is ActionGraphReference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== '$sequence') return false;
  const target = (value as ActionGraphReference).$sequence;
  return typeof target === 'string' || target === null;
}

/** 与 graphSequenceOptimization 的 scanStepReferences 同一规则：深遍历动作字段中的 $sequence 引用。 */
function scanGraphReferences(
  value: unknown,
  visit: (reference: ActionGraphReference) => void,
): void {
  if (value && typeof value === 'object' && 'actionGraph' in value) return;
  if (Array.isArray(value)) {
    value.forEach(item => scanGraphReferences(item, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'nodeBindings') continue;
    if (key === '$sequence' && (typeof item === 'string' || item === null))
      visit({ $sequence: item });
    else scanGraphReferences(item, visit);
  }
}

/** 从入口沿 next 与动作内 $sequence 引用走访每个可达节点一次；供收集器发现内联实体定义。 */
function walkGraphActions(
  graph: ActionGraphDefinition,
  entry: ActionGraphReference,
  visit: (action: ActionGraphStep) => void,
): void {
  const visited = new Set<string>();
  const walk = (reference: ActionGraphReference): void => {
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (visited.has(cursor)) return;
      visited.add(cursor);
      const node = graph.nodes[cursor];
      if (!node) return;
      visit(node.action);
      scanGraphReferences(node.action, walk);
      cursor = node.next;
    }
  };
  walk(entry);
}

// ---------------------------------------------------------------------------
// 技能黑板与算术写入裁剪（图版）
// ---------------------------------------------------------------------------

interface GraphWriteCandidate {
  readonly nodeId: string;
  readonly path: string;
  readonly key: string;
  readonly usage: DefinitionValueUsage;
}

/**
 * 删除图形态技能程序中无人使用的算术写入节点和黑板初值。
 * 入口与树版 mapRoots 一致：scheduledSequences、eventHandlers、switchToBuffCast，
 * 以及 availability/switchToBuffCast/eventHandlers 条件。
 */
export function pruneUnusedGraphSkillValues(
  skill: SkillDefinition,
  protectedKeys: ReadonlySet<string> = new Set(),
  usageContext?: DefinitionUsageContext,
): {
  readonly skill: SkillDefinition;
  readonly report: SkillValueOptimizationReport;
} {
  const graph = skill.actionGraph.main;
  const live = new Set([...protectedKeys, NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY]);
  const candidates: GraphWriteCandidate[] = [];
  const candidateByNode = new Map<string, GraphWriteCandidate>();
  const initial = skill.blackboard ?? {};
  let unresolvedAccess = false;
  const observe = (usage: DefinitionValueUsage) => {
    usage.reads.forEach(key => live.add(key));
    // 非算术动作的写入可能参与其返回值或与事件一起被观察，首批不删除其初始化。
    usage.writes.forEach(key => live.add(key));
    unresolvedAccess ||= usage.unknownAccess;
  };
  const visited = new Set<string>();
  /** 全图所有序列位置（入口引用与动作内 $sequence 字段），供"序列留一命"判定。 */
  const positions: { readonly reference: ActionGraphReference; readonly path: string }[] = [];
  const collectReference = (reference: ActionGraphReference, path: string): void => {
    positions.push({ reference, path });
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const node = graph.nodes[cursor];
      if (!node) break;
      collectAction(node.action, `${path}→${cursor}`, cursor);
      cursor = node.next;
    }
  };
  const collectAction = (action: ActionGraphStep, path: string, nodeId: string): void => {
    switch (action.kind) {
      case 'modifyActionValue':
      case 'calculateActionValue': {
        // 图节点的叶动作形态与树相同，直接复用逐步用途分析。
        const usage = analyzeStepUsage(action as unknown as CombatStepDefinition, usageContext);
        const candidate: GraphWriteCandidate = {
          nodeId,
          path,
          key: action.parameters.key,
          usage,
        };
        candidates.push(candidate);
        candidateByNode.set(nodeId, candidate);
        const operands =
          action.kind === 'modifyActionValue'
            ? [action.parameters.value]
            : [action.parameters.left, action.parameters.right];
        const canResolveInputs = operands.every(
          operand =>
            operand.kind === 'constant' ||
            (operand.kind === 'blackboard' &&
              (operand.fallback !== undefined || Object.hasOwn(initial, operand.key))),
        );
        // EntityBB_ 是原生动态写入路由，不是对象特例；它可能被同一实体的其他技能读取。
        if (
          action.key !== undefined ||
          action.parameters.key.startsWith('EntityBB_') ||
          protectedKeys.has(action.parameters.key) ||
          !canResolveInputs
        ) {
          live.add(action.parameters.key);
        }
        return;
      }
      case 'conditional':
        observe(analyzeConditionUsage(action.parameters.condition));
        collectReference(action.whenTrue, `${path}.whenTrue`);
        if (action.whenFalse !== undefined) collectReference(action.whenFalse, `${path}.whenFalse`);
        return;
      case 'switch':
        observe(
          mergeDefinitionValueUsage([
            actionValueUsage(action.parameters.choice),
            ...action.options.map(option => actionValueUsage(option.value)),
          ]),
        );
        action.options.forEach((option, optionIndex) =>
          collectReference(option.sequence, `${path}.options[${optionIndex}].sequence`),
        );
        return;
      case 'once':
      case 'repeatEachTick':
      case 'forEachContextTarget':
        collectReference(action.body, `${path}.body`);
        return;
      case 'repeatByActionValue':
        observe(actionValueUsage(action.parameters.count));
        collectReference(action.body, `${path}.body`);
        return;
      case 'withActionBlackboardScope':
        // 与树版一致：整个子作用域按 analyzeStepUsage 汇总（body 内写入不是候选，不能删），
        // 父快照会覆盖子 initialValues，同一 scopeKey 还可能复用其他入口先创建的板。
        // entityAssignments 的值操作数在父板上求值，必须与 body 一样计入父板读取；
        // initialValues/entityInitialValues 是子板初值，不是父板读取。
        observe(
          mergeDefinitionValueUsage([
            analyzeGraphSequenceUsage(graph, action.body, usageContext),
            ...Object.values(action.parameters.entityAssignments ?? {}).map(actionValueUsage),
          ]),
        );
        return;
      case 'listenForCombatEvents':
        action.parameters.responses.forEach((response, responseIndex) => {
          if (response.condition !== undefined) observe(analyzeConditionUsage(response.condition));
          collectReference(
            response.sequence,
            `${path}.parameters.responses[${responseIndex}].sequence`,
          );
        });
        return;
      case 'launchProjectile':
        // 回调沿自己的图分析；回调 direct 板继承创建时父快照，回调体读取上传为父板读取。
        observe(
          mergeDefinitionValueUsage(
            action.callbacks.flatMap(callback =>
              callback.skill.scheduledSequences.map(item =>
                analyzeGraphSequenceUsage(
                  callback.skill.actionGraph.main,
                  item.sequence,
                  usageContext,
                ),
              ),
            ),
          ),
        );
        return;
      case 'callResource':
      case 'callMacro':
        // 裁剪早于宏提取，正常不会出现；防御性保守标成未知访问。
        observe({ ...EMPTY_USAGE, unknownAccess: true, mayThrow: true, observable: true });
        return;
      default:
        observe(analyzeStepUsage(action as unknown as CombatStepDefinition, usageContext));
    }
  };
  if (skill.availability !== undefined) observe(analyzeConditionUsage(skill.availability));
  if (skill.switchToBuffCast?.condition !== undefined)
    observe(analyzeConditionUsage(skill.switchToBuffCast.condition));
  skill.eventHandlers?.forEach(handler => {
    if (handler.condition !== undefined) observe(analyzeConditionUsage(handler.condition));
  });
  skill.scheduledSequences.forEach((item, index) =>
    collectReference(item.sequence, `scheduledSequences[${index}].sequence`),
  );
  skill.eventHandlers?.forEach((handler, handlerIndex) =>
    handler.scheduledSequences.forEach((item, index) =>
      collectReference(
        item.sequence,
        `eventHandlers[${handlerIndex}].scheduledSequences[${index}].sequence`,
      ),
    ),
  );
  if (skill.switchToBuffCast !== undefined)
    collectReference(skill.switchToBuffCast.sequence, 'switchToBuffCast.sequence');
  const skillId = skill.key;
  if (unresolvedAccess)
    return {
      skill,
      report: {
        skillId,
        removedWrites: [],
        removedInitialKeys: [],
        retainedLifetimePaths: [],
        retainedReason: 'unresolved-blackboard-access',
      },
    };
  const retainInputs = () => {
    let changed: boolean;
    do {
      changed = false;
      for (const candidate of candidates) {
        if (!live.has(candidate.key)) continue;
        for (const key of candidate.usage.reads) {
          if (!live.has(key)) {
            live.add(key);
            changed = true;
          }
        }
      }
    } while (changed);
  };
  retainInputs();
  /** 沿 next 收集链节点；成环或节点缺失时停止（成环节点保守不再全删，由留一命兜底）。 */
  const chainFrom = (start: string): string[] => {
    const ids: string[] = [];
    const seen = new Set<string>();
    let cursor: string | null = start;
    while (cursor !== null && !seen.has(cursor)) {
      seen.add(cursor);
      const node: ActionGraphNode | undefined = graph.nodes[cursor];
      if (!node) break;
      ids.push(cursor);
      cursor = node.next;
    }
    return ids;
  };
  // 若删空某条引用链，先把其首节点及输入加回保留集合，与树版一样迭代到不动点，
  // 不能留下新的缺键读取，也不能改变重复执行的返回值。
  const retainedLifetimePaths = new Set<string>();
  let deletable = new Set<string>();
  let retained: boolean;
  do {
    retained = false;
    deletable = new Set(
      candidates.filter(candidate => !live.has(candidate.key)).map(candidate => candidate.nodeId),
    );
    for (const { reference, path } of positions) {
      if (reference.$sequence === null) continue;
      const chain = chainFrom(reference.$sequence);
      if (chain.length === 0 || !chain.every(id => deletable.has(id))) continue;
      const first = candidateByNode.get(chain[0]!);
      if (first === undefined || live.has(first.key)) continue;
      live.add(first.key);
      retainedLifetimePaths.add(`${path}→${chain[0]}`);
      retained = true;
    }
    if (retained) retainInputs();
  } while (retained);
  /** 跳过连续的被删节点，返回下一个幸存节点；留一命保证被保留引用的结果不为 null。 */
  const skip = (start: string): string | null => {
    const seen = new Set<string>();
    let cursor: string | null = start;
    while (cursor !== null && deletable.has(cursor)) {
      if (seen.has(cursor)) return null;
      seen.add(cursor);
      cursor = graph.nodes[cursor]?.next ?? null;
    }
    return cursor;
  };
  const remapReference = (reference: ActionGraphReference): ActionGraphReference =>
    reference.$sequence !== null && deletable.has(reference.$sequence)
      ? { $sequence: skip(reference.$sequence) }
      : reference;
  const remapValue = (value: unknown): unknown => {
    if (value && typeof value === 'object' && 'actionGraph' in value) return value;
    if (Array.isArray(value)) {
      const mapped = value.map(remapValue);
      return mapped.every((item, index) => item === value[index]) ? value : mapped;
    }
    if (isGraphReference(value)) return remapReference(value);
    if (!value || typeof value !== 'object') return value;
    const entries = Object.entries(value).map(([key, item]) => [key, remapValue(item)] as const);
    return entries.every(([key, item]) => item === (value as Record<string, unknown>)[key])
      ? value
      : Object.fromEntries(entries);
  };
  const removedWrites = candidates
    .filter(candidate => deletable.has(candidate.nodeId))
    .map(candidate => ({ path: candidate.path, key: candidate.key }));
  const nextNodes: Record<string, ActionGraphNode> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (deletable.has(id)) continue;
    const next = node.next !== null && deletable.has(node.next) ? skip(node.next) : node.next;
    const action = remapValue(node.action) as ActionGraphStep;
    nextNodes[id] = next === node.next && action === node.action ? node : { action, next };
  }
  const mapScheduled = <T extends { readonly sequence: ActionGraphReference }>(
    items: readonly T[],
  ): T[] =>
    items.map(item => {
      const sequence = remapReference(item.sequence);
      return sequence === item.sequence ? item : { ...item, sequence };
    });
  const roots: ActionGraphReference[] = [];
  const result: SkillDefinition = {
    ...skill,
    scheduledSequences: mapScheduled(skill.scheduledSequences).map((item, index) => {
      roots.push(item.sequence);
      void index;
      return item;
    }),
    ...(skill.eventHandlers === undefined
      ? {}
      : {
          eventHandlers: skill.eventHandlers.map(handler => ({
            ...handler,
            scheduledSequences: mapScheduled(handler.scheduledSequences).map(item => {
              roots.push(item.sequence);
              return item;
            }),
          })),
        }),
    ...(skill.switchToBuffCast === undefined
      ? {}
      : {
          switchToBuffCast: (() => {
            const sequence = remapReference(skill.switchToBuffCast.sequence);
            roots.push(sequence);
            return sequence === skill.switchToBuffCast.sequence
              ? skill.switchToBuffCast
              : { ...skill.switchToBuffCast, sequence };
          })(),
        }),
    actionGraph: { ...skill.actionGraph, main: { nodes: nextNodes } },
  };
  // 删除节点后，从全部入口做可达性收集，未被任何入口或引用到达的节点从新 nodes 表剔除。
  const reachable = new Set<string>();
  const visitReference = (reference: ActionGraphReference): void => {
    let cursor = reference.$sequence;
    while (cursor !== null) {
      if (reachable.has(cursor)) return;
      reachable.add(cursor);
      const node = nextNodes[cursor];
      if (!node) return;
      scanGraphReferences(node.action, visitReference);
      cursor = node.next;
    }
  };
  roots.forEach(visitReference);
  for (const id of Object.keys(nextNodes)) if (!reachable.has(id)) delete nextNodes[id];
  const removedInitialKeys = Object.keys(initial).filter(
    key => !live.has(key) && !key.startsWith('EntityBB_'),
  );
  let output = result;
  if (removedInitialKeys.length > 0) {
    const removed = new Set(removedInitialKeys);
    output = {
      ...result,
      blackboard: Object.fromEntries(Object.entries(initial).filter(([key]) => !removed.has(key))),
    };
  }
  return {
    skill: removedWrites.length === 0 && removedInitialKeys.length === 0 ? skill : output,
    report: {
      skillId,
      removedWrites,
      removedInitialKeys,
      retainedLifetimePaths: [...retainedLifetimePaths],
    },
  };
}

// ---------------------------------------------------------------------------
// 装备黑板初值裁剪（图版）
// ---------------------------------------------------------------------------

/** 只删除初值，不移除写入或入口；空程序仍保留原有装备宿主和注册行为。 */
export function pruneUnusedGraphEquipmentContributionBlackboard(
  value: EquipmentContributionDefinition,
  options: {
    readonly mode: DefinitionOptimizationMode;
    readonly definitionId: string;
    readonly path: string;
  },
): {
  readonly contribution: EquipmentContributionDefinition;
  readonly report: EquipmentValueOptimizationReport;
} {
  const report = { definitionId: options.definitionId, path: options.path };
  if (options.mode === 'off') {
    return {
      contribution: value,
      report: { ...report, removedInitialKeys: [], retainedReason: 'optimization-disabled' },
    };
  }
  const graph = value.actionGraph?.main;
  // 程序引用存在却找不到图时是残缺输入；保守标成未知访问，不按空程序裁剪。
  const program = (reference: ActionGraphReference): DefinitionValueUsage =>
    graph === undefined
      ? { ...EMPTY_USAGE, unknownAccess: true, mayThrow: true }
      : analyzeGraphSequenceUsage(graph, reference);
  const usage = mergeDefinitionValueUsage([
    ...(value.enableSequence === undefined ? [] : [program(value.enableSequence)]),
    ...(value.initializationSequence === undefined ? [] : [program(value.initializationSequence)]),
    ...(value.eventHandlers?.flatMap(handler => [
      ...(handler.condition === undefined ? [] : [analyzeConditionUsage(handler.condition)]),
      program(handler.sequence),
    ]) ?? []),
  ]);
  if (usage.unknownAccess) {
    return {
      contribution: value,
      report: { ...report, removedInitialKeys: [], retainedReason: 'unresolved-blackboard-access' },
    };
  }
  const { blackboard, ...contribution } = value;
  // 数值写入会用旧值进行 epsilon 比较；即使没有后续显式读取，也不能删除目的键初值。
  const isUsed = (key: string) => usage.reads.has(key) || usage.writes.has(key);
  const remaining = Object.entries(blackboard ?? {}).filter(([key]) => isUsed(key));
  const removedInitialKeys = Object.keys(blackboard ?? {}).filter(key => !isUsed(key));
  return {
    contribution:
      blackboard === undefined
        ? value
        : remaining.length === 0
          ? contribution
          : removedInitialKeys.length === 0
            ? value
            : { ...contribution, blackboard: Object.fromEntries(remaining) },
    report: {
      ...report,
      removedInitialKeys,
      ...(remaining.length === 0 ? {} : { retainedReason: 'runtime-value-access' }),
    },
  };
}

// ---------------------------------------------------------------------------
// 跨实体用途上下文（图版）
// ---------------------------------------------------------------------------

/** 一段不隶属于任何定义的独立图程序入口（机制序列等）；图与入口必须成对提供。 */
export interface GraphSequenceSource {
  readonly graph: ActionGraphDefinition;
  readonly entry: ActionGraphReference;
}

/** 所有实体都必须保留的外部用途。与树版一致，首版不缩小 Buff 目标，允许多保留键。 */
export interface GraphSharedEntityValueUsage {
  readonly reads: ReadonlySet<string>;
  readonly unknownAccess: boolean;
  readonly commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions;
}

/** 与 SharedEntityValueUsageInput 相同的域划分；序列改为图入口，装备/Buff/干员为图形态。 */
export interface GraphSharedEntityValueUsageInput {
  readonly operators: readonly OperatorDefinition[];
  readonly commonBuffDefinitions: OperatorBuffDefinitions;
  readonly commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions;
  readonly weapons: readonly WeaponDefinition[];
  readonly gears: readonly GearDefinition[];
  readonly gearSets: readonly GearSetDefinition[];
  readonly mechanicBuffDefinitions: OperatorBuffDefinitions;
  readonly mechanicSequences: readonly GraphSequenceSource[];
}

/** 与 SharedEntityValueUsageCollector 相同的分阶段契约；finish 后拒绝新增用途。 */
export interface GraphSharedEntityValueUsageCollector {
  addOperator(operator: OperatorDefinition): void;
  /** 公共、私有和机制 Buff 均按相同规则处理。 */
  addBuffDefinitions(definitions: OperatorBuffDefinitions): void;
  addWeapon(weapon: WeaponDefinition): void;
  addGear(gear: GearDefinition): void;
  addGearSet(gearSet: GearSetDefinition): void;
  addSequence(source: GraphSequenceSource): void;
  /** 合并其他阶段的摘要，必须引用创建本收集器时的同一个公共实体目录对象。 */
  addUsage(usage: GraphSharedEntityValueUsage): void;
  /** 返回最终摘要，之后拒绝新增用途，避免优化上下文漏掉迟来的读取或未知访问。 */
  finish(): GraphSharedEntityValueUsage;
}

const empty = () => mergeDefinitionValueUsage([]);

/**
 * snapshot 只复制 direct 层，不枚举后备实体板。收集后备板读取时，不把这种传出误报为
 * "读取全部宿主键"；显式赋值操作数和回调的实际读取仍由公共用途分析器汇总。
 */
const fallbackContext: DefinitionUsageContext = { inheritedAbilityEntityUsage: empty };

export function collectGraphSharedEntityValueUsage(
  input: GraphSharedEntityValueUsageInput,
): GraphSharedEntityValueUsage {
  const collector = createGraphSharedEntityValueUsageCollector(
    input.commonAbilityEntityDefinitions,
  );
  input.operators.forEach(collector.addOperator);
  collector.addBuffDefinitions(input.commonBuffDefinitions);
  input.weapons.forEach(collector.addWeapon);
  input.gears.forEach(collector.addGear);
  input.gearSets.forEach(collector.addGearSet);
  collector.addBuffDefinitions(input.mechanicBuffDefinitions);
  input.mechanicSequences.forEach(collector.addSequence);
  return collector.finish();
}

type GraphAbilityEntity = AbilityEntityDefinition | AbilityEntityDefinition;

/** 只强引用读键和公共实体目录；用于去重的 WeakSet/WeakMap 不阻止调用方释放已分析的定义。 */
export function createGraphSharedEntityValueUsageCollector(
  commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions,
): GraphSharedEntityValueUsageCollector {
  const reads = new Set<string>();
  let unknownAccess = false;
  let result: GraphSharedEntityValueUsage | undefined;
  const requireOpen = () => {
    if (result !== undefined) throw new Error('entity value usage collection is already finished');
  };
  const observedSequences = new WeakMap<ActionGraphDefinition, WeakSet<ActionGraphReference>>();
  const observedBuffs = new WeakSet<object>();
  const observedEntities = new WeakSet<object>();
  const observe = (usage: DefinitionValueUsage, includeCurrent = false) => {
    if (includeCurrent) {
      usage.reads.forEach(key => reads.add(key));
      usage.writes.forEach(key => reads.add(key));
    }
    // Buff 查询当前返回 direct 快照。仍保守纳入这些键，避免缩小其宿主/来源关系。
    usage.externalReads.forEach(read => reads.add(read.key));
    unknownAccess ||= usage.unknownAccess;
  };
  const condition = (value: Parameters<typeof analyzeConditionUsage>[0] | undefined) => {
    if (value !== undefined) observe(analyzeConditionUsage(value));
  };
  const sequence = (source: GraphSequenceSource) => {
    let seen = observedSequences.get(source.graph);
    if (seen === undefined) {
      seen = new WeakSet();
      observedSequences.set(source.graph, seen);
    }
    if (seen.has(source.entry)) return;
    seen.add(source.entry);
    observe(analyzeGraphSequenceUsage(source.graph, source.entry, fallbackContext));
    walkGraphActions(source.graph, source.entry, action => {
      if (action.kind === 'spawnAbilityEntity' && action.parameters.definition !== undefined)
        entity(action.parameters.definition as GraphAbilityEntity);
    });
  };
  /** 程序引用存在却找不到所属图时是残缺输入；保守标成未知访问。 */
  const program = (
    graph: ActionGraphDefinition | undefined,
    reference: ActionGraphReference | undefined,
  ) => {
    if (reference === undefined) return;
    if (graph === undefined) {
      unknownAccess = true;
      return;
    }
    sequence({ graph, entry: reference });
  };
  const buff = (value: OperatorBuffDefinitions[string]) => {
    if (observedBuffs.has(value)) return;
    observedBuffs.add(value);
    observe(analyzeGraphBuffDefinitionUsage(value, fallbackContext), true);
    const { graph, entries } = graphBuffPrograms(value);
    entries.forEach(entry => program(graph, entry));
  };
  const entity = (value: GraphAbilityEntity) => {
    if (observedEntities.has(value)) return;
    observedEntities.add(value);
    value.childSkill?.scheduledSequences.forEach(item =>
      program(value.childSkill!.actionGraph.main, item.sequence),
    );
    Object.values(value.childSkills ?? {}).forEach(child =>
      child.scheduledSequences.forEach(item => program(child.actionGraph.main, item.sequence)),
    );
    value.passiveSkills?.forEach(passive => {
      program(passive.actionGraph.main, passive.enableSequence);
      passive.abilityEventResponses?.forEach(response =>
        program(passive.actionGraph.main, response.sequence),
      );
    });
  };
  const passive = (value: OperatorPassiveSkillDefinition) => {
    const graph = value.actionGraph?.main;
    program(graph, value.enableSequence);
    value.abilityEventResponses?.forEach(response => program(graph, response.sequence));
  };
  const skill = (value: SkillDefinition) => {
    const graph = value.actionGraph.main;
    condition(value.availability);
    value.scheduledSequences.forEach(item => sequence({ graph, entry: item.sequence }));
    if (value.switchToBuffCast !== undefined) {
      condition(value.switchToBuffCast.condition);
      sequence({ graph, entry: value.switchToBuffCast.sequence });
    }
    value.eventHandlers?.forEach(handler => {
      condition(handler.condition);
      handler.scheduledSequences.forEach(item => sequence({ graph, entry: item.sequence }));
    });
  };
  const skills = (values: SkillDefinition | readonly SkillDefinition[]) => {
    if ('key' in values) skill(values);
    else values.forEach(skill);
  };
  const upgrade = (value: OperatorUpgradeDefinition) => {
    const graph = value.actionGraph?.main;
    program(graph, value.initializationSequence);
    value.eventHandlers?.forEach(handler => program(graph, handler.sequence));
    value.passiveSkills?.forEach(item => passive(item));
  };
  const contribution = (value: EquipmentContributionDefinition) => {
    const graph = value.actionGraph?.main;
    program(graph, value.enableSequence);
    program(graph, value.initializationSequence);
    value.eventHandlers?.forEach(handler => {
      condition(handler.condition);
      program(graph, handler.sequence);
    });
  };
  const operator = (value: OperatorDefinition) => {
    value.skillGroups.forEach(group => {
      skills(group.skills);
      group.variants?.forEach(variant => skills(variant.skills));
      group.replacementSkills?.forEach(skill);
      group.routedReplacementSkills?.forEach(route => skill(route.skill));
    });
    value.talents.forEach(upgrade);
    value.potentials.forEach(upgrade);
    value.passiveSkills?.forEach(item => passive(item));
    // 图形态干员的顶级 eventHandlers 没有独立图宿主（渲染期禁止残留）；残缺输入保守处理。
    value.eventHandlers?.forEach(() => {
      unknownAccess = true;
    });
    value.comboSkillConditions?.forEach(item => {
      program(item.actionGraph?.main, item.sequence);
    });
    Object.values(value.buffDefinitions ?? {}).forEach(buff);
    Object.values(value.abilityEntityDefinitions ?? {}).forEach(item => entity(item));
  };
  Object.values(commonAbilityEntityDefinitions).forEach(item => entity(item));
  return {
    addOperator(value) {
      requireOpen();
      operator(value);
    },
    addBuffDefinitions(definitions) {
      requireOpen();
      Object.values(definitions).forEach(buff);
    },
    addWeapon(weapon) {
      requireOpen();
      weapon.traits.forEach(contribution);
      Object.values(weapon.buffDefinitions ?? {}).forEach(buff);
    },
    addGear(_gear) {
      requireOpen();
      // EquipTable 装备只有静态词条，没有动作程序或实体值读取。
    },
    addGearSet(gearSet) {
      requireOpen();
      contribution(gearSet);
      Object.values(gearSet.buffDefinitions ?? {}).forEach(buff);
    },
    addSequence(value) {
      requireOpen();
      sequence(value);
    },
    addUsage(usage) {
      requireOpen();
      if (usage.commonAbilityEntityDefinitions !== commonAbilityEntityDefinitions)
        throw new Error('entity value usage summaries must share the same common entity catalog');
      usage.reads.forEach(key => reads.add(key));
      unknownAccess ||= usage.unknownAccess;
    },
    finish() {
      result ??= { reads, unknownAccess, commonAbilityEntityDefinitions };
      return result;
    },
  };
}

/**
 * 未提供整批共享用途时不开启实体精确传值；循环或缺失接收方同样返回未知。
 * 每个子技能与被动技能只分析自己的图，禁止回退到生成实体的技能图。
 */
export function createGraphEntityUsageContext(
  definitions: OperatorAbilityEntityDefinitions | undefined,
  shared: GraphSharedEntityValueUsage | undefined,
): DefinitionUsageContext | undefined {
  if (shared === undefined) return undefined;
  const cache = new WeakMap<GraphAbilityEntity, DefinitionValueUsage>();
  const visiting = new WeakSet<GraphAbilityEntity>();
  const sharedUsage: DefinitionValueUsage = {
    ...empty(),
    reads: shared.reads,
    unknownAccess: shared.unknownAccess,
  };
  const unresolved = (): DefinitionValueUsage => ({ ...empty(), unknownAccess: true });
  const context: DefinitionUsageContext = {
    inheritedAbilityEntityUsage(step) {
      const id = step.parameters.abilityEntityId;
      const inline = step.parameters.definition as GraphAbilityEntity | undefined;
      const definition = inline ?? definitions?.[id] ?? shared.commonAbilityEntityDefinitions[id];
      if (definition === undefined || visiting.has(definition)) return unresolved();
      const previous = cache.get(definition);
      if (previous !== undefined) return previous;
      visiting.add(definition);
      try {
        const usages = [sharedUsage];
        const number = (value: AbilityEntityDefinition['maxStackingCount']) => {
          if (typeof value === 'object')
            usages.push(
              actionValueUsage({
                kind: 'blackboard',
                key: value.blackboardKey,
                fallback: value.fallback,
              }),
            );
        };
        if (definition.lifetime.kind === 'limited') number(definition.lifetime.durationSeconds);
        number(definition.maxStackingCount);
        const program = (
          graph: ActionGraphDefinition,
          reference: ActionGraphReference,
        ): DefinitionValueUsage => analyzeGraphSequenceUsage(graph, reference, context);
        definition.childSkill?.scheduledSequences.forEach(item =>
          usages.push(program(definition.childSkill!.actionGraph.main, item.sequence)),
        );
        Object.values(definition.childSkills ?? {}).forEach(child =>
          child.scheduledSequences.forEach(item =>
            usages.push(program(child.actionGraph.main, item.sequence)),
          ),
        );
        for (const passive of definition.passiveSkills ?? []) {
          usages.push(program(passive.actionGraph.main, passive.enableSequence));
          for (const response of passive.abilityEventResponses ?? []) {
            usages.push(program(passive.actionGraph.main, response.sequence));
          }
        }
        const usage = mergeDefinitionValueUsage(usages);
        cache.set(definition, usage);
        return usage;
      } finally {
        visiting.delete(definition);
      }
    },
  };
  return context;
}
