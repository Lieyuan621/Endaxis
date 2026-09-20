/**
 * 统一解析普通技能的固定冷却配置，并为恢复候选绑定共享冷却账本。
 * 基础周期来自编译程序；当前计时来自切面；连携冷却倍率始终从当前分支的 Buff 目标读取。
 */
import type { CompiledSkillCooldownProgram } from '../../../compiler/combatProgram';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import { SkillCooldown } from '../../skills/skillCooldown';
import type { SkillCooldownState } from '../../state/abilityState';

export interface CombatSkillCooldownConfiguration {
  readonly periodFrames?: number;
  readonly commitFrame?: number;
}

export interface RestoredCombatSkillCooldownBinding {
  readonly program: CompiledSkillCooldownProgram;
  readonly skillIds: ReadonlySet<string>;
  readonly cooldown: SkillCooldown;
  readonly configuration: CombatSkillCooldownConfiguration;
}

export function resolveCombatSkillCooldownConfiguration(
  operator: CombatOperatorProgram,
  program: CompiledSkillCooldownProgram,
): CombatSkillCooldownConfiguration {
  if (program.operatorId !== operator.operatorId) {
    throw new Error(
      `skill '${program.skillId}' belongs to '${program.operatorId}', expected '${operator.operatorId}'`,
    );
  }
  const multiplier = (operator.panel?.combatModifiers ?? []).reduce((result, modifier) => {
    if (
      modifier.kind === 'skillCooldownMultiplier' &&
      (Array.isArray(modifier.skillTypes)
        ? modifier.skillTypes.includes(program.skillType)
        : modifier.skillTypes === program.skillType)
    ) {
      return result * modifier.value;
    }
    return result;
  }, 1);
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new RangeError(
      `skill '${program.skillId}' of '${operator.operatorId}' has invalid cooldown multiplier ${multiplier}`,
    );
  }
  return program.cooldownFrames === undefined
    ? {}
    : {
        periodFrames: program.cooldownFrames * multiplier,
        ...(program.costFrame === undefined ? {} : { commitFrame: program.costFrame }),
      };
}

/**
 * 从一个干员节点的保存数据重建全部共享冷却对象。
 * 返回表按 skillId 索引；多个施放实例随后必须引用这里的同一个对象。
 */
export function bindRestoredCombatSkillCooldowns(
  operator: CombatOperatorProgram,
  states: ReadonlyMap<string, SkillCooldownState>,
): ReadonlyMap<string, RestoredCombatSkillCooldownBinding> {
  const programs = [
    ...(operator.skillCooldownPrograms ?? []),
    ...operator.skills,
  ] as readonly CompiledSkillCooldownProgram[];
  const definitions = new Map<
    string,
    {
      readonly program: CompiledSkillCooldownProgram;
      readonly configuration: CombatSkillCooldownConfiguration;
      readonly skillIds: Set<string>;
    }
  >();
  for (const program of programs) {
    const configuration = resolveCombatSkillCooldownConfiguration(operator, program);
    const existing = definitions.get(program.skillId);
    if (existing !== undefined) {
      if (
        existing.configuration.periodFrames !== configuration.periodFrames ||
        existing.configuration.commitFrame !== configuration.commitFrame ||
        existing.program.skillType !== program.skillType ||
        existing.program.skillGroupKey !== program.skillGroupKey
      ) {
        throw new Error(
          `skill '${program.skillId}' of '${operator.operatorId}' has inconsistent cooldown configuration`,
        );
      }
      if (program.nativeSkillType !== undefined)
        existing.skillIds.add(program.executionSkillId ?? program.skillId);
      continue;
    }
    definitions.set(program.skillId, {
      program,
      configuration,
      skillIds: new Set(
        program.nativeSkillType === undefined ? [] : [program.executionSkillId ?? program.skillId],
      ),
    });
  }
  for (const skillId of states.keys()) {
    if (!definitions.has(skillId)) {
      throw new Error(
        `restored operator '${operator.operatorId}' has unknown cooldown '${skillId}'`,
      );
    }
  }
  const result = new Map<string, RestoredCombatSkillCooldownBinding>();
  for (const [skillId, definition] of definitions) {
    const state = states.get(skillId);
    if (state === undefined) {
      throw new Error(
        `restored operator '${operator.operatorId}' is missing cooldown '${skillId}'`,
      );
    }
    const configured = definition.configuration.periodFrames !== undefined;
    if ((state.timer !== undefined) !== configured) {
      throw new Error(
        `restored cooldown '${operator.operatorId}:${skillId}' does not match its fixed configuration`,
      );
    }
    const cooldown = new SkillCooldown(
      definition.configuration.periodFrames,
      definition.configuration.commitFrame,
      definition.program.skillType === 'comboSkill'
        ? () => operator.buffRuntime?.getAttributeValue?.('ComboSkillCooldownScalar') ?? 1
        : undefined,
      state,
    );
    result.set(skillId, {
      program: definition.program,
      skillIds: definition.skillIds,
      cooldown,
      configuration: definition.configuration,
    });
  }
  return result;
}
