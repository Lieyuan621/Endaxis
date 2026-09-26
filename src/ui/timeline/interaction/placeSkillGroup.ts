/**
 * 把新版干员定义中的技能库条目转换为存档中的稳定放置数据。
 * 本层只生成定义默认值和身份，不执行模拟；调用方必须提供可进入撤销历史的稳定 ID 分配器。
 */
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';

import type {
  ScenarioDocument,
  SkillCastDocument,
  TrackDocument,
  TrackIndex,
} from '../../../core/project/schema';
import { resolveUniquePlayerActionForSkill } from '../../../core/game-data/resolvePlayerActionRoute';
import {
  layoutSkillGroupPlacement,
  resolveSkillGroupPlacementSkills,
} from '../../../application/editor/skillGroupPlacement';
import type { RecursiveSkillChain } from '../../../application/simulation/recursiveSkillChain';

/** 放置命令生成稳定文档身份所需的端口。 */
export type TimelineDocumentIdKind =
  | 'track'
  | 'skillCast'
  | 'scheduledSequence'
  | 'hit'
  | 'customBar'
  | 'connection'
  | 'cycleBoundary'
  | 'controlSwitch'
  | 'externalEvent'
  | 'dodge'
  | 'consumableUse';

export interface TimelineDocumentIdAllocator {
  allocate(kind: TimelineDocumentIdKind): string;
}

export interface PlaceSkillGroupInput {
  readonly scenario: ScenarioDocument;
  readonly trackIndex: TrackIndex;
  readonly operator: OperatorDefinition;
  readonly skillGroupKey: string;
  readonly variantKey?: string;
  /** 只放置技能组中的指定技能；省略时按声明顺序放置完整技能组。 */
  readonly skillKey?: string;
  readonly startFrame: number;
  readonly ids: TimelineDocumentIdAllocator;
}

/** 放置后的新场景及本次创建的技能块身份。 */
export interface SkillPlacement {
  readonly scenario: ScenarioDocument;
  readonly skillCastIds: readonly string[];
}

export interface PlaceSkillGroupResult extends SkillPlacement {
  readonly extension?: RecursiveSkillChain;
  readonly fallback?: SkillPlacement;
}

/**
 * 把一次技能库放置最终产生的多段技能按本次放置顺序连成连续组。
 * 调用时规划已经结束，各段仍保存固定起点；这里只保留首段起点，不重建技能身份。
 */
export function groupPlacedSkillSequence(
  scenario: ScenarioDocument,
  skillCastIds: readonly string[],
): ScenarioDocument {
  if (skillCastIds.length < 2) return scenario;
  if (new Set(skillCastIds).size !== skillCastIds.length) {
    throw new Error('placed skill sequence contains duplicate cast IDs');
  }
  const selectedIds = new Set(skillCastIds);
  const matchingTracks = scenario.tracks.filter(
    (track): track is TrackDocument =>
      track !== null && track.skillCasts.filter(cast => selectedIds.has(cast.id)).length > 0,
  );
  if (matchingTracks.length !== 1) {
    throw new Error('placed skill sequence must belong to one track');
  }
  const track = matchingTracks[0]!;
  const byId = new Map(track.skillCasts.map(cast => [cast.id, cast] as const));
  if (skillCastIds.some(id => !byId.has(id))) {
    throw new Error('placed skill sequence contains a missing cast ID');
  }
  const first = byId.get(skillCastIds[0]!)!;
  if (first.placement.startFrame === undefined) {
    throw new Error('placed skill sequence requires an absolute first cast');
  }
  const placements = new Map<string, SkillCastDocument['placement']>(
    skillCastIds.map((id, index) => [
      id,
      index === 0
        ? { startFrame: first.placement.startFrame! }
        : { afterCastId: skillCastIds[index - 1]! },
    ]),
  );
  const tracks = scenario.tracks.map(candidate =>
    candidate !== track
      ? candidate
      : {
          ...track,
          skillCasts: track.skillCasts.map(cast => {
            const placement = placements.get(cast.id);
            return placement === undefined ? cast : { ...cast, placement };
          }),
        },
  ) as ScenarioDocument['tracks'];
  return { ...scenario, tracks };
}

