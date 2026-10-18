import { afterEach, expect, it, vi } from 'vitest';
import { mountSetup } from '../../test/componentSetup';
import OverlayView from './OverlayView.vue';
import { loadOverlaySnapshot, type OverlaySnapshot } from './snapshot';
import { emptyOverlayPlan } from './plan';

vi.mock('./snapshot', () => ({ loadOverlaySnapshot: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('读取尚未完成就离开页面时，不发布过期快照或遗留轮询，并恢复页面外观', async () => {
  vi.useFakeTimers();
  const values = new Map<string, string>([['background', 'white']]);
  const element = {
    style: {
      getPropertyValue: (key: string) => values.get(key) ?? '',
      getPropertyPriority: () => '',
      setProperty: (key: string, value: string) => values.set(key, value),
      removeProperty: (key: string) => values.delete(key),
    },
    remove() {},
  };
  const page = {
    title: 'Editor',
    documentElement: element,
    body: element,
    getElementById: () => element,
  };
  const listeners = new Map<string, unknown>();
  vi.stubGlobal('document', page);
  vi.stubGlobal('BroadcastChannel', undefined);
  vi.stubGlobal('window', {
    location: { search: '' },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    addEventListener: (key: string, value: unknown) => listeners.set(key, value),
    removeEventListener: (key: string) => listeners.delete(key),
  });
  let complete!: (snapshot: OverlaySnapshot) => void;
  vi.mocked(loadOverlaySnapshot).mockImplementation(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  const mounted = await mountSetup(OverlayView, {});
  expect(values.get('background')).toBe('transparent');
  mounted.stop();
  complete({
    version: 1,
    id: 'late',
    locale: 'en',
    scenarioName: 'Late',
    plan: emptyOverlayPlan(),
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(mounted.state.scenarioName.value).toBe('');
  expect(vi.getTimerCount()).toBe(0);
  expect(listeners.size).toBe(0);
  expect(values.get('background')).toBe('white');
  expect(page.title).toBe('Editor');
});
