import type {
  LevelValues,
  OperatorPassiveSkillDefinition,
  OperatorEntityBlackboardInitializerDefinition,
  SkillLevelSource,
} from '../../compiler/intermediateDefinitions.ts';
import type { CompiledPassiveSkillDefinitionSource } from '../../compiler/skills/passiveSkillBatch.ts';
import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import {
  materializePassiveBuffInstallation,
  resolvePassiveSkillDefinitionBlackboard,
} from '../../compiler/skills/passiveSkillInstallation.ts';
import { isPresentationOnlyActionSequence } from '../../compiler/skills/skillPresentationTargets.ts';
import { compileCombatActionSequenceSource } from '../../compiler/buffs/buffRuntimeProjection.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { projectAbilityEvent } from '../../compiler/abilities/abilityEventProjection.ts';
import { isOperatorPassiveAbilityEvent } from '../../../../../src/core/game-data/definitionGuards.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../../compiler/actions/combatActionProjectionTypes.ts';
import {
  createActionGraphBuilder,
  type ActionGraphBuilder,
} from '../../compiler/actions/actionGraphBuilder.ts';
import { collectCompiledBuffIds } from '../../compiler/references/compiledReferences.ts';
import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type { CombatActionProjectionContextSource } from '../../compiler/combatProjectionCommon.ts';

interface PlannedPassiveSkill {
  readonly graph: ActionGraphBuilder<CompiledBuffStepSource>;
  readonly abilityEventResponses: NonNullable<
    OperatorPassiveSkillDefinition['abilityEventResponses']
  >;
  readonly key: string;
  readonly levelSource?: SkillLevelSource;
  readonly blackboard: Readonly<Record<string, LevelValues>>;
  readonly buffs: readonly {
    readonly buffId: string;
    readonly assignments: Readonly<Record<string, LevelValues>>;
  }[];
  /** 构筑加载后只需执行一次的原生被动响应；战斗中构筑快照不再变化。 */
  readonly initializationSequences: readonly CompiledBuffSequenceSource[];
}

export interface CompiledOperatorUpgradePassiveSkillsSource {
  readonly definitions: readonly OperatorPassiveSkillDefinition[];
  readonly buffIds: readonly string[];
  readonly handledSourcePaths: readonly string[];
  readonly entityBlackboardInitializers: readonly OperatorEntityBlackboardInitializerDefinition[];
}

/**
 * 把同一天赋/潜能各等级的 AddPassiveSkill 请求合并成一个等级化安装定义。
 * 接受 AddBuff 形态及已审计的被动事件；不接受有效时间轴、Toggle 或卡面修正。
 * 已准入事件统一输出 abilityEventResponses，不再在启用程序中安装第二套监听。
 */
