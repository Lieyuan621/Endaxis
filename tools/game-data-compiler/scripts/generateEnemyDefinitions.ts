import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { ENEMY_LEVELS } from '../../../packages/game-data-contract/src/enemies.ts';

const TIER_BY_DISPLAY_TYPE = {
  0: 'normal',
  1: 'elite',
  2: 'leader',
  3: 'advanced',
  4: 'boss',
} as const;

interface Arguments {
  readonly tablesDirectory: string;
  readonly rankEvidence: string;
  readonly runtimeDefaults: string;
  readonly selectionCategories?: string;
  readonly outputDirectory: string;
  readonly check: boolean;
}

const DEFAULT_SELECTION_CATEGORIES = resolve(
  'tools/game-data-compiler/config/enemies/selection-categories.json',
);

interface EnemySelectionCatalog {
  readonly categories: readonly string[];
  readonly categoryByEnemyId: Readonly<Record<string, string>>;
  readonly hiddenEnemyIds: readonly string[];
}

interface EnemyDefinitionSource {
  readonly id: string;
  readonly gameId: string;
  readonly iconPath?: string;
  readonly tier: (typeof TIER_BY_DISPLAY_TYPE)[keyof typeof TIER_BY_DISPLAY_TYPE];
  readonly rank: 'mob' | 'boss' | 'elite';
  readonly levelHp: readonly { readonly level: number; readonly hp: number }[];
  readonly defense: number;
  readonly resistances: Readonly<
    Record<'physical' | 'heat' | 'cryo' | 'electric' | 'nature', number>
  >;
  readonly superArmor: number;
  readonly stagger: {
    readonly maximum: number;
    readonly knotThresholds: readonly number[];
    readonly knotBreakDurationSeconds: number;
    readonly brokenDurationSeconds: number;
    readonly finisherSpRecovery: number;
  };
  readonly finisherMultiplier: number;
}

