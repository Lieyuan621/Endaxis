import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import { avywenna } from '../../../src/data/operators/avywenna.generated.ts';

const { planOperatorDefinition, renderOperatorDefinitionFiles } = vi.hoisted(() => ({
  planOperatorDefinition: vi.fn(),
  renderOperatorDefinitionFiles: vi.fn(),
}));
vi.mock('../scripts/planOperatorDefinition.ts', () => ({
  planOperatorDefinition,
  renderOperatorDefinitionFiles,
}));

import { generateOperatorDefinitionCandidates } from '../scripts/generateOperatorDefinitionCandidates.ts';

const roots: string[] = [];

beforeEach(() => {
  vi.resetAllMocks();
  planOperatorDefinition.mockImplementation(({ slug }: { slug: string }) => ({
    activeSkills: [{ key: `${slug}-skill` }],
    operator: {
      ...avywenna,
      skillGroups: [],
      talents: [],
      potentials: [],
      passiveSkills: [],
      eventHandlers: [],
      comboSkillConditions: [],
      abilityEntityDefinitions: {},
      buffDefinitions: {},
    } satisfies OperatorDefinition,
    commonBuffDefinitions: {},
    audit: { slug },
  }));
  renderOperatorDefinitionFiles.mockImplementation(async (slug: string, _operator, audit) => ({
    file: { relativePath: `${slug}.generated.ts`, content: `export default '${slug}';\n` },
    auditFile: {
      relativePath: 'operator.audit.json',
      content: `${JSON.stringify(audit)}\n`,
    },
  }));
});

afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'operator-candidates-'));
  roots.push(root);
  const manifest = path.join(root, 'operators.json');
  const outputRoot = path.join(root, 'candidate');
  const auditRoot = path.join(root, 'audit');
  await fs.writeFile(manifest, JSON.stringify({ operators: [{ slug: 'one' }, { slug: 'two' }] }));
  return { root, manifest, outputRoot, auditRoot };
}

const sourceArguments = {
  sourceRoot: 'source',
  tableRoot: 'tables',
  skillPatchTable: 'skills',
  buffDataRoot: 'buffs',
  gameplayTagCatalog: 'tags',
  timeDilationCatalog: 'time',
  globalBuffCatalog: 'global-buffs',
  skillSettingCatalog: 'settings',
} as const;

describe('整批干员候选写入', () => {
  it.each(['same', 'nested', 'parent'] as const)(
    '拒绝公共输出与干员输出重叠：%s，避免目录替换覆盖另一份产物',
    async relation => {
      const paths = await setup();
      const commonBuffOutput =
        relation === 'same'
          ? paths.outputRoot
          : relation === 'nested'
            ? path.join(paths.outputRoot, 'buffs')
            : paths.root;
      await expect(
        generateOperatorDefinitionCandidates({
          ...sourceArguments,
          ...paths,
          commonBuffOutput,
          check: false,
        }),
      ).rejects.toThrow('must not overlap');
      expect(planOperatorDefinition).not.toHaveBeenCalled();
    },
  );

  it('不允许整批目录替换覆盖正式干员混合目录', async () => {
    const paths = await setup();
    await expect(
      generateOperatorDefinitionCandidates({
        ...sourceArguments,
        ...paths,
        outputRoot: path.resolve('src/data/operators'),
        check: false,
      }),
    ).rejects.toThrow('isolated directory');
  });

  it('全部渲染成功后写完整目录，并能严格复验文件集合', async () => {
    const paths = await setup();
    const input = { ...sourceArguments, ...paths, check: false };
    const render = renderOperatorDefinitionFiles.getMockImplementation()!;
    renderOperatorDefinitionFiles.mockImplementation(async (...args) => {
      // 渲染阶段只保留最终定义，来源缓存此前已经释放，累计读取次数仍可供审计。
      for (const [plan] of planOperatorDefinition.mock.calls) {
        const statistics = plan.sources.statistics();
        expect(statistics.shared.retainedSourceBytes).toBe(0);
        expect(statistics.shared.fileReads).toBeGreaterThan(0);
        expect(statistics.currentOperator.retainedSourceBytes).toBe(0);
        expect(statistics.parsedCatalogs).toBe(0);
      }
      return render(...args);
    });
    await expect(generateOperatorDefinitionCandidates(input)).resolves.toMatchObject({
      operatorCount: 2,
      skillCount: 2,
      operators: [{ slug: 'one' }, { slug: 'two' }],
    });
    await expect(
      fs.readFile(path.join(paths.outputRoot, 'two.generated.ts'), 'utf8'),
    ).resolves.toBe("export default 'two';\n");
    await expect(
      generateOperatorDefinitionCandidates({ ...input, check: true }),
    ).resolves.toMatchObject({ operatorCount: 2 });
    expect(planOperatorDefinition.mock.calls.map(([args]) => args.optimization)).toEqual([
      'off',
      'off',
      'off',
      'off',
    ]);
  });

  it('中途渲染失败时不碰上一份候选或审计目录', async () => {
    const paths = await setup();
    await fs.mkdir(paths.outputRoot);
    await fs.mkdir(paths.auditRoot);
    await fs.writeFile(path.join(paths.outputRoot, 'previous'), 'operator snapshot');
    await fs.writeFile(path.join(paths.auditRoot, 'previous'), 'audit snapshot');
    renderOperatorDefinitionFiles.mockImplementationOnce(
      renderOperatorDefinitionFiles.getMockImplementation()!,
    );
    renderOperatorDefinitionFiles.mockRejectedValueOnce(new Error('second operator blocked'));

    await expect(
      generateOperatorDefinitionCandidates({ ...sourceArguments, ...paths, check: false }),
    ).rejects.toThrow('second operator blocked');
    await expect(fs.readFile(path.join(paths.outputRoot, 'previous'), 'utf8')).resolves.toBe(
      'operator snapshot',
    );
    await expect(fs.readFile(path.join(paths.auditRoot, 'previous'), 'utf8')).resolves.toBe(
      'audit snapshot',
    );
  });

  it('拒绝重复 slug，避免两名干员覆盖同一路径', async () => {
    const paths = await setup();
    await fs.writeFile(
      paths.manifest,
      JSON.stringify({ operators: [{ slug: 'same' }, { slug: 'same' }] }),
    );
    await expect(
      generateOperatorDefinitionCandidates({ ...sourceArguments, ...paths, check: false }),
    ).rejects.toThrow('duplicate slugs');
    expect(planOperatorDefinition).not.toHaveBeenCalled();
  });
});
