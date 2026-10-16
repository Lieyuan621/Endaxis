import type { NumericPassiveUiDefinition } from '../../../../packages/game-data-contract/src/operators';

/** 专属外观只读取模拟状态，不计算战斗规则。 */
export interface PassiveUiWidgetState {
  readonly value: number;
  readonly maximum: number;
  readonly active: boolean;
  readonly mode: 'normal' | 'ultimate';
  readonly ratio: number | null;
  readonly points: number;
}

/** 专属 HUD 编码只在显示层解释，图标、悬停与详情共用，不能修改原始回执。 */
export function numericPassiveUiText(
  state: {
    readonly appearance: NumericPassiveUiDefinition['appearance'];
    readonly value: number;
    readonly maximum: number;
  },
  translate: (key: string, values: Record<string, number | string>) => string,
): string {
  return translate('timeline.passiveUi.numericState', {
    value: state.value,
    maximum: state.maximum,
  });
}
