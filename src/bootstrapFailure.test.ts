import { afterEach, expect, it, vi } from 'vitest';
import { showBootstrapFailure } from './bootstrapFailure';
import main from './main.ts?raw';

afterEach(() => vi.unstubAllGlobals());

it('waits for initial route resources before mounting and catches startup failures', () => {
  expect(main.indexOf('await router.isReady()')).toBeLessThan(main.indexOf("app.mount('#app')"));
  expect(main).toContain('bootstrap().catch(showBootstrapFailure)');
});

it('renders errors as text and reloads only on explicit request without touching storage', () => {
  const nodes: any[] = [];
  const host = { replaceChildren: vi.fn() };
  vi.stubGlobal('document', {
    getElementById: () => host,
    createElement: (tag: string) => {
      const node = {
        tag,
        style: {},
        textContent: '',
        setAttribute: vi.fn(),
        append: vi.fn(),
        addEventListener: vi.fn(),
      };
      nodes.push(node);
      return node;
    },
  });
  const reload = vi.fn();
  vi.stubGlobal('window', { location: { reload } });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    showBootstrapFailure(new Error('<img onerror=bad>'));
    expect(nodes.find(node => node.tag === 'pre').textContent).toBe('<img onerror=bad>');
    expect(host.replaceChildren).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    nodes.find(node => node.tag === 'button').addEventListener.mock.calls[0][1]();
    expect(reload).toHaveBeenCalledOnce();
  } finally {
    log.mockRestore();
  }
});
