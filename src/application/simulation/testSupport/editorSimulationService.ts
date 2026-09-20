/**
 * 为需要完整正式定义的模拟集成测试提供统一入口。
 * 产品页面必须显式传入当前项目仓库，不能引用这里而重新带入整套游戏数据。
 */
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createEditorSimulationService as createInjectedEditorSimulationService } from '../editorSimulationService';

export function createEditorSimulationService() {
  return createInjectedEditorSimulationService(gameDataRepository);
}
