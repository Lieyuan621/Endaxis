/**
 * 用显式注入的游戏数据仓库装配正式场景模拟服务。
 *
 * 浏览器主线程可以传完整编辑器仓库，后台 Worker 可以传当前场景的小仓库；两边使用完全
 * 相同的编译器、运行时规则和资源常量。
 */
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';

import { skillSettings, skillSettingResources } from '../../data/combat/skillSettings';
import { ScenarioSimulationService } from './scenarioSimulationService';

export function createScenarioSimulationService(
  repository: GameDataRepository,
): ScenarioSimulationService {
  return new ScenarioSimulationService({
    index: repository,
    repositoryRevision: repository.revision,
    spellInflictionSettings: skillSettings,
    resources: {
      // 未取得账号的 ServerGameVarDashEnergyLimit；只记录相对消耗和返还，不把全局最大值当账号余额。
      sharedSpGain: { baseGainEfficiency: skillSettingResources.atbGainEfficiency },
      spRecoveryPauseDuration: skillSettingResources.atbRecoverInterval,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: {
        selfGainPerSp: skillSettingResources.atbConsumedDefaultUspGainSelf,
        otherGainPerSp: skillSettingResources.atbConsumedDefaultUspGainOther,
      },
    },
  });
}
