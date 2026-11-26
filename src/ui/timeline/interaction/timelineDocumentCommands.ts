import {
  operatorOwner,
  hasOperatorOwner,
  resolveScenarioMarkerTrack,
  appendScenarioMarker,
  markerSupportsPreparation,
  dodgeInputs,
  type ScenarioMarkerDocument,
} from '../../../core/project/scenarioMarkers';
import type { CombatBuffDefinitionAttributeModifier } from '../../../../packages/game-data-contract/src/buffs';
import { validateGlobalConfig } from '../../../core/project/scenarioValidation';
import type { GlobalConfigDocument } from '../../../core/project/schema';
/**
 * 时间轴编辑器对存档执行的最小不可变命令。
 *
 * 组件不得直接改写持久化对象；后续撤销历史应记录这些命令的输入与输出，而不是 DOM 状态。
 */
import type { HitOverrideField, HitOverrideValue } from '../../../core/project/hitOverrides';
import type {
  BattleDocument,
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
  WeaponInstanceDocument,
  GearInstanceDocument,
  SkillCastDocument,
} from '../../../core/project/schema';
import type { InteractionMarker, TrackDodgeInput } from '../../../core/project/scenarioMarkers';
import { getSkillCastPlacementChains } from '../../../core/project/skillCastPlacement';
import { resolveDodgeMarkerLastInputFrame } from '../../../core/project/scenarioMarkers';
import { MIN_COLLAPSIBLE_PREP_FRAMES } from '../timelineGeometry';

export type EditableBattleResourceRule = keyof Pick<
  BattleDocument['resourceRules'],
  'maxSp' | 'initialSp' | 'spRecoveryPerSecond'
>;

export function canCollapseTimelinePrep(scenario: ScenarioDocument): boolean {
  return (
    scenario.battle.prepFrames + (scenario.inheritance?.frame ?? 0) >= MIN_COLLAPSIBLE_PREP_FRAMES
  );
}

/** 战前准备不平移技能或标记；短到放不下折叠栏时同时恢复展开视图。 */
export function setBattlePrepFrames(
  scenario: ScenarioDocument,
  prepFrames: number,
): ScenarioDocument {
  if (!Number.isInteger(prepFrames) || prepFrames < 0) {
    throw new RangeError('prepFrames must be a non-negative integer');
  }
  const battle =
    scenario.battle.prepFrames === prepFrames
      ? scenario.battle
      : { ...scenario.battle, prepFrames };
  const editor =
    prepFrames + (scenario.inheritance?.frame ?? 0) < MIN_COLLAPSIBLE_PREP_FRAMES &&
    !scenario.editor.prepExpanded
      ? { ...scenario.editor, prepExpanded: true }
      : scenario.editor;
  if (battle === scenario.battle && editor === scenario.editor) return scenario;
  return { ...scenario, battle, editor };
}

/** 折叠只改变准备区的编辑投影，不改变任何技能、标记或模拟帧。 */
export function setTimelinePrepExpanded(
  scenario: ScenarioDocument,
  prepExpanded: boolean,
): ScenarioDocument {
  const allowedExpanded = prepExpanded || !canCollapseTimelinePrep(scenario);
  if (scenario.editor.prepExpanded === allowedExpanded) return scenario;
  return { ...scenario, editor: { ...scenario.editor, prepExpanded: allowedExpanded } };
}

function battleDurationContentFloor(scenario: ScenarioDocument): number {
  const timedFrames = [
    ...scenario.tracks.flatMap(track =>
      track === null
        ? []
        : track.skillCasts.flatMap(cast =>
            cast.placement.startFrame === undefined ? [] : [cast.placement.startFrame],
          ),
    ),
    ...scenario.markers.map(marker =>
      marker.kind === 'dodge' ? resolveDodgeMarkerLastInputFrame(marker) : marker.frame,
    ),
    scenario.battle.simulationRange?.startFrame ?? 0,
    scenario.battle.simulationRange?.endFrame ?? 0,
  ];
  return Math.max(1, ...timedFrames);
}

/**
 * 修改实际战斗轴长度。缩短时沿用旧版的内容下限：不删除、不裁剪、也不移动任何已放置对象。
 * 技能的运行时结束点不是项目字段，因此这里只保护稳定的技能起点和标记帧。
 */
