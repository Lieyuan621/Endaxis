import type { LevelValues } from '../../../../../packages/game-data-contract/src/index.ts';
import {
  WEAPON_RARITIES,
  type WeaponRarity,
  type WeaponDefinition,
  type WeaponTraitDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import { compileCardSkillBuildModifiers } from '../../compiler/build/cardSkillBuildModifiers.ts';
import { compilePassiveSkillRequestBatch } from '../../compiler/skills/passiveSkillBatch.ts';
import {
  materializePassiveBuffInstallation,
  resolvePassiveSkillDefinitionBlackboard,
  type MaterializedPassiveBuffInstallationSource,
  type UnresolvedPassiveSkillBlackboardValueSource,
} from '../../compiler/skills/passiveSkillInstallation.ts';
import type { CompiledPassiveSkillDefinitionSource } from '../../compiler/skills/passiveSkillBatch.ts';
import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import type {
  BuildDefinitionDiagnosticSource,
  CompiledBuildModifierDefinitionSource,
} from '../../compiler/build/formalBuildDefinition.ts';
import { parseWeaponBaseAttackSources } from './baseAttack.ts';
import { parseWeaponBasicSources } from './basicTable.ts';
import { discoverWeaponPassiveSkillRequests } from './passiveDiscovery.ts';
import type { SkillActionGraphSource } from '../../source/skillActionGraph.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';

const FORMAL_BASE_ATTACK_LEVELS = [1, 20, 40, 60, 80, 90] as const;
function isWeaponRarity(value: number): value is WeaponRarity {
  return WEAPON_RARITIES.some(rarity => rarity === value);
}

/** 正式词条的静态输出子集，修正器已完成投影；不是优化 IR。 */
export type CompiledWeaponTraitStaticDefinitionSource = Readonly<
  Pick<WeaponTraitDefinition, 'key' | 'levelCount'>
> & {
  readonly modifiers: readonly CompiledBuildModifierDefinitionSource[];
};

/** 尚未装配 Buff/动作图的正式 WeaponDefinition 候选。 */
export type CompiledWeaponStaticDefinitionSource = Readonly<
  Pick<WeaponDefinition, 'slug' | 'rarity' | 'weaponType' | 'baseAttackAtLevelNodes'>
> & {
  readonly traits: readonly CompiledWeaponTraitStaticDefinitionSource[];
};

/** 安装条件的中间态：保留原生比较名及未解析值，运行装配阶段再按场景判定。 */
export interface CompiledWeaponToggleConditionSource {
  readonly kind: 'currentHpRatio';
  readonly comparison: string;
  readonly value: LevelValues | UnresolvedPassiveSkillBlackboardValueSource;
}

export interface CompiledWeaponToggleBuffGroupSource {
  readonly conditions: readonly CompiledWeaponToggleConditionSource[];
  readonly buffs: readonly MaterializedPassiveBuffInstallationSource<LevelValues>[];
}

/**
 * 静态编译产生、运行装配消费的依赖计划，不是另一套 WeaponDefinition。
 * 保留原生请求、动作图与等级身份，供公共编译器闭合资源及行为；不写入正式产物。
 */
export interface CompiledWeaponTraitRuntimeDependencySource {
  readonly weaponId: string;
  readonly traitKey: string;
  readonly slotIndex: number;
  readonly skillId: string;
  /**
   * 被动 SkillData 的完整可执行动作图。它不能因 Buff 引用闭包已闭合而被丢弃；
   * 正式运行定义必须显式编译它，或对非空程序失败关闭。
   */
  readonly actionGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  /** 保留原始安装请求和等级 ID，参数列下标对应这里的顺序，不把行号冒充原生等级。 */
  readonly request: PassiveSkillCompileRequestSource;
  readonly levels: readonly number[];
  readonly blackboard: Readonly<Record<string, LevelValues>>;
  readonly startupBuffs: readonly MaterializedPassiveBuffInstallationSource<LevelValues>[];
  readonly toggleBuffs: readonly CompiledWeaponToggleBuffGroupSource[];
  readonly referencedBuffIds: readonly string[];
}

export interface CompiledWeaponStaticDefinitionBatchSource {
  readonly definitions: readonly CompiledWeaponStaticDefinitionSource[];
  readonly runtimeDependencies: readonly CompiledWeaponTraitRuntimeDependencySource[];
  readonly diagnostics: readonly BuildDefinitionDiagnosticSource[];
}

/**
 * 编译武器中无需运行时解释即可确定的正式定义部分。
 *
 * 身份暂时使用原生 weaponId；展示名、图标和稳定公开 slug 必须由独立身份表提供，不能从
 * modelPath 或文本猜测。只要任一静态词条被阻断，该武器就不会出现在 definitions 中；但
 * 已解析的运行依赖仍完整返回，供后续 Buff/动作闭包审计使用。
 */
export function compileWeaponStaticDefinitionBatchSource(
  weaponBasicTableValue: unknown,
  weaponUpgradeTemplateTableValue: unknown,
  skillDataValue: unknown,
  skillPatchValue: unknown,
  weaponIds?: readonly string[],
): CompiledWeaponStaticDefinitionBatchSource {
  const selectedIds = [
    ...(weaponIds ?? Object.keys(requireWeaponTable(weaponBasicTableValue))),
  ].sort((left, right) => left.localeCompare(right));
  const weapons = parseWeaponBasicSources(weaponBasicTableValue, selectedIds);
  const baseAttackSources = parseWeaponBaseAttackSources(
    weaponBasicTableValue,
    weaponUpgradeTemplateTableValue,
    selectedIds,
  );
  const requests = discoverWeaponPassiveSkillRequests(weaponBasicTableValue, selectedIds);
  const passiveBatch = compilePassiveSkillRequestBatch(requests, skillDataValue, skillPatchValue);
  const baseAttackByWeaponId = new Map(baseAttackSources.map(source => [source.weaponId, source]));
  const compiledBySkillId = new Map(
    passiveBatch.definitions.map(definition => [definition.skillId, definition]),
  );
  const requestsByWeaponId = groupRequestsByWeapon(requests);
  const definitions: CompiledWeaponStaticDefinitionSource[] = [];
  const runtimeDependencies: CompiledWeaponTraitRuntimeDependencySource[] = [];
  const diagnostics: BuildDefinitionDiagnosticSource[] = [];

  for (const weapon of weapons) {
    const blockedBefore = blockedCount(diagnostics);
    const baseAttack = baseAttackByWeaponId.get(weapon.weaponId)!;
    const baseAttackAtLevelNodes = FORMAL_BASE_ATTACK_LEVELS.map(level => {
      const row = baseAttack.upgradeLevels.find(entry => entry.weaponLevel === level);
      if (row === undefined) {
        diagnostics.push({
          status: 'blocked',
          sourcePath: `${baseAttack.sourcePath}.levelTemplateId`,
          reason: `WeaponDefinition requires an exact base-attack row at level ${level}`,
        });
        return Number.NaN;
      }
      return row.baseAttack;
    });
    if (!isWeaponRarity(weapon.rarity)) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `${weapon.sourcePath}.rarity`,
        reason: `WeaponDefinition cannot represent rarity ${weapon.rarity}`,
      });
    }

    const traits: CompiledWeaponTraitStaticDefinitionSource[] = [];
    const weaponRequests = requestsByWeaponId.get(weapon.weaponId) ?? [];
    for (const request of weaponRequests) {
      const compiled = requireCompiledSkill(request, compiledBySkillId);
      const levels = [...compiled.definition.blackboard.levels];
      const traitKey = resolveWeaponTraitKey(
        weapon.rarity,
        weaponRequests.length,
        request,
        traits.length,
      );
      const blackboard = resolvePassiveSkillDefinitionBlackboard(request, compiled);
      traits.push({
        key: traitKey,
        levelCount: levels.length,
        modifiers: compileCardSkillBuildModifiers(compiled, blackboard, diagnostics),
      });
      runtimeDependencies.push({
        weaponId: weapon.weaponId,
        traitKey,
        slotIndex:
          request.levelSource.kind === 'weaponProgression' ? request.levelSource.slotIndex : -1,
        skillId: request.skillId,
        actionGraph: compiled.definition.skill.actionGraph,
        request,
        levels,
        blackboard,
        startupBuffs: compiled.definition.skill.startupBuffs.map(buff =>
          materializePassiveBuffInstallation(buff, blackboard),
        ),
        toggleBuffs: compileToggleBuffs(compiled, blackboard),
        referencedBuffIds: compiled.definition.skill.references
          .filter(
            (
              reference,
            ): reference is typeof reference & { readonly kind: 'buff'; readonly id: string } =>
              reference.kind === 'buff' && reference.id !== null,
          )
          .map(reference => reference.id)
          .sort((left, right) => left.localeCompare(right)),
      });
    }

    if (blockedCount(diagnostics) === blockedBefore && isWeaponRarity(weapon.rarity)) {
      definitions.push({
        slug: weapon.weaponId,
        rarity: weapon.rarity,
        weaponType: weapon.weaponType,
        baseAttackAtLevelNodes,
        traits,
      });
    }
  }

  return { definitions, runtimeDependencies, diagnostics };
}

