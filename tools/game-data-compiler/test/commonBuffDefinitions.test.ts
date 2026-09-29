import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { commonBuffDefinitions } from '../../../src/data/buffs/commonDefinitions';
import {
  createCommonBuffCollector,
  readSystemBuffRoots,
} from '../scripts/generateCommonBuffDefinitions.ts';

describe('公共 Buff 独立所有权', () => {
  it('正式公共目录包含全部隐式系统根，不再只检查配置清单', () => {
    const roots = readSystemBuffRoots(
      path.resolve('tools/game-data-compiler/config/systemBuffRoots.json'),
    );
    for (const id of roots) expect(commonBuffDefinitions[id], id).toBeDefined();
  });
  it('相同 ID 的相同定义只保留一份，冲突定义严格失败', () => {
    const first = { stackingType: 'stack', priority: 0 };
    const collector = createCommonBuffCollector<typeof first>();
    collector.add('a', { common: first });
    collector.add('b', { common: { ...first } });
    expect(collector.definitions).toEqual({ common: first });
    expect(() => collector.add('c', { common: { ...first, priority: 1 } })).toThrow(
      "common Buff 'common' differs between 'a' and 'c'",
    );
  });

  it.each([
    [['buff_common_test', 'buff_common_test'], 'duplicate system Buff roots'],
    [['buff_chr_0011_test'], 'invalid system Buff root'],
    [['buff_common_test/../../other'], 'invalid system Buff root'],
    [[{ id: 'buff_common_test', damage: 100 }], 'unexpected fields'],
  ])('系统根拒绝重复、非公共身份和内嵌行为：%j', (roots, message) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis-system-roots-'));
    try {
      const file = path.join(directory, 'roots.json');
      fs.writeFileSync(file, JSON.stringify(roots));
      expect(() => readSystemBuffRoots(file)).toThrow(message);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
