import { compileCommonDefinitionSources } from './compileCommonDefinitionSources';
/**
 * 将场景的时间轴、初始资源和应用层提供的运行环境组合成运行时装配参数。
 *
 * 本模块是纯编译边界：场景拥有的数据只交给对应编译器解释，敌人、实体容器和操作执行器
 * 由调用方显式注入。调用方可以把返回值直接交给 `CombatRuntimeAssembly`，但不得把这里当作
 * 缺失规则的默认值来源。
 */
import { compareCombatNumbers } from '../mechanics/combatNumbers.ts';
import type {
  CombatOperatorProgram,
  CombatRuntimeAssemblyOptions,
  CombatRuntimeEnvironmentOptions,
  CombatSkillCastProgram,
} from '../combat/runtime/combatRuntimeAssembly';
import { isOperatorControlledAt } from '../combat/skills/operatorControlTimeline';
import type {
  ScheduledDodgeInput,
  ScheduledExternalCombatEventInput,
} from '../combat/state/environmentState';
import type { GameDataRepository } from '../game-data/gameDataRepository';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import {
  compileMechanics,
  MechanicAdapterRegistry,
  type CompiledMechanics,
} from '../mechanics/mechanicCompiler';
import { resolveControlTimeline } from '../project/resolveControlTimeline';
import type { ScenarioDocument } from '../project/schema';
import { resolveScenarioInitialFrame } from '../project/skillCastPlacement';
import { applyMechanicsToScenarioEnemy, compileScenarioEnemy } from './compileScenarioEnemy';
import { compileResolvedScenarioEquipment } from './compileScenarioEquipment';
import {
  compileScenarioResources,
  type CompileScenarioResourcesOptions,
} from './compileScenarioResources';
import {
  compileOperatorDefinitionSkills,
  compileOperatorSkillCastPrograms,
  compileResolvedScenarioTimeline,
} from './compileScenarioTimeline';
import type { ResolvedOperatorPanel } from './resolveOperatorPanel';
import { resolveScenarioOperatorPanels } from './resolveOperatorPanel';
import { compileGlobalModifiers } from './compileGlobalModifiers';
import { resolveScenarioBuilds } from './resolveScenarioBuilds';
import { resolveScenarioOperatorResourceRules } from './resolveScenarioResourceRules';

export type ScenarioRuntimeBuildIndex = Pick<
  GameDataRepository,
  'getOperator' | 'getWeapon' | 'getGear' | 'getGearSet'
> &
  Required<Pick<GameDataRepository, 'actionPrograms' | 'getCommonDefinitionSources'>> &
  Partial<
    Pick<
      GameDataRepository,
      | 'getCommonBuffDefinitions'
      | 'getCommonAbilityEntityDefinitions'
      | 'getMechanic'
      | 'getConsumable'
      | 'getConsumables'
    >
  >;

/**
 * 已编译技能之外、单个干员进入战斗所需的可变运行时依赖。
 * 只需列出确实存在额外实体运行时的干员；未提供的可选端口仍由运行时在实际使用处严格检查。
 */
export type CombatOperatorRuntimeBindings = Pick<
  CombatOperatorProgram,
  'buffRuntime' | 'statusContainer' | 'actionRuntime'
>;

export type { CombatRuntimeEnvironmentOptions } from '../combat/runtime/combatRuntimeAssembly';

/** 编译完整运行时装配参数所需的显式依赖。 */
export interface CompileScenarioRuntimeAssemblyOptions {
  /** 逐帧会话只编译构筑与固定定义；人工输入由调用方在此起点之后提交。 */
  readonly liveInputInitialFrame?: number;
  readonly index: ScenarioRuntimeBuildIndex;
  readonly resources: Omit<CompileScenarioResourcesOptions, 'operators'>;
  readonly environment: CombatRuntimeEnvironmentOptions;
  /** 以 `OperatorInstanceDocument.id` 为键，不接受未上场干员。 */
  readonly operatorRuntimeBindings?: ReadonlyMap<string, CombatOperatorRuntimeBindings>;
  /** 只有场景实际选择机制时才要求对应 family 的数据适配器。 */
  readonly mechanicAdapters?: MechanicAdapterRegistry;
}