export async function planEnemyDefinitions(
  tablesDirectory: string,
  rankEvidencePath: string,
  runtimeDefaultsPath: string,
  selectionCategoriesPath = DEFAULT_SELECTION_CATEGORIES,
) {
  const displayTable = await readTable(tablesDirectory, 'EnemyTemplateDisplayInfoTable');
  const enemyTable = await readTable(tablesDirectory, 'EnemyTable');
  const attributeTable = await readTable(tablesDirectory, 'EnemyAttributeTemplateTable');
  const templateTable = await readTable(tablesDirectory, 'EnemyTemplateTable');
  const rankDocument = requireRecord(
    JSON.parse(await readFile(rankEvidencePath, 'utf8')),
    rankEvidencePath,
  );
  const ranks = requireRecord(rankDocument.enemies, `${rankEvidencePath}.enemies`);
  const defaults = requireRecord(
    JSON.parse(await readFile(runtimeDefaultsPath, 'utf8')),
    runtimeDefaultsPath,
  );
  const knotBreakDurationSeconds = requireFiniteNonNegative(
    defaults.knotBreakDurationSeconds,
    `${runtimeDefaultsPath}.knotBreakDurationSeconds`,
  );

  const gameIds = Object.keys(displayTable)
    .filter(gameId => gameId.startsWith('eny_'))
    .sort((left, right) => left.localeCompare(right));
  const excludedDisplayIds = Object.keys(displayTable)
    .filter(gameId => !gameId.startsWith('eny_'))
    .sort((left, right) => left.localeCompare(right));
  const selection = await readEnemySelectionCatalog(selectionCategoriesPath, gameIds);
  const definitions = gameIds.map(gameId => {
    const display = requireRecord(displayTable[gameId], `EnemyTemplateDisplayInfoTable.${gameId}`);
    if (requireString(display.templateId, `${gameId}.display.templateId`) !== gameId) {
      throw new Error(`${gameId}: display template identity mismatch`);
    }
    const template = requireRecord(templateTable[gameId], `EnemyTemplateTable.${gameId}`);
    if (requireString(template.templateId, `${gameId}.template.templateId`) !== gameId) {
      throw new Error(`${gameId}: template identity mismatch`);
    }
    const enemy = requireRecord(enemyTable[gameId], `EnemyTable.${gameId}`);
    if (requireString(enemy.templateId, `${gameId}.enemy.templateId`) !== gameId) {
      throw new Error(`${gameId}: enemy template identity mismatch`);
    }
    const attributeTemplateId = requireString(
      enemy.attrTemplateId,
      `${gameId}.enemy.attrTemplateId`,
    );
    const attributes = requireRecord(
      attributeTable[attributeTemplateId],
      `EnemyAttributeTemplateTable.${attributeTemplateId}`,
    );
    const rankEntry = requireRecord(ranks[gameId], `${rankEvidencePath}.enemies.${gameId}`);
    const rank = requireRank(rankEntry.rank, `${gameId}.rank`);
    const iconAssetPath = optionalString(rankEntry.iconAssetPath, `${gameId}.iconAssetPath`);
    const displayType = requireInteger(display.displayType, `${gameId}.displayType`);
    const tier = TIER_BY_DISPLAY_TYPE[displayType as keyof typeof TIER_BY_DISPLAY_TYPE];
    if (tier === undefined) throw new Error(`${gameId}: unknown displayType ${displayType}`);

    const levelHp = requireArray(
      attributes.levelDependentAttributes,
      `${gameId}.levelDependentAttributes`,
    ).map((rawNode, index) => {
      const node = requireRecord(rawNode, `${gameId}.levelDependentAttributes[${index}]`);
      const values = attributeValueMap(
        node.attrs,
        `${gameId}.levelDependentAttributes[${index}].attrs`,
      );
      const level = requirePositiveInteger(values.get(0), `${gameId}.level[${index}]`);
      const hp = requirePositive(values.get(1), `${gameId}.hp[${index}]`);
      return {
        level,
        hp,
        defense: requireFiniteNonNegative(values.get(3), `${gameId}.defense[${index}]`),
      };
    });
    if (levelHp.length === 0) throw new Error(`${gameId}: no level-dependent attributes`);
    for (let index = 0; index < levelHp.length; index += 1) {
      if (levelHp[index].level !== index + 1)
        throw new Error(`${gameId}: levels are not contiguous from 1`);
    }
    const defenseValues = new Set(levelHp.map(node => node.defense));
    if (defenseValues.size !== 1)
      throw new Error(`${gameId}: defense varies by level and cannot fit EnemyDefinition`);

    const independent = requireRecord(
      attributes.levelIndependentAttributes,
      `${gameId}.levelIndependentAttributes`,
    );
    const independentValues = attributeValueMap(
      independent.attrs,
      `${gameId}.levelIndependentAttributes.attrs`,
    );
    const knotThresholds = requireArray(
      attributes.poiseKnotPctList,
      `${gameId}.poiseKnotPctList`,
    ).map((value, index) => requireUnitInterval(value, `${gameId}.poiseKnotPctList[${index}]`));
    let previousThreshold = 0;
    for (const threshold of knotThresholds) {
      if (threshold <= previousThreshold)
        throw new Error(`${gameId}: poise knot thresholds are not increasing`);
      previousThreshold = threshold;
    }
    const knotBuffs = requireArray(attributes.poiseKnotBuffList, `${gameId}.poiseKnotBuffList`);
    // Some templates keep one dormant default Buff while declaring no knot threshold.
    // Once thresholds exist, the table must provide one native Buff identity per knot.
    if (knotThresholds.length > 0 && knotBuffs.length !== knotThresholds.length) {
      throw new Error(`${gameId}: poise knot threshold/buff counts differ`);
    }

    return {
      id: gameId.replaceAll('_', '-'),
      gameId,
      ...(iconAssetPath === undefined ? {} : { iconPath: `/enemies/${gameId}.webp` }),
      tier,
      rank,
      levelHp: levelHp.map(({ level, hp }) => ({ level, hp })),
      defense: levelHp[0].defense,
      resistances: {
        physical: requireFinite(attributes.physicalResistance, `${gameId}.physicalResistance`),
        heat: requireFinite(attributes.fireResistance, `${gameId}.fireResistance`),
        cryo: requireFinite(attributes.crystResistance, `${gameId}.crystResistance`),
        electric: requireFinite(attributes.pulseResistance, `${gameId}.pulseResistance`),
        nature: requireFinite(attributes.naturalResistance, `${gameId}.naturalResistance`),
      },
      superArmor: requireFiniteNonNegative(
        attributes.initialSuperArmor,
        `${gameId}.initialSuperArmor`,
      ),
      stagger: {
        maximum: requireFiniteNonNegative(independentValues.get(20), `${gameId}.maximumPoise`),
        knotThresholds,
        knotBreakDurationSeconds,
        brokenDurationSeconds: requireFiniteNonNegative(
          independentValues.get(21),
          `${gameId}.brokenDuration`,
        ),
        finisherSpRecovery: requireFiniteNonNegative(
          attributes.breakingAttackedAtbObtain,
          `${gameId}.finisherSpRecovery`,
        ),
      },
      finisherMultiplier: requireFiniteNonNegative(
        independentValues.get(27),
        `${gameId}.finisherMultiplier`,
      ),
    } satisfies EnemyDefinitionSource;
  });

  const hiddenSelectionIds = new Set(selection.hiddenEnemyIds);
  for (const definition of definitions) {
    if (!hiddenSelectionIds.has(definition.id) && !definition.iconPath) {
      throw new Error(`${definition.gameId}: selectable enemy has no icon`);
    }
  }

  const extraRanks = Object.keys(ranks).filter(gameId => !gameIds.includes(gameId));
  if (extraRanks.length > 0)
    throw new Error(`rank evidence has non-display enemies: ${extraRanks.join(', ')}`);
  return {
    definitions,
    selection,
    excludedDisplayIds,
    compatibilityDefaults: {
      knotBreakDurationSeconds,
      evidence: requireString(defaults.evidence, `${runtimeDefaultsPath}.evidence`),
    },
  };
}

