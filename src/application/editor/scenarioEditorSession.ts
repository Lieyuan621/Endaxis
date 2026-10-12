/**
 * 场景编辑的提交与观察契约；活动方案由项目会话统一管理历史和编辑约束。
 * UI 通过 `commit` 替换文档，一次完成的操作对应一次撤销，不依赖深层 watcher 推测边界。
 */
import type { ScenarioDocument } from '../../core/project/schema';

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
