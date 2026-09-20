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
import type { GameDataRepository } from '../game-data/gameDataRepository';
import type {
  OperatorAttribute,
  OperatorBuffDefinitions,
  OperatorDefinition,
  SkillDefinition,
  SkillType,
} from '../game-data/operatorDefinition';
import { listSkillGroupDefinitionBindings } from '../game-data/operatorSkillDefinitions';
import { resolveUniquePlayerActionForSkill } from '../game-data/resolvePlayerActionRoute';
import type {
  OperatorInstanceDocument,
  ScenarioDocument,
  SkillCastDocument,
} from '../project/schema';
import { getSkillCastPlacementChains } from '../project/skillCastPlacement';
import type { CompiledSkillProgram, CompiledSkillSlotGroup } from './combatProgram';
import { compileOperatorComboSkillConditions } from './compileOperatorComboSkillConditions';
import {
  applyOperatorUpgradeSkillPatches,
  compileOperatorInitializationPrograms,
  compileOperatorPassivePrograms,
  compileOperatorReactionModifiers,
  compileOperatorUpgradeEventPrograms,
  resolveActiveOperatorUpgrades,
} from './compileOperatorUpgrades';
import { compileOperatorBuffResources, compileSkill } from './compileSkill';
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

type OperatorIndex = Pick<GameDataRepository, 'getOperator'> &
  Partial<
    Pick<GameDataRepository, 'getCommonBuffDefinitions' | 'getCommonAbilityEntityDefinitions'>
  >;

function requireOperator(
  build: OperatorInstanceDocument,
  index: OperatorIndex,
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

function requireDefinitionSkillType(skill: SkillDefinition, path: string): SkillType {
  if (skill.skillType === undefined) throw new Error(`${path} has no per-skill combat type`);
  return skill.skillType;
}

function requireDefinitionLevelSource(skill: SkillDefinition, operatorSlug: string) {
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
  abilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
): readonly CombatSkillCastProgram[] {
  const definition = resolved.definition;
  const routed = resolved.group.routedReplacementSkills?.find(
    replacement => replacement.skill.key === definition.key,
  );
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
    ({ skill, skillType, level: definitionLevel, executionSkillGroupKey, executionSkillId }) => ({
      castId: cast.id,
      program: {
        ...compileSkill({
          operatorId: trackId,
          skillGroupKey: resolved.group.key,
          skillType,
          skillLevel: definitionLevel,
          skill,
          abilityEntityDefinitions,
        }),
        ...(executionSkillGroupKey === undefined
          ? {}
          : { executionSkillGroupKey, executionSkillId }),
      },
    }),
  );
}

function compileCastBindings(
  trackId: string,
  casts: readonly SkillCastDocument[],
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
  abilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'],
  buildAttributes?: Readonly<Record<OperatorAttribute, number>>,
): readonly CombatSkillCastProgram[] {
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
      abilityEntityDefinitions,
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
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'] = {},
  buildAttributes?: Readonly<Record<OperatorAttribute, number>>,
): readonly CombatSkillCastProgram[] {
  const duplicateIds = Object.keys(operator.abilityEntityDefinitions ?? {}).filter(
    id => id in commonAbilityEntityDefinitions,
  );
  if (duplicateIds.length > 0) {
    throw new Error(
      `operator '${operator.slug}' duplicates shared AbilityEntity definitions: ${duplicateIds.join(', ')}`,
    );
  }
  return compileCastBindings(
    trackId,
    casts,
    build,
    operator,
    { ...commonAbilityEntityDefinitions, ...operator.abilityEntityDefinitions },
    buildAttributes,
  );
}

