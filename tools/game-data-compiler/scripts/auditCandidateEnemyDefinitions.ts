import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { planEnemyDefinitions } from './generateEnemyDefinitions.ts';

interface Arguments {
  readonly tablesDirectory: string;
  readonly rankEvidence: string;
  readonly runtimeDefaults: string;
  readonly selectionCategories?: string;
}

export async function auditCandidateEnemyDefinitions(args: Arguments) {
  const plan = await planEnemyDefinitions(
    args.tablesDirectory,
    args.rankEvidence,
    args.runtimeDefaults,
    args.selectionCategories,
  );
  const ids = plan.definitions.map(definition => definition.id);
  const gameIds = plan.definitions.map(definition => definition.gameId);
  if (new Set(ids).size !== ids.length) throw new Error('candidate enemies contain duplicate ids');
  if (new Set(gameIds).size !== gameIds.length)
    throw new Error('candidate enemies contain duplicate game ids');
  return {
    candidateCount: plan.definitions.length,
    definitionIds: ids,
    excludedDisplayIds: plan.excludedDisplayIds,
    selectionCategoryCount: plan.selection.categories.length,
    hiddenSelectionIds: plan.selection.hiddenEnemyIds,
    fullLevelNodeCount: plan.definitions.reduce(
      (sum, definition) => sum + definition.levelHp.length,
      0,
    ),
    compatibilityDefaults: plan.compatibilityDefaults,
    evidence: 'current source tables plus same-run EnemyTemplateData rank extraction',
  };
}

function parseArguments(values: readonly string[]): Arguments {
  const parsed = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--'))
      throw new Error('expected --key value arguments');
    parsed.set(key, value);
  }
  const tablesDirectory = resolve(parsed.get('--tables') ?? '');
  const rankEvidence = resolve(parsed.get('--rank-evidence') ?? '');
  const runtimeDefaults = resolve(
    parsed.get('--runtime-defaults') ??
      'tools/game-data-compiler/config/enemies/runtime-defaults.json',
  );
  const selectionCategories = resolve(
    parsed.get('--selection-categories') ??
      'tools/game-data-compiler/config/enemies/selection-categories.json',
  );
  if (!isAbsolute(tablesDirectory) || !isAbsolute(rankEvidence))
    throw new Error('--tables and --rank-evidence are required');
  return { tablesDirectory, rankEvidence, runtimeDefaults, selectionCategories };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    JSON.stringify(await auditCandidateEnemyDefinitions(parseArguments(process.argv.slice(2)))),
  );
}
