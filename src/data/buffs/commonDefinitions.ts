/** 公共 Buff 的产品稳定入口；定义由独立公共资源生成器维护，干员文件只按 ID 引用。 */
import { commonBuffDefinitions as generatedDefinitions } from './generated/commonBuffDefinitions.generated';

/**
 * 展示名保存在 Buff 自身的 presentation.nameKey，与其他 Buff 使用相同的读取规则。
 * 回执只记录 Buff 身份，不复制本地化名称。
 */
export const commonBuffDefinitions = generatedDefinitions;
