import { describe, expect, it } from 'vitest';
import {
  inspectTagDumpArtifact,
  inspectTagSetDiscovery,
} from '../scripts/exportGameplayTagConfigSet.ts';

const root = 'assets/beyond/dynamicassets/gamedata/gameplayconfig';
const set = {
  manifestId: 7,
  candidates: [{ path: `${root}/gameplaytagconfigset.asset`, bundleName: 'main/a.ab' }],
};
const directory = {
  manifestId: 7,
  assets: [{ path: `${root}/gameplaytagconfig/new.asset`, bundleName: 'main/b.ab' }],
};
const dump = {
  artifactCount: 1,
  artifacts: [
    {
      container: 'exact.asset',
      complete: true,
      consumedByteCount: 32,
      serializedByteCount: 32,
      byteCount: 42,
      relativePath: 'objects/a.txt',
      sha256: 'a'.repeat(64),
      sourceFile: 'CAB-a',
      pathId: '9007199254740993',
    },
  ],
};

describe('当前 VFS GameplayTagConfigSet 导出边界', () => {
  it('动态接受当前成员，不引用旧名单/资产索引，Int64 身份不转 number', () => {
    expect(inspectTagSetDiscovery(set, directory)).toHaveLength(2);
    expect(inspectTagDumpArtifact(dump, 'exact.asset').pathId).toBe('9007199254740993');
  });
  it('拒绝同名非精确路径及跨 manifest 混用', () => {
    expect(() =>
      inspectTagSetDiscovery(
        { ...set, candidates: [{ path: 'other/gameplaytagconfigset.asset' }] },
        directory,
      ),
    ).toThrow('exact');
    expect(() => inspectTagSetDiscovery(set, { ...directory, manifestId: 8 })).toThrow(
      'identities',
    );
  });
  it('拒绝空目录、重复身份和目录外混入', () => {
    expect(() => inspectTagSetDiscovery(set, { ...directory, assets: [] })).toThrow('empty');
    expect(() =>
      inspectTagSetDiscovery(set, {
        ...directory,
        assets: [...directory.assets, ...directory.assets],
      }),
    ).toThrow('duplicate');
    expect(() =>
      inspectTagSetDiscovery(set, {
        ...directory,
        assets: [{ ...directory.assets[0], path: 'outside.asset' }],
      }),
    ).toThrow('unexpected');
  });
  it('拒绝不完整读取、计数不符和错误容器，不因 worker 宣称 complete 就忽略字节数', () => {
    for (const patch of [
      { complete: false },
      { consumedByteCount: 31 },
      { container: 'wrong.asset' },
      { serializedByteCount: 0 },
    ]) {
      expect(() =>
        inspectTagDumpArtifact(
          { ...dump, artifacts: [{ ...dump.artifacts[0], ...patch }] },
          'exact.asset',
        ),
      ).toThrow('incomplete');
    }
    expect(() => inspectTagDumpArtifact({ ...dump, artifactCount: 2 }, 'exact.asset')).toThrow(
      'one exact',
    );
  });
});