/** 按技能组声明的策略续段；展示仍由完整技能列表决定。单段放置不扩展。 */
export function placeLibrarySkillGroup(input: PlaceSkillGroupInput): PlaceSkillGroupResult {
  const group = input.operator.skillGroups.find(group => group.key === input.skillGroupKey);
  if (!group || input.skillKey !== undefined) return placeSkillGroup(input);
  const policy =
    input.variantKey === undefined
      ? group.placementPolicy
      : group.variants?.find(variant => variant.key === input.variantKey)?.placementPolicy;
  if (!policy) return placeSkillGroup(input);
  const skills = resolveSkillGroupPlacementSkills(group, input.variantKey);
  const first = skills.find(skill => skill.key === policy.firstSkillKey);
  if (!first) throw new Error('placement policy has no first skill');
  const terminal = policy.terminalSkillKey;
  if (!skills.some(skill => skill.key === terminal))
    throw new Error('placement policy has no terminal skill');
  if (!Number.isSafeInteger(policy.maxSegments) || policy.maxSegments < skills.length)
    throw new Error('placement policy limit must cover the fallback sequence');
  const seed = placeSkillGroup({ ...input, skillKey: first.key });
  const reservedCastIds = Array.from({ length: policy.maxSegments - 1 }, () =>
    input.ids.allocate('skillCast'),
  );
  const fallbackIds = [...seed.skillCastIds, ...reservedCastIds];
  let fallbackIndex = 0;
  const fallback = placeSkillGroup({
    ...input,
    ids: { allocate: () => fallbackIds[fallbackIndex++]! },
  });
  return {
    ...seed,
    fallback,
    extension: {
      allowedSkillKeys: skills.map(skill => skill.key),
      terminalSkillKey: terminal,
      reservedCastIds,
    },
  };
}

/**
 * 按技能组声明顺序放置一个技能或技能链。
 * 多段序列使用默认放置布局，保留技能更新到下一次输入之间的边界帧。
 * 不展开 `LevelValues`，不预编译；技能定义在编译时按当前等级重新解析。
 */
export function placeSkillGroup(input: PlaceSkillGroupInput): PlaceSkillGroupResult {
  if (!Number.isInteger(input.startFrame) || input.startFrame < -input.scenario.battle.prepFrames) {
    throw new RangeError('startFrame must be an integer within the visible timeline');
  }
  const track = input.scenario.tracks[input.trackIndex];
  if (track === null) throw new Error(`track ${input.trackIndex} is empty`);
  const operatorInstance = track.operator;
  if (operatorInstance === null)
    throw new Error(`track ${input.trackIndex} has no operator instance`);
  if (operatorInstance.operatorSlug !== input.operator.slug) {
    throw new Error(
      `track '${track.id}' operator references '${operatorInstance.operatorSlug}', not '${input.operator.slug}'`,
    );
  }
  const group = input.operator.skillGroups.find(candidate => candidate.key === input.skillGroupKey);
  if (group === undefined) {
    throw new Error(
      `operator '${input.operator.slug}' has no skill group '${input.skillGroupKey}'`,
    );
  }

  const skills = resolveSkillGroupPlacementSkills(group, input.variantKey, input.skillKey);
  const created: SkillCastDocument[] = [];
  const layout = layoutSkillGroupPlacement(skills);

  skills.forEach((skill, index) => {
    const skillCastId = input.ids.allocate('skillCast');
    const action = resolveUniquePlayerActionForSkill(input.operator, skill.key);
    created.push({
      id: skillCastId,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: group.key,
        skillKey: skill.key,
        ...(action === undefined ? {} : { action }),
      },
      placement: { startFrame: input.startFrame + layout.offsets[index]! },
    });
  });

  const tracks = [...input.scenario.tracks] as ScenarioDocument['tracks'];
  tracks[input.trackIndex] = { ...track, skillCasts: [...track.skillCasts, ...created] };
  return {
    scenario: { ...input.scenario, tracks },
    skillCastIds: created.map(skillCast => skillCast.id),
  };
}
