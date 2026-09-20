import type { LevelValues } from '../../../../../packages/game-data-contract/src/index.ts';
import type { PassiveSkillCompileRequestSource } from './passiveSkillRequest.ts';
import { requireNonNegativeInteger } from '../../source/primitives.ts';
import type { CompiledPassiveSkillDefinitionSource } from './passiveSkillBatch.ts';
import { selectSkillBlackboardLevel } from './skillBlackboard.ts';
import type { SkillBuffInstallSource } from '../../source/skillBuffInstall.ts';

/** 服务端被动可能在客户端 SkillData/SkillPatch 之外注入的运行时黑板值。 */
export interface UnresolvedPassiveSkillBlackboardValueSource {
  readonly kind: 'unresolvedSkillBlackboard';
  readonly key: string;
}

export interface MaterializedPassiveBuffInstallationSource<Value extends LevelValues = number> {
  readonly buffId: string;
  readonly blackboardAssignments: Readonly<
    Record<string, Value | number | string | UnresolvedPassiveSkillBlackboardValueSource>
  >;
}

export interface MaterializedPassiveSkillInstallationSource {
  readonly originKind: PassiveSkillCompileRequestSource['originKind'];
  readonly originId: string;
  readonly sourcePath: string;
  readonly skillId: string;
  readonly level: number;
  readonly patchApplied: boolean;
  readonly blackboard: Readonly<Record<string, number>>;
  readonly activeConditionIds?: readonly string[];
}

/**
 * 把共享被动定义实例化为一次领域安装。等级选择完成后才覆盖运行时输入黑板，顺序与原生
 * CardSkill._Init 一致；武器等级依赖具体构筑，调用方必须显式提供，不能使用模板或星级猜测。
 */
export function materializePassiveSkillInstallation(
  request: PassiveSkillCompileRequestSource,
  compiled: CompiledPassiveSkillDefinitionSource,
  resolvedWeaponLevel?: number,
): MaterializedPassiveSkillInstallationSource {
  requireMatchingSkill(request, compiled);
  const requestedLevel = resolveRequestedLevel(request, resolvedWeaponLevel);
  const selected = selectSkillBlackboardLevel(compiled.definition.blackboard, requestedLevel);
  return {
    originKind: request.originKind,
    originId: request.originId,
    sourcePath: request.sourcePath,
    skillId: request.skillId,
    level: selected.level,
    patchApplied: selected.patchApplied,
    blackboard: { ...selected.values, ...request.inputBlackboard },
    ...(request.activeConditionIds === undefined
      ? {}
      : { activeConditionIds: [...request.activeConditionIds] }),
  };
}

/**
 * 为定义编译选择数值形态，不生成逐等级 SkillData 副本。
 * 武器保留来源等级列；固定等级/原生默认选择仍复用安装器的补丁回退语义。
 * 输入黑板在补丁之后覆盖，覆盖值保持与等级无关的单值。
 * 返回值不自带等级轴；武器调用方必须同时保留 compiled.definition.blackboard.levels。
 */
export function resolvePassiveSkillDefinitionBlackboard(
  request: PassiveSkillCompileRequestSource,
  compiled: CompiledPassiveSkillDefinitionSource,
): Readonly<Record<string, LevelValues>> {
  requireMatchingSkill(request, compiled);
  if (
    request.levelSource.kind !== 'weaponProgression' &&
    request.levelSource.kind !== 'operatorSkillGroup'
  ) {
    return materializePassiveSkillInstallation(request, compiled).blackboard;
  }
  return { ...compiled.definition.blackboard.values, ...request.inputBlackboard };
}

function requireMatchingSkill(
  request: PassiveSkillCompileRequestSource,
  compiled: CompiledPassiveSkillDefinitionSource,
): void {
  if (request.skillId !== compiled.skillId) {
    throw new Error(
      `${request.sourcePath}: request skill ${JSON.stringify(request.skillId)} does not match compiled definition ${JSON.stringify(compiled.skillId)}`,
    );
  }
}

/**
 * 把 CreateBuff 参数引用绑定到被动黑板：固定等级传单值，定义编译可直接传等级列。
 * 只绑定一份安装结构；列保持原引用，直接赋值保持常量，不制造逐等级 Buff 副本。
 * 未出现在客户端补丁中的服务端值保留身份，交给领域场景投影判断是否会被实际读取。
 */
export function materializePassiveBuffInstallation<Value extends LevelValues>(
  source: SkillBuffInstallSource,
  blackboard: Readonly<Record<string, Value>>,
): MaterializedPassiveBuffInstallationSource<Value> {
  if (!source.assignBlackboard) return { buffId: source.buffId, blackboardAssignments: {} };
  return {
    buffId: source.buffId,
    blackboardAssignments: Object.fromEntries(
      source.assignments.map(assignment => {
        if (assignment.useDirectValue) {
          return [
            assignment.targetKey,
            assignment.valueType === 'Numeric' ? assignment.numericValue : assignment.stringValue,
          ];
        }
        const value = blackboard[assignment.inputValueKey];
        return [
          assignment.targetKey,
          value ?? {
            kind: 'unresolvedSkillBlackboard' as const,
            key: assignment.inputValueKey,
          },
        ];
      }),
    ),
  };
}

function resolveRequestedLevel(
  request: PassiveSkillCompileRequestSource,
  resolvedWeaponLevel: number | undefined,
): number | null {
  switch (request.levelSource.kind) {
    case 'nativeDefault':
      return null;
    case 'operatorSkillGroup':
      throw new Error(
        `${request.sourcePath}: operator skill-group passive must preserve its level column`,
      );
    case 'equipmentSuitThreshold':
      return request.levelSource.level;
    case 'weaponProgression':
      if (resolvedWeaponLevel === undefined) {
        throw new Error(`${request.sourcePath}: resolved weapon skill level is required`);
      }
      return requireNonNegativeInteger(resolvedWeaponLevel, `${request.sourcePath}.resolvedLevel`);
  }
}
