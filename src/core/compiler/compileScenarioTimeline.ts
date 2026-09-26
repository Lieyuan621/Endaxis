import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type {
  ActionGraphDefinitionRepository,
  ImportedAbilityEntityDefinitions,
} from './actionGraphDefinitionRepository';
/**
 * 把项目中的干员轨道和技能释放位置编译为战斗运行时可直接装配的程序与输入。
 *
 * 每个技能块先选定技能模板或自定义技能定义，再通过 `compileSkill` 编译；
 * 不再从存档快照读取时间轴。`disabled` 从 `presentation` 读取。
 * 基于干员模板的完整 `customDefinition` 会直接参与编译；只有不携带战斗定义的自由展示块失败。
 */
import type { SkillInputGroup } from '../combat/runtime/combatInputRuntime';
import type {
  CombatOperatorProgram,
  CombatSkillCastProgram,
} from '../combat/runtime/combatRuntimeAssembly';
import type { ScheduledSkillInput } from '../combat/state/environmentState';
import type { CommonDefinitionSource } from '../game-data/gameDataRepository';
import type {
  OperatorAttribute,
  OperatorDefinition,
  SkillType,
} from '../game-data/operatorDefinition';
import {
  listOperatorSkillDefinitionBindings,
  listSkillGroupDefinitionBindings,
} from '../game-data/operatorSkillDefinitions';
import { resolveUniquePlayerActionForSkill } from '../game-data/resolvePlayerActionRoute';
import type {
  OperatorInstanceDocument,
  ScenarioDocument,
  SkillCastDocument,
} from '../project/schema';
import { getSkillCastPlacementChains } from '../project/skillCastPlacement';
import type { CompiledSkillProgram, CompiledSkillSlotGroup } from './combatProgram';
import { createIndependentAbilityEntityImportResolver } from './compileCommonAbilityEntityImports';
import { compileCommonDefinitionSources } from './compileCommonDefinitionSources';
import { compileOperatorComboSkillConditions } from './compileOperatorComboSkillConditions';
import {
  applyOperatorUpgradeSkillPatches,
  compileOperatorInitializationPrograms,
  compileOperatorPassivePrograms,
  compileOperatorReactionModifiers,
  compileOperatorUpgradeEventPrograms,
  resolveActiveOperatorUpgrades,
} from './compileOperatorUpgrades';
import { compileIndependentBuffResource, compileSkill } from './compileSkill';
import { resolveOperatorPanel } from './resolveOperatorPanel';
import type { ResolvedScenarioBuild } from './resolveScenarioBuilds';
import {
  resolveEffectiveSkillDefinition,
  type ResolvedSkillDefinition,
} from './resolveSkillDefinition';

interface SkillCompilationBinding {
  readonly skill: SkillDefinition;
  readonly skillType: SkillType;
  readonly level: number;
  readonly executionSkillGroupKey?: string;
  readonly executionSkillId?: string;
}

function graphSpawnsEntity(graph: ActionGraphResourceDefinition): boolean {
  const pending: object[] = [graph];
  const visited = new WeakSet<object>();
  while (pending.length) {
    const value = pending.pop()!;
    if (visited.has(value)) continue;
    visited.add(value);
    if ('kind' in value && value.kind === 'spawnAbilityEntity') return true;
    // 外部回调、实体子技能和 Buff 自有图也可能生成实体，必须带上其依赖目录。
    for (const child of Object.values(value))
      if (child !== null && typeof child === 'object') pending.push(child);
  }
  return false;
}

