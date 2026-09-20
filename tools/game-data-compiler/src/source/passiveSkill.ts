import { parseConditionLeafSource, type NativeConditionSource } from './condition.ts';
import {
  requireArray,
  requireExactFields,
  requireInteger,
  requireRecord,
} from './primitives.ts';
import {
  parseSkillDefinitionReferenceSource,
  type DefinitionReferenceSource,
} from './referenceGraph.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { parseSkillBuffInstallSources, type SkillBuffInstallSource } from './skillBuffInstall.ts';
import type { SkillActionGraphSource } from './skillActionGraph.ts';
import { parseSkillActionGraphSource } from './skillActionGraph.ts';
import { readPassiveSkillType, readSkillCastType } from './skillDispatch.ts';
import {
  parseKnownNativeActionLeafSource,
  type KnownNativeActionLeafSource,
} from './actionLeaf.ts';
import {
  parseGameplayAttributeModifierSource,
  type GameplayAttributeModifierSource,
} from './attributeModifiers.ts';

export interface PassiveSkillToggleBuffSource {
  readonly conditions: readonly NativeConditionSource[];
  readonly buffs: readonly SkillBuffInstallSource[];
}

/**
 * 领域无关的原生被动 SkillData。它不说明被动属于干员天赋、潜能、武器或装备，
 * 也不在来源层把 AddBuff/ToggleBuff 投影成 Endaxis 安装策略。
 */
export interface NativePassiveSkillSource {
  readonly skillId: string;
  readonly level: number;
  readonly passiveType: string;
  readonly skillSpecification: string | number;
  readonly skillTagIds: readonly number[];
  readonly cardAttributeModifiers: GameplayAttributeModifierSource;
  readonly startupBuffs: readonly SkillBuffInstallSource[];
  readonly toggleBuffs: readonly PassiveSkillToggleBuffSource[];
  readonly actionGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly references: readonly DefinitionReferenceSource[];
}

export function parseNativePassiveSkillSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativePassiveSkillSource {
  const root = requireRecord(value, sourcePath);
  if (readSkillCastType(root.castType, `${sourcePath}.castType`) !== 'Passive') {
    throw new Error(`${sourcePath}.castType: expected "Passive"`);
  }
  const passiveType = readPassiveSkillType(
    root.passiveSkillType,
    `${sourcePath}.passiveSkillType`,
  );
  const definition = parseSkillDefinitionReferenceSource(value, sourcePath, inheritedBlackboard);
  return {
    skillId: definition.actionGraph.skillId,
    level: definition.actionGraph.level,
    passiveType,
    skillSpecification: parseSkillSpecification(
      root.skillSpecification,
      `${sourcePath}.skillSpecification`,
    ),
    skillTagIds: parseSkillTagIds(root.skillTags, `${sourcePath}.skillTags`),
    cardAttributeModifiers: parseGameplayAttributeModifierSource(
      root.cardAttributeModifier,
      `${sourcePath}.cardAttributeModifier`,
      inheritedBlackboard,
    ),
    // ToggleBuffPassiveSkill.DoEnable 不调用普通 Skill.DoEnable，也不读取 buffs +0xD0。
    startupBuffs:
      passiveType === 'ToggleBuff'
        ? requireIgnoredBuffArray(root.buffs, `${sourcePath}.buffs`)
        : parseSkillBuffInstallSources(root.buffs, `${sourcePath}.buffs`),
    // 原生工厂只有 ToggleBuff 会构造 ToggleBuffPassiveSkill 并读取这张表。
    // AddBuff 等普通 Skill 中即使残留了序列化内容，运行时也不会访问，不能把它纳入定义闭包。
    toggleBuffs:
      passiveType === 'ToggleBuff'
        ? parseToggleBuffs(root.toggleBuffs, `${sourcePath}.toggleBuffs`, inheritedBlackboard)
        : requireIgnoredToggleBuffArray(root.toggleBuffs, `${sourcePath}.toggleBuffs`),
    // 引用闭包允许把无引用叶子标成 untracked；可执行被动程序必须重新走完整公共 Action parser。
    actionGraph: parseSkillActionGraphSource(
      value,
      sourcePath,
      inheritedBlackboard,
      (leaf, leafPath) => parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
    ),
    references: definition.references,
  };
}

function requireIgnoredToggleBuffArray(value: unknown, path: string): [] {
  requireArray(value, path);
  return [];
}

function requireIgnoredBuffArray(value: unknown, path: string): [] {
  requireArray(value, path);
  return [];
}

function parseToggleBuffs(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): PassiveSkillToggleBuffSource[] {
  return requireArray(value, path).map((rawGroup, groupIndex) => {
    const groupPath = `${path}[${groupIndex}]`;
    const group = requireRecord(rawGroup, groupPath);
    requireExactFields(group, new Set(['conditions', 'buffs']), groupPath);
    return {
      conditions: requireArray(group.conditions, `${groupPath}.conditions`).map(
        (condition, conditionIndex) =>
          parseConditionLeafSource(
            condition,
            `${groupPath}.conditions[${conditionIndex}]`,
            inheritedBlackboard,
          ),
      ),
      buffs: parseSkillBuffInstallSources(group.buffs, `${groupPath}.buffs`),
    };
  });
}

function parseSkillSpecification(value: unknown, path: string): string | number {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number') return requireInteger(value, path);
  throw new Error(`${path}: expected enum name or integer`);
}

function parseSkillTagIds(value: unknown, path: string): number[] {
  const group = requireRecord(value, path);
  requireExactFields(group, new Set(['predefinedTag']), path);
  return requireArray(group.predefinedTag, `${path}.predefinedTag`).map((rawTag, tagIndex) => {
    const tagPath = `${path}.predefinedTag[${tagIndex}]`;
    const tag = requireRecord(rawTag, tagPath);
    requireExactFields(tag, new Set(['tagId']), tagPath);
    return requireInteger(tag.tagId, `${tagPath}.tagId`);
  });
}