type CompileScenarioMechanicsOptions = {
  readonly index: Pick<ScenarioRuntimeBuildIndex, 'getMechanic'>;
  readonly mechanicAdapters?: MechanicAdapterRegistry;
};

/** 供所有场景入口复用的机制定义解析；环境尚未创建时也可安全调用。 */
export function compileScenarioMechanics(
  scenario: ScenarioDocument,
  options: CompileScenarioMechanicsOptions,
): CompiledMechanics {
  return compileMechanics(
    scenario.mechanics,
    {
      getMechanic: id => options.index.getMechanic?.(id) ?? null,
    },
    options.mechanicAdapters ?? new MechanicAdapterRegistry(),
  );
}

export function compileOperatorEntityBlackboardInitialValues(
  operator: OperatorDefinition,
  panel: ResolvedOperatorPanel,
): Readonly<Record<string, number | string>> {
  const initializers = operator.entityBlackboardInitializers ?? [];
  if (
    operator.entityBlackboard !== undefined &&
    (operator.entityBlackboard === null ||
      typeof operator.entityBlackboard !== 'object' ||
      Array.isArray(operator.entityBlackboard))
  ) {
    throw new TypeError(`operator '${operator.slug}'.entityBlackboard must be a value record`);
  }
  const panelValues = {
    level: panel.level,
    // StoreAttributeValue(MaxHp/FinalNonConverted) 与四维使用同一静态面板投影；
    // 动作执行时从实体黑板读取，不能在生成期烘焙具体构筑数值。
    maxHealth: Math.fround(panel.health),
    strength: Math.fround(panel.attributes.strength),
    agility: Math.fround(panel.attributes.agility),
    intellect: Math.fround(panel.attributes.intellect),
    will: Math.fround(panel.attributes.will),
  };
  for (const [key, value] of Object.entries(operator.entityBlackboard ?? {})) {
    if (key.length === 0 || Object.hasOwn(panelValues, key)) {
      throw new Error(
        `operator '${operator.slug}'.entityBlackboard has empty or reserved key '${key}'`,
      );
    }
    if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new TypeError(
        `operator '${operator.slug}'.entityBlackboard.${key} must be a finite number or string`,
      );
    }
  }
  const values: Record<string, number | string> = { ...panelValues, ...operator.entityBlackboard };
  const initialized = new Set<string>();
  for (const [index, initializer] of initializers.entries()) {
    if (!initializer.key.startsWith('EntityBB_') || initializer.key.length === 9) {
      throw new Error(
        `operator '${operator.slug}'.entityBlackboardInitializers[${index}].key must be a non-empty EntityBB_ key`,
      );
    }
    if (initialized.has(initializer.key)) {
      throw new Error(
        `operator '${operator.slug}' duplicates entity blackboard initializer '${initializer.key}'`,
      );
    }
    initialized.add(initializer.key);
    const condition = initializer.condition;
    const matched = compareCombatNumbers(
      panel.attributes[condition.left],
      panel.attributes[condition.right],
      condition.operator,
    );
    const value = matched ? initializer.trueValue : initializer.falseValue;
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `operator '${operator.slug}'.entityBlackboardInitializers[${index}] resolved a non-finite value`,
      );
    }
    // 模板初值先安装，后续 Deck 派生写入可覆盖；不能把这类写入误判为重复模板键。
    values[initializer.key] = Math.fround(value);
  }
  return values;
}

/**
 * 编译逐帧输入实际需要的自定义技能块程序。
 * 返回值属于外部输入计划；创建战斗会话时不会把这些尚未提交的释放装进运行时。
 */
