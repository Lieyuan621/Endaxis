import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { commonBuffDefinitions } from '../../../src/data/buffs/commonDefinitions';
import {
  createCommonBuffCollector,
  readPresentationNameKeys,
  renderCommonBuffPresentationNamesSource,
  readSystemBuffRoots,
} from '../scripts/generateCommonBuffDefinitions.ts';

describe('公共 Buff 独立所有权', () => {
  it('正式公共目录包含全部隐式系统根，不再只检查配置清单', () => {
    const roots = readSystemBuffRoots(
      path.resolve('tools/game-data-compiler/config/systemBuffRoots.json'),
    );
    for (const id of roots) expect(commonBuffDefinitions[id], id).toBeDefined();
  });
  it('系统爆发及失衡承伤根独立于干员引用，清单不包含手写动作或倍率', () => {
    expect(
      readSystemBuffRoots(path.resolve('tools/game-data-compiler/config/systemBuffRoots.json')),
    ).toEqual([
      'buff_common_fire_fire_triggered',
      'buff_common_pulse_pulse_triggered',
      'buff_common_cryst_cryst_triggered',
      'buff_common_natural_natural_triggered',
      'buff_common_poise_break_damage_taken_scale',
      'buff_common_dash',
    ]);
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

  it('正式干员生成文件不再导出公共 Buff', () => {
    const root = path.resolve('src/data/operators');
    const offenders = fs
      .readdirSync(root)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .map(file => path.join(root, file))
      .filter(file => fs.existsSync(file))
      .filter(file => fs.readFileSync(file, 'utf8').includes('commonBuffDefinitions'));
    expect(offenders).toEqual([]);
  });

  it('产品稳定入口不反向依赖任何干员定义', () => {
    const source = fs.readFileSync(path.resolve('src/data/buffs/commonDefinitions.ts'), 'utf8');
    expect(source).toContain("from './generated/commonBuffDefinitions.generated'");
    expect(source).not.toContain('operators/');
    expect(source).not.toContain('generated-definitions/');
  });

  it('公共 Buff 名称配置与生成映射保持一致', () => {
    const configPath = path.resolve(
      'tools/game-data-compiler/config/commonBuffPresentationNames.json',
    );
    const names = readPresentationNameKeys(configPath);
    const generatedSource = fs.readFileSync(
      path.resolve('src/data/buffs/generated/commonBuffPresentationNames.generated.ts'),
      'utf8',
    );
    expect(renderCommonBuffPresentationNamesSource(names).replace(/\r\n/g, '\n')).toContain(
      JSON.stringify(names, null, 2),
    );
    for (const [buffId, nameKey] of Object.entries(names)) {
      expect(generatedSource).toContain(`${buffId}: '${nameKey}'`);
    }
  });

  it('展示名称不会注入公共战斗定义', () => {
    const generatedDefinitions = fs.readFileSync(
      path.resolve('src/data/buffs/generated/commonBuffDefinitions.generated.ts'),
      'utf8',
    );
    const names = readPresentationNameKeys(
      path.resolve('tools/game-data-compiler/config/commonBuffPresentationNames.json'),
    );
    for (const nameKey of Object.values(names)) {
      expect(generatedDefinitions).not.toContain(`nameKey: '${nameKey}'`);
    }
  });
});
