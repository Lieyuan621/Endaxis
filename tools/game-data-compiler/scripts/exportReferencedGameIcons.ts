import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { runConcurrent } from './downloadGameDataSources.ts';
import { AkedbSnapshot, DEFAULT_CDN, isMissingResource } from './gameDataProviders.ts';
import { readGameIconReferences } from '../src/compiler/publication/gameIconReferences.ts';
import { requireRecord, requireNonEmptyString } from '../src/source/primitives.ts';

type Candidate = {
  readonly assetIndex: number;
  readonly path: string;
  readonly rawUrl: string;
};

type RichTextSourceManifest = Readonly<Record<string, readonly string[]>>;

type IconReference = {
  readonly publicPath: string;
  readonly sourceNames: readonly string[];
  readonly preferredPathSegments: readonly string[];
  readonly referencedBy: readonly string[];
  readonly localOnly?: boolean;
};

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'src');
const TMP_ROOT = path.join(PROJECT_ROOT, 'tmp', 'referenced-game-icons');
const RICH_TEXT_SOURCE_MANIFEST = path.join(TMP_ROOT, 'rich-text-icon-sources.json');
const REPORT_PATH = path.join(TMP_ROOT, 'audit.json');
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.scss', '.ts', '.tsx', '.vue']);
const WEAPON_OUTPUT_TO_NATIVE_PREFIX = new Map([
  ['wpn_greatsword_', 'wpn_claym_'],
  ['wpn_polearm_', 'wpn_lance_'],
  ['wpn_handcannon_', 'wpn_pistol_'],
  ['wpn_artsunit_', 'wpn_funnel_'],
]);
const PUBLIC_ICON_SOURCE_ALIASES = new Map<
  string,
  { readonly sourceName: string; readonly preferredPathSegment: string }
