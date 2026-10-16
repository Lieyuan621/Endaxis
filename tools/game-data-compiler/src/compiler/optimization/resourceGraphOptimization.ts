/** 优化各资源自己的完整图。遍历目录只寻找资源，绝不把目录中的节点合到一起。 */
import { isDeepStrictEqual } from 'node:util';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
  SkillDefinition,
  AbilityEntityChildSkillDefinition,
  OperatorPassiveSkillDefinition,
  OperatorBuffDefinitions,
} from '../intermediateDefinitions.ts';
import {
  pruneUnusedGraphSkillValues,
  pruneGraphValues,
  type GraphSharedEntityValueUsage,
} from './graphValueOptimization.ts';
import {
  analyzeGraphBuffParameters,
  createBuffAssignmentPruner,
  externalBuffValueKeys,
} from '../buffs/graphBuffValueUsage.ts';
import type { SkillBuffDefinition } from '../intermediateDefinitions.ts';
import type { DefinitionUsageContext } from './definitionUsageAnalysis.ts';
import type { ResourceValueOptimizationReport } from './resourceValueOptimization.ts';
import { optimizeActionGraphEntries } from './graphSequenceOptimization.ts';
import { deduplicateActionGraph } from './actionGraphDeduplication.ts';
import { extractActionGraphMiddleSegments } from './actionGraphMiddleSegments.ts';
import { collectUnobservedGraphTargetGroups } from './graphTargetUsage.ts';
import type {
  DefinitionOptimizationMode,
  DefinitionOptimizationReport,
} from './definitionOptimization.ts';

function isReference(value: object): value is ActionGraphReference {
  return (
    Object.keys(value).length === 1 &&
    '$sequence' in value &&
    (typeof value.$sequence === 'string' || value.$sequence === null)
  );
}

/** 枚举或替换当前资源的入口；独立子资源有自己的图，不跨进去解析引用。未改动子树保留引用身份。 */
function mapEntries(
  value: unknown,
  map: (entry: ActionGraphReference, path: readonly string[]) => ActionGraphReference,
  path: readonly string[] = [],
): unknown {
  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item, index) => {
      const next = mapEntries(item, map, [...path, String(index)]);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? items : value;
  }
  if (!value || typeof value !== 'object') return value;
  if (isReference(value)) return map(value, path);
  if ('actionGraph' in value) return value;
  let changed = false;
  const record: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const next = mapEntries(item, map, [...path, key]);
    if (next !== item) changed = true;
    record[key] = next;
  }
  return changed ? record : value;
}

