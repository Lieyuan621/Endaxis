import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
/**
 * 算出一个技能块上的命中点画在哪、对应哪个命中。
 *
 * 本模块只从定义收集稳定身份与无运行结果时的局部回退偏移；实际位置由页面消费
 * `DamageApplied(castId, hitId)` 回执。条件分支里的命中点会标记出来，由页面决定怎么显示。
 * 命中点来自调用方提供的 SkillDefinition（目录或自定义），投影层不再从存档快照读取。
 * 未显式命名的伤害按调用位置路径 + 编译图节点 ID 分配身份，与运行时
 * `deriveAnonymousDamageStepKey` 规则一致，模拟后可以直接用回执 hitId 匹配。
 */
import type {
  CombatCondition,
  OperatorDefinition,
} from '../../../core/game-data/operatorDefinition';
import type { SkillCastDocument } from '../../../core/project/schema';
import {
  deriveAnonymousDamageStepKey,
  deriveHitId,
} from '../../../core/combat/timeline/deriveHitId';
import { compareCombatNumbers } from '../../../core/mechanics/combatNumbers.ts';
import type {
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';

/** 一个可渲染的命中点。 */
export interface TimelineHitMarker {
  readonly stepKey: string;
  readonly hitId: string;
  /** 产生该候选命中的基础或运行时替换技能形态。 */
  readonly skillKey?: string;
  /** 相对技能块左边缘的帧偏移。 */
  readonly frameOffset: number;
  /** 在条件分支里，跑不跑取决于当时的条件。 */
  readonly conditional: boolean;
}

/** 页面算好像素位置后交给组件画出来的命中点。 */
export interface TimelineHitMarkerView {
  /** 由明确的伤害事件响应产生的追加命中；执行宿主类型不参与判定。 */
  readonly triggered?: boolean;
  readonly triggeredStackIndex?: number;
  readonly executionFrame?: number;
  readonly stepKey: string;
  readonly hitId: string;
  /** 相对技能块左边缘的像素偏移。 */
  readonly leftPx: number;
  readonly title?: string;
  /** 该次命中实际获得了“连击”伤害 Buff；沿用 main 的蓝色命中点反馈。 */
  readonly linkBuffed?: boolean;
  /** 该命中是否被编辑器强制设为暴击；仅用于复刻旧版命中点反馈。 */
  readonly forcedCritical?: boolean;
}

/**
 * 尚无模拟结果时只展示定义中无条件的命中预览；一旦有模拟快照，命中事实必须来自
 * `DamageApplied(castId, hitId)`。这样时间轴跳转或提前结束后不可达的根调度命中不会
 * 再退回原生定义帧，伪装成一次延迟命中。
 */
export function shouldDisplayTimelineHitMarker(
  marker: TimelineHitMarker,
  hasSimulationRun: boolean,
  actualFrames: ReadonlyMap<string, number>,
): boolean {
  return hasSimulationRun ? actualFrames.has(marker.hitId) : !marker.conditional;
}

/**
 * 命中可以由能力实体等延迟到主技能块结束之后，不能被技能块宽度截断。
 * 负偏移没有可展示的实际意义，仍收敛到技能起点。
 */
export function projectTimelineHitMarkerLeftPx(leftPx: number): number {
  return Math.max(0, leftPx);
}

function resolveStaticCondition(condition: CombatCondition): boolean | null {
  if (
    condition.kind !== 'actionValueCompare' ||
    condition.left.kind !== 'constant' ||
    condition.right.kind !== 'constant'
  ) {
    return null;
  }
  return compareCombatNumbers(condition.left.value, condition.right.value, condition.operator);
}

/**
 * 编译图节点 ID：主图为 `[null, localId]`，宏图为 `[macroId, localId]`，
 * 与运行时编译产物中的节点身份一致。
 */
const compiledNodeId = (ns: string | null, localId: string): string =>
  JSON.stringify([ns, localId]);

/**
 * 图内部子调用的 callSite 追加规则，与 ActionGraphExecution 的 #child 一致：
 * `${callSite}/${encodeURIComponent(compiledNodeId)}:${port}`。
 */
const childCallSite = (
  callSite: string,
  ns: string | null,
  localId: string,
  port: number,
  identity = compiledNodeId(ns, localId),
): string => `${callSite}/${encodeURIComponent(identity)}:${port}`;

/** Buff 宿主内各入口的编译路径根规则，与 createProgramDefinitionCompiler 一致。 */
const buffEntryCallSite = {
  scheduled: (buffId: string, index: number) =>
    `buffDefinitions.${JSON.stringify(buffId)}.scheduledSequences[${index}].sequence`,
  lifecycle: (buffId: string, key: string) =>
    `buffDefinitions.${JSON.stringify(buffId)}.lifecycleSequences.${key}`,
  abilityEventResponse: (buffId: string, index: number) =>
    `buffDefinitions.${JSON.stringify(buffId)}.abilityEventResponses[${index}].sequence`,
  igniteEventResponse: (buffId: string, index: number) =>
    `buffDefinitions.${JSON.stringify(buffId)}.igniteEventResponses[${index}].sequence`,
};

/** 只读取图节点来生成模拟前预览；共享节点按每次入口访问，不展开或复制动作树。 */
export function projectCastGraphHitMarkers(
  cast: SkillCastDocument,
  definition: SkillDefinition,
  operator: OperatorDefinition,
): readonly TimelineHitMarker[] {
  const markers: TimelineHitMarker[] = [];
  let resource: ActionGraphResourceDefinition | undefined = definition.actionGraph;
  let graph: ActionGraphDefinition = definition.actionGraph.main;
  const activeNodes = new Map<ActionGraphDefinition, Set<string>>();
  const activeMacros = new Set<object>();

  // 每个宿主解析自己的节点和宏；返回后继续外层调用，不能把局部 ID 当全局 ID。
  const inOwner = <T extends object>(
    owner: T & { readonly actionGraph?: ActionGraphResourceDefinition },
    collectOwner: () => void,
  ): void => {
    const previousGraph = graph;
    const previousResource = resource;
    if (owner.actionGraph !== undefined) {
      resource = owner.actionGraph;
      graph = owner.actionGraph.main;
    }
    try {
      collectOwner();
    } finally {
      graph = previousGraph;
      resource = previousResource;
    }
  };

  const visit = (
    entry: ActionGraphReference,
    callSite: string,
    ns: string | null,
    callback: (
      localId: string,
      action: ActionGraphStep,
      callSite: string,
      ns: string | null,
      identity: string,
      identities?: ReadonlyMap<string, string>,
    ) => void,
    identities?: ReadonlyMap<string, string>,
  ): void => {
    const entered: string[] = [];
    const currentGraph = graph;
    const currentNodes = activeNodes.get(currentGraph) ?? new Set<string>();
    activeNodes.set(currentGraph, currentNodes);
    let id = entry.$sequence;
    try {
      while (id !== null) {
        if (currentNodes.has(id)) throw new Error(`hit preview has recursive graph node '${id}'`);
        const node = currentGraph.nodes[id];
        if (node === undefined) throw new Error(`hit preview refers to missing graph node '${id}'`);
        currentNodes.add(id);
        entered.push(id);
        const identity = identities?.get(id) ?? compiledNodeId(ns, id);
        if (node.action.kind === 'callMacro') {
          const macro = resource?.macros[node.action.macroId];
          if (macro === undefined)
            throw new Error(`hit preview refers to missing macro '${node.action.macroId}'`);
          if (activeMacros.has(macro))
            throw new Error(`hit preview has recursive macro '${node.action.macroId}'`);
          activeMacros.add(macro);
          try {
            graph = macro.graph;
            const bindings = node.action.nodeBindings;
            visit(
              macro.entry,
              bindings === undefined ? childCallSite(callSite, ns, id, 0, identity) : callSite,
              node.action.macroId,
              callback,
              bindings === undefined
                ? undefined
                : new Map(
                    Object.entries(bindings).map(([nodeId, original]) => [
                      nodeId,
                      identities?.get(original) ?? compiledNodeId(ns, original),
                    ]),
                  ),
            );
          } finally {
            graph = currentGraph;
            activeMacros.delete(macro);
          }
        } else {
          callback(id, node.action, callSite, ns, identity, identities);
        }
        id = node.next;
      }
    } finally {
      for (const nodeId of entered) currentNodes.delete(nodeId);
    }
  };

  const collect = (
    entry: ActionGraphReference,
    callSite: string,
    ns: string | null,
    frameOffset: number,
    conditional: boolean,
    activeBuffIds: ReadonlySet<string>,
    activeEntityIds: ReadonlySet<string>,
    identities?: ReadonlyMap<string, string>,
  ): void => {
    const collectStep: Parameters<typeof visit>[3] = (
      nodeId,
      step,
      nodeCallSite,
      nodeNs,
      identity,
      nodeIdentities,
    ) => {
      if (step.kind === 'dealDamage' || step.kind === 'dealFixedDamage') {
        const stepKey = step.key ?? deriveAnonymousDamageStepKey(nodeCallSite, identity);
        markers.push({
          stepKey,
          hitId: deriveHitId(cast.id, stepKey),
          frameOffset,
          conditional,
        });
        return;
      }
      if (step.kind === 'switch') {
        step.options.forEach((option, index) =>
          collect(
            option.sequence,
            childCallSite(nodeCallSite, nodeNs, nodeId, index, identity),
            nodeNs,
            frameOffset,
            true,
            activeBuffIds,
            activeEntityIds,
            nodeIdentities,
          ),
        );
        return;
      }
      if (step.kind === 'conditional') {
        const staticResult = resolveStaticCondition(step.parameters.condition);
        if (staticResult !== false)
          collect(
            step.whenTrue,
            childCallSite(nodeCallSite, nodeNs, nodeId, 0, identity),
            nodeNs,
            frameOffset,
            conditional || staticResult === null,
            activeBuffIds,
            activeEntityIds,
            nodeIdentities,
          );
        if (staticResult !== true && step.whenFalse !== undefined)
          collect(
            step.whenFalse,
            childCallSite(nodeCallSite, nodeNs, nodeId, 1, identity),
            nodeNs,
            frameOffset,
            conditional || staticResult === null,
            activeBuffIds,
            activeEntityIds,
            nodeIdentities,
          );
        return;
      }
      if (
        step.kind === 'once' ||
        step.kind === 'withActionBlackboardScope' ||
        step.kind === 'repeatEachTick' ||
        step.kind === 'repeatByActionValue' ||
        step.kind === 'forEachContextTarget'
      ) {
        collect(
          step.body,
          childCallSite(nodeCallSite, nodeNs, nodeId, 0, identity),
          nodeNs,
          frameOffset,
          conditional,
          activeBuffIds,
          activeEntityIds,
          nodeIdentities,
        );
        return;
      }
      if (step.kind === 'listenForCombatEvents') {
        step.parameters.responses.forEach((response, index) =>
          collect(
            response.sequence,
            childCallSite(nodeCallSite, nodeNs, nodeId, index, identity),
            nodeNs,
            frameOffset,
            true,
            activeBuffIds,
            activeEntityIds,
            nodeIdentities,
          ),
        );
        return;
      }
      if (step.kind === 'applyBuff') {
        if (step.parameters.inheritSourceSkillCastInfo === false) return;
        if (typeof step.parameters.buffId !== 'string') return;
        const buffId = step.parameters.buffId;
        const buff = operator.buffDefinitions?.[buffId];
        if (buff === undefined || activeBuffIds.has(buffId)) return;
        const nextBuffIds = new Set(activeBuffIds).add(buffId);
        inOwner(buff, () => {
          (buff.scheduledSequences ?? []).forEach((scheduled, index) =>
            collect(
              scheduled.sequence,
              buffEntryCallSite.scheduled(buffId, index),
              null,
              frameOffset + scheduled.startFrame,
              true,
              nextBuffIds,
              activeEntityIds,
            ),
          );
          for (const [key, sequence] of Object.entries(buff.lifecycleSequences ?? {}))
            if (sequence !== undefined)
              collect(
                sequence,
                buffEntryCallSite.lifecycle(buffId, key),
                null,
                frameOffset,
                true,
                nextBuffIds,
                activeEntityIds,
              );
          (buff.abilityEventResponses ?? []).forEach((response, index) =>
            collect(
              response.sequence,
              buffEntryCallSite.abilityEventResponse(buffId, index),
              null,
              frameOffset,
              true,
              nextBuffIds,
              activeEntityIds,
            ),
          );
          (buff.igniteEventResponses ?? []).forEach((response, index) =>
            collect(
              response.sequence,
              buffEntryCallSite.igniteEventResponse(buffId, index),
              null,
              frameOffset,
              true,
              nextBuffIds,
              activeEntityIds,
            ),
          );
        });
        return;
      }
      if (step.kind !== 'spawnAbilityEntity' && step.kind !== 'startCurrentAbilityEntityChildSkill')
        return;
      const entityId =
        step.kind === 'spawnAbilityEntity' ? step.parameters.abilityEntityId : undefined;
      if (entityId !== undefined && activeEntityIds.has(entityId)) return;
      const entity =
        step.kind === 'spawnAbilityEntity'
          ? (step.parameters.definition ?? operator.abilityEntityDefinitions?.[entityId!])
          : undefined;
      const requestedSkillId =
        step.kind === 'spawnAbilityEntity' ? step.parameters.childSkillId : undefined;
      const childSkill =
        step.kind === 'startCurrentAbilityEntityChildSkill'
          ? step.parameters.childSkill
          : requestedSkillId !== undefined
            ? entity?.childSkill?.skillId === requestedSkillId
              ? entity.childSkill
              : entity?.childSkills?.[requestedSkillId]
            : (entity?.childSkill ??
              (Object.values(entity?.childSkills ?? {}).length === 1
                ? Object.values(entity?.childSkills ?? {})[0]
                : undefined));
      if (childSkill === undefined) return;
      const nextEntityIds =
        entityId === undefined ? activeEntityIds : new Set(activeEntityIds).add(entityId);
      const collectChild = () =>
        inOwner(childSkill, () => {
          // 运行时按编译路径区分子技能来源：宿主目录实体以 abilityEntityDefinitions 为根，
          // 内联定义/子技能参数挂在触发节点的 graph.<compiledNodeId>.parameters 路径下。
          const inlineRoot = `graph.${compiledNodeId(nodeNs, nodeId)}`;
          const entityRoot =
            step.kind === 'spawnAbilityEntity' && step.parameters.definition !== undefined
              ? `${inlineRoot}.parameters.definition`
              : step.kind === 'startCurrentAbilityEntityChildSkill'
                ? `${inlineRoot}.parameters.childSkill`
                : entityId !== undefined
                  ? `abilityEntityDefinitions.${JSON.stringify(entityId)}${
                      entity?.childSkill?.skillId === undefined ||
                      childSkill.skillId === entity.childSkill.skillId
                        ? '.childSkill'
                        : `.childSkills.${JSON.stringify(childSkill.skillId)}`
                    }`
                  : inlineRoot;
          childSkill.scheduledSequences.forEach((scheduled, index) =>
            collect(
              scheduled.sequence,
              `${entityRoot}.scheduledSequences[${index}].sequence`,
              null,
              frameOffset + scheduled.startFrame,
              conditional,
              activeBuffIds,
              nextEntityIds,
            ),
          );
        });
      if (entity === undefined) collectChild();
      else inOwner(entity, collectChild);
    };
    visit(entry, callSite, ns, collectStep, identities);
  };

  definition.scheduledSequences.forEach((scheduled, index) =>
    collect(
      scheduled.sequence,
      `${definition.key}:scheduledSequences[${index}].sequence`,
      null,
      scheduled.startFrame,
      false,
      new Set(),
      new Set(),
    ),
  );
  return markers;
}
