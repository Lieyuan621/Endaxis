import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import {
  createActionGraphBuilder,
  type ActionGraphBuilder,
} from '../../compiler/actions/actionGraphBuilder.ts';
import type { LevelValues } from '../../../../../packages/game-data-contract/src/index.ts';
import type {
  EquipmentAbilityEvent,
  EquipmentEventHandlerDefinition,
  WeaponDefinition,
  WeaponTraitDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import { EQUIPMENT_ABILITY_EVENTS } from '../../../../../packages/game-data-contract/src/equipment.ts';
import { buffRuntimeReadsBlackboardKey } from '../../compiler/buffs/buffRuntimeProjection.ts';
import type { CompiledBuffDefinitionSource } from '../../compiler/buffs/buffProjectionTypes.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../../compiler/actions/combatActionProjectionTypes.ts';
import { compileCombatActionSequenceSource } from '../../compiler/buffs/buffRuntimeProjection.ts';
import { compileAbilityEventPrograms } from '../../compiler/abilities/abilityEventProgram.ts';
import { projectAbilityEvent } from '../../compiler/abilities/abilityEventProjection.ts';
import { compileStandardStumpBuffClosure } from '../../compiler/buffs/standardStumpBuffClosure.ts';
import { evaluateStandardStumpFullHealthComparison } from '../../compiler/scenario/standardStumpScenarioPolicy.ts';
import type { BuildDefinitionDiagnosticSource } from '../../compiler/build/formalBuildDefinition.ts';
import type { MaterializedPassiveBuffInstallationSource } from '../../compiler/skills/passiveSkillInstallation.ts';
import type {
  CompiledWeaponStaticDefinitionSource,
  CompiledWeaponTraitRuntimeDependencySource,
} from './staticDefinition.ts';

export interface CompiledWeaponRuntimeDefinitionBatchSource {
  readonly definitions: readonly CompiledWeaponRuntimeDefinitionSource[];
  readonly diagnostics: readonly BuildDefinitionDiagnosticSource[];
}

/** 正式输出的已支持子集；由静态候选补齐行为，不承担优化 IR 职责。 */
export type CompiledWeaponRuntimeDefinitionSource = Omit<
  CompiledWeaponStaticDefinitionSource,
  'traits'
> &
  Readonly<Pick<WeaponDefinition, 'assetSlug' | 'iconPath'>> & {
    readonly buffDefinitions?: Readonly<Record<string, CompiledBuffDefinitionSource>>;
    readonly traits: readonly (CompiledWeaponStaticDefinitionSource['traits'][number] &
      Readonly<Pick<WeaponTraitDefinition, 'blackboard' | 'skillId'>> & {
        readonly actionGraph?: import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphResourceDefinition;
        readonly enableSequence?: CompiledBuffSequenceSource;
        readonly initializationSequence?: CompiledBuffSequenceSource;
        readonly eventHandlers?: readonly CompiledWeaponEventHandlerSource[];
      })[];
  };

export type CompiledWeaponEventHandlerSource = Readonly<
  Required<Pick<EquipmentEventHandlerDefinition, 'key' | 'priority' | 'abilityEvent'>>
> & {
  readonly sequence: CompiledBuffSequenceSource;
};

/**
 * 从一份安装结构与等级参数列装配武器贡献；Buff 蓝图只编译一次。
 * 条件允许随等级切换来源，但场景省略后的最终安装顺序、Buff ID 和参数键必须一致。
 */
export function compileWeaponRuntimeDefinitionBatchSource(
  definitions: readonly CompiledWeaponStaticDefinitionSource[],
  dependencies: readonly CompiledWeaponTraitRuntimeDependencySource[],
  buffDataValue: unknown,
  gameplayTagRegistry?: GameplayTagRegistry,
): CompiledWeaponRuntimeDefinitionBatchSource {
  const diagnostics: BuildDefinitionDiagnosticSource[] = [];
  const dependencyByTrait = new Map(
    dependencies.map(item => [`${item.weaponId}\0${item.traitKey}`, item]),
  );
  const output: CompiledWeaponRuntimeDefinitionSource[] = [];

  for (const definition of definitions) {
    const traitDependencies = definition.traits.map(trait =>
      dependencyByTrait.get(`${definition.slug}\0${trait.key}`),
    );
    if (traitDependencies.some(item => item === undefined)) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `WeaponBasicTable.${definition.slug}`,
        reason: 'missing compiled weapon trait runtime dependency',
      });
      continue;
    }
    const typedDependencies = traitDependencies as CompiledWeaponTraitRuntimeDependencySource[];
    const graphs = typedDependencies.map(() => createActionGraphBuilder<CompiledBuffStepSource>());
    const eventHandlers = typedDependencies.map((dependency, index) => {
      const actionGroup = dependency.actionGraph.actionGroup;
      if (actionGroup.timelineActions.length > 0) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph`,
          reason: 'weapon passive SkillData timeline program is unsupported',
        });
        return [];
      }
      try {
        return compileWeaponEventHandlers(
          dependency,
          diagnostics,
          graphs[index]!,
          gameplayTagRegistry,
        );
      } catch (error) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph`,
          reason: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    });
    const deckInitializations = typedDependencies.map((dependency, index) => {
      try {
        return compileWeaponDeckInitialization(dependency, graphs[index]!, gameplayTagRegistry);
      } catch (error) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph`,
          reason: error instanceof Error ? error.message : String(error),
        });
        return { steps: [] };
      }
    });
    const plans = typedDependencies.map(dependency => compileTraitPlans(dependency, diagnostics));
    if (
      diagnostics.some(
        item => item.status === 'blocked' && item.sourcePath.includes(definition.slug),
      )
    ) {
      continue;
    }
    // 初始化安装不是完整来源图：被动事件创建的 Buff 同样必须进入递归定义闭包。
    const rootIds = [
      ...typedDependencies.flatMap(dependency => dependency.referencedBuffIds),
      ...plans.flatMap(levels => levels.flatMap(level => level.map(item => item.buffId))),
    ];
    const closure = compileStandardStumpBuffClosure(
      [...new Set(rootIds)],
      buffDataValue,
      undefined,
      undefined,
      undefined,
      undefined,
      new Map(),
      new Set(),
      gameplayTagRegistry,
    );
    diagnostics.push(...closure.diagnostics);
    if (closure.diagnostics.some(item => item.status === 'blocked')) continue;

    const traits = definition.traits.map((trait, traitIndex) => {
      const levelPlans = plans[traitIndex]!;
      const activePlans = levelPlans.map(level =>
        level.filter(item => !closure.omittedBuffIds.has(item.buffId)),
      );
      const identity = planIdentity(activePlans[0] ?? []);
      if (activePlans.some(plan => planIdentity(plan) !== identity)) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `WeaponBasicTable.${definition.slug}.${trait.key}`,
          reason: 'weapon trait Buff installation structure changes between levels',
        });
        return trait;
      }
      const blackboard = compileWeaponAbilityBlackboard(typedDependencies[traitIndex]!);
      const steps: CompiledBuffStepSource[] = (activePlans[0] ?? []).map(
        (installation, installationIndex) => {
          const assignments: Record<string, { kind: 'blackboard'; key: string }> = {};
          for (const targetKey of Object.keys(installation.blackboardAssignments).sort()) {
            let key = `install_${installationIndex}_${targetKey}`;
            while (Object.hasOwn(blackboard, key)) key = `_${key}`;
            const values = selectInstallationValues(activePlans, installationIndex, targetKey);
            if (values === null) {
              const source = closure.sources.get(installation.buffId)!;
              const sourcePath = `WeaponBasicTable.${definition.slug}.${trait.key}.${installation.buffId}.${targetKey}`;
              if (buffRuntimeReadsBlackboardKey(source, targetKey)) {
                diagnostics.push({
                  status: 'blocked',
                  sourcePath,
                  reason:
                    'non-numeric or unresolved Buff assignment is required by the installed Buff',
                });
              } else {
                diagnostics.push({
                  status: 'scenario-omitted',
                  sourcePath,
                  reason:
                    'non-numeric or unresolved Buff assignment is never read by the installed Buff',
                });
              }
              continue;
            }
            blackboard[key] = values;
            assignments[targetKey] = { kind: 'blackboard', key };
          }
          return {
            kind: 'applyBuff' as const,
            parameters: {
              buffId: installation.buffId,
              target: 'caster' as const,
              ...(Object.keys(assignments).length === 0
                ? {}
                : { blackboardAssignments: assignments }),
            },
          };
        },
      );
      const enableSteps = steps.filter(
        (_step, index) => activePlans[0]![index]!.phase === 'beforeEnable',
      );
      const initializationSteps = [
        ...steps.filter((_step, index) => activePlans[0]![index]!.phase === 'afterEnable'),
        ...deckInitializations[traitIndex]!.steps,
      ];
      const graph = graphs[traitIndex]!;
      const enableSequence = graph.sequence(enableSteps);
      const initializationSequence = graph.sequence(initializationSteps);
      return {
        ...trait,
        actionGraph: { main: graph.finish(), macros: {} },
        skillId: typedDependencies[traitIndex]!.skillId,
        ...(eventHandlers[traitIndex]!.length === 0
          ? {}
          : { eventHandlers: eventHandlers[traitIndex] }),
        ...(Object.keys(blackboard).length === 0 ? {} : { blackboard }),
        ...(enableSteps.length === 0 ? {} : { enableSequence }),
        ...(initializationSteps.length === 0 ? {} : { initializationSequence }),
      };
    });
    if (
      diagnostics.some(
        item => item.status === 'blocked' && item.sourcePath.includes(definition.slug),
      )
    ) {
      continue;
    }
    output.push({
      ...definition,
      traits,
      ...(Object.keys(closure.definitions).length > 0
        ? { buffDefinitions: closure.definitions }
        : {}),
    });
  }
  return { definitions: output, diagnostics };
}

function compileWeaponEventHandlers(
  dependency: CompiledWeaponTraitRuntimeDependencySource,
  diagnostics: BuildDefinitionDiagnosticSource[],
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
  gameplayTagRegistry?: GameplayTagRegistry,
): CompiledWeaponEventHandlerSource[] {
  const events = dependency.actionGraph.actionGroup.passiveEvents;
  const omittedEvents = new Set<string | number>();
  if (events.some(event => event.abilityEvent === 'OnCharDeckAttrChanged')) {
    // Deck 快照只在构筑刷新时变化；固定战斗把该事件响应编译进开战前初始化程序。
    omittedEvents.add('OnCharDeckAttrChanged');
  }
  if (events.some(event => event.abilityEvent === 'OnSquadTakeDamage')) {
    omittedEvents.add('OnSquadTakeDamage');
    diagnostics.push({
      status: 'scenario-omitted',
      sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph.passiveEventActions`,
      reason: 'fixed stump enemy has no active behavior and cannot produce squad damage events',
    });
  }
  const programs = compileAbilityEventPrograms(events, {
    sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph.passiveEventActions`,
    omitEvent: event => omittedEvents.has(event),
    mapEvent: projectWeaponAbilityEvent,
    compileSequence: sequence =>
      compileCombatActionSequenceSource(sequence, {
        graph,
        gameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'eventTarget',
      }),
    isEmptySequence: sequence => sequence.$sequence === null,
  });
  return programs.map(program => ({
    key: `${dependency.traitKey}:event:${program.sourceEventIndex}:sequence:${program.sourceSequenceIndex}`,
    ...program.event,
    priority: program.priority,
    sequence: program.sequence,
  }));
}

/**
 * 原生 OnCharDeckAttrChanged 发生在非战斗构筑刷新链末尾。Next 的配装在模拟开始后不再变化，
 * 因此保持其动作顺序与 Deck 条件，只把触发边界折叠为面板完成后的单次初始化。
 */
function compileWeaponDeckInitialization(
  dependency: CompiledWeaponTraitRuntimeDependencySource,
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
  gameplayTagRegistry?: GameplayTagRegistry,
): {
  readonly steps: CompiledBuffStepSource[];
} {
  const events = dependency.actionGraph.actionGroup.passiveEvents;
  const programs = compileAbilityEventPrograms(events, {
    sourcePath: `${dependency.weaponId}.${dependency.traitKey}.actionGraph.passiveEventActions`,
    omitEvent: event => event !== 'OnCharDeckAttrChanged',
    mapEvent: (_event, _sourcePath) => 'deckAttributesChanged' as const,
    compileSequence: sequence =>
      compileCombatActionSequenceSource(sequence, {
        graph,
        gameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'eventTarget',
      }),
    isEmptySequence: sequence => sequence.$sequence === null,
  });
  return {
    steps: programs.flatMap(program => graph.actions(program.sequence)),
  };
}

function projectWeaponAbilityEvent(
  event: string | number,
  sourcePath: string,
): { readonly abilityEvent: EquipmentAbilityEvent } {
  const projected = projectAbilityEvent(event, sourcePath);
  const supported = EQUIPMENT_ABILITY_EVENTS.find(candidate => candidate === projected);
  if (supported === undefined) {
    throw new Error(
      `${sourcePath}: unsupported equipment ability event ${JSON.stringify(projected)}`,
    );
  }
  return { abilityEvent: supported };
}

function compileWeaponAbilityBlackboard(
  dependency: CompiledWeaponTraitRuntimeDependencySource,
): Record<string, LevelValues> {
  return Object.fromEntries(
    Object.keys(dependency.blackboard)
      .sort()
      .map(key => {
        const values = dependency.blackboard[key];
        if (!isNumericLevelValues(values, dependency.levels.length)) {
          throw new Error(
            `weapon ability blackboard ${JSON.stringify(key)} is not numeric at every level`,
          );
        }
        return [key, values];
      }),
  );
}

// 编译期身份：相同 Buff/赋值不代表相同安装阶段。Ability.Enable 的普通启动安装
// 在响应启用前，Toggle.DoEnable 的首次安装在响应启用后；不可跨阶段合并。
type PlannedBuffInstallation = MaterializedPassiveBuffInstallationSource<LevelValues> & {
  readonly phase: 'beforeEnable' | 'afterEnable';
};

/**
 * 这里只按真实等级选择安装对象的引用，不复制安装参数或动作图。
 * 必须先保留各档选择，闭包省略后再比较最终计划；不同 Toggle 组可以安装相同结构。
 */
function compileTraitPlans(
  dependency: CompiledWeaponTraitRuntimeDependencySource,
  diagnostics: BuildDefinitionDiagnosticSource[],
): readonly PlannedBuffInstallation[][] {
  return dependency.levels.map((level, levelIndex) => {
    const activeToggleBuffs = dependency.toggleBuffs.flatMap(group => {
      const results = group.conditions.map(condition => {
        const value = Array.isArray(condition.value)
          ? condition.value[levelIndex]
          : condition.value;
        if (typeof value !== 'number' || !Number.isFinite(value)) return null;
        return evaluateStandardStumpFullHealthComparison(condition.comparison, value);
      });
      if (results.some(result => result === null)) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `${dependency.weaponId}.${dependency.traitKey}.level${level}`,
          reason: 'toggle Buff condition requires an unmaterialized server passive skill value',
        });
        return [];
      }
      return results.every(Boolean) ? group.buffs : [];
    });
    return [
      ...dependency.startupBuffs.map(installation => ({
        ...installation,
        phase: 'beforeEnable' as const,
      })),
      ...activeToggleBuffs.map(installation => ({
        ...installation,
        phase: 'afterEnable' as const,
      })),
    ];
  });
}

function planIdentity(plan: readonly PlannedBuffInstallation[]): string {
  return JSON.stringify(
    plan.map(item => [item.phase, item.buffId, Object.keys(item.blackboardAssignments).sort()]),
  );
}

/**
 * 不变的安装参数直接沿用原单值/列；只有不同等级选中了不同参数来源，才逐档取值形成结果列。
 * 例如两组 Toggle 交替安装同一个 Buff，输入列分别为 A/B，结果应为 [A[0], B[1]]，
 * 不能只拿首组，也不能把所有原组都安装进去。
 */
function selectInstallationValues(
  plans: readonly (readonly PlannedBuffInstallation[])[],
  installationIndex: number,
  targetKey: string,
): LevelValues | null {
  const first = plans[0]![installationIndex]!.blackboardAssignments[targetKey];
  if (plans.every(plan => plan[installationIndex]!.blackboardAssignments[targetKey] === first)) {
    return isNumericLevelValues(first, plans.length) ? first : null;
  }
  const selected = plans.map((plan, levelIndex) => {
    const value = plan[installationIndex]!.blackboardAssignments[targetKey];
    return Array.isArray(value) ? value[levelIndex] : value;
  });
  return isNumericLevelValues(selected, plans.length) ? selected : null;
}

/** 本阶段只校验已绑定的数字参数及其轴长度，不代替完整生成定义 validator。 */
function isNumericLevelValues(value: unknown, levelCount: number): value is LevelValues {
  return typeof value === 'number'
    ? Number.isFinite(value)
    : Array.isArray(value) &&
        value.length === levelCount &&
        value.length > 0 &&
        value.every(item => typeof item === 'number' && Number.isFinite(item));
}
