/**
 * 完整战斗装配的检查点会话。
 *
 * 检查点持有数据图副本和当时的技能登记表；固定程序本身共享。恢复工厂使用检查点提供的分支
 * 登记表建立新装配。候选完整成功前，
 * 当前装配不会被替换。丢弃检查点句柄后，WeakMap 不再保留对应历史数据。
 */
import type { CombatStateGraph } from '../state/combatState';
import type { CombatRuntimeAssembly } from './combatRuntimeAssembly';
import type { CombatFrameInput } from './combatFrameInput';
import type { CombatSkillPrograms } from '../skills/combatSkillPrograms';
import type { CombatReceiptEntry } from '../receipt/combatReceipt';
import type { CombatReceiptView, CombatReceiptCursor } from '../receipt/combatReceiptHistory';

const combatCheckpointIdentity: unique symbol = Symbol('combat runtime checkpoint');

export interface CombatRuntimeCheckpoint {
  readonly [combatCheckpointIdentity]: true;
}

export type RestoreCombatRuntimeAssembly = (
  graph: CombatStateGraph,
  skillPrograms: CombatSkillPrograms,
  history: CombatReceiptView,
) => CombatRuntimeAssembly;

interface SavedCombatRuntime {
  readonly graph: CombatStateGraph;
  readonly skillPrograms: CombatSkillPrograms;
  readonly history: CombatReceiptView;
}

export class CombatRuntimeSession {
  #current: CombatRuntimeAssembly;
  readonly #restoreAssembly: RestoreCombatRuntimeAssembly;
  readonly #checkpoints = new WeakMap<CombatRuntimeCheckpoint, SavedCombatRuntime>();
  #phase: 'idle' | 'advancing' | 'saving' | 'restoring' | 'faulted' = 'idle';
  #generation = 0;
  /** 会话一旦由逐帧输入驱动，省略输入仅表示空帧，不重新启用旧排程。 */
  #liveInputs = false;

  constructor(current: CombatRuntimeAssembly, restoreAssembly: RestoreCombatRuntimeAssembly) {
    this.#current = current;
    this.#restoreAssembly = restoreAssembly;
  }

  get frame(): number {
    return this.#current.clock.frame;
  }

  /** 恢复后换代；观察缓存和外部句柄可据此拒绝旧分支。 */
  get generation(): number {
    return this.#generation;
  }

  get initialInputPending(): boolean {
    this.#assertIdle('read');
    return this.#current.stateGraph.inputs.initialInputPending;
  }

  /** 只复制所需的新事实；游标属于当前分支，恢复后调用方须重建观察进度。 */
  readReceipts(
    cursor?: CombatReceiptCursor,
    events?: ReadonlySet<string>,
  ): { readonly entries: readonly CombatReceiptEntry[]; readonly cursor: CombatReceiptCursor } {
    this.#assertIdle('read');
    const history = this.#current.receipt.history;
    return history.readSince(cursor ?? history.cursor(), events);
  }

  readHistory(): CombatReceiptView {
    this.#assertIdle('read');
    return this.#current.receipt.history.snapshot();
  }

  readState(): CombatStateGraph {
    this.#assertIdle('read');
    return structuredClone(this.#current.stateGraph);
  }

  advanceFrame(): void {
    this.advanceFrames(1);
  }

  /** 从完整帧截面提交下一帧输入，调用结束后不保留输入对象。 */
  advanceInputFrame(input: CombatFrameInput): void {
    this.#applyLiveInput(() => this.#current.advanceInputFrame(input));
  }

  /** 提交初始化完成后的第一次输入，帧号不变。 */
  applyInitialInput(input: CombatFrameInput): void {
    this.#applyLiveInput(() => this.#current.applyInitialInput(input));
  }

  #applyLiveInput(apply: () => void): void {
    this.#assertIdle('advance');
    const previousLiveInputs = this.#liveInputs;
    this.#liveInputs = true;
    this.#phase = 'advancing';
    try {
      apply();
      this.#phase = 'idle';
    } catch (error) {
      this.#liveInputs = previousLiveInputs;
      this.#phase = 'faulted';
      throw error;
    }
  }

