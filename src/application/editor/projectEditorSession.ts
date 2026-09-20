import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';
import {
  assertScenarioEditAllowed,
  assertScenarioPolicy,
  type ScenarioEditPolicy,
} from './scenarioEditConstraints';
import type {
  ScenarioCommand,
  ScenarioEditingSession,
  ScenarioEditorSnapshot,
  ScenarioEditorSubscriber,
} from './scenarioEditorSession';

export interface ProjectEditorSnapshot {
  readonly revision: number;
  readonly project: EndaxisProjectDocument;
  readonly lastCommand: string | null;
}

export type ProjectCommand = (project: EndaxisProjectDocument) => EndaxisProjectDocument;
export type ProjectEditorSubscriber = (snapshot: ProjectEditorSnapshot) => void;

interface ProjectHistoryEntry {
  readonly commandName: string;
  readonly before: EndaxisProjectDocument;
  readonly after: EndaxisProjectDocument;
  readonly replacedScenarioId?: string;
}

export class ProjectEditorSession {
  #snapshot: ProjectEditorSnapshot;
  readonly #subscribers = new Set<ProjectEditorSubscriber>();
  readonly #undoStack: ProjectHistoryEntry[] = [];
  readonly #redoStack: ProjectHistoryEntry[] = [];

  constructor(
    initialProject: EndaxisProjectDocument,
    readonly historyLimit = 50,
    readonly editPolicy: (scenarioId: string) => ScenarioEditPolicy = () => ({}),
  ) {
    if (!Number.isInteger(historyLimit) || historyLimit < 1) {
      throw new RangeError('historyLimit must be a positive integer');
    }
    this.#snapshot = { revision: 0, project: initialProject, lastCommand: null };
  }

  get snapshot(): ProjectEditorSnapshot {
    return this.#snapshot;
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  commit(commandName: string, command: ProjectCommand): boolean {
    return this.#commit(commandName, command);
  }

  /** 整体重置活动方案时允许替换继承身份；同一事务内的其他方案仍受编辑约束。 */
  commitScenarioReplacement(commandName: string, command: ProjectCommand): boolean {
    return this.#commit(commandName, command, this.#snapshot.project.activeScenarioId);
  }

  #commit(commandName: string, command: ProjectCommand, replacedScenarioId?: string): boolean {
    if (commandName.length === 0) throw new Error('project command name must not be empty');
    const before = this.#snapshot.project;
    const after = command(before);
    if (after === before) return false;
    // 项目命令与活动方案命令共用约束；删除整个方案是文档管理，不属于移动输入。
    for (const previous of before.scenarios) {
      const next = after.scenarios.find(scenario => scenario.id === previous.id);
      if (next !== undefined && previous.id !== replacedScenarioId)
        assertScenarioEditAllowed(previous, next, this.editPolicy(previous.id));
    }
    this.#undoStack.push({ commandName, before, after, replacedScenarioId });
    if (this.#undoStack.length > this.historyLimit) this.#undoStack.shift();
    this.#redoStack.length = 0;
    this.#publish(after, commandName);
    return true;
  }

  undo(): boolean {
    const entry = this.#undoStack.at(-1);
    if (entry === undefined) return false;
    this.#checkHistoryPolicy(entry.before, entry.replacedScenarioId);
    this.#undoStack.pop();
    this.#redoStack.push(entry);
    this.#publish(entry.before, `undo:${entry.commandName}`);
    return true;
  }

  redo(): boolean {
    const entry = this.#redoStack.at(-1);
    if (entry === undefined) return false;
    this.#checkHistoryPolicy(entry.after, entry.replacedScenarioId);
    this.#redoStack.pop();
    this.#undoStack.push(entry);
    this.#publish(entry.after, `redo:${entry.commandName}`);
    return true;
  }

  #checkHistoryPolicy(next: EndaxisProjectDocument, replacedScenarioId?: string): void {
    for (const previous of this.#snapshot.project.scenarios) {
      const target = next.scenarios.find(scenario => scenario.id === previous.id);
      if (target !== undefined && previous.id !== replacedScenarioId)
        assertScenarioPolicy(previous, target, this.editPolicy(previous.id));
    }
  }

  /** Replace the opened document and start a fresh history boundary. */
  replaceProject(project: EndaxisProjectDocument, commandName = 'openProject'): void {
    if (commandName.length === 0) throw new Error('project command name must not be empty');
    this.#undoStack.length = 0;
    this.#redoStack.length = 0;
    this.#publish(project, commandName);
  }

  subscribe(subscriber: ProjectEditorSubscriber): () => void {
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  #publish(project: EndaxisProjectDocument, lastCommand: string): void {
    this.#snapshot = { revision: this.#snapshot.revision + 1, project, lastCommand };
    for (const subscriber of this.#subscribers) subscriber(this.#snapshot);
  }
}

function activeScenario(project: EndaxisProjectDocument): ScenarioDocument {
  const scenario = project.scenarios.find(value => value.id === project.activeScenarioId);
  if (scenario === undefined)
    throw new Error(`active scenario '${project.activeScenarioId}' does not exist`);
  return scenario;
}

/** 让现有场景命令在项目级历史中运行；模板库和场景切换因此共享同一撤销顺序。 */
export class ActiveScenarioEditorSession implements ScenarioEditingSession {
  readonly #subscribers = new Set<ScenarioEditorSubscriber>();
  readonly #unsubscribe: () => void;

  constructor(readonly projectSession: ProjectEditorSession) {
    this.#unsubscribe = projectSession.subscribe(snapshot => {
      const projected: ScenarioEditorSnapshot = {
        revision: snapshot.revision,
        scenario: activeScenario(snapshot.project),
        lastCommand: snapshot.lastCommand,
      };
      for (const subscriber of this.#subscribers) subscriber(projected);
    });
  }

  get snapshot(): ScenarioEditorSnapshot {
    const snapshot = this.projectSession.snapshot;
    return {
      revision: snapshot.revision,
      scenario: activeScenario(snapshot.project),
      lastCommand: snapshot.lastCommand,
    };
  }

  get canUndo(): boolean {
    return this.projectSession.canUndo;
  }

  get canRedo(): boolean {
    return this.projectSession.canRedo;
  }

  commit(commandName: string, command: ScenarioCommand): boolean {
    return this.projectSession.commit(commandName, project => {
      const current = activeScenario(project);
      const next = command(current);
      if (next === current) return project;
      return {
        ...project,
        scenarios: project.scenarios.map(value => (value.id === current.id ? next : value)),
      };
    });
  }

  undo(): boolean {
    return this.projectSession.undo();
  }

  redo(): boolean {
    return this.projectSession.redo();
  }

  subscribe(subscriber: ScenarioEditorSubscriber): () => void {
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  dispose(): void {
    this.#unsubscribe();
    this.#subscribers.clear();
  }
}
