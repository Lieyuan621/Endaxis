import { afterEach, describe, expect, it, vi } from 'vitest';
import { vfsResource } from '../scripts/gameDataProviders.ts';

afterEach(() => vi.unstubAllGlobals());
const url = 'http://vfs.test/api/endaxis-data';
const reset = () => new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
const response = () => new Response('{}', { headers: { 'X-Endaxis-Source': 'vfs-index-browser' } });

describe('来源传输的有限重试', () => {
  it('连接中断后只重试原 URL，不改变来源', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(reset()).mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetcher);
    expect(await vfsResource(url, 'BuffData/a.json', null)).toMatchObject({
      provider: 'vfs-index-browser',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0]![0])).toBe(String(fetcher.mock.calls[1]![0]));
  });

  it('读取响应体中断也重新请求，不能保存半份字节', async () => {
    const broken = response();
    vi.spyOn(broken, 'arrayBuffer').mockRejectedValueOnce(reset());
    const fetcher = vi.fn().mockResolvedValueOnce(broken).mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetcher);
    const result = await vfsResource(url, 'BuffData/a.json', null);
    expect(new TextDecoder().decode(result.content)).toBe('{}');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('三次失败后保留 URL 与底层原因，明确阻断', async () => {
    const error = reset();
    const fetcher = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', fetcher);
    await expect(vfsResource(url, 'BuffData/a.json', null)).rejects.toMatchObject({
      message: `${url}/BuffData/a.json: transport failed after 3 attempts`,
      cause: error,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it.each([404, 500])('HTTP %i 不属于传输重试', async status => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetcher);
    await expect(vfsResource(url, 'BuffData/a.json', null)).rejects.toThrow(`HTTP ${status}`);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('AKEDB 实际出现的临时 HTTP 570 只重试同一 URL', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 570 }))
      .mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetcher);
    await expect(vfsResource(url, 'BuffData/a.json', null)).resolves.toMatchObject({
      provider: 'vfs-index-browser',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0]![0])).toBe(String(fetcher.mock.calls[1]![0]));
  });

  it('连续三次 HTTP 570 后仍以原始状态明确阻断', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 570 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(vfsResource(url, 'BuffData/a.json', null)).rejects.toThrow('HTTP 570');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('错误身份头和未知异常不能被吞掉', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetcher);
    await expect(vfsResource(url, 'BuffData/a.json', null)).rejects.toThrow('source header');
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockReset().mockRejectedValue(new Error('unexpected'));
    await expect(vfsResource(url, 'BuffData/a.json', null)).rejects.toThrow('unexpected');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
