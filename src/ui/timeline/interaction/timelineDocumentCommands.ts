import { validateGlobalConfig } from '../../../core/project/scenarioValidation';
import type { GlobalConfigDocument } from '../../../core/project/schema';
/**
 * 时间轴编辑器对存档执行的最小不可变命令。
 *
 * 组件不得直接改写持久化对象；后续撤销历史应记录这些命令的输入与输出，而不是 DOM 状态。
 */
import type {
  BattleDocument,
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
  WeaponInstanceDocument,
  GearInstanceDocument,
  ExternalCombatEventDocument,
  ExternalEventMarkerDocument,
  ExternalEventTargetDocument,
  DodgeMarkerDocument,
  GlobalOperatorStatModifierDocument,
  SkillCastDocument,
} from '../../../core/project/schema';
import {
  getSkillCastPlacementChains,
  resolveDodgeMarkerLastInputFrame,
} from '../../../core/project/skillCastPlacement';
import type { SkillDefinition } from '../../../core/game-data/operatorDefinition';
import { validateSkillDefinition } from '../../../core/game-data/validateSkillDefinition';

export type EditableBattleResourceRule = keyof Pick<
  BattleDocument['resourceRules'],
  'initialSp' | 'spRecoveryPerSecond'
>;

/** 战前准备只改变现实时间轴的负向可视区，不平移以战斗帧保存的技能或标记。 */
export function setBattlePrepFrames(
  scenario: ScenarioDocument,
  prepFrames: number,
): ScenarioDocument {
  if (!Number.isInteger(prepFrames) || prepFrames < 0) {
    throw new RangeError('prepFrames must be a non-negative integer');
  }
  if (scenario.battle.prepFrames === prepFrames) return scenario;
  return { ...scenario, battle: { ...scenario.battle, prepFrames } };
}

