import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type {
  CountdownTriggerStatus,
  OverlaySettingsCommand,
  OverlaySettingsState,
} from './desktopApi';
import { mountSetup } from '@/test/componentSetup';
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

it('settings commands preserve HUD ownership of preferences and countdown playback permission', async () => {
  vi.useFakeTimers();
  const element = {
    style: {
      getPropertyValue: () => '',
      getPropertyPriority: () => '',
      setProperty() {},
      removeProperty() {},
    },
  };
  vi.stubGlobal('document', {
    title: '',
    documentElement: element,
    body: element,
    getElementById: () => element,
  });
  vi.stubGlobal('BroadcastChannel', undefined);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem });
  let input!: (event: { type: 'attack'; pressed: boolean; at: number }) => void;
  let settingsCommand!: (command: OverlaySettingsCommand) => void;
  let trigger!: (event: { elapsedSeconds: number }) => void;
  let status!: (value: CountdownTriggerStatus) => void;
  const publishSettings = vi.fn<(value: OverlaySettingsState) => void>();
  const ready: CountdownTriggerStatus = { phase: 'ready', configured: true, armed: false };
  const arm = vi.fn(async () => {
    const armed: CountdownTriggerStatus = { ...ready, phase: 'watching', armed: true };
    status(armed);
    return armed;
  });
  const disarm = vi.fn(async () => ready);
  const offSettings = vi.fn();
  vi.stubGlobal('window', {
    location: { search: '' },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame,
    cancelAnimationFrame,
    addEventListener() {},
    removeEventListener() {},
    endaxisDesktop: {
      isDesktop: true,
      info: async () => ({
        clickThrough: false,
        playbackShortcutsAvailable: true,
        countdownTriggerAvailable: true,
      }),
      inputFeedback: {
        setEnabled: vi.fn(async () => {}),
        onInput: (callback: typeof input) => {
          input = callback;
          return () => {};
        },
        onStatus: () => () => {},
      },
      publishSettings,
      onSettingsCommand: (callback: typeof settingsCommand) => {
        settingsCommand = callback;
        return offSettings;
      },
      onPlaybackCommand: () => () => {},
      countdownTrigger: {
        info: async () => ready,
        arm,
        disarm,
        clear: async () => ready,
        selectRegion: async () => ready,
        onStatus: (callback: typeof status) => {
          status = callback;
          return () => {};
        },
        onTrigger: (callback: typeof trigger) => {
          trigger = callback;
          return () => {};
        },
      },
    },
  });
  vi.mocked(loadOverlaySnapshot).mockResolvedValue({
    version: 1,
    id: 'current',
    locale: 'en',
    scenarioName: 'Current',
    plan: { ...emptyOverlayPlan(), startTime: -3, duration: 10, hasCasts: true },
  });
  const mounted = await mountSetup(OverlayView, {});
  try {
    await nextTick();
    settingsCommand({ type: 'patch', patch: { hudOpacity: 0.8 } });
    await nextTick();
    expect(mounted.state.preferences.value.hudOpacity).toBe(0.8);
    expect(setItem).toHaveBeenCalled();
    settingsCommand({ type: 'requestState' });
    expect(publishSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ scenarioName: 'Current', locale: 'en', canArm: true }),
    );
    trigger({ elapsedSeconds: 0.2 });
    expect(mounted.state.isPlaying.value).toBe(false);
    settingsCommand({ type: 'countdownArm' });
    await nextTick();
    await Promise.resolve();
    expect(arm).toHaveBeenCalledOnce();
    trigger({ elapsedSeconds: 0.2 });
    expect(mounted.state.isPlaying.value).toBe(true);
    expect(mounted.state.now.value).toBeCloseTo(-2.8);
    vi.mocked(loadOverlaySnapshot).mockResolvedValue({
      version: 1,
      id: 'switched',
      locale: 'en',
      scenarioName: 'Switched',
      plan: { ...emptyOverlayPlan(), startTime: -3, duration: 20, hasCasts: true },
    });
    await mounted.state.pollSnapshot();
    expect(mounted.state.scenarioName.value).toBe('Switched');
    expect(mounted.state.plan.value.duration).toBe(20);
    expect(mounted.state.isPlaying.value).toBe(false);

    settingsCommand({
      type: 'patch',
      patch: { playbackMode: 'practice', showBasic: false, showHeavy: false },
    });
    await nextTick();
    mounted.state.plan.value = {
      ...emptyOverlayPlan(),
      casts: [
        { id: 'basic', type: 'basicAttack', start: 0, trackIndex: 0 },
        { id: 'heavy', type: 'basicAttack', heavyAttack: true, start: 1, trackIndex: 0 },
        { id: 'skill', type: 'battleSkill', start: 2, trackIndex: 0 },
      ],
    };
    await nextTick();
    expect(mounted.state.practiceCasts.value.map((cast: { id: string }) => cast.id)).toEqual([
      'skill',
    ]);
    mounted.state.practiceRunning.value = true;
    mounted.state.practiceInput({ type: 'attack', at: 0 });
    expect(mounted.state.practiceIndex.value).toBe(0);
    mounted.state.practiceInput({ type: 'battleSkill', trackIndex: 0, at: 0 });
    expect(mounted.state.practiceIndex.value).toBe(1);
    settingsCommand({ type: 'patch', patch: { showHeavy: true } });
    await nextTick();
    expect(mounted.state.practiceCasts.value.map((cast: { id: string }) => cast.id)).toEqual([
      'heavy',
      'skill',
    ]);
    expect(mounted.state.practiceIndex.value).toBe(0);
    settingsCommand({ type: 'patch', patch: { showBasic: true } });
    await nextTick();
    mounted.state.practiceRunning.value = true;
    await nextTick();
    input({ type: 'attack', pressed: true, at: Date.now() });
    expect(mounted.state.practiceIndex.value).toBe(1);
    vi.setSystemTime(Date.now() + 100);
    mounted.state.tickPractice();
    expect(mounted.state.practiceIndex.value).toBe(1);
    input({ type: 'attack', pressed: false, at: Date.now() });
    vi.setSystemTime(Date.now() + 500);
    mounted.state.tickPractice();
    expect(mounted.state.practiceIndex.value).toBe(1);
    input({ type: 'attack', pressed: true, at: Date.now() });
    expect(mounted.state.practiceIndex.value).toBe(3);
    mounted.state.confirmedInputs.value = new Set();
    mounted.state.practiceIndex.value = 0;
    mounted.state.practiceRunning.value = true;
    await nextTick();
    input({ type: 'attack', pressed: false, at: Date.now() });
    input({ type: 'attack', pressed: true, at: Date.now() });
    expect(mounted.state.practiceIndex.value).toBe(1);
    vi.setSystemTime(Date.now() + 349);
    mounted.state.tickPractice();
    expect(mounted.state.practiceIndex.value).toBe(1);
    vi.setSystemTime(Date.now() + 1);
    mounted.state.tickPractice();
    expect(mounted.state.practiceIndex.value).toBe(2);
    expect(mounted.state.canMatchAttack()).toBe(false);
    vi.setSystemTime(Date.now() + 349);
    expect(mounted.state.canMatchAttack()).toBe(false);
    vi.setSystemTime(Date.now() + 1);
    expect(mounted.state.canMatchAttack()).toBe(true);
    mounted.state.adjustPlayback(-0.25);
    expect(mounted.state.practiceIndex.value).toBe(1);
    expect([...mounted.state.confirmedInputs.value]).toEqual(['basic']);
    mounted.state.adjustPlayback(0.25);
    expect(mounted.state.practiceIndex.value).toBe(2);
    mounted.state.adjustPlayback(0.25);
    expect(mounted.state.practiceIndex.value).toBe(3);
    expect(mounted.state.practiceRunning.value).toBe(false);
    mounted.state.adjustPlayback(0.25);
    expect(mounted.state.practiceIndex.value).toBe(3);
    mounted.state.adjustPlayback(-0.25);
    expect(mounted.state.practiceIndex.value).toBe(2);
    vi.mocked(loadOverlaySnapshot).mockResolvedValue({
      version: 1,
      id: 'edited',
      locale: 'en',
      scenarioName: 'Edited',
      plan: { ...emptyOverlayPlan(), duration: 30 },
    });
    await mounted.state.pollSnapshot();
    expect(mounted.state.scenarioName.value).toBe('Edited');
    expect(mounted.state.practiceRunning.value).toBe(false);
    expect(mounted.state.confirmedInputs.value.size).toBe(0);
  } finally {
    mounted.stop();
  }
  expect(offSettings).toHaveBeenCalledOnce();
  expect(disarm).toHaveBeenCalled();
});
