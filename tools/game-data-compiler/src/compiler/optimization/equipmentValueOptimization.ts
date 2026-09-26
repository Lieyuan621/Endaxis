/** 图黑板裁剪报告。执行算法统一位于 graphValueOptimization。 */
export interface EquipmentValueOptimizationReport {
  /** 词条或套装所属的定义身份。 */
  readonly definitionId: string;
  /** 贡献在完整定义中的路径。 */
  readonly path: string;
  /** 候选中删除的初值键；关闭优化时为空。 */
  readonly removedInitialKeys: readonly string[];
  /** 剩余初值存在运行时用途、访问尚未查清，或调用方关闭了优化。 */
  readonly retainedReason?:
    'runtime-value-access' | 'unresolved-blackboard-access' | 'optimization-disabled';
}
