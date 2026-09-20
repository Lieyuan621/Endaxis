import type { CombatAbilityEvent } from './combatAbilityEvent';

/** 击杀事件测试使用完整伤害包，避免精简假载荷掩盖上下文信息丢失。 */
export function createKillEvent(sourceId = 'operator'): CombatAbilityEvent<'afterKillEntity'> {
  return {
    event: 'afterKillEntity',
    payload: {
      sourceId,
      targetId: 'enemy',
      damageType: 'physical',
      tags: ['comboSkill'],
      features: ['canBreakWeakness'],
      skillCastInfo: null,
      result: {
        value: 100,
        isCritical: false,
        criticalMultiplier: 1,
        defenseMultiplier: 1,
        resistanceMultiplier: 1,
        weaknessShelterMultiplier: 1,
        runtimeExtensionMultiplier: 1,
        igniteMultiplier: 1,
        physicalInflictionMultiplier: 1,
      },
    },
  };
}
