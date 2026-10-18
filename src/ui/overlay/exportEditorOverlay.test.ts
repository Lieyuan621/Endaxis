import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyProject } from '../../core/project/createProject';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import { createScenarioSimulationService } from '../../application/simulation/createScenarioSimulationService';
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
  const popup = { location: { href: 'about:blank' } };
  const open = vi.fn(() => popup);
  vi.stubGlobal('window', { open });
  const options = {
    href: '/#/overlay',
    repository,
    read: () => state,
    ensureCurrentSimulation: vi.fn(async () => true),
    message: (key: string) => key,
    onError: vi.fn(),
  };
  return { state, options, open, popup };
}

it('在点击时打开窗口，等原模拟就绪后才导出快照，不能启动第二次模拟', async () => {
  const { options, open, popup } = await fixture();
  let complete!: (value: boolean) => void;
  options.ensureCurrentSimulation.mockImplementation(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  const exporting = exportEditorOverlay(options);
  expect(open).toHaveBeenCalledWith('', 'endaxis-overlay', expect.any(String));
  expect(popup.location.href).toBe('/#/overlay');
  expect(saveOverlaySnapshot).not.toHaveBeenCalled();
  complete(true);
  await exporting;
  expect(saveOverlaySnapshot).toHaveBeenCalledOnce();
  expect(options.onError).not.toHaveBeenCalled();
  popup.location.href = 'http://example.test/#/overlay';
  await exportEditorOverlay({ ...options, ensureCurrentSimulation: async () => true });
  expect(popup.location.href).toBe('http://example.test/#/overlay');
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

it('桌面编辑器复用已有 HUD，浏览器拦截弹窗也保留可手动打开的导出', async () => {
  const { options, open } = await fixture();
  const showOverlay = vi.fn(async () => {});
  vi.stubGlobal('window', { open, endaxisDesktopEditor: { showOverlay } });
  await exportEditorOverlay(options);
  expect(showOverlay).toHaveBeenCalledOnce();
  expect(open).not.toHaveBeenCalled();
  vi.stubGlobal('window', { open: () => null });
  await exportEditorOverlay(options);
  expect(options.onError).toHaveBeenLastCalledWith('popupBlocked');
  expect(saveOverlaySnapshot).toHaveBeenCalledTimes(2);
});