/** 折叠只改变准备区的编辑投影，不改变任何技能、标记或模拟帧。 */
export function setTimelinePrepExpanded(
  scenario: ScenarioDocument,
  prepExpanded: boolean,
): ScenarioDocument {
  if (scenario.editor.prepExpanded === prepExpanded) return scenario;
  return { ...scenario, editor: { ...scenario.editor, prepExpanded } };
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
    ...scenario.battle.cycleBoundaries.map(marker => marker.frame),
    ...scenario.battle.controlSwitches.map(marker => marker.frame),
    ...(scenario.battle.externalEventMarkers ?? []).map(marker => marker.frame),
    ...(scenario.battle.dodgeMarkers ?? []).map(resolveDodgeMarkerLastInputFrame),
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

/**
 * 替换场景级全局属性修正。比率字段使用核心统一的小数；技能类型范围目前只允许用于冷却缩减。
 * 完整列表形成一个撤销命令，UI 不得直接修改场景数组。
 */
export function setGlobalOperatorStatModifiers(
  scenario: ScenarioDocument,
  modifiers: readonly GlobalOperatorStatModifierDocument[],
): ScenarioDocument {
  const ids = new Set<string>();
  for (const modifier of modifiers) {
    if (modifier.id.length === 0 || ids.has(modifier.id)) {
      throw new TypeError('global modifier ids must be non-empty and unique');
    }
    ids.add(modifier.id);
    if (!Number.isFinite(modifier.value)) {
      throw new TypeError(`global modifier '${modifier.id}' value must be finite`);
    }
    if (modifier.modifier === 'skillCooldownReduction') {
      if (modifier.skillType !== 'comboSkill' || modifier.value >= 1) {
        throw new RangeError(
          `global cooldown reduction '${modifier.id}' requires comboSkill and a value less than 1`,
        );
      }
    } else if (modifier.skillType !== undefined) {
      throw new Error(`global modifier '${modifier.id}' does not support a skill-type scope`);
    }
  }
  if (JSON.stringify(scenario.globalConfig.modifiers) === JSON.stringify(modifiers))
    return scenario;
  return {
    ...scenario,
    globalConfig: {
      ...scenario.globalConfig,
      modifiers: modifiers.map(modifier => ({ ...modifier })),
    },
  };
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
    battle: {
      ...scenario.battle,
      controlSwitches: scenario.battle.controlSwitches.map(remap),
      ...(scenario.battle.dodgeMarkers === undefined
        ? {}
        : { dodgeMarkers: scenario.battle.dodgeMarkers.map(remap) }),
      ...(scenario.battle.externalEventMarkers === undefined
        ? {}
        : {
            externalEventMarkers: scenario.battle.externalEventMarkers.map(marker =>
              marker.target.scope === 'operator'
                ? { ...marker, target: remap(marker.target) }
                : marker,
            ),
          }),
    },
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
 * 调用方负责提供初始养成值和轨道身份；命令层只维护轨道实例、连线的一致性与空轨道语义。
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

/** 移动一项已放置技能，并保持其他轨道与技能对象引用不变。 */
export function moveSkillCast(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  startFrame: number,
  resolvedStartFrames?: ReadonlyMap<string, number>,
): ScenarioDocument {
  if (!Number.isInteger(startFrame) || startFrame < -scenario.battle.prepFrames) {
    throw new RangeError('startFrame must be an integer within the visible timeline');
  }
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  const chain = getSkillCastPlacementChains(track.skillCasts).find(chain =>
    chain.casts.some(member => member.id === skillCastId),
  )!;
  if (chain.casts.length > 1)
    return moveSkillCasts(
      scenario,
      new Set([skillCastId]),
      trackIndex,
      skillCastId,
      startFrame,
      resolvedStartFrames,
    );
  if (cast.presentation?.locked) return scenario;
  if (cast.placement.startFrame === startFrame) return scenario;

  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, placement: { startFrame } };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
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

/**
 * 让当前选择集按同一帧差整体移动，保持跨轨道动作之间的相对位置。
 * 涉及的链含锁定动作时整组不移动；边界只约束组首作者帧，尚未执行的后项可以超出模拟终点。
 */
export function moveSkillCasts(
  scenario: ScenarioDocument,
  skillCastIds: ReadonlySet<string>,
  anchorTrackIndex: TrackIndex,
  anchorSkillCastId: string,
  requestedAnchorStartFrame: number,
  resolvedStartFrames?: ReadonlyMap<string, number>,
  minimumFrame = -scenario.battle.prepFrames,
): ScenarioDocument {
  if (
    !Number.isInteger(requestedAnchorStartFrame) ||
    requestedAnchorStartFrame < -scenario.battle.prepFrames
  ) {
    throw new RangeError(
      'requestedAnchorStartFrame must be an integer within the visible timeline',
    );
  }
  if (!skillCastIds.has(anchorSkillCastId)) {
    throw new Error(`selection does not contain anchor skill cast '${anchorSkillCastId}'`);
  }

  const anchor = locateSkillCast(scenario, anchorTrackIndex, anchorSkillCastId).cast;
  const located = locateSkillCasts(scenario, skillCastIds);
  if (located.length !== skillCastIds.size) {
    throw new Error('selection contains a missing or duplicate skill cast identity');
  }
  const affected = scenario.tracks.flatMap(track =>
    track === null
      ? []
      : getSkillCastPlacementChains(track.skillCasts).filter(chain =>
          chain.casts.some(cast => skillCastIds.has(cast.id)),
        ),
  );
  const members = affected.flatMap(chain => chain.casts);
  if (members.some(cast => cast.presentation?.locked)) return scenario;
  const anchors = new Set(affected.map(chain => chain.anchor.id));
  const requestedDelta = requestedAnchorStartFrame - skillCastFrame(anchor, resolvedStartFrames);
  const frames = affected.map(chain => chain.anchor.placement.startFrame!);
  const minimumStartFrame = Math.min(...frames);
  const maximumStartFrame = Math.max(...frames);
  const delta = Math.max(
    minimumFrame - minimumStartFrame,
    Math.min(scenario.battle.durationFrames - maximumStartFrame, requestedDelta),
  );
  if (delta === 0) return scenario;

  const tracks = scenario.tracks.map(track => {
    if (track === null) return null;
    if (!track.skillCasts.some(cast => anchors.has(cast.id))) return track;
    return {
      ...track,
      skillCasts: track.skillCasts.map(cast =>
        anchors.has(cast.id)
          ? {
              ...cast,
              placement: { startFrame: cast.placement.startFrame! + delta },
            }
          : cast,
      ),
    };
  }) as ScenarioDocument['tracks'];
  return { ...scenario, tracks };
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

/** 切换一次释放中某个稳定伤害步骤的强制暴击输入。 */
export function setSkillCastForcedCritical(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  stepKey: string,
  forced: boolean,
): ScenarioDocument {
  if (stepKey.length === 0) throw new TypeError('forced-critical step key must not be empty');
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  const current = cast.simulationInputs?.criticalOverrides ?? {};
  if ((current[stepKey] === true) === forced) return scenario;
  const criticalOverrides = { ...current };
  if (forced) criticalOverrides[stepKey] = true;
  else delete criticalOverrides[stepKey];
  const remainingInputs = {
    ...cast.simulationInputs,
    ...(Object.keys(criticalOverrides).length === 0 ? {} : { criticalOverrides }),
  };
  if (Object.keys(criticalOverrides).length === 0) delete remainingInputs.criticalOverrides;
  const skillCasts = [...track.skillCasts];
  const { simulationInputs: _oldInputs, ...castWithoutInputs } = cast;
  skillCasts[castIndex] =
    Object.keys(remainingInputs).length === 0
      ? castWithoutInputs
      : { ...castWithoutInputs, simulationInputs: remainingInputs };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/**
 * 用完整定义替换一次干员技能释放的模板逻辑。
 * 命令负责最后一道结构校验并复制定义，避免面板绕过项目约束或继续修改已提交状态。
 */
export function setSkillCastCustomDefinition(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
  definition: SkillDefinition,
): ScenarioDocument {
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if (cast.source.kind !== 'operatorSkill') {
    throw new Error(`skill cast '${skillCastId}' is not based on an operator skill template`);
  }
  if (definition.key !== cast.source.skillKey) {
    throw new Error(
      `custom definition key '${definition.key}' does not match source skill key '${cast.source.skillKey}'`,
    );
  }
  const issues = validateSkillDefinition(definition, 'customDefinition');
  if (issues.length > 0) {
    const first = issues[0]!;
    throw new TypeError(`invalid custom definition at '${first.path}': ${first.message}`);
  }

  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = { ...cast, customDefinition: structuredClone(definition) };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/**
 * 为技能编辑器创建独立草稿。草稿来源可以是当前模板或已有完整覆盖；调用方编辑草稿不会改写
 * 游戏数据和场景，只有交给 `setSkillCastCustomDefinition` 后才会形成一次项目变更。
 */
export function createSkillDefinitionDraft(definition: SkillDefinition): SkillDefinition {
  return structuredClone(definition);
}

/** 删除完整自定义定义，使技能块重新使用当前游戏数据中的技能模板。 */
export function resetSkillCastToTemplate(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
): ScenarioDocument {
  const { track, castIndex, cast } = locateSkillCast(scenario, trackIndex, skillCastId);
  if (cast.customDefinition === undefined) return scenario;

  const { customDefinition: _removed, ...templateCast } = cast;
  const skillCasts = [...track.skillCasts];
  skillCasts[castIndex] = templateCast;
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, skillCasts };
  return { ...scenario, tracks };
}

/** 删除动作块及其连线。 */
export function removeSkillCast(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  skillCastId: string,
): ScenarioDocument {
  locateSkillCast(scenario, trackIndex, skillCastId);
  return removeSkillCasts(scenario, new Set([skillCastId]));
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

export function addCycleBoundary(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame);
  if (id.length === 0 || scenario.battle.cycleBoundaries.some(item => item.id === id)) {
    throw new Error(`invalid or duplicate cycle boundary id '${id}'`);
  }
  return {
    ...scenario,
    battle: {
      ...scenario.battle,
      cycleBoundaries: [...scenario.battle.cycleBoundaries, { id, frame }],
    },
  };
}

export function moveCycleBoundary(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame);
  const index = scenario.battle.cycleBoundaries.findIndex(item => item.id === id);
  if (index < 0 || scenario.battle.cycleBoundaries[index]!.frame === frame) return scenario;
  const cycleBoundaries = [...scenario.battle.cycleBoundaries];
  cycleBoundaries[index] = { ...cycleBoundaries[index]!, frame };
  return { ...scenario, battle: { ...scenario.battle, cycleBoundaries } };
}

export function removeCycleBoundary(scenario: ScenarioDocument, id: string): ScenarioDocument {
  const cycleBoundaries = scenario.battle.cycleBoundaries.filter(item => item.id !== id);
  if (cycleBoundaries.length === scenario.battle.cycleBoundaries.length) return scenario;
  return { ...scenario, battle: { ...scenario.battle, cycleBoundaries } };
}

export function addControlSwitch(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
  trackIndex: TrackIndex,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame, -scenario.battle.prepFrames);
  if (scenario.tracks[trackIndex] === null) throw new Error(`track ${trackIndex} is empty`);
  if (id.length === 0 || scenario.battle.controlSwitches.some(item => item.id === id)) {
    throw new Error(`invalid or duplicate control switch id '${id}'`);
  }
  return {
    ...scenario,
    battle: {
      ...scenario.battle,
      controlSwitches: [...scenario.battle.controlSwitches, { id, frame, trackIndex }],
    },
  };
}

export function moveControlSwitch(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame, -scenario.battle.prepFrames);
  const index = scenario.battle.controlSwitches.findIndex(item => item.id === id);
  if (index < 0 || scenario.battle.controlSwitches[index]!.frame === frame) return scenario;
  const controlSwitches = [...scenario.battle.controlSwitches];
  controlSwitches[index] = { ...controlSwitches[index]!, frame };
  return { ...scenario, battle: { ...scenario.battle, controlSwitches } };
}

export function setControlSwitchTrack(
  scenario: ScenarioDocument,
  id: string,
  trackIndex: TrackIndex,
): ScenarioDocument {
  if (scenario.tracks[trackIndex] === null) throw new Error(`track ${trackIndex} is empty`);
  const index = scenario.battle.controlSwitches.findIndex(item => item.id === id);
  if (index < 0 || scenario.battle.controlSwitches[index]!.trackIndex === trackIndex)
    return scenario;
  const controlSwitches = [...scenario.battle.controlSwitches];
  controlSwitches[index] = { ...controlSwitches[index]!, trackIndex };
  return { ...scenario, battle: { ...scenario.battle, controlSwitches } };
}

export function removeControlSwitch(scenario: ScenarioDocument, id: string): ScenarioDocument {
  const controlSwitches = scenario.battle.controlSwitches.filter(item => item.id !== id);
  if (controlSwitches.length === scenario.battle.controlSwitches.length) return scenario;
  return { ...scenario, battle: { ...scenario.battle, controlSwitches } };
}

export function addDodgeMarker(
  scenario: ScenarioDocument,
  marker: DodgeMarkerDocument,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, marker.frame, -scenario.battle.prepFrames);
  if (scenario.tracks[marker.trackIndex] === null) {
    throw new Error(`track ${marker.trackIndex} is empty`);
  }
  resolveDodgeMarkerLastInputFrame(marker);
  if (marker.mode.kind === 'perfectDodge' && marker.mode.successDelayFrames < 0) {
    throw new RangeError('perfect dodge success delay must be non-negative');
  }
  const current = scenario.battle.dodgeMarkers ?? [];
  if (marker.id.length === 0 || current.some(item => item.id === marker.id)) {
    throw new Error(`invalid or duplicate dodge marker id '${marker.id}'`);
  }
  return {
    ...scenario,
    battle: { ...scenario.battle, dodgeMarkers: [...current, marker] },
  };
}

