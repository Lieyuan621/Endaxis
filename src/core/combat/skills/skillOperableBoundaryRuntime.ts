/**
 * 技能块“可操作边界”的最小运行时事实跟踪器。
 *
 * 它在数据流中的位置：调用方（技能运行时）每个实际帧把施法者 self-scaled 后的
 * 逻辑帧增量交给本模块累计；当某次释放累计到 `timelineBlockDurationFrames` 时，
 * 本模块返回一次不可变事实，供上层归约为该 castId 的实际结束帧。
 *
 * 本模块不读取 CombatClock。调用方传入当前技能更新阶段的实际帧 `updateFrame`；
 * 返回值是边界被观察到的帧，不是下一次输入帧或显示区间的 end-exclusive 端点。
 * 序列是否自然结束、技能是否仍处于 casting，都与本模块无关。
 * 此处只跟踪显示用的局部边界，不能代替具体后续技能的原生中断/路由判断。
 */

import {
  createSkillOperableBoundaryState,
  type SkillOperableBoundaryFact,
  type SkillOperableBoundaryState,
} from '../state/abilityState';

/** 浮点帧增量累计到整数边界时允许的误差；避免 0.2 × 150 这类情况晚一帧。 */
const BOUNDARY_EPSILON_FRAMES = 0.00001;

/**
 * 同时跟踪多个技能释放的可操作边界。
 * castId 在一次场景内是稳定释放身份，因此 pending 和已完成的 castId 都不允许再次登记。
 */
export class SkillOperableBoundaryRuntime {
  constructor(readonly runtimeState = createSkillOperableBoundaryState()) {}

  /**
   * 登记一次成功释放的可操作边界。
   * `durationFrames` 必须为正有限数；稳定 castId 一旦登记过，无论 pending 或已完成都不能再次登记。
   */
  begin(castId: string, durationFrames: number, actualStartFrame: number): void {
    return beginSkillOperableBoundary(this.runtimeState, castId, durationFrames, actualStartFrame);
  }

  /**
   * 用本帧施法者 self-scaled 的逻辑帧增量推进全部 pending 项。
   * `deltaFrames` 为 0 时不推进任何项；`updateFrame` 仍会被校验。
   * 返回按 begin 登记顺序排列的本帧到达事实；每个 pending 项最多返回一次。
   */
  advance(deltaFrames: number, updateFrame: number): readonly SkillOperableBoundaryFact[] {
    return advanceSkillOperableBoundaries(this.runtimeState, deltaFrames, updateFrame);
  }
}

/** 登记已经开始的技能边界；拒绝重复身份。 */
export function beginSkillOperableBoundary(
  state: SkillOperableBoundaryState,
  castId: string,
  durationFrames: number,
  actualStartFrame: number,
): void {
  if (typeof castId !== 'string' || castId.length === 0) {
    throw new TypeError('castId must be a non-empty string');
  }
  if (!Number.isFinite(durationFrames) || durationFrames <= 0) {
    throw new RangeError('durationFrames must be a positive finite number');
  }
  if (!Number.isInteger(actualStartFrame)) {
    throw new RangeError('actualStartFrame must be an integer');
  }
  if (state.registeredCastIds.has(castId)) {
    throw new Error(`duplicate skill operable boundary registration for cast '${castId}'`);
  }
  state.registeredCastIds.add(castId);
  state.pendingByCastId.set(castId, {
    castId,
    durationFrames,
    actualStartFrame,
    accumulatedFrames: 0,
  });
}

/** 按局部时间推进，依登记顺序发布本帧到达的边界。 */
export function advanceSkillOperableBoundaries(
  state: SkillOperableBoundaryState,
  deltaFrames: number,
  updateFrame: number,
): readonly SkillOperableBoundaryFact[] {
  if (!Number.isFinite(deltaFrames) || deltaFrames < 0) {
    throw new RangeError('deltaFrames must be a non-negative finite number');
  }
  if (!Number.isInteger(updateFrame)) {
    throw new RangeError('updateFrame must be an integer');
  }
  if (deltaFrames === 0) return [];

  const reached: SkillOperableBoundaryFact[] = [];
  for (const [castId, pending] of state.pendingByCastId) {
    // 输入发生在本帧 AbilitySystem 推进之前；本帧启动的技能从下一实际帧区间开始累计。
    if (pending.actualStartFrame >= updateFrame) continue;
    pending.accumulatedFrames += deltaFrames;
    if (pending.accumulatedFrames + BOUNDARY_EPSILON_FRAMES < pending.durationFrames) continue;
    reached.push(
      Object.freeze({
        castId,
        durationFrames: pending.durationFrames,
        reachedAtFrame: updateFrame,
      }),
    );
    state.pendingByCastId.delete(castId);
  }
  return reached;
}
