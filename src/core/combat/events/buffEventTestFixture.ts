import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';

/** 事件测试使用实际实例，不以快照字典或类型断言冒充运行时 Buff。 */
export function createEventBuff(blackboard: Record<string, number> = {}) {
  const owner = new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>());
  return owner.add({ id: 'buff:test', stackingType: 'unlimited', blackboard }, 'owner')!;
}