export function compileOperatorUpgradePassiveSkills(
  effectIds: readonly string[],
  requests: readonly PassiveSkillCompileRequestSource[],
  definitions: readonly CompiledPassiveSkillDefinitionSource[],
  gameplayTagRegistry?: GameplayTagRegistry,
  predefinedTagQueries?: CombatActionProjectionContextSource['predefinedTagQueries'],
): CompiledOperatorUpgradePassiveSkillsSource {
  const definitionById = new Map(definitions.map(item => [item.skillId, item]));
  const levelPlans = effectIds.map(effectId =>
    requests
      .filter(request => request.originId === effectId)
      .map(request =>
        planPassiveSkill(request, definitionById, gameplayTagRegistry, predefinedTagQueries),
      ),
  );
  const identities = levelPlans.map(plan =>
    JSON.stringify(
      plan.map(passive => [
        passive.key,
        passive.levelSource,
        Object.keys(passive.blackboard).sort(),
        passive.buffs.map(buff => [buff.buffId, Object.keys(buff.assignments).sort()]),
        passive.initializationSequences,
        passive.abilityEventResponses,
        passive.graph.finish(),
      ]),
    ),
  );
  if (identities.some(identity => identity !== identities[0])) {
    throw new Error('operator passive SkillData installation structure changes between levels');
  }
  const definitionsOutput = (levelPlans[0] ?? []).flatMap((passive, passiveIndex) => {
    const blackboard: Record<string, number | readonly number[]> = {};
    const usedKeys = new Set<string>();
    for (const key of Object.keys(passive.blackboard).sort()) {
      const values = levelPlans.map(level => level[passiveIndex]!.blackboard[key]!);
      blackboard[key] = mergePassiveLevelValues(values, `${passive.key}.blackboard.${key}`);
      usedKeys.add(key);
    }
    const steps: CompiledBuffStepSource[] = passive.buffs.map((buff, buffIndex) => {
      const blackboardAssignments: Record<string, { kind: 'blackboard'; key: string }> = {};
      for (const targetKey of Object.keys(buff.assignments).sort()) {
        const values = levelPlans.map(
          level => level[passiveIndex]!.buffs[buffIndex]!.assignments[targetKey]!,
        );
        const levelValue = mergePassiveLevelValues(
          values,
          `${passive.key}.buffs[${buffIndex}].assignments.${targetKey}`,
        );
        if (usedKeys.has(targetKey)) {
          if (JSON.stringify(blackboard[targetKey]) !== JSON.stringify(levelValue)) {
            throw new Error(
              `${passive.key}: passive Buff assignment collides with blackboard key ${JSON.stringify(targetKey)}`,
            );
          }
        } else {
          usedKeys.add(targetKey);
          blackboard[targetKey] = levelValue;
        }
        blackboardAssignments[targetKey] = { kind: 'blackboard', key: targetKey };
      }
      return {
        kind: 'applyBuff' as const,
        parameters: {
          buffs: [
            {
              buffId: buff.buffId,
              ...(Object.keys(blackboardAssignments).length === 0 ? {} : { blackboardAssignments }),
            },
          ],
          targets: { kind: 'fixed' as const, target: 'caster' as const },
          inheritSourceSkillCastInfo: false,
        },
      };
    });
    for (const sequence of passive.initializationSequences) {
      if (projectEntityBlackboardInitializer(passive.graph, sequence) === null)
        steps.push(...passive.graph.actions(sequence));
    }
    const enableSequence = passive.graph.sequence(steps);
    return [
      {
        key: passive.key,
        ...(passive.levelSource === undefined ? {} : { levelSource: passive.levelSource }),
        ...(Object.keys(blackboard).length === 0 ? {} : { blackboard }),
        enableSequence,
        actionGraph: { main: passive.graph.finish(), macros: {} },
        ...(passive.abilityEventResponses.length === 0
          ? {}
          : { abilityEventResponses: passive.abilityEventResponses }),
      } satisfies OperatorPassiveSkillDefinition,
    ];
  });
  return {
    definitions: definitionsOutput,
    entityBlackboardInitializers: (levelPlans[0] ?? []).flatMap(passive =>
      passive.initializationSequences.flatMap(sequence => {
        const initializer = projectEntityBlackboardInitializer(passive.graph, sequence);
        return initializer === null ? [] : [initializer];
      }),
    ),
    buffIds: [
      ...new Set([
        ...levelPlans.flatMap(level => level.flatMap(item => item.buffs.map(b => b.buffId))),
        ...collectCompiledBuffIds(definitionsOutput),
      ]),
    ],
    handledSourcePaths: requests
      .filter(request => effectIds.includes(request.originId))
      .map(request => request.sourcePath),
  };
}

function projectEntityBlackboardInitializer(
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
  sequence: CompiledBuffSequenceSource,
): OperatorEntityBlackboardInitializerDefinition | null {
  const steps = graph.actions(sequence);
  if (steps.length !== 1) return null;
  const branch = steps[0];
  if (branch?.kind !== 'conditional' || branch.parameters.condition.kind !== 'deckAttributeCompare')
    return null;
  const condition = branch.parameters.condition;
  // 仅当前干员的静态面板比较可提前计算；其他目标或动作黑板输入必须留在运行时。
  if (
    condition.target.kind !== 'owner' ||
    typeof condition.left !== 'string' ||
    typeof condition.right !== 'string'
  )
    return null;
  const assigned = (body: CompiledBuffSequenceSource | undefined) => {
    const steps = body === undefined ? [] : graph.actions(body);
    const step = steps[0];
    return steps.length === 1 &&
      step?.kind === 'modifyActionValue' &&
      step.parameters.operation === 'assign' &&
      step.parameters.key.startsWith('EntityBB_') &&
      step.parameters.value.kind === 'constant'
      ? { key: step.parameters.key, value: step.parameters.value.value }
      : null;
  };
  const whenTrue = assigned(branch.whenTrue);
  const whenFalse = assigned(branch.whenFalse);
  if (whenTrue === null || whenFalse === null || whenTrue.key !== whenFalse.key) return null;
  return {
    key: whenTrue.key as `EntityBB_${string}`,
    condition: {
      kind: 'deckAttributeCompare',
      left: condition.left,
      right: condition.right,
      operator: condition.operator,
    },
    trueValue: whenTrue.value,
    falseValue: whenFalse.value,
  };
}

function mergePassiveLevelValues(values: readonly LevelValues[], sourcePath: string): LevelValues {
  if (values.length === 1) return values[0]!;
  if (values.some(Array.isArray)) {
    throw new Error(`${sourcePath}: nested passive level columns are unsupported`);
  }
  return values as readonly number[];
}