export function setBattleDurationFrames(
  scenario: ScenarioDocument,
  requestedDurationFrames: number,
): ScenarioDocument {
  if (!Number.isInteger(requestedDurationFrames) || requestedDurationFrames <= 0) {
    throw new RangeError('durationFrames must be a positive integer');
  }
  const durationFrames = Math.max(battleDurationContentFloor(scenario), requestedDurationFrames);
  if (scenario.battle.durationFrames === durationFrames) return scenario;
  return { ...scenario, battle: { ...scenario.battle, durationFrames } };
}

/**
 * 更新项目持久化的共享技力规则。命令同时维护初始值不超过上限的不变量，避免 UI、校验器和模拟器
 * 分别修正同一输入；未开放编辑的原生运行时规则仍由后续应用装配层提供。
 */
export function updateBattleResourceRule(
  scenario: ScenarioDocument,
  field: EditableBattleResourceRule,
  value: number,
): ScenarioDocument {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }

  const current = scenario.battle.resourceRules;
  const normalizedValue = field === 'initialSp' ? Math.min(value, current.maxSp) : value;
  const next = {
    ...current,
    [field]: normalizedValue,
  };
  next.initialSp = Math.min(next.initialSp, next.maxSp);
  if (next[field] === current[field] && next.initialSp === current.initialSp) return scenario;
  return { ...scenario, battle: { ...scenario.battle, resourceRules: next } };
}

/** 全局配置整体进入撤销与继承锁定的公共方案命令。 */
export function setGlobalConfig(
  scenario: ScenarioDocument,
  config: GlobalConfigDocument,
): ScenarioDocument {
  const issues: { path: string; message: string }[] = [];
  validateGlobalConfig(config, 'globalConfig', issues);
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return { ...scenario, globalConfig: JSON.parse(JSON.stringify(config)) as GlobalConfigDocument };
}

/** 编辑自定义数值时直接更新场景 Buff，执行统一交给机制初始化。 */
export function setScenarioBuffAttributes(
  scenario: ScenarioDocument,
  modifiers: readonly CombatBuffDefinitionAttributeModifier[],
): ScenarioDocument {
  if (
    JSON.stringify(scenario.globalConfig.customBuff?.attributeModifiers ?? []) ===
    JSON.stringify(modifiers)
  )
    return scenario;
  return setGlobalConfig(scenario, {
    ...scenario.globalConfig,
    customBuff: {
      stackingType: 'unlimited',
      presentation: { visible: false },
      actionGraph: { main: { nodes: {} }, macros: {} },
      ...scenario.globalConfig.customBuff,
      attributeModifiers: [...modifiers],
    },
  });
}

/**
 * 交换两条轨道及其视觉顺序，所有绑定轨道的标记继续指向原来的干员。
 * 技能块和配装随轨道对象一起移动，不需要逐项改写引用。
 */
export function swapTimelineTracks(
  scenario: ScenarioDocument,
  leftIndex: TrackIndex,
  rightIndex: TrackIndex,
): ScenarioDocument {
  if (leftIndex === rightIndex) return scenario;
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  [tracks[leftIndex], tracks[rightIndex]] = [tracks[rightIndex], tracks[leftIndex]];
  const remap = <T extends { trackIndex: TrackIndex }>(marker: T): T => ({
    ...marker,
    trackIndex:
      marker.trackIndex === leftIndex
        ? rightIndex
        : marker.trackIndex === rightIndex
          ? leftIndex
          : marker.trackIndex,
  });
  return {
    ...scenario,
    tracks,
    markers: scenario.markers.map(marker =>
      hasOperatorOwner(marker) && marker.owner.scope === 'emptySlot'
        ? { ...marker, owner: remap(marker.owner) }
        : marker,
    ),
  };
}

/**
 * 修改单条轨道的初始终结技能量。上限来自定义推导或显式项目覆盖，命令只负责维护用户输入；
 * 空轨道和非有限上限表示调用边界错误，不能静默创建不完整轨道。
 */