function createOperatorSkillCompiler(
  abilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  programs: ActionGraphDefinitionRepository,
  importsForLevel?: (level: number) => ImportedAbilityEntityDefinitions,
  localEntitiesForLevelOverride?: (level: number) => ImportedAbilityEntityDefinitions,
) {
  const skillImportsByLevel = new Map<number, ImportedAbilityEntityDefinitions>();
  const localEntitiesForLevel =
    localEntitiesForLevelOverride ??
    createIndependentAbilityEntityImportResolver(
      abilityEntityDefinitions ?? {},
      programs,
      importsForLevel,
    );
  const resolveSkillImports = (level: number): ImportedAbilityEntityDefinitions => {
    const cached = skillImportsByLevel.get(level);
    if (cached) return cached;
    const imports = { ...importsForLevel?.(level), ...localEntitiesForLevel(level) };
    skillImportsByLevel.set(level, imports);
    return imports;
  };
  return (input: {
    operatorId: string;
    skillGroupKey: string;
    skillType: SkillType;
    skillLevel: number;
    skill: SkillDefinition;
  }): CompiledSkillProgram =>
    compileSkill({
      ...input,
      programs,
      importedAbilityEntityDefinitions: graphSpawnsEntity(input.skill.actionGraph)
        ? resolveSkillImports(input.skillLevel)
        : importsForLevel?.(input.skillLevel),
    });
}

/** 只解析本次操作身份及参数；固定技能定义的编译与输入帧无关。 */
export function compileSkillCastPlayerInput(
  operatorId: string,
  cast: SkillCastDocument,
  operator: OperatorDefinition,
  frame: number,
): ScheduledSkillInput {
  if (cast.source.kind === 'custom') {
    throw new Error(
      `skill cast '${cast.id}' is a presentation-only custom action without a SkillDefinition`,
    );
  }
  const resolved = resolveEffectiveSkillDefinition(cast, operator);
  const action =
    cast.source.action ?? resolveUniquePlayerActionForSkill(operator, resolved.definition.key);
  return {
    frame,
    operatorId,
    skillId: resolved.definition.key,
    ...(action === undefined ? {} : { action }),
    castId: cast.id,
    ...(cast.simulationInputs === undefined
      ? {}
      : { simulationInputs: structuredClone(cast.simulationInputs) }),
  };
}

/** 场景时间轴进入运行时装配前的纯编译结果，不包含任何可变战斗状态。 */
export interface CompiledScenarioTimeline {
  readonly operators: readonly CombatOperatorProgram[];
  readonly inputs: readonly ScheduledSkillInput[];
  readonly skillInputGroups?: readonly SkillInputGroup[];
}

interface GraphOperatorIndex {
  readonly actionPrograms: ActionGraphDefinitionRepository;
  getOperator(slug: string): OperatorDefinition | null;
  getCommonAbilityEntityDefinitions?(): OperatorDefinition['abilityEntityDefinitions'];
  getCommonDefinitionSources(): readonly CommonDefinitionSource[];
}

function requireOperator(
  build: OperatorInstanceDocument,
  index: GraphOperatorIndex,
): OperatorDefinition {
  const operator = index.getOperator(build.operatorSlug);
  if (operator === null) {
    throw new Error(`operator definition '${build.operatorSlug}' does not exist`);
  }
  return operator;
}

function requireSkillLevel(build: OperatorInstanceDocument, levelSource: string): number {
  const level = build.skillLevels[levelSource];
  if (level === undefined) {
    throw new Error(`operator '${build.operatorSlug}' has no '${levelSource}' skill level`);
  }
  return level;
}

function requireDefinitionSkillType(
  skill: Pick<SkillDefinition, 'skillType'>,
  path: string,
): SkillType {
  if (skill.skillType === undefined) throw new Error(`${path} has no per-skill combat type`);
  return skill.skillType;
}

function requireDefinitionLevelSource(
  skill: Pick<SkillDefinition, 'levelSource' | 'key'>,
  operatorSlug: string,
) {
  if (skill.levelSource === undefined) {
    throw new Error(
      `operator '${operatorSlug}' skill '${skill.key}' has no per-skill level source`,
    );
  }
  return skill.levelSource;
}

