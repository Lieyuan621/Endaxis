import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addEquipmentConfiguredReferences,
  addOperatorImpliedReferences,
  exportReference,
  parseArguments,
} from '../scripts/exportReferencedGameIcons.ts';

const temporaryRoots: string[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    temporaryRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })),
  );
});

async function isolatedArguments(flags: string[] = []) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-icons-'));
  temporaryRoots.push(root);
  return parseArguments(['--output-root', root, '--source-mode', 'vfs-only', ...flags]);
}

const reference = {
  publicPath: '/icons/airborne.webp',
  sourceNames: ['fixture.png'],
  preferredPathSegments: [],
  referencedBy: ['test'],
};

describe('全量图片隔离导出', () => {
  it('武器、装备和套装图标都读取各自配置，未引用资源不进入导出', async () => {
    const { outputRoot } = await isolatedArguments();
    const config = path.join(outputRoot, 'equipmentAssets.json');
    const icon = { sourceName: 'configured.png', preferredPathSegment: '/bufficon/' };
    await fs.writeFile(
      config,
      JSON.stringify({
        weapons: { 'weapon:custom': { '/icons/shared.webp': icon } },
        gears: { 'gear:custom': { '/icons/shared.webp': icon, '/icons/unused.webp': icon } },
        gearSets: { 'set:custom': { '/icons/set.webp': icon } },
      }),
    );
    const refs = new Map<string, Set<string>>([
      ['/icons/shared.webp', new Set(['definition'])],
      ['/icons/set.webp', new Set(['definition'])],
    ]);
    const result = await addEquipmentConfiguredReferences(refs, config);
    expect([...result.keys()]).toEqual(['/icons/shared.webp', '/icons/set.webp']);
    expect(result.get('/icons/shared.webp')?.sourceNames).toEqual(['configured.png']);
    expect(refs.get('/icons/shared.webp')?.size).toBe(3);
    await fs.writeFile(
      config,
      JSON.stringify({
        weapons: {
          first: { '/icons/shared.webp': icon },
          second: {
            '/icons/shared.webp': { ...icon, sourceName: 'different.png' },
          },
        },
        gears: {},
        gearSets: {},
      }),
    );
    await expect(addEquipmentConfiguredReferences(refs, config)).rejects.toThrow(
      'conflicting icon sources',
    );
  });
  it('未知干员也按自己的配置选择头像和附加图标，技能名沿用原生身份', async () => {
    const args = await isolatedArguments();
    const root = args.outputRoot;
    const tables = path.join(root, 'TableCfg-current');
    await fs.mkdir(tables);
    await fs.writeFile(
      path.join(tables, 'CharGrowthTable.json'),
      JSON.stringify({
        chr_9000_sample: {
          talentNodeMap: {
            first: { passiveSkillNodeInfo: { iconId: 'talent_icon', index: 0, level: 1 } },
          },
        },
      }),
    );
    const manifest = path.join(root, 'operators.json');
    await fs.writeFile(
      manifest,
      JSON.stringify({
        operators: [
          {
            slug: 'custom',
            charId: 'chr_9000_sample',
            skillGroups: [{ skillType: 'battleSkill' }],
            assets: {
              portraitCharacterId: 'chr_0001_portrait',
              icons: {
                charge: { sourceName: 'custom_charge', preferredPathSegment: '/bufficon/' },
              },
            },
          },
        ],
      }),
    );
    const references = new Map<string, Set<string>>();
    const overrides = await addOperatorImpliedReferences(references, root, manifest);
    expect(overrides.get('/operators/custom/avatar.webp')?.sourceNames).toEqual([
      'icon_round_chr_0001_portrait.png',
    ]);
    expect(overrides.get('/operators/custom/battle.webp')?.sourceNames).toEqual([
      'icon_skill_sample_01.png',
    ]);
    expect(overrides.get('/operators/custom/charge.webp')?.sourceNames).toEqual([
      'custom_charge.png',
    ]);
    expect(overrides.get('/operators/custom/talent 1.webp')?.sourceNames).toEqual([
      'talent_icon.png',
    ]);
    expect(references.has('/operators/custom/charge.webp')).toBe(true);
  });
  it('图片并发有界且只接受正整数', () => {
    expect(parseArguments([]).workers).toBe(6);
    expect(parseArguments(['--workers', '12']).workers).toBe(12);
    for (const value of ['0', '-1', '1.5', 'NaN', 'Infinity']) {
      expect(() => parseArguments(['--workers', value])).toThrow('positive integer');
    }
    expect(() => parseArguments(['--workers'])).toThrow('requires a value');
  });
  it('默认兼容 public，可显式指定独立输出目录', () => {
    expect(parseArguments([]).outputRoot).toBe(path.resolve('public'));
    expect(parseArguments(['--output-root', 'tmp/icons']).outputRoot).toBe(
      path.resolve('tmp/icons'),
    );
    expect(() => parseArguments(['--output-root'])).toThrow('requires a value');
  });

  it('可重复登记未发布候选的额外引用根', () => {
    expect(
      parseArguments([
        '--additional-reference-root',
        'tmp/candidate-a',
        '--additional-reference-root',
        'tmp/candidate-b',
      ]).additionalReferenceRoots,
    ).toEqual([path.resolve('tmp/candidate-a'), path.resolve('tmp/candidate-b')]);
    expect(() => parseArguments(['--additional-reference-root'])).toThrow('requires a value');
  });

  it('强制重导只覆盖隔离产物，不修改正式图片', async () => {
    const args = await isolatedArguments(['--overwrite']);
    const original = await fs.readFile('public/icons/airborne.webp');
    const destination = path.join(args.outputRoot, 'icons/airborne.webp');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, 'old isolated output');
    const png = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#ff0000' } })
      .png()
      .toBuffer();
    const request = vi.fn(async (url: URL) =>
      url.pathname.includes('/by-name')
        ? Response.json({
            candidates: [{ assetIndex: 1, path: 'assets/fixture.png', rawUrl: '/fixture.png' }],
          })
        : new Response(new Uint8Array(png)),
    );
    vi.stubGlobal('fetch', request);
    await expect(exportReference(reference, args)).resolves.toMatchObject({
      status: 'overwritten',
      sourceSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      outputSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect((await sharp(await fs.readFile(destination)).metadata()).format).toBe('webp');
    expect(await fs.readFile('public/icons/airborne.webp')).toEqual(original);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('项目占位图复制到隔离目录，不调用 VFS；dry-run 不落盘', async () => {
    const args = await isolatedArguments();
    const local = { ...reference, publicPath: '/icons/default_icon.webp', localOnly: true };
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    await expect(exportReference(local, { ...args, dryRun: true })).resolves.toMatchObject({
      status: 'kept-local',
    });
    await expect(
      fs.stat(path.join(args.outputRoot, 'icons/default_icon.webp')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await exportReference(local, args);
    expect(await fs.readFile(path.join(args.outputRoot, 'icons/default_icon.webp'))).toEqual(
      await fs.readFile('public/icons/default_icon.webp'),
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('拒绝越过输出目录的资源路径', async () => {
    await expect(
      exportReference({ ...reference, publicPath: '/../outside.webp' }, await isolatedArguments()),
    ).rejects.toThrow('unsafe game icon output path');
  });
});
