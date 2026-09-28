import type { DamageFeature, DamageTag } from '../../game-data/operatorDefinition';

/** 只认伤害自身的分类；普通物理伤害、碎冰和破防状态不是物理异常伤害。 */
export function reactionDamageKind(
  tags: readonly DamageTag[],
  features: readonly DamageFeature[] = [],
): 'spellBurst' | 'physicalInfliction' | undefined {
  if (tags.some(tag => ['fireBurst', 'electricBurst', 'cryoBurst', 'natureBurst'].includes(tag)))
    return 'spellBurst';
  if (features.includes('physicalInfliction')) return 'physicalInfliction';
  return undefined;
}

export interface ReactionDamageIdentity {
  readonly sourceId: string;
  readonly targetId: string;
  readonly castId?: string;
  readonly actionId?: string;
  readonly stepKey?: string;
  readonly kind: 'spellBurst' | 'physicalInfliction';
}

/** 同一来源动作内按发生次数编号，不使用帧号或全场实例编号，拖动技能不改变命中身份。 */
export function nextReactionDamageKey(
  counts: Map<string, number>,
  identity: ReactionDamageIdentity,
): string {
  const parts = [
    identity.sourceId,
    identity.targetId,
    identity.castId ?? null,
    identity.actionId ?? null,
    identity.stepKey ?? null,
    identity.kind,
  ];
  const group = JSON.stringify(parts);
  const index = counts.get(group) ?? 0;
  counts.set(group, index + 1);
  return JSON.stringify([...parts, index]);
}