export function updateTrackInitialUltimateEnergy(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  value: number,
  maximum: number,
): ScenarioDocument {
  const track = scenario.tracks[trackIndex];
  if (track === null) throw new Error(`track ${trackIndex} is empty`);
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum < 0) {
    throw new RangeError('initial ultimate energy and maximum must be finite non-negative values');
  }
  const normalized = Math.min(maximum, Math.max(0, value));
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    initialState: { ...track.initialState, ultimateEnergy: normalized },
  };
  const customByTrackId = Object.fromEntries(
    tracks.flatMap(current =>
      current === null ? [] : [[current.id, current.initialState.ultimateEnergy]],
    ),
  );
  const currentPreset = scenario.editor.initialUltimateEnergyPreset;
  if (
    track.initialState.ultimateEnergy === normalized &&
    currentPreset?.mode === 'custom' &&
    JSON.stringify(currentPreset.customByTrackId) === JSON.stringify(customByTrackId)
  ) {
    return scenario;
  }
  return {
    ...scenario,
    tracks,
    editor: {
      ...scenario.editor,
      initialUltimateEnergyPreset: { mode: 'custom', customByTrackId },
    },
  };
}

export type InitialUltimateEnergyPresetMode = 'empty' | 'full' | 'custom';

export function resolveInitialUltimateEnergyPresetMode(
  scenario: ScenarioDocument,
): InitialUltimateEnergyPresetMode {
  const saved = scenario.editor.initialUltimateEnergyPreset?.mode;
  if (saved !== undefined) return saved;
  return scenario.tracks.every(track => track === null || track.initialState.ultimateEnergy === 0)
    ? 'empty'
    : 'custom';
}

function initialUltimateEnergyCustomProfile(scenario: ScenarioDocument): Record<string, number> {
  return (
    scenario.editor.initialUltimateEnergyPreset?.customByTrackId ??
    Object.fromEntries(
      scenario.tracks.flatMap(track =>
        track === null ? [] : [[track.id, track.initialState.ultimateEnergy]],
      ),
    )
  );
}

export function applyInitialUltimateEnergyPreset(
  scenario: ScenarioDocument,
  mode: InitialUltimateEnergyPresetMode,
  maximumByTrack: readonly (number | null)[],
): ScenarioDocument {
  const customByTrackId = initialUltimateEnergyCustomProfile(scenario);
  const tracks = scenario.tracks.map((track, trackIndex) => {
    if (track === null) return null;
    const maximum = maximumByTrack[trackIndex];
    if (maximum === null || maximum === undefined || !Number.isFinite(maximum) || maximum < 0) {
      throw new RangeError(`track ${trackIndex} has no valid maximum ultimate energy`);
    }
    const requested =
      mode === 'empty' ? 0 : mode === 'full' ? maximum : (customByTrackId[track.id] ?? 0);
    return {
      ...track,
      initialState: {
        ...track.initialState,
        ultimateEnergy: Math.min(maximum, Math.max(0, requested)),
      },
    };
  }) as ScenarioDocument['tracks'];
  return {
    ...scenario,
    tracks,
    editor: { ...scenario.editor, initialUltimateEnergyPreset: { mode, customByTrackId } },
  };
}

export function setUnifiedInitialUltimateEnergy(
  scenario: ScenarioDocument,
  value: number,
  maximumByTrack: readonly (number | null)[],
): ScenarioDocument {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('unified initial ultimate energy must be a non-negative finite number');
  }
  const tracks = scenario.tracks.map((track, trackIndex) => {
    if (track === null) return null;
    const maximum = maximumByTrack[trackIndex];
    if (maximum === null || maximum === undefined || !Number.isFinite(maximum) || maximum < 0) {
      throw new RangeError(`track ${trackIndex} has no valid maximum ultimate energy`);
    }
    return {
      ...track,
      initialState: {
        ...track.initialState,
        ultimateEnergy: Math.min(maximum, value),
      },
    };
  }) as ScenarioDocument['tracks'];
  const customByTrackId = Object.fromEntries(
    tracks.flatMap(track =>
      track === null ? [] : [[track.id, track.initialState.ultimateEnergy]],
    ),
  );
  return {
    ...scenario,
    tracks,
    editor: {
      ...scenario.editor,
      initialUltimateEnergyPreset: { mode: 'custom', customByTrackId },
    },
  };
}

