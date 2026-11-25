import { isPhysicalInflictionDamage } from './damageDecorationGroups';
import type { DamageTag } from '../../game-data/operatorDefinition';

/** 只认伤害自身的分类；普通物理伤害、碎冰和破防状态不是物理异常伤害。 */
export function reactionDamageKind(
  tags: readonly DamageTag[],
): 'spellBurst' | 'physicalInfliction' | undefined {
  if (tags.some(tag => ['fireBurst', 'electricBurst', 'cryoBurst', 'natureBurst'].includes(tag)))
    return 'spellBurst';
  if (isPhysicalInflictionDamage(tags)) return 'physicalInfliction';
  return undefined;
}