function compileSkillSlotGroups(operator: OperatorDefinition): readonly CompiledSkillSlotGroup[] {
  if (operator.skillSlots === undefined || operator.playerActionRoutes === undefined) {
    throw new Error(
      `operator '${operator.slug}' has no imported CharacterData player-action routing`,
    );
  }
  const playerActionRoutes = operator.playerActionRoutes;
  return operator.skillSlots.map(slot => {
    const routes = Object.entries(playerActionRoutes).filter(
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
    if (routes.length !== 1) {
      throw new Error(
        `operator '${operator.slug}' skill slot '${slot.key}' must have exactly one player action route`,
      );
    }
    return {
      skillGroupKey: slot.key,
      input: routes[0]![0],
      baseSkillKey: slot.baseSkillKey,
      ...(slot.stableSkillKeys === undefined ? {} : { stableInputSkillKeys: slot.stableSkillKeys }),
      replacementSkillKeys: slot.replacementSkillKeys,
    };
  });
}

/**
 * 编译干员定义中的全部技能（已应用养成补丁，不带 castId）。
 * 资源规则等与放置无关的解析使用这份名单；放置绑定由 `compileCastSkillPrograms` 单独产生。
 */
export function compileOperatorDefinitionSkills(
  trackId: string,
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'] = {},
  buildAttributes?: Readonly<Record<OperatorAttribute, number>>,
): readonly CompiledSkillProgram[] {
  const duplicateAbilityEntityIds = [
    ...Object.keys(operator.abilityEntityDefinitions ?? {}),
  ].filter(id => id in commonAbilityEntityDefinitions);
  if (duplicateAbilityEntityIds.length > 0) {
    throw new Error(
      `operator '${operator.slug}' duplicates shared AbilityEntity definitions: ${[...new Set(duplicateAbilityEntityIds)].join(', ')}`,
    );
  }
  const abilityEntityDefinitions = {
    ...commonAbilityEntityDefinitions,
    ...operator.abilityEntityDefinitions,
  };
  const skills = operator.skillGroups.flatMap(group => {
    const definitions: SkillCompilationBinding[] = listSkillGroupDefinitionBindings(group).map(
      ({ skill, routedReplacement }) => ({
        skill,
        skillType: requireDefinitionSkillType(
          skill,
          `operator '${operator.slug}' skill '${skill.key}'`,
        ),
        level: requireSkillLevel(build, requireDefinitionLevelSource(skill, operator.slug)),
        ...(routedReplacement === undefined
          ? {}
          : {
              executionSkillGroupKey: routedReplacement.executionSkillGroupKey,
              executionSkillId: routedReplacement.executionSkillKey,
            }),
      }),
    );
    return definitions.map(
      ({ skill, skillType, level, executionSkillGroupKey, executionSkillId }) => ({
        ...compileSkill({
          operatorId: trackId,
          skillGroupKey: group.key,
          skillType,
          skillLevel: level,
          skill,
          abilityEntityDefinitions,
        }),
        ...(executionSkillGroupKey === undefined
          ? {}
          : { executionSkillGroupKey, executionSkillId }),
      }),
    );
  });
  const runtimeSkills =
    operator.dodgeSkill === undefined
      ? []
      : [
          compileSkill({
            operatorId: trackId,
            skillGroupKey: 'dodge',
            skillType: 'dodge',
            skillLevel: 1,
            skill: operator.dodgeSkill,
            abilityEntityDefinitions,
          }),
        ];
  return applyOperatorUpgradeSkillPatches(
    [...skills, ...runtimeSkills],
    resolveActiveOperatorUpgrades(build, operator),
    { buildAttributes },
  );
}

interface ResolvedTimelineTrack {
  readonly track: NonNullable<ScenarioDocument['tracks'][number]>;
  readonly operatorInstance: OperatorInstanceDocument;
  readonly operator: OperatorDefinition;
  readonly buildAttributes?: Readonly<Record<OperatorAttribute, number>>;
}

function compileResolvedTimelineTracks(
  tracks: readonly ResolvedTimelineTrack[],
  commonBuffDefinitions?: OperatorBuffDefinitions,
  commonAbilityEntityDefinitions: OperatorDefinition['abilityEntityDefinitions'] = {},
): CompiledScenarioTimeline {
  const operators: CombatOperatorProgram[] = [];
  const pendingInputs: (ScheduledSkillInput & { readonly order: number })[] = [];
  const skillInputGroups: SkillInputGroup[] = [];
  let order = 0;
  const compiledCommonBuffResources = compileOperatorBuffResources(
    commonBuffDefinitions,
    commonAbilityEntityDefinitions,
  );
  const compiledCommonBuffDefinitions = compiledCommonBuffResources.buffDefinitions;

  for (const { track, operatorInstance, operator, buildAttributes } of tracks) {
    const duplicateAbilityEntityIds = [
      ...Object.keys(operator.abilityEntityDefinitions ?? {}),
    ].filter(id => id in commonAbilityEntityDefinitions);
    if (duplicateAbilityEntityIds.length > 0) {
      throw new Error(
        `operator '${operator.slug}' duplicates shared AbilityEntity definitions: ${[...new Set(duplicateAbilityEntityIds)].join(', ')}`,
      );
    }
    const abilityEntityDefinitions = {
      ...commonAbilityEntityDefinitions,
      ...operator.abilityEntityDefinitions,
    };
    const activeUpgrades = resolveActiveOperatorUpgrades(operatorInstance, operator);
    const skillCasts = compileCastBindings(
      track.id,
      track.skillCasts,
      operatorInstance,
      operator,
      abilityEntityDefinitions,
      buildAttributes,
    );
    const anchorFrameByCastId = new Map<string, number>();
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      const anchorFrame = chain.anchor.placement.startFrame;
      if (anchorFrame === undefined)
        throw new Error(`skill input chain '${chain.anchor.id}' has no anchor frame`);
      chain.casts.forEach(cast => anchorFrameByCastId.set(cast.id, anchorFrame));
      const enabled = chain.casts.filter(cast => !cast.presentation?.disabled);
      if (chain.casts.length > 1 && enabled.length > 0) {
        skillInputGroups.push({
          anchorCastId: chain.anchor.id,
          castIds: enabled.map(cast => cast.id),
        });
      }
    }
    for (const cast of track.skillCasts) {
      const declarationOrder = order++;
      if (cast.presentation?.disabled) continue;
      if (cast.source.kind === 'custom') {
        throw new Error(
          `skill cast '${cast.id}' is a presentation-only custom action without a SkillDefinition`,
        );
      }
      pendingInputs.push({
        // 后段此处仅保留最早可能开始的锚点帧，正式执行由连续组排程决定。
        ...compileSkillCastPlayerInput(track.id, cast, operator, anchorFrameByCastId.get(cast.id)!),
        order: declarationOrder,
      });
    }
    // 干员只要有构筑就进入运行时（技能列表可能为空），资源规则与面板解析依赖这份名单。
    const compiledOperatorBuffResources = compileOperatorBuffResources(
      operator.buffDefinitions,
      abilityEntityDefinitions,
    );
    const compiledOperatorBuffDefinitions = compiledOperatorBuffResources.buffDefinitions;
    const duplicateBuffIds = Object.keys(compiledOperatorBuffDefinitions).filter(
      buffId => buffId in compiledCommonBuffDefinitions,
    );
    if (duplicateBuffIds.length > 0) {
      throw new Error(
        `operator '${operator.slug}' duplicates shared Buff definitions: ${duplicateBuffIds.join(', ')}`,
      );
    }
    const buffDefinitions = {
      ...compiledCommonBuffDefinitions,
      ...compiledOperatorBuffDefinitions,
    };
    const buffAbilityEntityDefinitions = {
      ...compiledCommonBuffResources.abilityEntityDefinitions,
      ...compiledOperatorBuffResources.abilityEntityDefinitions,
    };
    operators.push({
      operatorId: track.id,
      operatorRole: operator.role,
      ...(Object.keys(buffDefinitions).length === 0 ? {} : { buffDefinitions }),
      ...(Object.keys(buffAbilityEntityDefinitions).length === 0
        ? {}
        : { abilityEntityDefinitions: buffAbilityEntityDefinitions }),
      ...(operator.comboSkillConditions === undefined
        ? {}
        : {
            comboConditionPrograms: compileOperatorComboSkillConditions(operator, operatorInstance),
            comboConditionPriority: operator.comboSkillPriority ?? 'default',
          }),
      skillSlotGroups: compileSkillSlotGroups(operator),
      ...(operator.playerActionRoutes === undefined
        ? {}
        : { playerActionRoutes: operator.playerActionRoutes }),
      ...(operator.playerActionModes === undefined
        ? {}
        : { playerActionModes: operator.playerActionModes }),
      initializationPrograms: compileOperatorInitializationPrograms(activeUpgrades),
      passivePrograms: compileOperatorPassivePrograms(
        activeUpgrades,
        operator.passiveSkills,
        operatorInstance.skillLevels,
      ),
      upgradeEventPrograms: compileOperatorUpgradeEventPrograms(activeUpgrades),
      reactionModifiers: compileOperatorReactionModifiers(activeUpgrades),
      skills: [],
      ...(skillCasts.length === 0 ? {} : { skillCasts }),
    });
  }

  pendingInputs.sort((left, right) => left.frame - right.frame || left.order - right.order);
  return {
    operators,
    inputs: pendingInputs.map(({ order, ...input }) => ({
      ...input,
      ...(skillInputGroups.length === 0 ? {} : { declarationOrder: order }),
    })),
    ...(skillInputGroups.length === 0 ? {} : { skillInputGroups }),
  };
}

/** 使用 Build Resolver 的共享结果编译每个技能释放的程序和时间轴输入。 */
export function compileResolvedScenarioTimeline(
  builds: readonly ResolvedScenarioBuild[],
  commonBuffDefinitions?: OperatorBuffDefinitions,
  commonAbilityEntityDefinitions?: OperatorDefinition['abilityEntityDefinitions'],
): CompiledScenarioTimeline {
  const tracks = builds.map(build => ({
    track: build.track,
    operatorInstance: build.operatorInstance,
    operator: build.operator,
    buildAttributes: resolveOperatorPanel(build).attributes,
  }));
  return compileResolvedTimelineTracks(
    tracks,
    commonBuffDefinitions,
    commonAbilityEntityDefinitions,
  );
}

/**
 * 按轨道序号和轨道内声明顺序收集实际帧输入，再稳定地按帧排序。
 * 同帧顺序会影响资源扣费和事件处理，因此不得按干员或技能身份二次排序。
 */
export function compileScenarioTimeline(
  scenario: ScenarioDocument,
  index: OperatorIndex,
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
  return compileResolvedTimelineTracks(
    tracks,
    index.getCommonBuffDefinitions?.(),
    index.getCommonAbilityEntityDefinitions?.(),
  );
}