export function moveDodgeMarker(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame, -scenario.battle.prepFrames);
  const current = scenario.battle.dodgeMarkers ?? [];
  const index = current.findIndex(item => item.id === id);
  if (index < 0 || current[index]!.frame === frame) return scenario;
  const dodgeMarkers = [...current];
  dodgeMarkers[index] = { ...dodgeMarkers[index]!, frame };
  resolveDodgeMarkerLastInputFrame(dodgeMarkers[index]!);
  return { ...scenario, battle: { ...scenario.battle, dodgeMarkers } };
}

/** 更新闪避方向、目标轨道或极限闪避声明；时间由移动命令单独维护。 */
export function updateDodgeMarker(
  scenario: ScenarioDocument,
  id: string,
  patch: Partial<Pick<DodgeMarkerDocument, 'trackIndex' | 'direction' | 'mode'>>,
): ScenarioDocument {
  const current = scenario.battle.dodgeMarkers ?? [];
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
  const dodgeMarkers = [...current];
  dodgeMarkers[index] = updated;
  return { ...scenario, battle: { ...scenario.battle, dodgeMarkers } };
}

export function removeDodgeMarker(scenario: ScenarioDocument, id: string): ScenarioDocument {
  const current = scenario.battle.dodgeMarkers ?? [];
  const dodgeMarkers = current.filter(item => item.id !== id);
  if (dodgeMarkers.length === current.length) return scenario;
  return { ...scenario, battle: { ...scenario.battle, dodgeMarkers } };
}