export type TrackGearSlot = keyof TrackDocument['gears'];

/**
 * 更换轨道的干员实例。已有技能块依赖旧干员定义身份，因此切换或移除干员时一并清理。
 * 移除干员时同时删除指向该空轨道的输入标记；更换干员仍保留轨道上的通用输入。
 * 调用方负责提供初始养成值和轨道身份。
 */
export function setTrackOperator(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  operatorInstance: OperatorInstanceDocument | null,
  trackId: string,
): ScenarioDocument {
  const previousTrack = scenario.tracks[trackIndex];
  const previousSlug = previousTrack?.operator?.operatorSlug ?? null;
  const nextSlug = operatorInstance?.operatorSlug ?? null;
  if (previousSlug === nextSlug) return scenario;

  const removedCastIds = new Set(previousTrack?.skillCasts.map(cast => cast.id) ?? []);
  const markers = scenario.markers.flatMap(marker => {
    if (
      !hasOperatorOwner(marker) ||
      resolveScenarioMarkerTrack(scenario.tracks, marker.owner) !== trackIndex
    )
      return [marker];
    if (operatorInstance === null || marker.kind === 'consumableUse') return [];
    return [{ ...marker, owner: { scope: 'operator' as const, trackId } }];
  });
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] =
    operatorInstance === null
      ? null
      : {
          id: trackId,
          operator: operatorInstance,
          weapon: null,
          gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
          initialState: { ultimateEnergy: 0 },
          skillCasts: [],
        };

  return {
    ...scenario,
    tracks,
    connections: scenario.connections.filter(
      connection =>
        !removedCastIds.has(connection.from.skillCastId) &&
        !removedCastIds.has(connection.to.skillCastId),
    ),
    markers,
  };
}

/**
 * 更换轨道武器实例。武器兼容性由定义校验和选择器负责，
 * 命令层只维护轨道实例；空轨道不能单独装备武器。
 */
export function setTrackWeapon(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  weaponInstance: WeaponInstanceDocument | null,
): ScenarioDocument {
  const previousTrack = scenario.tracks[trackIndex];
  if (previousTrack === null) throw new Error(`track ${trackIndex} is empty`);
  const previousSlug = previousTrack.weapon?.weaponSlug ?? null;
  const nextSlug = weaponInstance?.weaponSlug ?? null;
  if (previousSlug === nextSlug) return scenario;

  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...previousTrack, weapon: weaponInstance };
  return { ...scenario, tracks };
}

/**
 * 更换轨道单个装备槽的实例。槽位与装备类型的匹配
 * 由定义校验和选择器负责；命令层只维护轨道实例。
 */
export function setTrackGear(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  slot: TrackGearSlot,
  gearInstance: GearInstanceDocument | null,
): ScenarioDocument {
  const previousTrack = scenario.tracks[trackIndex];
  if (previousTrack === null) throw new Error(`track ${trackIndex} is empty`);
  const previousSlug = previousTrack.gears[slot]?.gearSlug ?? null;
  const nextSlug = gearInstance?.gearSlug ?? null;
  if (previousSlug === nextSlug) return scenario;

  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...previousTrack,
    gears: { ...previousTrack.gears, [slot]: gearInstance },
  };
  return { ...scenario, tracks };
}

function locateSkillCast(scenario: ScenarioDocument, trackIndex: TrackIndex, skillCastId: string) {
  const track = scenario.tracks[trackIndex];
  if (track === null) throw new Error(`track ${trackIndex} is empty`);
  const castIndex = track.skillCasts.findIndex(cast => cast.id === skillCastId);
  if (castIndex < 0) {
    throw new Error(`track ${trackIndex} has no skill cast '${skillCastId}'`);
  }
  return { track, castIndex, cast: track.skillCasts[castIndex]! };
}

function skillCastFrame(
  cast: SkillCastDocument,
  resolvedStartFrames?: ReadonlyMap<string, number>,
): number {
  const frame = resolvedStartFrames?.get(cast.id) ?? cast.placement.startFrame;
  if (frame === undefined || !Number.isInteger(frame))
    throw new Error(`resolved integer start frame is required for skill cast '${cast.id}'`);
  return frame;
}