function resolveWeaponTraitKey(
  rarity: number,
  requestCount: number,
  request: PassiveSkillCompileRequestSource,
  fallbackIndex: number,
): `skill${number}` {
  if (request.levelSource.kind !== 'weaponProgression') return `skill${fallbackIndex + 1}`;
  const progressionSlotIndex = request.levelSource.slotIndex;
  // 三星武器的 weaponSkillList 把不存在的第二展示槽压掉了，但突破/潜能模板仍以
  // 紧凑数组位置 1 提供这条被动的等级列。只改变产品展示身份，不能改等级来源列。
  const displaySlotIndex =
    rarity === 3 && requestCount === 2 && progressionSlotIndex === 1 ? 2 : progressionSlotIndex;
  return `skill${displaySlotIndex + 1}`;
}

function requireWeaponTable(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('WeaponBasicTable: expected an object');
  }
  return value as Record<string, unknown>;
}

function groupRequestsByWeapon(
  requests: readonly PassiveSkillCompileRequestSource[],
): Map<string, PassiveSkillCompileRequestSource[]> {
  const result = new Map<string, PassiveSkillCompileRequestSource[]>();
  for (const request of requests) {
    const group = result.get(request.originId) ?? [];
    group.push(request);
    result.set(request.originId, group);
  }
  return result;
}

