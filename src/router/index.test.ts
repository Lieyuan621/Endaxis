import { expect, it, vi } from 'vitest';
import { createEmptyProject } from '../core/project/createProject';

vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({ beforeEach: vi.fn() })),
  createWebHistory: vi.fn(),
  createWebHashHistory: vi.fn(),
}));
vi.mock('../i18n', () => ({
  ALL_GAME_TEXT_FAMILIES: [],
  ensureLocaleResources: vi.fn(),
  i18n: { global: { locale: { value: 'zh-CN' } } },
}));

import { createRouter } from 'vue-router';
import { createTimelineRouter, timelineRouteProps } from './index';

it('网页只装配共享编辑器路由，桌面包装复用同一恢复和语言守卫', () => {
  createTimelineRouter();
  const webOptions = vi.mocked(createRouter).mock.calls.at(-1)![0];
  expect(webOptions.routes.map(route => route.path)).toEqual(['/', '/timeline']);

  const desktopComponent = { template: '<div />' };
  createTimelineRouter({ timelineComponent: desktopComponent });
  const desktopOptions = vi.mocked(createRouter).mock.calls.at(-1)![0];
  const webTimeline = webOptions.routes.find(route => route.path === '/timeline')!;
  const desktopTimeline = desktopOptions.routes.find(route => route.path === '/timeline')!;
  expect(desktopTimeline.component).toBe(desktopComponent);
  expect(desktopTimeline.beforeEnter).toBe(webTimeline.beforeEnter);
  expect(desktopTimeline.props).toBe(webTimeline.props);
  expect(desktopTimeline.meta).toEqual(webTimeline.meta);
});

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
