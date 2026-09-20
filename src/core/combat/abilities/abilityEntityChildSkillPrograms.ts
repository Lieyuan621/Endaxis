/**
 * 一场战斗内能力实体子技能的固定程序目录。
 * 每份固定子技能程序只登记一次，多个实体实例共享程序；各自的动作账本保存在实例状态中。
 */
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';

export interface AbilityEntityChildSkillProgramBinding {
  readonly id: number;
  readonly program: CompiledAbilityEntityChildSkillProgram;
  readonly damageSnapshots: DamageCalculationSnapshotProgram;
}

export class AbilityEntityChildSkillPrograms {
  readonly #byProgram = new WeakMap<CompiledAbilityEntityChildSkillProgram, number>();
  readonly #entries: AbilityEntityChildSkillProgramBinding[] = [];

  register(program: CompiledAbilityEntityChildSkillProgram): AbilityEntityChildSkillProgramBinding {
    const existing = this.#byProgram.get(program);
    if (existing !== undefined) return this.#entries[existing]!;
    const binding = {
      id: this.#entries.length,
      program,
      damageSnapshots: new DamageCalculationSnapshotProgram(),
    };
    this.#entries.push(binding);
    this.#byProgram.set(program, binding.id);
    return binding;
  }

  resolve(id: number): AbilityEntityChildSkillProgramBinding {
    const binding = this.#entries[id];
    if (binding === undefined) {
      throw new Error(`AbilityEntity child skill program '${id}' does not exist`);
    }
    return binding;
  }
}
