/** 当前战斗共享的固定回调程序目录。分支只保存编号，不复制程序，也不重新编号。 */
import type { CompiledProjectileCallbackSkillProgram } from '../../compiler/combatProgram';
import { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';

export class ProjectileCallbackPrograms {
  readonly #ids = new WeakMap<CompiledProjectileCallbackSkillProgram, number>();
  readonly #programs: CompiledProjectileCallbackSkillProgram[] = [];
  readonly #damageSnapshots: DamageCalculationSnapshotProgram[] = [];

  register(program: CompiledProjectileCallbackSkillProgram): number {
    const existing = this.#ids.get(program);
    if (existing !== undefined) return existing;
    const id = this.#programs.length;
    this.#programs.push(program);
    this.#damageSnapshots.push(new DamageCalculationSnapshotProgram());
    this.#ids.set(program, id);
    return id;
  }

  resolve(id: number): CompiledProjectileCallbackSkillProgram {
    const program = this.#programs[id];
    if (!Number.isSafeInteger(id) || program === undefined)
      throw new Error(`missing projectile callback program ${id}`);
    return program;
  }

  /** 固定伤害动作的编号映射随程序共享，攻击数值仍由每个宿主独立保存。 */
  resolveDamageSnapshots(id: number): DamageCalculationSnapshotProgram {
    this.resolve(id);
    return this.#damageSnapshots[id]!;
  }
}
