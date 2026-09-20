import type { GearSetDefinition } from '../../../../../packages/game-data-contract/src/equipment.ts';
import { compileCardSkillBuildModifiers } from '../../compiler/build/cardSkillBuildModifiers.ts';
import { compilePassiveSkillRequestBatch } from '../../compiler/skills/passiveSkillBatch.ts';
import {
  materializePassiveBuffInstallation,
  materializePassiveSkillInstallation,
  type MaterializedPassiveBuffInstallationSource,
  type UnresolvedPassiveSkillBlackboardValueSource,
} from '../../compiler/skills/passiveSkillInstallation.ts';
import { requireRecord } from '../../source/primitives.ts';
import { discoverEquipmentSuitPassiveSkillRequests } from './passiveDiscovery.ts';
import type {
  CompiledEquipmentModifierDefinitionSource,
  EquipmentDefinitionDiagnosticSource,
} from './formalDefinition.ts';

/** 正式套装的静态输出子集，行为闭包尚待装配。 */
export type CompiledGearSetStaticDefinitionSource = Readonly<Pick<GearSetDefinition, 'slug'>> & {
  readonly modifiers: readonly CompiledEquipmentModifierDefinitionSource[];
};

/** 静态编译产生、运行装配消费的依赖计划；安装参数及未解析值不写入正式套装定义。 */
export interface CompiledGearSetRuntimeDependencySource {
  readonly suitId: string;
  readonly skillId: string;
  readonly startupBuffIds: readonly string[];
  readonly startupBuffs: readonly CompiledGearSetBuffInstallationSource[];
  readonly toggleBuffIds: readonly string[];
  readonly toggleBuffs: readonly CompiledGearSetToggleBuffGroupSource[];
  readonly referencedBuffIds: readonly string[];
}

export interface CompiledGearSetToggleBuffGroupSource {
  readonly conditions: readonly CompiledGearSetToggleConditionSource[];
  readonly buffs: readonly CompiledGearSetBuffInstallationSource[];
}

export interface CompiledGearSetToggleConditionSource {
  readonly kind: 'currentHpRatio';
  readonly comparison: string;
  readonly value: number | UnresolvedSkillBlackboardValueSource;
}

export type CompiledGearSetBuffInstallationSource = MaterializedPassiveBuffInstallationSource;

/**
 * 服务端战斗被动技能可以携带客户端 SkillData/SkillPatch 中不存在的额外黑板值。
 * 静态阶段不能把它补成 0，也不能在尚未读取 BuffData 时断言该值一定会被消费。
 */
export type UnresolvedSkillBlackboardValueSource = UnresolvedPassiveSkillBlackboardValueSource;

export interface CompiledEquipmentSuitStaticDefinitionBatchSource {
  readonly definitions: readonly CompiledGearSetStaticDefinitionSource[];
  readonly runtimeDependencies: readonly CompiledGearSetRuntimeDependencySource[];
  readonly diagnostics: readonly EquipmentDefinitionDiagnosticSource[];
}

/**
 * 把套装 CardSkill 中构筑期即可确定的属性投影为正式 GearSetDefinition 候选。
 * Buff、ToggleBuff 和动作图只列为运行时依赖，调用方在这些依赖闭合前不得把候选注册成完整套装。
 */
export function compileEquipmentSuitStaticDefinitionBatchSource(
  equipSuitTableValue: unknown,
  skillDataValue: unknown,
  skillPatchValue: unknown,
  suitIds?: readonly string[],
): CompiledEquipmentSuitStaticDefinitionBatchSource {
  const equipSuitTable = requireRecord(equipSuitTableValue, 'EquipSuitTable');
  const selectedSuitIds = [...(suitIds ?? Object.keys(equipSuitTable))].sort((left, right) =>
    left.localeCompare(right),
  );
  const requests = discoverEquipmentSuitPassiveSkillRequests(
    equipSuitTable,
    selectedSuitIds,
    'EquipSuitTable',
  );
  const batch = compilePassiveSkillRequestBatch(
    requests,
    skillDataValue,
    skillPatchValue,
    'SkillData',
  );
  const definitionsBySkillId = new Map(batch.definitions.map(entry => [entry.skillId, entry]));
  const definitions: CompiledGearSetStaticDefinitionSource[] = [];
  const runtimeDependencies: CompiledGearSetRuntimeDependencySource[] = [];
  const diagnostics: EquipmentDefinitionDiagnosticSource[] = [];
  const seenSuitIds = new Set<string>();

  for (const request of requests) {
    if (seenSuitIds.has(request.originId)) {
      throw new Error(
        `EquipSuitTable: suit ${JSON.stringify(request.originId)} has multiple thresholds`,
      );
    }
    seenSuitIds.add(request.originId);
    if (
      request.levelSource.kind !== 'equipmentSuitThreshold' ||
      request.levelSource.requiredCount !== 3
    ) {
      throw new Error(`${request.sourcePath}: Next GearSetDefinition requires exactly 3 pieces`);
    }
    const compiled = definitionsBySkillId.get(request.skillId);
    if (compiled === undefined) {
      throw new Error(
        `${request.sourcePath}: compiled passive skill ${request.skillId} is missing`,
      );
    }
    const installation = materializePassiveSkillInstallation(request, compiled);
    const blockedBefore = diagnostics.filter(entry => entry.status === 'blocked').length;
    const modifiers = compileCardSkillBuildModifiers(
      compiled,
      installation.blackboard,
      diagnostics,
    );
    if (diagnostics.filter(entry => entry.status === 'blocked').length === blockedBefore) {
      definitions.push({ slug: request.originId, modifiers });
    }

    const skill = compiled.definition.skill;
    runtimeDependencies.push({
      suitId: request.originId,
      skillId: request.skillId,
      startupBuffIds: skill.startupBuffs.map(entry => entry.buffId),
      startupBuffs: skill.startupBuffs.map(entry =>
        materializePassiveBuffInstallation(entry, installation.blackboard),
      ),
      toggleBuffIds: skill.toggleBuffs.flatMap(group => group.buffs.map(entry => entry.buffId)),
      toggleBuffs: skill.toggleBuffs.map((group, groupIndex) => ({
        conditions: group.conditions.map((condition, conditionIndex) => {
          if (condition.kind !== 'currentHpRatio') {
            throw new Error(
              `${compiled.sourcePath}.toggleBuffs[${groupIndex}].conditions[${conditionIndex}]: unsupported equipment toggle condition ${JSON.stringify(condition.kind)}`,
            );
          }
          const value =
            condition.value.blackboardKey === null
              ? condition.value.value
              : installation.blackboard[condition.value.blackboardKey];
          if (value === undefined) {
            return {
              kind: 'currentHpRatio' as const,
              comparison: condition.comparison,
              value: {
                kind: 'unresolvedSkillBlackboard' as const,
                key: condition.value.blackboardKey!,
              },
            };
          }
          return { kind: 'currentHpRatio' as const, comparison: condition.comparison, value };
        }),
        buffs: group.buffs.map(entry =>
          materializePassiveBuffInstallation(entry, installation.blackboard),
        ),
      })),
      referencedBuffIds: skill.references
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

  return { definitions, runtimeDependencies, diagnostics };
}
