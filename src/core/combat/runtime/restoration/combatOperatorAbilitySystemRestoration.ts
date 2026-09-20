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
  const ability = new AbilitySystemRuntime(
    {
      ...options.runtime,
      buffRuntime: options.operator.buffRuntime,
      skills: [...options.skills.values()],
      skillTickPlan: [...options.cooldowns].map(([skillId, binding]) => ({
        skillId,
        advanceCooldown: deltaSeconds => {
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
