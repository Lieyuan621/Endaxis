/** 专属外观只读取模拟状态，不计算战斗规则。 */
export interface PassiveUiWidgetState {
  readonly value: number;
  readonly maximum: number;
  readonly active: boolean;
  readonly mode: 'normal' | 'ultimate';
  readonly ratio: number | null;
  readonly points: number;
}
