/**
 * 技能库的分组只决定展示与放置；不得参与运行时技能路由或替换。
 * 本文件是基础链、具名形态、换槽技能和内部技能在编辑器放置层的唯一解释器。
 */
import type {
  SkillDefinition,
  SkillGroupDefinition,
  SkillLibraryNameQualifier,
  SkillLevelSource,
  SkillType,
} from '../../core/game-data/operatorDefinition';

export interface SkillGroupLibraryPlacement {
  readonly entryKey: string;
  readonly variantKey?: string;
  readonly placementSkillKey?: string;
  readonly levelSource: SkillLevelSource;
  readonly skillType: SkillType;
  readonly skills: readonly SkillDefinition[];
  /** 只修饰技能名称，不参与放置身份或运行时解析。 */
  readonly nameQualifier?: SkillLibraryNameQualifier;
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

function asSkills(value: SkillDefinition | readonly SkillDefinition[]): readonly SkillDefinition[] {
  return Array.isArray(value) ? value : [value as SkillDefinition];
}

function placeableReplacementSkills(group: SkillGroupDefinition): readonly SkillDefinition[] {
  return [
    ...(group.replacementSkills ?? []),
    ...(group.routedReplacementSkills ?? []).map(replacement => replacement.skill),
  ].filter(skill => group.replacementSkillPlacements?.[skill.key] !== 'internal');
}

function skillIndex(group: SkillGroupDefinition): ReadonlyMap<string, SkillDefinition> {
  return new Map([
    ...asSkills(group.skills).map(skill => [skill.key, skill] as const),
    ...(group.replacementSkills ?? []).map(skill => [skill.key, skill] as const),
    ...(group.routedReplacementSkills ?? []).map(
      replacement => [replacement.skill.key, replacement.skill] as const,
    ),
  ]);
}

function resolvePlacementSequence(group: SkillGroupDefinition): readonly SkillDefinition[] {
  if (group.placementSequenceSkillKeys === undefined) return asSkills(group.skills);
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

function resolveEntryLevelSource(
  group: SkillGroupDefinition,
  skills: readonly SkillDefinition[],
  fallback: SkillLevelSource,
): SkillLevelSource {
  const sources = new Set(
    skills.map(skill => skill.levelSource).filter(source => source !== undefined),
  );
  if (sources.size > 1) {
    throw new Error(`skill group '${group.key}' library entry mixes multiple level sources`);
  }
  // 自由编辑的旧项目定义可能尚未把等级来源下沉到技能；只为这类存档保留组级兼容值。
  return sources.values().next().value ?? fallback;
}

/** 枚举技能库中可见的卡片；有序换槽技能只进入基础链，不重复生成独立卡片。 */
export function listSkillGroupLibraryPlacements(
  group: SkillGroupDefinition,
): readonly SkillGroupLibraryPlacement[] {
  const sequenceSkillKeys = new Set(group.placementSequenceSkillKeys ?? []);
  const replacementPlacements = group.replacementSkillPlacements ?? {};
  const baseSkills = resolvePlacementSequence(group);
  return [
    {
      entryKey: `${group.key}:base`,
      levelSource: resolveEntryLevelSource(group, baseSkills, group.levelSource),
      skillType: group.skillType,
      skills: baseSkills,
      ...(group.libraryNameQualifier === undefined
        ? {}
        : { nameQualifier: group.libraryNameQualifier }),
    },
    ...(group.variants ?? []).map(variant => {
      const skills = asSkills(variant.skills);
      return {
        entryKey: `${group.key}:variant:${variant.key}`,
        variantKey: variant.key,
        levelSource: resolveEntryLevelSource(group, skills, variant.levelSource),
        skillType: group.skillType,
        skills,
        ...(variant.libraryNameQualifier === undefined
          ? {}
          : { nameQualifier: variant.libraryNameQualifier }),
      };
    }),
    ...(group.replacementSkills ?? [])
      .filter(
        skill =>
          !sequenceSkillKeys.has(skill.key) && replacementPlacements[skill.key] !== 'internal',
      )
      .map(skill => ({
        entryKey: `${group.key}:replacement:${skill.key}`,
        placementSkillKey: skill.key,
        levelSource: resolveEntryLevelSource(group, [skill], group.levelSource),
        skillType: skill.skillType ?? group.skillType,
        skills: [skill],
        ...(group.replacementSkillNameQualifiers?.[skill.key] === undefined
          ? {}
          : { nameQualifier: group.replacementSkillNameQualifiers[skill.key] }),
      })),
    ...(group.routedReplacementSkills ?? [])
      .filter(
        replacement =>
          !sequenceSkillKeys.has(replacement.skill.key) &&
          replacementPlacements[replacement.skill.key] !== 'internal',
      )
      .map(replacement => ({
        entryKey: `${group.key}:routed:${replacement.skill.key}`,
        placementSkillKey: replacement.skill.key,
        levelSource: resolveEntryLevelSource(group, [replacement.skill], replacement.levelSource),
        skillType: replacement.skill.skillType ?? replacement.skillType,
        skills: [replacement.skill],
        ...(group.replacementSkillNameQualifiers?.[replacement.skill.key] === undefined
          ? {}
          : { nameQualifier: group.replacementSkillNameQualifiers[replacement.skill.key] }),
      })),
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
    variant === undefined ? resolvePlacementSequence(group) : asSkills(variant.skills);
  if (skillKey === undefined) return defaultSkills;

  const candidates = [
    ...(variant === undefined ? asSkills(group.skills) : asSkills(variant.skills)),
    ...placeableReplacementSkills(group),
  ];
  const selected = candidates.filter(skill => skill.key === skillKey);
  if (selected.length === 0) {
    throw new Error(`skill group '${group.key}' has no skill '${skillKey}'`);
  }
  return selected;
}
