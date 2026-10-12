import {
  ActiveScenarioEditorSession,
  ProjectEditorSession,
} from '../application/editor/projectEditorSession';
import type { ScenarioEditPolicy } from '../application/editor/scenarioEditConstraints';
import { createEmptyProject } from '../core/project/createProject';
import type { ScenarioDocument } from '../core/project/schema';

/** 测试只提供场景输入，撤销、重做和编辑约束均执行正式项目会话。 */
export function createScenarioEditorSession(
  scenario: ScenarioDocument,
  historyLimit = 50,
  editPolicy: ScenarioEditPolicy = {},
): ActiveScenarioEditorSession {
  const project = {
    ...createEmptyProject({ createdWith: 'test' }),
    scenarios: [scenario],
    activeScenarioId: scenario.id,
  };
  return new ActiveScenarioEditorSession(
    new ProjectEditorSession(project, historyLimit, () => editPolicy),
  );
}