>([
  [
    '/icons/icon_battle_affix_combo.webp',
    { sourceName: 'icon_term_ba_combo.png', preferredPathSegment: '/termicon/' },
  ],
  [
    '/icons/icon_battle_debuff_burning.webp',
    { sourceName: 'icon_battle_burning.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_debuff_conduct.webp',
    { sourceName: 'icon_battle_conduct.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_debuff_corrupt.webp',
    { sourceName: 'icon_battle_corrupt.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_debuff_crystbreak.webp',
    { sourceName: 'icon_term_ba_crystbreak.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_debuff_frozen.webp',
    { sourceName: 'icon_battle_frozen.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_physical_airborne.webp',
    { sourceName: 'airborne.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_physical_crush.webp',
    { sourceName: 'icon_term_ba_crush.png', preferredPathSegment: '/termicon/' },
  ],
  [
    '/icons/icon_battle_physical_fracture.webp',
    { sourceName: 'icon_battle_fracture.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_physical_knockdown.webp',
    { sourceName: 'knockdown.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_battle_physical_no_guard.webp',
    { sourceName: 'icon_battle_no_guard.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_burst_fusion_cryst.webp',
    { sourceName: 'icon_energy_fusion_cryst.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_burst_fusion_fire.webp',
    { sourceName: 'icon_energy_fusion_fire.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_burst_fusion_nature.webp',
    { sourceName: 'icon_infliction_nature.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_burst_fusion_pulse.webp',
    { sourceName: 'icon_energy_fusion_pulse.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/icon_element_cryo.webp',
    { sourceName: 'icon_charattrtype_cold.png', preferredPathSegment: '/elementicon/' },
  ],
  [
    '/icons/icon_element_electric.webp',
    { sourceName: 'icon_charattrtype_pulse.png', preferredPathSegment: '/elementicon/' },
  ],
  [
    '/icons/icon_element_heat.webp',
    { sourceName: 'icon_charattrtype_fire.png', preferredPathSegment: '/elementicon/' },
  ],
  [
    '/icons/icon_element_nature.webp',
    { sourceName: 'icon_charattrtype_nature.png', preferredPathSegment: '/elementicon/' },
  ],
  [
    '/icons/icon_element_physical.webp',
    { sourceName: 'icon_charattrtype_physical.png', preferredPathSegment: '/elementicon/' },
  ],
  [
    '/icons/icon_energy_fusion_nature.webp',
    { sourceName: 'icon_infliction_nature.png', preferredPathSegment: '/bufficon/' },
  ],
  [
    '/icons/setting_tab_setting.webp',
    { sourceName: 'setting_tab_setting.png', preferredPathSegment: '/gamesetting/' },
  ],
]);

export type ExportGameIconsArguments = {
  readonly workers: number;
  readonly sourceMode: 'hybrid' | 'vfs-only';
  readonly cdn: string;
  readonly overwrite: boolean;
  readonly dryRun: boolean;
  readonly refreshRichText: boolean;
  readonly prune: boolean;
  readonly vfsBaseUrl: string;
  readonly gameDataSourceRoot: string;
  readonly outputRoot: string;
  /** 额外扫描尚未发布的候选定义；不改变正式 src 的默认闭包。 */
  readonly additionalReferenceRoots: readonly string[];
  readonly auditOutput?: string;
};

export function parseArguments(argv: readonly string[]): ExportGameIconsArguments {
  let workers = 6;
  let sourceMode: 'hybrid' | 'vfs-only' = 'hybrid';
  let cdn = DEFAULT_CDN;
  let overwrite = false;
  let dryRun = false;
  let refreshRichText = false;
  let prune = false;
  let vfsBaseUrl = 'http://127.0.0.1:8765';
  let gameDataSourceRoot = path.join(PROJECT_ROOT, 'tmp', 'game-data-sources');
  let outputRoot = PUBLIC_ROOT;
  const additionalReferenceRoots: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--workers') {
      workers = Number(requireArgumentValue(argv, ++index, argument));
      if (!Number.isSafeInteger(workers) || workers <= 0)
        throw new Error('--workers requires a positive integer');
    } else if (argument === '--overwrite') overwrite = true;
    else if (argument === '--dry-run') dryRun = true;
    else if (argument === '--refresh-rich-text') refreshRichText = true;
    else if (argument === '--skip-rich-text-refresh') refreshRichText = false;
    else if (argument === '--prune') prune = true;
    else if (argument === '--vfs-base-url')
      vfsBaseUrl = requireArgumentValue(argv, ++index, argument);
    else if (argument === '--cdn') cdn = requireArgumentValue(argv, ++index, argument);
    else if (argument === '--source-mode') {
      const mode = requireArgumentValue(argv, ++index, argument);
      if (mode !== 'hybrid' && mode !== 'vfs-only') throw new Error('invalid --source-mode');
      sourceMode = mode;
    } else if (argument === '--game-data-source-root') {
      gameDataSourceRoot = path.resolve(requireArgumentValue(argv, ++index, argument));
    } else if (argument === '--output-root') {
      outputRoot = path.resolve(requireArgumentValue(argv, ++index, argument));
    } else if (argument === '--additional-reference-root') {
      additionalReferenceRoots.push(path.resolve(requireArgumentValue(argv, ++index, argument)));
    } else throw new Error(`unknown argument: ${argument}`);
  }
  return {
    workers,
    sourceMode,
    cdn,
    overwrite,
    dryRun,
    refreshRichText,
    prune,
    vfsBaseUrl,
    gameDataSourceRoot,
    outputRoot,
    additionalReferenceRoots,
  };
}

function requireArgumentValue(argv: readonly string[], index: number, option: string): string {
  const value = argv[index];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(
    entries.map(entry => {
      const child = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(child) : [child];
    }),
  );
  return children.flat();
}

function isRuntimeReferenceSource(root: string, filePath: string): boolean {
  const relative = path.relative(root, filePath).replaceAll('\\', '/');
  return (
    TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase()) &&
    !relative.includes('/__snapshots__/') &&
    !/(^|\/)[^/]+\.(?:bench|spec|test)\.[^/]+$/u.test(relative)
  );
}

async function collectLiteralReferences(
  additionalRoots: readonly string[],
): Promise<Map<string, Set<string>>> {
  const references = new Map<string, Set<string>>();
  const roots = [SOURCE_ROOT, ...additionalRoots];
  const files = (
    await Promise.all(
      roots.map(async root => ({
        root,
        files: (await listFiles(root)).filter(file => isRuntimeReferenceSource(root, file)),
      })),
    )
  ).flatMap(entry => entry.files.map(file => ({ root: entry.root, file })));
  await Promise.all(
    files.map(async ({ file: filePath }) => {
      const source = await readFile(filePath, 'utf8');
      const relative = path.relative(PROJECT_ROOT, filePath).replaceAll('\\', '/');
      for (const publicPath of readGameIconReferences(source)) {
        const owners = references.get(publicPath) ?? new Set<string>();
        owners.add(relative);
        references.set(publicPath, owners);
      }
    }),
  );
  return references;
}

async function runRichTextExporter(refreshRichText: boolean): Promise<void> {
  await mkdir(TMP_ROOT, { recursive: true });
  const script = path.join(import.meta.dirname, 'exportGameLocales.py');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'python' : 'python3',
      [
        script,
        '--icon-source-manifest',
        RICH_TEXT_SOURCE_MANIFEST,
        ...(refreshRichText ? [] : ['--icon-source-manifest-only']),
      ],
      { cwd: PROJECT_ROOT, stdio: 'inherit' },
    );
    child.once('error', reject);
    child.once('exit', code =>
      code === 0 ? resolve() : reject(new Error(`rich text locale exporter exited with ${code}`)),
    );
  });
}

async function readRichTextSourceManifest(): Promise<RichTextSourceManifest> {
  if (!(await exists(RICH_TEXT_SOURCE_MANIFEST))) return {};
  return JSON.parse(await readFile(RICH_TEXT_SOURCE_MANIFEST, 'utf8')) as RichTextSourceManifest;
}

async function findTableDirectory(sourceRoot: string): Promise<string> {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const candidates = entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('TableCfg-'))
    .map(entry => path.join(sourceRoot, entry.name))
    .sort();
  const result = candidates.at(-1);
  if (!result) throw new Error(`no TableCfg-* directory under ${sourceRoot}`);
  return result;
}

export async function addOperatorImpliedReferences(
  references: Map<string, Set<string>>,
  sourceRoot: string,
  configPath = path.join(PROJECT_ROOT, 'tools/game-data-compiler/config/operators.json'),
): Promise<Map<string, { sourceNames: string[]; preferredPathSegments: string[] }>> {
  const overrides = new Map<string, { sourceNames: string[]; preferredPathSegments: string[] }>();
  const config = JSON.parse(await readFile(configPath, 'utf8')) as {
    operators: Array<{
      slug: string;
      charId: string;
      assets?: unknown;
      skills: Array<{ key: string; source: string }>;
      skillGroups: Array<{ skillType: string }>;
    }>;
  };
  const tableDirectory = await findTableDirectory(sourceRoot);
  const growthTable = JSON.parse(
    await readFile(path.join(tableDirectory, 'CharGrowthTable.json'), 'utf8'),
  ) as Record<
    string,
    {
      talentNodeMap?: Record<
        string,
        { passiveSkillNodeInfo?: { iconId?: string; index?: number; level?: number } }
      >;
    }
  >;

  for (const publicPath of ['/operators/default.webp', '/equipment/default.webp']) {
    references.set(publicPath, new Set(['project fallback']));
  }

  for (const operator of config.operators) {
    const owner = path.relative(PROJECT_ROOT, configPath).replaceAll('\\', '/');
    const assetPath = `${owner}:${operator.slug}.assets`;
    const assets = operator.assets === undefined ? {} : requireRecord(operator.assets, assetPath);
    const add = (fileName: string, sourceName: string, preferredPathSegment: string): void => {
      const validOutputName =
        /^[a-zA-Z0-9_-]+$/.test(fileName) || /^talent [1-9][0-9]*$/.test(fileName);
      if (!validOutputName || !/^[a-zA-Z0-9_-]+$/.test(sourceName)) {
        throw new Error(`${assetPath}: icon output and source must be plain file names`);
      }
      if (!/^\/[a-zA-Z0-9_/-]+\/$/.test(preferredPathSegment)) {
        throw new Error(`${assetPath}: invalid preferred icon directory`);
      }
      const publicPath = `/operators/${operator.slug}/${fileName}.webp`;
      const owners = references.get(publicPath) ?? new Set<string>();
      owners.add(owner);
      references.set(publicPath, owners);
      overrides.set(publicPath, {
        sourceNames: [`${sourceName}.png`],
        preferredPathSegments: [preferredPathSegment],
      });
    };
    const assetCharacterId =
      assets.portraitCharacterId === undefined
        ? operator.charId
        : requireNonEmptyString(assets.portraitCharacterId, `${assetPath}.portraitCharacterId`);
    add('avatar', `icon_round_${assetCharacterId}`, '/charroundicon/');
    add('portrait', `icon_${assetCharacterId}`, '/charicon/');
    for (const [skillKey, outputName] of [
      ['battleSkill', 'battle'],
      ['comboSkill', 'combo'],
      ['ultimate', 'ultimate'],
    ] as const) {
      if (!operator.skillGroups.some(group => group.skillType === skillKey)) continue;
      const nativeCharacterName = operator.charId.split('_').slice(2).join('_');
      const conventionalIconId =
        skillKey === 'comboSkill'
          ? `icon_combo_skill_${nativeCharacterName}_01`
          : skillKey === 'ultimate'
            ? `icon_ultimate_skill_${nativeCharacterName}_01`
            : `icon_skill_${nativeCharacterName}_01`;
      add(outputName, conventionalIconId, '/skillicon/');
    }
    const talentIcons = new Map<number, string>();
    const icons =
      assets.icons === undefined ? {} : requireRecord(assets.icons, `${assetPath}.icons`);
    for (const [fileName, value] of Object.entries(icons)) {
      const icon = requireRecord(value, `${assetPath}.icons.${fileName}`);
      add(
        fileName,
        requireNonEmptyString(icon.sourceName, `${assetPath}.icons.${fileName}.sourceName`),
        requireNonEmptyString(
          icon.preferredPathSegment,
          `${assetPath}.icons.${fileName}.preferredPathSegment`,
        ),
      );
    }
    for (const node of Object.values(growthTable[operator.charId]?.talentNodeMap ?? {})) {
      const passive = node.passiveSkillNodeInfo;
      if (!passive?.iconId || passive.level !== 1 || passive.index === undefined) continue;
      talentIcons.set(passive.index, passive.iconId);
    }
    for (const [index, iconId] of [...talentIcons].sort(([left], [right]) => left - right)) {
      add(`talent ${index + 1}`, iconId, '/skillicon/');
    }
  }
  return overrides;
}

function reverseWeaponIdentity(outputStem: string): string {
  for (const [outputPrefix, nativePrefix] of WEAPON_OUTPUT_TO_NATIVE_PREFIX) {
    if (outputStem.startsWith(outputPrefix)) return outputStem.replace(outputPrefix, nativePrefix);
  }
  return outputStem;
}

export async function addEquipmentConfiguredReferences(
  references: Map<string, Set<string>>,
  configPath = path.join(PROJECT_ROOT, 'tools/game-data-compiler/config/equipmentAssets.json'),
): Promise<Map<string, { sourceNames: string[]; preferredPathSegments: string[] }>> {
  const config = requireRecord(JSON.parse(await readFile(configPath, 'utf8')), configPath);
  const result = new Map<string, { sourceNames: string[]; preferredPathSegments: string[] }>();
  for (const category of ['weapons', 'gears', 'gearSets']) {
    for (const [id, value] of Object.entries(
      requireRecord(config[category], `${configPath}.${category}`),
    )) {
      const owner = `${path.relative(PROJECT_ROOT, configPath).replaceAll('\\', '/')}:${category}.${id}`;
      for (const [publicPath, raw] of Object.entries(requireRecord(value, owner))) {
        const icon = requireRecord(raw, `${owner}.${publicPath}`);
        const sourceName = requireNonEmptyString(icon.sourceName, `${owner}.sourceName`);
        const segment = requireNonEmptyString(
          icon.preferredPathSegment,
          `${owner}.preferredPathSegment`,
        );
        if (
          !/^\/(?:icons|weapons|equipment)\/[a-zA-Z0-9_/-]+\.webp$/.test(publicPath) ||
          !/^[a-zA-Z0-9_-]+\.png$/.test(sourceName) ||
          !/^\/[a-zA-Z0-9_/-]+\/$/.test(segment)
        ) {
          throw new Error(`${owner}: invalid configured icon path`);
        }
        const reference = references.get(publicPath);
        if (reference === undefined) continue;
        const planned = { sourceNames: [sourceName], preferredPathSegments: [segment] };
        const previous = result.get(publicPath);
        if (previous !== undefined && JSON.stringify(previous) !== JSON.stringify(planned)) {
          throw new Error(`${owner}: conflicting icon sources for ${publicPath}`);
        }
        result.set(publicPath, planned);
        reference.add(owner);
      }
    }
  }
  return result;
}

function sourcePlanForReference(
  publicPath: string,
  richTextSources: RichTextSourceManifest,
  configuredOverrides: ReadonlyMap<
    string,
    { sourceNames: string[]; preferredPathSegments: string[] }
  >,
): Pick<IconReference, 'sourceNames' | 'preferredPathSegments' | 'localOnly'> {
  const configuredOverride = configuredOverrides.get(publicPath);
  if (configuredOverride) return configuredOverride;
  const alias = PUBLIC_ICON_SOURCE_ALIASES.get(publicPath);
  if (alias) {
    return {
      sourceNames: [alias.sourceName],
      preferredPathSegments: [alias.preferredPathSegment],
    };
  }
  const richText = richTextSources[publicPath];
  if (richText?.length) {
    return {
      sourceNames: richText.map(source => `${path.posix.basename(source)}.png`),
      preferredPathSegments: richText.map(source => `/${source}.png`),
    };
  }
  const stem = path.posix.basename(publicPath, '.webp');
  if (stem === 'default' || stem === 'default_icon' || publicPath === '/icons/global_config.webp') {
    return { sourceNames: [], preferredPathSegments: [], localOnly: true };
  }
  if (publicPath.startsWith('/weapons/')) {
    return {
      sourceNames: [`${reverseWeaponIdentity(stem)}.png`],
      preferredPathSegments: ['/itemicon/'],
    };
  }
  if (publicPath.startsWith('/equipment/')) {
    return { sourceNames: [`${stem}.png`], preferredPathSegments: ['/itemicon/'] };
  }
  if (publicPath.startsWith('/consumables/')) {
    return { sourceNames: [`${stem}.png`], preferredPathSegments: ['/itemicon/'] };
  }
  if (publicPath.startsWith('/enemies/')) {
    return { sourceNames: [`${stem}.png`], preferredPathSegments: ['/monstericon/'] };
  }
  if (publicPath.startsWith('/operators/')) {
    return {
      sourceNames: [`${stem}.png`],
      preferredPathSegments: [stem.startsWith('icon_skill_') ? '/skillicon/' : '/bufficon/'],
    };
  }
  return {
    sourceNames: [`${stem}.png`],
    preferredPathSegments: [stem.startsWith('icon_term_') ? '/termicon/' : '/bufficon/'],
  };
}

async function buildReferenceClosure(
  arguments_: ExportGameIconsArguments,
): Promise<readonly IconReference[]> {
  const references = await collectLiteralReferences(arguments_.additionalReferenceRoots);
  const configuredOverrides = await addOperatorImpliedReferences(
    references,
    arguments_.gameDataSourceRoot,
  );
  for (const [publicPath, source] of await addEquipmentConfiguredReferences(references)) {
    if (configuredOverrides.has(publicPath))
      throw new Error(`conflicting product icon source: ${publicPath}`);
    configuredOverrides.set(publicPath, source);
  }
  const richTextSources = await readRichTextSourceManifest();
  return [...references]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([publicPath, owners]) => ({
      publicPath,
      ...sourcePlanForReference(publicPath, richTextSources, configuredOverrides),
      referencedBy: [...owners].sort(),
    }));
}

async function queryCandidates(
  baseUrl: string,
  sourceNames: readonly string[],
): Promise<Candidate[]> {
  const candidates = new Map<number, Candidate>();
  for (const sourceName of [...new Set(sourceNames)]) {
    const url = new URL('/api/manifest-assets/by-name', baseUrl);
    url.searchParams.set('name', sourceName);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`);
    const document = (await response.json()) as { candidates: Candidate[] };
    for (const candidate of document.candidates) candidates.set(candidate.assetIndex, candidate);
  }
  return [...candidates.values()];
}

function selectCandidate(reference: IconReference, candidates: readonly Candidate[]): Candidate {
  if (candidates.length === 0) {
    throw new Error(
      `${reference.publicPath}: no Unity asset matches ${reference.sourceNames.join(', ')}`,
    );
  }
  for (const segment of reference.preferredPathSegments) {
    const matching = candidates.filter(candidate =>
      candidate.path.toLowerCase().includes(segment.toLowerCase()),
    );
    if (matching.length === 1) return matching[0]!;
  }
  if (candidates.length === 1) return candidates[0]!;
  throw new Error(
    `${reference.publicPath}: ambiguous Unity assets:\n${candidates.map(candidate => `  ${candidate.path}`).join('\n')}`,
  );
}

export async function exportReference(
  reference: IconReference,
  arguments_: ExportGameIconsArguments,
  snapshot?: AkedbSnapshot,
) {
  const relativePath = reference.publicPath.slice(1).replaceAll('/', path.sep);
  const outputPath = path.resolve(arguments_.outputRoot, relativePath);
  if (
    !reference.publicPath.startsWith('/') ||
    !outputPath.startsWith(path.resolve(arguments_.outputRoot) + path.sep)
  ) {
    throw new Error(`unsafe game icon output path: ${reference.publicPath}`);
  }
  if (reference.localOnly) {
    // 项目占位图不是游戏资源。隔离导出时从正式目录复制，不伪装成 VFS 重导结果。
    const localPath = path.resolve(PUBLIC_ROOT, relativePath);
    if (!(await exists(localPath)))
      throw new Error(`${reference.publicPath}: missing project fallback asset`);
    if (!arguments_.dryRun && localPath !== outputPath) {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await copyFile(localPath, outputPath);
    }
    return { publicPath: reference.publicPath, status: 'kept-local' };
  }
  if (!arguments_.overwrite && (await exists(outputPath))) {
    return { publicPath: reference.publicPath, status: 'skipped-existing' };
  }
  const cdn =
    arguments_.sourceMode === 'hybrid'
      ? (snapshot ?? (await AkedbSnapshot.load(arguments_.cdn)))
      : null;
  const names = new Set(reference.sourceNames.map(name => name.toLowerCase()));
  const cdnCandidates = cdn
    ? [...cdn.assets.images.keys()]
        .filter(p => names.has(path.posix.basename(p).toLowerCase()))
        .map((p, index) => ({ assetIndex: index, path: p, rawUrl: '' }))
    : [];
  let fallbackReason = cdn ? 'not-in-akedb-index' : undefined;
  if (cdn && cdnCandidates.length > 0) {
    const selected = selectCandidate(reference, cdnCandidates);
    if (arguments_.dryRun)
      return {
        publicPath: reference.publicPath,
        status: 'would-export',
        sourcePath: selected.path,
        provider: 'akedb',
        version: cdn.assets.images.get(selected.path)!.version,
      };
    try {
      const resource = await cdn.asset('images', selected.path);
      return await writeIcon(Buffer.from(resource.content), selected.path, {
        provider: resource.provider,
        source: resource.source,
        version: resource.version,
      });
    } catch (error) {
      if (!isMissingResource(error)) throw error;
      fallbackReason = 'akedb-http-404';
    }
  }
  const selected = selectCandidate(
    reference,
    await queryCandidates(arguments_.vfsBaseUrl, reference.sourceNames),
  );
  const identity = { provider: 'vfs-index-browser', version: null, fallbackReason };
  if (arguments_.dryRun) {
    return {
      publicPath: reference.publicPath,
      status: 'would-export',
      sourcePath: selected.path,
      ...identity,
    };
  }
  const sourceUrl = new URL(selected.rawUrl, arguments_.vfsBaseUrl);
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${sourceUrl}: ${response.status} ${await response.text()}`);
  const png = Buffer.from(await response.arrayBuffer());
  return await writeIcon(png, selected.path, { ...identity, source: sourceUrl.href });

  async function writeIcon(png: Buffer, sourcePath: string, identity: object) {
    const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, webp);
    return {
      publicPath: reference.publicPath,
      status: arguments_.overwrite ? 'overwritten' : 'exported-missing',
      sourcePath,
      ...identity,
      sourceBytes: png.length,
      outputBytes: webp.length,
      sourceSha256: createHash('sha256').update(png).digest('hex'),
      outputSha256: createHash('sha256').update(webp).digest('hex'),
    };
  }
}

async function pruneUnreferencedAssets(
  references: readonly IconReference[],
  dryRun: boolean,
  outputRoot: string,
): Promise<readonly string[]> {
  const retained = new Set(references.map(reference => reference.publicPath.toLowerCase()));
  const managedRoots = [
    'icons',
    'operators',
    'weapons',
    'equipment',
    'consumables',
    'enemies',
    'contingency_contract',
  ].map(name => path.join(outputRoot, name));
  const files = (await Promise.all(managedRoots.map(listFiles))).flat();
  const removed: string[] = [];
  for (const filePath of files) {
    if (path.extname(filePath).toLowerCase() !== '.webp') continue;
    const publicPath = `/${path.relative(outputRoot, filePath).split(path.sep).join('/')}`;
    if (retained.has(publicPath.toLowerCase())) continue;
    removed.push(publicPath);
    if (!dryRun) await unlink(filePath);
  }
  return removed.sort();
}

export async function exportReferencedGameIcons(arguments_: ExportGameIconsArguments): Promise<{
  readonly referencedCount: number;
  readonly exportedCount: number;
  readonly keptLocalCount: number;
  readonly skippedExistingCount: number;
  readonly auditOutput: string;
}> {
  await mkdir(TMP_ROOT, { recursive: true });
  await runRichTextExporter(arguments_.refreshRichText);
  const references = await buildReferenceClosure(arguments_);
  const snapshot =
    arguments_.sourceMode === 'hybrid' ? await AkedbSnapshot.load(arguments_.cdn) : undefined;
  const results: Array<Awaited<ReturnType<typeof exportReference>>> = [];
  const failures: Array<{ publicPath: string; error: string }> = [];
  // 复用来源下载的有界调度；各图校验独立，账本按资源路径排序而不是按请求完成顺序。
  await runConcurrent([...references.entries()], arguments_.workers, async ([index, reference]) => {
    try {
      const result = await exportReference(reference, arguments_, snapshot);
      results.push(result);
      console.log(`[${index + 1}/${references.length}] ${reference.publicPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ publicPath: reference.publicPath, error: message });
      console.error(`[${index + 1}/${references.length}] ${message}`);
    }
  });
  results.sort((left, right) => left.publicPath.localeCompare(right.publicPath));
  failures.sort((left, right) => left.publicPath.localeCompare(right.publicPath));
  let snapshotVerification: { status: 'passed' } | { status: 'failed'; error: string } = {
    status: 'passed',
  };
  try {
    await snapshot?.verifyUnchanged();
  } catch (error) {
    snapshotVerification = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
  const pruned =
    arguments_.prune && failures.length === 0
      ? await pruneUnreferencedAssets(references, arguments_.dryRun, arguments_.outputRoot)
      : [];
  const report = {
    mode: arguments_.overwrite ? 'overwrite' : 'missing-only',
    sourceMode: arguments_.sourceMode,
    akedb: snapshot
      ? { version: snapshot.version, assetRevision: snapshot.revision, evidence: snapshot.evidence }
      : null,
    dryRun: arguments_.dryRun,
    outputRoot: arguments_.outputRoot,
    referencedCount: references.length,
    results,
    failures,
    pruned,
    snapshotVerification,
  };
  const auditOutput = arguments_.auditOutput ?? REPORT_PATH;
  await mkdir(path.dirname(auditOutput), { recursive: true });
  await writeFile(auditOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Audit: ${auditOutput}`);
  if (failures.length > 0)
    throw new Error(`${failures.length} referenced icons could not be exported`);
  if (snapshotVerification.status === 'failed') throw new Error(snapshotVerification.error);
  return {
    referencedCount: references.length,
    exportedCount: results.filter(result => result.status.startsWith('exported-')).length,
    keptLocalCount: results.filter(result => result.status === 'kept-local').length,
    skippedExistingCount: results.filter(result => result.status === 'skipped-existing').length,
    auditOutput,
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  exportReferencedGameIcons(parseArguments(process.argv.slice(2))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
