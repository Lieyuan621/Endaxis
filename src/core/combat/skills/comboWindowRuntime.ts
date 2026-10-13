/**
 * 管理一场战斗中所有待释放连携候选。
 *
 * 原生运行时按干员保存候选，并用可暂停的剩余时间计时；这里保留该生命周期。
 * Endaxis 当前只有一个敌人，因此只记录候选顺序，不实现多目标挑选策略的数值差异。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import {
  COMBAT_FRAME_INTERVAL,
  COMBAT_FRAMES_PER_SECOND,
  type CombatClock,
} from '../time/combatClock';
import type { FrameRuntime } from '../runtime/combatSimulation';
import {
  type ComboCastParameters,
  createComboWindowState,
  type ComboWindowState,
  type PendingComboRecord,
  type PendingComboWindow,
  type ComboRingQteRegistration,
} from '../state/environmentState';

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
  readonly #durationFrames: number;
  readonly #operatorOrder = new Map<string, number>();
  readonly #qteCallbacks = new Map<number, () => void>();

  /** 恢复时只重绑已有注册，不重新登记或产生回执。 */
  bindRingQte(sequence: number, triggered: () => void): void {
    if (!this.runtimeState.ringQtes.has(sequence)) throw new Error('QTE registration is missing');
    if (this.runtimeState.ringQtes.get(sequence)!.listening)
      this.#qteCallbacks.set(sequence, triggered);
  }

  constructor(
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
    pendingIntervalSeconds: number,
    operatorOrder: readonly string[] = [],
    readonly runtimeState: ComboWindowState = createComboWindowState(),
  ) {
    if (!Number.isFinite(pendingIntervalSeconds) || pendingIntervalSeconds < 0)
      throw new Error('combo pending interval must be a non-negative finite number');
    this.#durationFrames = pendingIntervalSeconds * COMBAT_FRAMES_PER_SECOND;
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
      this.#durationFrames;
    this.runtimeState.ringQtes.set(sequence, {
      sequence,
      operatorId,
      listening: true,
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
    this.#qteCallbacks.delete(sequence);
    this.#recordPerfectChanges(previous);
  }

  /** 当前应最先处理的干员记录中的候选。 */
  get first(): PendingComboWindow | undefined {
    return this.#orderedRecords()[0]?.candidates.at(-1);
  }

  open(
    operatorId: string,
    nextSkillKey: string,
    blackboard: Readonly<Record<string, number>> = {},
    nativeCondition?: ComboCastParameters & { readonly skillSlotKey: string },
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
              skillSlotKey: nativeCondition.skillSlotKey,
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
      remainingFrames: this.#durationFrames,
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
      if (existing.candidates.length === 0) {
        existing.activationSequence = window.sequence;
        existing.openedFrame = window.openedFrame;
      }
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
    return this.consume(operatorId, skillKey, result => result.consumed);
  }

  /**
   * 先通知 QTE，再读取候选并同步施放，返回后清除候选。
   * 不满足窗口条件时仍调用 cast，由时间轴记录诊断并执行已放置的技能。
   */
  consume<T>(
    operatorId: string,
    skillKey: string,
    cast: (result: ComboWindowConsumeResult) => T,
    nativeSkillSlotKey?: string,
    skillCastId?: number,
    sourceActionId?: string,
  ): T {
    const active = this.#orderedRecords()[0];
    const candidate = active?.candidates.at(-1);
    if (active === undefined || candidate === undefined) {
      return cast({ consumed: false, reason: 'windowMissing' });
    }
    if (active.operatorId !== operatorId) {
      return cast({ consumed: false, reason: 'releaseOrderMismatch', expected: candidate });
    }
    // 原生候选绑定连携槽，施法时才取当前技能；旧语义窗口仍按多段技能身份严格匹配。
    if (
      candidate.nativeCondition === undefined
        ? candidate.nextSkillKey !== skillKey
        : candidate.nativeCondition.skillSlotKey !== nativeSkillSlotKey
    ) {
      return cast({ consumed: false, reason: 'skillStageMismatch', expected: candidate });
    }
    const previous = this.#perfectOperators();
    // 每个动作独立监听；界面选择最新提示不影响其他动作的成功判定。
    for (const qte of [...this.runtimeState.ringQtes.values()]) {
      if (
        !this.runtimeState.ringQtes.has(qte.sequence) ||
        !qte.listening ||
        qte.operatorId !== operatorId
      )
        continue;
      // 前一个监听器可能同步消费或增加候选；原生逐次查询当前剩余时间。
      const remainingFrames = active.candidates.at(-1)?.remainingFrames ?? this.#durationFrames;
      const elapsedFrames = qte.startRemainingFrames - remainingFrames;
      const succeeded = this.#isPerfect(qte, remainingFrames);
      // 原生先解绑再执行成功回调；未命中有效区间仍保留监听。
      if (succeeded) qte.listening = false;
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
      if (succeeded) {
        const triggered = this.#qteCallbacks.get(qte.sequence);
        this.#qteCallbacks.delete(qte.sequence);
        triggered?.();
      }
    }
    const selected = active.candidates.at(-1);
    if (selected === undefined) {
      this.#recordPerfectChanges(previous);
      return cast({ consumed: false, reason: 'windowMissing' });
    }
    const result = cast({ consumed: true, window: selected });
    // 清空原记录，让嵌套调用持有的引用也观察到消费；下一次触发仍复用它。
    active.candidates.length = 0;
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'ComboWindowConsumed',
      sourceId: operatorId,
      data: { windowSequence: selected.sequence, nextSkillKey: skillKey },
    });
    this.#recordPerfectChanges(previous);
    return result;
  }

  setGloballyPaused(paused: boolean): void {
    this.runtimeState.globallyPaused = paused;
  }

  setOperatorPaused(operatorId: string, paused: boolean): void {
    if (paused) this.runtimeState.pausedOperators.add(operatorId);
    else this.runtimeState.pausedOperators.delete(operatorId);
  }

  advanceFrame(): void {
    this.advance(COMBAT_FRAME_INTERVAL);
  }

  /** BattleManager 的候选剩余时间随全局缩放；显式暂停仍优先。 */
  advance(deltaSeconds: number): void {
    if (this.runtimeState.globallyPaused) return;
    const previous = this.#perfectOperators();
    for (const record of [...this.runtimeState.records.values()]) {
      if (
        record.candidates.length === 0 ||
        this.runtimeState.pausedOperators.has(record.operatorId)
      )
        continue;
      for (const candidate of record.candidates)
        candidate.remainingFrames -= deltaSeconds * COMBAT_FRAMES_PER_SECOND;
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
    }
    this.#recordPerfectChanges(previous);
  }

  #isPerfect(qte: ComboRingQteRegistration, remainingFrames: number): boolean {
    const elapsed = qte.startRemainingFrames - remainingFrames;
    return (
      elapsed >= qte.earlyDurationFrames &&
      elapsed <= qte.earlyDurationFrames + qte.activeDurationFrames
    );
  }

  /** 展示最新的活动提示；动作判定仍分别使用自己的连携剩余时间。 */
  #perfectOperators(): ReadonlySet<string> | undefined {
    if (this.runtimeState.ringQtes.size === 0) return undefined;
    const latest = new Map<string, ComboRingQteRegistration>();
    for (const qte of this.runtimeState.ringQtes.values()) {
      if (!qte.listening) continue;
      if ((latest.get(qte.operatorId)?.sequence ?? -1) < qte.sequence)
        latest.set(qte.operatorId, qte);
    }
    const result = new Set<string>();
    for (const [operatorId, qte] of latest) {
      const candidate = this.runtimeState.records.get(operatorId)?.candidates.at(-1);
      if (candidate !== undefined && this.#isPerfect(qte, candidate.remainingFrames))
        result.add(operatorId);
    }
    return result;
  }

  #recordPerfectChanges(previous: ReadonlySet<string> | undefined): void {
    const current = this.#perfectOperators();
    if (previous === undefined && current === undefined) return;
    for (const operatorId of new Set([...(previous ?? []), ...(current ?? [])])) {
      const active = current?.has(operatorId) ?? false;
      if ((previous?.has(operatorId) ?? false) === active) continue;
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'ComboRingQteActiveChanged',
        sourceId: operatorId,
        data: { active },
      });
    }
  }

  #orderedRecords(): readonly PendingComboRecord[] {
    return [...this.runtimeState.records.values()]
      .filter(record => record.candidates.length > 0)
      .sort((left, right) => {
        if (left.openedFrame !== right.openedFrame) return left.openedFrame - right.openedFrame;
        const leftOrder = this.#operatorOrder.get(left.operatorId) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = this.#operatorOrder.get(right.operatorId) ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.activationSequence - right.activationSequence;
      });
  }
}
