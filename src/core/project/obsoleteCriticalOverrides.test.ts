import { expect, it } from 'vitest';
import { createEmptyProject } from './createProject';
import { parseProjectDocument, serializeProjectDocument } from './serialization';
import type { TrackDocument } from './schema';
it('加载与保存直接丢弃旧覆盖，不迁移或删除新的逐 hit 覆盖和其他输入', () => {
  const project = createEmptyProject({ createdWith: 'test' });
  const scenario = project.scenarios[0]!;
  scenario.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'cast',
        source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'test' },
        placement: { startFrame: 0 },
        simulationInputs: { randomSeed: 123, initialBlackboard: { value: 2 } },
      },
    ],
  } as TrackDocument;
  const key = JSON.stringify([
    ['action', 'track', 'cast'],
    ['hit', 'track', 'enemy', 0],
  ]);
  scenario.battle.hitCriticalOverrides = { [key]: false };
  scenario.battle.hitWeaknessBreaks = { [key]: true };
  const raw = JSON.parse(JSON.stringify(project));
  raw.scenarios[0].battle.reactionCriticalOverrides = { old: true };
  raw.scenarios[0].tracks[0].skillCasts[0].simulationInputs.criticalOverrides = { old: true };
  const parsed = parseProjectDocument(raw);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error('fixture failed validation');
  expect(parsed.value.scenarios[0]!.battle).not.toHaveProperty('reactionCriticalOverrides');
  expect(parsed.value.scenarios[0]!.battle.hitCriticalOverrides).toEqual({ [key]: false });
  expect(parsed.value.scenarios[0]!.tracks[0]!.skillCasts[0]!.simulationInputs).toEqual({
    randomSeed: 123,
    initialBlackboard: { value: 2 },
  });
  expect(parsed.value.scenarios[0]!.battle.hitWeaknessBreaks).toEqual({ [key]: true });
  expect(raw.scenarios[0].battle.reactionCriticalOverrides).toEqual({ old: true });
  const saved = serializeProjectDocument(raw);
  expect(saved).not.toContain('reactionCriticalOverrides');
  expect(saved).not.toContain('"criticalOverrides"');
});
