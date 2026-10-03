/**
 * 把恢复后的普通技能与共享冷却装入干员能力系统。
 * 能力系统直接绑定保存状态；技能槽、模式、当前技能和延迟请求不会在此重新初始化。
 */
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import {
  AbilitySystemRuntime,
  type AbilitySystemRuntimeOptions,
} from '../../abilities/abilitySystemRuntime';
import type { AbilitySystemState } from '../../state/abilityState';
import type { RestoredCombatSkillCooldownBinding } from './combatSkillCooldownRestoration';
import type { SkillRuntime } from '../../skills/skillRuntime';
import { COMBAT_FRAMES_PER_SECOND } from '../../time/combatClock';

export interface RestoreCombatOperatorAbilitySystemOptions {
  readonly operator: CombatOperatorProgram;
  readonly state: AbilitySystemState;
  readonly skills: ReadonlyMap<string, SkillRuntime>;
  readonly cooldowns: ReadonlyMap<string, RestoredCombatSkillCooldownBinding>;
  readonly runtime: Omit<
    AbilitySystemRuntimeOptions,
    | 'skills'
    | 'skillDefinitions'
    | 'skillTickPlan'
    | 'skillSlotGroups'
    | 'playerActionRoutes'
    | 'playerActionModes'
    | 'buffRuntime'
    | 'actionRuntime'
  >;
  readonly onCooldownReady?: (skillId: string) => void;
}

export function bindRestoredCombatOperatorAbilitySystem(
  options: RestoreCombatOperatorAbilitySystemOptions,
): AbilitySystemRuntime {
  const skills = [...options.skills.values()];
  const instantiatedSkillIds = new Set(skills.map(skill => skill.skillId));
  const ability = new AbilitySystemRuntime(
    {
      ...options.runtime,
      buffRuntime: options.operator.buffRuntime,
      skills,
      // 实际施放定义可覆盖静态目录；已有实例自己校验类型，目录仅补充未实例化身份。
      skillDefinitions: [...options.cooldowns.values()]
        .map(binding => binding.program)
        .filter(program => !instantiatedSkillIds.has(program.skillId)),
      skillTickPlan: [...options.cooldowns].map(([skillId, binding]) => ({
        skillId,
        advanceCooldown: deltaSeconds => {
          if (binding.cooldown.ready) return;
          const recoveryScalar =
            binding.program.skillType === 'comboSkill'
              ? (options.operator.buffRuntime?.getAttributeValue?.(
                  'ComboSkillCooldownRecoveryScalar',
                ) ?? 1)
              : 1;
          if (!Number.isFinite(recoveryScalar) || recoveryScalar < 0) {
            throw new RangeError(
              `combo skill cooldown recovery scalar of '${options.operator.operatorId}' must be non-negative and finite, received ${recoveryScalar}`,
            );
          }
          if (binding.cooldown.advance(deltaSeconds * COMBAT_FRAMES_PER_SECOND * recoveryScalar)) {
            options.onCooldownReady?.(skillId);
          }
        },
      })),
      skillSlotGroups: options.operator.skillSlotGroups,
      playerActionRoutes: options.operator.playerActionRoutes,
      playerActionModes: options.operator.playerActionModes,
      actionRuntime: options.operator.actionRuntime,
    },
    options.state,
  );
  if (ability.runtimeState !== options.state) {
    throw new Error(
      `restored ability system '${options.operator.operatorId}' did not bind its saved state`,
    );
  }
  return ability;
}