function planPassiveSkill(
  request: PassiveSkillCompileRequestSource,
  definitions: ReadonlyMap<string, CompiledPassiveSkillDefinitionSource>,
  gameplayTagRegistry?: GameplayTagRegistry,
  predefinedTagQueries?: CombatActionProjectionContextSource['predefinedTagQueries'],
): PlannedPassiveSkill {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  if (request.activeConditionIds?.length) {
    throw new Error(`${request.sourcePath}: conditioned operator passive SkillData is unsupported`);
  }
  const compiled = definitions.get(request.skillId);
  if (!compiled)
    throw new Error(`${request.sourcePath}: missing passive SkillData ${request.skillId}`);
  const skill = compiled.definition.skill;
  if (
    skill.passiveType !== 'AddBuff' ||
    skill.toggleBuffs.length > 0 ||
    compiled.definition.hasCardAttributeModifiers ||
    skill.actionGraph.actionGroup.timelineActions.some(
      timeline => !isPresentationOnlyActionSequence(timeline.sequence),
    )
  ) {
    throw new Error(`${request.sourcePath}: unsupported operator passive SkillData program`);
  }
  const blackboard = resolvePassiveSkillDefinitionBlackboard(request, compiled);
  const passiveEventContext = {
    graph,
    gameplayTagRegistry,
    predefinedTagQueries,
    actionOwnerTarget: 'caster' as const,
    actionSourceTarget: 'caster' as const,
    actionTargetTarget: 'eventTarget' as const,
    fixedBuffOwnerTarget: 'caster' as const,
  };
  const initializationSequences = skill.actionGraph.actionGroup.passiveEvents
    .filter(event => event.abilityEvent === 'OnCharDeckAttrChanged')
    .flatMap(event =>
      event.actions.map(sequence =>
        compileCombatActionSequenceSource(sequence, passiveEventContext),
      ),
    );
  const abilityEventResponses: NonNullable<
    OperatorPassiveSkillDefinition['abilityEventResponses']
  >[number][] = [];
  skill.actionGraph.actionGroup.passiveEvents.forEach(event => {
    if (
      event.abilityEvent === 'OnAbilityEntityFinished' ||
      event.abilityEvent === 'OnAbilityEntitySpawned' ||
      event.abilityEvent === 'OnAddedBuff' ||
      event.abilityEvent === 'OnObtainAtb' ||
      event.abilityEvent === 'OnReceiveHeal'
    ) {
      const projected = projectAbilityEvent(event.abilityEvent, request.sourcePath);
      if (!isOperatorPassiveAbilityEvent(projected))
        throw new Error(`${request.sourcePath}: unsupported passive ability event mapping`);
      for (const sequence of event.actions) {
        for (const node of collectNativeActionNodes(sequence)) {
          if (
            node.metadata.enabled &&
            (node.metadata.priorityLevel !== 'Default' || node.metadata.priorityOffset !== 0)
          )
            throw new Error(`${node.sourcePath}: unsupported operator passive event priority`);
        }
        abilityEventResponses.push({
          event: projected,
          priority: 0,
          sequence: compileCombatActionSequenceSource(sequence, {
            ...passiveEventContext,
            actionTargetTarget: projected === 'addedBuff' ? 'eventSource' : 'eventTarget',
          }),
        });
      }
      return [];
    }
    // 固定战斗模拟不会退出战斗；该清理只重置角色累计黑板，对本场结果没有可见影响。
    if (event.abilityEvent === 'OnTrulyExitFight') return [];
    // 构筑属性在场景编译前已冻结；原生通知只负责刷新派生角色黑板，因此上方把该响应
    // 放入 enableSequence 执行一次，不创建战斗中永远不会发生的伪事件。
    if (event.abilityEvent === 'OnCharDeckAttrChanged') return [];
    // 固定战斗不会遣返队伍；该分支只清理被动生成实体，不影响本场继续计算。
    if (event.abilityEvent === 'OnSquadRepatriate') return [];
    // Endaxis 的唯一敌人是无主动行为木桩，当前管线也不制造干员受击事件。
    // 庄方宜这类受击前免伤/治疗被动因此在模型内完整无触发机会；保留技能与等级黑板，
    // 但不伪造一个受击入口。若外部事件系统以后支持受击标记，应重新开启该事件并审计载荷。
    if (event.abilityEvent === 'OnBeforeTakeDamage') return [];
    throw new Error(
      `${request.sourcePath}: unsupported operator passive event ${JSON.stringify(event.abilityEvent)}`,
    );
  });
  return {
    key: request.skillId,
    graph,
    ...(request.levelSource.kind === 'operatorSkillGroup'
      ? { levelSource: request.levelSource.levelSource }
      : {}),
    blackboard,
    initializationSequences,
    buffs: skill.startupBuffs.map(buff => {
      const materialized = materializePassiveBuffInstallation(buff, blackboard);
      const assignments: Record<string, LevelValues> = {};
      for (const [key, value] of Object.entries(materialized.blackboardAssignments)) {
        if (!(
          (typeof value === 'number' && Number.isFinite(value)) ||
          (Array.isArray(value) &&
            value.length > 0 &&
            value.every(item => typeof item === 'number' && Number.isFinite(item)))
        )) {
          throw new Error(`${request.sourcePath}: unresolved passive Buff assignment ${key}`);
        }
        assignments[key] = value as LevelValues;
      }
      return { buffId: materialized.buffId, assignments };
    }),
    abilityEventResponses,
  };
}