function requireCompiledSkill(
  request: PassiveSkillCompileRequestSource,
  definitions: ReadonlyMap<string, CompiledPassiveSkillDefinitionSource>,
): CompiledPassiveSkillDefinitionSource {
  const compiled = definitions.get(request.skillId);
  if (compiled === undefined) {
    throw new Error(`${request.sourcePath}: compiled passive skill ${request.skillId} is missing`);
  }
  return compiled;
}

function compileToggleBuffs(
  compiled: CompiledPassiveSkillDefinitionSource,
  blackboard: Readonly<Record<string, LevelValues>>,
): CompiledWeaponToggleBuffGroupSource[] {
  return compiled.definition.skill.toggleBuffs.map((group, groupIndex) => ({
    conditions: group.conditions.map((condition, conditionIndex) => {
      if (condition.kind !== 'currentHpRatio') {
        throw new Error(
          `${compiled.sourcePath}.toggleBuffs[${groupIndex}].conditions[${conditionIndex}]: unsupported weapon toggle condition ${JSON.stringify(condition.kind)}`,
        );
      }
      const key = condition.value.blackboardKey;
      const value = key === null ? condition.value.value : blackboard[key];
      return {
        kind: 'currentHpRatio' as const,
        comparison: condition.comparison,
        value: value ?? { kind: 'unresolvedSkillBlackboard' as const, key: key! },
      };
    }),
    buffs: group.buffs.map(buff => materializePassiveBuffInstallation(buff, blackboard)),
  }));
}

function blockedCount(diagnostics: readonly BuildDefinitionDiagnosticSource[]): number {
  return diagnostics.filter(entry => entry.status === 'blocked').length;
}
