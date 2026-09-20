import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';

/**
 * Skill.JumpTo 的下界门禁，不是 TimelineActionProcessor 的调度规则。
 * 当前镜像 03E5C92F..37：目标秒数小于 passedTime - 1e-5f 时忽略。
 * 这里只复现下界；自然时长上界与 CastEnd 顺序由技能宿主管理。
 */
export function isSkillTimelineJumpBeforeCurrent(
  destinationFrame: number,
  passedFrames: number,
): boolean {
  if (!Number.isInteger(destinationFrame)) {
    throw new TypeError('timeline jump destination must use an integer frame');
  }
  if (!Number.isFinite(passedFrames)) {
    throw new TypeError('skill timeline position must be finite');
  }
  const destinationSeconds = Math.fround(Math.fround(destinationFrame) / COMBAT_FRAMES_PER_SECOND);
  const passedSeconds = Math.fround(passedFrames / COMBAT_FRAMES_PER_SECOND);
  return destinationSeconds < Math.fround(passedSeconds - Math.fround(1e-5));
}

/** Shared Skill.JumpTo gate; timeline processors do not own skill lifetime. */
export class SkillTimelineJumpGate {
  #jumping = false;

  get isExecuting(): boolean {
    return this.#jumping;
  }

  execute(
    destinationFrame: number,
    passedFrames: number,
    naturalDurationFrames: number | undefined,
    jump: () => void,
    end: () => void,
  ): void {
    // Native +AC also suppresses jumps issued synchronously by CastEnd cleanup.
    if (this.#jumping) return;
    this.#jumping = true;
    try {
      if (isSkillTimelineJumpBeforeCurrent(destinationFrame, passedFrames)) return;
      if (naturalDurationFrames !== undefined) {
        if (!Number.isFinite(naturalDurationFrames) || naturalDurationFrames < 0)
          throw new RangeError('skill natural duration must be finite and non-negative');
        const destinationSeconds = Math.fround(
          Math.fround(destinationFrame) / COMBAT_FRAMES_PER_SECOND,
        );
        const periodSeconds = Math.fround(naturalDurationFrames / COMBAT_FRAMES_PER_SECOND);
        // 03E5C968..970 -> 04F2B521: CastEnd, without moving either timeline.
        if (destinationSeconds > Math.fround(periodSeconds + Math.fround(1e-5))) {
          end();
          return;
        }
      }
      jump();
    } finally {
      this.#jumping = false;
    }
  }
}