/** 编译一次技能释放，并把时间轴块身份与不含身份的技能程序显式绑定。 */
function compileCastSkillPrograms(
  trackId: string,
  cast: SkillCastDocument,
  resolved: ResolvedSkillDefinition,
  level: number,
  compileDefinition: ReturnType<typeof createOperatorSkillCompiler>,
  operator?: OperatorDefinition,
  build?: OperatorInstanceDocument,
): readonly CombatSkillCastProgram[] {
  const definition = resolved.definition;
  const routed = resolved.group.routedReplacementSkills?.find(
    replacement => replacement.skill.key === definition.key,
  );
  // 换入释放用执行体图编译动作程序（节点身份前缀为 executionSkillKey），
  // 包装器只保留释放身份、费用与冷却；二者在生成数据中图内容一致。
  // 执行体缺失（如自定义干员的滞后元数据）时回退到包装器自身的图。
  const executionDefinition =
    routed === undefined || operator === undefined || build === undefined
      ? undefined
      : listOperatorSkillDefinitionBindings(operator)
          .map(binding => binding.skill)
          .find(skill => skill.key === routed.executionSkillKey);
  const definitions: SkillCompilationBinding[] = [
    {
      skill: definition,
      skillType: requireDefinitionSkillType(
        definition,
        `operator '${resolved.group.key}' skill '${definition.key}'`,
      ),
      level,
      ...(routed === undefined
        ? {}
        : {
            executionSkillGroupKey: routed.executionSkillGroupKey,
            executionSkillId: routed.executionSkillKey,
          }),
    },
  ];
  return definitions.map(
    ({ skill, skillType, level: definitionLevel, executionSkillGroupKey, executionSkillId }) => {
      const wrapperProgram = compileDefinition({
        operatorId: trackId,
        skillGroupKey: resolved.group.key,
        skillType,
        skillLevel: definitionLevel,
        skill,
      });
      if (executionSkillId === undefined || executionDefinition === undefined) {
        return {
          castId: cast.id,
          program: {
            ...wrapperProgram,
            ...(executionSkillGroupKey === undefined
              ? {}
              : { executionSkillGroupKey, executionSkillId }),
          },
        };
      }
      const bodyProgram = compileDefinition({
        operatorId: trackId,
        skillGroupKey: executionSkillGroupKey!,
        skillType: requireDefinitionSkillType(
          executionDefinition,
          `operator '${operator!.slug}' skill '${executionDefinition.key}'`,
        ),
        skillLevel: requireSkillLevel(build!, routed!.levelSource),
        skill: executionDefinition,
      });
      return {
        castId: cast.id,
        program: {
          ...bodyProgram,
          skillId: wrapperProgram.skillId,
          skillGroupKey: wrapperProgram.skillGroupKey,
          skillType: wrapperProgram.skillType,
          costs: wrapperProgram.costs,
          ...(wrapperProgram.costFrame === undefined
            ? {}
            : { costFrame: wrapperProgram.costFrame }),
          ...(wrapperProgram.cooldownFrames === undefined
            ? {}
            : { cooldownFrames: wrapperProgram.cooldownFrames }),
          executionSkillGroupKey,
          executionSkillId,
        },
      };
    },
  );
}

function compileCastBindings(
  trackId: string,
  casts: readonly SkillCastDocument[],
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
  abilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  buildAttributes: Readonly<Record<OperatorAttribute, number>> | undefined,
  programs: ActionGraphDefinitionRepository,
  importsForLevel?: (level: number) => ImportedAbilityEntityDefinitions,
  localEntitiesForLevel?: (level: number) => ImportedAbilityEntityDefinitions,
): readonly CombatSkillCastProgram[] {
  const compileDefinition = createOperatorSkillCompiler(
    abilityEntityDefinitions,
    programs,
    importsForLevel,
    localEntitiesForLevel,
  );
  const bindings = casts.flatMap(cast => {
    if (cast.presentation?.disabled) return [];
    if (cast.source.kind === 'custom') {
      throw new Error(
        `skill cast '${cast.id}' is a presentation-only custom action without a SkillDefinition`,
      );
    }
    const resolved = resolveEffectiveSkillDefinition(cast, operator);
    return compileCastSkillPrograms(
      trackId,
      cast,
      resolved,
      requireSkillLevel(build, resolved.levelSource),
      compileDefinition,
      operator,
      build,
    );
  });
  const patched = applyOperatorUpgradeSkillPatches(
    bindings.map(binding => binding.program),
    resolveActiveOperatorUpgrades(build, operator),
    { skipUncompiledSkillGroups: true, buildAttributes },
  );
  return bindings.map((binding, index) => ({ ...binding, program: patched[index]! }));
}

