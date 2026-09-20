import type { CombatOperationContext } from '../skills/skillRuntime';
import type { CombatObjectRef } from './combatReceipt';

/** 当前执行宿主；InputTarget、事件来源和继承施法不能代替它。 */
export function operationProducer(
  context:
    | Pick<
        CombatOperationContext,
        'executingBuff' | 'actionOwnerAbilityEntity' | 'actionOwnerId' | 'executionActionId'
      >
    | undefined,
  action?: { readonly ownerId: string; readonly actionId?: string },
): CombatObjectRef | undefined {
  if (context?.executingBuff !== undefined)
    return {
      kind: 'buff',
      ownerId: context.executingBuff.buffOwnerId,
      instanceId: context.executingBuff.buffInstanceId,
    };
  if (context?.actionOwnerAbilityEntity !== undefined) return context.actionOwnerAbilityEntity;
  const ownerId = context?.actionOwnerId ?? action?.ownerId;
  const actionId = context?.executionActionId ?? action?.actionId;
  return ownerId === undefined || actionId === undefined
    ? undefined
    : { kind: 'action', ownerId, actionId };
}

/** 元组编码避免用户可编辑 ID 中的分隔符产生碰撞。 */
export function combatObjectKey(ref: CombatObjectRef): string {
  switch (ref.kind) {
    case 'operator':
      return JSON.stringify([ref.kind, ref.operatorId]);
    case 'enemy':
      return JSON.stringify([ref.kind]);
    case 'spatialPoint':
      return JSON.stringify([ref.kind, ref.pointId]);
    case 'abilityEntity':
    case 'globalBuff':
      return JSON.stringify([ref.kind, ref.instanceId]);
    case 'buff':
      return JSON.stringify([ref.kind, ref.ownerId, ref.instanceId]);
    case 'action':
      return JSON.stringify([ref.kind, ref.ownerId, ref.actionId]);
    case 'receipt':
      return JSON.stringify([ref.kind, ref.sequence]);
    case 'modifier':
      return JSON.stringify([ref.kind, ref.sequence, ref.index]);
  }
}
