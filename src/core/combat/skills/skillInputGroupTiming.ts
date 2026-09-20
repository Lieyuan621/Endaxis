/**
 * 为持久连续组索引已经发生的块边界。
 * 每条回执只读取一次；自然结束不会被误当成显示块结束，也不扫描整份战斗日志寻找下一段。
 * SkillSwitchedToBuff 表示同步旁路已经执行完毕，没有候选技能生命周期，从下一输入帧接续。
 */
import type { CombatReceiptEntry } from '../receipt/combatReceipt';
import type { CombatReceiptCursor, CombatReceiptHistory } from '../receipt/combatReceiptHistory';
import type { ScheduledSkillInput } from '../state/environmentState';

export class SkillInputGroupTiming {
  readonly #facts = new Map<string, Map<string, CombatReceiptEntry>>();
  readonly #boundaryFrames = new Map<string, number>();
  #cursor: CombatReceiptCursor;

  constructor(
    readonly history: CombatReceiptHistory,
    readonly resolveBlockFrames: (input: ScheduledSkillInput) => number,
  ) {
    this.#cursor = history.cursor();
  }

  canContinue(previous: ScheduledSkillInput, currentFrame: number): boolean {
    this.#collect();
    if (currentFrame <= previous.frame) return false;
    // 零宽没有边界回执，仍至少经过一次实际输入帧。
    if (this.resolveBlockFrames(previous) === 0) return true;
    const boundary = this.#boundaryFrames.get(previous.castId!);
    return boundary !== undefined && boundary < currentFrame;
  }

  find(castId: string | undefined, event: string): CombatReceiptEntry | undefined {
    this.#collect();
    return castId === undefined ? undefined : this.#facts.get(castId)?.get(event);
  }

  #collect(): void {
    const next = this.history.readSince(this.#cursor, INPUT_FACTS);
    this.#cursor = next.cursor;
    for (const entry of next.entries) {
      const castId = entry.data?.castId;
      if (typeof castId !== 'string') continue;
      let facts = this.#facts.get(castId);
      if (facts === undefined) {
        facts = new Map();
        this.#facts.set(castId, facts);
      }
      if (!facts.has(entry.event)) facts.set(entry.event, entry);
      if (entry.event === 'SkillOperableBoundaryReached' || entry.event === 'SkillSwitchedToBuff')
        this.#boundaryFrames.set(castId, entry.frame);
    }
  }
}

const INPUT_FACTS = new Set([
  'SkillOperableBoundaryReached',
  'SkillSwitchedToBuff',
  'SkillInterrupted',
  'SkillInputProcessed',
]);
