/**
 * 串行加载本次优化前后的两套候选，比较相同输入的完整模拟事实摘要。
 * 来源生成与此审计分开：调用方应从同一批冻结来源生成两套目录，本入口不会写正式数据。
 */
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createCandidateRuntimeServer } from '../src/compiler/publication/candidateRuntimeServer.ts';
import { OPERATOR_DEFINITION_OUTPUTS } from './operatorDefinitionOutputs.ts';
import {
  requireArray,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
} from '../src/source/primitives.ts';

interface SimulationCaseResult {
  readonly id: string;
  readonly digest: string;
  readonly damageCount: number;
}

export async function auditDefinitionOptimizationCandidates(args: {
  readonly beforeRoot: string;
  readonly afterRoot: string;
  /** 仅用于分阶段验证；整批发布前必须包含公共 Buff、武器和套装。 */
  readonly operatorsOnly?: boolean;
}) {
  const projectRoot = path.resolve(import.meta.dirname, '../../..');
  const replacementPaths = [
    ...OPERATOR_DEFINITION_OUTPUTS,
    ...(args.operatorsOnly
      ? []
      : [
          'src/data/buffs/generated',
          'src/data/equipment/generated-weapons',
          'src/data/equipment/generated-gear-sets',
        ]),
  ];
  const run = async (candidateRoot: string): Promise<readonly SimulationCaseResult[]> => {
    // 缺少指定领域时失败，不能因覆盖层回退正式库而得到假的通过。
    for (const relative of replacementPaths) await stat(path.resolve(candidateRoot, relative));
    const server = await createCandidateRuntimeServer({
      projectRoot,
      candidateRoot,
      replacementPaths,
    });
    try {
      const module = await server.ssrLoadModule(
        '/tools/game-data-compiler/test/support/definitionOptimizationSimulation.ts',
      );
      const execute: unknown = module.auditOptimizationSimulationCases;
      if (typeof execute !== 'function') throw new Error('候选模拟夹具没有导出审计入口');
      const values: unknown = await execute(!args.operatorsOnly);
      return requireArray(values, 'simulation cases').map((value, index) => {
        const location = `simulation cases[${index}]`;
        const row = requireRecord(value, location);
        return {
          id: requireNonEmptyString(row.id, `${location}.id`),
          digest: requireNonEmptyString(row.digest, `${location}.digest`),
          damageCount: requireNonNegativeInteger(row.damageCount, `${location}.damageCount`),
        };
      });
    } finally {
      await server.close();
    }
  };
  // 不同时持有两个运行服务；摘要保留 undefined、非有限数和负零，避免 JSON 抹平差异。
  const before = await run(path.resolve(args.beforeRoot));
  const after = await run(path.resolve(args.afterRoot));
  const differences = after.flatMap((entry, index) =>
    isDeepStrictEqual(entry, before[index]) ? [] : [{ index, before: before[index], after: entry }],
  );
  if (before.length !== after.length || differences.length)
    throw new Error(
      `优化候选模拟不一致：${JSON.stringify({ before: before.length, after: after.length, differenceCount: differences.length, examples: differences.slice(0, 5) })}`,
    );
  return {
    equivalent: true,
    scope: args.operatorsOnly ? 'operators' : 'operators-common-buffs-weapons-gear-sets',
    caseCount: before.length,
    damageCount: before.reduce((sum, entry) => sum + entry.damageCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const values = process.argv.slice(2);
  const options = new Map<string, string>();
  let operatorsOnly = false;
  for (let index = 0; index < values.length; index++) {
    const key = values[index]!;
    if (key === '--operators-only') {
      operatorsOnly = true;
      continue;
    }
    const value = values[++index];
    if (
      !['--before-root', '--after-root'].includes(key) ||
      !value ||
      value.startsWith('--') ||
      options.has(key)
    )
      throw new Error(`无效参数 ${key}`);
    options.set(key, value);
  }
  const beforeRoot = options.get('--before-root');
  const afterRoot = options.get('--after-root');
  if (!beforeRoot || !afterRoot) throw new Error('必须提供 --before-root 和 --after-root');
  console.log(
    JSON.stringify(
      await auditDefinitionOptimizationCandidates({ beforeRoot, afterRoot, operatorsOnly }),
    ),
  );
}
