import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadProjectJson } from './projectFileSession';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe('project JSON download', () => {
  it.each([false, true])('attaches an anchor and defers URL cleanup (click fails=%s)', fails => {
    vi.useFakeTimers();
    const append = vi.fn();
    const remove = vi.fn();
    const anchor = {
      href: '',
      download: '',
      hidden: false,
      remove,
      click: vi.fn(() => {
        if (fails) throw new Error('blocked');
      }),
    };
    vi.stubGlobal('document', { body: { append }, createElement: () => anchor });
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    if (fails)
      expect(() => downloadProjectJson('{"test":true}', 'project.json')).toThrow('blocked');
    else downloadProjectJson('{"test":true}', 'project.json');
    expect(create.mock.calls[0]![0]).toBeInstanceOf(Blob);
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor).toMatchObject({ href: 'blob:test', download: 'project.json', hidden: true });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(revoke).toHaveBeenCalledWith('blob:test');
  });
});
