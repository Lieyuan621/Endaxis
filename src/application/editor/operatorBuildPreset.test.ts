import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { createDefaultOperatorInstance } from './loadoutBuildFactory';
import { zhuangFangyi } from '../../data/operators/zhuang-fangyi.generated';
import { gameDataRepository } from '../../data/gameDataRepository';
import { createScenarioEditorSession } from '../../test/scenarioEditorSession';
import { applyOperatorBuildPreset, captureOperatorBuild } from './operatorBuildPreset';

function source() {
  const scenario = createEmptyScenario('preset-test', 'Preset test');
  scenario.tracks[0] = {
    id: 'track',
    operator: { ...createDefaultOperatorInstance(zhuangFangyi), potential: 0 },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 240 },
    skillCasts: [],
  };
  return scenario;
}

describe('干员预设应用', () => {
  it('整套应用收紧充能且只产生一次可撤销编辑，预设与方案不共享可变输入', () => {
    const initial = source();
    const build = captureOperatorBuild(initial.tracks[0]!);
    build.operator.potential = 4;
    const preset = { id: 'one', name: 'One', build };
    const session = createScenarioEditorSession(initial);
    session.commit('preset', current =>
      applyOperatorBuildPreset(current, 0, preset, gameDataRepository),
    );
    const applied = session.snapshot.scenario.tracks[0]!;
    expect(applied.operator?.potential).toBe(4);
    expect(applied.initialState.ultimateEnergy).toBe(204);
    expect(applied.skillCasts).toEqual(initial.tracks[0]!.skillCasts);
    expect(applied.operator?.skillLevels).not.toBe(preset.build.operator.skillLevels);
    expect(applied.gears).not.toBe(preset.build.gears);
    session.undo();
    expect(session.snapshot.scenario).toEqual(initial);
    expect(preset.build.operator.potential).toBe(4);
  });

  it('缺失装备不能部分应用构筑', () => {
    const initial = source();
    const build = captureOperatorBuild(initial.tracks[0]!);
    build.operator.potential = 4;
    build.gears.armor = { gearSlug: 'missing-gear', artificingLevels: [] };
    const session = createScenarioEditorSession(initial);
    expect(() =>
      session.commit('preset', current =>
        applyOperatorBuildPreset(current, 0, { id: 'bad', name: 'Bad', build }, gameDataRepository),
      ),
    ).toThrow('missing-gear');
    expect(session.snapshot.scenario).toEqual(initial);
    expect(session.snapshot.revision).toBe(0);
  });
});
