/** 公共 Buff 的产品稳定入口；定义由独立公共资源生成器维护，干员文件只按 ID 引用。 */
import type { OperatorBuffDefinitions } from '../../core/game-data/operatorDefinition';
import { commonBuffDefinitions as generatedDefinitions } from './generated/commonBuffDefinitions.generated';

/**
 * 战斗定义只保留原生运行事实。Endaxis 展示名属于应用层，按 Buff ID 从独立配置查询，
 * 不注入定义、编译产物或单次模拟回执。
 */
export const commonBuffDefinitions = generatedDefinitions as OperatorBuffDefinitions;
