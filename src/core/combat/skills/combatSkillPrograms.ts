/**
 * 保存当前分支普通干员技能的程序绑定。
 * 保存和恢复复制登记表，已绑定的编译程序和伤害快照槽位映射继续共享，不重新编号。
 */
import type { CompiledSkillProgram } from '../../compiler/combatProgram';
import { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';

export interface CombatSkillProgramBinding {
  /** 单次施放身份；缺失时这项就是技能的固定定义。 */
  readonly castId?: string;
  readonly key: string;
  /** 固定技能定义。施放绑定直接引用它，不创建带身份的浅层副本。 */
  readonly program: CompiledSkillProgram;
  readonly damageSnapshots: DamageCalculationSnapshotProgram;
}

export function combatSkillProgramKey(program: CompiledSkillProgram, castId?: string): string {
  return `${program.operatorId}\u0000${program.skillId}\u0000${castId ?? ''}`;
}

/** 同一技能身份只能绑定同一个已编译程序对象。 */
export class CombatSkillPrograms {
  readonly #entries = new Map<string, CombatSkillProgramBinding>();
  readonly #damageSnapshots = new Map<CompiledSkillProgram, DamageCalculationSnapshotProgram>();

  /** 复制登记关系，固定程序和步骤槽位继续共享；新登记只属于返回的分支。 */
  fork(): CombatSkillPrograms {
    const branch = new CombatSkillPrograms();
    for (const [key, binding] of this.#entries) {
      branch.#entries.set(key, binding);
      branch.#damageSnapshots.set(binding.program, binding.damageSnapshots);
    }
    return branch;
  }

  register(program: CompiledSkillProgram, castId?: string): CombatSkillProgramBinding {
    if (castId !== undefined && castId.length === 0) {
      throw new Error('combat cast id must not be empty');
    }
    const key = combatSkillProgramKey(program, castId);
    const existing = this.#entries.get(key);
    if (existing !== undefined) {
      if (existing.program !== program) {
        throw new Error(`combat skill program '${key}' is already bound to another definition`);
      }
      return existing;
    }
    const damageSnapshots =
      this.#damageSnapshots.get(program) ?? new DamageCalculationSnapshotProgram();
    this.#damageSnapshots.set(program, damageSnapshots);
    const binding: CombatSkillProgramBinding = {
      key,
      program,
      ...(castId === undefined ? {} : { castId }),
      damageSnapshots,
    };
    this.#entries.set(key, binding);
    return binding;
  }

  registerCast(definition: CompiledSkillProgram, castId: string): CombatSkillProgramBinding {
    return this.register(definition, castId);
  }

  resolve(key: string): CombatSkillProgramBinding {
    const binding = this.#entries.get(key);
    if (binding === undefined) throw new Error(`combat skill program '${key}' does not exist`);
    return binding;
  }
}
