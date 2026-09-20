/**
 * 将定义层的干员转换状态投影为 UI 可安全消费的只读摘要。
 * 该投影不包含本地化文本，也不进入存档；组件只能根据稳定能力代码决定展示内容。
 */
import type {
  OperatorConversionSupport,
  OperatorDefinition,
} from '../../../core/game-data/operatorDefinition';

export interface OperatorSupportViewModel {
  readonly completeness: OperatorConversionSupport['completeness'];
  readonly missingCapabilities: OperatorConversionSupport['missingCapabilities'];
}

const COMPLETE_SUPPORT: OperatorSupportViewModel = Object.freeze({
  completeness: 'complete',
  missingCapabilities: Object.freeze([]),
});

/** 缺少显式元数据的已审核手写定义按完整支持处理。 */
export function projectOperatorSupport(
  operator: Pick<OperatorDefinition, 'conversionSupport'>,
): OperatorSupportViewModel {
  const support = operator.conversionSupport;
  if (support === undefined) return COMPLETE_SUPPORT;
  return Object.freeze({
    completeness: support.completeness,
    missingCapabilities: Object.freeze(
      support.missingCapabilities.map(item =>
        Object.freeze({
          capability: item.capability,
          ...(item.skillGroupKeys === undefined
            ? {}
            : { skillGroupKeys: Object.freeze([...item.skillGroupKeys]) }),
        }),
      ),
    ),
  });
}
