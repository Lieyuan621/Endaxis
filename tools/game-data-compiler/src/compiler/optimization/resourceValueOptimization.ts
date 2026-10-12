/** 图黑板裁剪报告。执行算法统一位于 graphValueOptimization。 */
export interface ResourceValueOptimizationReport {
  readonly resourceId: string;
  readonly removedWrites: readonly { readonly path: string; readonly key: string }[];
  readonly removedInitialKeys: readonly string[];
  readonly retainedReason?: 'unresolved-blackboard-access';
  /** 嵌套入口仍可能消费重复执行的返回值，因此保留的写入位置。 */
  readonly retainedLifetimePaths: readonly string[];
}