/**
 * 为逐帧会话单独编译指定技能块的程序绑定。调用方可只传自定义块，避免重编译整条时间轴。
 */
export function compileOperatorSkillCastPrograms(
  trackId: string,
  casts: readonly SkillCastDocument[],
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  buildAttributes: Readonly<Record<OperatorAttribute, number>> | undefined,
  programs: ActionGraphDefinitionRepository,
  imports?:
    ImportedAbilityEntityDefinitions | ((level: number) => ImportedAbilityEntityDefinitions),
): readonly CombatSkillCastProgram[] {
  rejectDuplicateEntities(operator, commonAbilityEntityDefinitions);
  return compileCastBindings(
    trackId,
    casts,
    build,
    operator,
    operator.abilityEntityDefinitions,
    buildAttributes,
    programs,
    typeof imports === 'function' ? imports : imports === undefined ? undefined : () => imports,
  );
}

function rejectDuplicateEntities(
  operator: OperatorDefinition,
  common: OperatorDefinition['abilityEntityDefinitions'],
): void {
  const duplicates = Object.keys(operator.abilityEntityDefinitions ?? {}).filter(id =>
    Object.hasOwn(common ?? {}, id),
  );
  if (duplicates.length)
    throw new Error(
      `operator '${operator.slug}' duplicates shared AbilityEntity definitions: ${duplicates.join(', ')}`,
    );
}

function compileSkillSlotGroups(
  operator: Pick<OperatorDefinition, 'slug' | 'skillSlots' | 'playerActionRoutes'>,
): readonly CompiledSkillSlotGroup[] {
  if (operator.skillSlots === undefined || operator.playerActionRoutes === undefined)
    throw new Error(
      `operator '${operator.slug}' has no imported CharacterData player-action routing`,
    );
  const routes = operator.playerActionRoutes;
  return operator.skillSlots.map(slot => {
    const matching = Object.entries(routes).filter(
      (
        entry,
      ): entry is [
        import('../game-data/operatorDefinition').PlayerSkillInput,
        Extract<
          import('../game-data/operatorDefinition').PlayerActionRouteDefinition,
          { readonly kind: 'skillSlot' }
        >,
      ] => entry[1]?.kind === 'skillSlot' && entry[1].skillSlotKey === slot.key,
    );
    if (matching.length !== 1)
      throw new Error(
        `operator '${operator.slug}' skill slot '${slot.key}' must have exactly one player action route`,
      );
    return {
      skillGroupKey: slot.key,
      input: matching[0]![0],
      baseSkillKey: slot.baseSkillKey,
      ...(slot.stableSkillKeys === undefined ? {} : { stableInputSkillKeys: slot.stableSkillKeys }),
      replacementSkillKeys: slot.replacementSkillKeys,
    };
  });
}

/** Compile every owned skill once; placement identities are attached separately. */
export function compileOperatorDefinitionSkills(
  trackId: string,
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  buildAttributes: Readonly<Record<OperatorAttribute, number>> | undefined,
  programs: ActionGraphDefinitionRepository,
  imports?:
    ImportedAbilityEntityDefinitions | ((level: number) => ImportedAbilityEntityDefinitions),
): readonly CompiledSkillProgram[] {
  rejectDuplicateEntities(operator, commonAbilityEntityDefinitions);
  const compile = createOperatorSkillCompiler(
    operator.abilityEntityDefinitions,
    programs,
    typeof imports === 'function' ? imports : imports === undefined ? undefined : () => imports,
  );
  const skills = operator.skillGroups.flatMap(group =>
    listSkillGroupDefinitionBindings(group).map(({ skill, routedReplacement }) => ({
      ...compile({
        operatorId: trackId,
        skillGroupKey: group.key,
        skillType: requireDefinitionSkillType(
          skill,
          `operator '${operator.slug}' skill '${skill.key}'`,
        ),
        skillLevel: requireSkillLevel(build, requireDefinitionLevelSource(skill, operator.slug)),
        skill,
      }),
      ...(routedReplacement === undefined
        ? {}
        : {
            executionSkillGroupKey: routedReplacement.executionSkillGroupKey,
            executionSkillId: routedReplacement.executionSkillKey,
          }),
    })),
  );
  if (operator.dodgeSkill !== undefined)
    skills.push(
      compile({
        operatorId: trackId,
        skillGroupKey: 'dodge',
        skillType: 'dodge',
        skillLevel: 1,
        skill: operator.dodgeSkill,
      }),
    );
  return applyOperatorUpgradeSkillPatches(skills, resolveActiveOperatorUpgrades(build, operator), {
    buildAttributes,
  });
}

