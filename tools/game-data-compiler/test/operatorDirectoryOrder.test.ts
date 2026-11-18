import { describe, expect, it } from 'vitest';
import manifest from '../config/operators.json' with { type: 'json' };
import { operatorDefinitions } from '../../../src/data/operators';

describe('正式干员目录顺序', () => {
  it('与实际运行角色编号一致，新增干员也必须插入对应位置', () => {
    const entries = manifest.operators.map(row => {
      const nativeId = row.runtimeTemplate?.sourceCharacterId ?? row.charId;
      const match = /^chr_(\d+)_/.exec(nativeId);
      if (!match) throw new Error(`无效干员编号：${row.slug} / ${nativeId}`);
      return { slug: row.slug, number: Number(match[1]) };
    });
    expect(new Set(entries.map(entry => entry.number)).size).toBe(entries.length);

    const expectedSlugs = [...entries]
      .sort((left, right) => left.number - right.number)
      .map(entry => entry.slug);
    expect(operatorDefinitions.map(operator => operator.slug)).toEqual(expectedSlugs);
  });
});
