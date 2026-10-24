import type { SupportedLocale } from '@/i18n/elementPlusLocale';
import type { OverlayPreferences } from './preferences';

export interface CountdownTriggerStatus {
  phase:
    | 'unconfigured'
    | 'ready'
    | 'checking'
    | 'waiting-clear'
    | 'watching'
    | 'confirming'
    | 'triggered'
    | 'error';
  configured: boolean;
  armed: boolean;
  displayLabel?: string;
  previewUrl?: string;
  score?: number;
  error?: string;
}

export interface CountdownTriggerApi {
  info(): Promise<CountdownTriggerStatus>;
  selectRegion(): Promise<CountdownTriggerStatus | null>;
  arm(): Promise<CountdownTriggerStatus>;
  disarm(): Promise<CountdownTriggerStatus>;
  clear(): Promise<CountdownTriggerStatus>;
  onStatus(callback: (status: CountdownTriggerStatus) => void): () => void;
  onTrigger(callback: (event: { elapsedSeconds: number }) => void): () => void;
}

export type OverlaySettingsCommand =
  | { type: 'requestState' }
  | { type: 'patch'; patch: Partial<OverlayPreferences> }
  | {
      type:
        | 'resetPreferences'
        | 'reload'
        | 'countdownSelect'
        | 'countdownArm'
        | 'countdownClear'
        | 'countdownStop';
    };

export interface OverlaySettingsState {
  preferences: OverlayPreferences;
  locale: SupportedLocale;
  scenarioName: string;
  loading: boolean;
  isPlaying: boolean;
  canArm: boolean;
  autoTriggerStatus: CountdownTriggerStatus | null;
  autoTriggerAvailable: boolean;
  playbackShortcutsAvailable: boolean;
  inputFeedbackStatus?: string;
  practiceMode?: boolean;
  canPlay?: boolean;
  commandPending: boolean;
  commandError: string;
}

export interface OverlaySettingsApi {
  getState(): Promise<OverlaySettingsState | null>;
  command(command: Exclude<OverlaySettingsCommand, { type: 'requestState' }>): Promise<unknown>;
  onState(callback: (state: OverlaySettingsState | null) => void): () => void;
  close(): Promise<void>;
}

/** 只由 HUD 的 preload 提供。 */
export interface OverlayDesktopApi {
  readonly isDesktop: true;
  readonly inputFeedback?: {
    setEnabled(enabled: boolean): Promise<boolean>;
    onInput(
      callback: (event: {
        type: 'battleSkill' | 'ultimate' | 'comboSkill' | 'switch' | 'attack';
        trackIndex?: number;
        at: number;
        startedAt?: number;
        pressed?: boolean;
      }) => void,
    ): () => void;
    onStatus(callback: (status: string) => void): () => void;
  };
  readonly countdownTrigger?: CountdownTriggerApi;
  info(): Promise<{
    clickThrough: boolean;
    playbackShortcutsAvailable: boolean;
    countdownTriggerAvailable?: boolean;
    url: string;
    alwaysOnTop: boolean;
  }>;
  toggleClickThrough(): Promise<boolean>;
  openEditor(): Promise<void>;
  openSettings(): Promise<void>;
  onSettingsCommand(callback: (command: OverlaySettingsCommand) => void): () => void;
  publishSettings(state: OverlaySettingsState): Promise<unknown> | void;
  quit(): Promise<void>;
  closeOverlay(): Promise<void>;
  onClickThrough(callback: (value: boolean) => void): () => void;
  onPlaybackCommand(
    callback: (command: 'toggle' | 'restart' | 'backward' | 'forward') => void,
  ): () => void;
}

declare global {
  interface Window {
    endaxisDesktop?: OverlayDesktopApi;
    endaxisOverlaySettings?: OverlaySettingsApi;
    endaxisDesktopEditor?: { showOverlay(): Promise<void> };
  }
}

declare global {
  interface Window {
    endaxisOverlayToolbar: {
      getState(): Promise<(OverlaySettingsState & { clickThrough: boolean }) | null>;
      command(
        command: 'toggle' | 'backward' | 'forward' | 'restart' | 'settings' | 'lock' | 'close',
      ): Promise<unknown>;
      onState(
        callback: (state: (OverlaySettingsState & { clickThrough: boolean }) | null) => void,
      ): () => void;
    };
  }
}
