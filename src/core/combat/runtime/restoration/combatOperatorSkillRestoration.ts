/**
 * 使用整图预检结果重建普通干员技能宿主。
 * 本模块不创建冷却、不注册程序、不开始施放；它只把当前分支端口绑定到已经复制好的技能数据。
 */
import type { BuffApplicationHandle } from '../../buffs/buffOperationExecutor';
import { SkillRuntime } from '../../skills/skillRuntime';
import type { BuffReference } from '../../state/foundationState';
import type { PreparedCombatSkillRestoreBinding } from './combatRuntimeRestorePreparation';
import type { RestoredCombatSkillCooldownBinding } from './combatSkillCooldownRestoration';

type SkillDependencies = ConstructorParameters<typeof SkillRuntime>[1];

export interface RestoreCombatOperatorSkillsOptions {
  readonly operatorId: string;
  readonly skills: readonly PreparedCombatSkillRestoreBinding[];
  readonly cooldowns: ReadonlyMap<string, RestoredCombatSkillCooldownBinding>;
  readonly createDependencies: (
    binding: PreparedCombatSkillRestoreBinding,
  ) => Omit<
    SkillDependencies,
    'cooldown' | 'advancesCooldown' | 'damageSnapshotProgram' | 'operationState'
  >;
  readonly resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined;
}

/** 返回表使用 `skillId\0castId`，可直接与能力系统的保存寻址对应。 */
export function bindRestoredCombatOperatorSkills(
  options: RestoreCombatOperatorSkillsOptions,
): ReadonlyMap<string, SkillRuntime> {
  const runtimes = new Map<string, SkillRuntime>();
  for (const binding of options.skills) {
    if (binding.program.operatorId !== options.operatorId) {
      throw new Error(
        `restored skill '${binding.program.skillId}' belongs to '${binding.program.operatorId}', expected '${options.operatorId}'`,
      );
    }
    const stateKey = `${binding.program.skillId}\u0000${binding.state.castId ?? ''}`;
    if (runtimes.has(stateKey)) {
      throw new Error(`duplicate restored skill '${options.operatorId}:${stateKey}'`);
    }
    const cooldown = options.cooldowns.get(binding.program.skillId);
    if (cooldown === undefined) {
      throw new Error(
        `restored skill '${options.operatorId}:${stateKey}' has no bound shared cooldown`,
      );
    }
    if (cooldown.cooldown.runtimeState !== binding.state.cooldown) {
      throw new Error(
        `restored skill '${options.operatorId}:${stateKey}' uses another shared cooldown`,
      );
    }
    const dependencies = options.createDependencies(binding);
    if (dependencies.operations.operationHost?.state !== binding.state.operations) {
      throw new Error(
        `restored skill '${options.operatorId}:${stateKey}' has no matching operation host`,
      );
    }
    const runtime = new SkillRuntime(
      binding.program,
      {
        ...dependencies,
        castId: binding.state.castId,
        cooldown: cooldown.cooldown,
        advancesCooldown: false,
        damageSnapshotProgram: binding.fixed.damageSnapshots,
        operationState: binding.state.operations,
      },
      {
        state: binding.state,
        damageSnapshotProgram: binding.fixed.damageSnapshots,
        resolveAttachedBuff: options.resolveAttachedBuff,
      },
    );
    if (
      runtime.runtimeState !== binding.state ||
      runtime.damageSnapshotProgram !== binding.fixed.damageSnapshots
    ) {
      throw new Error(`restored skill '${options.operatorId}:${stateKey}' did not bind its data`);
    }
    runtimes.set(stateKey, runtime);
  }
  return runtimes;
}
