/**
 * 检查干员与公共 Buff 共用一次逐人规划后，仍独立复验全部文件。
 * 替换原始规划和消费者编译；最终优化、用途汇总、公共定义渲染和文件检查均执行真实代码。
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  OperatorBuffDefinitions,
  SkillBuffDefinition,
} from '../../../packages/game-data-contract/src/buffs.ts';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import type { GearSetDefinition } from '../../../packages/game-data-contract/src/equipment.ts';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { avywenna } from '../../../src/data/operators/avywenna.generated.ts';
import { optimizeCommonBuffDefinitions } from '../src/compiler/optimization/equipmentDefinitionOptimization.ts';
import {
  collectSharedEntityValueUsage,
  type SharedEntityValueUsageInput,
} from '../src/compiler/optimization/definitionEntityUsageContext.ts';
import type { OperatorPlanningSources } from '../scripts/operatorPlanningSources.ts';

const {
  renderOperatorDefinitionFiles,
  planOperatorDefinition,
  compileStandardStumpBuffClosure,
  compileEntityValueConsumers,
} = vi.hoisted(() => ({
  renderOperatorDefinitionFiles: vi.fn(),
  planOperatorDefinition: vi.fn(),
  compileStandardStumpBuffClosure: vi.fn(),
  compileEntityValueConsumers: vi.fn(),
}));
vi.mock('../scripts/planOperatorDefinition.ts', () => ({
  renderOperatorDefinitionFiles,
  planOperatorDefinition,
}));
vi.mock('../scripts/compileEntityValueConsumers.ts', () => ({ compileEntityValueConsumers }));
vi.mock('../src/compiler/buffs/standardStumpBuffClosure.ts', () => ({
  compileStandardStumpBuffClosure,
}));

import {
  generateOperatorDefinitionCandidates,
  renderOperatorDefinitionBatch,
} from '../scripts/generateOperatorDefinitionCandidates.ts';
import { generateOperatorDefinition } from '../scripts/generateOperatorDefinition.ts';
import {
  createCommonBuffCollector,
  readSystemBuffRoots,
} from '../scripts/generateCommonBuffDefinitions.ts';

const roots: string[] = [];
const systemRoots = readSystemBuffRoots(
  path.resolve('tools/game-data-compiler/config/systemBuffRoots.json'),
);
const guardedBuff: SkillBuffDefinition = {
  stackingType: 'unlimited',
  lifecycleSequences: {
    enable: {
      steps: [
        {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: true } },
          whenTrue: {
            steps: [
              {
                kind: 'modifyActionValue',
                parameters: {
                  key: 'live',
                  operation: 'assign',
                  value: { kind: 'constant', value: 2 },
                },
              },
            ],
          },
        },
      ],
    },
  },
};

function planned(slug: string, definitions: OperatorBuffDefinitions = {}) {
  return {
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
    commonBuffDefinitions: definitions,
    audit: { slug },
  };
}

function consumerUsage(overrides: Partial<SharedEntityValueUsageInput> = {}) {
  return collectSharedEntityValueUsage({
    operators: [],
    commonBuffDefinitions: {},
    commonAbilityEntityDefinitions: {},
    weapons: [],
    gears: [],
    gearSets: [],
    mechanicBuffDefinitions: {},
    mechanicSequences: [],
    ...overrides,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  planOperatorDefinition.mockImplementation(({ slug }: { slug: string }) =>
    planned(slug, { buff_common_fixture: structuredClone(guardedBuff) }),
  );
  renderOperatorDefinitionFiles.mockImplementation(
    async (slug: string, operator: OperatorDefinition, audit) => ({
      file: {
        relativePath: `${slug}.generated.ts`,
        content: `export default ${JSON.stringify(operator)};\n`,
      },
      auditFile: { relativePath: 'operator.audit.json', content: `${JSON.stringify(audit)}\n` },
    }),
  );
  compileEntityValueConsumers.mockImplementation(async () => consumerUsage());
  compileStandardStumpBuffClosure.mockImplementation((ids: readonly string[]) => ({
    definitions: Object.fromEntries(ids.map(id => [id, { stackingType: 'unlimited' }])),
    diagnostics: [],
  }));
});

afterEach(async () => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup(slugs: readonly string[] = ['one', 'two']) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'operator-common-candidates-'));
  roots.push(root);
  const manifest = path.join(root, 'operators.json');
  const globalBuffCatalog = path.join(root, 'global.json');
  const skillSettingCatalog = path.join(root, 'settings.json');
  const gameplayTagCatalog = path.join(root, 'tags.ts');
  const timeDilationCatalog = path.join(root, 'time.ts');
  await fs.writeFile(manifest, JSON.stringify({ operators: slugs.map(slug => ({ slug })) }));
  await fs.writeFile(globalBuffCatalog, '{}');
  await fs.writeFile(skillSettingCatalog, '{}');
  await fs.writeFile(
    gameplayTagCatalog,
    "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
  );
  await fs.writeFile(
    timeDilationCatalog,
    "export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'TimeDilation/Priority/Fixture', value: 1 }] as const);\n",
  );
  return {
    manifest,
    sourceRoot: root,
    tableRoot: root,
    skillPatchTable: 'unused-skill-patch',
    buffDataRoot: root,
    gameplayTagCatalog,
    timeDilationCatalog,
    globalBuffCatalog,
    skillSettingCatalog,
    outputRoot: path.join(root, 'operators'),
    auditRoot: path.join(root, 'audit'),
    commonBuffOutput: path.join(root, 'common'),
    check: false,
  };
}

describe('干员与公共 Buff 共用规划', () => {
  it('复用完整外部摘要时不重编译且文本不变，未提供摘要的下一轮重新编译来源', async () => {
    const args = { ...(await setup(['one'])), includeCommonBuffs: true };
    const skill: SkillDefinition = {
      key: 'spawn',
      timelineBlockFrames: 10,
      blackboard: { equipmentValue: 7, changed: 8, unused: 99 },
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'fixture',
                  dieWhenSourceDies: false,
                  inheritActionBlackboard: true,
                },
              },
            ],
          },
        },
      ],
    };
    const operator: OperatorDefinition = {
      ...planned('one').operator,
      abilityEntityDefinitions: { fixture: { lifetime: { kind: 'infinite' } } },
      skillGroups: [
        { key: 'spawn', skillType: 'battleSkill', levelSource: 'battleSkill', skills: skill },
      ],
    };
    planOperatorDefinition.mockReturnValue({ ...planned('one'), operator });
    const equipment = (key: string) =>
      consumerUsage({
        gearSets: [
          {
            slug: 'equipment',
            buffDefinitions: {
              borrowed: { stackingType: 'unlimited', durationSeconds: { blackboardKey: key } },
            },
          },
        ],
      });
    const original = equipment('equipmentValue');
    compileEntityValueConsumers.mockResolvedValue(original);
    const first = await renderOperatorDefinitionBatch(args);
    expect(first.files[0]!.content).toContain('"equipmentValue":7');
    expect(first.files[0]!.content).not.toContain('"unused":99');
    expect(await renderOperatorDefinitionBatch(args, original)).toEqual(first);
    expect(compileEntityValueConsumers).toHaveBeenCalledTimes(1);
    compileEntityValueConsumers.mockImplementation(async () => equipment('changed'));
    const next = await renderOperatorDefinitionBatch(args);
    expect(compileEntityValueConsumers).toHaveBeenCalledTimes(2);
    expect(next.files[0]!.content).toContain('"changed":8');
    expect(next.files[0]!.content).not.toContain('"equipmentValue":7');
    expect(planOperatorDefinition).toHaveBeenCalledTimes(3);
    for (const result of [first, next])
      expect(result.summary.entityValueConsumers?.unknownAccess).toBe(false);
  });

  it.each(['off', 'report', 'apply'] as const)(
    '正式单人 %s 生成与联合候选文本相同，复验重新收齐闭包且只写目标',
    async optimization => {
      const input = { ...(await setup()), optimization };
      const skill: SkillDefinition = {
        key: 'spawn',
        timelineBlockFrames: 10,
        blackboard: { teammateValue: 7, unused: 99 },
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    abilityEntityId: 'fixture',
                    dieWhenSourceDies: false,
                    inheritActionBlackboard: true,
                  },
                },
              ],
            },
          },
        ],
      };
      planOperatorDefinition.mockImplementation(({ slug }: { slug: string }) => {
        const result = planned(slug);
        const operator: OperatorDefinition =
          slug === 'one'
            ? {
                ...result.operator,
                abilityEntityDefinitions: { fixture: { lifetime: { kind: 'infinite' } } },
                skillGroups: [
                  {
                    key: 'spawn',
                    skillType: 'battleSkill',
                    levelSource: 'battleSkill',
                    skills: skill,
                  },
                ],
              }
            : {
                ...result.operator,
                buffDefinitions: {
                  teammate: {
                    stackingType: 'unlimited',
                    durationSeconds: { blackboardKey: 'teammateValue' },
                  },
                },
              };
        return { ...result, operator };
      });
      await generateOperatorDefinitionCandidates(input);
      const candidate = await fs.readFile(path.join(input.outputRoot, 'one.generated.ts'), 'utf8');
      expect(candidate.includes('"unused":99')).toBe(optimization !== 'apply');
      expect(candidate).toContain('"teammateValue":7');
      const candidateAudit = await fs.readFile(
        path.join(input.auditRoot, 'one/operator.audit.json'),
        'utf8',
      );
      const output = path.join(input.sourceRoot, 'src/data/operators');
      const auditOutput = path.join(
        input.sourceRoot,
        'tmp/game-data-audit/operator-definitions/one',
      );
      const commonOutput = path.join(input.sourceRoot, 'src/data/buffs/generated');
      await fs.mkdir(output, { recursive: true });
      await fs.mkdir(commonOutput, { recursive: true });
      await fs.writeFile(path.join(output, 'two.generated.ts'), 'other operator');
      await fs.writeFile(path.join(commonOutput, 'previous'), 'common snapshot');
      vi.spyOn(process, 'cwd').mockReturnValue(input.sourceRoot);
      const selected = { ...input, slug: 'one', output, auditOutput };
      await expect(generateOperatorDefinition(selected)).resolves.toMatchObject({ slug: 'one' });
      expect(await fs.readFile(path.join(output, 'one.generated.ts'), 'utf8')).toBe(candidate);
      expect(await fs.readFile(path.join(auditOutput, 'operator.audit.json'), 'utf8')).toBe(
        candidateAudit,
      );
      await expect(generateOperatorDefinition({ ...selected, check: true })).resolves.toMatchObject(
        { slug: 'one' },
      );
      expect(planOperatorDefinition.mock.calls.map(([args]) => args.slug)).toEqual([
        'one',
        'two',
        'one',
        'two',
        'one',
        'two',
      ]);
      expect(renderOperatorDefinitionFiles.mock.calls.map(([slug]) => slug)).toEqual([
        'one',
        'two',
        'one',
        'one',
      ]);
      expect(await fs.readFile(path.join(output, 'two.generated.ts'), 'utf8')).toBe(
        'other operator',
      );
      expect(await fs.readdir(commonOutput)).toEqual(['previous']);
      expect(await fs.readFile(path.join(commonOutput, 'previous'), 'utf8')).toBe(
        'common snapshot',
      );
      expect(await fs.readdir(path.dirname(auditOutput))).toEqual(['one']);
    },
  );

  it.each(['off', 'report', 'apply'] as const)(
    '%s 模式的生成和复验各规划每人一次，公共定义与报告使用同一模式',
    async optimization => {
      const input = { ...(await setup()), optimization };
      const first = await generateOperatorDefinitionCandidates(input);
      const second = await generateOperatorDefinitionCandidates({ ...input, check: true });
      expect(first).toEqual(second);
      expect(first.commonBuffs).toMatchObject({
        buffCount: systemRoots.length + 1,
        optimization: { mode: optimization },
      });
      expect(planOperatorDefinition.mock.calls.map(([args]) => args.slug)).toEqual([
        'one',
        'two',
        'one',
        'two',
      ]);
      for (const [args] of planOperatorDefinition.mock.calls) expect(args.optimization).toBe('off');
      for (const [, , audit] of renderOperatorDefinitionFiles.mock.calls)
        expect(audit.optimization.mode).toBe(optimization);
      expect(compileEntityValueConsumers).toHaveBeenCalledTimes(optimization === 'off' ? 0 : 2);
      expect(compileStandardStumpBuffClosure).toHaveBeenCalledTimes(2);
      const changes = first.commonBuffs!.optimization.programs.flatMap(item => item.changes);
      expect(changes.length > 0).toBe(optimization !== 'off');
      const content = await fs.readFile(
        path.join(input.commonBuffOutput, 'commonBuffDefinitions.generated.ts'),
        'utf8',
      );
      expect(content.includes('branch(')).toBe(optimization !== 'apply');
      expect(await fs.readdir(input.commonBuffOutput)).toEqual([
        'commonBuffDefinitions.generated.ts',
        'commonBuffPresentationNames.generated.ts',
      ]);
    },
  );

  it('优化后相同的原始定义仍严格冲突，不能先裁剪再合并', async () => {
    const input = await setup();
    const first: SkillBuffDefinition = {
      stackingType: 'unlimited',
      lifecycleSequences: {
        enable: {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'constant', value: false } },
              whenTrue: guardedBuff.lifecycleSequences!.enable!,
            },
          ],
        },
      },
    };
    const second: SkillBuffDefinition = {
      ...first,
      lifecycleSequences: {
        enable: {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'constant', value: false } },
              whenTrue: { steps: [] },
            },
          ],
        },
      },
    };
    expect(optimizeCommonBuffDefinitions({ common: first }, 'apply').definitions).toEqual(
      optimizeCommonBuffDefinitions({ common: second }, 'apply').definitions,
    );
    planOperatorDefinition.mockImplementation(({ slug }: { slug: string }) =>
      planned(slug, { common: slug === 'one' ? first : second }),
    );
    await expect(generateOperatorDefinitionCandidates(input)).rejects.toThrow(
      "common Buff 'common' differs between 'one' and 'two'",
    );
    expect(compileStandardStumpBuffClosure).not.toHaveBeenCalled();
    for (const directory of [input.outputRoot, input.auditRoot, input.commonBuffOutput])
      await expect(fs.stat(directory)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('没有干员时仍生成全部系统根并可重新复验', async () => {
    const input = await setup([]);
    const first = await generateOperatorDefinitionCandidates(input);
    expect(first).toMatchObject({
      operatorCount: 0,
      commonBuffs: { buffCount: systemRoots.length },
    });
    await expect(generateOperatorDefinitionCandidates({ ...input, check: true })).resolves.toEqual(
      first,
    );
    expect(planOperatorDefinition).not.toHaveBeenCalled();
    expect(compileStandardStumpBuffClosure).toHaveBeenCalledTimes(2);
    const content = await fs.readFile(
      path.join(input.commonBuffOutput, 'commonBuffDefinitions.generated.ts'),
      'utf8',
    );
    for (const id of systemRoots) expect(content).toContain(id);
  });

  it('系统根和干员同 ID 定义冲突时明确指出两方来源', async () => {
    const input = await setup(['one']);
    const id = systemRoots[0]!;
    planOperatorDefinition.mockReturnValue(planned('one', { [id]: guardedBuff }));
    await expect(generateOperatorDefinitionCandidates(input)).rejects.toThrow(
      `common Buff '${id}' differs between 'one' and '<system>'`,
    );
  });

  it('系统闭包阻断时三个已有目录均保持原样', async () => {
    const input = await setup();
    const directories = [input.outputRoot, input.auditRoot, input.commonBuffOutput];
    for (const directory of directories) {
      await fs.mkdir(directory);
      await fs.writeFile(path.join(directory, 'previous'), directory);
    }
    compileStandardStumpBuffClosure.mockReturnValue({
      definitions: {},
      diagnostics: [{ status: 'blocked', sourcePath: 'system.fixture', reason: 'missing action' }],
    });
    await expect(generateOperatorDefinitionCandidates(input)).rejects.toThrow(
      'system Buff roots are blocked',
    );
    for (const directory of directories) {
      expect(await fs.readdir(directory)).toEqual(['previous']);
      expect(await fs.readFile(path.join(directory, 'previous'), 'utf8')).toBe(directory);
    }
  });

  it('同批装备或机制编译失败时三个已有目录均保持原样', async () => {
    const input = await setup();
    const directories = [input.outputRoot, input.auditRoot, input.commonBuffOutput];
    for (const directory of directories) {
      await fs.mkdir(directory);
      await fs.writeFile(path.join(directory, 'previous'), directory);
    }
    compileEntityValueConsumers.mockRejectedValueOnce(new Error('equipment or mechanic blocked'));
    await expect(generateOperatorDefinitionCandidates(input)).rejects.toThrow(
      'equipment or mechanic blocked',
    );
    expect(planOperatorDefinition).not.toHaveBeenCalled();
    expect(renderOperatorDefinitionFiles).not.toHaveBeenCalled();
    for (const directory of directories) {
      expect(await fs.readdir(directory)).toEqual(['previous']);
      expect(await fs.readFile(path.join(directory, 'previous'), 'utf8')).toBe(directory);
    }
  });

  it.each([true, false])(
    '只有完整公共目录才按同批装备和机制消费用途裁剪传入实体的值：%s',
    async withCommonBuffs => {
      const base = await setup(['one']);
      const input = {
        ...base,
        commonBuffOutput: withCommonBuffs ? base.commonBuffOutput : undefined,
      };
      const skill: SkillDefinition = {
        key: 'spawn',
        timelineBlockFrames: 10,
        blackboard: { equipmentValue: 7, mechanicValue: 9, unused: 99 },
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    abilityEntityId: 'fixture',
                    dieWhenSourceDies: false,
                    inheritActionBlackboard: true,
                  },
                },
              ],
            },
          },
        ],
      };
      const operator: OperatorDefinition = {
        ...planned('one').operator,
        abilityEntityDefinitions: { fixture: { lifetime: { kind: 'infinite' } } },
        skillGroups: [
          { key: 'spawn', skillType: 'battleSkill', levelSource: 'battleSkill', skills: skill },
        ],
      };
      const gearSet: GearSetDefinition = {
        slug: 'fixture',
        buffDefinitions: {
          equipped: {
            stackingType: 'unlimited',
            attributeModifiers: [
              {
                attribute: 'attack',
                slot: 'addition',
                value: { blackboardKey: 'equipmentValue' },
              },
            ],
          },
        },
      };
      const mechanicBuffDefinitions: OperatorBuffDefinitions = {
        mechanic: {
          stackingType: 'unlimited',
          durationSeconds: { blackboardKey: 'mechanicValue' },
        },
      };
      planOperatorDefinition.mockReturnValue({ ...planned('one'), operator });
      compileEntityValueConsumers.mockImplementation(async () =>
        consumerUsage({
          gearSets: [gearSet],
          mechanicBuffDefinitions,
        }),
      );
      const result = await generateOperatorDefinitionCandidates(input);
      expect(compileEntityValueConsumers).toHaveBeenCalledTimes(withCommonBuffs ? 1 : 0);
      if (withCommonBuffs)
        expect(result.entityValueConsumers).toEqual({
          reads: ['equipmentValue', 'mechanicValue'],
          unknownAccess: false,
        });
      else expect(result.entityValueConsumers).toBeUndefined();
      expect(renderOperatorDefinitionFiles).toHaveBeenCalledWith(
        'one',
        expect.objectContaining({
          skillGroups: [
            expect.objectContaining({
              skills: expect.objectContaining({
                blackboard: withCommonBuffs
                  ? { equipmentValue: 7, mechanicValue: 9 }
                  : skill.blackboard,
              }),
            }),
          ],
        }),
        expect.objectContaining({ optimization: expect.objectContaining({ mode: 'apply' }) }),
      );
    },
  );

  it.each(['operator', 'system'] as const)(
    '第二轮重新读取 %s 公共定义，变化不能被首轮缓存掩盖',
    async source => {
      const input = await setup();
      await generateOperatorDefinitionCandidates(input);
      const output = path.join(input.commonBuffOutput, 'commonBuffDefinitions.generated.ts');
      const before = await fs.readFile(output, 'utf8');
      if (source === 'operator') {
        planOperatorDefinition.mockImplementation(({ slug }: { slug: string }) =>
          planned(slug, {
            buff_common_fixture: { stackingType: 'unlimited', blackboard: { changed: 7 } },
          }),
        );
      } else {
        compileStandardStumpBuffClosure.mockImplementation((ids: readonly string[]) => ({
          definitions: Object.fromEntries(
            ids.map(id => [id, { stackingType: 'unlimited', blackboard: { changed: 7 } }]),
          ),
          diagnostics: [],
        }));
      }
      await expect(generateOperatorDefinitionCandidates({ ...input, check: true })).rejects.toThrow(
        'stale',
      );
      expect(planOperatorDefinition).toHaveBeenCalledTimes(4);
      expect(compileStandardStumpBuffClosure).toHaveBeenCalledTimes(2);
      expect(await fs.readFile(output, 'utf8')).toBe(before);
    },
  );

  it.each([
    'commonBuffDefinitions.generated.ts',
    'commonBuffPresentationNames.generated.ts',
    'extra.ts',
  ])('复验发现 %s 内容或文件集合变化且不写回', async file => {
    const input = await setup();
    await generateOperatorDefinitionCandidates(input);
    const output = path.join(input.commonBuffOutput, file);
    await fs.writeFile(output, 'changed after generation\n');
    await expect(generateOperatorDefinitionCandidates({ ...input, check: true })).rejects.toThrow(
      'stale',
    );
    expect(await fs.readFile(output, 'utf8')).toBe('changed after generation\n');
  });

  it('联合生成每轮新建读取上下文，复验不会复用首轮固定表快照', async () => {
    const base = await setup();
    const skillPatchTable = path.join(base.sourceRoot, 'patch.json');
    const skillFile = path.join(base.sourceRoot, 'skill.json');
    const input = { ...base, skillPatchTable };
    await fs.writeFile(skillPatchTable, '{"value":1}');
    await fs.writeFile(skillFile, '{"value":2}');
    const contexts: OperatorPlanningSources[] = [];
    planOperatorDefinition.mockImplementation(
      ({ slug, sources }: { slug: string; sources: OperatorPlanningSources }) => {
        contexts.push(sources);
        // 前一名干员读取的技能原文必须在规划下一名前已经释放。
        expect(sources.statistics().currentOperator.retainedSourceBytes).toBe(0);
        const patch = sources.readJson(skillPatchTable);
        sources.readJson(skillFile);
        const result = planned(slug);
        return {
          ...result,
          operator: { ...result.operator, displayName: JSON.stringify(patch) },
        };
      },
    );
    await generateOperatorDefinitionCandidates(input);
    expect(contexts[0]).toBe(contexts[1]);
    const output = path.join(input.outputRoot, 'one.generated.ts');
    const before = await fs.readFile(output, 'utf8');
    await fs.writeFile(skillPatchTable, '{"value":3}');
    await expect(generateOperatorDefinitionCandidates({ ...input, check: true })).rejects.toThrow(
      'generated definition file is stale: one.generated.ts',
    );
    expect(contexts).toHaveLength(4);
    expect(contexts[2]).toBe(contexts[3]);
    expect(contexts[2]).not.toBe(contexts[0]);
    expect(await fs.readFile(output, 'utf8')).toBe(before);
  });
});

describe('公共 Buff 增量收集', () => {
  it('保留首次来源，严格区分缺字段、undefined 和负零', () => {
    const collector = createCommonBuffCollector<{ value?: number }>();
    collector.add('first', { same: { value: 0 }, missing: {} });
    collector.add('second', { same: { value: 0 } });
    expect(Object.keys(collector.definitions)).toEqual(['same', 'missing']);
    expect(() => collector.add('third', { same: { value: -0 } })).toThrow(
      "between 'first' and 'third'",
    );
    expect(() => collector.add('fourth', { missing: { value: undefined } })).toThrow(
      "between 'first' and 'fourth'",
    );
  });
});
