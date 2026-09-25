import { expect, it, vi } from 'vitest';
import { createEmptyProject } from '../core/project/createProject';

vi.mock('vue-router', () => ({
  createRouter: () => ({ beforeEach: vi.fn() }),
  createWebHistory: vi.fn(),
  createWebHashHistory: vi.fn(),
}));
vi.mock('../i18n', () => ({
  ALL_GAME_TEXT_FAMILIES: [],
  ensureLocaleResources: vi.fn(),
  i18n: { global: { locale: { value: 'zh-CN' } } },
}));

import { timelineRouteProps } from './index';

it('编辑器热重建时使用最新提交的项目，而不是进入路由时的旧快照', () => {
  const initial = createEmptyProject({ createdWith: 'test' });
  const updated = {
    ...initial,
    scenarios: initial.scenarios.map(scenario => ({ ...scenario, name: '修改后的方案' })),
  };
  const route = {
    meta: {
      timelineGameDataRepository: {},
      timelineInitialProject: initial,
      timelineBrowserPersistenceEnabled: true,
    },
  };
  const mounted = timelineRouteProps(route);
  mounted.onProjectChange(updated);
  expect(timelineRouteProps(route).initialProject).toBe(updated);
  // 撤销后的快照同样成为重建输入。
  mounted.onProjectChange(initial);
  expect(timelineRouteProps(route).initialProject).toBe(initial);
});