interface ResolvedTimelineTrack {
  readonly track: NonNullable<ScenarioDocument['tracks'][number]>;
  readonly operatorInstance: OperatorInstanceDocument;
  readonly operator: OperatorDefinition;
  readonly buildAttributes?: Readonly<Record<OperatorAttribute, number>>;
}

export interface GraphScenarioContext {
  readonly programs: ActionGraphDefinitionRepository;
  readonly commonDefinitionSources: readonly CommonDefinitionSource[];
  readonly compiledCommonDefinitions?: ReturnType<typeof compileCommonDefinitionSources>;
  readonly importsForLevel?: (level: number) => ImportedAbilityEntityDefinitions;
}

function compileResolvedTimelineTracks(
  tracks: readonly ResolvedTimelineTrack[],
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  context: GraphScenarioContext,
): CompiledScenarioTimeline {
  const common =
    context.compiledCommonDefinitions ??
    compileCommonDefinitionSources(context.commonDefinitionSources, context.programs);
  const importsForLevel = context.importsForLevel ?? common.importsForLevel;
  const operators: CombatOperatorProgram[] = [];
  const pendingInputs: (ScheduledSkillInput & { readonly order: number })[] = [];
  const skillInputGroups: SkillInputGroup[] = [];
  let order = 0;
  for (const { track, operatorInstance, operator, buildAttributes } of tracks) {
    rejectDuplicateEntities(operator, commonAbilityEntityDefinitions);
    const localEntities = createIndependentAbilityEntityImportResolver(
      operator.abilityEntityDefinitions ?? {},
      context.programs,
      importsForLevel,
    );
    const imports = (level: number) => ({ ...importsForLevel(level), ...localEntities(level) });
    const skillCasts = compileCastBindings(
      track.id,
      track.skillCasts,
      operatorInstance,
      operator,
      operator.abilityEntityDefinitions,
      buildAttributes,
      context.programs,
      importsForLevel,
      localEntities,
    );
    const anchors = new Map<string, number>();
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      const frame = chain.anchor.placement.startFrame;
      if (frame === undefined)
        throw new Error(`skill input chain '${chain.anchor.id}' has no anchor frame`);
      chain.casts.forEach(cast => anchors.set(cast.id, frame));
      const enabled = chain.casts.filter(cast => !cast.presentation?.disabled);
      if (chain.casts.length > 1 && enabled.length)
        skillInputGroups.push({
          anchorCastId: chain.anchor.id,
          castIds: enabled.map(cast => cast.id),
        });
    }
    for (const cast of track.skillCasts) {
      const declarationOrder = order++;
      if (cast.presentation?.disabled) continue;
      pendingInputs.push({
        ...compileSkillCastPlayerInput(track.id, cast, operator, anchors.get(cast.id)!),
        order: declarationOrder,
      });
    }
    const ownedBuffs = Object.fromEntries(
      Object.entries(operator.buffDefinitions ?? {}).map(([id, definition]) => [
        id,
        compileIndependentBuffResource(definition, id, context.programs, imports(0)),
      ]),
    );
    const duplicateBuffs = Object.keys(ownedBuffs).filter(id =>
      Object.hasOwn(common.buffDefinitions, id),
    );
    if (duplicateBuffs.length)
      throw new Error(
        `operator '${operator.slug}' duplicates shared Buff definitions: ${duplicateBuffs.join(', ')}`,
      );
    const active = resolveActiveOperatorUpgrades(operatorInstance, operator);
    const compileUpgrade: import('./compileOperatorUpgrades').CompileUpgradeEntry = (
      entry,
      level,
      path,
      owner,
    ) => {
      if (owner.actionGraph === undefined)
        throw new Error(`${path}: upgrade program requires its owning action graph`);
      return context.programs
        .compile(owner.actionGraph, level, undefined, imports(level))
        .compileEntry(entry, path);
    };
    operators.push({
      operatorId: track.id,
      operatorRole: operator.role,
      buffDefinitions: { ...common.buffDefinitions, ...ownedBuffs },
      abilityEntityDefinitions: { ...common.abilityEntityDefinitions, ...localEntities(0) },
      ...(operator.comboSkillConditions === undefined
        ? {}
        : {
            comboConditionPrograms: compileOperatorComboSkillConditions(
              operator,
              operatorInstance,
              { programs: context.programs, importsForLevel: imports },
            ),
            comboConditionPriority: operator.comboSkillPriority ?? 'default',
          }),
      skillSlotGroups: compileSkillSlotGroups(operator),
      ...(operator.playerActionRoutes === undefined
        ? {}
        : { playerActionRoutes: operator.playerActionRoutes }),
      ...(operator.playerActionModes === undefined
        ? {}
        : { playerActionModes: operator.playerActionModes }),
      initializationPrograms: compileOperatorInitializationPrograms(active, compileUpgrade),
      passivePrograms: compileOperatorPassivePrograms(
        active,
        operator.passiveSkills ?? [],
        operatorInstance.skillLevels,
        compileUpgrade,
      ),
      upgradeEventPrograms: compileOperatorUpgradeEventPrograms(active, compileUpgrade),
      reactionModifiers: compileOperatorReactionModifiers(active),
      skills: [],
      ...(skillCasts.length ? { skillCasts } : {}),
    });
  }
  pendingInputs.sort((a, b) => a.frame - b.frame || a.order - b.order);
  return {
    operators,
    inputs: pendingInputs.map(({ order, ...input }) => ({
      ...input,
      ...(skillInputGroups.length ? { declarationOrder: order } : {}),
    })),
    ...(skillInputGroups.length ? { skillInputGroups } : {}),
  };
}