export function addExternalEventMarker(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
  target: ExternalEventTargetDocument,
  event: ExternalCombatEventDocument,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame);
  if (target.scope === 'operator' && scenario.tracks[target.trackIndex] === null) {
    throw new Error(`track ${target.trackIndex} is empty`);
  }
  const current = scenario.battle.externalEventMarkers ?? [];
  if (id.length === 0 || current.some(item => item.id === id)) {
    throw new Error(`invalid or duplicate external event id '${id}'`);
  }
  return {
    ...scenario,
    battle: {
      ...scenario.battle,
      externalEventMarkers: [...current, { id, frame, target, event }],
    },
  };
}

export function moveExternalEventMarker(
  scenario: ScenarioDocument,
  id: string,
  frame: number,
): ScenarioDocument {
  requireTimelineMarkerFrame(scenario, frame);
  const current = scenario.battle.externalEventMarkers ?? [];
  const index = current.findIndex(item => item.id === id);
  if (index < 0 || current[index]!.frame === frame) return scenario;
  const externalEventMarkers = [...current];
  externalEventMarkers[index] = { ...externalEventMarkers[index]!, frame };
  return { ...scenario, battle: { ...scenario.battle, externalEventMarkers } };
}

/** 更新外部事实本身；时间轴位置继续由专用移动命令维护。 */
export function updateExternalEventMarker(
  scenario: ScenarioDocument,
  id: string,
  patch: Partial<Pick<ExternalEventMarkerDocument, 'target' | 'event'>>,
): ScenarioDocument {
  const current = scenario.battle.externalEventMarkers ?? [];
  const index = current.findIndex(item => item.id === id);
  if (index < 0) return scenario;
  const marker = current[index]!;
  const target = patch.target ?? marker.target;
  if (target.scope === 'operator' && scenario.tracks[target.trackIndex] === null) {
    throw new Error(`track ${target.trackIndex} is empty`);
  }
  const updated = { ...marker, ...patch };
  if (updated.target === marker.target && updated.event === marker.event) return scenario;
  const externalEventMarkers = [...current];
  externalEventMarkers[index] = updated;
  return { ...scenario, battle: { ...scenario.battle, externalEventMarkers } };
}

export function removeExternalEventMarker(
  scenario: ScenarioDocument,
  id: string,
): ScenarioDocument {
  const current = scenario.battle.externalEventMarkers ?? [];
  const externalEventMarkers = current.filter(item => item.id !== id);
  if (externalEventMarkers.length === current.length) return scenario;
  return { ...scenario, battle: { ...scenario.battle, externalEventMarkers } };
}
