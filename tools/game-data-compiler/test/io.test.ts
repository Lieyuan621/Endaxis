import { rename } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renameWithRetry } from '../src/io.ts';

vi.mock('node:fs/promises', () => ({ rename: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('公共原子发布 IO', () => {
  it.each(['EPERM', 'EBUSY'])('遇到 %s 只重试相同源和目标', async code => {
    vi.mocked(rename).mockRejectedValueOnce({ code }).mockResolvedValueOnce(undefined);
    await renameWithRetry('source', 'target');
    expect(vi.mocked(rename).mock.calls).toEqual([
      ['source', 'target'],
      ['source', 'target'],
    ]);
  });

  it('持续占用重试耗尽后报错，不另建目录或吞错', async () => {
    vi.useFakeTimers();
    const error = { code: 'EPERM' };
    vi.mocked(rename).mockRejectedValue(error);
    const result = renameWithRetry('source', 'target');
    const expectation = expect(result).rejects.toBe(error);
    await vi.runAllTimersAsync();
    await expectation;
    expect(rename).toHaveBeenCalledTimes(121);
  });

  it('目标冲突等非占用错误立即报错', async () => {
    const error = { code: 'EEXIST' };
    vi.mocked(rename).mockRejectedValue(error);
    await expect(renameWithRetry('source', 'target')).rejects.toBe(error);
    expect(rename).toHaveBeenCalledTimes(1);
  });
});
