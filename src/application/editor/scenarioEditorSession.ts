/**
 * 为场景编辑提供唯一的显式提交边界。
 * UI 只能通过 `commit` 替换场景文档；后续撤销、重做、自动保存和协作修订都应接在此处，
 * 不应通过深层 watcher 猜测一次用户操作何时结束。
 */
import type { ScenarioDocument } from '../../core/project/schema';
import {
  assertScenarioEditAllowed,
  assertScenarioPolicy,
  type ScenarioEditPolicy,
} from './scenarioEditConstraints';

export interface ScenarioEditorSnapshot {
  /** 每次有效提交递增；它表示编辑会话修订，不写入存档。 */
  readonly revision: number;
  readonly scenario: ScenarioDocument;
  /** 最近一次有效提交的稳定操作名，供历史记录和调试使用。 */
  readonly lastCommand: string | null;
}

export type ScenarioCommand = (scenario: ScenarioDocument) => ScenarioDocument;
export type ScenarioEditorSubscriber = (snapshot: ScenarioEditorSnapshot) => void;

export interface ScenarioEditingSession {
  readonly snapshot: ScenarioEditorSnapshot;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  commit(commandName: string, command: ScenarioCommand): boolean;
  undo(): boolean;
  redo(): boolean;
  subscribe(subscriber: ScenarioEditorSubscriber): () => void;
}

interface ScenarioHistoryEntry {
  readonly commandName: string;
  readonly before: ScenarioDocument;
  readonly after: ScenarioDocument;
}

const DEFAULT_HISTORY_LIMIT = 50;

export class ScenarioEditorSession implements ScenarioEditingSession {
  #snapshot: ScenarioEditorSnapshot;
  readonly #subscribers = new Set<ScenarioEditorSubscriber>();
  readonly #historyLimit: number;
  readonly #undoStack: ScenarioHistoryEntry[] = [];
  readonly #redoStack: ScenarioHistoryEntry[] = [];

  constructor(
    initialScenario: ScenarioDocument,
    historyLimit = DEFAULT_HISTORY_LIMIT,
    readonly editPolicy: ScenarioEditPolicy = {},
  ) {
    if (!Number.isInteger(historyLimit) || historyLimit < 1) {
      throw new RangeError('historyLimit must be a positive integer');
    }
    this.#historyLimit = historyLimit;
    this.#snapshot = {
      revision: 0,
      scenario: initialScenario,
      lastCommand: null,
    };
  }

  get snapshot(): ScenarioEditorSnapshot {
    return this.#snapshot;
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  /**
   * 提交一个返回新文档的场景命令。返回原引用表示没有产生修改，因此不会增加修订或通知订阅者。
   * 命令必须遵守不可变更新约定；会话不会通过深拷贝掩盖原地修改。
   */
  commit(commandName: string, command: ScenarioCommand): boolean {
    if (commandName.length === 0) throw new Error('scenario command name must not be empty');
    const previousScenario = this.#snapshot.scenario;
    const nextScenario = command(previousScenario);
    if (nextScenario === previousScenario) return false;
    assertScenarioEditAllowed(previousScenario, nextScenario, this.editPolicy);

    this.#undoStack.push({ commandName, before: previousScenario, after: nextScenario });
    if (this.#undoStack.length > this.#historyLimit) this.#undoStack.shift();
    this.#redoStack.length = 0;

    this.#publish(nextScenario, commandName);
    return true;
  }

  /** 撤销最近一次显式提交；没有历史时返回 `false` 且不产生空修订。 */
  undo(): boolean {
    const entry = this.#undoStack.at(-1);
    if (entry === undefined) return false;
    assertScenarioPolicy(this.#snapshot.scenario, entry.before, this.editPolicy);
    this.#undoStack.pop();
    this.#redoStack.push(entry);
    this.#publish(entry.before, `undo:${entry.commandName}`);
    return true;
  }

  /** 重做最近一次撤销；新的有效提交会清空这条重做分支。 */
  redo(): boolean {
    const entry = this.#redoStack.at(-1);
    if (entry === undefined) return false;
    assertScenarioPolicy(this.#snapshot.scenario, entry.after, this.editPolicy);
    this.#redoStack.pop();
    this.#undoStack.push(entry);
    this.#publish(entry.after, `redo:${entry.commandName}`);
    return true;
  }

  #publish(scenario: ScenarioDocument, lastCommand: string): void {
    this.#snapshot = {
      revision: this.#snapshot.revision + 1,
      scenario,
      lastCommand,
    };
    for (const subscriber of this.#subscribers) subscriber(this.#snapshot);
  }

  subscribe(subscriber: ScenarioEditorSubscriber): () => void {
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }
}
