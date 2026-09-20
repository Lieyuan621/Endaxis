import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import { createScenarioSimulationService } from './createScenarioSimulationService';

/** 使用页面已经装配好的仓库创建模拟服务，不在应用层再次加载或覆盖游戏定义。 */
export function createEditorSimulationService(repository: GameDataRepository) {
  return createScenarioSimulationService(repository);
}