export function compileScenarioCustomSkillCastPrograms(
  scenario: ScenarioDocument,
  index: ScenarioRuntimeBuildIndex,
): readonly CombatSkillCastProgram[] {
  const builds = resolveScenarioBuilds(scenario, index);
  const importsForLevel = compileCommonDefinitionSources(
    index.getCommonDefinitionSources(),
    index.actionPrograms,
  ).importsForLevel;
  const panels = new Map(
    resolveScenarioOperatorPanels(builds).map(panel => [panel.operatorId, panel]),
  );
  return builds.flatMap(build => {
    const casts = build.track.skillCasts.filter(cast => cast.customDefinition !== undefined);
    if (casts.length === 0) return [];
    const panel = panels.get(build.track.id);
    if (panel === undefined) throw new Error('missing operator panel: ' + build.track.id);
    return compileOperatorSkillCastPrograms(
      build.track.id,
      casts,
      build.operatorInstance,
      build.operator,
      index.getCommonAbilityEntityDefinitions?.(),
      panel.attributes,
      index.actionPrograms,
      importsForLevel,
    );
  });
}

/** 把轨道引用解析为本场稳定干员实例；不为缺席轨道制造虚拟受击者。 */
export function compileScenarioExternalEventInputs(
  scenario: ScenarioDocument,
): readonly ScheduledExternalCombatEventInput[] {
  const activeOperatorIds = scenario.tracks.flatMap(track => (track === null ? [] : [track.id]));
  return (scenario.battle.externalEventMarkers ?? [])
    .map((marker, order) => {
      let targetOperatorIds: readonly string[];
      if (marker.target.scope === 'team') {
        targetOperatorIds = activeOperatorIds;
      } else {
        const track = scenario.tracks[marker.target.trackIndex];
        if (track == null) {
          throw new Error(
            `external event marker '${marker.id}' references empty track ${marker.target.trackIndex}`,
          );
        }
        targetOperatorIds = [track.id];
      }
      if (targetOperatorIds.length === 0) {
        throw new Error(`external event marker '${marker.id}' has no active operator target`);
      }
      return {
        frame: marker.frame,
        targetOperatorIds,
        event: { kind: marker.event.kind, mode: marker.event.mode },
        order,
      };
    })
    .sort((left, right) => left.frame - right.frame || left.order - right.order)
    .map(({ order: _order, ...input }) => input);
}

/**
 * 把一个闪避标签拆成原生执行顺序中的输入事实。极限闪避先进入 Dash，成功事实随后到达；
 * 同帧时也保持这个顺序，避免成功声明观察到尚未开始的 Dash。
 */
