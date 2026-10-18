import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from '../../core/project/createProject';
import { appendProjectScenarios, selectProjectExportScope } from './projectTransfer';
import { ProjectEditorSession } from './projectEditorSession';

it('导出指定方案并修正活动方案，拒绝空选择或失效选择', () => {
  const project = createEmptyProject({ createdWith: 'source' });
  const second = createEmptyScenario('second', 'Second');
  const third = createEmptyScenario('third', 'Third');
  project.scenarios.push(second, third);
  const result = selectProjectExportScope(project, { scenarioIds: ['third', 'second'] });
  expect(result.scenarios).toEqual([second, third]);
  expect(result.activeScenarioId).toBe('second');
  expect(result.createdAt).toBe(project.createdAt);
  expect(() => selectProjectExportScope(project, { scenarioIds: [] })).toThrow();
  expect(() => selectProjectExportScope(project, { scenarioIds: ['missing'] })).toThrow();
});

describe('追加方案', () => {
  it('隔离身份并保留完整配置和继承边界，公共信息不覆盖，整次导入可撤销', () => {
    const target = createEmptyProject({ createdWith: 'target' });
    const source = createEmptyProject({ createdWith: 'source' });
    source.createdAt = '2020-01-01T00:00:00.000Z';
    const parent = source.scenarios[0]!;
    const child = createEmptyScenario('child', 'Child');
    child.inheritance = { frame: 30, sourceScenarioId: parent.id };
    child.battle.durationFrames = 999;
    source.scenarios.push(child);
    const session = new ProjectEditorSession(target);
    let next = 0;
    session.commit('importScenarios', current =>
      appendProjectScenarios(current, source, [parent.id, child.id], () => `imported:${++next}`),
    );
    const result = session.snapshot.project;
    expect(result.createdAt).toBe(target.createdAt);
    expect(result.createdWith).toBe('target');
    expect(result.definitionLibrary).toBe(target.definitionLibrary);
    expect(result.scenarios[0]).toBe(target.scenarios[0]);
    expect(result.scenarios[2]!.inheritance).toEqual({ frame: 30, sourceScenarioId: 'imported:1' });
    expect(result.scenarios[2]!.battle.durationFrames).toBe(999);
    expect(result.scenarios[2]!.battle).not.toBe(child.battle);
    session.undo();
    expect(session.snapshot.project).toBe(target);
  });
  it('未携带的继承来源不会误指向目标项目里的同 ID 方案', () => {
    const target = createEmptyProject({ createdWith: 'test' });
    const source = createEmptyProject({ createdWith: 'test' });
    const child = createEmptyScenario('child', 'Child');
    child.inheritance = { frame: 30, sourceScenarioId: target.activeScenarioId };
    source.scenarios.push(child);
    let next = 0;
    const result = appendProjectScenarios(target, source, ['child'], () => `new:${++next}`);
    expect(result.scenarios[1]!.inheritance).toEqual({ frame: 30, sourceScenarioId: 'new:2' });
    expect(source.scenarios[1]!.id).toBe('child');
  });
});
