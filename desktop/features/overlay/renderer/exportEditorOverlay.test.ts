import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyProject } from '@/core/project/createProject';
import { createGameDataRepository } from '@/data/createGameDataRepository';
import { createScenarioSimulationService } from '@/application/simulation/createScenarioSimulationService';
import { emptyOverlayPlan } from './plan';
import { exportEditorOverlay } from './exportEditorOverlay';
import { saveOverlaySnapshot } from './snapshot';

vi.mock('./snapshot', () => ({ saveOverlaySnapshot: vi.fn() }));
vi.mock('./projectPlan', () => ({
  buildOverlayPlanFromProject: () => ({ plan: emptyOverlayPlan(), scenarioName: 'Export' }),
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function fixture() {
  const project = createEmptyProject({ createdWith: 'test' });
  const scenario = project.scenarios[0]!;
  const repository = createGameDataRepository({
    revision: 'export',
    operators: [],
    commonDefinitionSources: [],
  });
  const run = await createScenarioSimulationService(repository).simulate(scenario, 1);
  const state = { project, published: { scenario, run }, revision: 1, locale: 'zh-CN' as const };
  const showOverlay = vi.fn(async () => {});
  vi.stubGlobal('window', { endaxisDesktopEditor: { showOverlay } });
  const options = {
    repository,
    read: () => state,
    ensureCurrentSimulation: vi.fn(async () => true),
    message: (key: string) => key,
    onError: vi.fn(),
  };
  return { state, options, showOverlay };
}

it('等待既有模拟完成并发布快照后，才创建或显示桌面 HUD', async () => {
  const { options, showOverlay } = await fixture();
  let complete!: (value: boolean) => void;
  options.ensureCurrentSimulation.mockImplementation(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  const exporting = exportEditorOverlay(options);
  expect(showOverlay).not.toHaveBeenCalled();
  expect(saveOverlaySnapshot).not.toHaveBeenCalled();
  complete(true);
  await exporting;
  expect(saveOverlaySnapshot).toHaveBeenCalledOnce();
  expect(showOverlay).toHaveBeenCalledOnce();
  expect(vi.mocked(saveOverlaySnapshot).mock.invocationCallOrder[0]).toBeLessThan(
    showOverlay.mock.invocationCallOrder[0]!,
  );
  expect(options.onError).not.toHaveBeenCalled();
});

it('等待期间项目变更或模拟失败时保留旧快照，不导出混合版本', async () => {
  const { state, options } = await fixture();
  options.ensureCurrentSimulation.mockImplementation(async () => {
    state.revision++;
    return true;
  });
  await exportEditorOverlay(options);
  expect(options.onError).toHaveBeenLastCalledWith('exportChanged');
  options.ensureCurrentSimulation.mockResolvedValue(false);
  await exportEditorOverlay(options);
  expect(options.onError).toHaveBeenLastCalledWith('exportFailed');
  expect(saveOverlaySnapshot).not.toHaveBeenCalled();
});

it('缺少桌面编辑器 bridge 时不运行模拟或导出快照', async () => {
  const { options } = await fixture();
  vi.stubGlobal('window', {});
  await exportEditorOverlay(options);
  expect(options.onError).toHaveBeenCalledWith('exportFailed');
  expect(options.ensureCurrentSimulation).not.toHaveBeenCalled();
  expect(saveOverlaySnapshot).not.toHaveBeenCalled();
});
it('后台更新快照不会重新打开已关闭的提示条', async () => {
  const { options, showOverlay } = await fixture();
  await exportEditorOverlay({ ...options, showWindow: false });
  expect(saveOverlaySnapshot).toHaveBeenCalledOnce();
  expect(showOverlay).not.toHaveBeenCalled();
});
