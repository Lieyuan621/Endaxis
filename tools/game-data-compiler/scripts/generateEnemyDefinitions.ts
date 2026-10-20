import { imageRefFromPath } from '../src/compiler/publication/imageResources.ts';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { ENEMY_LEVELS } from '../../../packages/game-data-contract/src/enemies.ts';
import { generateEnemyStageCatalog } from './generateEnemyStageCatalog.ts';
import { parseModifierTypeValue } from '../src/source/attributeModifiers.ts';
import { readEnemyBornBuffAttributes } from '../src/domains/enemy/bornBuffAttributes.ts';
import type { StageEnemyAttributes } from '../src/domains/enemy/spawnerAttributes.ts';

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
  readonly localeDirectory?: string;
  readonly buffDirectory: string;
  readonly spawnerDirectory: string;
  readonly check: boolean;
}

const DEFAULT_SELECTION_CATEGORIES = resolve(
  'tools/game-data-compiler/config/enemies/hidden-enemies.json',
);

interface EnemySelectionCatalog {
  readonly categories: readonly string[];
  readonly enemyOrder: readonly string[];
  readonly categoryByEnemyId: Readonly<Record<string, string>>;
  readonly hiddenEnemyIds: readonly string[];
}

interface EnemyDefinitionSource {
  readonly id: string;
  readonly gameId: string;
  readonly icon?: string;
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
  stageVariantIds: readonly string[] = [],
  buffDirectory?: string,
  stageAttributes: readonly StageEnemyAttributes[] = [],
) {
  const displayTable = await readTable(tablesDirectory, 'EnemyTemplateDisplayInfoTable');
  const enemyTable = await readTable(tablesDirectory, 'EnemyTable');
  for (const entry of stageAttributes) enemyTable[entry.id] = enemyTable[entry.enemyId];
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
  const selection = await readEnemySelectionCatalog(
    selectionCategoriesPath,
    gameIds,
    tablesDirectory,
  );
  const definitionIds = [...gameIds, ...stageVariantIds.filter(id => !gameIds.includes(id))];
  const hasModifiers = definitionIds.some(
    id =>
      requireArray(requireRecord(enemyTable[id], id).attrModifiers ?? [], `${id}.attrModifiers`)
        .length > 0,
  );
  const attributeMeta =
    hasModifiers || buffDirectory ? await readTable(tablesDirectory, 'AttributeMetaTable') : {};
  const bornAttributes = new Map<string, ReturnType<typeof readEnemyBornBuffAttributes>>();
  const spawnerAttributes = new Map<string, ReturnType<typeof readEnemyBornBuffAttributes>>();
  const deferredSpawnerAttributes: { enemyId: string; buffId: string; attributeType: number }[] =
    [];
  if (buffDirectory) {
    const ids = new Set(
      definitionIds.flatMap(id =>
        requireArray(requireRecord(enemyTable[id], id).bornBuffs ?? [], `${id}.bornBuffs`).map(
          buffId => requireString(buffId, `${id}.bornBuffs`),
        ),
      ),
    );
    for (const id of ids) {
      const path = join(buffDirectory, `${id}.json`);
      bornAttributes.set(
        id,
        readEnemyBornBuffAttributes(JSON.parse(await readFile(path, 'utf8')), path),
      );
    }
  }
  if (buffDirectory)
    for (const entry of stageAttributes) {
      const modifiers = [];
      for (const buff of entry.buffs) {
        const file = join(buffDirectory, `${buff.buffId}.json`);
        const overrides = Object.fromEntries(
          (buff.blackboard ?? [])
            .filter(value => !value.useString)
            .map(value => [value.key, value.valueFloat]),
        );
        for (const modifier of readEnemyBornBuffAttributes(
          JSON.parse(await readFile(file, 'utf8')),
          file,
          overrides,
        )) {
          // 第一阶段的 EnemyDefinition 仅承载固有属性；护盾等承伤倍率仍属于待定机制。
          if ([1, 3, 20, 21, 27, 31].includes(modifier.attrType)) modifiers.push(modifier);
          else
            deferredSpawnerAttributes.push({
              enemyId: entry.id,
              buffId: buff.buffId,
              attributeType: modifier.attrType,
            });
        }
      }
      spawnerAttributes.set(entry.id, modifiers);
    }
  const definitions = definitionIds.map(gameId => {
    const enemy = requireRecord(enemyTable[gameId], `EnemyTable.${gameId}`);
    const baseId = requireString(enemy.templateId, `${gameId}.enemy.templateId`);
    const applyModifiers = compileEnemyAttributeModifiers(
      [
        ...requireArray(enemy.attrModifiers ?? [], `${gameId}.attrModifiers`).map((raw, index) => {
          const modifier = requireRecord(raw, `${gameId}.attrModifiers[${index}]`);
          return {
            ...modifier,
            formulaItem: parseModifierTypeValue(
              modifier.modifierType,
              `${gameId}.attrModifiers[${index}].modifierType`,
            ),
          };
        }),
        ...requireArray(enemy.bornBuffs ?? [], `${gameId}.bornBuffs`).flatMap(
          id => bornAttributes.get(requireString(id, `${gameId}.bornBuffs`)) ?? [],
        ),
        ...(spawnerAttributes.get(gameId) ?? []),
      ],
      attributeMeta,
      gameId,
    );
    const display = requireRecord(displayTable[baseId], `EnemyTemplateDisplayInfoTable.${baseId}`);
    if (requireString(display.templateId, `${gameId}.display.templateId`) !== baseId) {
      throw new Error(`${gameId}: display template identity mismatch`);
    }
    const template = requireRecord(templateTable[baseId], `EnemyTemplateTable.${baseId}`);
    if (requireString(template.templateId, `${gameId}.template.templateId`) !== baseId) {
      throw new Error(`${gameId}: template identity mismatch`);
    }
    if (!stageVariantIds.includes(gameId) && baseId !== gameId) {
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
    const rankEntry = requireRecord(ranks[baseId], `${rankEvidencePath}.enemies.${baseId}`);
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
      const hp = requirePositive(
        applyModifiers(1, requireFinite(values.get(1), `${gameId}.hp[${index}]`)),
        `${gameId}.hp[${index}]`,
      );
      return {
        level,
        hp,
        defense: requireFiniteNonNegative(
          applyModifiers(3, requireFinite(values.get(3), `${gameId}.defense[${index}]`)),
          `${gameId}.defense[${index}]`,
        ),
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
    for (const [type, value] of independentValues)
      independentValues.set(type, applyModifiers(type, value));
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
      ...(iconAssetPath === undefined ? {} : { icon: imageRefFromPath(`/enemies/${baseId}.webp`) }),
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
          requireFinite(independentValues.get(21), `${gameId}.PoiseRecTime`) *
            (independentValues.has(31) ? independentValues.get(31)! : applyModifiers(31, 1)),
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
    if (!hiddenSelectionIds.has(definition.id) && !definition.icon) {
      throw new Error(`${definition.gameId}: selectable enemy has no icon`);
    }
  }

  const extraRanks = Object.keys(ranks).filter(gameId => !gameIds.includes(gameId));
  if (extraRanks.length > 0)
    throw new Error(`rank evidence has non-display enemies: ${extraRanks.join(', ')}`);
  return {
    definitions,
    deferredSpawnerAttributes,
    selection: {
      ...selection,
      hiddenEnemyIds: [
        ...selection.hiddenEnemyIds,
        ...stageVariantIds.map(id => id.replaceAll('_', '-')),
      ],
    },
    excludedDisplayIds,
    compatibilityDefaults: {
      knotBreakDurationSeconds,
      evidence: requireString(defaults.evidence, `${runtimeDefaultsPath}.evidence`),
    },
  };
}

export async function generateEnemyDefinitions(args: Arguments) {
  const stageCatalog = await generateEnemyStageCatalog(args);
  const stageVariantIds = [
    ...new Set(
      stageCatalog.stages.flatMap(stage =>
        stage.enemies
          .filter(enemy => enemy.definitionId !== null && !enemy.usesBaseDefinition)
          .map(
            enemy =>
              stageCatalog.stageAttributes.find(
                entry => entry.id.replaceAll('_', '-') === enemy.definitionId,
              )?.id ?? enemy.id,
          ),
      ),
    ),
  ];
  const plan = await planEnemyDefinitions(
    args.tablesDirectory,
    args.rankEvidence,
    args.runtimeDefaults,
    args.selectionCategories,
    stageVariantIds,
    args.buffDirectory,
    stageCatalog.stageAttributes,
  );
  const prettierConfig = (await resolveConfig(resolve('.prettierrc.json'))) ?? {};
  const requiredLevels = new Map<string, Set<number>>();
  for (const stage of stageCatalog.stages) {
    for (const enemy of stage.enemies) {
      if (enemy.definitionId === null || enemy.level === null) continue;
      const levels = requiredLevels.get(enemy.definitionId) ?? new Set<number>();
      levels.add(enemy.level);
      requiredLevels.set(enemy.definitionId, levels);
    }
  }
  const content = await format(
    renderDefinitions(
      plan.definitions,
      plan.selection,
      plan.compatibilityDefaults.evidence,
      requiredLevels,
    ),
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
    deferredSpawnerAttributes: plan.deferredSpawnerAttributes,
    stageCount: stageCatalog.stageCount,
    excludedDisplayIds: plan.excludedDisplayIds,
    compatibilityDefaults: plan.compatibilityDefaults,
    output,
  };
}

function renderDefinitions(
  definitions: readonly EnemyDefinitionSource[],
  selection: EnemySelectionCatalog,
  evidence: string,
  requiredLevels: ReadonlyMap<string, ReadonlySet<number>>,
): string {
  // Keep raw identities in the audit plan only; runtime references use the stable id.
  const runtimeDefinitions = definitions.map(({ gameId: _gameId, levelHp, ...definition }) => ({
    ...definition,
    levelHp: Object.fromEntries(
      [...new Set([...ENEMY_LEVELS, ...(requiredLevels.get(definition.id) ?? [])])]
        .sort((a, b) => a - b)
        .map(level => {
          const node = levelHp.find(node => node.level === level);
          if (node === undefined) throw new Error(`${definition.id}: missing HP at level ${level}`);
          return [level, node.hp];
        }),
    ),
  }));
  return `import type { EnemyDefinition } from '../../../core/game-data/enemyDefinition';

// knotBreakDurationSeconds is a project compatibility default: ${evidence}.
// Every other field below is compiled from the same source snapshot and strict rank evidence.
export const generatedEnemyDefinitions = ${JSON.stringify(runtimeDefinitions, null, 2)} as const satisfies readonly EnemyDefinition[];

export const generatedEnemySelectionOrder = ${JSON.stringify(selection.enemyOrder)} as const;
export const generatedEnemySelectionCategories = ${JSON.stringify(selection.categories, null, 2)} as const;
export const generatedEnemySelectionCategoryById = ${JSON.stringify(selection.categoryByEnemyId, null, 2)} as const satisfies Readonly<Record<string, (typeof generatedEnemySelectionCategories)[number]>>;
export const generatedHiddenEnemyIds = ${JSON.stringify(selection.hiddenEnemyIds, null, 2)} as const;
`;
}

async function readEnemySelectionCatalog(
  path: string,
  gameIds: readonly string[],
  tablesDirectory: string,
): Promise<EnemySelectionCatalog> {
  const source = requireRecord(JSON.parse(await readFile(path, 'utf8')), path);
  const groups = await readTable(tablesDirectory, 'WikiGroupTable');
  const entries = await readTable(tablesDirectory, 'WikiEntryTable');
  const data = await readTable(tablesDirectory, 'WikiEntryDataTable');
  const monster = requireRecord(groups.wiki_type_monster, 'WikiGroupTable.wiki_type_monster');
  const known = new Set(gameIds);
  const categories: string[] = [];
  const categoryByEnemyId: Record<string, string> = {};
  const enemyOrder: string[] = [];
  for (const raw of requireArray(monster.list, 'wiki_type_monster.list')) {
    const group = requireRecord(raw, 'wiki group');
    const id = requireString(group.groupId, 'wiki group.groupId');
    categories.push(id);
    const groupEntries = requireRecord(entries[id], `WikiEntryTable.${id}`);
    for (const entryId of requireArray(groupEntries.list, `${id}.list`)) {
      const key = requireString(entryId, `${id}.entryId`);
      const entry = requireRecord(data[key], `WikiEntryDataTable.${key}`);
      const enemyId = requireString(entry.refMonsterTemplateId, `${key}.refMonsterTemplateId`);
      if (!known.has(enemyId)) continue;
      const slug = enemyId.replaceAll('_', '-');
      if (entry.groupId !== id || categoryByEnemyId[slug])
        throw new Error(`${key}: conflicting wiki category`);
      categoryByEnemyId[slug] = id;
      enemyOrder.push(slug);
    }
  }
  const hiddenEnemyIds = requireArray(source.hiddenEnemyIds, `${path}.hiddenEnemyIds`).map(raw => {
    const id = requireString(raw, 'hidden enemy');
    if (!known.has(id)) throw new Error(`unknown hidden enemy ${id}`);
    return id.replaceAll('_', '-');
  });
  return { categories, categoryByEnemyId, enemyOrder, hiddenEnemyIds };
}

async function readTable(directory: string, name: string): Promise<Record<string, unknown>> {
  const path = join(directory, `${name}.json`);
  return requireRecord(JSON.parse(await readFile(path, 'utf8')), path);
}

/** EnemyTable 当前使用常规 Addition/Multiplier/FinalMultiplier；采用原生聚合顺序，未知槽不猜测。 */
function compileEnemyAttributeModifiers(
  raw: unknown,
  metadata: Record<string, unknown>,
  enemyId: string,
) {
  const slots = new Map<
    number,
    {
      addition: number;
      multiplier: number;
      finalAddition: number;
      finalMultiplier: number;
      baseAddition: number;
      baseMultiplier: number;
      baseFinalAddition: number;
      baseFinalMultiplier: number;
    }
  >();
  for (const [index, value] of requireArray(raw, `${enemyId}.attrModifiers`).entries()) {
    const label = `${enemyId}.attrModifiers[${index}]`;
    const modifier = requireRecord(value, label);
    if (modifier.modifyAttributeType !== 0) throw new Error(`${label}: expected Specific target`);
    const type = requireInteger(modifier.attrType, `${label}.attrType`);
    // 敌人主动攻击尚未模拟，Atk 修正不影响当前承伤目标的属性。
    if (![1, 2, 3, 20, 21, 27, 31].includes(type))
      throw new Error(`${label}: unsupported enemy attribute ${type}`);
    const slot = modifier.formulaItem;
    const amount = requireFinite(modifier.attrValue, `${label}.attrValue`);
    const aggregate = slots.get(type) ?? {
      addition: 0,
      multiplier: 1,
      finalAddition: 0,
      finalMultiplier: 1,
      baseAddition: 0,
      baseMultiplier: 1,
      baseFinalAddition: 0,
      baseFinalMultiplier: 1,
    };
    if (slot === 'Addition') aggregate.addition += amount;
    else if (slot === 'Multiplier') aggregate.multiplier += amount;
    else if (slot === 'FinalMultiplier') aggregate.finalMultiplier *= amount;
    else if (slot === 'FinalAddition') aggregate.finalAddition += amount;
    else if (slot === 'BaseAddition') aggregate.baseAddition += amount;
    else if (slot === 'BaseMultiplier') aggregate.baseMultiplier += amount;
    else if (slot === 'BaseFinalAddition') aggregate.baseFinalAddition += amount;
    else if (slot === 'BaseFinalMultiplier') aggregate.baseFinalMultiplier *= amount;
    else throw new Error(`${label}: unsupported enemy modifier slot ${slot}`);
    slots.set(type, aggregate);
  }
  return (type: number, value: number): number => {
    const modifier = slots.get(type);
    if (!modifier) return value;
    const meta = requireRecord(metadata[String(type)], `AttributeMetaTable.${type}`);
    const clamp = (value: number) =>
      Math.min(
        meta.hasMaxValue ? requireFinite(meta.maxValue, `${type}.maxValue`) : Infinity,
        Math.max(
          meta.hasMinValue ? requireFinite(meta.minValue, `${type}.minValue`) : -Infinity,
          value,
        ),
      );
    const armed = clamp(
      (clamp(value + modifier.baseAddition) * Math.max(0, modifier.baseMultiplier) +
        modifier.baseFinalAddition) *
        modifier.baseFinalMultiplier,
    );
    return clamp(
      ((armed + modifier.addition) * Math.max(0, modifier.multiplier) + modifier.finalAddition) *
        modifier.finalMultiplier,
    );
  };
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
  if (
    !parsed.has('--tables') ||
    !parsed.has('--rank-evidence') ||
    !parsed.has('--buff-directory') ||
    !parsed.has('--spawner-directory')
  )
    throw new Error(
      '--tables, --rank-evidence, --buff-directory and --spawner-directory are required',
    );
  return {
    tablesDirectory,
    rankEvidence,
    runtimeDefaults,
    selectionCategories,
    outputDirectory,
    buffDirectory: resolve(parsed.get('--buff-directory')!),
    spawnerDirectory: resolve(parsed.get('--spawner-directory')!),
    check,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    JSON.stringify(await generateEnemyDefinitions(parseArguments(process.argv.slice(2)))),
  );
}
