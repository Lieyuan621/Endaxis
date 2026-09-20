import {
  COMBAT_EVENT_TRIGGER_KINDS,
  type CombatEventTrigger,
} from '../../../../core/game-data/operatorDefinition';

export const EDITABLE_COMBAT_EVENT_TRIGGER_KINDS = COMBAT_EVENT_TRIGGER_KINDS;

export type EditableCombatEventTriggerKind = (typeof EDITABLE_COMBAT_EVENT_TRIGGER_KINDS)[number];

/** 创建结构有效、语义仍需用户明确填写的事件触发器草稿。 */
export function createCombatEventTriggerDraft(
  kind: EditableCombatEventTriggerKind,
): CombatEventTrigger {
  switch (kind) {
    case 'abilityEvent':
      return { kind, event: 'addedBuff' };
    case 'operatorHit':
    case 'buffApplied':
    case 'buffOutput':
    case 'buffConsumed':
    case 'operatorHealed':
    case 'airborneOutput':
    case 'knockDownOutput':
    case 'spGained':
      return { kind };
    case 'damageTagHit':
      return { kind, tag: 'normalSkill', scope: 'operator' };
    case 'elementalInflictionApplied':
      return { kind, elements: 'heat', scope: 'operator' };
    case 'physicalInflictionApplied':
      return { kind, types: 'fracture', scope: 'operator' };
    case 'skillHit':
      return { kind, skillGroupKey: 'skill', scope: 'operator' };
    case 'enemyDefeated':
      return { kind, scope: 'operator' };
  }
}
