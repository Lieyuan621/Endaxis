/**
 * 技能库的分组只决定展示与放置；不得参与运行时技能路由或替换。
 * 本文件是基础链、具名形态、换槽技能和内部技能在编辑器放置层的唯一解释器。
 */
import type {
  SkillDefinition,
  SkillGroupDefinition,
} from '../../core/game-data/operatorDefinition';

import { asSkillDefinitions } from '../../core/game-data/operatorSkillDefinitions';
import type { OperationType } from '../../../packages/game-data-contract/src/primitives';

export interface SkillGroupLibraryPlacement {
  readonly entryKey: string;
  readonly variantKey?: string;
  readonly operationType: OperationType;
  readonly skills: readonly SkillDefinition[];
  /** 只修饰技能名称，不参与放置身份或运行时解析。 */
  readonly nameKey?: string;
}

/** 局部边界在技能更新后到达；默认块体覆盖至下一次输入，零宽内部技能仍保持零宽。 */
export function skillPlacementDisplayFrames(localBoundaryFrames: number): number {
  return localBoundaryFrames > 0 ? localBoundaryFrames + 1 : 0;
}

/**
 * 新放置链的默认布局，不读取或改写已有技能块。
 * 释放帧的技能 delta 为零，输入又先于技能更新，因此下一段默认晚一个输入边界。
 * 这里仍是未计攻速、时间膨胀的放置建议，不保证任意战斗状态下都可续段。
 */
export function layoutSkillGroupPlacement(
  skills: readonly Pick<SkillDefinition, 'timelineBlockFrames'>[],
): { readonly offsets: readonly number[]; readonly durationFrames: number } {
  const offsets: number[] = [];
  let durationFrames = 0;
  skills.forEach(skill => {
    offsets.push(durationFrames);
    durationFrames += skillPlacementDisplayFrames(skill.timelineBlockFrames);
  });
  return { offsets, durationFrames };
}

function placeableReplacementSkills(group: SkillGroupDefinition): readonly SkillDefinition[] {
  return [
    ...(group.replacementSkills ?? []),
    ...(group.routedReplacementSkills ?? []).map(replacement => replacement.skill),
  ].filter(skill => group.replacementSkillPlacements?.[skill.key] !== 'internal');
}

function skillIndex(group: SkillGroupDefinition): ReadonlyMap<string, SkillDefinition> {
  return new Map([
    ...asSkillDefinitions(group.skills).map(skill => [skill.key, skill] as const),
    ...(group.replacementSkills ?? []).map(skill => [skill.key, skill] as const),
    ...(group.routedReplacementSkills ?? []).map(
      replacement => [replacement.skill.key, replacement.skill] as const,
    ),
  ]);
}

function resolvePlacementSequence(group: SkillGroupDefinition): readonly SkillDefinition[] {
  if (group.placementSequenceSkillKeys === undefined) {
    return [
      ...asSkillDefinitions(group.skills),
      ...(group.routedReplacementSkills ?? []).map(route => route.skill),
    ];
  }
  const byKey = skillIndex(group);
  return group.placementSequenceSkillKeys.map(skillKey => {
    const skill = byKey.get(skillKey);
    if (skill === undefined) {
      throw new Error(`skill group '${group.key}' placement sequence has no skill '${skillKey}'`);
    }
    if (group.replacementSkillPlacements?.[skillKey] === 'internal') {
      throw new Error(
        `skill group '${group.key}' placement sequence contains internal skill '${skillKey}'`,
      );
    }
    return skill;
  });
}

/** 枚举技能库中可见的卡片；有序换槽技能只进入基础链，不重复生成独立卡片。 */
export function listSkillGroupLibraryPlacements(
  group: SkillGroupDefinition,
): readonly SkillGroupLibraryPlacement[] {
  const baseSkills = resolvePlacementSequence(group);
  return [
    {
      entryKey: `${group.key}:base`,
      operationType: group.operationType,
      skills: baseSkills,
      ...(group.nameKey === undefined ? {} : { nameKey: group.nameKey }),
    },
    ...(group.variants ?? []).map(variant => {
      const skills = asSkillDefinitions(variant.skills);
      return {
        entryKey: `${group.key}:variant:${variant.key}`,
        variantKey: variant.key,
        operationType: group.operationType,
        skills,
        ...((variant.nameKey ?? group.nameKey) === undefined
          ? {}
          : { nameKey: variant.nameKey ?? group.nameKey }),
      };
    }),
  ];
}

/** 解析一次技能库放置实际写入时间轴的技能链。 */
export function resolveSkillGroupPlacementSkills(
  group: SkillGroupDefinition,
  variantKey?: string,
  skillKey?: string,
): readonly SkillDefinition[] {
  const variant =
    variantKey === undefined
      ? undefined
      : group.variants?.find(candidate => candidate.key === variantKey);
  if (variantKey !== undefined && variant === undefined) {
    throw new Error(`skill group '${group.key}' has no variant '${variantKey}'`);
  }

  const defaultSkills =
    variant === undefined ? resolvePlacementSequence(group) : asSkillDefinitions(variant.skills);
  if (skillKey === undefined) return defaultSkills;

  const candidates = [
    ...(variant === undefined
      ? asSkillDefinitions(group.skills)
      : asSkillDefinitions(variant.skills)),
    ...placeableReplacementSkills(group),
  ];
  const selected = candidates.filter(skill => skill.key === skillKey);
  if (selected.length === 0) {
    throw new Error(`skill group '${group.key}' has no skill '${skillKey}'`);
  }
  return selected;
}
