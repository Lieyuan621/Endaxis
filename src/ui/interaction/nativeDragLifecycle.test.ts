import { afterEach, describe, expect, it, vi } from 'vitest';
import { observeNativeDragLifetime } from './nativeDragLifecycle';
import { createInteractionSession } from './interactionSession';

function fixture() {
  let notify = () => {};
  const disconnect = vi.fn();
  const observe = vi.fn();
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      disconnect = disconnect;
      observe = observe;
    },
  );
  const document = new EventTarget();
  const source = { ownerDocument: document, isConnected: true } as unknown as Element;
  const setConnected = (connected: boolean) => {
    Object.defineProperty(source, 'isConnected', { value: connected, configurable: true });
  };
  const end = (target: unknown = source) => {
    const event = new Event('dragend');
    Object.defineProperty(event, 'target', { value: target });
    document.dispatchEvent(event);
  };
  return { source, document, notify: () => notify(), disconnect, observe, setConnected, end };
}

afterEach(() => vi.unstubAllGlobals());

describe('native drag source lifetime', () => {
  it('only ends for its source and releases listeners and observer once', () => {
    const f = fixture();
    const ended = vi.fn();
    const dispose = observeNativeDragLifetime(f.source, ended);
    f.end({});
    expect(ended).not.toHaveBeenCalled();
    f.end();
    f.end();
    dispose();
    expect(ended).toHaveBeenCalledOnce();
    expect(f.disconnect).toHaveBeenCalledOnce();
  });

  it('ignores unrelated mutations and connected reparenting, cancels a removed source', () => {
    const f = fixture();
    const ended = vi.fn();
    observeNativeDragLifetime(f.source, ended);
    f.notify();
    expect(ended).not.toHaveBeenCalled();
    f.setConnected(false);
    f.notify();
    f.end();
    expect(ended).toHaveBeenCalledOnce();
    expect(f.observe).toHaveBeenCalledWith(f.document, { childList: true, subtree: true });
  });

  it('disposal on commit/cancel makes already queued observer callbacks harmless', () => {
    const f = fixture();
    const session = createInteractionSession();
    const old = session.tryStart('library-drag', vi.fn())!;
    const ended = vi.fn(() => old.release());
    const dispose = observeNativeDragLifetime(f.source, ended);
    dispose();
    old.release();
    const next = session.tryStart('library-drag', vi.fn())!;
    f.setConnected(false);
    f.notify();
    f.end();
    expect(ended).not.toHaveBeenCalled();
    expect(next.isCurrent()).toBe(true);
  });

  it('ends immediately for an already detached source', () => {
    const f = fixture();
    f.setConnected(false);
    const ended = vi.fn();
    observeNativeDragLifetime(f.source, ended)();
    expect(ended).toHaveBeenCalledOnce();
  });

  it('does not interpret native drag pointercancel as drag cancellation', () => {
    const f = fixture();
    const ended = vi.fn();
    const dispose = observeNativeDragLifetime(f.source, ended);
    f.document.dispatchEvent(new Event('pointercancel'));
    expect(ended).not.toHaveBeenCalled();
    dispose();
  });
});
