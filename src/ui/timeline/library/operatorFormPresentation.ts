/**
 * 根据干员最终面板判断当前展示形态。
 * 形态条件来自干员定义，调用方只需提供已经计算完成的面板属性；本文件不包含任何干员特例。
 */
import type { OperatorPanelAttributes } from '../../../core/compiler/resolveOperatorPanel';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { compareCombatNumbers } from '../../../../packages/game-data-contract/src/primitives';

export function resolveOperatorPresentationFormKey(
  definition: Readonly<OperatorDefinition>,
  attributes: Readonly<OperatorPanelAttributes>,
): string | null {
  for (const group of definition.skillGroups) {
    for (const variant of group.presentationVariants ?? []) {
      if (
        compareCombatNumbers(
          attributes[variant.condition.left],
          attributes[variant.condition.right],
          variant.condition.operator,
        )
      ) {
        return variant.key;
      }
    }
  }
  return null;
}