export async function generateEnemyDefinitions(args: Arguments) {
  const plan = await planEnemyDefinitions(
    args.tablesDirectory,
    args.rankEvidence,
    args.runtimeDefaults,
    args.selectionCategories,
  );
  const prettierConfig = (await resolveConfig(resolve('.prettierrc.json'))) ?? {};
  const content = await format(
    renderDefinitions(plan.definitions, plan.selection, plan.compatibilityDefaults.evidence),
    {
      ...prettierConfig,
      parser: 'typescript',
    },
  );
  const output = join(args.outputDirectory, 'index.generated.ts');
  if (args.check) {
    const existing = await readFile(output, 'utf8');
    if (existing !== content) throw new Error(`${output}: generated enemy definitions are stale`);
  } else {
    await mkdir(args.outputDirectory, { recursive: true });
    await writeFile(output, content, 'utf8');
  }
  return {
    definitionCount: plan.definitions.length,
    excludedDisplayIds: plan.excludedDisplayIds,
    compatibilityDefaults: plan.compatibilityDefaults,
    output,
  };
}

function renderDefinitions(
  definitions: readonly EnemyDefinitionSource[],
  selection: EnemySelectionCatalog,
  evidence: string,
): string {
  // Keep raw identities in the audit plan only; runtime references use the stable id.
  const runtimeDefinitions = definitions.map(({ gameId: _gameId, levelHp, ...definition }) => ({
    ...definition,
    levelHp: ENEMY_LEVELS.map(level => {
      const node = levelHp.find(node => node.level === level);
      if (node === undefined) throw new Error(`${definition.id}: missing HP at level ${level}`);
      return node.hp;
    }),
  }));
  return `import type { EnemyDefinition } from '../../../core/game-data/enemyDefinition';

// knotBreakDurationSeconds is a project compatibility default: ${evidence}.
// Every other field below is compiled from the same source snapshot and strict rank evidence.
export const generatedEnemyDefinitions = ${JSON.stringify(runtimeDefinitions, null, 2)} as const satisfies readonly EnemyDefinition[];

export const generatedEnemySelectionCategories = ${JSON.stringify(selection.categories, null, 2)} as const;
export const generatedEnemySelectionCategoryById = ${JSON.stringify(selection.categoryByEnemyId, null, 2)} as const satisfies Readonly<Record<string, (typeof generatedEnemySelectionCategories)[number]>>;
export const generatedHiddenEnemyIds = ${JSON.stringify(selection.hiddenEnemyIds, null, 2)} as const;
`;
}

