/** 回调时间使用投射物逻辑时钟，单位为 30 FPS 帧，相对本次发射。 */
export interface ProjectileCallbackSchedule<Frame = number> {
  readonly event: 'launch' | 'hit' | 'block' | 'reach' | 'finish';
  /** hit 的目标来源：碰撞时选取对象，或使用发射时的到达目标。 */
  readonly hitKind?: 'collision' | 'arrival';
  /** 严格递增的非负整数；空列表表示此回调在该配置下不触发。 */
  readonly triggerFrames: readonly Frame[];
}

/** 每次发射使用的回调时间表。 */
export interface ProjectileLaunchSchedule<Frame = number> {
  readonly callbacks: readonly ProjectileCallbackSchedule<Frame>[];
  /** 结束活动阶段的时刻；不隐式调用 finish 回调。 */
  readonly endFrame: Frame;
}