export function compileScenarioDodgeInputs(
  scenario: ScenarioDocument,
): readonly ScheduledDodgeInput[] {
  return (scenario.battle.dodgeMarkers ?? [])
    .flatMap((marker, declarationOrder) => {
      const track = scenario.tracks[marker.trackIndex];
      if (track === null) {
        throw new Error(`dodge marker '${marker.id}' references empty track ${marker.trackIndex}`);
      }
      const dash: ScheduledDodgeInput & { readonly declarationOrder: number; readonly phase: 0 } = {
        kind: 'dash',
        frame: marker.frame,
        dodgeId: marker.id,
        operatorId: track.id,
        direction: marker.direction,
        declarationOrder,
        phase: 0,
      };
      if (marker.mode.kind === 'dodge') return [dash];
      const successFrame = marker.frame + marker.mode.successDelayFrames;
      if (!Number.isSafeInteger(successFrame)) {
        throw new RangeError(`dodge marker '${marker.id}' success frame must be a safe integer`);
      }
      return [
        dash,
        {
          kind: 'perfectDodgeSuccess' as const,
          frame: successFrame,
          dodgeId: marker.id,
          operatorId: track.id,
          declarationOrder,
          phase: 1 as const,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.frame - right.frame ||
        left.phase - right.phase ||
        left.declarationOrder - right.declarationOrder,
    )
    .map(({ declarationOrder: _declarationOrder, phase: _phase, ...input }) => input);
}

function bindOperatorRuntimes(
  operators: readonly CombatOperatorProgram[],
  bindings: ReadonlyMap<string, CombatOperatorRuntimeBindings> | undefined,
): readonly CombatOperatorProgram[] {
  if (bindings === undefined) return operators;
  const activeOperatorIds = new Set(operators.map(operator => operator.operatorId));
  for (const operatorId of bindings.keys()) {
    if (!activeOperatorIds.has(operatorId)) {
      throw new Error(`runtime bindings reference inactive operator build '${operatorId}'`);
    }
  }

  return operators.map(operator => {
    const runtime = bindings.get(operator.operatorId);
    if (runtime === undefined) return operator;
    // 身份与技能程序始终以编译结果为准，运行环境只能补充实体级运行时对象。
    return { ...runtime, ...operator };
  });
}

/**
 * 编译可直接传给 `CombatRuntimeAssembly` 的完整参数对象。
 * 子编译器的限制会原样向上传播：场景继承、养成效果或逐次技能编辑还没做通时必定失败。
 */
export function compileScenarioRuntimeAssembly(
  scenario: ScenarioDocument,
  options: CompileScenarioRuntimeAssemblyOptions,
): CombatRuntimeAssemblyOptions {
  if (
    options.liveInputInitialFrame !== undefined &&
    (!Number.isSafeInteger(options.liveInputInitialFrame) ||
      options.liveInputInitialFrame < -scenario.battle.prepFrames ||
      options.liveInputInitialFrame > 0)
  ) {
    throw new RangeError(
      'live input initial frame must be between the preparation start and frame zero',
    );
  }
  const mechanics = compileScenarioMechanics(scenario, options);
  const globalModifiers = compileGlobalModifiers(
    scenario.globalConfig,
    options.index.actionPrograms,
  );
  const mechanicInitializations = mechanics.contributions.flatMap(entry =>
    entry.contribution.kind === 'battleInitializationSequence'
      ? [{ ...entry, contribution: entry.contribution }]
      : [],
  );
  const unsupportedMechanicContribution = mechanics.contributions.find(
    entry =>
      entry.contribution.kind !== 'battleInitializationSequence' &&
      entry.contribution.kind !== 'enemyProgramStatMultiplier',
  );
  if (unsupportedMechanicContribution !== undefined) {
    throw new Error(
      `mechanic '${unsupportedMechanicContribution.mechanicId}' produced an event contribution before scenario event installation is assembled`,
    );
  }
  const builds = resolveScenarioBuilds(scenario, options.index);
  const commonDefinitionSources = options.index.getCommonDefinitionSources();
  const commonDefinitions = options.index.getCommonAbilityEntityDefinitions?.();
  const compiledCommonDefinitions = compileCommonDefinitionSources(
    commonDefinitionSources,
    options.index.actionPrograms,
  );
  const importsForLevel = compiledCommonDefinitions.importsForLevel;
  const timelineBuilds =
    options.liveInputInitialFrame === undefined
      ? builds
      : builds.map(build => ({ ...build, track: { ...build.track, skillCasts: [] } }));
  const timeline = compileResolvedScenarioTimeline(timelineBuilds, commonDefinitions, {
    programs: options.index.actionPrograms,
    commonDefinitionSources,
    compiledCommonDefinitions,
    importsForLevel,
  });
  const panels = new Map(
    resolveScenarioOperatorPanels(builds).map(panel => [panel.operatorId, panel]),
  );
  const equipment = new Map(
    compileResolvedScenarioEquipment(builds, options.index.actionPrograms).map(entry => [
      entry.operatorId,
      entry,
    ]),
  );
  // 资源和常驻槽位共用同一次完整定义编译；绝不把这些动作安装成虚构的技能块。
  const definitionPrograms = new Map(
    builds.map(build => {
      const operatorId = build.track.id;
      const panel = panels.get(operatorId);
      if (panel === undefined) throw new Error(`operator '${operatorId}' has no resolved panel`);
      return [
        operatorId,
        compileOperatorDefinitionSkills(
          operatorId,
          build.operatorInstance,
          build.operator,
          commonDefinitions,
          panel.attributes,
          options.index.actionPrograms,
          importsForLevel,
        ),
      ] as const;
    }),
  );
  const resources = compileScenarioResources(scenario, {
    ...options.resources,
    // 资源规则与放置无关：maxUltimateEnergy 来自定义全部技能（已应用养成补丁）的费用。
    operators: resolveScenarioOperatorResourceRules(
      timeline.operators.map(operator => {
        const build = builds.find(candidate => candidate.track.id === operator.operatorId);
        if (build === undefined) {
          throw new Error(
            `timeline operator '${operator.operatorId}' has no resolved operator build`,
          );
        }
        const panel = panels.get(operator.operatorId);
        if (panel === undefined) {
          throw new Error(
            `timeline operator '${operator.operatorId}' has no resolved operator panel`,
          );
        }
        return {
          operatorId: operator.operatorId,
          skills: definitionPrograms.get(operator.operatorId)!,
        };
      }),
      [...panels.values()],
    ),
  });
  const operators = bindOperatorRuntimes(
    timeline.operators.map((operator, operatorIndex) => {
      const build = builds.find(candidate => candidate.track.id === operator.operatorId);
      const panel = panels.get(operator.operatorId);
      if (build === undefined || panel === undefined) {
        throw new Error(`timeline operator '${operator.operatorId}' has no resolved build panel`);
      }
      const compiledEquipment = equipment.get(operator.operatorId);
      const equipmentContributions = compiledEquipment?.contributions ?? [];
      const equipmentBuffDefinitions = mergeEquipmentBuffDefinitions(
        operator.operatorId,
        { ...operator.buffDefinitions, ...globalModifiers.buffDefinitions },
        equipmentContributions,
        compiledEquipment?.buffDefinitions,
      );
      const equipmentInitializationPrograms = equipmentContributions.flatMap(
        (contribution, contributionIndex) => {
          const anchor =
            contribution.initializationSequence ??
            contribution.enableSequence ??
            contribution.eventHandlers[0]?.sequence;
          if (anchor === undefined) return [];
          return [
            {
              key: equipmentContributionKey(contribution),
              equipmentContributionIndex: contributionIndex,
              ...(contribution.enableSequence === undefined
                ? {}
                : { enableSequence: contribution.enableSequence }),
              sequence: contribution.initializationSequence ?? {
                graph: anchor.graph,
                entry: null,
                callSite: `equipment:${equipmentContributionKey(contribution)}:initialization`,
              },
            },
          ];
        },
      );
      return {
        ...operator,
        definitionSkillPrograms: definitionPrograms.get(operator.operatorId)!,
        ...(build.operator.dodgeSkill === undefined
          ? {}
          : {
              dodgeProgram: {
                skillId: build.operator.dodgeSkill.key,
                dashBuffs: build.operator.dashBuffs ?? [],
              },
            }),
        skillCooldownPrograms: definitionPrograms.get(operator.operatorId)!.map(program => ({
          operatorId: program.operatorId,
          skillGroupKey: program.skillGroupKey,
          skillId: program.skillId,
          skillType: program.skillType,
          ...(program.executionSkillId === undefined
            ? {}
            : { executionSkillId: program.executionSkillId }),
          ...(program.nativeSkillType === undefined
            ? {}
            : { nativeSkillType: program.nativeSkillType }),
          ...(program.cooldownFrames === undefined
            ? {}
            : { cooldownFrames: program.cooldownFrames }),
          ...(program.costFrame === undefined ? {} : { costFrame: program.costFrame }),
        })),
        characterTypeId: build.operator.element,
        operatorRole: build.operator.role,
        ...(Object.keys(equipmentBuffDefinitions).length === 0
          ? {}
          : { buffDefinitions: equipmentBuffDefinitions }),
        initializationPrograms: [
          ...(operatorIndex === 0 ? globalModifiers.initializationPrograms : []),
          ...(operator.initializationPrograms ?? []),
          ...equipmentInitializationPrograms,
          ...(operatorIndex === 0
            ? mechanicInitializations.map(entry => ({
                key: `mechanic:${entry.selectionId}:${entry.contributionIndex}`,
                initialBlackboard: {},
                sequence: entry.contribution.sequence,
              }))
            : []),
        ],
        panel,
        initialEntityBlackboard: compileOperatorEntityBlackboardInitialValues(
          build.operator,
          panel,
        ),
        equipmentContributions,
      };
    }),
    options.operatorRuntimeBindings,
  );
  // 准备区只是可编辑范围，不应让空白负时间凭空推进资源恢复和 Buff 计时。
  // 只有确实放置了负帧技能时，战斗运行时才从最早的输入帧启动。
  const initialFrame = options.liveInputInitialFrame ?? resolveScenarioInitialFrame(scenario);
  const controlTimeline = resolveControlTimeline(
    scenario.tracks,
    options.liveInputInitialFrame === undefined ? scenario.battle.controlSwitches : [],
    initialFrame,
  );
  const initialControlledOperatorId =
    scenario.tracks.find(
      track => track !== null && isOperatorControlledAt(controlTimeline, track.id, initialFrame),
    )?.id ?? null;

  return {
    ...options.environment,
    initialFrame,
    initialControlledOperatorId,
    ...(options.liveInputInitialFrame === undefined ? {} : { deferInitialInput: true }),
    resources,
    enemy: applyMechanicsToScenarioEnemy(compileScenarioEnemy(scenario.enemy), mechanics),
    operators,
    consumables: options.index.getConsumables?.() ?? [],
    consumableUses:
      options.liveInputInitialFrame === undefined
        ? scenario.tracks.flatMap(track =>
            track === null
              ? []
              : (track.consumableUses ?? []).map(use => ({
                  frame: use.frame,
                  useId: use.id,
                  operatorId: track.id,
                  consumableId: use.consumableId,
                })),
          )
        : [],
    inputs: timeline.inputs,
    ...(timeline.skillInputGroups === undefined
      ? {}
      : { skillInputGroups: timeline.skillInputGroups }),
    externalEvents:
      options.liveInputInitialFrame === undefined
        ? compileScenarioExternalEventInputs(scenario)
        : [],
    dodgeInputs:
      options.liveInputInitialFrame === undefined ? compileScenarioDodgeInputs(scenario) : [],
    isOperatorControlled: (operatorId, frame) =>
      isOperatorControlledAt(controlTimeline, operatorId, frame),
  };
}

function mergeEquipmentBuffDefinitions(
  operatorId: string,
  existing: NonNullable<CombatOperatorProgram['buffDefinitions']>,
  contributions: readonly import('./compileEquipment').CompiledEquipmentContribution[],
  weaponBuffs: CombatOperatorProgram['buffDefinitions'],
): NonNullable<CombatOperatorProgram['buffDefinitions']> {
  const merged = { ...existing };
  const collections = [
    { key: 'weapon', definitions: weaponBuffs },
    ...contributions.map(contribution => ({
      key: equipmentContributionKey(contribution),
      definitions: contribution.buffDefinitions,
    })),
  ];
  for (const collection of collections) {
    for (const [buffId, definition] of Object.entries(collection.definitions ?? {})) {
      if (buffId in merged) {
        throw new Error(
          `operator '${operatorId}' equipment '${collection.key}' duplicates Buff definition '${buffId}'`,
        );
      }
      merged[buffId] = definition;
    }
  }
  return merged;
}

function equipmentContributionKey(
  contribution: import('./compileEquipment').CompiledEquipmentContribution,
): string {
  const source = contribution.source;
  switch (source.kind) {
    case 'gearSet':
      return `gear-set:${source.slug}`;
    case 'gearTrait':
      return `gear-trait:${source.slug}:${source.traitKey}`;
    case 'weaponTrait':
      return `weapon-trait:${source.slug}:${source.traitKey}`;
  }
}