  advanceFrames(count: number): void {
    this.#assertIdle('advance');
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError('combat session frame count must be a non-negative safe integer');
    }
    this.#phase = 'advancing';
    try {
      if (this.#liveInputs) {
        for (let frame = 0; frame < count; frame += 1) this.#current.advanceInputFrame({});
      } else this.#current.advanceFrames(count);
      this.#phase = 'idle';
    } catch (error) {
      this.#phase = 'faulted';
      throw error;
    }
  }

  save(): CombatRuntimeCheckpoint {
    this.#assertIdle('save');
    this.#phase = 'saving';
    try {
      const checkpoint: CombatRuntimeCheckpoint = Object.freeze({
        [combatCheckpointIdentity]: true as const,
      });
      this.#checkpoints.set(checkpoint, {
        graph: structuredClone(this.#current.stateGraph),
        skillPrograms: this.#current.combatSkillPrograms.fork(),
        history: this.#current.receipt.history.snapshot(),
      });
      return checkpoint;
    } finally {
      this.#phase = 'idle';
    }
  }

  /** 从保存点建立完全独立的试探会话；父会话不登记候选，也不改变当前分支。 */
  fork(
    checkpoint: CombatRuntimeCheckpoint,
    restoreAssembly: RestoreCombatRuntimeAssembly = this.#restoreAssembly,
  ): CombatRuntimeSession {
    this.#assertIdle('fork');
    const saved = this.#requireCheckpoint(checkpoint);
    const branch = new CombatRuntimeSession(
      this.#restoreSaved(saved, restoreAssembly),
      restoreAssembly,
    );
    branch.#liveInputs = this.#liveInputs;
    return branch;
  }

  /** 显式释放仍被调用方持有句柄的历史数据；之后该句柄不能再恢复或分叉。 */
  discardCheckpoint(checkpoint: CombatRuntimeCheckpoint): void {
    this.#assertIdle('discard checkpoint');
    if (!this.#checkpoints.delete(checkpoint)) {
      throw new Error('checkpoint does not belong to this combat session');
    }
  }

  restore(
    checkpoint: CombatRuntimeCheckpoint,
    restoreAssembly: RestoreCombatRuntimeAssembly = this.#restoreAssembly,
  ): void {
    if (this.#phase !== 'idle' && this.#phase !== 'faulted') {
      throw new Error(`cannot restore combat session while ${this.#phase}`);
    }
    const saved = this.#requireCheckpoint(checkpoint);
    const previousPhase = this.#phase;
    this.#phase = 'restoring';
    try {
      const candidate = this.#restoreSaved(saved, restoreAssembly);
      this.#current = candidate;
      this.#generation += 1;
      this.#phase = 'idle';
    } catch (error) {
      this.#phase = previousPhase;
      throw error;
    }
  }

  #assertIdle(operation: string): void {
    if (this.#phase !== 'idle') {
      throw new Error(`cannot ${operation} combat session while ${this.#phase}`);
    }
  }

  #restoreSaved(
    saved: SavedCombatRuntime,
    restore: RestoreCombatRuntimeAssembly,
  ): CombatRuntimeAssembly {
    const programs = saved.skillPrograms.fork();
    const candidate = restore(structuredClone(saved.graph), programs, saved.history);
    if (candidate.combatSkillPrograms !== programs) {
      throw new Error('restored combat must use the checkpoint skill program bindings');
    }
    if (candidate.receipt.history.snapshot() !== saved.history) {
      throw new Error('restored combat must retain the saved receipt history without replay');
    }
    return candidate;
  }

  #requireCheckpoint(checkpoint: CombatRuntimeCheckpoint): SavedCombatRuntime {
    const saved = this.#checkpoints.get(checkpoint);
    if (saved === undefined) throw new Error('checkpoint does not belong to this combat session');
    return saved;
  }
}
