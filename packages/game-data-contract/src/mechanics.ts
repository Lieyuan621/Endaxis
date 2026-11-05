/** 危机合约选择与说明求值所需的数据；名称和说明按 tagId 从语言资源读取。 */
import type { ImageRef } from './primitives.ts';
/** 原生分享码按列、行编码；保留空列和未参与模拟的指标位置。 */
export interface ContingencyContractShareLayout {
  readonly gameId: string;
  readonly maxColumn: number;
  readonly columns: Readonly<Record<string, Readonly<Record<string, number>>>>;
}
export interface ContingencyContractTagDefinition {
  readonly tagId: number;
  readonly columnId: string;
  readonly conflictId: string;
  readonly score: number;
  readonly keyId: string;
  readonly lockIds: readonly string[];
  readonly romanNumSuffix: string;
  readonly icon: ImageRef;
  readonly blackboard: Readonly<Record<string, number>>;
}
