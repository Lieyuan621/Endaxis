import {
  CombatInputSchedule,
  type CombatInputScheduleCheckpoint,
  type ScheduledCombatFrameInput,
} from '../simulation/combatInputSchedule';
import type { StandardPlayerDamageCombatSession } from '../simulation/standardPlayerDamageCombatSession';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import type { LegacyRetimingCheckpointSession, LegacyRetimingTrial } from './heuristicRetiming';

const RETIMING_EVENTS = new Set([
  'SkillStarted',
  'SkillOperableBoundaryReached',
  'SkillSwitchedToBuff',
  'SkillInputCannotInterruptCurrentSkill',
  'SkillInputResolvedToDifferentSkill',
  'SkillInputProcessed',
  'SkillEnded',
  'SkillInterrupted',
  'TimeDilationStarted',
  'TimeDilationEnded',
]);

/** 主会话只推进已确认前缀；观察分支可以越过下一候选，但不会替换主会话。 */
export class CheckpointRetimingSession implements LegacyRetimingCheckpointSession {
  #driver: CombatInputSchedule;
  #checkpoint: CombatInputScheduleCheckpoint;

  constructor(readonly main: StandardPlayerDamageCombatSession) {
    this.#driver = new CombatInputSchedule(main, []);
    this.#checkpoint = this.#driver.save();
  }

  get inputBoundary(): number {
    return this.main.runtime.frame + (this.main.runtime.initialInputPending ? 0 : 1);
  }

  advanceBefore(
    frame: number,
    confirmedInputsFromCurrentBoundary: readonly ScheduledCombatFrameInput[],
  ): void {
    if (!Number.isSafeInteger(frame) || frame < this.inputBoundary) {
      throw new RangeError('retiming boundary precedes the saved input checkpoint');
    }
    if (frame === this.inputBoundary) return;
    const nextDriver = new CombatInputSchedule(this.main, confirmedInputsFromCurrentBoundary);
    nextDriver.advanceToFrame(frame - 1);
    const next = nextDriver.save();
    this.#driver.discardCheckpoint(this.#checkpoint);
    this.#driver = nextDriver;
    this.#checkpoint = next;
  }

  trial(inputsAfterCheckpoint: readonly ScheduledCombatFrameInput[]): LegacyRetimingTrial {
    let driver: CombatInputSchedule | null = this.#driver.forkWithInputsAfterCheckpoint(
      this.#checkpoint,
      inputsAfterCheckpoint,
    );
    let branch: StandardPlayerDamageCombatSession | null = driver.session;
    const entries: CombatReceiptEntry[] = [];
    let cursor:
      import('../../core/combat/receipt/combatReceiptHistory').CombatReceiptCursor | undefined;
    return {
      advanceToFrame(endFrame, stopWhen) {
        const activeBranch = branch;
        const activeDriver = driver;
        if (activeBranch === null || activeDriver === null) {
          throw new Error('retiming trial has been disposed');
        }
        const collect = () => {
          const next = activeBranch.runtime.readReceipts(cursor, RETIMING_EVENTS);
          entries.push(...next.entries);
          cursor = next.cursor;
          return next.entries.length > 0;
        };
        if (stopWhen === undefined) {
          activeDriver.advanceToFrame(endFrame);
          collect();
        } else {
          if (!Number.isSafeInteger(endFrame) || endFrame < activeBranch.runtime.frame) {
            throw new RangeError('observation end must be at or after the current frame');
          }
          // 判定在完整帧末进行；输入、技能和时间膨胀事实均已提交。只在新增相关事实时重算。
          collect();
          if (stopWhen({ receiptEntries: entries })) return { receiptEntries: entries };
          while (
            activeBranch.runtime.initialInputPending ||
            activeBranch.runtime.frame < endFrame
          ) {
            activeDriver.advanceToFrame(
              activeBranch.runtime.frame + (activeBranch.runtime.initialInputPending ? 0 : 1),
            );
            if (collect() && stopWhen({ receiptEntries: entries })) break;
          }
        }
        return { receiptEntries: entries };
      },
      dispose() {
        branch = null;
        driver = null;
        cursor = undefined;
      },
    };
  }
}