async function readEnemySelectionCatalog(
  path: string,
  gameIds: readonly string[],
): Promise<EnemySelectionCatalog> {
  const source = requireRecord(JSON.parse(await readFile(path, 'utf8')), path);
  const categories = requireArray(source.categories, `${path}.categories`);
  const categoryIds: string[] = [];
  const categoryByEnemyId: Record<string, string> = {};
  const assigned = new Set<string>();
  const known = new Set(gameIds);
  function claim(rawId: unknown, label: string): string {
    const gameId = requireString(rawId, label);
    if (!known.has(gameId)) throw new Error(`${label}: unknown enemy ${gameId}`);
    if (assigned.has(gameId)) throw new Error(`${label}: duplicate enemy ${gameId}`);
    assigned.add(gameId);
    return gameId.replaceAll('_', '-');
  }
  categories.forEach((rawCategory, categoryIndex) => {
    const label = `${path}.categories[${categoryIndex}]`;
    const category = requireRecord(rawCategory, label);
    const id = requireString(category.id, `${label}.id`);
    if (!/^[a-z][A-Za-z0-9]*$/.test(id) || categoryIds.includes(id))
      throw new Error(`${label}.id: invalid or duplicate category ${id}`);
    categoryIds.push(id);
    for (const [enemyIndex, rawId] of requireArray(category.enemyIds, `${label}.enemyIds`).entries()) {
      categoryByEnemyId[claim(rawId, `${label}.enemyIds[${enemyIndex}]`)] = id;
    }
  });
  for (const [index, rawId] of requireArray(source.uncategorizedEnemyIds, `${path}.uncategorizedEnemyIds`).entries()) {
    claim(rawId, `${path}.uncategorizedEnemyIds[${index}]`);
  }
  const hiddenEnemyIds = requireArray(source.hiddenEnemyIds, `${path}.hiddenEnemyIds`).map(
    (rawId, index) => claim(rawId, `${path}.hiddenEnemyIds[${index}]`),
  );
  const missing = gameIds.filter(gameId => !assigned.has(gameId));
  if (missing.length) throw new Error(`${path}: unclassified enemies ${missing.join(', ')}`);
  return { categories: categoryIds, categoryByEnemyId, hiddenEnemyIds };
}

async function readTable(directory: string, name: string): Promise<Record<string, unknown>> {
  const path = join(directory, `${name}.json`);
  return requireRecord(JSON.parse(await readFile(path, 'utf8')), path);
}

function attributeValueMap(value: unknown, label: string): Map<number, number> {
  const result = new Map<number, number>();
  requireArray(value, label).forEach((raw, index) => {
    const item = requireRecord(raw, `${label}[${index}]`);
    const type = requireInteger(item.attrType, `${label}[${index}].attrType`);
    const attrValue = requireFinite(item.attrValue, `${label}[${index}].attrValue`);
    if (result.has(type)) throw new Error(`${label}: duplicate attrType ${type}`);
    result.set(type, attrValue);
  });
  return result;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${label}: expected object`);
  return value as Record<string, unknown>;
}
function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}: expected array`);
  return value;
}
function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`${label}: expected non-empty string`);
  return value;
}
function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return requireString(value, label);
}
function requireFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`${label}: expected finite number`);
  return value;
}
function requireFiniteNonNegative(value: unknown, label: string): number {
  const parsed = requireFinite(value, label);
  if (parsed < 0) throw new Error(`${label}: expected non-negative number`);
  return parsed;
}
function requirePositive(value: unknown, label: string): number {
  const parsed = requireFinite(value, label);
  if (parsed <= 0) throw new Error(`${label}: expected positive number`);
  return parsed;
}
function requireInteger(value: unknown, label: string): number {
  const parsed = requireFinite(value, label);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label}: expected safe integer`);
  return parsed;
}
function requirePositiveInteger(value: unknown, label: string): number {
  const parsed = requireInteger(value, label);
  if (parsed <= 0) throw new Error(`${label}: expected positive integer`);
  return parsed;
}
function requireUnitInterval(value: unknown, label: string): number {
  const parsed = requireFinite(value, label);
  if (parsed <= 0 || parsed >= 1)
    throw new Error(`${label}: expected number strictly between 0 and 1`);
  return parsed;
}
function requireRank(value: unknown, label: string): 'mob' | 'boss' | 'elite' {
  if (value !== 'mob' && value !== 'boss' && value !== 'elite')
    throw new Error(`${label}: invalid enemy rank`);
  return value;
}

function parseArguments(values: readonly string[]): Arguments {
  let check = false;
  const parsed = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === '--check') {
      check = true;
      continue;
    }
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--'))
      throw new Error('expected --key value arguments');
    parsed.set(key, value);
    index += 1;
  }
  const tablesDirectory = resolve(parsed.get('--tables') ?? '');
  const rankEvidence = resolve(parsed.get('--rank-evidence') ?? '');
  const runtimeDefaults = resolve(
    parsed.get('--runtime-defaults') ??
      'tools/game-data-compiler/config/enemies/runtime-defaults.json',
  );
  const selectionCategories = resolve(
    parsed.get('--selection-categories') ?? DEFAULT_SELECTION_CATEGORIES,
  );
  const outputDirectory = resolve(parsed.get('--output') ?? 'src/data/enemies/generated');
  if (!isAbsolute(tablesDirectory) || !isAbsolute(rankEvidence))
    throw new Error('--tables and --rank-evidence are required');
  return { tablesDirectory, rankEvidence, runtimeDefaults, selectionCategories, outputDirectory, check };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    JSON.stringify(await generateEnemyDefinitions(parseArguments(process.argv.slice(2)))),
  );
}
