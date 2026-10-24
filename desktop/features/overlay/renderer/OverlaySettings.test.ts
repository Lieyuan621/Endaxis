import { afterEach, expect, it, vi } from 'vitest';
import { mountSetup } from '@/test/componentSetup';
import OverlaySettings from './OverlaySettings.vue';
import { DEFAULT_OVERLAY_PREFERENCES } from './preferences';
import type { OverlaySettingsState } from './desktopApi';

function state(): OverlaySettingsState {
  return {
    preferences: { ...DEFAULT_OVERLAY_PREFERENCES },
    locale: 'en',
    scenarioName: 'Current',
    loading: false,
    isPlaying: false,
    canArm: true,
    autoTriggerStatus: null,
    autoTriggerAvailable: true,
    playbackShortcutsAvailable: true,
    commandPending: false,
    commandError: '',
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('settings sends edits to the HUD without writing local preferences, and ignores a stale initial response', async () => {
  let onState!: (next: OverlaySettingsState | null) => void;
  let resolveInitial!: (next: OverlaySettingsState) => void;
  const command = vi.fn(async () => {});
  const offState = vi.fn();
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { setItem });
  vi.stubGlobal('document', { title: '', documentElement: { lang: '' } });
  vi.stubGlobal('window', {
    addEventListener() {},
    removeEventListener() {},
    endaxisOverlaySettings: {
      getState: () =>
        new Promise(resolve => {
          resolveInitial = resolve;
        }),
      onState: (callback: typeof onState) => {
        onState = callback;
        return offState;
      },
      command,
      close: vi.fn(async () => {}),
    },
  });
  const mounted = await mountSetup(OverlaySettings, {});
  try {
    const current = state();
    onState(current);
    expect(document.title).toBe('Overlay settings');
    mounted.state.patch({ hudOpacity: 0.8 });
    await Promise.resolve();
    expect(command).toHaveBeenCalledWith({ type: 'patch', patch: { hudOpacity: 0.8 } });
    expect(mounted.state.preferences.value.hudOpacity).toBe(DEFAULT_OVERLAY_PREFERENCES.hudOpacity);
    expect(setItem).not.toHaveBeenCalled();
    onState(null);
    expect(mounted.state.state.value).toBeNull();
    resolveInitial({ ...state(), scenarioName: 'Stale' });
    await Promise.resolve();
    expect(mounted.state.state.value).toBeNull();
    onState({
      ...current,
      locale: 'zh-CN',
      preferences: { ...current.preferences, hudOpacity: 0.8 },
    });
    expect(document.title).toBe('提示条设置');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(mounted.state.preferences.value.hudOpacity).toBe(0.8);
    expect(mounted.state.state.value.scenarioName).toBe('Current');
  } finally {
    mounted.stop();
  }
  expect(offState).toHaveBeenCalledOnce();
});
