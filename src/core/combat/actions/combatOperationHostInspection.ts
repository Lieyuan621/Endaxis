/** 检查动作宿主是否仍持有必须恢复的跨帧关系。 */
import type { CombatOperationHostState } from '../state/actionState';

export function hasActiveCombatOperationState(state: CombatOperationHostState): boolean {
  return (
    state.abilityEntities.actionDurationEntities.size > 0 ||
    state.resources.ultimateRecoveryRestrictionHandles.size > 0 ||
    state.timedMarkers.markers.size > 0 ||
    state.comboWindows.ringQteRegistrations.size > 0 ||
    state.actionBlackboard.healthFloors.size > 0 ||
    state.skillCastInheritance.registrations.size > 0 ||
    state.timeDilation.instanceIds.size > 0 ||
    state.timeDilation.ignoredEntityIds.size > 0 ||
    state.globalBuffs.active.size > 0
  );
}
