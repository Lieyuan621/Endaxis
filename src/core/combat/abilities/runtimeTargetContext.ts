import type { RuntimeTargetGroup, RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { EnemyPartTransferInfo } from '../state/foundationState';
import type { CombatOperationContext } from '../skills/skillRuntime';
import {
  createRuntimeTargetContextState,
  type RuntimeTargetContextState,
} from '../state/abilityState';

/** 原生先复制 Buff 环境，再以当前事件覆盖同主体项；不用于只读事件的检查条件。 */
export function resolveOperationPartTransferInfo(
  context: CombatOperationContext | undefined,
): EnemyPartTransferInfo | undefined {
  const environment = context?.partTransferInfo;
  const payload = context?.event?.payload;
  const event = payload && 'partTransferInfo' in payload ? payload.partTransferInfo : undefined;
  if (environment === undefined && event === undefined) return undefined;
  return {
    currentMainBodyId: (event ?? environment)!.currentMainBodyId,
    mainBodyToPart: new Map([
      ...(environment?.mainBodyToPart ?? []),
      ...(event?.mainBodyToPart ?? []),
    ]),
  };
}

/** 为当前接收者复制转交上下文，嵌套事件不能改写外层仍在读取的映射。 */
export function copyEnemyPartTransferInfo(
  inherited: EnemyPartTransferInfo | undefined,
  currentMainBodyId: string,
  partId?: string,
): EnemyPartTransferInfo | undefined {
  if (inherited === undefined && partId === undefined) return undefined;
  const mainBodyToPart = new Map(inherited?.mainBodyToPart);
  if (partId !== undefined) mainBodyToPart.set(currentMainBodyId, partId);
  return { currentMainBodyId, mainBodyToPart };
}

/**
 * 复制目标身份，调用方之后修改原数组或目标对象不会改变已经选择的目标。
 * 保留顺序和重复项：原生 TargetHandle 是列表，部位替换为主体后仍可能有重复目标；
 * 去重只能由明确要求去重的集合操作执行，不能隐含在 Context 写入中。
 */
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

  /** 用于原生允许缺失目标组的查询；由调用方决定空组或未命中的返回行为。 */
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

/** 比较稳定目标身份，不序列化或分配临时字符串。 */
export function sameRuntimeTarget(left: RuntimeTargetRef, right: RuntimeTargetRef): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'enemy' || left.kind === 'godEntity') return true;
  if (left.kind === 'operator' && right.kind === 'operator') {
    return left.operatorId === right.operatorId;
  }
  if (left.kind === 'spatialPoint' && right.kind === 'spatialPoint') {
    return left.pointId === right.pointId;
  }
  return (
    left.kind === 'abilityEntity' &&
    right.kind === 'abilityEntity' &&
    left.instanceId === right.instanceId
  );
}
