import { COMBAT_FRAMES_PER_SECOND } from '../../core/combat/time/combatClock';
import type { DashTimingProgram } from '../../core/combat/skills/operatorCenterStateRuntime';
import { BATTLE_COMMAND_MAPPING_CONFIG } from './battleCommandMappingCatalog.generated';
import { MOVEMENT_SETTING_DEFAULT } from './movementSettingCatalog.generated';

/** 原生 BattleCommandType 0..5 顺序下的全局输入缓存与中心状态窗口。单位均为秒。 */
export const battleCommandMappingConfig = BATTLE_COMMAND_MAPPING_CONFIG;

/** 只在运行时装配边界把原生秒数换成模拟帧；保留半帧精度。 */
export function createNativeDashTimingProgram(): DashTimingProgram {
  return {
    dashOffsetFrames: battleCommandMappingConfig.dashOffsetCacheTime * COMBAT_FRAMES_PER_SECOND,
    blockAttackFramesInDash:
      battleCommandMappingConfig.blockAttackTimeInDash * COMBAT_FRAMES_PER_SECOND,
    allowAttackAfterFramesInDash:
      battleCommandMappingConfig.allowAttackTimeAfterDash * COMBAT_FRAMES_PER_SECOND,
    blockAttackFramesInPerfectDodge:
      battleCommandMappingConfig.blockAttackTimeInPerfectDodge * COMBAT_FRAMES_PER_SECOND,
    allowAttackAfterFramesInPerfectDodge:
      battleCommandMappingConfig.allowAttackTimeAfterPerfectDodge * COMBAT_FRAMES_PER_SECOND,
    blockDashAfterPerfectDodgeFrames:
      battleCommandMappingConfig.allowDashInPerfectDodge * COMBAT_FRAMES_PER_SECOND,
    dashInputCooldownFrames:
      MOVEMENT_SETTING_DEFAULT.dashInputCooldownSeconds * COMBAT_FRAMES_PER_SECOND,
    dashSecondDashIntervalFrames:
      MOVEMENT_SETTING_DEFAULT.dashSecondDashIntervalSeconds * COMBAT_FRAMES_PER_SECOND,
  };
}
