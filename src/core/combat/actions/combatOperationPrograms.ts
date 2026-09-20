/**
 * 为编译动作节点分配切面树内稳定的数字槽位。
 *
 * 动作宿主状态用槽位记录“这个动作开始时创建了什么”，不能保存动作对象或函数。原战斗与
 * 所有恢复分支共享本目录，因而同一编译节点始终得到同一槽位；不同对象即使内容相同也不会
 * 被合并。目录是固定程序的一部分，不进入可复制的战斗数据。
 */
export class CombatOperationPrograms {
  readonly #slots = new WeakMap<object, number>();
  readonly #programs = new Map<number, object>();
  #nextSlot = 1;

  slot(step: object): number {
    const existing = this.#slots.get(step);
    if (existing !== undefined) return existing;
    const slot = this.#nextSlot++;
    this.#slots.set(step, slot);
    this.#programs.set(slot, step);
    return slot;
  }

  resolve<Program extends object>(slot: number): Program {
    const program = this.#programs.get(slot);
    if (program === undefined) throw new Error(`combat operation program '${slot}' is missing`);
    return program as Program;
  }
}
