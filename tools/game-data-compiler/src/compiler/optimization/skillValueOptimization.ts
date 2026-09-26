/** 图黑板裁剪报告。执行算法统一位于 graphValueOptimization。 */
export interface SkillValueOptimizationReport {
  readonly skillId: string;
  readonly removedWrites: readonly { readonly path: string; readonly key: string }[];
  readonly removedInitialKeys: readonly string[];
  readonly retainedReason?: 'unresolved-blackboard-access';
  /** 删除整个序列会改变重复执行的返回值，至少保留原有一个步骤。 */
  readonly retainedLifetimePaths: readonly string[];
}
