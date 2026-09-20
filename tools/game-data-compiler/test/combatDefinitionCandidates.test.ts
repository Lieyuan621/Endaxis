/**
 * 验证整轮候选生成只编译各领域一次，先收集用途，再渲染同一批定义。
 * 仅替换来源编译与文本渲染；用途汇总、目录写入和独立文件检查都执行真实代码。
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionSequenceDefinition } from '../../../packages/game-data-contract/src/actions.ts';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../packages/game-data-contract/src/equipment.ts';
import type { SharedEntityValueUsage } from '../src/compiler/optimization/definitionEntityUsageContext.ts';
import type { OperatorDefinitionBatchArguments } from '../scripts/generateOperatorDefinitionCandidates.ts';

const mocks = vi.hoisted(() => ({
  compileWeapons: vi.fn(),
  renderWeapons: vi.fn(),
  compileGears: vi.fn(),
  renderGears: vi.fn(),
  compileGearSets: vi.fn(),
  renderGearSets: vi.fn(),
  compileMechanics: vi.fn(),
  renderMechanics: vi.fn(),
  renderOperators: vi.fn(),
}));
vi.mock('../scripts/generateWeaponDefinitions.ts', () => ({
  compileWeaponDefinitionsFromFiles: mocks.compileWeapons,
  renderWeaponDefinitionsFromCompiled: mocks.renderWeapons,
}));
vi.mock('../scripts/generateGearDefinitions.ts', () => ({
  compileGearDefinitionsFromFiles: mocks.compileGears,
  renderGearDefinitionsFromCompiled: mocks.renderGears,
}));
vi.mock('../scripts/generateGearSetDefinitions.ts', () => ({
  compileGearSetDefinitionsFromFiles: mocks.compileGearSets,
  renderGearSetDefinitionsFromCompiled: mocks.renderGearSets,
}));
vi.mock('../scripts/generateContingencyContractDefinitions.ts', () => ({
  compileContingencyContractDefinitionsFromFiles: mocks.compileMechanics,
  renderContingencyContractDefinitionsFromCompiled: mocks.renderMechanics,
}));
vi.mock('../scripts/generateOperatorDefinitionCandidates.ts', () => ({
  renderOperatorDefinitionBatch: mocks.renderOperators,
}));

import {
  generateCombatDefinitionCandidates,
  type CombatDefinitionCandidateArguments,
} from '../scripts/generateCombatDefinitionCandidates.ts';

const roots: string[] = [];
const calls: string[] = [];
let sourceRevision = 1;
const readKey = (domain: string) => `${domain}_${sourceRevision}`;
const buff = (domain: string): SkillBuffDefinition => ({
  stackingType: 'unlimited',
  durationSeconds: { blackboardKey: readKey(domain) },
});
const queryEntityValue = (key: string): ActionSequenceDefinition => ({
  steps: [
    {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        saveToContextKey: 'found',
        circularOrder: { indexBlackboardKey: key, desiredCount: 1, reverseFlag: 1 },
      },
    },
  ],
});
function weaponBatch() {
  return {
    definitions: [
      {
        slug: 'fixture-weapon',
        rarity: 6,
        weaponType: 'polearm',
        baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
        traits: [{ key: 'passive', levelCount: 1, buffDefinitions: { fixture: buff('weapons') } }],
      } satisfies WeaponDefinition,
    ],
  };
}
function gearBatch() {
  return {
    definitions: [
      {
        slug: 'fixture-gear',
        slotType: 'armor',
        levelRequirement: 1,
        baseDefense: 1,
        traits: [
          {
            key: 'passive',
            levelCount: 1,
            display: {
              kind: 'modifier',
              modifier: { kind: 'attribute', attribute: 'strength', operation: 'flat', value: 1 },
            },
            buffDefinitions: { fixture: buff('gears') },
          },
        ],
      } satisfies GearDefinition,
    ],
  };
}
function gearSetBatch() {
  return {
    definitions: [
      {
        slug: 'fixture-set',
        buffDefinitions: { fixture: buff('gearSets') },
      } satisfies GearSetDefinition,
    ],
  };
}
function mechanicBatch() {
  return {
    buffDefinitions: { fixture: buff('mechanics') },
    initializationPlans: [{ tagId: 1, sequence: queryEntityValue(readKey('mechanicQuery')) }],
  };
}
const files = (domain: string) => [{ relativePath: 'fixture.ts', content: `${readKey(domain)}\n` }];
const expectedReads = () =>
  ['weapons', 'gears', 'gearSets', 'mechanics', 'mechanicQuery'].map(readKey).sort();

beforeEach(() => {
  vi.resetAllMocks();
  calls.length = 0;
  sourceRevision = 1;
  mocks.compileWeapons.mockImplementation(() => {
    calls.push('compile:weapons');
    return weaponBatch();
  });
  mocks.compileGears.mockImplementation(() => {
    calls.push('compile:gears');
    return gearBatch();
  });
  mocks.compileGearSets.mockImplementation(() => {
    calls.push('compile:gearSets');
    return gearSetBatch();
  });
  mocks.compileMechanics.mockImplementation(() => {
    calls.push('compile:mechanics');
    return mechanicBatch();
  });
  // 故意清空渲染入口收到的定义。如果收集顺序颠倒，最终摘要就会缺少这些读取。
  mocks.renderWeapons.mockImplementation((batch: ReturnType<typeof weaponBatch>) => {
    calls.push('render:weapons');
    batch.definitions.length = 0;
    return {
      files: files('weapons'),
      auditFiles: files('weaponAudit'),
      summary: { definitionCount: 1 },
    };
  });
  mocks.renderGears.mockImplementation((batch: ReturnType<typeof gearBatch>) => {
    calls.push('render:gears');
    batch.definitions.length = 0;
    return { files: files('gears'), summary: { definitionCount: 1 } };
  });
  mocks.renderGearSets.mockImplementation((batch: ReturnType<typeof gearSetBatch>) => {
    calls.push('render:gearSets');
    batch.definitions.length = 0;
    return { files: files('gearSets'), summary: { definitionCount: 1 } };
  });
  mocks.renderMechanics.mockImplementation((batch: ReturnType<typeof mechanicBatch>) => {
    calls.push('render:mechanics');
    batch.buffDefinitions = { fixture: { stackingType: 'unlimited' } };
    batch.initializationPlans.length = 0;
    return { files: files('mechanics'), summary: { supportedTagCount: 1 } };
  });
  mocks.renderOperators.mockImplementation(
    (_args: OperatorDefinitionBatchArguments, usage: SharedEntityValueUsage) => {
      calls.push('render:operators');
      return {
        files: [
          { relativePath: 'fixture.ts', content: `${JSON.stringify([...usage.reads].sort())}\n` },
        ],
        auditFiles: files('operatorAudit'),
        commonBuffs: { files: files('commonBuffs') },
        summary: { operatorCount: 1 },
      };
    },
  );
});

afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup(): Promise<CombatDefinitionCandidateArguments> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'combat-candidates-'));
  roots.push(root);
  const gameplayTagCatalog = path.join(root, 'tags.ts');
  await fs.writeFile(
    gameplayTagCatalog,
    "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
  );
  return {
    manifest: path.join(root, 'operators.json'),
    sourceRoot: root,
    tableRoot: root,
    buffDataRoot: root,
    skillPatchTable: 'unused-patches',
    gameplayTagCatalog,
    timeDilationCatalog: 'unused-time',
    globalBuffCatalog: 'unused-global',
    skillSettingCatalog: 'unused-settings',
    candidateRoot: path.join(root, 'candidate'),
    auditRoot: path.join(root, 'audit'),
    optimization: 'apply',
    check: false,
  };
}

function outputDirectories(args: CombatDefinitionCandidateArguments) {
  return [
    path.join(args.candidateRoot, 'src/data/equipment/generated-weapons'),
    path.join(args.auditRoot, 'weapons'),
    path.join(args.candidateRoot, 'src/data/equipment/generated'),
    path.join(args.candidateRoot, 'src/data/equipment/generated-gear-sets'),
    path.join(args.candidateRoot, 'src/data/mechanics/generated'),
    path.join(args.candidateRoot, 'src/data/operators'),
    path.join(args.auditRoot, 'operators'),
    path.join(args.candidateRoot, 'src/data/buffs/generated'),
  ];
}

/** 连文件名一起比较，捕获提前替换目录、遗留暂存目录和漏写文件。 */
async function snapshot(directory: string): Promise<Record<string, string>> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result: Record<string, string> = {};
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [relative, content] of Object.entries(await snapshot(fullPath))) {
        result[`${entry.name}/${relative}`] = content;
      }
    } else result[entry.name] = await fs.readFile(fullPath, 'utf8');
  }
  return result;
}