interface LocatedSkillCast {
  readonly trackIndex: TrackIndex;
  readonly castIndex: number;
  readonly cast: TrackDocument['skillCasts'][number];
}

function locateSkillCasts(
  scenario: ScenarioDocument,
  skillCastIds: ReadonlySet<string>,
): LocatedSkillCast[] {
  const located: LocatedSkillCast[] = [];
  for (const [trackIndex, track] of scenario.tracks.entries()) {
    if (track === null) continue;
    for (const [castIndex, cast] of track.skillCasts.entries()) {
      if (!skillCastIds.has(cast.id)) continue;
      located.push({ trackIndex: trackIndex as TrackIndex, castIndex, cast });
    }
  }
  return located;
}

/** 把同轨连续选区变成手动链；已有链必须完整选中，技能块和连线身份均不重建。 */
export function createSkillCastGroup(
  scenario: ScenarioDocument,
  castIds: ReadonlySet<string>,
  resolvedStartFrames: ReadonlyMap<string, number>,
): ScenarioDocument {
  if (castIds.size < 2) return scenario;
  const located = locateSkillCasts(scenario, castIds);
  if (located.length !== castIds.size || new Set(located.map(item => item.trackIndex)).size !== 1)
    return scenario;
  if (located.some(item => item.cast.presentation?.locked)) return scenario;
  const trackIndex = located[0]!.trackIndex;
  const track = scenario.tracks[trackIndex]!;
  const chains = getSkillCastPlacementChains(track.skillCasts);
  if (
    chains.some(
      chain =>
        chain.casts.some(cast => castIds.has(cast.id)) &&
        chain.casts.some(cast => !castIds.has(cast.id)),
    )
  )
    return scenario;
  const ordered = chains
    .flatMap(chain => chain.casts)
    .sort(
      (left, right) =>
        skillCastFrame(left, resolvedStartFrames) - skillCastFrame(right, resolvedStartFrames),
    );
  const selected = ordered.filter(cast => castIds.has(cast.id));
  const firstIndex = ordered.indexOf(selected[0]!);
  if (ordered.slice(firstIndex, firstIndex + selected.length).some(cast => !castIds.has(cast.id)))
    return scenario;
  const placements = new Map<string, SkillCastDocument['placement']>(
    selected.map((cast, index) => [
      cast.id,
      index === 0
        ? { startFrame: cast.placement.startFrame ?? skillCastFrame(cast, resolvedStartFrames) }
        : { afterCastId: selected[index - 1]!.id },
    ]),
  );
  return replaceSkillCastPlacements(scenario, placements);
}

/** 将独立技能插到组内指定成员之前；保留组首、原成员顺序和所有实例身份。 */
export function insertSkillCastIntoGroup(
  scenario: ScenarioDocument,
  castId: string,
  beforeCastId: string,
): ScenarioDocument {
  const track = scenario.tracks.find(track => track?.skillCasts.some(cast => cast.id === castId));
  if (!track) return scenario;
  const chains = getSkillCastPlacementChains(track.skillCasts);
  const source = chains.find(chain => chain.casts.some(cast => cast.id === castId));
  const target = chains.find(chain => chain.casts.some(cast => cast.id === beforeCastId));
  if (
    !source ||
    source.casts.length !== 1 ||
    !target ||
    target.casts.length < 2 ||
    [...source.casts, ...target.casts].some(cast => cast.presentation?.locked)
  )
    return scenario;
  const index = target.casts.findIndex(cast => cast.id === beforeCastId);
  if (index <= 0) return scenario;
  return replaceSkillCastPlacements(
    scenario,
    new Map([
      [castId, { afterCastId: target.casts[index - 1]!.id }],
      [beforeCastId, { afterCastId: castId }],
    ]),
  );
}

