import { expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from './createProject';
import { firstScenarioEnemy } from './level';
import { isHitIdentity } from '../derivedObjectIdentity';
import { pruneHitOverrides } from './hitOverrides';
import { parseProjectDocument, serializeProjectDocument } from './serialization';

it('打断失衡值随命中保存，读取时拒绝无效数值', () => {
  const project = createEmptyProject({ createdWith: 'test' });
  const scenario = project.scenarios[0]!;
  const key = JSON.stringify([['battle'], ['hit', 'track', firstScenarioEnemy(scenario).id, 0]]);
  scenario.battle.hitWeaknessBreaks = { [key]: { stagger: 22.5 } };
  const restored = parseProjectDocument(serializeProjectDocument(project));
  expect(restored.ok && restored.value.scenarios[0]?.battle.hitWeaknessBreaks).toEqual({
    [key]: { stagger: 22.5 },
  });
  for (const stagger of [-1, NaN, Infinity, null, '20', undefined]) {
    const invalid = structuredClone(project);
    Object.assign(invalid.scenarios[0]!.battle, { hitWeaknessBreaks: { [key]: { stagger } } });
    expect(parseProjectDocument(invalid)).toMatchObject({ ok: false, kind: 'invalid-document' });
  }
});

it('删除敌人清理命中覆盖，暂时不在场和改变等级不清理', () => {
  const previous = createEmptyScenario('test', 'test');
  const enemy = firstScenarioEnemy(previous);
  const key = JSON.stringify([
    ['action', 'operator', 'cast'],
    ['hit', 'operator', enemy.id, 0],
  ]);
  previous.battle.hitCriticalOverrides = { [key]: false };
  const next = structuredClone(previous);
  firstScenarioEnemy(next).enemy.lifecycle = { spawnFrame: 100, presenceChanges: [] };
  firstScenarioEnemy(next).enemy.source.level += 1;
  expect(pruneHitOverrides(previous, next)).toBe(next);
  firstScenarioEnemy(next).id = 'enemy:replacement';
  expect(pruneHitOverrides(previous, next).battle.hitCriticalOverrides).toBeUndefined();
  expect(previous.battle.hitCriticalOverrides).toEqual({ [key]: false });
});

it('替换敌人来源但保留实例 ID 时保留覆盖', () => {
  const previous = createEmptyScenario('test', 'test');
  const enemy = firstScenarioEnemy(previous);
  const key = JSON.stringify([
    ['action', 'operator', 'cast'],
    ['hit', 'operator', enemy.id, 0],
  ]);
  previous.battle.hitCriticalOverrides = { [key]: true };
  const next = structuredClone(previous);
  firstScenarioEnemy(next).enemy.source = { kind: 'prefab', enemyId: 'different-enemy', level: 90 };
  expect(pruneHitOverrides(previous, next)).toBe(next);
  expect(next.battle.hitCriticalOverrides).toEqual({ [key]: true });
});

it('两类标记同时清理深层宿主引用，但保留同名类型', () => {
  const scenario = createEmptyScenario('test', 'test');
  const enemy = firstScenarioEnemy(scenario);
  const nested = JSON.stringify([
    ['enemy', enemy.id],
    ['abilityEntity', 'soul', 'operator', 0],
  ]);
  const chain = (type: string, owner: string) =>
    JSON.stringify([
      ['action', 'operator', 'cast'],
      ['buff', type, owner, 1],
      ['hit', 'operator', 'other-enemy', 0],
    ]);
  const remove = chain('buff', nested);
  const retain = chain(enemy.id, 'operator');
  scenario.battle.hitCriticalOverrides = { [remove]: true, [retain]: false };
  scenario.battle.hitWeaknessBreaks = { [remove]: true, [retain]: { stagger: 30 } };
  const next = structuredClone(scenario);
  firstScenarioEnemy(next).id = 'replacement';
  const battle = pruneHitOverrides(scenario, next).battle;
  expect(battle.hitWeaknessBreaks).toEqual({ [retain]: { stagger: 30 } });
  expect(battle.hitCriticalOverrides).toEqual({ [retain]: false });
});

it('只接收以正式根开始、以命中结束且次数为非负整数的创建链', () => {
  const root = ['battle'];
  const step = ['hit', 'source', 'target', 0];
  expect(isHitIdentity(JSON.stringify([root, step]))).toBe(true);
  for (const chain of [
    [root],
    [step],
    [root, step, step],
    [root, ['buff', 'test', 'owner', -1], step],
    [root, ['hit', 'source', JSON.stringify([root, step]), 0]],
  ])
    expect(isHitIdentity(JSON.stringify(chain))).toBe(false);
});
