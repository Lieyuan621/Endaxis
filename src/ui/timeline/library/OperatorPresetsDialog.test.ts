import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElMessage, ElMessageBox } from 'element-plus';
import Dialog from './OperatorPresetsDialog.vue';
import { mountSetup } from '../../../test/componentSetup';
import { createDefaultOperatorInstance } from '../../../application/editor/loadoutBuildFactory';
import { captureOperatorBuild } from '../../../application/editor/operatorBuildPreset';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { perlica, ember } from '../../../data/operators';
import {
  loadOperatorBuildPresets,
  saveOperatorBuildPresets,
} from '../../../data/browserOperatorBuildPresets';

const track = () => ({
  id: 'track',
  operator: createDefaultOperatorInstance(perlica),
  weapon: null,
  gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
  initialState: { ultimateEnergy: 0 },
  skillCasts: [],
});
let stop: (() => void) | undefined;
beforeEach(() => {
  vi.spyOn(ElMessage, 'success').mockImplementation(() => ({ close: vi.fn() }));
  vi.spyOn(ElMessage, 'error').mockImplementation(() => ({ close: vi.fn() }));
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  vi.stubGlobal('window', new EventTarget());
});
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function mount(selected = track()) {
  const mounted = await mountSetup(Dialog, {
    track: selected,
    gameData: gameDataRepository,
    readOnly: false,
    apply: vi.fn(),
  });
  stop = mounted.stop;
  return mounted;
}
describe('预设管理', () => {
  it('当前干员筛选和范围内搜索不会混入其他干员，全部视图仍保留它们', async () => {
    const build = captureOperatorBuild(track());
    saveOperatorBuildPresets([
      { id: 'a', name: 'A', build },
      { id: 'b', name: 'B', build: { ...build, operator: createDefaultOperatorInstance(ember) } },
    ]);
    const { state } = await mount();
    expect(state.filteredPresets.value.map((p: { id: string }) => p.id)).toEqual(['a']);
    state.search.value = 'B';
    expect(state.filteredPresets.value).toEqual([]);
    state.selectedOperator.value = 'all';
    expect(state.filteredPresets.value.map((p: { id: string }) => p.id)).toEqual(['b']);
  });
  it('更新只改目标构筑，保留名称与身份，取消更新不会写入', async () => {
    const original = track();
    saveOperatorBuildPresets([
      { id: 'a', name: '我的配置', build: captureOperatorBuild(original) },
    ]);
    const changed = track();
    changed.operator.level = 80;
    const { state } = await mount(changed);
    const confirm = vi.spyOn(ElMessageBox, 'confirm').mockRejectedValueOnce('cancel');
    await state.updatePreset(state.presets.value[0]);
    expect(loadOperatorBuildPresets()[0]!.build.operator.level).toBe(90);
    confirm.mockImplementationOnce(
      () => Promise.resolve('confirm') as ReturnType<typeof ElMessageBox.confirm>,
    );
    await state.updatePreset(state.presets.value[0]);
    const saved = loadOperatorBuildPresets()[0]!;
    expect(saved).toMatchObject({ id: 'a', name: '我的配置', build: { operator: { level: 80 } } });
    expect(state.matches(saved)).toBe(true);
    changed.operator.level = 70;
    expect(saved.build.operator.level).toBe(80);
  });
  it('存储写入失败不会更新列表或清除保存草稿', async () => {
    const { state } = await mount();
    state.search.value = '保留筛选';
    state.beginSave();
    const name = state.name.value;
    localStorage.setItem = () => {
      throw new Error('quota');
    };
    state.save();
    expect(state.presets.value).toEqual([]);
    expect(state.name.value).toBe(name);
    expect(state.saving.value).toBe(true);
    expect(state.search.value).toBe('保留筛选');
  });
  it('保存成功后清除旧搜索条件，使新预设立即可见', async () => {
    const { state } = await mount();
    state.search.value = '不会匹配新预设的搜索';
    state.beginSave();
    state.name.value = '新配装';
    state.save();
    expect(loadOperatorBuildPresets()).toHaveLength(1);
    expect(state.search.value).toBe('');
    expect(state.filteredPresets.value.map((preset: { name: string }) => preset.name)).toEqual([
      '新配装',
    ]);
  });
  it('重命名需明确保存，空名和写入失败保留原记录与编辑草稿', async () => {
    saveOperatorBuildPresets([{ id: 'a', name: '原名', build: captureOperatorBuild(track()) }]);
    const { state } = await mount();
    state.beginRename(state.presets.value[0]);
    state.renameName.value = '  新名称  ';
    expect(loadOperatorBuildPresets()[0]!.name).toBe('原名');
    state.commitRename();
    expect(loadOperatorBuildPresets()[0]!.name).toBe('新名称');
    expect(state.renaming.value).toBeNull();
    state.beginRename(state.presets.value[0]);
    state.renameName.value = '  ';
    state.commitRename();
    expect(state.presets.value[0].name).toBe('新名称');
    expect(state.renameName.value).toBe('  ');
    expect(state.renaming.value.id).toBe('a');
    localStorage.setItem = () => {
      throw new Error('quota');
    };
    state.renameName.value = '未保存';
    state.commitRename();
    expect(state.presets.value[0].name).toBe('新名称');
    expect(state.renameName.value).toBe('未保存');
    expect(state.renaming.value.id).toBe('a');
  });
});