const domainMocks = [
  { domain: 'weapons', compile: mocks.compileWeapons, render: mocks.renderWeapons },
  { domain: 'gears', compile: mocks.compileGears, render: mocks.renderGears },
  { domain: 'gearSets', compile: mocks.compileGearSets, render: mocks.renderGearSets },
  { domain: 'mechanics', compile: mocks.compileMechanics, render: mocks.renderMechanics },
];

describe('整轮战斗候选生成', () => {
  it('每域只编译一次，同一对象先收集再渲染，干员只接收完整摘要', async () => {
    const args = await setup();
    const result = await generateCombatDefinitionCandidates(args);
    for (const { compile, render } of domainMocks) {
      expect(compile).toHaveBeenCalledTimes(1);
      expect(render).toHaveBeenCalledTimes(1);
      expect(render.mock.calls[0]![0]).toBe(compile.mock.results[0]!.value);
    }
    expect(calls).toEqual([
      'compile:weapons',
      'render:weapons',
      'compile:gears',
      'render:gears',
      'compile:gearSets',
      'render:gearSets',
      'compile:mechanics',
      'render:mechanics',
      'render:operators',
    ]);
    expect(mocks.renderOperators).toHaveBeenCalledTimes(1);
    const [operatorArgs, usage] = mocks.renderOperators.mock.calls[0]!;
    expect(operatorArgs).toMatchObject({
      outputRoot: path.join(args.candidateRoot, 'src/data/operators'),
      auditRoot: path.join(args.auditRoot, 'operators'),
      includeCommonBuffs: true,
      optimization: 'apply',
    });
    expect(Object.keys(usage).sort()).toEqual([
      'commonAbilityEntityDefinitions',
      'reads',
      'unknownAccess',
    ]);
    expect([...usage.reads].sort()).toEqual(expectedReads());
    expect(usage.unknownAccess).toBe(false);
    expect(usage.commonAbilityEntityDefinitions).toEqual({});
    expect(mocks.renderWeapons.mock.calls[0]![1]).toBe('apply');
    expect(mocks.renderGearSets.mock.calls[0]![1]).toBe('apply');
    expect(result.equipment.map(report => report.domain)).toEqual([
      'weapons',
      'gears',
      'gear-sets',
      'mechanics',
    ]);
    for (const directory of outputDirectories(args))
      expect(await fs.readdir(directory)).toEqual(['fixture.ts']);
  });

  it('独立 check 重新编译所有来源，来源变化后报告过期且不修改已有输出', async () => {
    const args = await setup();
    await generateCombatDefinitionCandidates(args);
    const previous = await snapshot(path.dirname(args.candidateRoot));
    await generateCombatDefinitionCandidates({ ...args, check: true });
    expect(await snapshot(path.dirname(args.candidateRoot))).toEqual(previous);
    sourceRevision = 2;
    await expect(generateCombatDefinitionCandidates({ ...args, check: true })).rejects.toThrow(
      'stale',
    );
    expect(await snapshot(path.dirname(args.candidateRoot))).toEqual(previous);
    for (const { compile, render } of domainMocks) {
      expect(compile).toHaveBeenCalledTimes(3);
      expect(render).toHaveBeenCalledTimes(3);
      expect(compile.mock.results[0]!.value).not.toBe(compile.mock.results[1]!.value);
      expect(compile.mock.results[1]!.value).not.toBe(compile.mock.results[2]!.value);
    }
    expect(mocks.renderOperators).toHaveBeenCalledTimes(3);
    expect([...mocks.renderOperators.mock.calls[2]![1].reads].sort()).toEqual(expectedReads());
  });

  it.each([
    ...domainMocks.flatMap(({ domain, compile, render }) => [
      { stage: `${domain} compile`, fail: compile },
      { stage: `${domain} render`, fail: render },
    ]),
    { stage: 'operators render', fail: mocks.renderOperators },
  ])('$stage 失败时保留所有旧候选与审计文件', async ({ fail }) => {
    const args = await setup();
    for (const [index, directory] of outputDirectories(args).entries()) {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(path.join(directory, 'old.txt'), `previous ${index}\n`);
    }
    const previous = await snapshot(path.dirname(args.candidateRoot));
    fail.mockImplementationOnce(() => {
      throw new Error('fixture failure');
    });
    await expect(generateCombatDefinitionCandidates(args)).rejects.toThrow('fixture failure');
    expect(await snapshot(path.dirname(args.candidateRoot))).toEqual(previous);
  });

  it.each(['same', 'audit-inside-candidate', 'candidate-inside-audit'])(
    '拒绝候选与审计目录重叠：%s',
    async relation => {
      let args = await setup();
      if (relation === 'same') args = { ...args, auditRoot: args.candidateRoot };
      else if (relation === 'audit-inside-candidate')
        args = { ...args, auditRoot: path.join(args.candidateRoot, 'audit') };
      else args = { ...args, candidateRoot: path.join(args.auditRoot, 'candidate') };
      await expect(generateCombatDefinitionCandidates(args)).rejects.toThrow('must not overlap');
      expect(mocks.compileWeapons).not.toHaveBeenCalled();
    },
  );

  it.each(
    ['src', 'public', 'tools', 'docs'].flatMap(directory => [
      { directory, output: 'candidateRoot' },
      { directory, output: 'auditRoot' },
    ]),
  )('拒绝将 $output 放入正式 $directory 目录', async ({ directory, output }) => {
    const args = await setup();
    const projectRoot = path.resolve(import.meta.dirname, '../../..');
    await expect(
      generateCombatDefinitionCandidates({
        ...args,
        [output]: path.join(projectRoot, directory, 'candidate-fixture'),
      }),
    ).rejects.toThrow('cannot replace project source directories');
    expect(mocks.compileWeapons).not.toHaveBeenCalled();
  });
});