/** 显式解散涉及的完整链，以用户当前看到的起点变成独立块；后台重算不得调用此命令。 */
export function dissolveSkillCastGroups(
  scenario: ScenarioDocument,
  castIds: ReadonlySet<string>,
  resolvedStartFrames: ReadonlyMap<string, number>,
): ScenarioDocument {
  const placements = new Map<string, SkillCastDocument['placement']>();
  for (const track of scenario.tracks) {
    if (track === null) continue;
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      if (chain.casts.length < 2 || !chain.casts.some(cast => castIds.has(cast.id))) continue;
      for (const cast of chain.casts)
        placements.set(cast.id, { startFrame: skillCastFrame(cast, resolvedStartFrames) });
    }
  }
  return replaceSkillCastPlacements(scenario, placements);
}

function replaceSkillCastPlacements(
  scenario: ScenarioDocument,
  placements: ReadonlyMap<string, SkillCastDocument['placement']>,
): ScenarioDocument {
  let changed = false;
  const tracks = scenario.tracks.map(track => {
    if (track === null) return null;
    let trackChanged = false;
    const skillCasts = track.skillCasts.map(cast => {
      const placement = placements.get(cast.id);
      if (
        placement === undefined ||
        (placement.startFrame === cast.placement.startFrame &&
          placement.afterCastId === cast.placement.afterCastId)
      )
        return cast;
      changed = true;
      trackChanged = true;
      return { ...cast, placement };
    });
    return trackChanged ? { ...track, skillCasts } : track;
  }) as ScenarioDocument['tracks'];
  return changed ? { ...scenario, tracks } : scenario;
}

/** 设置技能块的锁定状态（纯展示，不包含技能逻辑）。 */
export function setSkillCastLocked(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  locked: boolean,
): ScenarioDocument {
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if ((cast.presentation?.locked ?? false) === locked) return scenario;
  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, presentation: { ...cast.presentation, locked } };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/** 设置技能块的禁用状态（纯展示，编译时跳过）。 */
export function setSkillCastDisabled(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  disabled: boolean,
): ScenarioDocument {
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if ((cast.presentation?.disabled ?? false) === disabled) return scenario;
  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, presentation: { ...cast.presentation, disabled } };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/** 设置技能块的用户配色；null 表示使用技能类型默认色。 */
export function setSkillCastColor(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  color: string | null,
): ScenarioDocument {
  if (color !== null && color.length === 0) throw new TypeError('color must not be empty');
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if ((cast.presentation?.color ?? null) === color) return scenario;
  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, presentation: { ...cast.presentation, color } };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/** 设置技能块独立随机种子；null 表示重新跟随场景全局种子。 */
export function setSkillCastRandomSeed(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  seed: number | null,
): ScenarioDocument {
  if (seed !== null && (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)) {
    throw new RangeError('skill cast random seed must be a 32-bit unsigned integer');
  }
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if ((cast.simulationInputs?.randomSeed ?? null) === seed) return scenario;

  const skillCasts = [...track.skillCasts];
  if (seed === null) {
    const { randomSeed: _removed, ...remainingInputs } = cast.simulationInputs ?? {};
    const { simulationInputs: _oldInputs, ...castWithoutInputs } = cast;
    skillCasts[castIndex] =
      Object.keys(remainingInputs).length === 0
        ? castWithoutInputs
        : { ...castWithoutInputs, simulationInputs: remainingInputs };
  } else {
    skillCasts[castIndex] = {
      ...cast,
      simulationInputs: { ...cast.simulationInputs, randomSeed: seed },
    };
  }
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/**
 * 一次删除任意轨道上的多个动作，并统一清理连线。
 * 不存在的 ID 会被忽略，便于临时选择集合在撤销、重做或切换干员后安全收敛。
 */
export function removeSkillCasts(
  scenario: ScenarioDocument,
  skillCastIds: ReadonlySet<string>,
): ScenarioDocument {
  if (skillCastIds.size === 0) return scenario;

  let changed = false;
  const tracks = scenario.tracks.map(track => {
    if (track === null) return null;
    const placements = new Map<string, SkillCastDocument['placement']>();
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      const survivors = chain.casts.filter(cast => !skillCastIds.has(cast.id));
      survivors.forEach((cast, index) => {
        placements.set(
          cast.id,
          index === 0
            ? { startFrame: chain.anchor.placement.startFrame! }
            : { afterCastId: survivors[index - 1]!.id },
        );
      });
    }
    const remaining = track.skillCasts
      .filter(cast => !skillCastIds.has(cast.id))
      .map(cast => {
        const placement = placements.get(cast.id)!;
        return placement.startFrame === cast.placement.startFrame &&
          placement.afterCastId === cast.placement.afterCastId
          ? cast
          : { ...cast, placement };
      });
    if (remaining.length === track.skillCasts.length) return track;
    changed = true;
    return { ...track, skillCasts: remaining };
  }) as ScenarioDocument['tracks'];

  if (!changed) return scenario;

  const connections = scenario.connections.filter(
    connection =>
      !skillCastIds.has(connection.from.skillCastId) &&
      !skillCastIds.has(connection.to.skillCastId),
  );
  return { ...scenario, tracks, connections };
}

