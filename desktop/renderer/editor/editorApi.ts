export type PortableUpdateState =
  | { phase: 'idle' | 'checking' }
  | { phase: 'preparing'; version: string; completed: number; total: number; received: number }
  | { phase: 'ready'; version: string }
  | { phase: 'failed'; message: string };

declare global {
  interface Window {
    endaxisDesktopEditor?: {
      showOverlay(): Promise<void>;
      updateState(): Promise<PortableUpdateState | null>;
      restartUpdate(): Promise<void>;
      retryUpdate(): Promise<void>;
      onUpdateProgress(callback: (state: PortableUpdateState) => void): () => void;
    };
  }
}
