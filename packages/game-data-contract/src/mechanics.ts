/** 危机合约选择与说明求值所需的数据；名称和说明按 tagId 从语言资源读取。 */
export interface ContingencyContractTagDefinition {
  readonly tagId: number;
  readonly columnId: string;
  readonly conflictId: string;
  readonly score: number;
  readonly keyId: string;
  readonly lockIds: readonly string[];
  readonly romanNumSuffix: string;
  readonly iconPath: string;
  readonly blackboard: Readonly<Record<string, number>>;
}
