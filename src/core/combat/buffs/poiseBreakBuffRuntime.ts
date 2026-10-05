import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import type { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';

/** 原生破防的固定身份；行为和倍率只能来自导出的定义。 */
export const POISE_BREAK_BUFF_ID = 'buff_common_poise_break_damage_taken_scale';
export const FINISHER_ELIGIBILITY_BUFF_ID = 'buff_common_poise_can_be_breaking_attacked';

export class PoiseBreakBuffRuntime {
  /** 只保存当前目标容器内的实例编号，不跨分支保留 Buff 对象。 */
  constructor(
    readonly target: BuffDefinitionOperationTarget<string>,
    readonly runtimeState = new Set<number>(),
  ) {}

  begin(
    sourceId: string,
    definition: ResolvedSkillBuffDefinition | undefined,
    buffId = POISE_BREAK_BUFF_ID,
  ): void {
    if (definition === undefined)
      throw new Error(`poise break requires Buff definition '${buffId}'`);
    const buff = this.target.applyScoped({
      buffId,
      definition,
      sourceId,
      sourceActionId: 'poise-break',
      blackboardValues: {},
    });
    if (buff !== null) this.runtimeState.add(buff.instanceId);
  }

  /** 原生 HP/Minus + PowerAttack 在 BeforeTakeDamage 前消费资格，不结束失衡承伤。 */
  consumeFinisher(): void {
    for (const instanceId of [...this.runtimeState]) {
      const buff = this.target.container.getInstance(instanceId);
      if (buff?.definition.id !== FINISHER_ELIGIBILITY_BUFF_ID) continue;
      this.runtimeState.delete(instanceId);
      if (!buff.isFinished) buff.finish();
    }
  }

  recover(): void {
    // 先移交本轮句柄，避免结束副作用重入时清除下一轮登记的实例。
    const buffs = [...this.runtimeState].map(id => this.target.container.getInstance(id));
    this.runtimeState.clear();
    // ResetPoise 先结束处决资格，再结束失衡承伤；两者仍只操作本轮实例。
    buffs.sort(
      (a, b) =>
        Number(b?.definition.id === FINISHER_ELIGIBILITY_BUFF_ID) -
        Number(a?.definition.id === FINISHER_ELIGIBILITY_BUFF_ID),
    );
    for (const buff of buffs) {
      if (buff !== undefined && !buff.isFinished) buff.finish();
    }
  }
}
