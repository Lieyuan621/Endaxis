import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './createProject';
import { firstScenarioEnemy } from './level';
import {
  inspectProjectInput,
  parseProjectDocument,
  serializeProjectDocument,
} from './serialization';

function versionOneProject() {
  const project = createEmptyProject({
    createdWith: 'test',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  return {
    ...project,
    schemaVersion: 1,
    scenarios: project.scenarios.map(({ level: _level, ...scenario }, index) => ({
      ...scenario,
      enemy: firstScenarioEnemy(project.scenarios[index]!).enemy,
    })),
  };
}

describe('项目存档顺序升级', () => {
  it.each(['text', 'object'])('版本 1 的 %s 输入自动升级，保存版本 2，输入不被改写', inputKind => {
    const input = versionOneProject();
    input.scenarios[0]!.enemy.editable.hp = 12345;
    const before = structuredClone(input);
    expect(inspectProjectInput(input)).toEqual({ kind: 'upgradeable', schemaVersion: 1 });
    const result = parseProjectDocument(inputKind === 'text' ? JSON.stringify(input) : input);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.value.schemaVersion).toBe(2);
    expect(result.value.scenarios[0]!.level).toEqual({
      kind: 'singleEnemy',
      enemy: { id: 'enemy', name: '', enemy: input.scenarios[0]!.enemy },
    });
    expect(result.value.scenarios[0]).not.toHaveProperty('enemy');
    expect(result.value.createdAt).toBe(input.createdAt);
    expect(input).toEqual(before);
    expect(parseProjectDocument(serializeProjectDocument(result.value))).toEqual(result);
  });

  it.each([0, -1, 1.5, 3])('没有升级路径的版本 %s 明确拒绝', schemaVersion => {
    expect(parseProjectDocument({ ...versionOneProject(), schemaVersion })).toEqual({
      ok: false,
      kind: 'unsupported-version',
      schemaVersion,
    });
  });

  it('损坏的版本 1 不使用默认敌人掩盖错误', () => {
    const input = versionOneProject();
    const result = parseProjectDocument({ ...input, scenarios: [{ id: 'broken' }] });
    expect(result).toMatchObject({ ok: false, kind: 'invalid-document' });
    expect(input.schemaVersion).toBe(1);
  });

  it('当前版本仍须符合关卡结构，不按旧字段兜底', () => {
    const input = versionOneProject();
    expect(parseProjectDocument({ ...input, schemaVersion: 2 })).toMatchObject({
      ok: false,
      kind: 'invalid-document',
    });
  });
});
