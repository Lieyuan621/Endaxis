import type { RuntimeTargetGroup, RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  createRuntimeTargetContextState,
  type RuntimeTargetContextState,
} from '../state/abilityState';

/** 复制目标身份，调用方之后修改原数组或目标对象不会改变已经选择的目标。 */
export function setRuntimeTargetGroup(
  state: RuntimeTargetContextState,
  key: string,
  targets: RuntimeTargetGroup,
): void {
  if (key.length === 0) throw new Error('target context key must not be empty');
  state.groups.set(key, Object.freeze(targets.map(target => Object.freeze({ ...target }))));
}

/** 技能释放或连携条件环境的命名目标组；由宿主管理重置，临时事件组可单独移除。 */
export class RuntimeTargetContext {
  constructor(readonly runtimeState = createRuntimeTargetContextState()) {}

  set(key: string, targets: RuntimeTargetGroup): void {
    setRuntimeTargetGroup(this.runtimeState, key, targets);
  }

  setSingle(key: string, target: RuntimeTargetRef): void {
    this.set(key, [target]);
  }

  get(key: string): RuntimeTargetGroup {
    const targets = this.runtimeState.groups.get(key);
    if (targets === undefined) {
      const available = [...this.runtimeState.groups.keys()];
      throw new Error(
        `target context group '${key}' is missing (available: ${available.length === 0 ? 'none' : available.join(', ')})`,
      );
    }
    return targets;
  }

  /** 可选目标只用于原生“忽略对象”集合；缺失表示当前释放没有生成该对象。 */
  getOptional(key: string): RuntimeTargetGroup | undefined {
    return this.runtimeState.groups.get(key);
  }

  clear(): void {
    this.runtimeState.groups.clear();
  }

  /** 临时事件组结束时只移除该组，保留同一环境中的其他目标组。 */
  remove(key: string): void {
    this.runtimeState.groups.delete(key);
  }
}