export function optimizeResourceGraphs<T>(
  value: T,
  mode: DefinitionOptimizationMode,
  pruneValues?: (simplified: T) => T,
  resourceValues?: {
    readonly skillInitialKeys?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly passiveInitialKeys?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly sharedUsage?: GraphSharedEntityValueUsage;
    readonly usageContext?: DefinitionUsageContext;
  },
): {
  readonly value: T;
  readonly reports: readonly DefinitionOptimizationReport[];
  readonly resourceValues: readonly ResourceValueOptimizationReport[];
} {
  const reports: DefinitionOptimizationReport[] = [];
  const valueReports = new Map<string, ResourceValueOptimizationReport>();
  const reportLocations = new Map<string, number>();
  let pruneBuffAssignments: ReturnType<typeof createBuffAssignmentPruner> | undefined;
  function recordReport(path: string, report: DefinitionOptimizationReport) {
    const index = reportLocations.get(path);
    if (index === undefined) {
      reportLocations.set(path, reports.length);
      reports.push({ ...report, mode });
      return;
    }
    const previous = reports[index]!;
    reports[index] = {
      ...report,
      mode,
      before: previous.before,
      changes: [...previous.changes, ...report.changes],
    };
  }
  function recordValueReport(path: string, report: ResourceValueOptimizationReport): void {
    const previous = valueReports.get(path);
    valueReports.set(
      path,
      previous
        ? {
            ...report,
            removedWrites: [...previous.removedWrites, ...report.removedWrites],
            removedInitialKeys: [...previous.removedInitialKeys, ...report.removedInitialKeys],
          }
        : report,
    );
  }
  function visit(
    value: unknown,
    path: string,
    phase: 'simplify' | 'extract',
    kind?: 'passive' | 'buffDefinitions',
    buffId?: string,
    entityKeys?: ReadonlySet<string>,
  ): unknown {
    if (Array.isArray(value)) {
      let changed = false;
      const items = value.map((item, index) => {
        const next = visit(item, `${path}[${index}]`, phase, kind, undefined, entityKeys);
        if (next !== item) changed = true;
        return next;
      });
      return changed ? items : value;
    }
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    const ownerKeys =
      record.entityBlackboard && typeof record.entityBlackboard === 'object'
        ? new Set(Object.keys(record.entityBlackboard))
        : entityKeys;
    if (Object.keys(record).length === 1 && Array.isArray(record.steps))
      throw new Error(`${path}: action trees are no longer supported`);
    let changed = false;
    const fields: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      if (key === 'actionGraph') continue;
      const next = visit(
        item,
        `${path}.${key}`,
        phase,
        key === 'passiveSkills'
          ? 'passive'
          : key === 'buffDefinitions'
            ? 'buffDefinitions'
            : undefined,
        kind === 'buffDefinitions' ? key : undefined,
        // Buff 宿主和能力实体拥有自己的变量环境，不能继承干员的初始化证明。
        key === 'buffDefinitions' || key === 'abilityEntityDefinitions' ? undefined : ownerKeys,
      );
      if (next !== item) changed = true;
      fields[key] = next;
    }
    // Buff 不随调度结束；有自然时长的技能也不靠空调度维持存活。
    // 未配置自然时长的技能仍可能依赖调度终点，不能仅凭入口为空删除。
    if (
      phase === 'extract' &&
      (typeof fields.naturalDurationFrames === 'number' || 'stackingType' in fields) &&
      Array.isArray(fields.scheduledSequences)
    ) {
      const schedules = fields.scheduledSequences.filter(
        item => !isReference(item.sequence) || item.sequence.$sequence !== null,
      );
      if (schedules.length !== fields.scheduledSequences.length) {
        fields.scheduledSequences = schedules;
        changed = true;
      }
    }
    if (record.actionGraph === undefined) return changed ? fields : value;
    // 主图中的外部资源调用也要分别优化；visit 不会把它们的节点并入父图。
    let resource = visit(
      record.actionGraph,
      `${path}.actionGraph`,
      phase,
    ) as ActionGraphResourceDefinition;
    if (phase === 'simplify' && pruneBuffAssignments) {
      let nodesChanged = false;
      const nodes = Object.fromEntries(
        Object.entries(resource.main.nodes).map(([id, node]) => {
          const action = pruneBuffAssignments!(
            node.action,
            (fields.blackboard ?? {}) as Readonly<Record<string, unknown>>,
          );
          if (action === node.action) return [id, node];
          nodesChanged = true;
          return [id, { ...node, action }];
        }),
      );
      if (nodesChanged) resource = { ...resource, main: { ...resource.main, nodes } };
    }
    if (resource !== record.actionGraph) changed = true;
    const entries: ActionGraphReference[] = [];
    const entryResultsUsed: boolean[] = [];
    mapEntries(fields, (entry, path) => {
      entries.push(entry);
      // 时间线、Buff 生命周期和点燃列表独立调用序列，不消费入口真假结果。
      // 修正器条件仍需要返回值；列表中的序列也不能因此合并。
      const scheduled = path.at(-3) === 'scheduledSequences' && path.at(-1) === 'sequence';
      const buffEvent =
        'stackingType' in fields &&
        ((path[0] === 'lifecycleSequences' && path.length === 3) ||
          (path[0] === 'igniteEventResponses' && path[2] === 'sequences' && path.length === 4));
      entryResultsUsed.push(!scheduled && !buffEvent);
      return entry;
    });
    if (phase === 'extract') {
      // 裁掉写入后，原来不同的后续可能变得相同；先重新共享这些分支。
      const shared = deduplicateActionGraph(resource.main, entries);
      let entryIndex = 0;
      const metadata = mapEntries(fields, () => shared.entries[entryIndex++]!);
      if (metadata !== fields) changed = true;
      // 只在没有宏的资源内提取一层。黑板裁剪已完成，此后不再改宏内节点 ID。
      const extracted =
        Object.keys(resource.macros).length === 0
          ? extractActionGraphMiddleSegments(shared.graph, shared.entries)
          : { graph: shared.graph, macros: resource.macros, candidates: [] };
      const reportIndex = reportLocations.get(path);
      if (extracted.candidates.length > 0 && reportIndex !== undefined) {
        reports[reportIndex] = {
          ...reports[reportIndex]!,
          macroCandidates: extracted.candidates.map(candidate => ({
            ...candidate,
            resourcePath: path,
          })),
        };
      }
      const finalResource =
        extracted.graph === resource.main
          ? resource
          : { main: extracted.graph, macros: extracted.macros };
      if (finalResource !== record.actionGraph) changed = true;
      return changed ? { ...(metadata as object), actionGraph: finalResource } : value;
    }
    // 等价分支可能只是节点 ID 不同；先共享定义，控制流才能识别同一后继。
    // 共享不合并调用次数或状态，优化后的新等价尾段仍由下方再次收拢。
    const input =
      mode === 'off'
        ? { graph: resource.main, entries }
        : deduplicateActionGraph(resource.main, entries);
    const optimized = optimizeActionGraphEntries(input.graph, input.entries, {
      mode: mode === 'off' ? 'off' : 'apply',
      definitionId: path,
      entryResultsUsed,
      initialBlackboardKeys: new Set([
        ...Object.keys((fields.blackboard as object | undefined) ?? {}),
        ...('nativeSkillType' in fields ? (ownerKeys ?? []) : []),
      ]),
      unobservedTargetGroups: collectUnobservedGraphTargetGroups(fields, resource),
    });
    const deduplicated =
      mode === 'off' ? optimized : deduplicateActionGraph(optimized.graph, optimized.entries);
    recordReport(path, optimized.report);
    let index = 0;
    let entriesChanged = false;
    const metadata = mapEntries(fields, entry => {
      const next = deduplicated.entries[index++]!;
      if (next !== entry) entriesChanged = true;
      return next;
    });
    if (entriesChanged) changed = true;
    if (deduplicated.graph !== resource.main) changed = true;
    // 这些宏的局部 ID 是调用位置映射的键。再次优化不能单独改宏体而留下失效映射。
    const boundMacros = new Set<string>();
    for (const graph of [
      resource.main,
      ...Object.values(resource.macros).map(macro => macro.graph),
    ]) {
      for (const { action } of Object.values(graph.nodes)) {
        if (action.kind === 'callMacro' && action.nodeBindings) boundMacros.add(action.macroId);
      }
    }
    let macrosChanged = false;
    const macros = Object.fromEntries(
      Object.entries(resource.macros).map(([id, macro]) => {
        if (boundMacros.has(id)) return [id, macro];
        const result = optimizeActionGraphEntries(macro.graph, [macro.entry], {
          mode: mode === 'off' ? 'off' : 'apply',
          definitionId: `${path}.macro.${id}`,
        });
        recordReport(`${path}.macro.${id}`, result.report);
        const shared =
          mode === 'off' ? result : deduplicateActionGraph(result.graph, result.entries);
        const next =
          shared.entries[0] === macro.entry && shared.graph === macro.graph
            ? macro
            : { ...macro, entry: shared.entries[0]!, graph: shared.graph };
        if (next !== macro) macrosChanged = true;
        return [id, next];
      }),
    );
    if (macrosChanged) changed = true;
    const finalResource: ActionGraphResourceDefinition =
      deduplicated.graph === resource.main && !macrosChanged
        ? resource
        : { main: deduplicated.graph, macros };
    const simplified = changed ? { ...(metadata as object), actionGraph: finalResource } : value;
    // 常驻资源的入口可能重复、交错执行，统一保留跨入口用途，不推断单次覆盖。
    // passiveSkills 目录声明资源身份，不根据 enableSequence 字段猜测装备或被动。
    if (
      mode !== 'off' &&
      ('stackingType' in record || kind === 'passive') &&
      resourceValues?.sharedUsage
    ) {
      const owner = simplified as SkillBuffDefinition | OperatorPassiveSkillDefinition;
      const shared = resourceValues.sharedUsage;
      const parameters = 'stackingType' in owner ? analyzeGraphBuffParameters(owner) : undefined;
      // 未知读取属于产生它的程序；其他资源的未知局部访问不能冻结本资源。
      // 本图及实际接收方的未知依赖由 pruneGraphValues / usageContext 保守处理。
      if (!parameters?.unknownAccess) {
        const protectedKeys = new Set<string>();
        parameters?.reads.forEach(key => protectedKeys.add(key));
        if ('stackingType' in owner) {
          externalBuffValueKeys(owner, buffId, shared.externalReads).forEach(key =>
            protectedKeys.add(key),
          );
        }
        const resourceEntries: Parameters<typeof pruneGraphValues>[0]['entries'][number][] = [];
        mapEntries(metadata, (sequence, entryPath) => {
          resourceEntries.push({
            sequence,
            path: entryPath.join('.'),
            resultIsConsumed: entryResultsUsed[resourceEntries.length]!,
            analyzeControlFlow: false,
          });
          return sequence;
        });
        const pruned = pruneGraphValues<unknown>(
          {
            id: path,
            actionGraph: finalResource,
            blackboard: owner.blackboard,
            conditions: [],
            entries: resourceEntries,
          },
          protectedKeys,
          resourceValues.usageContext,
          'stackingType' in owner ? undefined : resourceValues.passiveInitialKeys?.get(owner.key),
        );
        recordValueReport(path, pruned.report);
        let entryIndex = 0;
        return {
          ...(mapEntries(metadata, () => pruned.scope.entries[entryIndex++]!.sequence) as object),
          actionGraph: pruned.scope.actionGraph,
          ...(pruned.scope.blackboard === undefined ? {} : { blackboard: pruned.scope.blackboard }),
        };
      }
      if (owner.blackboard && Object.keys(owner.blackboard).length > 0) {
        recordValueReport(path, {
          resourceId: path,
          removedWrites: [],
          removedInitialKeys: [],
          retainedLifetimePaths: [],
          retainedReason: 'unresolved-blackboard-access',
        });
      }
    }
    // nativeSkillType 仅属于技能资源；Buff 和被动技能有不同的生命周期入口。
    // 复用资源遍历，目录内技能、投射物回调和内嵌实体均在自己的图中分析。
    if (mode !== 'off' && 'nativeSkillType' in record && 'scheduledSequences' in record) {
      const pruned = pruneUnusedGraphSkillValues(
        simplified as SkillDefinition | AbilityEntityChildSkillDefinition,
        undefined,
        resourceValues?.usageContext,
        typeof record.key === 'string'
          ? resourceValues?.skillInitialKeys?.get(record.key)
          : undefined,
      );
      recordValueReport(path, pruned.report);
      return pruned.skill;
    }
    return simplified;
  }
  const simplify = (current: T): T => {
    const definitions = (current as { readonly buffDefinitions?: OperatorBuffDefinitions })
      ?.buffDefinitions;
    const shared = resourceValues?.sharedUsage;
    pruneBuffAssignments =
      mode !== 'off' && definitions && shared
        ? createBuffAssignmentPruner(
            definitions,
            shared.externalReads,
            resourceValues?.usageContext,
          )
        : undefined;
    return visit(current, 'definition', 'simplify') as T;
  };
  let simplified = simplify(value);
  // 无用写入消失后，条件可能失去用途；条件消失后，其输入也可能成为死值。
  // 宏提取放在收敛之后，避免宏调用隐藏读写关系。
  if (mode !== 'off') {
    for (;;) {
      const pruned = pruneValues ? pruneValues(simplified) : simplified;
      const next = simplify(pruned);
      if (isDeepStrictEqual(next, simplified)) break;
      simplified = next;
    }
  }
  const candidate = mode === 'off' ? simplified : (visit(simplified, 'definition', 'extract') as T);
  return {
    value: mode === 'apply' ? candidate : value,
    reports,
    resourceValues: [...valueReports.values()],
  };
}
