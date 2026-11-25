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
  it('版本 2 的预览合约替换为正式词条，丢弃参数并保留选择身份和启用状态', () => {
    const project = createEmptyProject({
      createdWith: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const ids = [200001, 200002, 200003, 200004];
    const input = {
      ...project,
      schemaVersion: 2,
      scenarios: project.scenarios.map(scenario => ({
        ...scenario,
        mechanics: {
          selections: ids.map((id, index) => ({
            id: `selection-${index}`,
            mechanicId: `contingency-contract:tag:${id}`,
            enabled: index !== 2,
            parameters: { oldCustomValue: 123 },
          })),
        },
      })),
    };
    const before = structuredClone(input);
    const result = parseProjectDocument(input);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.value.schemaVersion).toBe(3);
    expect(result.value.scenarios[0]!.mechanics.selections).toEqual(
      [113502, 110302, 110703, 110901].map((id, index) => ({
        id: `selection-${index}`,
        mechanicId: `contingency-contract:tag:${id}`,
        enabled: index !== 2,
        parameters: {},
      })),
    );
    expect(input).toEqual(before);
  });
  it.each(['text', 'object'])('版本 1 的 %s 输入自动升级，保存版本 3，输入不被改写', inputKind => {
    const input = versionOneProject();
    input.scenarios[0]!.enemy.editable.hp = 12345;
    const before = structuredClone(input);
    expect(inspectProjectInput(input)).toEqual({ kind: 'upgradeable', schemaVersion: 1 });
    const result = parseProjectDocument(inputKind === 'text' ? JSON.stringify(input) : input);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.value.schemaVersion).toBe(3);
    expect(result.value.scenarios[0]!.level).toEqual({
      kind: 'singleEnemy',
      enemy: { id: 'enemy', enemy: input.scenarios[0]!.enemy },
    });
    expect(result.value.scenarios[0]).not.toHaveProperty('enemy');
    expect(result.value.createdAt).toBe(input.createdAt);
    expect(input).toEqual(before);
    expect(parseProjectDocument(serializeProjectDocument(result.value))).toEqual(result);
  });

  it.each([0, -1, 1.5, 4])('没有升级路径的版本 %s 明确拒绝', schemaVersion => {
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
    expect(parseProjectDocument({ ...input, schemaVersion: 3 })).toMatchObject({
      ok: false,
      kind: 'invalid-document',
    });
  });
});
