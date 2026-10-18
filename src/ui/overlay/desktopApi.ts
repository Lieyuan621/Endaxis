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

/** 只由 HUD 的 preload 提供；浏览器编辑器没有原生权限。 */
export interface OverlayDesktopApi {
  readonly isDesktop: true;
  readonly countdownTrigger?: CountdownTriggerApi;
  info(): Promise<{
    clickThrough: boolean;
    clickThroughAvailable: boolean;
    playbackShortcutsAvailable: boolean;
    countdownTriggerAvailable?: boolean;
    url: string;
    alwaysOnTop: boolean;
  }>;
  toggleClickThrough(): Promise<boolean>;
  resize(size: { width: number; height: number }): Promise<unknown>;
  openEditor(): Promise<void>;
  quit(): Promise<void>;
  onClickThrough(callback: (value: boolean) => void): () => void;
  onPlaybackCommand(
    callback: (command: 'toggle' | 'restart' | 'backward' | 'forward') => void,
  ): () => void;
}

declare global {
  interface Window {
    endaxisDesktop?: OverlayDesktopApi;
    endaxisDesktopEditor?: { showOverlay(): Promise<void> };
  }
}
