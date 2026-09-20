import { ref, shallowRef } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { ScenarioEditorSession } from '../../../application/editor/scenarioEditorSession';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument, TrackIndex } from '../../../core/project/schema';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { perlica } from '../../../data/operators/index';
import {
  projectOperatorProgressionChange,
  projectWeaponPotentialChange,
} from './loadoutBuildProgression';
import { useTimelineLoadoutEditor } from './useTimelineLoadoutEditor';

function createEditor() {
  const initial = createEmptyScenario('scenario:loadout', '配装场景');
  const session = new ScenarioEditorSession(initial);
  const scenario = shallowRef<ScenarioDocument>(initial);
  session.subscribe(snapshot => {
    scenario.value = snapshot.scenario;
  });
  const selectedTrack = ref<TrackIndex>(0);
  const clearTimelineSelection = vi.fn();
  return {
    scenario,
    session,
    selectedTrack,
    clearTimelineSelection,
    editor: useTimelineLoadoutEditor({
      scenario,
      session,
      selectedTrack,
      clearTimelineSelection,
      gameData: gameDataRepository,
      ids: { allocate: kind => `${kind}:1` },
    }),
  };
}

describe('useTimelineLoadoutEditor', () => {
  it('空轨道切换只改变选中轨道并清除技能选择，不打开面板或写入历史', () => {
    const { editor, clearTimelineSelection, selectedTrack, session } = createEditor();

    editor.selectTrack(2);

    expect(selectedTrack.value).toBe(2);
    expect(editor.operatorDialogTrack.value).toBeNull();
    expect(clearTimelineSelection).toHaveBeenCalledOnce();
    expect(session.snapshot.revision).toBe(0);
  });

  it('已配置轨道的选择也清除技能选择，选择器只由显式入口打开', () => {
    const { editor, clearTimelineSelection, session } = createEditor();
    editor.openOperatorDialog(0);
    editor.selectOperator(perlica.slug);
    clearTimelineSelection.mockClear();
    editor.selectTrack(0);
    expect(clearTimelineSelection).toHaveBeenCalledOnce();
    expect(editor.operatorDialogTrack.value).toBeNull();
    expect(session.snapshot.revision).toBe(1);
    editor.openOperatorDialog(0);
    expect(editor.operatorDialogTrack.value).toBe(0);
  });

  it('选择干员只提交一次完整实例修改', () => {
    const { editor, scenario, session } = createEditor();
    editor.openOperatorDialog(0);

    editor.selectOperator(perlica.slug);

    expect(session.snapshot.revision).toBe(1);
    expect(session.snapshot.lastCommand).toBe('setTrackOperator');
    expect(scenario.value.tracks[0]?.id).toBe('track:1');
    expect(scenario.value.tracks[0]?.operator?.operatorSlug).toBe(perlica.slug);
    expect(editor.operatorDialogTrack.value).toBeNull();
  });

  it('没有干员的轨道不能打开武器或装备选择', () => {
    const { editor } = createEditor();

    editor.openWeaponDialog(0);
    editor.openGearDialog(0, 'armor');

    expect(editor.weaponDialogTrack.value).toBeNull();
    expect(editor.gearDialogTarget.value).toBeNull();
  });

  it('单件装备逐词条精锻只提交一次场景历史', () => {
    const { editor, scenario, session } = createEditor();
    editor.openOperatorDialog(0);
    editor.selectOperator(perlica.slug);
    const gear = gameDataRepository.getGears().find(definition => definition.slotType === 'armor');
    expect(gear).toBeDefined();
    editor.openGearDialog(0, 'armor');
    editor.selectGear(gear!.slug, 0);
    const levels = gear!.traits.map((trait, index) =>
      Math.min(index + 1, Math.max(0, trait.levelCount - 1)),
    );

    editor.updateGearBuild('armor', levels);

    expect(session.snapshot.lastCommand).toBe('updateTrackGearInstance');
    expect(session.snapshot.revision).toBe(3);
    expect(scenario.value.tracks[0]?.gears.armor?.artificingLevels).toEqual(levels);
  });

  it('干员等级联动作为一次实例修改进入历史', () => {
    const { editor, scenario, session } = createEditor();
    editor.openOperatorDialog(0);
    editor.selectOperator(perlica.slug);
    const operator = editor.selectedLoadoutModel.value!.operator!;

    editor.updateOperatorBuild(projectOperatorProgressionChange(operator, 1, true));

    expect(session.snapshot.lastCommand).toBe('updateTrackOperatorInstance');
    expect(session.snapshot.revision).toBe(2);
    expect(scenario.value.tracks[0]?.operator).toMatchObject({
      level: 1,
      promoted: false,
      trustLevel: 0,
    });
  });

  it('武器潜能联动作为一次实例修改进入历史', () => {
    const { editor, scenario, session } = createEditor();
    editor.openOperatorDialog(0);
    editor.selectOperator(perlica.slug);
    editor.openWeaponDialog(0);
    const weaponDefinition = editor.selectableWeapons.value[0];
    expect(weaponDefinition).toBeDefined();
    editor.selectWeapon(weaponDefinition!.slug);
    const weapon = editor.selectedLoadoutModel.value!.weapon!;

    editor.updateWeaponBuild(projectWeaponPotentialChange(weapon, 2));

    expect(session.snapshot.lastCommand).toBe('updateTrackWeaponInstance');
    expect(session.snapshot.revision).toBe(3);
    expect(scenario.value.tracks[0]?.weapon?.potential).toBe(2);
  });

  it('属性详情使用当前构筑解析出的面板', () => {
    const { editor, clearTimelineSelection } = createEditor();
    editor.openOperatorDialog(0);
    editor.selectOperator(perlica.slug);

    expect(editor.panelResolution.value.error).toBeNull();
    expect(editor.panelResolution.value.panels.get(0)?.attack).toBe(706);

    editor.openPanelDialog(0);

    expect(editor.panelDialogTrack.value).toBe(0);
    expect(editor.selectedPanel.value).toBe(editor.panelResolution.value.panels.get(0));
    expect(clearTimelineSelection).toHaveBeenCalledTimes(2);
  });
});