function requireTimelineMarkerFrame(
  scenario: ScenarioDocument,
  frame: number,
  minimumFrame = 0,
): void {
  if (!Number.isInteger(frame) || frame < minimumFrame || frame > scenario.battle.durationFrames) {
    throw new RangeError('timeline marker frame must be an integer inside the editable timeline');
  }
}

export function setSimulationRangeBoundary(
  scenario: ScenarioDocument,
  boundary: 'start' | 'end',
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame);
  const current = scenario.battle.simulationRange ?? {};
  const simulationRange =
    boundary === 'start'
      ? {
          ...current,
          startFrame: frame,
          ...(current.endFrame !== undefined && current.endFrame < frame
            ? { endFrame: frame }
            : {}),
        }
      : {
          ...current,
          endFrame: frame,
          ...(current.startFrame !== undefined && current.startFrame > frame
            ? { startFrame: frame }
            : {}),
        };
  if (
    simulationRange.startFrame === current.startFrame &&
    simulationRange.endFrame === current.endFrame
  ) {
    return scenario;
  }
  return { ...scenario, battle: { ...scenario.battle, simulationRange } };
}

export function clearSimulationRangeBoundary(
  scenario: ScenarioDocument,
  boundary: 'start' | 'end',
): ScenarioDocument {
  const current = scenario.battle.simulationRange;
  if (current === undefined || current[`${boundary}Frame`] === undefined) return scenario;
  const simulationRange = { ...current };
  delete simulationRange[`${boundary}Frame`];
  if (simulationRange.startFrame === undefined && simulationRange.endFrame === undefined) {
    const { simulationRange: _removed, ...battle } = scenario.battle;
    return { ...scenario, battle };
  }
  return { ...scenario, battle: { ...scenario.battle, simulationRange } };
}

function placeScenarioMarker(scenario: ScenarioDocument, marker: ScenarioMarkerDocument) {
  requireTimelineMarkerFrame(
    scenario,
    marker.frame,
    markerSupportsPreparation(marker.kind) ? -scenario.battle.prepFrames : 0,
  );
  return appendScenarioMarker(scenario, marker);
}

export function addCycleBoundary(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  return placeScenarioMarker(scenario, { kind: 'cycleBoundary', id, frame });
}

export function addControlSwitch(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
  trackIndex: TrackIndex,
): ScenarioDocument {
  if (scenario.tracks[trackIndex] === null) throw new Error(`track ${trackIndex} is empty`);
  return placeScenarioMarker(scenario, {
    kind: 'controlSwitch',
    id,
    frame,
    owner: operatorOwner(scenario, trackIndex),
  });
}

export function setControlSwitchTrack(
  scenario: ScenarioDocument,
  id: string,
  trackIndex: TrackIndex,
): ScenarioDocument {
  if (scenario.tracks[trackIndex] === null) throw new Error(`track ${trackIndex} is empty`);
  const previous = scenario.markers.find(
    marker => marker.kind === 'controlSwitch' && marker.id === id,
  );
  if (
    previous?.kind !== 'controlSwitch' ||
    resolveScenarioMarkerTrack(scenario.tracks, previous.owner) === trackIndex
  )
    return scenario;
  return {
    ...scenario,
    markers: scenario.markers.map(marker =>
      marker.kind === 'controlSwitch' && marker.id === id
        ? { ...marker, owner: operatorOwner(scenario, trackIndex) }
        : marker,
    ),
  };
}

