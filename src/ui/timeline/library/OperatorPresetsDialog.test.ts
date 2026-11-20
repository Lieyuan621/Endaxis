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
    state.scope.value = 'all';
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
    state.beginSave();
    const name = state.name.value;
    localStorage.setItem = () => {
      throw new Error('quota');
    };
    state.save();
    expect(state.presets.value).toEqual([]);
    expect(state.name.value).toBe(name);
    expect(state.saving.value).toBe(true);
  });
  it('重命名草稿提交后修剪并保存，空名或写入失败恢复原名', async () => {
    saveOperatorBuildPresets([{ id: 'a', name: '原名', build: captureOperatorBuild(track()) }]);
    const { state } = await mount();
    state.renameDrafts.value.a = '  新名称  ';
    expect(loadOperatorBuildPresets()[0]!.name).toBe('原名');
    state.commitRename(state.presets.value[0]);
    expect(loadOperatorBuildPresets()[0]!.name).toBe('新名称');
    expect(state.renameDrafts.value.a).toBeUndefined();
    state.renameDrafts.value.a = '  ';
    state.commitRename(state.presets.value[0]);
    expect(state.presets.value[0].name).toBe('新名称');
    expect(state.renameDrafts.value.a).toBeUndefined();
    localStorage.setItem = () => {
      throw new Error('quota');
    };
    state.renameDrafts.value.a = '未保存';
    state.commitRename(state.presets.value[0]);
    expect(state.presets.value[0].name).toBe('新名称');
    expect(state.renameDrafts.value.a).toBeUndefined();
  });
});
