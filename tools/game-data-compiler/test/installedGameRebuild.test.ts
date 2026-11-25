import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseInstalledGameArguments } from '../scripts/rebuildFromInstalledGame';

const base = [
  '--game-root',
  './game',
  '--ake-tool-root',
  './ake',
  '--data-tool-root',
  './data-tool',
];
describe('一体化游戏资源生成参数', () => {
  it('默认使用各工具仓库已经准备的环境，而非创建共享环境', () => {
    const config = parseInstalledGameArguments(base);
    expect(config.akePython).toBe(path.resolve('ake/.venv/Scripts/python.exe'));
    expect(config.python).toBe(path.resolve('data-tool/.venv/Scripts/python.exe'));
    expect(config.publish).toBe(false);
    expect(config.workers).toBe(2);
  });
  it('允许明确选择两个独立解释器和工作目录', () => {
    expect(
      parseInstalledGameArguments([
        ...base,
        '--python',
        'data-python',
        '--ake-python',
        'ake-python',
        '--work-root',
        './cache',
        '--publish',
      ]),
    ).toMatchObject({
      python: 'data-python',
      akePython: 'ake-python',
      workRoot: path.resolve('cache'),
      publish: true,
    });
  });
  it.each(
    [
      [],
      [...base, '--workers', '0'],
      [...base, '--workers', '1.2'],
      [...base, '--publish', '--check-inputs'],
      [...base, '--publish', '--publish'],
      [...base, '--install'],
      [...base, '--ake-python'],
    ].map(args => ({ args })),
  )('在导出前拒绝无效参数 $args', ({ args }) => {
    expect(() => parseInstalledGameArguments(args)).toThrow();
  });
});