export function addDodgeMarker(
  scenario: ScenarioDocument,
  marker: TrackDodgeInput,
): ScenarioDocument {
  if (scenario.tracks[marker.trackIndex] === null) {
    throw new Error(`track ${marker.trackIndex} is empty`);
  }
  resolveDodgeMarkerLastInputFrame(marker);
  if (marker.mode.kind === 'perfectDodge' && marker.mode.successDelayFrames < 0) {
    throw new RangeError('perfect dodge success delay must be non-negative');
  }
  return placeScenarioMarker(scenario, {
    kind: 'dodge',
    id: marker.id,
    frame: marker.frame,
    direction: marker.direction,
    mode: marker.mode,
    owner: operatorOwner(scenario, marker.trackIndex),
  });
}

/** 更新闪避方向、目标轨道或极限闪避声明；时间由移动命令单独维护。 */
export function updateDodgeMarker(
  scenario: ScenarioDocument,
  id: string,
  patch: Partial<Pick<TrackDodgeInput, 'trackIndex' | 'direction' | 'mode'>>,
): ScenarioDocument {
  const current = dodgeInputs(scenario);
  const index = current.findIndex(item => item.id === id);
  if (index < 0) return scenario;
  const updated = { ...current[index]!, ...patch };
  if (scenario.tracks[updated.trackIndex] === null) {
    throw new Error(`track ${updated.trackIndex} is empty`);
  }
  if (updated.mode.kind === 'perfectDodge' && updated.mode.successDelayFrames < 0) {
    throw new RangeError('perfect dodge success delay must be non-negative');
  }
  resolveDodgeMarkerLastInputFrame(updated);
  return {
    ...scenario,
    markers: scenario.markers.map(marker =>
      marker.kind === 'dodge' && marker.id === id
        ? {
            ...marker,
            direction: updated.direction,
            mode: updated.mode,
            owner: operatorOwner(scenario, updated.trackIndex),
          }
        : marker,
    ),
  };
}

export function placeInteractionMarker(
  scenario: ScenarioDocument,
  marker: InteractionMarker,
): ScenarioDocument {
  if (marker.kind !== 'comboCooldownControl' && marker.owner.scope === 'emptySlot')
    throw new Error('interaction requires an operator');
  return placeScenarioMarker(scenario, marker);
}

export function setSkillCastInitialBlackboard(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  values: Readonly<Record<string, number>>,
): ScenarioDocument {
  if (Object.entries(values).some(([key, value]) => !key || !Number.isFinite(value)))
    throw new Error('invalid skill initial blackboard');
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  const simulationInputs = { ...cast.simulationInputs };
  if (Object.keys(values).length) simulationInputs.initialBlackboard = { ...values };
  else delete simulationInputs.initialBlackboard;
  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, simulationInputs };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/** undefined 清除标记；暴击覆盖保留明确的不暴击。 */
export function setHitOverride(
  scenario: ScenarioDocument,
  field: HitOverrideField,
  key: string,
  value: boolean | undefined,
): ScenarioDocument {
  if (field === 'hitWeaknessBreaks' && !value) value = undefined;
  if (field === 'hitWeaknessBreaks' && value && scenario.battle.hitWeaknessBreaks?.[key])
    return scenario;
  if (scenario.battle[field]?.[key] === value) return scenario;
  const overrides: Record<string, HitOverrideValue> = { ...scenario.battle[field] };
  if (value === undefined) delete overrides[key];
  else overrides[key] = value;
  const battle = { ...scenario.battle, [field]: overrides };
  if (!Object.keys(overrides).length) delete battle[field];
  return { ...scenario, battle };
}

export function setHitWeaknessBreakStagger(
  scenario: ScenarioDocument,
  key: string,
  stagger: number,
): ScenarioDocument {
  if (!Number.isFinite(stagger) || stagger < 0)
    throw new RangeError('weakness break stagger must be a finite non-negative number');
  const marks = scenario.battle.hitWeaknessBreaks;
  const mark = marks?.[key];
  if (!mark || stagger === (mark === true ? 0 : mark.stagger)) return scenario;
  return {
    ...scenario,
    battle: {
      ...scenario.battle,
      hitWeaknessBreaks: { ...marks, [key]: stagger ? { stagger } : true },
    },
  };
}
