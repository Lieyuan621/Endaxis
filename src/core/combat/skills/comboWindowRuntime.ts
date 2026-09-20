/**
 * 管理一场战斗中所有待释放连携候选。
 *
 * 原生运行时按干员保存候选，并用可暂停的剩余时间计时；这里保留该生命周期。
 * Endaxis 当前只有一个敌人，因此只记录候选顺序，不实现多目标挑选策略的数值差异。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { COMBAT_FRAMES_PER_SECOND, type CombatClock } from '../time/combatClock';
import type { FrameRuntime } from '../runtime/combatSimulation';
import {
  type ComboCastParameters,
  createComboWindowState,
  type ComboWindowState,
  type PendingComboRecord,
  type PendingComboWindow,
  type ComboRingQteRegistration,
} from '../state/environmentState';

export const COMBO_WINDOW_DURATION_FRAMES = 5 * COMBAT_FRAMES_PER_SECOND;

export type ComboWindowConsumeFailure =
  'windowMissing' | 'releaseOrderMismatch' | 'skillStageMismatch';

export type ComboWindowConsumeResult =
  | { readonly consumed: true; readonly window: PendingComboWindow }
  | {
      readonly consumed: false;
      readonly reason: ComboWindowConsumeFailure;
      readonly expected?: PendingComboWindow;
    };

export class ComboWindowRuntime implements FrameRuntime {
  readonly #operatorOrder = new Map<string, number>();

  constructor(
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
    operatorOrder: readonly string[] = [],
    readonly runtimeState: ComboWindowState = createComboWindowState(),
  ) {
    operatorOrder.forEach((operatorId, index) => this.#operatorOrder.set(operatorId, index));
  }

  /** 只读扁平快照，主要供诊断与投影使用；消费逻辑仍按干员记录执行。 */
  get pending(): readonly PendingComboWindow[] {
    return this.#orderedRecords().flatMap(record => record.candidates);
  }

  /** 原生 HasPendingComboSkill：只看该角色记录的候选数，不执行释放门禁或检查队首。 */
  hasPending(operatorId: string): boolean {
    return (this.runtimeState.records.get(operatorId)?.candidates.length ?? 0) > 0;
  }

  registerRingQte(
    operatorId: string,
    earlyDurationFrames: number,
    activeDurationFrames: number,
  ): number {
    if (!Number.isFinite(earlyDurationFrames) || earlyDurationFrames < 0)
      throw new Error('combo ring QTE early duration must be a non-negative finite number');
    if (!Number.isFinite(activeDurationFrames) || activeDurationFrames < 0)
      throw new Error('combo ring QTE active duration must be a non-negative finite number');
    const sequence = this.runtimeState.nextRingQteSequence++;
    const previous = this.#perfectOperators();
    const currentRemaining =
      this.runtimeState.records.get(operatorId)?.candidates.at(-1)?.remainingFrames ??
      COMBO_WINDOW_DURATION_FRAMES;
    this.runtimeState.ringQtes.set(sequence, {
      sequence,
      operatorId,
      startRemainingFrames: currentRemaining,
      earlyDurationFrames,
      activeDurationFrames,
    });
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'ComboRingQteOpened',
      sourceId: operatorId,
      data: { sequence, earlyDurationFrames, activeDurationFrames },
    });
    this.#recordPerfectChanges(previous);
    return sequence;
  }

  unregisterRingQte(sequence: number): void {
    const previous = this.#perfectOperators();
    this.runtimeState.ringQtes.delete(sequence);
    this.#recordPerfectChanges(previous);
  }

  wasRingQteSuccessful(skillCastId: number): boolean {
    return this.runtimeState.successfulRingQteSkillCastIds.has(skillCastId);
  }

  /** 当前应最先处理的干员记录中的候选。 */
  get first(): PendingComboWindow | undefined {
    return this.#orderedRecords()[0]?.candidates.at(-1);
  }

  open(
    operatorId: string,
    nextSkillKey: string,
    blackboard: Readonly<Record<string, number>> = {},
    nativeCondition?: ComboCastParameters & { readonly skillGroupKey: string },
  ): PendingComboWindow {
    if (operatorId.length === 0) throw new Error('combo window operatorId must not be empty');
    if (nextSkillKey.length === 0) throw new Error('combo window nextSkillKey must not be empty');
    const previous = this.#perfectOperators();
    const window: PendingComboWindow = {
      sequence: this.runtimeState.nextSequence,
      operatorId,
      nextSkillKey,
      openedFrame: this.clock.frame,
      blackboard: Object.freeze({ ...blackboard }),
      ...(nativeCondition === undefined
        ? {}
        : {
            nativeCondition: Object.freeze({
              skillGroupKey: nativeCondition.skillGroupKey,
              inputTarget: Object.freeze({ ...nativeCondition.inputTarget }),
              triggerTarget:
                nativeCondition.triggerTarget === null
                  ? null
                  : Object.freeze({ ...nativeCondition.triggerTarget }),
              assignPairs:
                nativeCondition.assignPairs === null
                  ? null
                  : Object.freeze({ ...nativeCondition.assignPairs }),
            }),
          }),
      remainingFrames: COMBO_WINDOW_DURATION_FRAMES,
    };
    this.runtimeState.nextSequence += 1;

    const existing = this.runtimeState.records.get(operatorId);
    if (existing === undefined) {
      this.runtimeState.records.set(operatorId, {
        operatorId,
        activationSequence: window.sequence,
        openedFrame: window.openedFrame,
        candidates: [window],
      });
    } else {
      existing.candidates.push(window);
    }

    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'ComboWindowOpened',
      sourceId: operatorId,
      data: {
        windowSequence: window.sequence,
        nextSkillKey,
        blackboardValueCount: Object.keys(window.blackboard).length,
        remainingFrames: window.remainingFrames,
      },
    });
    this.#recordPerfectChanges(previous);
    return window;
  }

  /**
   * 正常输入只允许消费当前激活干员的匹配阶段。
   * 原生释放入口会清空该干员的整条候选记录，而不是只移除选中的目标候选。
   */
  tryConsume(operatorId: string, skillKey: string): boolean {
    return this.consume(operatorId, skillKey).consumed;
  }

  /**
   * 消费当前可交互候选，并为合法性诊断保留失败原因。
   * 本方法不阻止技能执行；调用方决定是否把失败写入回执。
   */
  consume(
    operatorId: string,
    skillKey: string,
    nativeSkillGroupKey?: string,
    skillCastId?: number,
    sourceActionId?: string,
  ): ComboWindowConsumeResult {
    const active = this.#orderedRecords()[0];
    const candidate = active?.candidates.at(-1);
    if (active === undefined || candidate === undefined) {
      return { consumed: false, reason: 'windowMissing' };
    }
    if (active.operatorId !== operatorId) {
      return { consumed: false, reason: 'releaseOrderMismatch', expected: candidate };
    }
    // 原生候选绑定连携槽，施法时才取当前技能；旧语义窗口仍按多段技能身份严格匹配。
    if (
      candidate.nativeCondition === undefined
        ? candidate.nextSkillKey !== skillKey
        : candidate.nativeCondition.skillGroupKey !== nativeSkillGroupKey
    ) {
      return { consumed: false, reason: 'skillStageMismatch', expected: candidate };
    }
    const qte = [...this.runtimeState.ringQtes.values()]
      .filter(registration => registration.operatorId === operatorId)
      .sort((left, right) => right.sequence - left.sequence)[0];
    if (qte !== undefined) {
      const elapsedFrames = qte.startRemainingFrames - candidate.remainingFrames;
      const succeeded = this.#isPerfect(qte, candidate);
      if (succeeded && skillCastId !== undefined)
        this.runtimeState.successfulRingQteSkillCastIds.add(skillCastId);
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'ComboRingQtePressed',
        sourceId: operatorId,
        data: {
          sequence: qte.sequence,
          elapsedFrames,
          succeeded,
          ...(skillCastId === undefined ? {} : { skillCastId }),
          ...(sourceActionId === undefined ? {} : { sourceActionId }),
        },
      });
    }
    const previous = this.#perfectOperators();
    this.runtimeState.records.delete(operatorId);
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'ComboWindowConsumed',
      sourceId: operatorId,
      data: { windowSequence: candidate.sequence, nextSkillKey: skillKey },
    });
    this.#recordPerfectChanges(previous);
    return { consumed: true, window: candidate };
  }

  setGloballyPaused(paused: boolean): void {
    this.runtimeState.globallyPaused = paused;
  }

  setOperatorPaused(operatorId: string, paused: boolean): void {
    if (paused) this.runtimeState.pausedOperators.add(operatorId);
    else this.runtimeState.pausedOperators.delete(operatorId);
  }

  advanceFrame(): void {
    if (this.runtimeState.globallyPaused) return;
    const previous = this.#perfectOperators();
    for (const record of [...this.runtimeState.records.values()]) {
      if (this.runtimeState.pausedOperators.has(record.operatorId)) continue;
      for (const candidate of record.candidates) candidate.remainingFrames -= 1;
      // 原生只在 remainTime < 0 时移除；恰好归零的候选在本帧仍然存在。
      const expired = record.candidates.filter(candidate => candidate.remainingFrames < 0);
      if (expired.length === 0) continue;
      const expiredSequences = new Set(expired.map(candidate => candidate.sequence));
      record.candidates.splice(
        0,
        record.candidates.length,
        ...record.candidates.filter(candidate => !expiredSequences.has(candidate.sequence)),
      );
      for (const window of expired) {
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'ComboWindowExpired',
          sourceId: window.operatorId,
          data: { windowSequence: window.sequence, nextSkillKey: window.nextSkillKey },
        });
      }
      if (record.candidates.length === 0) this.runtimeState.records.delete(record.operatorId);
    }
    this.#recordPerfectChanges(previous);
  }

  #isPerfect(qte: ComboRingQteRegistration, candidate: PendingComboWindow): boolean {
    const elapsed = qte.startRemainingFrames - candidate.remainingFrames;
    return (
      elapsed >= qte.earlyDurationFrames &&
      elapsed <= qte.earlyDurationFrames + qte.activeDurationFrames
    );
  }

  /** 与消费共用最新 QTE 和剩余时间判定，不增加切面状态或按墙钟推算。 */
  #perfectOperators(): ReadonlySet<string> {
    const latest = new Map<string, ComboRingQteRegistration>();
    for (const qte of this.runtimeState.ringQtes.values()) {
      if ((latest.get(qte.operatorId)?.sequence ?? -1) < qte.sequence)
        latest.set(qte.operatorId, qte);
    }
    const result = new Set<string>();
    for (const [operatorId, qte] of latest) {
      const candidate = this.runtimeState.records.get(operatorId)?.candidates.at(-1);
      if (candidate !== undefined && this.#isPerfect(qte, candidate)) result.add(operatorId);
    }
    return result;
  }

  #recordPerfectChanges(previous: ReadonlySet<string>): void {
    const current = this.#perfectOperators();
    for (const operatorId of new Set([...previous, ...current])) {
      if (previous.has(operatorId) === current.has(operatorId)) continue;
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'ComboRingQteActiveChanged',
        sourceId: operatorId,
        data: { active: current.has(operatorId) },
      });
    }
  }

  #orderedRecords(): readonly PendingComboRecord[] {
    return [...this.runtimeState.records.values()].sort((left, right) => {
      if (left.openedFrame !== right.openedFrame) return left.openedFrame - right.openedFrame;
      const leftOrder = this.#operatorOrder.get(left.operatorId) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = this.#operatorOrder.get(right.operatorId) ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.activationSequence - right.activationSequence;
    });
  }
}