export function compileResolvedScenarioTimeline(
  builds: readonly ResolvedScenarioBuild[],
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  context: GraphScenarioContext,
): CompiledScenarioTimeline {
  return compileResolvedTimelineTracks(
    builds.map(build => ({
      track: build.track,
      operatorInstance: build.operatorInstance,
      operator: build.operator,
      buildAttributes: resolveOperatorPanel(build).attributes,
    })),
    commonAbilityEntityDefinitions,
    context,
  );
}

/** Inputs retain declaration order within each frame. */
export function compileScenarioTimeline(
  scenario: ScenarioDocument,
  index: GraphOperatorIndex,
): CompiledScenarioTimeline {
  const tracks: ResolvedTimelineTrack[] = [];
  const seenOperatorIds = new Set<string>();

  scenario.tracks.forEach((track, trackIndex) => {
    if (track === null) return;
    const operatorInstance = track.operator;
    if (operatorInstance === null) {
      if (track.skillCasts.length > 0) {
        throw new Error(`track ${trackIndex} has skill casts but no operator instance`);
      }
      return;
    }
    if (seenOperatorIds.has(track.id)) {
      throw new Error(`track '${track.id}' is assigned to multiple operator instances`);
    }
    seenOperatorIds.add(track.id);
    const operator = requireOperator(operatorInstance, index);
    tracks.push({ track, operatorInstance, operator });
  });
  return compileResolvedTimelineTracks(tracks, index.getCommonAbilityEntityDefinitions?.(), {
    programs: index.actionPrograms,
    commonDefinitionSources: index.getCommonDefinitionSources(),
  });
}
